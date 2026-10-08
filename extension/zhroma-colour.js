// @ts-check
// Pure encoded-sRGB source-over arithmetic. Native row paint is composed
// before cell paint. WCAG luminance and original Oklab decode only the result.
/** @typedef {readonly [number, number, number]} RGB */
/** @typedef {{readonly rgb: RGB, readonly alpha: number}} Tint */
/** @typedef {'light' | 'dark'} ThemeMode */
/** @typedef {'normal' | 'hover' | 'selected'} NativeState */
/**
 * @typedef {object} ZhromaColourApi
 * @property {(rgb: RGB, alpha: number) => string} emitRgba
 * @property {(rgb: RGB, alpha: number, backdrop: RGB) => RGB} composite
 * @property {(tint: Tint, mode: ThemeMode, state?: NativeState) => RGB} preview
 * @property {(a: RGB, b: RGB) => number} contrast
 * @property {(rgb: RGB) => RGB} oklab
 * @property {(a: RGB, b: RGB) => number} distance
 * @property {Readonly<Record<ThemeMode, {pane: RGB, text: RGB, native: RGB}>>} surfaces
 */
(() => {
  'use strict';
  const root = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (globalThis));
  if (Object.hasOwn(root, 'Zhroma') && (root.Zhroma === null || typeof root.Zhroma !== 'object')) return;
  if (!Object.hasOwn(root, 'Zhroma')) Object.defineProperty(root, 'Zhroma', { value: {}, enumerable: true });
  const namespace = /** @type {Record<string, unknown>} */ (root.Zhroma);
  if (Object.hasOwn(namespace, 'colour')) return;
  /** @param {RGB} rgb */
  function validate(rgb) {
    if (!Array.isArray(rgb) || rgb.length !== 3
      || ![0, 1, 2].every((index) => Object.hasOwn(rgb, index) && typeof rgb[index] === 'number'
        && Number.isFinite(rgb[index]) && rgb[index] >= 0 && rgb[index] <= 255)) throw new TypeError('Invalid RGB');
  }
  /** @param {number} alpha */
  function validateAlpha(alpha) {
    if (typeof alpha !== 'number' || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new TypeError('Invalid alpha');
  }
  /** @param {RGB} rgb @param {number} alpha */
  function emitRgba(rgb, alpha) { validate(rgb); validateAlpha(alpha); return `rgb(${rgb.join(' ')} / ${alpha})`; }
  /** @param {RGB} rgb @param {number} alpha @param {RGB} backdrop @returns {RGB} */
  function composite(rgb, alpha, backdrop) {
    validate(rgb); validateAlpha(alpha); validate(backdrop);
    return [rgb[0] * alpha + backdrop[0] * (1 - alpha), rgb[1] * alpha + backdrop[1] * (1 - alpha), rgb[2] * alpha + backdrop[2] * (1 - alpha)];
  }
  /** @type {ZhromaColourApi['surfaces']} */
  const surfaces = Object.freeze({
    light: Object.freeze({ pane: Object.freeze(/** @type {[number, number, number]} */ ([255, 255, 255])),
      text: Object.freeze(/** @type {[number, number, number]} */ ([41, 50, 57])),
      native: Object.freeze(/** @type {[number, number, number]} */ ([31, 115, 183])) }),
    dark: Object.freeze({ pane: Object.freeze(/** @type {[number, number, number]} */ ([21, 26, 30])),
      text: Object.freeze(/** @type {[number, number, number]} */ ([216, 220, 222])),
      native: Object.freeze(/** @type {[number, number, number]} */ ([102, 160, 205])) }),
  });
  /** @param {Tint} tint @param {ThemeMode} mode @param {NativeState} [state] @returns {RGB} */
  function preview(tint, mode, state = 'normal') {
    if (!Object.hasOwn(surfaces, mode) || !['normal', 'hover', 'selected'].includes(state)) throw new TypeError('Invalid surface');
    const surface = surfaces[mode];
    return composite(tint.rgb, tint.alpha, composite(surface.native, state === 'normal' ? 0 : state === 'hover' ? 0.08 : 0.16, surface.pane));
  }
  /** @param {number} value */
  const linear = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  /** @param {RGB} rgb */
  function luminance(rgb) { validate(rgb); return rgb.reduce((sum, value, index) => sum + linear(value / 255) * [0.2126, 0.7152, 0.0722][index], 0); }
  /** @param {RGB} a @param {RGB} b */
  function contrast(a, b) { const x = luminance(a); const y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  // Ottosson's original 2021 matrices; distance is scaled by 100.
  /** @param {RGB} rgb @returns {RGB} */
  function oklab(rgb) {
    validate(rgb);
    const [r, g, b] = rgb.map((value) => linear(value / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  /** @param {RGB} a @param {RGB} b */
  function distance(a, b) { const x = oklab(a); const y = oklab(b); return 100 * Math.hypot(...x.map((value, index) => value - y[index])); }
  Object.defineProperty(namespace, 'colour', { value: Object.freeze({ emitRgba, composite, preview, contrast, oklab, distance, surfaces }), enumerable: true });
})();
