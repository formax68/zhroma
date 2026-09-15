// Brand asset generator (05-03). Developer tooling only: nothing here ships
// inside the extension, and nothing here is imported by extension runtime code.
//
// The store requires a 128x128 packaged/brand icon and a 440x280 small
// promotional tile. This project has no build step and no image dependency, so
// both are drawn here with Node built-ins alone — a supersampled scanline
// rasterizer and a hand-rolled PNG encoder (zlib is the only thing borrowed).
//
// The artwork follows D-06: a simple Z with a restrained priority-colour
// accent. The Z's lower bar carries the four palette hues in their ROADMAP
// order — Urgent, High, Normal, Low — read straight from `extension/zhroma.css`
// so the brand can never drift from the tint the product actually paints. The
// five diagnostic status icons are a separate, unchanged set: brand identity
// and runtime state are deliberately different artwork.
//
// Usage: node scripts/make-brand-assets.js [--out-dir <dir>]
// Default output is the repository itself: extension/icons/brand.png and
// release/assets/promo.png. Regenerating is expected to be byte-reproducible.
import { deflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SUPERSAMPLE = 4;

// --- palette ---------------------------------------------------------------

/**
 * The four priority hues, in ROADMAP order, parsed out of the shipped
 * stylesheet. The alphas there are deliberately low because they sit behind
 * ticket text; the brand uses the hues at full strength, which is why only the
 * `rgb(r g b / a)` triple is taken.
 */
export function priorityHues(css = readFileSync(join(REPOSITORY_ROOT, 'extension/zhroma.css'), 'utf8')) {
  const order = ['Urgent', 'High', 'Normal', 'Low'];
  return order.map((label) => {
    const rule = css.match(new RegExp(
      `data-zhroma-priority="${label}"[\\s\\S]*?background-color: rgb\\((\\d+) (\\d+) (\\d+) /`, 'u'));
    if (!rule) throw new Error(`Priority hue could not be read from the stylesheet: ${label}`);
    return [Number(rule[1]), Number(rule[2]), Number(rule[3]), 255];
  });
}

const TILE = [31, 42, 56, 255];        // slate ground: dark enough to carry white, light enough to read on black
const TILE_RIM = [255, 255, 255, 38];  // a hairline so the tile still has an edge on a dark store page
const INK = [248, 250, 252, 255];      // the Z itself
const PROMO_GROUND = [11, 18, 32, 255];

// --- rasterizer ------------------------------------------------------------

const canvas = (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) });

/** Source-over composite of one colour into one pixel. */
function blend(target, index, [r, g, b, a]) {
  if (a <= 0) return;
  const alpha = a / 255;
  const under = target.data[index + 3] / 255;
  const out = alpha + under * (1 - alpha);
  if (out <= 0) { target.data[index + 3] = 0; return; }
  for (let channel = 0; channel < 3; channel += 1) {
    const source = [r, g, b][channel];
    target.data[index + channel] = (source * alpha + target.data[index + channel] * under * (1 - alpha)) / out;
  }
  target.data[index + 3] = out * 255;
}

/**
 * Fill every pixel whose centre satisfies `inside`, bounded by `box`.
 * Shapes are predicates rather than paths, so a union is just an `||` and the
 * whole rasterizer stays under a screenful.
 */
function fill(target, box, inside, colour) {
  const x0 = Math.max(0, Math.floor(box[0]));
  const y0 = Math.max(0, Math.floor(box[1]));
  const x1 = Math.min(target.width, Math.ceil(box[2]));
  const y1 = Math.min(target.height, Math.ceil(box[3]));
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      if (inside(x + 0.5, y + 0.5)) blend(target, (y * target.width + x) * 4, colour);
    }
  }
}

/** Box-downsample the supersampled canvas back to its nominal size. */
function downsample(source, factor) {
  const out = canvas(source.width / factor, source.height / factor);
  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let dy = 0; dy < factor; dy += 1) {
        for (let dx = 0; dx < factor; dx += 1) {
          const index = ((y * factor + dy) * source.width + (x * factor + dx)) * 4;
          const alpha = source.data[index + 3] / 255;
          for (let channel = 0; channel < 3; channel += 1) totals[channel] += source.data[index + channel] * alpha;
          totals[3] += alpha;
        }
      }
      const index = (y * out.width + x) * 4;
      if (totals[3] > 0) for (let channel = 0; channel < 3; channel += 1) out.data[index + channel] = totals[channel] / totals[3];
      out.data[index + 3] = (totals[3] / (factor * factor)) * 255;
    }
  }
  return out;
}

