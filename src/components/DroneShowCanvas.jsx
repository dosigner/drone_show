"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { fitPointCloud } from "../utils/imageToPoints";

const ACTIVE_COUNT = 1400;
const BASE_COUNT = 520;
const MIN_CAMERA_DISTANCE = 36;
const MAX_CAMERA_DISTANCE = 110;
const MIN_YAW = -1.48;
const MAX_YAW = 1.48;
const MIN_PITCH = 0.1;
const MAX_PITCH = 1.18;
const PLY_OBJECT_CONFIG = {
  tank: {
    url: "/formations/generated/object-0.json",
    rotateX: -100, // 수평축
    rotateY: -60, // 수직축
    rotateZ: 0, //모니터로 나오는 축
    scale: 0.5,
    translate: [0, 0, -10],
  },
  truck: {
    url: "/formations/generated/truck.json",
    rotateX: -90,
    rotateY: 120,
    rotateZ: 0,
    scale: 0.8,
    translate: [0, 0, -30],
  },
  missile: {
    url: "/formations/generated/missile.json",
    rotateX: -90,
    rotateY: 0,
    rotateZ: 0,
    scale: 0.2,
    translate: [9, 18, -25],
  },
  cuav: {
    url: "/formations/generated/cuav.json",
    rotateX: -90,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    translate: [0, 0, 0],
  },
  sar: {
    url: "/formations/generated/sar-ply.json",
    rotateX: -90,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    translate: [0, 0, 0],
  },
  kddx: {
    url: "/formations/generated/kddx.json",
    rotateX: -90,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    translate: [0, 0, 0],
  },
  kf21: {
    url: "/formations/generated/kf21.json",
    rotateX: -90,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    translate: [0, 0, 0],
  },
  k2: {
    url: "/formations/generated/k2.json",
    rotateX: -90,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    translate: [0, 0, 0],
  },
};
const TANK_COLOR_CONFIG = {
  splitRatio: 1 / 3,
  upperBrightnessRange: [0.9, 1.08],
  lowerBrightnessRange: [0.95, 1.03],
  upperRanges: [
    { min: [0.2, 0.34, 0.16], max: [0.34, 0.5, 0.26] },
    { min: [0.46, 0.62, 0.24], max: [0.64, 0.8, 0.42] },
    { min: [0.34, 0.24, 0.14], max: [0.56, 0.42, 0.26] },
  ],
  lowerRanges: [
    { min: [0.94, 0.94, 0.92], max: [1.0, 1.0, 0.98] },
    { min: [0.88, 0.89, 0.86], max: [0.95, 0.96, 0.93] },
    { min: [0.82, 0.84, 0.82], max: [0.9, 0.92, 0.89] },
  ],
};
const TRUCK_COLOR_CONFIG = {
  splitRatio: 0.26,
  upperBrightnessRange: [0.9, 1.05],
  lowerBrightnessRange: [0.96, 1.04],
  upperRanges: [
    { min: [0.68, 0.56, 0.34], max: [0.82, 0.7, 0.46] },
    { min: [0.76, 0.66, 0.46], max: [0.9, 0.8, 0.58] },
    { min: [0.62, 0.5, 0.3], max: [0.76, 0.62, 0.4] },
  ],
  lowerRanges: [
    { min: [0.94, 0.94, 0.94], max: [1.0, 1.0, 1.0] },
    { min: [0.86, 0.87, 0.88], max: [0.94, 0.95, 0.96] },
    { min: [0.78, 0.8, 0.82], max: [0.88, 0.9, 0.92] },
  ],
};
const MISSILE_COLOR_CONFIG = {
  splitRatio: 0,
  upperBrightnessRange: [0.94, 1.08],
  lowerBrightnessRange: [0.94, 1.08],
  upperRanges: [
    { min: [0.72, 0.12, 0.1], max: [0.9, 0.24, 0.2] },
    { min: [0.8, 0.18, 0.16], max: [0.98, 0.32, 0.28] },
    { min: [0.62, 0.08, 0.08], max: [0.82, 0.18, 0.18] },
  ],
  lowerRanges: [
    { min: [0.72, 0.12, 0.1], max: [0.9, 0.24, 0.2] },
    { min: [0.8, 0.18, 0.16], max: [0.98, 0.32, 0.28] },
    { min: [0.62, 0.08, 0.08], max: [0.82, 0.18, 0.18] },
  ],
};
const CUAV_COLOR_CONFIG = {
  splitRatio: 0.42,
  upperBrightnessRange: [0.96, 1.08],
  lowerBrightnessRange: [0.92, 1.02],
  upperRanges: [
    { min: [0.7, 0.86, 0.96], max: [0.84, 0.95, 1.0] },
    { min: [0.58, 0.78, 0.94], max: [0.74, 0.9, 1.0] },
    { min: [0.82, 0.92, 0.98], max: [0.94, 1.0, 1.0] },
  ],
  lowerRanges: [
    { min: [0.42, 0.62, 0.82], max: [0.58, 0.78, 0.94] },
    { min: [0.5, 0.7, 0.9], max: [0.66, 0.84, 1.0] },
    { min: [0.72, 0.86, 0.98], max: [0.84, 0.94, 1.0] },
  ],
};
const TRUCK_MISSILE_SCENE_CONFIG = {
  truckCount: 1080,
  missileCount: 320,
};
const STEPS = [
  { key: "takeoff", label: "직육면체 이륙", minDuration: 15000, maxDuration: 20000, settleThreshold: 1.45 },
  { key: "tank", label: "전차", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.9 },
  { key: "truckMissile", label: "트럭 + 미사일", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.9 },
  { key: "satellite", label: "CUAV", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.95 },
  { key: "kf21", label: "KF-21", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.92 },
  { key: "k2", label: "K2 전차", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.92 },
  { key: "sar", label: "SAR 위성", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.94 },
  { key: "shield", label: "KDDX", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.92 },
  { key: "addText", label: "국방과학연구소", minDuration: 18000, maxDuration: 25000, settleThreshold: 0.88 },
  { key: "landing", label: "착륙", minDuration: 15000, maxDuration: 20000, settleThreshold: 1.2 },
];

