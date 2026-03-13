export async function imageToPoints({
  url,
  threshold = 20,
  scale = 0.12,
  maxDimension = 220,
}) {
  const image = await new Promise((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    nextImage.src = url;
  });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(`Canvas 2D context unavailable for ${url}`);
  }

  const resizeRatio = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * resizeRatio));
  const height = Math.max(1, Math.round(image.height * resizeRatio));
  const sampleStep = Math.max(1, Math.floor(Math.max(width, height) / 150));

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);
  const positions = [];
  const colors = [];

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha <= threshold) {
        continue;
      }
      positions.push((x - width / 2) * scale, -(y - height / 2) * scale, 0);
      colors.push(data[index] / 255, data[index + 1] / 255, data[index + 2] / 255);
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
  };
}

function computeDepthForPoint(nx, ny, depthCurve, depthStrength) {
  if (depthCurve === "flat") {
    return 0;
  }

  const distFromCenter = Math.sqrt(nx * nx + ny * ny);

  if (depthCurve === "sphere") {
    const r = Math.min(1, distFromCenter);
    return Math.sqrt(Math.max(0, 1 - r * r)) * depthStrength;
  }

  if (depthCurve === "cylinder") {
    const r = Math.min(1, Math.abs(nx));
    return Math.sqrt(Math.max(0, 1 - r * r)) * depthStrength;
  }

  const r = Math.min(1, distFromCenter);
  return (1 - r * r) * depthStrength * 0.6;
}

export function fitPointCloud(pointCloud, count, options = {}) {
  const {
    offset = [0, 0, 0],
    depth = 1,
    tint = [1, 1, 1],
    glow = 1.25,
    spread = 0.18,
    edgeBias = 0.5,
    depthCurve = "sphere",
    depthStrength = 4.5,
    useSourceDepth = false,
    sourceDepthScale = 1,
  } = options;

  const sourceCount = Math.max(1, pointCloud.positions.length / 3);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const edgeIndices = pointCloud.edgeIndices ?? [];
  const edgeMask = new Uint8Array(sourceCount);

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < sourceCount; i += 1) {
    const px = pointCloud.positions[i * 3];
    const py = pointCloud.positions[i * 3 + 1];
    const pz = pointCloud.positions[i * 3 + 2] ?? 0;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
    if (pz < minZ) minZ = pz;
    if (pz > maxZ) maxZ = pz;
  }
  const rangeX = Math.max(0.01, maxX - minX);
  const rangeY = Math.max(0.01, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  for (let i = 0; i < edgeIndices.length; i += 1) {
    const edgeIndex = edgeIndices[i];
    if (edgeIndex >= 0 && edgeIndex < sourceCount) {
      edgeMask[edgeIndex] = 1;
    }
  }

  const fillIndices = [];
  for (let i = 0; i < sourceCount; i += 1) {
    if (!edgeMask[i]) {
      fillIndices.push(i);
    }
  }

  function copyPoint(sourceIndex, targetIndex) {
    const baseIndex = sourceIndex * 3;
    const pointIndex = targetIndex * 3;
    const jitter = ((targetIndex * 16807) % 2147483647) / 2147483647 - 0.5;
    const wobble = ((targetIndex * 48271) % 2147483647) / 2147483647 - 0.5;

    const srcX = pointCloud.positions[baseIndex];
    const srcY = pointCloud.positions[baseIndex + 1];
    const srcZ = pointCloud.positions[baseIndex + 2] ?? 0;

    const nx = (srcX - centerX) / (rangeX * 0.5);
    const ny = (srcY - centerY) / (rangeY * 0.5);

    const curvedZ = useSourceDepth
      ? (srcZ - centerZ) * sourceDepthScale
      : computeDepthForPoint(nx, ny, depthCurve, depthStrength);
    const edgeOffset = edgeMask[sourceIndex] ? -0.3 : 0;
    const randomZ = (((targetIndex * 69621) % 2147483647) / 2147483647 - 0.5) * depth;

    positions[pointIndex] = srcX + offset[0] + jitter * spread;
    positions[pointIndex + 1] = srcY + offset[1] + wobble * spread;
    positions[pointIndex + 2] = offset[2] + curvedZ + edgeOffset + randomZ;

    colors[pointIndex] = Math.min(1.8, pointCloud.colors[baseIndex] * tint[0] * glow);
    colors[pointIndex + 1] = Math.min(1.8, pointCloud.colors[baseIndex + 1] * tint[1] * glow);
    colors[pointIndex + 2] = Math.min(1.8, pointCloud.colors[baseIndex + 2] * tint[2] * glow);
  }

  function distributeFromPool(pool, amount, startAt) {
    if (!pool.length || amount <= 0) {
      return startAt;
    }
    for (let i = 0; i < amount; i += 1) {
      const sampleIndex = Math.floor(((i + 0.5) / amount) * pool.length);
      copyPoint(pool[Math.min(pool.length - 1, sampleIndex)], startAt + i);
    }
    return startAt + amount;
  }

  if (sourceCount >= count) {
    const requestedEdgeCount = Math.round(count * edgeBias);
    const edgeCount = Math.min(edgeIndices.length, requestedEdgeCount);
    const fillCount = count - edgeCount;
    let cursor = 0;
    cursor = distributeFromPool(edgeIndices, edgeCount, cursor);
    distributeFromPool(fillIndices.length ? fillIndices : edgeIndices, fillCount, cursor);
    return { positions, colors };
  }

  for (let i = 0; i < count; i += 1) {
    const sourceIndex = i < sourceCount ? i : Math.floor(((i - sourceCount) / Math.max(1, count - sourceCount)) * sourceCount);
    copyPoint(Math.min(sourceCount - 1, sourceIndex), i);
  }

  return { positions, colors };
}
