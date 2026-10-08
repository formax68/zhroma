// @ts-check
// Catppuccin Latte/Mocha palette, pinned repository catppuccin/catppuccin
// commit d09787dd98ca6fba08af5ef2ae94a7e09f17daca, README.md.
// README SHA256 6f5151cdd4fe3e94dac978a9b88444c888698af37ff8e654088cd043d33411b2
// LICENSE SHA256 814096d2c34cc216c624738a49356f32b7237733b4f7edb0685f4e50ef5074ba
// Peach supplies orange, Mauve purple, Teal cyan, Pink magenta.
// RGB seeds are unchanged. Zhroma strengths are independently tuned against
// measured Zendesk surfaces/states; semantic priority mapping is retained.
// MIT License
// Copyright (c) 2021 Catppuccin
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
/** @typedef {'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta'} ColourSlot */
/** @typedef {'Urgent' | 'High' | 'Normal' | 'Low'} Priority */
/** @typedef {{readonly slots: Readonly<Record<ColourSlot, Tint>>, readonly priorities: Readonly<Record<Priority, ColourSlot>>}} ThemeVariant */
/** @typedef {{readonly id: string, readonly label: string, readonly source: Readonly<Record<string, string>>, readonly variants: Readonly<Record<ThemeMode, ThemeVariant>>}} ThemeRecord */
/**
 * @typedef {object} ZhromaThemesApi
 * @property {readonly string[]} IDs
 * @property {readonly ThemeRecord[]} records
 * @property {readonly Priority[]} priorityOrder
 * @property {(id: unknown, mode: unknown) => ThemeVariant} resolve
 */
(() => {
  'use strict';
  const namespace = globalThis.Zhroma;
  if (!namespace?.colour || namespace.themes) return;
  const colour = namespace.colour;
  const slotNames = /** @type {ColourSlot[]} */ (['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'magenta']);
  const priorityOrder = Object.freeze(/** @type {Priority[]} */ (['Urgent', 'High', 'Normal', 'Low']));
  const priorities = Object.freeze({ Urgent: 'red', High: 'orange', Normal: 'yellow', Low: 'green' });
  /** @param {RGB[]} rgbs @param {number[]} alphas @returns {ThemeVariant} */
  function variant(rgbs, alphas) {
    if (rgbs.length !== 8 || alphas.length !== 8) throw new TypeError('Incomplete palette');
    const slots = /** @type {Record<ColourSlot, Tint>} */ ({});
    slotNames.forEach((name, index) => {
      colour.emitRgba(rgbs[index], alphas[index]);
      slots[name] = Object.freeze({ rgb: Object.freeze(rgbs[index]), alpha: alphas[index] });
    });
    return Object.freeze({ slots: Object.freeze(slots), priorities });
  }
  // Classic's first four RGB/alpha values are the 0.1.0 pinned literals.
  // Cyan/blue/purple/magenta are original Zhroma data, not another preset.
  /** @type {RGB[]} */
  const classic = [[220, 38, 38], [234, 88, 12], [202, 138, 4], [22, 163, 74],
    [8, 145, 178], [37, 99, 235], [147, 51, 234], [219, 39, 119]];
  /** @type {readonly ThemeRecord[]} */
  const records = Object.freeze([
    Object.freeze({ id: 'zhroma-classic', label: 'Classic', source: Object.freeze({ author: 'Zhroma',
      derivation: 'Original Zhroma slots; frozen 0.1.0 light priorities; dark alpha 0.30' }),
      variants: Object.freeze({ light: variant(classic, [.14, .12, .09, .08, .10, .10, .10, .10]),
        dark: variant(classic, [.30, .30, .30, .30, .30, .30, .30, .30]) }) }),
    Object.freeze({ id: 'zhroma-catppuccin', label: 'Catppuccin', source: Object.freeze({ author: 'Catppuccin',
      licence: 'MIT', repository: 'catppuccin/catppuccin', commit: 'd09787dd98ca6fba08af5ef2ae94a7e09f17daca',
      paletteSha256: '6f5151cdd4fe3e94dac978a9b88444c888698af37ff8e654088cd043d33411b2',
      licenceSha256: '814096d2c34cc216c624738a49356f32b7237733b4f7edb0685f4e50ef5074ba',
      derivation: 'Latte/Mocha RGB unchanged; peach=orange, teal=cyan, mauve=purple, pink=magenta; tuned alpha only' }),
      variants: Object.freeze({
        light: variant([[210, 15, 57], [254, 100, 11], [223, 142, 29], [64, 160, 43],
          [23, 146, 153], [30, 102, 245], [136, 57, 239], [234, 118, 203]], [.10, .06, .18, .12, .12, .12, .12, .12]),
        dark: variant([[243, 139, 168], [250, 179, 135], [249, 226, 175], [166, 227, 161],
          [148, 226, 213], [137, 180, 250], [203, 166, 247], [245, 194, 231]], [.14, .06, .14, .10, .14, .14, .14, .14]),
      }) }),
  ]);
  const IDs = Object.freeze(records.map((record) => record.id));
  /** @param {unknown} id @param {unknown} mode */
  function resolve(id, mode) { return (records.find((record) => record.id === id) ?? records[0]).variants[mode === 'dark' ? 'dark' : 'light']; }
  Object.defineProperty(namespace, 'themes', { value: Object.freeze({ IDs, records, resolve, priorityOrder }), enumerable: true });
})();
