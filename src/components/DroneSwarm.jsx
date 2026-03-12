"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fitPointCloud, imageToPoints } from "../utils/imageToPoints";

const FORMATION_KEYS = [
  { key: "takeoff", label: "직육면체 이륙", duration: 5200 },
  { key: "sar", label: "SAR 위성", duration: 4200 },
  { key: "k9", label: "K9 자주포", duration: 4200 },
  { key: "cheongung", label: "천궁2", duration: 4200 },
  { key: "changjo2", label: "창조관 형상 2", duration: 3800 },
  { key: "changjo3", label: "창조관 형상 3", duration: 3800 },
  { key: "logo", label: "ADD 로고", duration: 4200 },
  { key: "landing", label: "착륙", duration: 5200 },
];

function createGroundFormation(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  for (let i = 0; i < count; i += 1) {
    const x = (i % cols) - cols / 2;
    const z = Math.floor(i / cols) - rows / 2;
    const index = i * 3;

    positions[index] = x * 0.7;
    positions[index + 1] = -20 + ((i % 5) * 0.01);
    positions[index + 2] = z * 0.7;

    colors[index] = 0.2;
    colors[index + 1] = 0.45;
    colors[index + 2] = 0.9;
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

    positions[index] = (gx - side / 2) * 0.95;
    positions[index + 1] = 4 + gy * 0.85;
    positions[index + 2] = (gz - side / 2) * 0.95;

    colors[index] = 0.45;
    colors[index + 1] = 0.8;
    colors[index + 2] = 1.35;
  }

  return { positions, colors };
}