// --- shape predicates ------------------------------------------------------

const rect = (x, y, w, h) => ({
  box: [x, y, x + w, y + h],
  inside: (px, py) => px >= x && px < x + w && py >= y && py < y + h,
});

function roundedRect(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  return {
    box: [x, y, x + w, y + h],
    inside: (px, py) => {
      if (px < x || px >= x + w || py < y || py >= y + h) return false;
      const cx = Math.min(Math.max(px, x + r), x + w - r);
      const cy = Math.min(Math.max(py, y + r), y + h - r);
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    },
  };
}

/** A band of constant perpendicular width around the segment a->b. */
function segment([ax, ay], [bx, by], width) {
  const half = width / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy || 1;
  return {
    box: [Math.min(ax, bx) - half, Math.min(ay, by) - half, Math.max(ax, bx) + half, Math.max(ay, by) + half],
    inside: (px, py) => {
      const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
      return (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2 <= half * half;
    },
  };
}

/** An elliptical ring: outer radii (rx, ry), stroke `width` inward. */
function ring(cx, cy, rx, ry, width) {
  const ix = rx - width;
  const iy = ry - width;
  return {
    box: [cx - rx, cy - ry, cx + rx, cy + ry],
    inside: (px, py) => {
      const outside = ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
      const hollow = ix > 0 && iy > 0 && ((px - cx) / ix) ** 2 + ((py - cy) / iy) ** 2 < 1;
      return outside && !hollow;
    },
  };
}

const union = (...shapes) => ({
  box: [Math.min(...shapes.map((s) => s.box[0])), Math.min(...shapes.map((s) => s.box[1])),
    Math.max(...shapes.map((s) => s.box[2])), Math.max(...shapes.map((s) => s.box[3]))],
  inside: (px, py) => shapes.some((shape) => shape.inside(px, py)),
});

const paint = (target, shape, colour) => fill(target, shape.box, shape.inside, colour);

/** Restrict a shape to a vertical slice — how the accent bar is split by hue. */
const clipX = (shape, from, to) => ({
  box: [Math.max(shape.box[0], from), shape.box[1], Math.min(shape.box[2], to), shape.box[3]],
  inside: (px, py) => px >= from && px < to && shape.inside(px, py),
});

// --- the mark --------------------------------------------------------------

/**
 * The Z, as three strokes in a box. The lower bar is returned separately
 * because it is the piece that carries the priority hues.
 */
function zStrokes(x, y, w, h, weight) {
  const top = rect(x, y, w, weight);
  const bottom = rect(x, y + h - weight, w, weight);
  const diagonal = segment([x + w - weight / 2, y + weight * 0.7],
    [x + weight / 2, y + h - weight * 0.7], weight * 0.94);
  return { top, bottom, diagonal };
}

/**
 * The brand tile: a slate rounded square carrying a white Z whose lower bar is
 * the four priority hues. Drawn in a 96-unit artwork box so the 128px icon can
 * keep the 16px transparent margin the store guidance asks for.
 */
function drawMark(target, x, y, size, hues) {
  const radius = size * 0.23;
  const tile = roundedRect(x, y, size, size, radius);
  paint(target, tile, TILE);
  paint(target, {
    box: tile.box,
    inside: (px, py) => tile.inside(px, py)
      && !roundedRect(x + size * 0.022, y + size * 0.022, size * 0.956, size * 0.956, radius - size * 0.022).inside(px, py),
  }, TILE_RIM);

  const boxX = x + size * 0.245;
  const boxY = y + size * 0.255;
  const boxW = size * 0.51;
  const boxH = size * 0.49;
  const weight = size * 0.105;
  const { top, bottom, diagonal } = zStrokes(boxX, boxY, boxW, boxH, weight);
  paint(target, union(top, diagonal), INK);
  for (const [index, hue] of hues.entries()) {
    paint(target, clipX(bottom, boxX + (boxW * index) / hues.length, boxX + (boxW * (index + 1)) / hues.length), hue);
  }
}

// --- the wordmark ----------------------------------------------------------

/**
 * Geometric capitals, built from the same primitives as the mark. Only the six
 * letters of the product name exist — this is a wordmark, not a font.
 */
function glyph(letter, x, y, w, h, weight) {
  const right = x + w;
  const bottom = y + h;
  const half = weight / 2;
  switch (letter) {
    case 'Z': {
      const strokes = zStrokes(x, y, w, h, weight);
      return union(strokes.top, strokes.diagonal, strokes.bottom);
    }
    case 'H':
      return union(rect(x, y, weight, h), rect(right - weight, y, weight, h),
        rect(x, y + h / 2 - half, w, weight));
    case 'R': {
      const bowlHeight = h * 0.56;
      const bowlRadius = bowlHeight / 2;
      const arcCentre = x + w - bowlRadius;
      return union(
        rect(x, y, weight, h),
        rect(x, y, w - bowlRadius, weight),
        rect(x, y + bowlHeight - weight, w - bowlRadius, weight),
        clipX(ring(arcCentre, y + bowlRadius, bowlRadius, bowlRadius, weight), arcCentre, right),
        segment([x + w * 0.45, y + bowlHeight - half], [right - half, bottom - half], weight),
      );
    }
    case 'O':
      return ring(x + w / 2, y + h / 2, w / 2, h / 2, weight);
    case 'M':
      return union(rect(x, y, weight, h), rect(right - weight, y, weight, h),
        segment([x + half, y + half], [x + w / 2, bottom - h * 0.32], weight),
        segment([right - half, y + half], [x + w / 2, bottom - h * 0.32], weight));
    case 'A':
      return union(
        segment([x + half, bottom - half], [x + w / 2, y + half], weight),
        segment([right - half, bottom - half], [x + w / 2, y + half], weight),
        rect(x + w * 0.17, y + h * 0.66, w * 0.66, weight),
      );
    default:
      throw new Error(`No glyph is defined for ${letter}`);
  }
}

function drawWord(target, word, x, y, letterWidth, height, weight, tracking, colour) {
  for (const [index, letter] of [...word].entries()) {
    paint(target, glyph(letter, x + index * (letterWidth + tracking), y, letterWidth, height, weight), colour);
  }
}

// --- PNG encoding ----------------------------------------------------------

const crcTable = Array.from({ length: 256 }, (_unused, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length, 0);
  header.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'latin1'), body])), 0);
  return Buffer.concat([header, body, crc]);
}

