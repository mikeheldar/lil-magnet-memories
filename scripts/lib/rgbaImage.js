const zlib = require('zlib');

const SIZE = 1200;
const DEFAULT_CUTOUT = { x: 0.15, y: 0.15, width: 0.7, height: 0.7 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseColor(input, alpha = 255) {
  if (typeof input === 'object') return { ...input, a: input.a ?? alpha };
  const hex = String(input).replace('#', '');
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: alpha,
    };
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: alpha,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
    a: Math.round(lerp(c1.a, c2.a, t)),
  };
}

class RgbaImage {
  constructor(width = SIZE, height = SIZE) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4, 0);
  }

  idx(x, y) {
    return (y * this.width + x) * 4;
  }

  getPixel(x, y) {
    const i = this.idx(x, y);
    return {
      r: this.data[i],
      g: this.data[i + 1],
      b: this.data[i + 2],
      a: this.data[i + 3],
    };
  }

  setPixel(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = this.idx(x, y);
    const c = parseColor(color);
    const alpha = c.a / 255;
    if (alpha >= 1) {
      this.data[i] = c.r;
      this.data[i + 1] = c.g;
      this.data[i + 2] = c.b;
      this.data[i + 3] = 255;
      return;
    }
    const bg = {
      r: this.data[i],
      g: this.data[i + 1],
      b: this.data[i + 2],
      a: this.data[i + 3],
    };
    const outA = alpha + (bg.a / 255) * (1 - alpha);
    this.data[i] = Math.round((c.r * alpha + bg.r * (bg.a / 255) * (1 - alpha)) / outA);
    this.data[i + 1] = Math.round((c.g * alpha + bg.g * (bg.a / 255) * (1 - alpha)) / outA);
    this.data[i + 2] = Math.round((c.b * alpha + bg.b * (bg.a / 255) * (1 - alpha)) / outA);
    this.data[i + 3] = Math.round(outA * 255);
  }

  fill(color) {
    const c = parseColor(color);
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = c.r;
      this.data[i + 1] = c.g;
      this.data[i + 2] = c.b;
      this.data[i + 3] = c.a;
    }
  }

  fillRect(x, y, w, h, color) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, color);
      }
    }
  }

  fillCircle(cx, cy, radius, color) {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) this.setPixel(x, y, color);
      }
    }
  }

  fillRing(cx, cy, innerR, outerR, color) {
    const outer2 = outerR * outerR;
    const inner2 = innerR * innerR;
    for (let y = Math.floor(cy - outerR); y <= Math.ceil(cy + outerR); y++) {
      for (let x = Math.floor(cx - outerR); x <= Math.ceil(cx + outerR); x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 <= outer2 && d2 >= inner2) this.setPixel(x, y, color);
      }
    }
  }

  drawBorderGradient(colors, thickness = 0.18) {
    const t = thickness;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const nx = Math.min(x / this.width, 1 - x / this.width);
        const ny = Math.min(y / this.height, 1 - y / this.height);
        const edge = Math.min(nx, ny);
        if (edge > t) continue;
        const ratio = 1 - edge / t;
        const stops = colors.length - 1;
        const pos = ratio * stops;
        const idx = Math.min(Math.floor(pos), stops - 1);
        const localT = pos - idx;
        this.setPixel(x, y, lerpColor(parseColor(colors[idx]), parseColor(colors[idx + 1]), localT));
      }
    }
  }

  drawCornerBlocks(color, sizeRatio = 0.22, inset = 0.04) {
    const w = this.width;
    const h = this.height;
    const size = Math.round(w * sizeRatio);
    const insetPx = Math.round(w * inset);
    this.fillRect(insetPx, insetPx, size, size, color);
    this.fillRect(w - insetPx - size, insetPx, size, size, color);
    this.fillRect(insetPx, h - insetPx - size, size, size, color);
    this.fillRect(w - insetPx - size, h - insetPx - size, size, size, color);
  }

  drawDotBand(colors, bandRatio = 0.16, dotRadius = 10, spacing = 34) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const nx = Math.min(x / this.width, 1 - x / this.width);
        const ny = Math.min(y / this.height, 1 - y / this.height);
        if (Math.min(nx, ny) > bandRatio) continue;
        if (x % spacing < dotRadius * 2 && y % spacing < dotRadius * 2) {
          const color = colors[(x + y) % colors.length];
          this.fillCircle(x, y, dotRadius, color);
        }
      }
    }
  }

  drawDiagonalStripes(colorA, colorB, bandRatio = 0.2, stripeWidth = 24) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const nx = Math.min(x / this.width, 1 - x / this.width);
        const ny = Math.min(y / this.height, 1 - y / this.height);
        if (Math.min(nx, ny) > bandRatio) continue;
        const stripe = Math.floor((x + y) / stripeWidth) % 2 === 0;
        this.setPixel(x, y, stripe ? colorA : colorB);
      }
    }
  }

  drawStarScatter(colors, bandRatio = 0.18, count = 80) {
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand() * this.width);
      const y = Math.floor(rand() * this.height);
      const nx = Math.min(x / this.width, 1 - x / this.width);
      const ny = Math.min(y / this.height, 1 - y / this.height);
      if (Math.min(nx, ny) > bandRatio) continue;
      const color = colors[i % colors.length];
      const size = 6 + Math.floor(rand() * 10);
      this.fillCircle(x, y, size, color);
      this.fillRect(x - 1, y - size, 3, size * 2, color);
      this.fillRect(x - size, y - 1, size * 2, 3, color);
    }
  }

  drawHeartScatter(color, bandRatio = 0.17, count = 36) {
    let seed = 7;
    const rand = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    const drawHeart = (cx, cy, scale) => {
      for (let dy = -scale; dy <= scale; dy++) {
        for (let dx = -scale; dx <= scale; dx++) {
          const nx = dx / scale;
          const ny = dy / scale;
          const v = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * Math.pow(ny, 3);
          if (v <= 0) this.setPixel(cx + dx, cy + dy, color);
        }
      }
    };
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand() * this.width);
      const y = Math.floor(rand() * this.height);
      const nx = Math.min(x / this.width, 1 - x / this.width);
      const ny = Math.min(y / this.height, 1 - y / this.height);
      if (Math.min(nx, ny) > bandRatio) continue;
      drawHeart(x, y, 8 + Math.floor(rand() * 6));
    }
  }

  drawLeafScatter(colors, bandRatio = 0.18, count = 48) {
    let seed = 99;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand() * this.width);
      const y = Math.floor(rand() * this.height);
      const nx = Math.min(x / this.width, 1 - x / this.width);
      const ny = Math.min(y / this.height, 1 - y / this.height);
      if (Math.min(nx, ny) > bandRatio) continue;
      const color = colors[i % colors.length];
      for (let t = 0; t < 1; t += 0.05) {
        const px = x + Math.cos(t * Math.PI * 2) * 14 * t;
        const py = y + Math.sin(t * Math.PI * 2) * 10 * t;
        this.fillCircle(px, py, 4, color);
      }
    }
  }

  fillCenterPanel(color, insetRatio = 0.12) {
    const inset = Math.round(this.width * insetRatio);
    this.fillRect(inset, inset, this.width - inset * 2, this.height - inset * 2, color);
  }

  punchCutout(cutout = DEFAULT_CUTOUT) {
    const x0 = Math.round(cutout.x * this.width);
    const y0 = Math.round(cutout.y * this.height);
    const w = Math.round(cutout.width * this.width);
    const h = Math.round(cutout.height * this.height);
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
        const i = this.idx(x, y);
        this.data[i + 3] = 0;
      }
    }
  }

  clone() {
    const copy = new RgbaImage(this.width, this.height);
    this.data.copy(copy.data);
    return copy;
  }

  toPngBuffer() {
    const stride = this.width * 4 + 1;
    const raw = Buffer.alloc(stride * this.height);
    for (let y = 0; y < this.height; y++) {
      raw[y * stride] = 0;
      this.data.copy(raw, y * stride + 1, y * this.width * 4, (y + 1) * this.width * 4);
    }
    const compressed = zlib.deflateSync(raw);

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    return Buffer.concat([
      signature,
      pngChunk('IHDR', ihdr),
      pngChunk('IDAT', compressed),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function bakeFrameOverlay(sourceImage, cutout = DEFAULT_CUTOUT) {
  const overlay = sourceImage.clone();
  overlay.punchCutout(cutout);
  return overlay;
}

module.exports = {
  SIZE,
  DEFAULT_CUTOUT,
  RgbaImage,
  parseColor,
  bakeFrameOverlay,
};
