// Draws placeholder state images (RGBA PNG, transparent background) into assets/test/
// Run: node tools/make-test-images.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 852;
const H = 393;
const outDir = path.join(__dirname, "..", "assets", "test");

// Seeded random so the images are the same every run
let seed = 7;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function newCanvas() {
  return new Float32Array(W * H * 4); // premultiplied RGBA, 0..1
}

// Composite a colour with alpha a over pixel (x, y)
function over(c, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  const i = (y * W + x) * 4;
  const k = 1 - a;
  c[i] = r * a + c[i] * k;
  c[i + 1] = g * a + c[i + 1] * k;
  c[i + 2] = b * a + c[i + 2] * k;
  c[i + 3] = a + c[i + 3] * k;
}

// Soft round blob: alpha fades from `alpha` at the centre to 0 at radius
function blob(c, cx, cy, radius, rgb, alpha, power) {
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d < 1) over(c, x, y, rgb[0], rgb[1], rgb[2], alpha * Math.pow(1 - d, power));
    }
  }
}

// Line with soft edge
function streak(c, x0, y0, x1, y1, width, rgb, alpha) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(len);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const fade = Math.sin(Math.PI * t); // thin ends
    blob(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width, rgb, alpha * fade, 1);
  }
}

function makeSun() {
  const c = newCanvas();
  blob(c, W / 2, H / 2, 330, [1, 0.62, 0], 0.55, 2.2);
  blob(c, W / 2, H / 2, 120, [1, 0.8, 0.2], 0.9, 0.6);
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    streak(c, W / 2 + Math.cos(ang) * 150, H / 2 + Math.sin(ang) * 150,
      W / 2 + Math.cos(ang) * 260, H / 2 + Math.sin(ang) * 260, 4, [1, 0.8, 0.3], 0.5);
  }
  return c;
}

function makeClouds() {
  const c = newCanvas();
  const puffs = [[170, 120, 1.0], [420, 90, 1.3], [680, 140, 1.0], [300, 290, 1.2], [600, 300, 1.1]];
  puffs.forEach(function(p) {
    for (let i = 0; i < 9; i++) {
      blob(c, p[0] + (rand() - 0.5) * 160 * p[2], p[1] + (rand() - 0.5) * 50 * p[2],
        (60 + rand() * 40) * p[2], [0.78, 0.8, 0.85], 0.28, 1.4);
    }
  });
  return c;
}

function makeRain() {
  const c = newCanvas();
  for (let i = 0; i < 140; i++) {
    const x = rand() * (W + 100);
    const y = rand() * H;
    const len = 30 + rand() * 40;
    streak(c, x, y, x - len * 0.25, y + len, 1.6, [0.6, 0.8, 1], 0.55 + rand() * 0.3);
  }
  return c;
}

function makeSnow() {
  const c = newCanvas();
  for (let i = 0; i < 110; i++) {
    const r = 3 + rand() * 7;
    blob(c, rand() * W, rand() * H, r, [1, 1, 1], 0.8, 0.5);
  }
  return c;
}

function makeNight() {
  const c = newCanvas();
  for (let i = 0; i < 90; i++) {
    blob(c, rand() * W, rand() * H, 2 + rand() * 3, [0.85, 0.85, 1], 0.9, 0.7);
  }
  // Moon: glow plus a bright disc with a bite taken out
  blob(c, 640, 120, 150, [0.5, 0.5, 1], 0.35, 2);
  blob(c, 640, 120, 62, [0.95, 0.95, 1], 1, 0.15);
  for (let y = 40; y < 200; y++) {
    for (let x = 560; x < 720; x++) {
      if (Math.hypot(x - 662, y - 105) < 56) {
        const i = (y * W + x) * 4;
        c[i] = c[i + 1] = c[i + 2] = c[i + 3] = 0;
      }
    }
  }
  blob(c, 640, 120, 150, [0.5, 0.5, 1], 0.12, 2);
  return c;
}

// ---- PNG writer (RGBA, no dependencies) ----
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let v = n;
  for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
  crcTable[n] = v >>> 0;
}
function crc32(buf) {
  let v = 0xffffffff;
  for (const byte of buf) v = crcTable[(v ^ byte) & 255] ^ (v >>> 8);
  return (v ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(file, c) {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = c[i + 3];
      const o = y * (W * 4 + 1) + 1 + x * 4;
      // Un-premultiply for PNG
      raw[o] = a > 0 ? Math.min(255, Math.round((c[i] / a) * 255)) : 0;
      raw[o + 1] = a > 0 ? Math.min(255, Math.round((c[i + 1] / a) * 255)) : 0;
      raw[o + 2] = a > 0 ? Math.min(255, Math.round((c[i + 2] / a) * 255)) : 0;
      raw[o + 3] = Math.min(255, Math.round(a * 255));
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(W, 0);
  head.writeUInt32BE(H, 4);
  head[8] = 8;
  head[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", head),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

fs.mkdirSync(outDir, { recursive: true });
const makers = { sun: makeSun, clouds: makeClouds, rain: makeRain, snow: makeSnow, night: makeNight };
Object.keys(makers).forEach(function(name) {
  writePng(path.join(outDir, name + ".png"), makers[name]());
  console.log("wrote " + name + ".png");
});
