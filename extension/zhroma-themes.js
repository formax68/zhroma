// @ts-check
// Pinned palette custody and exact per-preset copyright/permission notices.
// Descriptive names only; no endorsement. Numeric derivations appear below.
/* NOTICE zhroma-catppuccin
MIT License

Copyright (c) 2021 Catppuccin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
END NOTICE */
/* NOTICE zhroma-tokyo-night
The MIT License (MIT)

Copyright (c) 2018-present Enkia

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
END NOTICE */
/* NOTICE zhroma-dracula
The MIT License (MIT)

Copyright (c) 2023 Dracula Theme

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
END NOTICE */
// Nord's exact notice is the decoded source.notice string below. Only the
// website slash representation is escaped to preserve the static no-network
// source scan; copyright, website and legal text decode byte-for-byte.
/* NOTICE zhroma-gruvbox
MIT License

Copyright (c) 2021 NpX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
END NOTICE */
/* NOTICE zhroma-solarized
Copyright (c) 2011 Ethan Schoonover

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

END NOTICE */
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
  /** @param {RGB[]} rgbs @param {number[]} alphas @param {ThemeVariant['priorities']} [mapping] @returns {ThemeVariant} */
  function variant(rgbs, alphas, mapping = priorities) {
    if (rgbs.length !== 8 || alphas.length !== 8) throw new TypeError('Incomplete palette');
    const slots = /** @type {Record<ColourSlot, Tint>} */ ({});
    slotNames.forEach((name, index) => {
      colour.emitRgba(rgbs[index], alphas[index]);
      slots[name] = Object.freeze({ rgb: Object.freeze(rgbs[index]), alpha: alphas[index] });
    });
    if (Object.keys(mapping).length !== 4 || priorityOrder.some((p) => !Object.hasOwn(mapping, p) || !slotNames.includes(mapping[p]))) throw new TypeError('Incomplete priorities');
    return Object.freeze({ slots: Object.freeze(slots), priorities: Object.freeze(mapping) });
  }
  // Classic credit: original Zhroma, baseline source revision
  // 6d3ab0b10e9419a5c1077e59e468977c00d59d4a, extension/zhroma.css.
  // No third-party palette or repository-wide licence is asserted.
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
    // Tokyo Night: Light/Night; cyan=Terminal Cyan; purple=Terminal Magenta; eighth magenta=(red+purple)/2 per channel; other RGB unchanged; semantic map retained; alpha tuned
    Object.freeze({ id: "zhroma-tokyo-night", label: "Tokyo Night",
      source: Object.freeze({"author":"Enkia","licence":"MIT","repository":"enkia/tokyo-night-vscode-theme","commit":"7c0f11eaef322f293621ca7befe462214b7ea468","palettePath":"README.md","paletteSha256":"576b7254966a979d13f4ff0fa13d7e2bebcb36087f1e00b264fa5dc5e4f620cd","licencePath":"LICENSE.txt","licenceSha256":"e3f5d0d772cda0f4f67405696f15a0f335460a2b3944eff40f00675aadacb31b","derivation":"Light/Night; cyan=Terminal Cyan; purple=Terminal Magenta; eighth magenta=(red+purple)/2 per channel; other RGB unchanged; semantic map retained; alpha tuned"}),
      variants: Object.freeze({
        light: variant([[140,67,81],[150,80,39],[143,94,21],[56,95,13],[15,75,110],[41,89,170],[90,62,142],[115,64.5,111.5]], [0.12,0.22,0.06,0.16,0.12,0.12,0.12,0.12]),
        dark: variant([[247,118,142],[255,158,100],[224,175,104],[158,206,106],[125,207,255],[122,162,247],[187,154,247],[217,136,194.5]], [0.06,0.16,0.1,0.14,0.12,0.12,0.12,0.12]),
      }) }),
    // Dracula: Alucard/Dracula; magenta=Pink; missing blue=(cyan+purple)/2 per channel; other RGB unchanged; semantic map retained; alpha tuned
    Object.freeze({ id: "zhroma-dracula", label: "Dracula",
      source: Object.freeze({"author":"Dracula Theme","licence":"MIT","repository":"dracula/dracula-theme","commit":"e22ebcc048b8aff586f9bc94db30ff5347070b42","palettePath":"README.md","paletteSha256":"3f798014d8e25a4c15f6ad26bc767d99bfc367ec3f9883bd4b5ce0fe562647d0","licencePath":"LICENSE","licenceSha256":"38b806a7e799cca4e9821e6f8d65cf0d8bfaaddbe454b41f12e5baad52d310f1","derivation":"Alucard/Dracula; magenta=Pink; missing blue=(cyan+purple)/2 per channel; other RGB unchanged; semantic map retained; alpha tuned"}),
      variants: Object.freeze({
        light: variant([[203,58,42],[163,77,20],[132,110,21],[20,113,10],[3,106,150],[51.5,90,175.5],[100,74,201],[163,20,77]], [0.12,0.2,0.06,0.12,0.12,0.12,0.12,0.12]),
        dark: variant([[255,85,85],[255,184,108],[241,250,140],[80,250,123],[139,233,253],[164,190,251],[189,147,249],[255,121,198]], [0.06,0.08,0.12,0.1,0.12,0.12,0.12,0.12]),
      }) }),
    // Nord: Shared Nord Aurora/Frost accents adapted by alpha to both surfaces; cyan=nord8, blue=nord10, purple=nord15; magenta=(nord11+nord15)/2; semantic map retained
    Object.freeze({ id: "zhroma-nord", label: "Nord",
      source: Object.freeze({"author":"Sven Greb","licence":"MIT","repository":"nordtheme/nord","commit":"1cef71605416a222e57225b544540ce0fcec18d4","palettePath":"src/nord.css","paletteSha256":"b931ac3732582b2066b2d6cadec02d9820ba7081e6e3e404c31cb62d9315a962","licencePath":"license","licenceSha256":"25ac8188d670bd2ad2ce2f4f55ab88573010ee9f7a4502543cb1eea1e2274f8a","derivation":"Shared Nord Aurora/Frost accents adapted by alpha to both surfaces; cyan=nord8, blue=nord10, purple=nord15; magenta=(nord11+nord15)/2; semantic map retained","notice":"MIT License (MIT)\n\nCopyright (c) 2016-present Sven Greb <development@svengreb.de> (https:\u002f\u002fwww.svengreb.de)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n"}),
      variants: Object.freeze({
        light: variant([[191,97,106],[208,135,112],[235,203,139],[163,190,140],[136,192,208],[94,129,172],[180,142,173],[185.5,119.5,139.5]], [0.14,0.3,0.16,0.28,0.12,0.12,0.12,0.12]),
        dark: variant([[191,97,106],[208,135,112],[235,203,139],[163,190,140],[136,192,208],[94,129,172],[180,142,173],[185.5,119.5,139.5]], [0.18,0.06,0.16,0.12,0.12,0.12,0.12,0.12]),
      }) }),
    // Gruvbox: MIT gruvbox.nvim faded/bright; original morhetz lineage; cyan=aqua; eighth magenta=[max(red.R,purple.R),(red.G+purple.G)/2,purple.B]; semantic map retained; alpha tuned
    Object.freeze({ id: "zhroma-gruvbox", label: "Gruvbox",
      source: Object.freeze({"author":"NpX (gruvbox.nvim), original morhetz lineage","licence":"MIT","repository":"ellisonleao/gruvbox.nvim","commit":"154eb5ff5b96d0641307113fa385eaf0d36d9796","palettePath":"lua/gruvbox.lua","paletteSha256":"305e6750f877f582c37a20bb9db1528be95da154815a31ac676142f64fa82690","licencePath":"LICENSE","licenceSha256":"40f9e21e8e8bd3e740665c27945b6d6bf8afbc8008439aa749cb477157390524","derivation":"MIT gruvbox.nvim faded/bright; original morhetz lineage; cyan=aqua; eighth magenta=[max(red.R,purple.R),(red.G+purple.G)/2,purple.B]; semantic map retained; alpha tuned"}),
      variants: Object.freeze({
        light: variant([[157,0,6],[175,58,3],[181,118,20],[121,116,14],[66,123,88],[7,102,120],[143,63,113],[157,31.5,113]], [0.08,0.2,0.06,0.18,0.12,0.12,0.12,0.12]),
        dark: variant([[251,73,52],[254,128,25],[250,189,47],[184,187,38],[142,192,124],[131,165,152],[211,134,155],[251,103.5,155]], [0.06,0.14,0.16,0.08,0.12,0.12,0.12,0.12]),
      }) }),
    // Solarized: Same eight accents both modes; violet=purple; semantic map retained; alpha tuned
    Object.freeze({ id: "zhroma-solarized", label: "Solarized",
      source: Object.freeze({"author":"Ethan Schoonover","licence":"MIT","repository":"altercation/solarized","commit":"62f656a02f93c5190a8753159e34b385588d5ff3","palettePath":"README.md","paletteSha256":"f10571c994648365faab9c4f83bdd7699aa2cd056f111af5e29099c2673c5bc1","licencePath":"LICENSE","licenceSha256":"494aefdabf86acce06bd63001ad8aedad4ee38da23509d3f917d95aa3368b9a6","derivation":"Same eight accents both modes; violet=purple; semantic map retained; alpha tuned"}),
      variants: Object.freeze({
        light: variant([[220,50,47],[203,75,22],[181,137,0],[133,153,0],[42,161,152],[38,139,210],[108,113,196],[211,54,130]], [0.1,0.18,0.06,0.14,0.12,0.12,0.12,0.12]),
        dark: variant([[220,50,47],[203,75,22],[181,137,0],[133,153,0],[42,161,152],[38,139,210],[108,113,196],[211,54,130]], [0.08,0.18,0.16,0.08,0.12,0.12,0.12,0.12]),
      }) }),
    // Colourblind-safe: independently authored Zhroma contributions, 2026.
    // RGB-constraint xorshift32 search; light seed 1514689103, dark 1514689104.
    // Alphas .06-.44/.02 before RGB changes; first valid ordered assignment.
    // Historical prototype values excluded from seeds and final slots.
    // Method: final sRGB decoded, Machado severity-1 linear matrix, clipped,
    // encoded, original Ottosson Oklab. Developer test oracle owns simulation.
    // Credit is authorship/method attribution, not an invented project licence.
    // Label denotes tested protan/deutan simulations, no universal guarantee.
    Object.freeze({ id: 'zhroma-colourblind-safe', label: 'Colourblind-safe', source: Object.freeze({
      author: 'Zhroma', derivation: 'Independent constrained RGB search; xorshift32 seeds 1514689103/1514689104; no third-party palette inputs',
      method: 'Machado severity-1 linear-light simulation; W3C sRGB; original Ottosson Oklab; project acceptance policy',
      licence: 'Project-original contributions; no third-party palette licence or repository-wide licence asserted' }),
      variants: Object.freeze({
        light: variant([[240,49,70],[162,67,32],[111,129,42],[117,234,27],[96,212,186],[76,151,227],[219,110,231],[205,75,121]],
          [.12,.12,.12,.10,.12,.24,.08,.44], {Urgent:'magenta',High:'blue',Normal:'purple',Low:'green'}),
        dark: variant([[209,129,104],[132,77,26],[238,235,114],[135,195,137],[20,220,232],[99,204,252],[174,35,210],[248,113,200]],
          [.22,.12,.12,.08,.12,.22,.14,.12], {Urgent:'blue',High:'red',Normal:'green',Low:'purple'}),
      }) }),
  ]);
  const IDs = Object.freeze(records.map((record) => record.id));
  /** @param {unknown} id @param {unknown} mode */
  function resolve(id, mode) { return (records.find((record) => record.id === id) ?? records[0]).variants[mode === 'dark' ? 'dark' : 'light']; }
  Object.defineProperty(namespace, 'themes', { value: Object.freeze({ IDs, records, resolve, priorityOrder }), enumerable: true });
})();
