import * as THREE from "three";

export interface DronePosition {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
}

export interface Formation {
  name: string;
  nameKo: string;
  duration: number;
  transitionDuration: number;
  drones: DronePosition[];
}

function samplePointsFromShape(
  testFn: (x: number, y: number) => { hit: boolean; r: number; g: number; b: number },
  count: number,
  width: number,
  height: number
): DronePosition[] {
  const candidates: DronePosition[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / (count * 4))));

  for (let py = 0; py < height; py += step) {
    for (let px = 0; px < width; px += step) {
      const nx = (px / width - 0.5) * 2;
      const ny = (0.5 - py / height) * 2;
      const result = testFn(nx, ny);
      if (result.hit) {
        candidates.push({
          x: nx * 30,
          y: ny * 20 + 45,
          z: (Math.random() - 0.5) * 4,
          r: result.r,
          g: result.g,
          b: result.b,
        });
      }
    }
  }

  while (candidates.length < count) {
    const base = candidates[Math.floor(Math.random() * candidates.length)];
    if (base) {
      candidates.push({
        ...base,
        x: base.x + (Math.random() - 0.5) * 0.5,
        y: base.y + (Math.random() - 0.5) * 0.5,
        z: base.z + (Math.random() - 0.5) * 0.5,
      });
    }
  }

  if (candidates.length > count) {
    candidates.sort(() => Math.random() - 0.5);
    candidates.length = count;
  }

  return candidates;
}

function textToFormation(text: string, color: [number, number, number], count: number): DronePosition[] {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) return generateFallbackGrid(count, color);

  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 120px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 128);

  const imageData = ctx.getImageData(0, 0, 512, 256);
  const points: DronePosition[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt((512 * 256) / (count * 3))));

  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 512; x += step) {
      const idx = (y * 512 + x) * 4;
      if (imageData.data[idx] > 128) {
        points.push({
          x: (x / 512 - 0.5) * 50,
          y: (0.5 - y / 256) * 25 + 45,
          z: (Math.random() - 0.5) * 3,
          r: color[0],
          g: color[1],
          b: color[2],
        });
      }
    }
  }

  while (points.length < count) {
    const base = points[Math.floor(Math.random() * Math.min(points.length, 1))];
    if (base) {
      points.push({
        ...base,
        x: base.x + (Math.random() - 0.5) * 0.8,
        y: base.y + (Math.random() - 0.5) * 0.8,
        z: base.z + (Math.random() - 0.5) * 0.8,
      });
    } else {
      points.push({
        x: (Math.random() - 0.5) * 40,
        y: 35 + Math.random() * 20,
        z: (Math.random() - 0.5) * 3,
        r: color[0], g: color[1], b: color[2],
      });
    }
  }

  points.sort(() => Math.random() - 0.5);
  return points.slice(0, count);
}

function generateFallbackGrid(count: number, color: [number, number, number]): DronePosition[] {
  const points: DronePosition[] = [];
  const side = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / side);
    const col = i % side;
    points.push({
      x: (col / side - 0.5) * 40,
      y: (row / side) * 20 + 35,
      z: (Math.random() - 0.5) * 3,
      r: color[0],
      g: color[1],
      b: color[2],
    });
  }
  return points;
}

function generateStarFormation(count: number): DronePosition[] {
  const points: DronePosition[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * 5;
    const r = ((i % 2 === 0) ? 1 : 0.45) * 18;
    const starAngle = Math.floor(angle / (Math.PI * 2) * 5) * (Math.PI * 2 / 5);
    const nextAngle = starAngle + Math.PI * 2 / 5;
    const t = (angle - starAngle) / (Math.PI * 2 / 5);

    const innerR = 8;
    const outerR = 18;

    const idx = Math.floor(i / (count / 5));
    const localT = (i % (count / 5)) / (count / 5);

    const a1 = idx * (Math.PI * 2 / 5) - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    const a3 = a1 + Math.PI * 2 / 5;

    let px: number, py: number;
    if (localT < 0.5) {
      const lt = localT * 2;
      px = Math.cos(a1) * outerR * (1 - lt) + Math.cos(a2) * innerR * lt;
      py = Math.sin(a1) * outerR * (1 - lt) + Math.sin(a2) * innerR * lt;
    } else {
      const lt = (localT - 0.5) * 2;
      px = Math.cos(a2) * innerR * (1 - lt) + Math.cos(a3) * outerR * lt;
      py = Math.sin(a2) * innerR * (1 - lt) + Math.sin(a3) * outerR * lt;
    }

    points.push({
      x: px + (Math.random() - 0.5) * 0.5,
      y: py + 45 + (Math.random() - 0.5) * 0.5,
      z: (Math.random() - 0.5) * 3,
      r: 1, g: 0.85, b: 0.2,
    });
  }
  return points;
}

function generateTankFormation(count: number): DronePosition[] {
  return samplePointsFromShape((x, y) => {
    const hit =
      (Math.abs(x) < 0.6 && y > -0.5 && y < 0.0) ||
      (Math.abs(x) < 0.35 && y >= 0.0 && y < 0.3) ||
      (x > 0 && x < 0.8 && Math.abs(y - 0.15) < 0.06) ||
      (Math.abs(x - 0.0) < 0.2 && y >= 0.3 && y < 0.5 && (x * x + (y - 0.3) * (y - 0.3)) < 0.2 * 0.2) ||
      (Math.abs(x) < 0.55 && y >= -0.6 && y < -0.5) ||
      (Math.abs(Math.abs(x) - 0.55) < 0.08 && y > -0.6 && y < -0.3);
    return { hit, r: 0.3, g: 0.7, b: 0.3 };
  }, count, 200, 200);
}

