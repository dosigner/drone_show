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

export function fitPointCloud(pointCloud, count, options = {}) {
  const {
    offset = [0, 0, 0],
    depth = 1,
    tint = [1, 1, 1],
    glow = 1.25,
    spread = 0.18,
    edgeBias = 0.5,
  } = options;

  const sourceCount = Math.max(1, pointCloud.positions.length / 3);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const edgeIndices = pointCloud.edgeIndices ?? [];
  const edgeMask = new Uint8Array(sourceCount);

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

    positions[pointIndex] = pointCloud.positions[baseIndex] + offset[0] + jitter * spread;
    positions[pointIndex + 1] = pointCloud.positions[baseIndex + 1] + offset[1] + wobble * spread;
    positions[pointIndex + 2] =
      offset[2] + (((targetIndex * 69621) % 2147483647) / 2147483647 - 0.5) * depth;

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
