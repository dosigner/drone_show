"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { fitPointCloud } from "../utils/imageToPoints";
import { createVectorFormations } from "../utils/vectorFormations";

const ACTIVE_COUNT = 780;
const BASE_COUNT = 360;
const MIN_CAMERA_DISTANCE = 46;
const MAX_CAMERA_DISTANCE = 100;
const STEPS = [
  { key: "takeoff", label: "직육면체 이륙", minDuration: 15000, maxDuration: 20000, settleThreshold: 1.45 },
  { key: "satellite", label: "오비탈 위성", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.95 },
  { key: "shield", label: "방패 엠블럼", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.92 },
  { key: "rocket", label: "로켓", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.92 },
  { key: "drone", label: "쿼드 드론", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.9 },
  { key: "hex", label: "헥사 코어", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.9 },
  { key: "add", label: "ADD 워드마크", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.88 },
  { key: "landing", label: "착륙", minDuration: 15000, maxDuration: 20000, settleThreshold: 1.2 },
];

function createGroundFormation(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const index = i * 3;

    positions[index] = (col - cols / 2) * 0.9;
    positions[index + 1] = -19.5 + (i % 4) * 0.015;
    positions[index + 2] = (row - rows / 2) * 0.6 - 6;

    colors[index] = 0.2;
    colors[index + 1] = 0.55;
    colors[index + 2] = 1.0;
  }

  return { positions, colors };
}

function createTakeoffFormation(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const side = Math.ceil(Math.cbrt(count));

  for (let i = 0; i < count; i += 1) {
    const gx = i % side;
    const gy = Math.floor(i / side) % side;
    const gz = Math.floor(i / (side * side));
    const index = i * 3;

    positions[index] = (gx - side / 2) * 1.15;
    positions[index + 1] = 2.5 + gy * 0.95;
    positions[index + 2] = (gz - side / 2) * 1.1;

    colors[index] = 0.5;
    colors[index + 1] = 0.85;
    colors[index + 2] = 1.4;
  }

  return { positions, colors };
}

function rotatePoint(x, y, z, camera) {
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const yawX = x * cosYaw - z * sinYaw;
  const yawZ = x * sinYaw + z * cosYaw;

  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);
  const pitchY = y * cosPitch - yawZ * sinPitch;
  const pitchZ = y * sinPitch + yawZ * cosPitch;

  return { x: yawX, y: pitchY, z: pitchZ };
}

function project(x, y, z, width, height, camera) {
  const rotated = rotatePoint(x, y, z, camera);
  const perspective = camera.distance / (camera.distance - rotated.z);

  return {
    x: width / 2 + rotated.x * 12 * perspective,
    y: height * 0.72 - rotated.y * 12 * perspective,
    scale: Math.max(0.25, perspective),
    depth: rotated.z,
  };
}