export function DroneSwarm({ droneCount = 1800, onStepChange }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const [formations, setFormations] = useState(null);
  const [stepIndex, setStepIndex] = useState(-1);

  const currentPositions = useRef(new Float32Array(droneCount * 3));
  const currentColors = useRef(new Float32Array(droneCount * 3));
  const targetPositions = useRef(new Float32Array(droneCount * 3));
  const targetColors = useRef(new Float32Array(droneCount * 3));

  const hoverSeeds = useMemo(
    () =>
      Array.from({ length: droneCount }, (_, index) => ({
        phase: index * 0.173,
        speed: 0.8 + (index % 7) * 0.09,
        amplitude: 0.03 + (index % 5) * 0.015,
      })),
    [droneCount]
  );

  useEffect(() => {
    let mounted = true;

    async function loadFormations() {
      onStepChange?.("이미지 로딩");

      const [sar, k9, cheongung, changjo2, changjo3, logo] = await Promise.all([
        imageToPoints({ url: "/SAR위성.png", scale: 0.13, threshold: 18 }),
        imageToPoints({ url: "/K9자주포.png", scale: 0.13, threshold: 18 }),
        imageToPoints({ url: "/천궁2.png", scale: 0.13, threshold: 18 }),
        imageToPoints({ url: "/창조관 형상2.png", scale: 0.13, threshold: 18 }),
        imageToPoints({ url: "/창조관 형상3.png", scale: 0.13, threshold: 18 }),
        imageToPoints({ url: "/ADD로고.png", scale: 0.13, threshold: 18 }),
      ]);

      if (!mounted) {
        return;
      }

      const ground = createGroundFormation(droneCount);
      const takeoff = createTakeoffFormation(droneCount);

      const loadedFormations = {
        ground,
        landing: ground,
        takeoff,
        sar: fitPointCloud(sar, droneCount, {
          offset: [0, 12, 0],
          depth: 1.8,
          tint: [0.55, 1.05, 1.3],
          glow: 1.45,
        }),
        k9: fitPointCloud(k9, droneCount, {
          offset: [0, 11, 0],
          depth: 1.8,
          tint: [0.9, 1.15, 0.55],
          glow: 1.4,
        }),
        cheongung: fitPointCloud(cheongung, droneCount, {
          offset: [0, 12, 0],
          depth: 1.9,
          tint: [0.85, 0.75, 1.45],
          glow: 1.5,
        }),
        changjo2: fitPointCloud(changjo2, droneCount, {
          offset: [0, 10.5, 0],
          depth: 1.2,
          tint: [1.25, 0.7, 1.15],
          glow: 1.35,
        }),
        changjo3: fitPointCloud(changjo3, droneCount, {
          offset: [0, 10.5, 0],
          depth: 1.2,
          tint: [1.2, 0.95, 0.55],
          glow: 1.35,
        }),
        logo: fitPointCloud(logo, droneCount, {
          offset: [0, 12, 0],
          depth: 1.6,
          tint: [0.55, 0.95, 1.35],
          glow: 1.55,
        }),
      };

      currentPositions.current.set(loadedFormations.ground.positions);
      currentColors.current.set(loadedFormations.ground.colors);
      targetPositions.current.set(loadedFormations.ground.positions);
      targetColors.current.set(loadedFormations.ground.colors);
      setFormations(loadedFormations);
      setStepIndex(0);
    }

    loadFormations().catch(() => {
      if (mounted) {
        setFormations(null);
      }
    });

    return () => {
      mounted = false;
    };
  }, [droneCount, onStepChange]);

  useEffect(() => {
    if (!formations || stepIndex < 0 || stepIndex >= FORMATION_KEYS.length) {
      return undefined;
    }

    const step = FORMATION_KEYS[stepIndex];
    const formation = formations[step.key];

    if (!formation) {
      return undefined;
    }

    targetPositions.current.set(formation.positions);
    targetColors.current.set(formation.colors);
    onStepChange?.(step.label);

    if (stepIndex === FORMATION_KEYS.length - 1) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setStepIndex((current) => current + 1);
    }, step.duration);

    return () => window.clearTimeout(timeout);
  }, [formations, onStepChange, stepIndex]);

  useFrame((state, delta) => {
    if (!meshRef.current || !formations) {
      return;
    }

    const positionLerp = 1 - Math.exp(-delta * 1.75);
    const colorLerp = 1 - Math.exp(-delta * 2.2);
    const time = state.clock.elapsedTime;

    for (let i = 0; i < droneCount; i += 1) {
      const index = i * 3;

      currentPositions.current[index] = THREE.MathUtils.lerp(
        currentPositions.current[index],
        targetPositions.current[index],
        positionLerp
      );
      currentPositions.current[index + 1] = THREE.MathUtils.lerp(
        currentPositions.current[index + 1],
        targetPositions.current[index + 1],
        positionLerp
      );
      currentPositions.current[index + 2] = THREE.MathUtils.lerp(
        currentPositions.current[index + 2],
        targetPositions.current[index + 2],
        positionLerp
      );

      currentColors.current[index] = THREE.MathUtils.lerp(
        currentColors.current[index],
        targetColors.current[index],
        colorLerp
      );
      currentColors.current[index + 1] = THREE.MathUtils.lerp(
        currentColors.current[index + 1],
        targetColors.current[index + 1],
        colorLerp
      );
      currentColors.current[index + 2] = THREE.MathUtils.lerp(
        currentColors.current[index + 2],
        targetColors.current[index + 2],
        colorLerp
      );

      const hover = hoverSeeds[i];
      const pulse = 1 + Math.sin(time * (1.8 + hover.speed * 0.15) + hover.phase) * 0.12;

      dummy.position.set(
        currentPositions.current[index] + Math.sin(time * hover.speed + hover.phase) * hover.amplitude,
        currentPositions.current[index + 1] +
          Math.cos(time * (hover.speed * 1.15) + hover.phase) * hover.amplitude,
        currentPositions.current[index + 2] + Math.sin(time * (hover.speed * 0.9) - hover.phase) * hover.amplitude
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      tempColor.setRGB(
        currentColors.current[index] * pulse,
        currentColors.current[index + 1] * pulse,
        currentColors.current[index + 2] * pulse
      );
      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, droneCount]} frustumCulled={false}>
      <sphereGeometry args={[0.14, 10, 10]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.98} />
    </instancedMesh>
  );
}
