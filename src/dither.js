// Ordered Bayer dither. Same matrix, threshold, and quantize as the Figma
// shader (Bayer 4x4 / 8x8, pixelSize 1). The official runtime is React and
// WebGPU, so this vanilla page runs that math on a canvas.

function bayerMatrix(n) {
  if (n === 1) return [[0]];
  const small = bayerMatrix(n / 2);
  const m = n / 2;
  const out = [];
  for (let y = 0; y < n; y += 1) {
    out[y] = new Array(n);
    for (let x = 0; x < n; x += 1) {
      const v = small[y % m][x % m] * 4;
      const qx = Math.floor(x / m);
      const qy = Math.floor(y / m);
      let qoff = 1;
      if (qy === 0 && qx === 0) qoff = 0;
      else if (qy === 0 && qx === 1) qoff = 2;
      else if (qy === 1 && qx === 0) qoff = 3;
      out[y][x] = v + qoff;
    }
  }
  return out;
}

function flattenBayer(n) {
  const matrix = bayerMatrix(n);
  const data = new Float32Array(n * n);
  const denom = n * n;
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      data[y * n + x] = (matrix[y][x] + 0.5) / denom;
    }
  }
  return data;
}

const tiles = {
  4: flattenBayer(4),
  8: flattenBayer(8),
};

function quantize(channel, threshold, levels) {
  const steps = levels - 1;
  const offset = (threshold - 0.5) / steps;
  const q = Math.round((channel + offset) * steps) / steps;
  if (q < 0) return 0;
  if (q > 1) return 1;
  return q;
}

function coverRect(sw, sh, dw, dh) {
  const scale = Math.max(dw / sw, dh / sh);
  const width = sw * scale;
  const height = sh * scale;
  return { x: (dw - width) / 2, y: (dh - height) / 2, width, height };
}

export function paintDither(img, canvas, params) {
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const cover = coverRect(img.naturalWidth, img.naturalHeight, width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, cover.x, cover.y, cover.width, cover.height);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const tile = tiles[params.tile];
  const tileSize = params.tile;
  const { levels, contrast } = params;
  const bright = (params.brightness - 100) / 200;
  for (let y = 0; y < height; y += 1) {
    const row = (y % tileSize) * tileSize;
    for (let x = 0; x < width; x += 1) {
      const threshold = tile[row + (x % tileSize)];
      const i = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        let value = data[i + channel] / 255;
        value = (value - 0.5) * contrast + 0.5 + bright;
        if (value < 0) value = 0;
        else if (value > 1) value = 1;
        data[i + channel] = Math.round(quantize(value, threshold, levels) * 255);
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}