export default function DroneShowCanvas({ onStepChange }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);
  const formationsRef = useRef(null);
  const currentPositionsRef = useRef(new Float32Array(ACTIVE_COUNT * 3));
  const currentColorsRef = useRef(new Float32Array(ACTIVE_COUNT * 3));
  const targetPositionsRef = useRef(new Float32Array(ACTIVE_COUNT * 3));
  const targetColorsRef = useRef(new Float32Array(ACTIVE_COUNT * 3));
  const baseCloudRef = useRef(null);
  const stepIndexRef = useRef(-1);
  const startTimeRef = useRef(0);
  const stepStartTimeRef = useRef(0);
  const lastAdvanceTimeRef = useRef(0);
  const lastAverageErrorRef = useRef(Number.POSITIVE_INFINITY);
  const cameraRef = useRef({ yaw: -0.1, pitch: 0.4, distance: 72 });
  const interactionRef = useRef({ dragging: false, pointerId: null, x: 0, y: 0 });
  const motionSeeds = useMemo(
    () =>
      Array.from({ length: ACTIVE_COUNT }, (_, index) => ({
        phaseA: index * 0.11,
        phaseB: index * 0.07,
        phaseC: index * 0.05,
        pulse: index * 0.3,
      })),
    []
  );
  const baseSeeds = useMemo(
    () => Array.from({ length: BASE_COUNT }, (_, index) => index * 0.08),
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, index) => ({
        x: ((index * 53) % 1000) / 1000,
        y: ((index * 97) % 1000) / 1000,
        size: 0.6 + ((index * 17) % 7) * 0.18,
        alpha: 0.18 + ((index * 29) % 10) * 0.05,
      })),
    []
  );

  function advanceToStep(nextIndex) {
    if (!formationsRef.current || nextIndex < 0 || nextIndex >= STEPS.length) {
      return;
    }

    const step = STEPS[nextIndex];
    const formation = formationsRef.current[step.key];
    if (!formation) {
      return;
    }

    stepIndexRef.current = nextIndex;
    stepStartTimeRef.current = performance.now();
    lastAdvanceTimeRef.current = stepStartTimeRef.current;
    onStepChange?.(step.label);
    targetPositionsRef.current.set(formation.positions);
    targetColorsRef.current.set(formation.colors);
  }

  useEffect(() => {
    let mounted = true;

    async function prepareShow() {
      const vectorFormations = createVectorFormations();

      if (!mounted) {
        return;
      }

      const ground = createGroundFormation(ACTIVE_COUNT);
      const takeoff = createTakeoffFormation(ACTIVE_COUNT);

      formationsRef.current = {
        landing: ground,
        takeoff,
        satellite: fitPointCloud(vectorFormations.satellite, ACTIVE_COUNT, {
          offset: [0, 12, 0],
          depth: 2,
          tint: [0.7, 1.05, 1.35],
          glow: 1.45,
          spread: 0.07,
          edgeBias: 0.72,
        }),
        shield: fitPointCloud(vectorFormations.shield, ACTIVE_COUNT, {
          offset: [0, 11.2, 0],
          depth: 1.9,
          tint: [0.7, 1.2, 0.95],
          glow: 1.45,
          spread: 0.06,
          edgeBias: 0.7,
        }),
        rocket: fitPointCloud(vectorFormations.rocket, ACTIVE_COUNT, {
          offset: [0, 11.5, 0],
          depth: 2,
          tint: [1.1, 0.88, 0.62],
          glow: 1.5,
          spread: 0.07,
          edgeBias: 0.72,
        }),
        drone: fitPointCloud(vectorFormations.drone, ACTIVE_COUNT, {
          offset: [0, 11, 0],
          depth: 1.8,
          tint: [0.75, 0.95, 1.3],
          glow: 1.4,
          spread: 0.06,
          edgeBias: 0.7,
        }),
        hex: fitPointCloud(vectorFormations.hex, ACTIVE_COUNT, {
          offset: [0, 10.5, 0],
          depth: 1.6,
          tint: [1.15, 0.82, 1.4],
          glow: 1.35,
          spread: 0.06,
          edgeBias: 0.68,
        }),
        add: fitPointCloud(vectorFormations.add, ACTIVE_COUNT, {
          offset: [0, 12, 0],
          depth: 1.6,
          tint: [0.55, 0.95, 1.35],
          glow: 1.55,
          spread: 0.05,
          edgeBias: 0.74,
        }),
      };

      baseCloudRef.current = fitPointCloud(vectorFormations.base, BASE_COUNT, {
        offset: [0, -18, -7],
        depth: 0.8,
        tint: [0.65, 0.95, 1.2],
        glow: 1.1,
        spread: 0.03,
        edgeBias: 0.82,
      });

      currentPositionsRef.current.set(ground.positions);
      currentColorsRef.current.set(ground.colors);
      targetPositionsRef.current.set(ground.positions);
      targetColorsRef.current.set(ground.colors);

      startTimeRef.current = performance.now();
      advanceToStep(0);
    }

    prepareShow().catch(() => {
      onStepChange?.("이미지 로딩 실패");
    });

    return () => {
      mounted = false;
    };
  }, [onStepChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    function onPointerDown(event) {
      interactionRef.current.dragging = true;
      interactionRef.current.pointerId = event.pointerId;
      interactionRef.current.x = event.clientX;
      interactionRef.current.y = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
      if (!interactionRef.current.dragging || interactionRef.current.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - interactionRef.current.x;
      const dy = event.clientY - interactionRef.current.y;
      interactionRef.current.x = event.clientX;
      interactionRef.current.y = event.clientY;

      cameraRef.current.yaw += dx * 0.0065;
      cameraRef.current.pitch = Math.max(
        -0.7,
        Math.min(0.7, cameraRef.current.pitch + dy * 0.0045)
      );
    }

    function onPointerUp(event) {
      if (interactionRef.current.pointerId === event.pointerId) {
        interactionRef.current.dragging = false;
        interactionRef.current.pointerId = null;
      }
    }

    function onWheel(event) {
      event.preventDefault();
      cameraRef.current.distance = Math.max(
        MIN_CAMERA_DISTANCE,
        Math.min(MAX_CAMERA_DISTANCE, cameraRef.current.distance + event.deltaY * 0.03)
      );
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.2);
      const renderScale = window.innerWidth < 900 ? 0.85 : 0.92;
      canvas.width = window.innerWidth * dpr * renderScale;
      canvas.height = window.innerHeight * dpr * renderScale;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr * renderScale, 0, 0, dpr * renderScale, 0, 0);
    }

    function draw(now) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const elapsed = (now - startTimeRef.current) / 1000;
      const camera = cameraRef.current;

      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#020817");
      gradient.addColorStop(0.55, "#02060f");
      gradient.addColorStop(1, "#000000");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      stars.forEach((star, index) => {
        const twinkle = 0.65 + Math.sin(elapsed * 0.8 + index) * 0.35;
        context.fillStyle = `rgba(210, 235, 255, ${star.alpha * twinkle})`;
        context.beginPath();
        context.arc(star.x * width, star.y * height * 0.9, star.size, 0, Math.PI * 2);
        context.fill();
      });

      context.globalCompositeOperation = "screen";

      const currentPositions = currentPositionsRef.current;
      const currentColors = currentColorsRef.current;
      const targetPositions = targetPositionsRef.current;
      const targetColors = targetColorsRef.current;
      const activeQueue = [];
      const baseQueue = [];
      const positionAlpha = 0.022;
      const colorAlpha = 0.04;
      let sampledError = 0;
      let sampledCount = 0;

      const currentStepIndex = stepIndexRef.current;
      const currentStep = currentStepIndex >= 0 ? STEPS[currentStepIndex] : null;
      const isTransitioning =
        currentStep &&
        lastAverageErrorRef.current > currentStep.settleThreshold * 1.2 &&
        currentStep.key !== "takeoff";

      for (let i = 0; i < ACTIVE_COUNT; i += 1) {
        const index = i * 3;

        currentPositions[index] += (targetPositions[index] - currentPositions[index]) * positionAlpha;
        currentPositions[index + 1] += (targetPositions[index + 1] - currentPositions[index + 1]) * positionAlpha;
        currentPositions[index + 2] += (targetPositions[index + 2] - currentPositions[index + 2]) * positionAlpha;

        currentColors[index] += (targetColors[index] - currentColors[index]) * colorAlpha;
        currentColors[index + 1] += (targetColors[index + 1] - currentColors[index + 1]) * colorAlpha;
        currentColors[index + 2] += (targetColors[index + 2] - currentColors[index + 2]) * colorAlpha;

        if (i % 6 === 0) {
          const dx = targetPositions[index] - currentPositions[index];
          const dy = targetPositions[index + 1] - currentPositions[index + 1];
          const dz = targetPositions[index + 2] - currentPositions[index + 2];
          sampledError += Math.sqrt(dx * dx + dy * dy + dz * dz);
          sampledCount += 1;
        }

        const seed = motionSeeds[i];
        const floatX = Math.sin(elapsed * 0.9 + seed.phaseA) * 0.07;
        const floatY = Math.cos(elapsed * 1.05 + seed.phaseB) * 0.08;
        const floatZ = Math.sin(elapsed * 0.8 + seed.phaseC) * 0.18;
        const projected = project(
          currentPositions[index] + floatX,
          currentPositions[index + 1] + floatY,
          currentPositions[index + 2] + floatZ,
          width,
          height,
          camera
        );
        const pulse = 0.9 + (Math.sin(elapsed * 2.4 + seed.pulse) + 1) * 0.18;
        
        let r, g, b;

        if (isTransitioning) {
          const sparkle = Math.sin(elapsed * 20 + i * 132.1) > 0.5 ? 1 : 0;
          const hue = (i * 0.1 + elapsed * 0.5) % 1;
          r = sparkle * (Math.sin(hue * 6.28) * 127 + 128);
          g = sparkle * (Math.sin(hue * 6.28 + 2.09) * 127 + 128);
          b = sparkle * (Math.sin(hue * 6.28 + 4.18) * 127 + 128);
        } else {
          r = Math.min(255, currentColors[index] * 255 * pulse);
          g = Math.min(255, currentColors[index + 1] * 255 * pulse);
          b = Math.min(255, currentColors[index + 2] * 255 * pulse);
        }
        
        activeQueue.push({
          x: projected.x,
          y: projected.y,
          z: projected.depth,
          radius: projected.scale * 1.05,
          r,
          g,
          b,
          glow: 6 + projected.scale * 5,
        });
      }

      if (currentStepIndex >= 0 && currentStepIndex < STEPS.length - 1) {
        const step = STEPS[currentStepIndex];
        const averageError = sampledCount > 0 ? sampledError / sampledCount : Number.POSITIVE_INFINITY;
        lastAverageErrorRef.current = averageError;
        const elapsedInStep = now - stepStartTimeRef.current;
        const enoughTimePassed = elapsedInStep >= step.minDuration;
        const tooLong = elapsedInStep >= step.maxDuration;
        const settled = averageError <= step.settleThreshold;
        const debouncePassed = now - lastAdvanceTimeRef.current > 350;

        if (debouncePassed && (tooLong || (enoughTimePassed && settled))) {
          advanceToStep(currentStepIndex + 1);
        }
      }

      const baseCloud = baseCloudRef.current;
      if (baseCloud) {
        for (let i = 0; i < BASE_COUNT; i += 1) {
          const index = i * 3;
          const projected = project(
            baseCloud.positions[index],
            baseCloud.positions[index + 1] + Math.sin(elapsed + baseSeeds[i]) * 0.04,
            baseCloud.positions[index + 2],
            width,
            height,
            camera
          );

          baseQueue.push({
            x: projected.x,
            y: projected.y,
            z: projected.depth - 20,
            radius: projected.scale * 0.88,
            r: Math.min(255, baseCloud.colors[index] * 255),
            g: Math.min(255, baseCloud.colors[index + 1] * 255),
            b: Math.min(255, baseCloud.colors[index + 2] * 255),
            glow: 4 + projected.scale * 4,
          });
        }
      }

      const drawQueue = baseQueue.concat(activeQueue);
      drawQueue.sort((a, b) => b.z - a.z);

      context.globalCompositeOperation = "screen";

      for (let i = 0; i < drawQueue.length; i++) {
        const point = drawQueue[i];
        context.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b})`;
        // context.shadowColor = `rgba(${point.r}, ${point.g}, ${point.b}, 0.8)`;
        // context.shadowBlur = point.glow;
        
        // Draw glow
        context.globalAlpha = 0.3;
        context.beginPath();
        context.arc(point.x, point.y, point.radius * 2.5, 0, Math.PI * 2);
        context.fill();
        
        // Draw core
        context.globalAlpha = 1.0;
        context.beginPath();
        context.arc(point.x, point.y, point.radius * 0.6, 0, Math.PI * 2);
        context.fill();
      }

      // context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";
      animationRef.current = window.requestAnimationFrame(draw);
    }

    resize();
    animationRef.current = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [baseSeeds, motionSeeds, stars]);

  return <canvas ref={canvasRef} className="absolute inset-0 touch-none cursor-grab" />;
}
