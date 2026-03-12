"use client";

function readAlpha(data, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return 0;
  }

  return data[(y * width + x) * 4 + 3];
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHexagon(ctx, cx, cy, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI / 3) * i;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function sampleCanvas(draw, { width = 360, height = 360, scale = 0.12, threshold = 10 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  draw(ctx, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const positions = [];
  const colors = [];
  const edgeIndices = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];

      if (alpha <= threshold) {
        continue;
      }

      const leftAlpha = readAlpha(data, width, height, x - 1, y);
      const rightAlpha = readAlpha(data, width, height, x + 1, y);
      const topAlpha = readAlpha(data, width, height, x, y - 1);
      const bottomAlpha = readAlpha(data, width, height, x, y + 1);

      const isEdge =
        leftAlpha <= threshold ||
        rightAlpha <= threshold ||
        topAlpha <= threshold ||
        bottomAlpha <= threshold;

      const keepInterior = (x + y) % 2 === 0;
      if (!isEdge && !keepInterior) {
        continue;
      }

      positions.push((x - width / 2) * scale, -(y - height / 2) * scale, 0);
      colors.push(data[index] / 255, data[index + 1] / 255, data[index + 2] / 255);

      if (isEdge) {
        edgeIndices.push(positions.length / 3 - 1);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    edgeIndices,
  };
}

function createSatelliteCloud() {
  return sampleCanvas((ctx, width, height) => {
    ctx.fillStyle = "#8ad8ff";
    roundedRectPath(ctx, width * 0.38, height * 0.28, width * 0.24, height * 0.42, 18);
    ctx.fill();

    ctx.fillStyle = "#53a6ff";
    ctx.fillRect(width * 0.14, height * 0.34, width * 0.2, height * 0.28);
    ctx.fillRect(width * 0.66, height * 0.34, width * 0.2, height * 0.28);

    ctx.strokeStyle = "#d8fbff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.7);
    ctx.lineTo(width * 0.5, height * 0.84);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.9, width * 0.08, Math.PI, Math.PI * 2);
    ctx.stroke();
  }, { width: 420, height: 420, scale: 0.12 });
}

function createShieldCloud() {
  return sampleCanvas((ctx, width, height) => {
    ctx.fillStyle = "#78f1c3";
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.12);
    ctx.lineTo(width * 0.77, height * 0.22);
    ctx.lineTo(width * 0.72, height * 0.62);
    ctx.quadraticCurveTo(width * 0.64, height * 0.82, width * 0.5, height * 0.9);
    ctx.quadraticCurveTo(width * 0.36, height * 0.82, width * 0.28, height * 0.62);
    ctx.lineTo(width * 0.23, height * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d8fbff";
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.22);
    ctx.lineTo(width * 0.57, height * 0.46);
    ctx.lineTo(width * 0.79, height * 0.46);
    ctx.lineTo(width * 0.61, height * 0.6);
    ctx.lineTo(width * 0.68, height * 0.82);
    ctx.lineTo(width * 0.5, height * 0.68);
    ctx.lineTo(width * 0.32, height * 0.82);
    ctx.lineTo(width * 0.39, height * 0.6);
    ctx.lineTo(width * 0.21, height * 0.46);
    ctx.lineTo(width * 0.43, height * 0.46);
    ctx.closePath();
    ctx.fill();
  }, { width: 400, height: 400, scale: 0.12 });
}