async function createLogoTextFormation(text, logoUrl) {
  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d");
  const fontSize = 64;
  const padding = 40;
  
  const logoImage = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load logo: ${logoUrl}`));
    img.src = logoUrl;
  });

  ctx.font = `bold ${fontSize}px sans-serif`;
  const textMetrics = ctx.measureText(text);
  const textWidth = Math.ceil(textMetrics.width);
  const textHeight = Math.ceil(fontSize * 1.5);

  const logoSize = 180;
  const gap = 50; 
  const canvasWidth = Math.max(textWidth * 1.2, logoSize * 0.5) + padding * 2;
  const canvasHeight = logoSize * 0.5 + gap + textHeight * 1.2 + padding * 2;

  offscreen.width = canvasWidth;
  offscreen.height = canvasHeight;

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw Logo (0.5 scale)
  const logoDrawSize = logoSize * 0.5;
  const logoX = (canvasWidth - logoDrawSize) / 2;
  const logoY = padding;
  ctx.drawImage(logoImage, logoX, logoY, logoDrawSize, logoDrawSize);

  // Draw Text (1.2 scale)
  ctx.save();
  const textX = (canvasWidth - textWidth * 1.2) / 2;
  const textY = logoY + logoDrawSize + gap;
  ctx.translate(textX, textY);
  ctx.scale(1.2, 1.2);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixels = imageData.data;
  const validPixels = [];

  for (let y = 0; y < canvasHeight; y += 2) {
    for (let x = 0; x < canvasWidth; x += 2) {
      const idx = (y * canvasWidth + x) * 4;
      const alpha = pixels[idx + 3];
      if (alpha > 128) {
        const nx = x - canvasWidth / 2;
        const ny = -(y - canvasHeight / 2);
        
        // Identify if it's logo or text for animation
        const isLogo = y < (logoY + logoDrawSize + gap / 2);

        validPixels.push({
          x: nx * 0.15, // Adjusted global scale for better view
          y: ny * 0.15,
          r: pixels[idx] / 255,
          g: pixels[idx + 1] / 255,
          b: pixels[idx + 2] / 255,
          isLogo
        });
      }
    }
  }

  const count = validPixels.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const types = new Int8Array(count); // 1 for logo, 0 for text

  for (let i = 0; i < count; i++) {
    const p = validPixels[i];
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = 0;
    
    colors[i * 3] = p.r;
    colors[i * 3 + 1] = p.g;
    colors[i * 3 + 2] = p.b;
    types[i] = p.isLogo ? 1 : 0;
  }

  return { positions, colors, types, edgeIndices: [] };
}

function createGroundFormation(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cols = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const index = i * 3;
    positions[index] = (col - cols / 2) * 0.9;
    positions[index + 1] = -2 + (i % 4) * 0.015;
    positions[index + 2] = (row - Math.ceil(count / cols) / 2) * 0.6 - 6;
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
    positions[index + 1] = 30 + gy * 0.95;
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
    y: height * 0.92 - rotated.y * 12 * perspective,
    scale: Math.max(0.25, perspective),
    depth: rotated.z,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampCamera(camera) {
  camera.yaw = clamp(camera.yaw, MIN_YAW, MAX_YAW);
  camera.pitch = clamp(camera.pitch, MIN_PITCH, MAX_PITCH);
  camera.distance = clamp(camera.distance, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE);
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function clonePointCloud(pointCloud) {
  return {
    positions: new Float32Array(pointCloud.positions),
    colors: pointCloud.colors,
    edgeIndices: pointCloud.edgeIndices,
  };
}

function rotatePointCloudY(pointCloud, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const positions = new Float32Array(pointCloud.positions.length);

  for (let i = 0; i < pointCloud.positions.length; i += 3) {
    const x = pointCloud.positions[i];
    const y = pointCloud.positions[i + 1];
    const z = pointCloud.positions[i + 2] ?? 0;

    positions[i] = x * cos - z * sin;
    positions[i + 1] = y;
    positions[i + 2] = x * sin + z * cos;
  }

  return {
    positions,
    colors: pointCloud.colors,
    edgeIndices: pointCloud.edgeIndices,
  };
}

function rotatePointCloudZ(pointCloud, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const positions = new Float32Array(pointCloud.positions.length);

  for (let i = 0; i < pointCloud.positions.length; i += 3) {
    const x = pointCloud.positions[i];
    const y = pointCloud.positions[i + 1];
    const z = pointCloud.positions[i + 2] ?? 0;

    positions[i] = x * cos - y * sin;
    positions[i + 1] = x * sin + y * cos;
    positions[i + 2] = z;
  }

  return {
    positions,
    colors: pointCloud.colors,
    edgeIndices: pointCloud.edgeIndices,
  };
}

function rotatePointCloudX(pointCloud, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const positions = new Float32Array(pointCloud.positions.length);

  for (let i = 0; i < pointCloud.positions.length; i += 3) {
    const x = pointCloud.positions[i];
    const y = pointCloud.positions[i + 1];
    const z = pointCloud.positions[i + 2] ?? 0;

    positions[i] = x;
    positions[i + 1] = y * cos - z * sin;
    positions[i + 2] = y * sin + z * cos;
  }

  return {
    positions,
    colors: pointCloud.colors,
    edgeIndices: pointCloud.edgeIndices,
  };
}

function scalePointCloud(pointCloud, scale) {
  const positions = new Float32Array(pointCloud.positions.length);

  for (let i = 0; i < pointCloud.positions.length; i += 3) {
    positions[i] = pointCloud.positions[i] * scale;
    positions[i + 1] = pointCloud.positions[i + 1] * scale;
    positions[i + 2] = (pointCloud.positions[i + 2] ?? 0) * scale;
  }

  return {
    positions,
    colors: pointCloud.colors,
    edgeIndices: pointCloud.edgeIndices,
  };
}

function translatePointCloud(pointCloud, offset) {
  const positions = new Float32Array(pointCloud.positions.length);

  for (let i = 0; i < pointCloud.positions.length; i += 3) {
    positions[i] = pointCloud.positions[i] + offset[0];
    positions[i + 1] = pointCloud.positions[i + 1] + offset[1];
    positions[i + 2] = (pointCloud.positions[i + 2] ?? 0) + offset[2];
  }

  return {
    positions,
    colors: pointCloud.colors,
    edgeIndices: pointCloud.edgeIndices,
  };
}

function mergePointClouds(pointClouds) {
  const totalPoints = pointClouds.reduce((sum, pointCloud) => sum + pointCloud.positions.length / 3, 0);
  const positions = new Float32Array(totalPoints * 3);
  const colors = new Float32Array(totalPoints * 3);
  const edgeIndices = [];
  let pointOffset = 0;

  for (const pointCloud of pointClouds) {
    positions.set(pointCloud.positions, pointOffset * 3);
    colors.set(pointCloud.colors, pointOffset * 3);

    if (pointCloud.edgeIndices?.length) {
      for (const edgeIndex of pointCloud.edgeIndices) {
        edgeIndices.push(edgeIndex + pointOffset);
      }
    }

    pointOffset += pointCloud.positions.length / 3;
  }

  return { positions, colors, edgeIndices };
}

function seededNoise(seed) {
  const value = Math.sin(seed) * 43758.5453123;
  return value - Math.floor(value);
}

function sampleColorRange(range, seedA, seedB, seedC, brightnessRange) {
  const brightness =
    brightnessRange[0] + (brightnessRange[1] - brightnessRange[0]) * seededNoise(seedA * 1.37 + seedB * 0.73);

  return [
    Math.min(1, (range.min[0] + (range.max[0] - range.min[0]) * seededNoise(seedA)) * brightness),
    Math.min(1, (range.min[1] + (range.max[1] - range.min[1]) * seededNoise(seedB)) * brightness),
    Math.min(1, (range.min[2] + (range.max[2] - range.min[2]) * seededNoise(seedC)) * brightness),
  ];
}

function recolorPointCloudByHeight(pointCloud, colorConfig) {
  const colors = new Float32Array(pointCloud.colors.length);
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 1; i < pointCloud.positions.length; i += 3) {
    const y = pointCloud.positions[i];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const rangeY = Math.max(0.001, maxY - minY);

  for (let i = 0; i < pointCloud.positions.length; i += 3) {
    const x = pointCloud.positions[i];
    const y = pointCloud.positions[i + 1];
    const z = pointCloud.positions[i + 2] ?? 0;
    const normalizedY = (y - minY) / rangeY;
    const isUpper = normalizedY >= colorConfig.splitRatio;
    const palette = isUpper ? colorConfig.upperRanges : colorConfig.lowerRanges;
    const brightnessRange = isUpper ? colorConfig.upperBrightnessRange : colorConfig.lowerBrightnessRange;
    const baseSeed = x * 12.9898 + y * 78.233 + z * 37.719 + i * 0.01;
    const paletteIndex = Math.floor(seededNoise(baseSeed + 4.27) * palette.length) % palette.length;
    const sampled = sampleColorRange(
      palette[paletteIndex],
      baseSeed + 0.17,
      baseSeed + 1.91,
      baseSeed + 2.83,
      brightnessRange
    );

    colors[i] = sampled[0];
    colors[i + 1] = sampled[1];
    colors[i + 2] = sampled[2];
  }

  return {
    positions: pointCloud.positions,
    colors,
    edgeIndices: pointCloud.edgeIndices,
  };
}

function applyPointCloudTransform(pointCloud, config) {
  let transformed = clonePointCloud(pointCloud);

  if (config.scale !== 1) {
    transformed = scalePointCloud(transformed, config.scale);
  }
  if (config.rotateX) {
    transformed = rotatePointCloudX(transformed, degreesToRadians(config.rotateX));
  }
  if (config.rotateY) {
    transformed = rotatePointCloudY(transformed, degreesToRadians(config.rotateY));
  }
  if (config.rotateZ) {
    transformed = rotatePointCloudZ(transformed, degreesToRadians(config.rotateZ));
  }
  if (config.translate?.some((value) => value !== 0)) {
    transformed = translatePointCloud(transformed, config.translate);
  }

  return transformed;
}

async function loadPointCloudJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load point cloud: ${url}`);
  }

  const pointCloud = await response.json();
  return {
    positions: Float32Array.from(pointCloud.positions ?? []),
    colors: Float32Array.from(pointCloud.colors ?? []),
    edgeIndices: pointCloud.edgeIndices ?? [],
  };
}

