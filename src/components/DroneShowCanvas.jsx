"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { fitPointCloud } from "../utils/imageToPoints";

const ACTIVE_COUNT = 2100;
const BASE_COUNT = 780;
const SHOW_SCALE = 1.4;
const SHOW_Y_OFFSET = -36;
const MIN_CAMERA_DISTANCE = 90;
const MAX_CAMERA_DISTANCE = 360;
const MIN_YAW = -1.48;
const MAX_YAW = 1.48;
const MIN_PITCH = 0.55; // 아래를 더 강하게 막음
const MAX_PITCH = 1.52; // 직상방에 더 가깝게 허용
const PLY_OBJECT_CONFIG = {
  tank: {
    url: "/formations/generated/object-0.json",
    rotateX: -100, // 수평축
    rotateY: -60, // 수직축
    rotateZ: 0, //모니터로 나오는 축
    scale: 0.72,
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
  truckCount: 1620,
  missileCount: 480,
};
const STEPS = [
  { key: "takeoff", label: "직육면체 이륙", minDuration: 15000, maxDuration: 20000, settleThreshold: 1.45 },
  { key: "tank", label: "K9 자주포", minDuration: 15000, maxDuration: 20000, settleThreshold: 0.9 },
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
  const canvasWidth = Math.ceil(Math.max(textWidth * 1.2, logoSize * 0.5) + padding * 2);
  const canvasHeight = Math.ceil(logoSize * 0.5 + gap + textHeight * 1.2 + padding * 2);

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
          x: nx * 0.06, // Adjusted global scale
          y: ny * 0.06,
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

  for (let i = 0; i < count; i++) {
    const p = validPixels[i];
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = 0;
    
    colors[i * 3] = p.r;
    colors[i * 3 + 1] = p.g;
    colors[i * 3 + 2] = p.b;
  }

  return { positions, colors, edgeIndices: [] };
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

function project(x, y, z, width, height, camera) {
  // 카메라 위치 고정 (지면 위 1.7m, 드론쇼 중앙에서 약간 뒤)
  const eyeX = 0;
  const eyeY = 1.7;
  const eyeZ = -26; // 관람석 기준 훨씬 더 가까운 위치
  
  // 카메라 상대 좌표
  const relX = x * SHOW_SCALE - eyeX;
  const relY = y * SHOW_SCALE + SHOW_Y_OFFSET - eyeY;
  const relZ = z * SHOW_SCALE - eyeZ;

  // 고개 회전 (yaw, pitch) 적용
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const yawX = relX * cosYaw - relZ * sinYaw;
  const yawZ = relX * sinYaw + relZ * cosYaw;
  
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);
  // 관람자가 고개를 위로 들면 하늘 쪽 형상이 화면 위로 올라오도록
  // 카메라 기준 pitch 회전을 적용한다.
  const pitchY = relY * cosPitch + yawZ * sinPitch;
  const pitchZ = -relY * sinPitch + yawZ * cosPitch;

  // FOV 기반 줌 (camera.distance가 FOV 역할)
  const perspective = camera.distance / (camera.distance + pitchZ);
  
  // 뒤에 있는 점은 그리지 않음
  if (perspective < 0) return { x: -1000, y: -1000, scale: 0, depth: -1000 };

  return {
    x: width / 2 + yawX * perspective * 11.5,
    y: height * 0.78 - pitchY * perspective * 11.5,
    scale: Math.max(0.28, perspective * 0.58),
    depth: pitchZ,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mixLedChannel(base, target, amount) {
  return base * (1 - amount) + target * amount;
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
  const cameraRef = useRef({ yaw: 0, pitch: 1.02, distance: 108 });
  const transitionEffectRef = useRef(0);
  const transitionFromStepKeyRef = useRef(null);
  const transitionFromElapsedInStepRef = useRef(0);
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

  function getMotionOffset(stepKey, elapsed, elapsedInStep, seed, index, sceneMeta) {
    let x = 0;
    let y = 0;
    let z = 0;

    switch (stepKey) {
      case "kf21":
        break;

      case "k2": {
        break;
      }

      case "tank":
        x = Math.sin(elapsed * 15 + seed.phaseA) * 0.3;
        y = Math.cos(elapsed * 18 + seed.phaseB) * 0.2;
        z = Math.sin(elapsed * 16 + seed.phaseC) * 0.3;
        break;

      case "satellite":
        x = Math.sin(elapsed * 0.55 + seed.phaseA) * 0.05;
        y = Math.cos(elapsed * 0.6 + seed.phaseB) * 0.06;
        z = Math.sin(elapsed * 0.5 + seed.phaseC) * 0.1;
        break;

      case "truckMissile":
        if (sceneMeta && index >= sceneMeta.missileStart) {
          y = Math.min(elapsedInStep * 2.25, 13);
        }
        break;

      case "shield":
        x = elapsedInStep * 2;
        y = Math.sin(elapsed * 1.2) * 2;
        break;

      case "sar":
        x = Math.sin(elapsedInStep * 0.2) * 10;
        z = Math.cos(elapsedInStep * 0.2) * 10 - 10;
        y = Math.sin(elapsedInStep * 0.4) * 3;
        break;

      case "addText":
      case "takeoff":
      case "landing":
      default:
        x = Math.sin(elapsed * 0.9 + seed.phaseA) * 0.07;
        y = Math.cos(elapsed * 1.05 + seed.phaseB) * 0.08;
        z = Math.sin(elapsed * 0.8 + seed.phaseC) * 0.18;
        break;
    }

    return { x, y, z };
  }

  function snapshotDisplayedPositions(now) {
    const currentStepIndex = stepIndexRef.current;
    if (currentStepIndex < 0 || currentStepIndex >= STEPS.length) {
      return;
    }

    const currentStep = STEPS[currentStepIndex];
    const currentSceneMeta = sceneMetaRef.current[currentStep.key];
    const elapsed = (now - startTimeRef.current) / 1000;
    const elapsedInStep = (now - stepStartTimeRef.current) / 1000;
    const currentPositions = currentPositionsRef.current;

    for (let i = 0; i < ACTIVE_COUNT; i += 1) {
      const index = i * 3;
      const seed = motionSeeds[i];
      const offset = getMotionOffset(currentStep.key, elapsed, elapsedInStep, seed, i, currentSceneMeta);

      currentPositions[index] += offset.x;
      currentPositions[index + 1] += offset.y;
      currentPositions[index + 2] += offset.z;
    }
  }

  function advanceToStep(nextIndex) {
    if (!formationsRef.current || nextIndex < 0 || nextIndex >= STEPS.length) {
      return;
    }
    const step = STEPS[nextIndex];
    const formation = formationsRef.current[step.key];
    if (!formation) {
      return;
    }
    const now = performance.now();
    const previousStepIndex = stepIndexRef.current;
    if (previousStepIndex >= 0 && previousStepIndex < STEPS.length) {
      transitionFromStepKeyRef.current = STEPS[previousStepIndex].key;
      transitionFromElapsedInStepRef.current = (now - stepStartTimeRef.current) / 1000;
    } else {
      transitionFromStepKeyRef.current = null;
      transitionFromElapsedInStepRef.current = 0;
    }
    snapshotDisplayedPositions(now);
    stepIndexRef.current = nextIndex;
    stepStartTimeRef.current = now;
    lastAdvanceTimeRef.current = stepStartTimeRef.current;
    lastAverageErrorRef.current = Number.POSITIVE_INFINITY;
    transitionEffectRef.current = Math.floor(Math.random() * 4);
    onStepChange?.({ label: step.label, index: nextIndex, total: STEPS.length });
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
    transitionFromStepKeyRef.current = null;
    transitionFromElapsedInStepRef.current = 0;
    stepIndexRef.current = nextIndex;
    stepStartTimeRef.current = now;
    lastAdvanceTimeRef.current = now;
    lastAverageErrorRef.current = 0;
    currentPositionsRef.current.set(formation.positions);
    currentColorsRef.current.set(formation.colors);
    targetPositionsRef.current.set(formation.positions);
    targetColorsRef.current.set(formation.colors);
    onStepChange?.({ label: step.label, index: nextIndex, total: STEPS.length });
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
        offset: [0, 18, 0],
        depth: 0.75,
        tint: [0.3, 0.3, 0.3], // 어두운 기체
        glow: 1.1,
        spread: 0.028,
        edgeBias: 0.62,
        useSourceDepth: true,
        sourceDepthScale: 1.1,
      });
      const missileSceneCloud = fitPointCloud(missilePointCloud, TRUCK_MISSILE_SCENE_CONFIG.missileCount, {
        offset: [0, 18, 0],
        depth: 0.55,
        tint: [0.8, 0.2, 0.2], // 빨간 미사일
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
        offset: [0, 42, 0], depth: 0.9, tint: [0.9, 0.92, 0.98], glow: 1.05, spread: 0.035, edgeBias: 0.58, useSourceDepth: true, sourceDepthScale: 1.05,
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
        offset: [0, 42, 0], depth: 0.95, tint: [0.8, 0.8, 0.8], glow: 1.5, spread: 0.032, edgeBias: 0.6, useSourceDepth: true, sourceDepthScale: 1.06,
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
        offset: [0, 40, 0], depth: 0.9, tint: [0.6, 0.65, 0.7], glow: 1.45, spread: 0.035, edgeBias: 0.58, useSourceDepth: true, sourceDepthScale: 1.05,
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
        offset: [0, 42, 0], depth: 0.7, tint: [0.3, 0.4, 0.2], glow: 1.45, spread: 0.035, edgeBias: 0.55, useSourceDepth: true, sourceDepthScale: 1.05,
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
        offset: [0, 42, 0], depth: 0.85, tint: [0.6, 0.6, 0.65], glow: 1.15, spread: 0.03, edgeBias: 0.58, useSourceDepth: true, sourceDepthScale: 1.05,
      });
      const k2SceneCloud = fitPointCloud(k2PointCloud, ACTIVE_COUNT, {
        offset: [0, 42, 0], depth: 0.75, tint: [0.4, 0.45, 0.5], glow: 1.15, spread: 0.032, edgeBias: 0.55, useSourceDepth: true, sourceDepthScale: 1.05,
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
      onStepChange?.({ label: "로딩 실패", index: 0, total: 0 });
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
      const stepIndex = digit === 0 ? 9 : digit - 1;
      if (stepIndex >= STEPS.length) {
        return;
      }

      event.preventDefault();
      jumpToStep(stepIndex);
    }

    function onResetCamera() {
      cameraRef.current = { yaw: 0, pitch: 1.02, distance: 108 };
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("reset-camera", onResetCamera);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("reset-camera", onResetCamera);
    };
  }, [onStepChange]);

  // Expose camera reset to parent - handled by event listener now
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
      cameraRef.current.distance -= event.deltaY * 0.5; // 위로 스크롤 = 줌인
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
        cameraRef.current.distance -= delta * 2.0; // 핀치 방향 일관성 유지
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
      const isMobileViewport = window.innerWidth < 900;
      const dpr = isMobileViewport
        ? Math.min(window.devicePixelRatio || 1, 3)
        : Math.min(window.devicePixelRatio || 1, 1.2);
      const renderScale = isMobileViewport ? 1 : 0.92;
      canvas.width = window.innerWidth * dpr * renderScale;
      canvas.height = window.innerHeight * dpr * renderScale;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.imageSmoothingEnabled = true;
      context.setTransform(dpr * renderScale, 0, 0, dpr * renderScale, 0, 0);
    }

    function draw(now) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const elapsed = (now - startTimeRef.current) / 1000;
      const camera = cameraRef.current;

      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#01040d");
      gradient.addColorStop(0.42, "#020611");
      gradient.addColorStop(1, "#020202");
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
      const settleProgress =
        currentStep &&
        !isTransitioning &&
        currentStep.key !== "takeoff" &&
        currentStep.key !== "landing" &&
        Number.isFinite(avgErr)
          ? Math.max(0, Math.min(1, (settleT - avgErr) / Math.max(0.0001, settleT * 0.55)))
          : 0;

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
        const elapsedInStep = currentStep ? (now - stepStartTimeRef.current) / 1000 : 0;
        let motionOffset = { x: 0, y: 0, z: 0 };

        if (currentStep) {
          const nextMotionOffset = getMotionOffset(currentStep.key, elapsed, elapsedInStep, seed, i, currentSceneMeta);

          if (isTransitioning && transitionFromStepKeyRef.current) {
            const previousStepKey = transitionFromStepKeyRef.current;
            const previousSceneMeta = sceneMetaRef.current[previousStepKey];
            const previousElapsedInStep = transitionFromElapsedInStepRef.current + elapsedInStep;
            const previousMotionOffset = getMotionOffset(
              previousStepKey,
              elapsed,
              previousElapsedInStep,
              seed,
              i,
              previousSceneMeta
            );
            const blendLinear = Math.max(0, Math.min(1, 1 - transitionRatio));
            const blend = blendLinear * blendLinear * (3 - 2 * blendLinear);

            motionOffset = {
              x: previousMotionOffset.x * (1 - blend) + nextMotionOffset.x * blend,
              y: previousMotionOffset.y * (1 - blend) + nextMotionOffset.y * blend,
              z: previousMotionOffset.z * (1 - blend) + nextMotionOffset.z * blend,
            };
          } else {
            motionOffset = nextMotionOffset;
          }
        }

        const projected = project(
          currentPositions[index] + motionOffset.x,
          currentPositions[index + 1] + motionOffset.y,
          currentPositions[index + 2] + motionOffset.z,
          width, height, camera
        );
        const pulse = 0.9 + (Math.sin(elapsed * 2.4 + seed.pulse) + 1) * 0.18;

        let r, g, b, alpha;

        if (isTransitioning && currentStep?.key !== "satellite") {
          const baseR = currentColors[index] * 255 * pulse;
          const baseG = currentColors[index + 1] * 255 * pulse;
          const baseB = currentColors[index + 2] * 255 * pulse;
          const effect = transitionEffectRef.current;
          const transitionBaseAlpha = 0.72 + (1 - transitionRatio) * 0.2;
          const transitionBaseMix = 0.88;

          if (effect === 0) {
            const cx = currentPositions[index];
            const cy = currentPositions[index + 1];
            const cz = currentPositions[index + 2];
            const distFromCenter = Math.sqrt(cx * cx + (cy - 40) * (cy - 40) + cz * cz);
            const burstWave = (elapsed * 12 + seed.blinkSeed * 20) % 40;
            const burstDist = Math.abs(distFromCenter - burstWave);
            const burstGlow = Math.max(0, 1 - burstDist / 4);
            const sparkle = (burstGlow > 0.7) ? 1 : 0;
            r = Math.min(255, baseR * transitionBaseMix + 255 * burstGlow * 0.5 + sparkle * 140);
            g = Math.min(255, baseG * transitionBaseMix + 220 * burstGlow * 0.42 + sparkle * 120);
            b = Math.min(255, baseB * transitionBaseMix + 180 * burstGlow * 0.38 + sparkle * 160);
            alpha = Math.max(transitionBaseAlpha, burstGlow * 0.5 + sparkle * 0.12 + (1 - transitionRatio) * 0.2);
          } else if (effect === 1) {
            const wavePhase = (elapsed * 2.5 + seed.blinkSeed * 3) % 2;
            const normalizedX = (currentPositions[index] + 20) / 40;
            const waveFront = wavePhase;
            const waveDist = Math.abs(normalizedX - waveFront);
            const waveGlow = Math.max(0, 1 - waveDist / 0.15);
            const dissolve = waveGlow * waveGlow;
            r = Math.min(255, baseR * (0.9 - dissolve * 0.1) + 90 * dissolve);
            g = Math.min(255, baseG * (0.9 - dissolve * 0.1) + 105 * dissolve);
            b = Math.min(255, baseB * (0.9 - dissolve * 0.1) + 120 * dissolve);
            alpha = Math.max(transitionBaseAlpha, 0.45 + dissolve * 0.22 + (1 - transitionRatio) * 0.15);
          } else if (effect === 2) {
            const cascadeDelay = seed.blinkSeed * 2.5;
            const cascadeTime = (elapsed * 3 - cascadeDelay) % 4;
            const sparkPhase = Math.max(0, Math.min(1, cascadeTime));
            const isSparking = sparkPhase > 0 && sparkPhase < 0.6;
            const sparkIntensity = isSparking ? Math.pow(Math.sin(sparkPhase / 0.6 * Math.PI), 2) : 0;
            const chainReact = Math.sin(elapsed * 8 + seed.phaseA * 12) * 0.5 + 0.5;
            const boost = sparkIntensity * 0.8 + chainReact * 0.15 * transitionRatio;
            r = Math.min(255, baseR * 0.88 + 140 * boost);
            g = Math.min(255, baseG * 0.88 + 140 * boost);
            b = Math.min(255, baseB * 0.88 + 130 * boost);
            alpha = Math.max(transitionBaseAlpha, boost * 0.35 + (1 - transitionRatio) * 0.18);
          } else {
            const colorWavePos = (elapsed * 1.8 + seed.blinkSeed * 5) % 3;
            const waveR = Math.max(0, 1 - Math.abs(colorWavePos - 0) / 0.5) * 0.4;
            const waveG = Math.max(0, 1 - Math.abs(colorWavePos - 1) / 0.5) * 0.5;
            const waveB = Math.max(0, 1 - Math.abs(colorWavePos - 2) / 0.5) * 0.6;
            const shimmer = (0.5 + 0.5 * Math.sin(elapsed * 5 + seed.phaseB * 10)) * 0.3;
            r = Math.min(255, baseR * 0.9 + 110 * (waveR + shimmer * 0.8));
            g = Math.min(255, baseG * 0.9 + 110 * (waveG + shimmer * 0.9));
            b = Math.min(255, baseB * 0.9 + 120 * (waveB + shimmer));
            alpha = Math.max(transitionBaseAlpha, (waveR + waveG + waveB) * 0.22 + shimmer * 0.35 + (1 - transitionRatio) * 0.16);
          }
        } else {
          r = Math.min(255, currentColors[index] * 255 * pulse);
          g = Math.min(255, currentColors[index + 1] * 255 * pulse);
          b = Math.min(255, currentColors[index + 2] * 255 * pulse);
          alpha = 1;

          if (currentStep?.key === "tank") {
            r = mixLedChannel(r, 164, 0.32);
            g = mixLedChannel(g, 178, 0.32);
            b = mixLedChannel(b, 106, 0.32);
          }

          if (currentStep?.key === "truckMissile" && currentSceneMeta) {
            if (i < currentSceneMeta.truckCount) {
              r = mixLedChannel(r, 176, 0.34);
              g = mixLedChannel(g, 150, 0.34);
              b = mixLedChannel(b, 108, 0.34);
            } else {
              r = mixLedChannel(r, 255, 0.4);
              g = mixLedChannel(g, 122, 0.4);
              b = mixLedChannel(b, 68, 0.4);
            }
          }

          if (currentStep?.key === "satellite") {
            r = mixLedChannel(r, 236, 0.28);
            g = mixLedChannel(g, 242, 0.28);
            b = mixLedChannel(b, 255, 0.28);
          }

          if (currentStep?.key === "kf21") {
            r = mixLedChannel(r, 198, 0.34);
            g = mixLedChannel(g, 222, 0.34);
            b = mixLedChannel(b, 255, 0.34);
          }

          if (currentStep?.key === "k2") {
            r = mixLedChannel(r, 255, 0.38);
            g = mixLedChannel(g, 174, 0.38);
            b = mixLedChannel(b, 84, 0.38);
          }

          if (currentStep?.key === "sar") {
            r = mixLedChannel(r, 255, 0.34);
            g = mixLedChannel(g, 208, 0.34);
            b = mixLedChannel(b, 128, 0.34);
          }

          if (currentStep?.key === "shield") {
            r = mixLedChannel(r, 118, 0.34);
            g = mixLedChannel(g, 196, 0.34);
            b = mixLedChannel(b, 255, 0.34);
          }

          if (currentStep?.key === "kf21" && currentSceneMeta) {
            const kf21RangeX = Math.max(0.001, currentSceneMeta.kf21MaxX - currentSceneMeta.kf21MinX);
            const kf21RangeY = Math.max(0.001, currentSceneMeta.kf21MaxY - currentSceneMeta.kf21MinY);
            const normalizedX = (targetPositions[index] - currentSceneMeta.kf21MinX) / kf21RangeX;
            const normalizedY = (targetPositions[index + 1] - currentSceneMeta.kf21MinY) / kf21RangeY;
            
            const cx = targetPositions[index];
            const cy = targetPositions[index + 1];
            const cz = targetPositions[index + 2];
            
            // Center of the aircraft
            const centerX = (currentSceneMeta.kf21MinX + currentSceneMeta.kf21MaxX) / 2;
            const centerY = (currentSceneMeta.kf21MinY + currentSceneMeta.kf21MaxY) / 2;
            
            const distFromCenter = Math.sqrt((cx - centerX) * (cx - centerX) + (cy - centerY) * (cy - centerY) + cz * cz);
            
            // Sonic boom effect
            const boomSpeed = 25;
            const maxRadius = 35;
            const boomRadius = (elapsed * boomSpeed) % maxRadius;
            const boomDist = Math.abs(distFromCenter - boomRadius);
            
            // Only show boom when it's expanding
            const boomActive = boomRadius > 2 && boomRadius < maxRadius - 2;
            const boomBand = boomActive ? Math.max(0, 1 - boomDist / 2.5) : 0;
            
            // Engine glow (rear)
            const isRear = normalizedY < 0.3;
            const engineGlow = isRear ? (0.5 + 0.5 * Math.sin(elapsed * 8 + seed.phaseA * 5)) * 0.4 : 0;
            
            const ledBoost = boomBand * 1.5 + engineGlow;
            
            r = Math.min(255, r + 200 * boomBand + 255 * engineGlow);
            g = Math.min(255, g + 230 * boomBand + 150 * engineGlow);
            b = Math.min(255, b + 255 * boomBand + 50 * engineGlow);
            alpha = Math.min(1, alpha + ledBoost * 0.3);
          }

          if (currentStep?.key === "k2" && currentSceneMeta) {
            const k2RangeX = Math.max(0.001, currentSceneMeta.k2MaxX - currentSceneMeta.k2MinX);
            const k2RangeY = Math.max(0.001, currentSceneMeta.k2MaxY - currentSceneMeta.k2MinY);
            const normalizedX = (targetPositions[index] - currentSceneMeta.k2MinX) / k2RangeX;
            const normalizedY = (targetPositions[index + 1] - currentSceneMeta.k2MinY) / k2RangeY;
            
            // Energy shield wave flowing over the armor
            const waveSpeed = 1.5;
            const wavePhase = (elapsed * waveSpeed + normalizedY * 3 - normalizedX * 2) % (Math.PI * 2);
            const shieldWave = Math.max(0, Math.sin(wavePhase));
            
            // Edge highlight for armor panels
            const isEdge = normalizedX < 0.1 || normalizedX > 0.9 || normalizedY < 0.1 || normalizedY > 0.9;
            const edgeGlow = isEdge ? (0.5 + 0.5 * Math.sin(elapsed * 3 + seed.blinkSeed * 10)) * 0.3 : 0;
            
            const ledBoost = shieldWave * 0.6 + edgeGlow;
            
            // Orange/Gold energy shield color
            r = Math.min(255, r + 255 * ledBoost);
            g = Math.min(255, g + 160 * ledBoost);
            b = Math.min(255, b + 40 * ledBoost);
            alpha = Math.min(1, alpha + ledBoost * 0.25);
          }

          if (currentStep?.key === "tank" && currentSceneMeta) {
            const tankRangeX = Math.max(0.001, currentSceneMeta.tankMaxX - currentSceneMeta.tankMinX);
            const tankRangeY = Math.max(0.001, currentSceneMeta.tankMaxY - currentSceneMeta.tankMinY);
            const nxT = (targetPositions[index] - currentSceneMeta.tankMinX) / tankRangeX;
            const nyT = (targetPositions[index + 1] - currentSceneMeta.tankMinY) / tankRangeY;
            
            const cx = targetPositions[index];
            const cy = targetPositions[index + 1];
            
            // Cannon fire effect
            const firePeriod = 4.0; // Fire every 4 seconds
            const firePhase = elapsed % firePeriod;
            
            // Cannon position (approximate, usually front/top)
            const cannonX = currentSceneMeta.tankMinX + tankRangeX * 0.5;
            const cannonY = currentSceneMeta.tankMinY + tankRangeY * 0.8;
            
            const distFromCannon = Math.sqrt((cx - cannonX) * (cx - cannonX) + (cy - cannonY) * (cy - cannonY));
            
            let fireGlow = 0;
            let shockwave = 0;
            
            if (firePhase < 0.5) { // Active firing phase
              // Muzzle flash
              fireGlow = Math.max(0, 1 - distFromCannon / 8) * (1 - firePhase / 0.5);
              
              // Expanding shockwave
              const waveRadius = firePhase * 60;
              const waveDist = Math.abs(distFromCannon - waveRadius);
              shockwave = Math.max(0, 1 - waveDist / 3) * (1 - firePhase / 0.5);
            }
            
            // Engine rumble/heat
            const isEngine = nyT < 0.3;
            const engineHeat = isEngine ? (0.5 + 0.5 * Math.sin(elapsed * 5 + nxT * 10)) * 0.2 : 0;
            
            const ledBoost = fireGlow * 1.5 + shockwave * 1.2 + engineHeat;
            
            // Red/Orange fire + shockwave
            r = Math.min(255, r + 255 * fireGlow + 255 * shockwave + 150 * engineHeat);
            g = Math.min(255, g + 150 * fireGlow + 100 * shockwave + 50 * engineHeat);
            b = Math.min(255, b + 50 * fireGlow + 50 * shockwave);
            alpha = Math.min(1, alpha + ledBoost * 0.3);
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
              
              // Engine exhaust at the bottom
              const isExhaust = normalizedY < 0.15;
              const exhaustFlicker = isExhaust ? (0.5 + 0.5 * Math.sin(elapsed * 20 + seed.blinkSeed * 10)) : 0;
              
              // Trail effect along the body
              const trailPhase = (elapsed * 3 - normalizedY * 2) % 1;
              const trailGlow = Math.max(0, 1 - Math.abs(trailPhase) * 2);
              
              const ledBoost = exhaustFlicker * 1.5 + trailGlow * 0.8;
              
              // Red/Yellow fire trail
              r = Math.min(255, r + 255 * ledBoost);
              g = Math.min(255, g + (isExhaust ? 200 : 100) * ledBoost);
              b = Math.min(255, b + (isExhaust ? 50 : 0) * ledBoost);
              alpha = Math.min(1, alpha + ledBoost * 0.3);
            }
          }

          if (currentStep?.key === "sar" && currentSceneMeta) {
            const sarRangeY = Math.max(0.001, currentSceneMeta.sarMaxY - currentSceneMeta.sarMinY);
            const sarRangeX = Math.max(0.001, currentSceneMeta.sarMaxX - currentSceneMeta.sarMinX);
            const normalizedY = (targetPositions[index + 1] - currentSceneMeta.sarMinY) / sarRangeY;
            const normalizedX = (targetPositions[index] - currentSceneMeta.sarMinX) / sarRangeX;

            // Communication beam from bottom
            const isBeamArea = normalizedY < 0.3 && Math.abs(normalizedX - 0.5) < 0.2;
            const beamPhase = (elapsed * 4 - normalizedY * 5) % 1;
            const beamPulse = isBeamArea ? Math.max(0, 1 - Math.abs(beamPhase - 0.5) * 2) : 0;
            
            // Data particles in beam
            const isDataParticle = isBeamArea && seed.blinkSeed > 0.8;
            const dataGlow = isDataParticle ? (0.5 + 0.5 * Math.sin(elapsed * 10 + seed.phaseA * 20)) : 0;

            const isPanel = Math.abs(normalizedX - 0.5) > 0.25;
            const panelGlow = isPanel ? (0.5 + 0.5 * Math.sin(elapsed * 2 + seed.phaseA * 3)) * 0.2 : 0;

            const ledBoost = beamPulse * 1.2 + dataGlow * 1.5 + panelGlow;

            // Orange/Yellow beam
            r = Math.min(255, r + 255 * ledBoost);
            g = Math.min(255, g + 180 * ledBoost);
            b = Math.min(255, b + 50 * ledBoost);
            alpha = Math.min(1, alpha + ledBoost * 0.3);
          }

          if (currentStep?.key === "shield" && currentSceneMeta) {
            const kddxRangeY = Math.max(0.001, currentSceneMeta.kddxMaxY - currentSceneMeta.kddxMinY);
            const kddxRangeX = Math.max(0.001, currentSceneMeta.kddxMaxX - currentSceneMeta.kddxMinX);
            const normalizedY = (targetPositions[index + 1] - currentSceneMeta.kddxMinY) / kddxRangeY;
            const normalizedX = (targetPositions[index] - currentSceneMeta.kddxMinX) / kddxRangeX;

            // Deep blue ocean waves at the bottom
            const isWater = normalizedY < 0.15;
            const wavePhase1 = Math.sin(elapsed * 2 + normalizedX * 10) * 0.5 + 0.5;
            const wavePhase2 = Math.cos(elapsed * 1.5 - normalizedX * 8) * 0.5 + 0.5;
            const waveIntensity = isWater ? (wavePhase1 * 0.6 + wavePhase2 * 0.4) : 0;
            
            // White foam/spray
            const isFoam = isWater && seed.blinkSeed > 0.7;
            const foamGlow = isFoam ? (0.5 + 0.5 * Math.sin(elapsed * 5 + seed.phaseA * 10)) : 0;

            const bridgeBoost = (Math.abs(normalizedX - 0.5) < 0.12 && normalizedY > 0.55 && normalizedY < 0.75)
              ? (0.5 + 0.5 * Math.sin(elapsed * 1.5 + seed.phaseB * 6)) * 0.25
              : 0;

            const ledBoost = waveIntensity * 0.8 + foamGlow * 1.2 + bridgeBoost;

            if (isWater) {
              // Deep blue wave color with white foam
              r = Math.min(255, 50 + 205 * foamGlow);
              g = Math.min(255, 100 + 155 * foamGlow);
              b = Math.min(255, 200 + 55 * foamGlow + 55 * waveIntensity);
              alpha = Math.min(1, 0.6 + foamGlow * 0.4);
            } else {
              r = Math.min(255, r + 100 * bridgeBoost);
              g = Math.min(255, g + 150 * bridgeBoost);
              b = Math.min(255, b + 200 * bridgeBoost);
              alpha = Math.min(1, alpha + bridgeBoost * 0.2);
            }
          }

          if (currentStep?.key === "addText" && currentSceneMeta) {
            const { textMinY, textMaxY, logoMaxY } = currentSceneMeta;
            const cx = targetPositions[index];
            const cy = targetPositions[index + 1];
            const isLogo = cy > logoMaxY;
            
            const rangeX = 40; // Approximate width
            const normalizedX = (cx + rangeX/2) / rangeX;
            
            let energyBoost = 0;
            let fwR = r, fwG = g, fwB = b;

            if (!isLogo) {
              // Taegeukgi 3 colors (Red, Blue, White) based on X position
              if (normalizedX < 0.33) {
                // Red
                fwR = 255; fwG = 50; fwB = 50;
              } else if (normalizedX < 0.66) {
                // Blue
                fwR = 50; fwG = 50; fwB = 255;
              } else {
                // White
                fwR = 255; fwG = 255; fwB = 255;
              }
              
              r = fwR; g = fwG; b = fwB;
            }

            // Golden explosion particles when settling
            const isSettling = transitionRatio < 0.5;
            let sparkle = 0;
            
            if (isSettling) {
              const sparkT = Math.sin(elapsed * 15 + seed.blinkSeed * 50 + i * 0.3);
              // More sparkles as it settles
              const sparkleThreshold = 0.95 - (0.5 - transitionRatio); 
              sparkle = (sparkT > sparkleThreshold) ? 1.5 : 0;
            }
            
            const textPulse = (0.5 + 0.5 * Math.sin(elapsed * 2 + seed.phaseA)) * 0.15;
            
            const boost = sparkle + textPulse;
            
            if (sparkle > 0) {
              // Golden sparkles
              r = Math.min(255, r + 255 * sparkle);
              g = Math.min(255, g + 215 * sparkle);
              b = Math.min(255, b + 0 * sparkle);
            } else {
              r = Math.min(255, r + r * boost * 0.5);
              g = Math.min(255, g + g * boost * 0.5);
              b = Math.min(255, b + b * boost * 0.5);
            }
            
            alpha = Math.min(1, alpha + boost * 0.3 + (isSettling ? 0.2 : 0));
          }

          if (settleProgress > 0) {
            const settleBrightness = 1 + settleProgress * 0.58;
            r = Math.min(255, r * settleBrightness);
            g = Math.min(255, g * settleBrightness);
            b = Math.min(255, b * settleBrightness);
            alpha = Math.min(1, alpha + settleProgress * 0.28);
          }
        }

        activeQueue.push({
          x: projected.x, y: projected.y, z: projected.depth,
          radius: projected.scale * (1.05 + settleProgress * 0.18),
          settleBoost: settleProgress,
          r, g, b, alpha,
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
        const settleBoost = point.settleBoost ?? 0;
        context.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b})`;

        context.globalAlpha = point.alpha * (settleBoost > 0 ? 0.18 : 0.25);
        context.beginPath();
        context.arc(point.x, point.y, point.radius * (settleBoost > 0 ? 2.1 : 2.5), 0, Math.PI * 2);
        context.fill();

        context.globalAlpha = point.alpha;
        context.beginPath();
        context.arc(point.x, point.y, point.radius * (0.55 + settleBoost * 0.28), 0, Math.PI * 2);
        context.fill();

        if (settleBoost > 0.2) {
          context.globalAlpha = Math.min(1, point.alpha * (0.9 + settleBoost * 0.2));
          context.beginPath();
          context.arc(point.x, point.y, point.radius * (0.24 + settleBoost * 0.12), 0, Math.PI * 2);
          context.fill();
        }

        context.globalAlpha = point.alpha;
        context.beginPath();
        context.arc(point.x, point.y, point.radius * 0.12, 0, Math.PI * 2);
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