function generateMissileFormation(count: number): DronePosition[] {
  return samplePointsFromShape((x, y) => {
    const bodyHit = Math.abs(x) < 0.08 && y > -0.7 && y < 0.5;
    const noseHit = y >= 0.5 && y < 0.8 && Math.abs(x) < 0.08 * (1 - (y - 0.5) / 0.3);
    const fin1 = y > -0.6 && y < -0.3 && x > 0.08 && x < 0.3 && Math.abs(y + 0.45) < (x - 0.08) * 1.5;
    const fin2 = y > -0.6 && y < -0.3 && x < -0.08 && x > -0.3 && Math.abs(y + 0.45) < (-x - 0.08) * 1.5;
    const flame = y <= -0.7 && y > -0.9 && Math.abs(x) < 0.06 * (1 - ((-0.7 - y) / 0.2));

    if (flame) return { hit: true, r: 1, g: 0.5, b: 0.1 };
    if (noseHit) return { hit: true, r: 0.9, g: 0.9, b: 0.95 };
    if (bodyHit || fin1 || fin2) return { hit: true, r: 0.6, g: 0.75, b: 0.9 };
    return { hit: false, r: 0, g: 0, b: 0 };
  }, count, 200, 200);
}

function generateKoreaFlagFormation(count: number): DronePosition[] {
  const points: DronePosition[] = [];
  const allocated = { circle: Math.floor(count * 0.55), bar: Math.floor(count * 0.45) };

  for (let i = 0; i < allocated.circle; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 10;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;

    const isUpper = (Math.cos(Math.PI / 4) * px + Math.sin(Math.PI / 4) * py) > 0;

    points.push({
      x: px,
      y: py + 45,
      z: (Math.random() - 0.5) * 2,
      r: isUpper ? 0.9 : 0.15,
      g: isUpper ? 0.15 : 0.25,
      b: isUpper ? 0.2 : 0.7,
    });
  }

  const barPositions = [
    { cx: -18, cy: 50, rot: Math.PI / 4 },
    { cx: 18, cy: 50, rot: Math.PI / 4 },
    { cx: -18, cy: 40, rot: Math.PI / 4 },
    { cx: 18, cy: 40, rot: Math.PI / 4 },
  ];

  const barsEach = Math.floor(allocated.bar / 4);
  for (const bar of barPositions) {
    for (let i = 0; i < barsEach; i++) {
      const lx = (Math.random() - 0.5) * 8;
      const ly = (Math.random() - 0.5) * 1.5;
      points.push({
        x: bar.cx + Math.cos(bar.rot) * lx - Math.sin(bar.rot) * ly,
        y: bar.cy + Math.sin(bar.rot) * lx + Math.cos(bar.rot) * ly,
        z: (Math.random() - 0.5) * 2,
        r: 0.1, g: 0.1, b: 0.1,
      });
    }
  }

  while (points.length < count) {
    points.push({
      x: (Math.random() - 0.5) * 5,
      y: 45 + (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 2,
      r: 0.9, g: 0.9, b: 0.9,
    });
  }

  return points.slice(0, count);
}

function generateScatterFormation(count: number): DronePosition[] {
  const points: DronePosition[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 35 + 5;
    const elevation = Math.random() * Math.PI - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * Math.cos(elevation) * r,
      y: Math.sin(elevation) * r * 0.5 + 45,
      z: Math.sin(angle) * Math.cos(elevation) * r * 0.3,
      r: 0.2 + Math.random() * 0.3,
      g: 0.4 + Math.random() * 0.4,
      b: 0.8 + Math.random() * 0.2,
    });
  }
  return points;
}

export function generateAllFormations(droneCount: number): Formation[] {
  return [
    {
      name: "scatter",
      nameKo: "집결",
      duration: 3000,
      transitionDuration: 2000,
      drones: generateScatterFormation(droneCount),
    },
    {
      name: "add-logo",
      nameKo: "ADD",
      duration: 5000,
      transitionDuration: 3000,
      drones: textToFormation("ADD", [0.2, 0.6, 1.0], droneCount),
    },
    {
      name: "star",
      nameKo: "별",
      duration: 4000,
      transitionDuration: 2500,
      drones: generateStarFormation(droneCount),
    },
    {
      name: "tank",
      nameKo: "전차",
      duration: 5000,
      transitionDuration: 3000,
      drones: generateTankFormation(droneCount),
    },
    {
      name: "missile",
      nameKo: "천궁 미사일",
      duration: 5000,
      transitionDuration: 3000,
      drones: generateMissileFormation(droneCount),
    },
    {
      name: "korea-flag",
      nameKo: "태극기",
      duration: 6000,
      transitionDuration: 3000,
      drones: generateKoreaFlagFormation(droneCount),
    },
    {
      name: "add-text",
      nameKo: "국방과학연구소",
      duration: 5000,
      transitionDuration: 3000,
      drones: textToFormation("ADD", [1.0, 0.85, 0.2], droneCount),
    },
    {
      name: "finale-scatter",
      nameKo: "피날레",
      duration: 4000,
      transitionDuration: 2000,
      drones: generateScatterFormation(droneCount),
    },
  ];
}