export default function DroneShowCanvas({ onStepChange }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);
  const formationsRef = useRef(null);
  const sceneMetaRef = useRef({});
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
  const cameraRef = useRef({ yaw: 0, pitch: 0.6, distance: 65 });
  const transitionEffectRef = useRef(0);
  const interactionRef = useRef({
    dragging: false,
    pointerId: null,
    x: 0,
    y: 0,
    touches: [],
    lastPinchDist: 0,
  });

  const motionSeeds = useMemo(
    () =>
      Array.from({ length: ACTIVE_COUNT }, (_, i) => ({
        phaseA: i * 0.11,
        phaseB: i * 0.07,
        phaseC: i * 0.05,
        pulse: i * 0.3,
        blinkSeed: ((i * 16807) % 2147483647) / 2147483647,
      })),
    []
  );
  const baseSeeds = useMemo(
    () => Array.from({ length: BASE_COUNT }, (_, i) => i * 0.08),
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        x: ((i * 53) % 1000) / 1000,
        y: ((i * 97) % 1000) / 1000,
        size: 0.6 + ((i * 17) % 7) * 0.18,
        alpha: 0.18 + ((i * 29) % 10) * 0.05,
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
    lastAverageErrorRef.current = Number.POSITIVE_INFINITY;
    transitionEffectRef.current = Math.floor(Math.random() * 4);
    onStepChange?.(step.label);
    targetPositionsRef.current.set(formation.positions);
    targetColorsRef.current.set(formation.colors);
  }

  function jumpToStep(nextIndex) {
    if (!formationsRef.current || nextIndex < 0 || nextIndex >= STEPS.length) {
      return;
    }

    const step = STEPS[nextIndex];
    const formation = formationsRef.current[step.key];
    if (!formation) {
      return;
    }

    const now = performance.now();
    stepIndexRef.current = nextIndex;
    stepStartTimeRef.current = now;
    lastAdvanceTimeRef.current = now;
    lastAverageErrorRef.current = 0;
    currentPositionsRef.current.set(formation.positions);
    currentColorsRef.current.set(formation.colors);
    targetPositionsRef.current.set(formation.positions);
    targetColorsRef.current.set(formation.colors);
    onStepChange?.(step.label);
  }

  useEffect(() => {
    let mounted = true;
    async function prepareShow() {
      const [tankRaw, truckRaw, missileRaw, cuavRaw, sarRaw, kddxRaw, kf21Raw, k2Raw] = await Promise.all([
        loadPointCloudJson(PLY_OBJECT_CONFIG.tank.url),
        loadPointCloudJson(PLY_OBJECT_CONFIG.truck.url),
        loadPointCloudJson(PLY_OBJECT_CONFIG.missile.url),
        loadPointCloudJson(PLY_OBJECT_CONFIG.cuav.url),
        loadPointCloudJson(PLY_OBJECT_CONFIG.sar.url),
        loadPointCloudJson(PLY_OBJECT_CONFIG.kddx.url),
        loadPointCloudJson(PLY_OBJECT_CONFIG.kf21.url),
        loadPointCloudJson(PLY_OBJECT_CONFIG.k2.url),
      ]);
      if (!mounted) return;

      const tankPointCloud = applyPointCloudTransform(tankRaw, PLY_OBJECT_CONFIG.tank);
      const truckPointCloud = applyPointCloudTransform(truckRaw, PLY_OBJECT_CONFIG.truck);
      const missilePointCloud = applyPointCloudTransform(missileRaw, PLY_OBJECT_CONFIG.missile);
      const cuavPointCloud = applyPointCloudTransform(cuavRaw, PLY_OBJECT_CONFIG.cuav);
      const sarPointCloud = applyPointCloudTransform(sarRaw, PLY_OBJECT_CONFIG.sar);
      const kddxPointCloud = applyPointCloudTransform(kddxRaw, PLY_OBJECT_CONFIG.kddx);
      const kf21PointCloud = applyPointCloudTransform(kf21Raw, PLY_OBJECT_CONFIG.kf21);
      const k2PointCloud = applyPointCloudTransform(k2Raw, PLY_OBJECT_CONFIG.k2);
      const ground = createGroundFormation(ACTIVE_COUNT);
      const takeoff = createTakeoffFormation(ACTIVE_COUNT);
      const truckSceneCloud = fitPointCloud(truckPointCloud, TRUCK_MISSILE_SCENE_CONFIG.truckCount, {
        offset: [0, 42, 0],
        depth: 0.75,
        tint: [1, 1, 1],
        glow: 1.1,
        spread: 0.028,
        edgeBias: 0.62,
        useSourceDepth: true,
        sourceDepthScale: 1.1,
      });
      const missileSceneCloud = fitPointCloud(missilePointCloud, TRUCK_MISSILE_SCENE_CONFIG.missileCount, {
        offset: [0, 42, 0],
        depth: 0.55,
        tint: [1, 1, 1],
        glow: 1.2,
        spread: 0.02,
        edgeBias: 0.58,
        useSourceDepth: true,
        sourceDepthScale: 1.08,
      });
      const truckMissileCloud = mergePointClouds([truckSceneCloud, missileSceneCloud]);

      let missileMinY = Infinity, missileMaxY = -Infinity;
      let missileMinX = Infinity, missileMaxX = -Infinity;
      for (let i = 0; i < missileSceneCloud.positions.length; i += 3) {
        const mx = missileSceneCloud.positions[i];
        const my = missileSceneCloud.positions[i + 1];
        if (mx < missileMinX) missileMinX = mx;
        if (mx > missileMaxX) missileMaxX = mx;
        if (my < missileMinY) missileMinY = my;
        if (my > missileMaxY) missileMaxY = my;
      }
      let truckMinX = Infinity, truckMaxX = -Infinity;
      let truckMinY = Infinity, truckMaxY = -Infinity;
      for (let i = 0; i < truckSceneCloud.positions.length; i += 3) {
        const tx = truckSceneCloud.positions[i];
        const ty = truckSceneCloud.positions[i + 1];
        if (tx < truckMinX) truckMinX = tx;
        if (tx > truckMaxX) truckMaxX = tx;
        if (ty < truckMinY) truckMinY = ty;
        if (ty > truckMaxY) truckMaxY = ty;
      }

      const cuavSceneCloud = fitPointCloud(cuavPointCloud, ACTIVE_COUNT, {
        offset: [0, 42, 0], depth: 0.9, tint: [1, 1, 1], glow: 1.15, spread: 0.035, edgeBias: 0.58, useSourceDepth: true, sourceDepthScale: 1.05,
      });
      let cuavMinX = Infinity;
      let cuavMaxX = -Infinity;
      let cuavMinY = Infinity;
      let cuavMaxY = -Infinity;
      for (let i = 0; i < cuavSceneCloud.positions.length; i += 3) {
        const x = cuavSceneCloud.positions[i];
        const y = cuavSceneCloud.positions[i + 1];
        if (x < cuavMinX) cuavMinX = x;
        if (x > cuavMaxX) cuavMaxX = x;
        if (y < cuavMinY) cuavMinY = y;
        if (y > cuavMaxY) cuavMaxY = y;
      }

      const sarSceneCloud = fitPointCloud(sarPointCloud, ACTIVE_COUNT, {
        offset: [0, 42, 0], depth: 0.95, tint: [0.78, 0.96, 1.12], glow: 1.5, spread: 0.032, edgeBias: 0.6, useSourceDepth: true, sourceDepthScale: 1.06,
      });
      let sarMinX = Infinity, sarMaxX = -Infinity;
      let sarMinY = Infinity, sarMaxY = -Infinity;
      let sarMinZ = Infinity, sarMaxZ = -Infinity;
      for (let i = 0; i < sarSceneCloud.positions.length; i += 3) {
        const sx = sarSceneCloud.positions[i];
        const sy = sarSceneCloud.positions[i + 1];
        const sz = sarSceneCloud.positions[i + 2];
        if (sx < sarMinX) sarMinX = sx;
        if (sx > sarMaxX) sarMaxX = sx;
        if (sy < sarMinY) sarMinY = sy;
        if (sy > sarMaxY) sarMaxY = sy;
        if (sz < sarMinZ) sarMinZ = sz;
        if (sz > sarMaxZ) sarMaxZ = sz;
      }

      const kddxSceneCloud = fitPointCloud(kddxPointCloud, ACTIVE_COUNT, {
        offset: [0, 40, 0], depth: 0.9, tint: [0.82, 0.96, 1.08], glow: 1.45, spread: 0.035, edgeBias: 0.58, useSourceDepth: true, sourceDepthScale: 1.05,
      });
      let kddxMinX = Infinity, kddxMaxX = -Infinity;
      let kddxMinY = Infinity, kddxMaxY = -Infinity;
      for (let i = 0; i < kddxSceneCloud.positions.length; i += 3) {
        const kx = kddxSceneCloud.positions[i];
        const ky = kddxSceneCloud.positions[i + 1];
        if (kx < kddxMinX) kddxMinX = kx;
        if (kx > kddxMaxX) kddxMaxX = kx;
        if (ky < kddxMinY) kddxMinY = ky;
        if (ky > kddxMaxY) kddxMaxY = ky;
      }

      const tankSceneCloud = fitPointCloud(tankPointCloud, ACTIVE_COUNT, {
        offset: [0, 42, 0], depth: 0.7, tint: [1, 1, 1], glow: 1.45, spread: 0.035, edgeBias: 0.55, useSourceDepth: true, sourceDepthScale: 1.05,
      });
      let tankMinX = Infinity, tankMaxX = -Infinity;
      let tankMinY = Infinity, tankMaxY = -Infinity;
      for (let i = 0; i < tankSceneCloud.positions.length; i += 3) {
        const tkx = tankSceneCloud.positions[i];
        const tky = tankSceneCloud.positions[i + 1];
        if (tkx < tankMinX) tankMinX = tkx;
        if (tkx > tankMaxX) tankMaxX = tkx;
        if (tky < tankMinY) tankMinY = tky;
        if (tky > tankMaxY) tankMaxY = tky;
      }

      const addTextCloud = await createLogoTextFormation("국방과학연구소", "/formations/logo.svg");
      const addTextSceneCloud = fitPointCloud(addTextCloud, ACTIVE_COUNT, {
        offset: [0, 42, 0], depth: 0.3, tint: [1, 1, 1], glow: 1.6, spread: 0.015, edgeBias: 0.7, depthCurve: "flat",
      });

      let textMinY = Infinity, textMaxY = -Infinity;
      for (let i = 0; i < addTextSceneCloud.positions.length; i += 3) {
        const ty = addTextSceneCloud.positions[i + 1];
        if (ty < textMinY) textMinY = ty;
        if (ty > textMaxY) textMaxY = ty;
      }
      // Approximate logo/text split based on the new layout (logo is top 1/3)
      const logoMaxY = textMaxY - (textMaxY - textMinY) * 0.38;

      sceneMetaRef.current = {
        tank: {
          tankMinX, tankMaxX,
          tankMinY, tankMaxY,
        },
        truckMissile: {
          missileStart: TRUCK_MISSILE_SCENE_CONFIG.truckCount,
          missileCount: TRUCK_MISSILE_SCENE_CONFIG.missileCount,
          missileMinX, missileMaxX,
          missileMinY, missileMaxY,
          truckMinX, truckMaxX,
          truckMinY, truckMaxY,
          truckCount: TRUCK_MISSILE_SCENE_CONFIG.truckCount,
        },
        satellite: {
          cuavMinX,
          cuavMaxX,
          cuavMinY,
          cuavMaxY,
        },
        sar: {
          sarMinX, sarMaxX,
          sarMinY, sarMaxY,
          sarMinZ, sarMaxZ,
        },
        shield: {
          kddxMinX, kddxMaxX,
          kddxMinY, kddxMaxY,
        },
        addText: {
          textMinY,
          textMaxY,
          logoMaxY,
        },
      };

      const kf21SceneCloud = fitPointCloud(kf21PointCloud, ACTIVE_COUNT, {
        offset: [0, 42, 0], depth: 0.85, tint: [1, 1, 1], glow: 1.15, spread: 0.03, edgeBias: 0.58, useSourceDepth: true, sourceDepthScale: 1.05,
      });
      const k2SceneCloud = fitPointCloud(k2PointCloud, ACTIVE_COUNT, {
        offset: [0, 42, 0], depth: 0.75, tint: [1, 1, 1], glow: 1.15, spread: 0.032, edgeBias: 0.55, useSourceDepth: true, sourceDepthScale: 1.05,
      });

      formationsRef.current = {
        landing: ground,
        takeoff,
        tank: tankSceneCloud,
        truckMissile: truckMissileCloud,
        satellite: cuavSceneCloud,
        kf21: kf21SceneCloud,
        k2: k2SceneCloud,
        sar: sarSceneCloud,
        shield: kddxSceneCloud,
        addText: addTextSceneCloud,
      };

      // base cloud disabled - remove bottom structure from view
      baseCloudRef.current = null;

      currentPositionsRef.current.set(ground.positions);
      currentColorsRef.current.set(ground.colors);
      targetPositionsRef.current.set(ground.positions);
      targetColorsRef.current.set(ground.colors);

      startTimeRef.current = performance.now();
      advanceToStep(0);
    }

    prepareShow().catch(() => {
      onStepChange?.("로딩 실패");
    });
    return () => { mounted = false; };
  }, [onStepChange]);

  useEffect(() => {
    function onKeyDown(event) {
      const match = event.code.match(/^(Digit|Numpad)(\d)$/);
      if (!match) {
        return;
      }

      const digit = Number(match[2]);
      if (digit === 0) {
        return;
      }

      const stepIndex = digit - 1;
      if (stepIndex >= STEPS.length) {
        return;
      }

      event.preventDefault();
      jumpToStep(stepIndex);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onStepChange]);

  // --- Input: pointer (desktop) + touch (mobile) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const interaction = interactionRef.current;

    function onPointerDown(event) {
      if (event.pointerType === "touch") return;
      interaction.dragging = true;
      interaction.pointerId = event.pointerId;
      interaction.x = event.clientX;
      interaction.y = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
      if (event.pointerType === "touch") return;
      if (!interaction.dragging || interaction.pointerId !== event.pointerId) return;
      const dx = event.clientX - interaction.x;
      const dy = event.clientY - interaction.y;
      interaction.x = event.clientX;
      interaction.y = event.clientY;
      cameraRef.current.yaw += dx * 0.005;
      cameraRef.current.pitch -= dy * 0.004;
      clampCamera(cameraRef.current);
    }

    function onPointerUp(event) {
      if (interaction.pointerId === event.pointerId) {
        interaction.dragging = false;
        interaction.pointerId = null;
      }
    }

    function onWheel(event) {
      event.preventDefault();
      cameraRef.current.distance += event.deltaY * 0.06;
      clampCamera(cameraRef.current);
    }

    function getTouchDist(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(event) {
      event.preventDefault();
      interaction.touches = Array.from(event.touches);
      if (event.touches.length === 2) {
        interaction.lastPinchDist = getTouchDist(event.touches);
      }
    }

    function onTouchMove(event) {
      event.preventDefault();
      if (event.touches.length === 1 && interaction.touches.length >= 1) {
        const dx = event.touches[0].clientX - interaction.touches[0].clientX;
        const dy = event.touches[0].clientY - interaction.touches[0].clientY;
        cameraRef.current.yaw += dx * 0.005;
        cameraRef.current.pitch -= dy * 0.004;
        clampCamera(cameraRef.current);
      }
      if (event.touches.length === 2) {
        const dist = getTouchDist(event.touches);
        const delta = interaction.lastPinchDist - dist;
        cameraRef.current.distance += delta * 0.15;
        interaction.lastPinchDist = dist;
        clampCamera(cameraRef.current);
      }
      interaction.touches = Array.from(event.touches);
    }

    function onTouchEnd(event) {
      interaction.touches = Array.from(event.touches);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // --- Render loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

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
      gradient.addColorStop(0.4, "#040d1a");
      gradient.addColorStop(1, "#0a0a0a");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      stars.forEach((star, idx) => {
        const twinkle = 0.65 + Math.sin(elapsed * 0.8 + idx) * 0.35;
        context.fillStyle = `rgba(210, 235, 255, ${star.alpha * twinkle})`;
        context.beginPath();
        context.arc(star.x * width, star.y * height * 0.7, star.size, 0, Math.PI * 2);
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
      const currentSceneMeta = currentStep ? sceneMetaRef.current[currentStep.key] : null;
      const avgErr = lastAverageErrorRef.current;
      const settleT = currentStep ? currentStep.settleThreshold : 1;
      const transitionRatio = currentStep ? Math.min(1, Math.max(0, (avgErr - settleT) / (settleT * 3))) : 0;
      const isTransitioning = transitionRatio > 0.05 && currentStep && currentStep.key !== "takeoff" && currentStep.key !== "landing";

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
          width, height, camera
        );
        const pulse = 0.9 + (Math.sin(elapsed * 2.4 + seed.pulse) + 1) * 0.18;

        let r, g, b, alpha;

        if (isTransitioning) {
          const baseR = currentColors[index] * 255 * pulse;
          const baseG = currentColors[index + 1] * 255 * pulse;
          const baseB = currentColors[index + 2] * 255 * pulse;
          const effect = transitionEffectRef.current;

          if (effect === 0) {
            const cx = currentPositions[index];
            const cy = currentPositions[index + 1];
            const cz = currentPositions[index + 2];
            const distFromCenter = Math.sqrt(cx * cx + (cy - 40) * (cy - 40) + cz * cz);
            const burstWave = (elapsed * 12 + seed.blinkSeed * 20) % 40;
            const burstDist = Math.abs(distFromCenter - burstWave);
            const burstGlow = Math.max(0, 1 - burstDist / 4);
            const sparkle = (burstGlow > 0.7) ? 1 : 0;
            r = Math.min(255, baseR * 0.3 + 255 * burstGlow * 0.7 + sparkle * 200);
            g = Math.min(255, baseG * 0.3 + 220 * burstGlow * 0.6 + sparkle * 180);
            b = Math.min(255, baseB * 0.3 + 180 * burstGlow * 0.5 + sparkle * 255);
            alpha = Math.max(0.08, burstGlow * 0.85 + sparkle * 0.15 + (1 - transitionRatio) * 0.3);
          } else if (effect === 1) {
            const wavePhase = (elapsed * 2.5 + seed.blinkSeed * 3) % 2;
            const normalizedX = (currentPositions[index] + 20) / 40;
            const waveFront = wavePhase;
            const waveDist = Math.abs(normalizedX - waveFront);
            const waveGlow = Math.max(0, 1 - waveDist / 0.15);
            const dissolve = waveGlow * waveGlow;
            r = Math.min(255, baseR * (1 - dissolve * 0.7) + 200 * dissolve);
            g = Math.min(255, baseG * (1 - dissolve * 0.7) + 230 * dissolve);
            b = Math.min(255, baseB * (1 - dissolve * 0.7) + 255 * dissolve);
            alpha = Math.max(0.1, 0.3 + dissolve * 0.5 + (1 - transitionRatio) * 0.4);
          } else if (effect === 2) {
            const cascadeDelay = seed.blinkSeed * 2.5;
            const cascadeTime = (elapsed * 3 - cascadeDelay) % 4;
            const sparkPhase = Math.max(0, Math.min(1, cascadeTime));
            const isSparking = sparkPhase > 0 && sparkPhase < 0.6;
            const sparkIntensity = isSparking ? Math.pow(Math.sin(sparkPhase / 0.6 * Math.PI), 2) : 0;
            const chainReact = Math.sin(elapsed * 8 + seed.phaseA * 12) * 0.5 + 0.5;
            const boost = sparkIntensity * 0.8 + chainReact * 0.15 * transitionRatio;
            r = Math.min(255, baseR * 0.25 + 255 * boost);
            g = Math.min(255, baseG * 0.25 + 255 * boost);
            b = Math.min(255, baseB * 0.25 + 255 * boost * 0.9);
            alpha = Math.max(0.08, boost * 0.9 + (1 - transitionRatio) * 0.25);
          } else {
            const colorWavePos = (elapsed * 1.8 + seed.blinkSeed * 5) % 3;
            const waveR = Math.max(0, 1 - Math.abs(colorWavePos - 0) / 0.5) * 0.4;
            const waveG = Math.max(0, 1 - Math.abs(colorWavePos - 1) / 0.5) * 0.5;
            const waveB = Math.max(0, 1 - Math.abs(colorWavePos - 2) / 0.5) * 0.6;
            const shimmer = (0.5 + 0.5 * Math.sin(elapsed * 5 + seed.phaseB * 10)) * 0.3;
            r = Math.min(255, baseR * 0.4 + 255 * (waveR + shimmer * 0.8));
            g = Math.min(255, baseG * 0.4 + 245 * (waveG + shimmer * 0.9));
            b = Math.min(255, baseB * 0.4 + 255 * (waveB + shimmer));
            alpha = Math.max(0.12, (waveR + waveG + waveB) * 0.6 + shimmer + (1 - transitionRatio) * 0.3);
          }
        } else {
          r = Math.min(255, currentColors[index] * 255 * pulse);
          g = Math.min(255, currentColors[index + 1] * 255 * pulse);
          b = Math.min(255, currentColors[index + 2] * 255 * pulse);
          alpha = 1;

          if (currentStep?.key === "tank" && currentSceneMeta) {
            const tankRangeX = Math.max(0.001, currentSceneMeta.tankMaxX - currentSceneMeta.tankMinX);
            const tankRangeY = Math.max(0.001, currentSceneMeta.tankMaxY - currentSceneMeta.tankMinY);
            const nxT = (targetPositions[index] - currentSceneMeta.tankMinX) / tankRangeX;
            const nyT = (targetPositions[index + 1] - currentSceneMeta.tankMinY) / tankRangeY;
            const shimmerA = Math.sin(elapsed * 2.8 + nxT * 14 + nyT * 9 + seed.phaseA * 6) * 0.5 + 0.5;
            const shimmerB = Math.sin(elapsed * 1.6 + nxT * 7 - nyT * 11 + seed.phaseB * 5) * 0.5 + 0.5;
            const shimmerC = Math.sin(elapsed * 3.5 + nxT * 19 + seed.blinkSeed * 30) * 0.5 + 0.5;
            const shimmer = shimmerA * 0.35 + shimmerB * 0.3 + shimmerC * 0.15;
            const sparkle = (shimmerA > 0.92) ? 0.5 : 0;
            const ledBoost = shimmer + sparkle;
            r = Math.min(255, r + 80 * ledBoost);
            g = Math.min(255, g + 90 * ledBoost);
            b = Math.min(255, b + 55 * ledBoost);
            alpha = Math.min(1, alpha + ledBoost * 0.15);
          }

          if (currentStep?.key === "truckMissile" && currentSceneMeta) {
            if (i < currentSceneMeta.truckCount) {
              const truckRangeX = Math.max(0.001, currentSceneMeta.truckMaxX - currentSceneMeta.truckMinX);
              const truckRangeY = Math.max(0.001, currentSceneMeta.truckMaxY - currentSceneMeta.truckMinY);
              const nxTr = (targetPositions[index] - currentSceneMeta.truckMinX) / truckRangeX;
              const nyTr = (targetPositions[index + 1] - currentSceneMeta.truckMinY) / truckRangeY;
              const isCargoArea = nyTr > 0.45;
              const cargoWave = (0.5 + 0.5 * Math.sin(elapsed * 2.2 + nxTr * 8 + seed.phaseA * 4)) * (isCargoArea ? 0.35 : 0.08);
              const edgeHighlight = (nxTr < 0.08 || nxTr > 0.92) ? 0.12 : 0;
              const ledBoost = cargoWave + edgeHighlight;
              r = Math.min(255, r + 100 * ledBoost);
              g = Math.min(255, g + 85 * ledBoost);
              b = Math.min(255, b + 50 * ledBoost);
              alpha = Math.min(1, alpha + ledBoost * 0.14);
            }

            if (
              i >= currentSceneMeta.missileStart &&
              i < currentSceneMeta.missileStart + currentSceneMeta.missileCount
            ) {
              const missileRangeY = Math.max(0.001, currentSceneMeta.missileMaxY - currentSceneMeta.missileMinY);
              const missileRangeX = Math.max(0.001, currentSceneMeta.missileMaxX - currentSceneMeta.missileMinX);
              const normalizedY = (targetPositions[index + 1] - currentSceneMeta.missileMinY) / missileRangeY;
              const normalizedX = (targetPositions[index] - currentSceneMeta.missileMinX) / missileRangeX;
              const spiralAngle = normalizedY * Math.PI * 6 + elapsed * 4.5 + seed.blinkSeed * Math.PI * 2;
              const spiralX = Math.cos(spiralAngle);
              const spiralDist = Math.abs((normalizedX - 0.5) * 2 - spiralX * 0.5);
              const spiralBand = Math.max(0, 1 - spiralDist / 0.35);
              const risePulse = (0.5 + 0.5 * Math.sin(elapsed * 3 - normalizedY * 8 + seed.phaseA * 3));
              const tipGlow = Math.max(0, normalizedY - 0.85) * 6;
              const ledBoost = spiralBand * spiralBand * 0.8 + risePulse * 0.2 + tipGlow * 0.4;
              r = Math.min(255, r + 255 * ledBoost);
              g = Math.min(255, g + 180 * ledBoost);
              b = Math.min(255, b + 100 * ledBoost);
              alpha = Math.min(1, alpha + ledBoost * 0.28);
            }
          }

          if (currentStep?.key === "sar" && currentSceneMeta) {
            const sarRangeY = Math.max(0.001, currentSceneMeta.sarMaxY - currentSceneMeta.sarMinY);
            const sarRangeX = Math.max(0.001, currentSceneMeta.sarMaxX - currentSceneMeta.sarMinX);
            const normalizedY = (targetPositions[index + 1] - currentSceneMeta.sarMinY) / sarRangeY;
            const normalizedX = (targetPositions[index] - currentSceneMeta.sarMinX) / sarRangeX;

            const scanHead = (elapsed * 0.32 + seed.blinkSeed * 0.04) % 1;
            const scanDist = Math.min(
              Math.abs(normalizedY - scanHead),
              Math.abs(normalizedY - scanHead + 1),
              Math.abs(normalizedY - scanHead - 1)
            );
            const scanBand = Math.max(0, 1 - scanDist / 0.1);
            const scanTrail = Math.max(0, 1 - scanDist / 0.22) * 0.4;

            const isPanel = Math.abs(normalizedX - 0.5) > 0.25;
            const panelGlow = isPanel ? (0.5 + 0.5 * Math.sin(elapsed * 3.2 + seed.phaseA * 5)) * 0.18 : 0;

            const corePulse = (Math.abs(normalizedX - 0.5) < 0.15 && Math.abs(normalizedY - 0.5) < 0.2)
              ? (0.5 + 0.5 * Math.sin(elapsed * 1.8 + seed.phaseB * 3)) * 0.22
              : 0;

            const ledBoost = scanBand * scanBand * 0.85 + scanTrail + panelGlow + corePulse;

            r = Math.min(255, r + 180 * ledBoost);
            g = Math.min(255, g + 230 * ledBoost);
            b = Math.min(255, b + 255 * ledBoost);
            alpha = Math.min(1, alpha + ledBoost * 0.22);
          }

          if (currentStep?.key === "shield" && currentSceneMeta) {
            const kddxRangeY = Math.max(0.001, currentSceneMeta.kddxMaxY - currentSceneMeta.kddxMinY);
            const kddxRangeX = Math.max(0.001, currentSceneMeta.kddxMaxX - currentSceneMeta.kddxMinX);
            const normalizedY = (targetPositions[index + 1] - currentSceneMeta.kddxMinY) / kddxRangeY;
            const normalizedX = (targetPositions[index] - currentSceneMeta.kddxMinX) / kddxRangeX;

            const waveHeadA = (elapsed * 0.25 + seed.blinkSeed * 0.05) % 1;
            const waveDist = Math.min(
              Math.abs(normalizedY - waveHeadA),
              Math.abs(normalizedY - waveHeadA + 1),
              Math.abs(normalizedY - waveHeadA - 1)
            );
            const bowWave = Math.max(0, 1 - waveDist / 0.12);
            const bowTrail = Math.max(0, 1 - waveDist / 0.26) * 0.35;

            const waterlineGlow = (normalizedY < 0.2)
              ? (0.5 + 0.5 * Math.sin(elapsed * 2.5 + normalizedX * 12 + seed.phaseA * 4)) * 0.2
              : 0;

            const bridgeBoost = (Math.abs(normalizedX - 0.5) < 0.12 && normalizedY > 0.55 && normalizedY < 0.75)
              ? (0.5 + 0.5 * Math.sin(elapsed * 1.5 + seed.phaseB * 6)) * 0.25
              : 0;

            const ledBoost = bowWave * bowWave * 0.9 + bowTrail + waterlineGlow + bridgeBoost;

            r = Math.min(255, r + 160 * ledBoost);
            g = Math.min(255, g + 200 * ledBoost);
            b = Math.min(255, b + 255 * ledBoost);
            alpha = Math.min(1, alpha + ledBoost * 0.2);
          }

          if (currentStep?.key === "satellite" && currentSceneMeta) {
            const cuavRangeX = Math.max(0.001, currentSceneMeta.cuavMaxX - currentSceneMeta.cuavMinX);
            const cuavRangeY = Math.max(0.001, currentSceneMeta.cuavMaxY - currentSceneMeta.cuavMinY);
            const normalizedX = (targetPositions[index] - currentSceneMeta.cuavMinX) / cuavRangeX;
            const normalizedY = (targetPositions[index + 1] - currentSceneMeta.cuavMinY) / cuavRangeY;
            const sweepHeadA = (elapsed * 0.28 + seed.blinkSeed * 0.06) % 1;
            const sweepHeadB = (elapsed * 0.28 + 0.38 + seed.blinkSeed * 0.04) % 1;
            const sweepDistanceA = Math.min(
              Math.abs(normalizedX - sweepHeadA),
              Math.abs(normalizedX - sweepHeadA + 1),
              Math.abs(normalizedX - sweepHeadA - 1)
            );
            const sweepDistanceB = Math.min(
              Math.abs(normalizedX - sweepHeadB),
              Math.abs(normalizedX - sweepHeadB + 1),
              Math.abs(normalizedX - sweepHeadB - 1)
            );
            const sweepBandA = Math.max(0, 1 - sweepDistanceA / 0.085);
            const sweepBandB = Math.max(0, 1 - sweepDistanceB / 0.12) * 0.65;
            const wingTipBoost = Math.max(0, Math.abs(normalizedX - 0.5) * 2 - 0.68) * 1.45;
            const spineBoost = Math.max(0, 1 - Math.abs(normalizedY - 0.56) / 0.11) * 0.42;
            const twinkleBoost = (0.5 + 0.5 * Math.sin(elapsed * 6 + seed.phaseB * 8)) * 0.12;
            const ledBoost = sweepBandA + sweepBandB + wingTipBoost + spineBoost + twinkleBoost;

            r = Math.min(255, r + 120 * ledBoost);
            g = Math.min(255, g + 235 * ledBoost);
            b = Math.min(255, b + 255 * ledBoost);
            alpha = Math.min(1, alpha + ledBoost * 0.24);
          }

          if (currentStep?.key === "addText" && currentSceneMeta) {
            const { textMinY, textMaxY, logoMaxY } = currentSceneMeta;
            const cy = targetPositions[index + 1];
            const isLogo = cy > logoMaxY;
            
            // Energy Flow Animation: Particles moving from logo to text
            const flowSpeed = 1.5;
            const flowCycle = (elapsed * flowSpeed) % 2;
            const flowProgress = Math.max(0, flowCycle - 0.5); // Delay flow start
            
            let energyBoost = 0;
            if (!isLogo) {
              // Text area: receive energy
              const normalizedY = (cy - textMinY) / (logoMaxY - textMinY);
              const flowFront = 1 - flowProgress;
              const flowDist = Math.abs(normalizedY - flowFront);
              energyBoost = Math.max(0, 1 - flowDist / 0.2) * 0.6;
            } else {
              // Logo area: source of energy
              const pulse = (0.5 + 0.5 * Math.sin(elapsed * 4 + seed.phaseA * 2)) * 0.2;
              energyBoost = pulse;
            }

            const fwTime = elapsed * 1.2 + seed.blinkSeed * 8;
            const fwCycle = fwTime % 3.5;
            const fwActive = fwCycle < 1.2;
            const cx = targetPositions[index];
            const fwCenterX = Math.sin(seed.phaseA * 3 + Math.floor(fwTime / 3.5) * 2.1) * 15;
            const fwCenterY = 42 + Math.cos(seed.phaseB * 2 + Math.floor(fwTime / 3.5) * 1.7) * 8;
            const distFw = Math.sqrt((cx - fwCenterX) * (cx - fwCenterX) + (cy - fwCenterY) * (cy - fwCenterY));
            const fwRadius = fwCycle * 18;
            const fwBand = Math.max(0, 1 - Math.abs(distFw - fwRadius) / 3.5);
            const fwGlow = fwActive ? fwBand * fwBand : 0;
            const sparkT = Math.sin(elapsed * 12 + seed.blinkSeed * 50 + i * 0.3);
            const sparkle = (sparkT > 0.85 && fwGlow > 0.1) ? 0.6 : 0;
            
            const textPulse = (0.5 + 0.5 * Math.sin(elapsed * 2 + seed.phaseA)) * 0.15;
            const fwHue = (seed.blinkSeed * 3 + Math.floor(fwTime / 3.5)) % 3;
            const fwR = fwHue < 1 ? 255 : (fwHue < 2 ? 200 : 255);
            const fwG = fwHue < 1 ? 220 : (fwHue < 2 ? 255 : 180);
            const fwB = fwHue < 1 ? 120 : (fwHue < 2 ? 200 : 255);
            
            const boost = fwGlow + sparkle + textPulse + energyBoost;
            r = Math.min(255, r + fwR * boost * 0.5 + (isLogo ? 0 : energyBoost * 100));
            g = Math.min(255, g + fwG * boost * 0.5 + (isLogo ? energyBoost * 100 : energyBoost * 150));
            b = Math.min(255, b + fwB * boost * 0.5 + energyBoost * 255);
            alpha = Math.min(1, alpha + boost * 0.25);
          }
        }

        activeQueue.push({
          x: projected.x, y: projected.y, z: projected.depth,
          radius: projected.scale * 1.05, r, g, b, alpha,
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
            width, height, camera
          );
          baseQueue.push({
            x: projected.x, y: projected.y, z: projected.depth - 20,
            radius: projected.scale * 0.88,
            r: Math.min(255, baseCloud.colors[index] * 255),
            g: Math.min(255, baseCloud.colors[index + 1] * 255),
            b: Math.min(255, baseCloud.colors[index + 2] * 255),
            alpha: 1,
          });
        }
      }

      const drawQueue = baseQueue.concat(activeQueue);
      drawQueue.sort((a, b2) => b2.z - a.z);

      for (let i = 0; i < drawQueue.length; i++) {
        const point = drawQueue[i];
        context.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b})`;

        context.globalAlpha = point.alpha * 0.25;
        context.beginPath();
        context.arc(point.x, point.y, point.radius * 2.5, 0, Math.PI * 2);
        context.fill();

        context.globalAlpha = point.alpha;
        context.beginPath();
        context.arc(point.x, point.y, point.radius * 0.55, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
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
