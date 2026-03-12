import fs from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(publicDir, "formations", "generated");

const files = [
  { input: "창조관 형상.png", output: "changjogwan-base.json", scale: 0.16 },
  { input: "SAR위성.png", output: "sar.json", scale: 0.14 },
  { input: "K9자주포.png", output: "k9.json", scale: 0.14 },
  { input: "천궁2.png", output: "cheongung2.json", scale: 0.14 },
  { input: "창조관 형상2.png", output: "changjogwan-2.json", scale: 0.14 },
  { input: "창조관 형상3.png", output: "changjogwan-3.json", scale: 0.14 },
  { input: "ADD로고.png", output: "add-logo.json", scale: 0.14 },
];

const ALPHA_THRESHOLD = 18;

function readAlpha(data, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return 0;
  }

  return data[(y * width + x) * 4 + 3];
}

function resizeNearest(source, width, height, targetWidth, targetHeight) {
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor((x / targetWidth) * width));
      const sourceY = Math.min(height - 1, Math.floor((y / targetHeight) * height));
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const targetIndex = (y * targetWidth + x) * 4;

      output[targetIndex] = source[sourceIndex];
      output[targetIndex + 1] = source[sourceIndex + 1];
      output[targetIndex + 2] = source[sourceIndex + 2];
      output[targetIndex + 3] = source[sourceIndex + 3];
    }
  }

  return output;
}

async function convertFile({ input, output, scale }) {
  const inputPath = path.join(publicDir, input);
  const buffer = await fs.readFile(inputPath);
  const png = PNG.sync.read(buffer);

  const resizeRatio = Math.min(1, 320 / Math.max(png.width, png.height));
  const width = Math.max(1, Math.round(png.width * resizeRatio));
  const height = Math.max(1, Math.round(png.height * resizeRatio));
  const resized = resizeNearest(png.data, png.width, png.height, width, height);

  const positions = [];
  const colors = [];
  const edgeIndices = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = resized[index + 3];

      if (alpha <= ALPHA_THRESHOLD) {
        continue;
      }

      const leftAlpha = readAlpha(resized, width, height, x - 1, y);
      const rightAlpha = readAlpha(resized, width, height, x + 1, y);
      const topAlpha = readAlpha(resized, width, height, x, y - 1);
      const bottomAlpha = readAlpha(resized, width, height, x, y + 1);

      const isEdge =
        leftAlpha <= ALPHA_THRESHOLD ||
        rightAlpha <= ALPHA_THRESHOLD ||
        topAlpha <= ALPHA_THRESHOLD ||
        bottomAlpha <= ALPHA_THRESHOLD;

      const keepInterior = (x + y) % 2 === 0;
      if (!isEdge && !keepInterior) {
        continue;
      }

      positions.push((x - width / 2) * scale, -(y - height / 2) * scale, 0);
      colors.push(resized[index] / 255, resized[index + 1] / 255, resized[index + 2] / 255);

      if (isEdge) {
        edgeIndices.push(positions.length / 3 - 1);
      }
    }
  }

  await fs.writeFile(
    path.join(outputDir, output),
    JSON.stringify({ positions, colors, edgeIndices })
  );
}

await fs.mkdir(outputDir, { recursive: true });

for (const file of files) {
  await convertFile(file);
}

console.log(`Generated ${files.length} formation files in ${outputDir}`);
