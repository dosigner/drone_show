"use client";

function readAlpha(data, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return 0;
  }
  return data[(y * width + x) * 4 + 3];
}

export async function svgToPoints({ url, width = 400, height = 400, scale = 0.12, threshold = 10 }) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG: ${url}`);
  }

  const svgText = await response.text();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  const img = new Image();
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = objectUrl;
  });

  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = width / height;
  let drawW, drawH, drawX, drawY;
  if (imgAspect > canvasAspect) {
    drawW = width * 0.85;
    drawH = drawW / imgAspect;
    drawX = (width - drawW) / 2;
    drawY = (height - drawH) / 2;
  } else {
    drawH = height * 0.85;
    drawW = drawH * imgAspect;
    drawX = (width - drawW) / 2;
    drawY = (height - drawH) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  URL.revokeObjectURL(objectUrl);

  const { data } = ctx.getImageData(0, 0, width, height);

  const positions = [];
  const colors = [];
  const edgeIndices = [];

  for (let y2 = 0; y2 < height; y2 += 1) {
    for (let x2 = 0; x2 < width; x2 += 1) {
      const index = (y2 * width + x2) * 4;
      const alpha = data[index + 3];

      if (alpha <= threshold) {
        continue;
      }

      const leftAlpha = readAlpha(data, width, height, x2 - 1, y2);
      const rightAlpha = readAlpha(data, width, height, x2 + 1, y2);
      const topAlpha = readAlpha(data, width, height, x2, y2 - 1);
      const bottomAlpha = readAlpha(data, width, height, x2, y2 + 1);

      const isEdge =
        leftAlpha <= threshold ||
        rightAlpha <= threshold ||
        topAlpha <= threshold ||
        bottomAlpha <= threshold;

      const keepInterior = (x2 + y2) % 2 === 0;
      if (!isEdge && !keepInterior) {
        continue;
      }

      positions.push((x2 - width / 2) * scale, -(y2 - height / 2) * scale, 0);
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