/** An 8-bit RGBA, non-interlaced PNG with every scanline unfiltered. */
export function encodePng({ width, height, data }) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(data.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type: truecolour with alpha
  ihdr[10] = 0;  // deflate
  ihdr[11] = 0;  // adaptive filtering
  ihdr[12] = 0;  // no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- artboards -------------------------------------------------------------

export function renderBrandIcon(hues = priorityHues()) {
  const target = canvas(128 * SUPERSAMPLE, 128 * SUPERSAMPLE);
  // 16px transparent margin on all sides; 96x96 of artwork inside it.
  drawMark(target, 16 * SUPERSAMPLE, 16 * SUPERSAMPLE, 96 * SUPERSAMPLE, hues);
  return downsample(target, SUPERSAMPLE);
}

export function renderPromoTile(hues = priorityHues()) {
  const s = SUPERSAMPLE;
  const target = canvas(440 * s, 280 * s);
  paint(target, rect(0, 0, 440 * s, 280 * s), PROMO_GROUND);
  drawMark(target, 52 * s, 76 * s, 128 * s, hues);
  drawWord(target, 'ZHROMA', 224 * s, 109 * s, 24 * s, 34 * s, 6 * s, 8 * s, INK);
  for (const [index, hue] of hues.entries()) {
    paint(target, roundedRect((224 + index * 48) * s, 161 * s, 40 * s, 10 * s, 3 * s), hue);
  }
  return downsample(target, SUPERSAMPLE);
}

export function writeBrandAssets(outDir = REPOSITORY_ROOT) {
  const hues = priorityHues();
  const written = [];
  for (const [relative, image] of [
    ['extension/icons/brand.png', renderBrandIcon(hues)],
    ['release/assets/promo.png', renderPromoTile(hues)],
  ]) {
    const path = join(resolve(outDir), relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, encodePng(image));
    written.push(path);
  }
  return written;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const flag = process.argv.indexOf('--out-dir');
  for (const path of writeBrandAssets(flag === -1 ? REPOSITORY_ROOT : process.argv[flag + 1])) {
    process.stdout.write(`BRAND_ASSET_WRITTEN ${path}\n`);
  }
}