function createRocketCloud() {
  return sampleCanvas((ctx, width, height) => {
    ctx.fillStyle = "#f4b86a";
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.08);
    ctx.quadraticCurveTo(width * 0.64, height * 0.2, width * 0.62, height * 0.5);
    ctx.lineTo(width * 0.62, height * 0.72);
    ctx.lineTo(width * 0.38, height * 0.72);
    ctx.lineTo(width * 0.38, height * 0.5);
    ctx.quadraticCurveTo(width * 0.36, height * 0.2, width * 0.5, height * 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d8fbff";
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.35, width * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7da7ff";
    ctx.beginPath();
    ctx.moveTo(width * 0.38, height * 0.56);
    ctx.lineTo(width * 0.22, height * 0.72);
    ctx.lineTo(width * 0.38, height * 0.72);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width * 0.62, height * 0.56);
    ctx.lineTo(width * 0.78, height * 0.72);
    ctx.lineTo(width * 0.62, height * 0.72);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#6cf0ff";
    ctx.beginPath();
    ctx.moveTo(width * 0.45, height * 0.72);
    ctx.lineTo(width * 0.55, height * 0.72);
    ctx.lineTo(width * 0.61, height * 0.9);
    ctx.lineTo(width * 0.39, height * 0.9);
    ctx.closePath();
    ctx.fill();
  }, { width: 440, height: 440, scale: 0.12 });
}

function createDroneCloud() {
  return sampleCanvas((ctx, width, height) => {
    ctx.strokeStyle = "#8cbcff";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(width * 0.34, height * 0.34);
    ctx.lineTo(width * 0.66, height * 0.66);
    ctx.moveTo(width * 0.66, height * 0.34);
    ctx.lineTo(width * 0.34, height * 0.66);
    ctx.stroke();

    ctx.fillStyle = "#d8fbff";
    roundedRectPath(ctx, width * 0.38, height * 0.38, width * 0.24, height * 0.24, 18);
    ctx.fill();

    ctx.strokeStyle = "#5ae2ff";
    ctx.lineWidth = 10;
    [
      [0.24, 0.24],
      [0.76, 0.24],
      [0.24, 0.76],
      [0.76, 0.76],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(width * x, height * y, width * 0.09, 0, Math.PI * 2);
      ctx.stroke();
    });
  }, { width: 420, height: 420, scale: 0.12 });
}

function createHexCoreCloud() {
  return sampleCanvas((ctx, width, height) => {
    ctx.strokeStyle = "#ba8cff";
    ctx.lineWidth = 12;
    drawHexagon(ctx, width * 0.5, height * 0.5, width * 0.28);
    ctx.stroke();

    ctx.strokeStyle = "#d8fbff";
    ctx.lineWidth = 10;
    drawHexagon(ctx, width * 0.5, height * 0.5, width * 0.18);
    ctx.stroke();

    ctx.fillStyle = "#6cf0ff";
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }, { width: 380, height: 380, scale: 0.12 });
}

function createAddCloud() {
  return sampleCanvas((ctx, width, height) => {
    ctx.fillStyle = "#9be7ff";
    ctx.font = "bold 176px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ADD", width * 0.5, height * 0.52);

    ctx.fillStyle = "#5b9dff";
    ctx.font = "bold 42px Arial";
    ctx.fillText("DRONE", width * 0.5, height * 0.82);
  }, { width: 420, height: 280, scale: 0.12 });
}

function createBaseCloud() {
  return sampleCanvas((ctx, width, height) => {
    ctx.strokeStyle = "#3ea5ff";
    ctx.lineWidth = 10;
    roundedRectPath(ctx, width * 0.1, height * 0.18, width * 0.8, height * 0.52, 22);
    ctx.stroke();

    ctx.strokeStyle = "#67d5ff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(width * 0.18, height * 0.7);
    ctx.lineTo(width * 0.82, height * 0.7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.22, height * 0.28);
    ctx.lineTo(width * 0.78, height * 0.28);
    ctx.moveTo(width * 0.22, height * 0.44);
    ctx.lineTo(width * 0.78, height * 0.44);
    ctx.moveTo(width * 0.22, height * 0.58);
    ctx.lineTo(width * 0.78, height * 0.58);
    ctx.stroke();
  });
}

export function createVectorFormations() {
  return {
    base: createBaseCloud(),
    satellite: createSatelliteCloud(),
    shield: createShieldCloud(),
    rocket: createRocketCloud(),
    drone: createDroneCloud(),
    hex: createHexCoreCloud(),
    add: createAddCloud(),
  };
}
