# Stack Research

**Domain:** Public Chrome Manifest V3 content-script extension (DOM-scraping, zero-config, no backend)
**Researched:** 2026-09-02
**Confidence:** HIGH (manifest/store mechanics verified against developer.chrome.com; versions verified against the npm registry on 2026-09-02). MEDIUM on Zendesk-specific DOM assumptions — Zendesk does not document its agent-view markup.

---

## The Headline Verdict

**Ship a no-build extension.** Four hand-written files — `manifest.json`, `content.js`, `zhroma.css`, and an `icons/` folder — zipped and uploaded. No bundler, no framework, no runtime dependencies, no service worker, no `permissions` array.

This is not minimalism for its own sake. It is the choice that directly serves three stated project constraints:

1. **Store review speed.** Chrome's review-process docs explicitly say "submit your code as authored" and list *obfuscation* and *large code changes* as review-slowing signals. A ~300-line unminified content script that a reviewer can read top-to-bottom in ninety seconds is close to the easiest artifact the Chrome Web Store ever receives. A bundler produces a `dist/` that differs from your source, and that costs you review goodwill for zero functional gain.
2. **The privacy claim.** "Ticket data never leaves the browser, no telemetry, no network calls" is easiest to defend when the extension has *no dependency tree at all*. Zero `node_modules` in the shipped artifact means zero supply-chain surface and nothing to audit.
3. **Longevity under low commit frequency.** The standing risk in PROJECT.md is Zendesk changing its DOM without notice. That means this repo will sit untouched for months, then need a one-line selector fix under time pressure. A toolchain you have to resurrect (and whose transitive deps have drifted) is a tax paid at exactly the worst moment. `git pull && edit one file && zip` is not.

The dev-time toolchain (type checking, unit tests) lives in `devDependencies` and never ships. That is the right place for tooling — beside the code, not between you and the artifact.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Chrome Manifest V3 | `manifest_version: 3` | Extension platform | Mandatory — MV2 is not accepted by the Chrome Web Store. Not a choice. |
| Declarative `content_scripts` | n/a (manifest key) | Inject `content.js` + `zhroma.css` on Zendesk agent URLs | Requires **no `permissions` entry at all** and runs earlier than programmatic injection. The `matches` pattern is itself the host-access grant. |
| Plain JavaScript (ES2022) | n/a — browser native | The entire extension logic | No transpile needed. Chrome stable is M152; every language feature you'd want has been available for years. |
| JSDoc type annotations + `// @ts-check` | n/a | Type safety without a build step | Gets you ~90% of TypeScript's value on a file that is mostly `querySelectorAll` and `setAttribute` — with zero emitted output. The file you edit is the file that ships is the file the reviewer reads. |
| Static CSS via `content_scripts.css` | n/a (manifest key) | All four priority tints | Declarative CSS is injected by Chrome before DOM construction, so tints paint with the first render rather than flashing in. Colours stay out of JS. |
| `MutationObserver` | n/a — browser native | Re-apply tints when the Zendesk SPA re-renders | The hard requirement from PROJECT.md. No library needed or wanted; this is ~30 lines of native API. |

### Supporting Libraries

**Runtime dependencies: none. Deliberately, permanently zero.**

Everything below is a `devDependency` that never enters the shipped zip.

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `typescript` | `7.0.2` | Type-check JSDoc via `tsc --noEmit --checkJs` | Always. Compiler only — never emits, never bundles. |
| `@types/chrome` | `0.2.8` | `chrome.*` API types | Always (cheap). Barely exercised in v1 since a declarative content script may call no extension API at all; earns its keep in v2 when `chrome.storage` arrives. |
| `vitest` | `4.1.11` | Unit + DOM-integration test runner | Always. Fast, ESM-native, zero config for this shape of project. |
| `happy-dom` | `20.13.0` | DOM environment for Vitest | Always. Faster than jsdom and more than sufficient for attribute/selector assertions. |
| `@playwright/test` | `1.62.1` | Real-browser rendering check + screenshot of the tint | Optional, low priority. See the Testing section for the honest scope — it cannot verify selectors against real Zendesk. |
| `@biomejs/biome` | `2.5.11` | Lint + format in one binary | Optional. One dependency, one config file, no plugin graph. Skip entirely in v1 if you want; `tsc --checkJs` already catches what matters. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Node.js 22 LTS | Runs the devDependencies | Vitest 4 requires `^20 \|\| ^22 \|\| >=24`; Playwright and happy-dom require `>=20`. Node 22 satisfies all. Node is a *dev* requirement only — the extension itself has no Node relationship. |
| `zip` (system binary) | Produces the store artifact | `cd extension && zip -r ../zhroma-$VERSION.zip .` — the manifest must sit at the **root of the zip**, which the `extension/` directory layout gives you for free. |
| `chrome://extensions` → Load unpacked | The actual dev loop | Point it at `extension/`. Edit `content.js`, hit the reload arrow, refresh Zendesk. That *is* the inner loop — it is roughly as fast as HMR and has none of HMR's failure modes. |
| GitHub Pages | Hosts the privacy policy | Free, no infrastructure, versioned alongside the code. Required by the store's Privacy tab. |

---

## Installation

```bash
# Runtime dependencies — none, and this is load-bearing
# (no `npm install` line here on purpose)

# Dev dependencies
npm install -D typescript@7.0.2 @types/chrome@0.2.8 \
               vitest@4.1.11 happy-dom@20.13.0

# Optional dev dependencies
npm install -D @biomejs/biome@2.5.11 @playwright/test@1.62.1
```

`package.json` scripts — keep it to four:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome check .",
    "zip": "cd extension && zip -r ../zhroma-$npm_package_version.zip . -x '.*'"
  }
}
```

`tsconfig.json` — type-checking only, never emitting:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "strict": true,
    "types": ["chrome"]
  },
  "include": ["extension/**/*.js", "test/**/*.js"]
}
```

### Repository layout

Everything that ships lives under `extension/`. Everything else cannot leak into the artifact.

```
extension/
  manifest.json
  content.js              <- the whole extension, ~300 lines
  zhroma.css              <- the four tints + the hint styling
  icons/16.png  32.png  48.png  128.png
test/
  fixtures/zendesk-view.html      <- captured from a real tenant
  priority.test.js                <- pure parsing logic
  apply.test.js                   <- DOM integration incl. re-render
store/
  screenshot-1.png                <- 1280x800
  promo-440x280.png
  listing.md                      <- the copy, version-controlled
docs/
  privacy.md                      <- served via GitHub Pages
package.json  tsconfig.json  biome.json  README.md
```

---

## 1. Manifest V3 Essentials

### The complete v1 manifest

```json
{
  "manifest_version": 3,
  "name": "Zhroma — colour-code Zendesk tickets by priority",
  "version": "1.0.0",
  "description": "Tints ticket rows in Zendesk agent views by priority so urgent work is obvious at a glance.",
  "icons": {
    "16": "icons/16.png",
    "32": "icons/32.png",
    "48": "icons/48.png",
    "128": "icons/128.png"
  },
  "content_scripts": [
    {
      "matches": ["https://*.zendesk.com/agent/*"],
      "js": ["content.js"],
      "css": ["zhroma.css"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ]
}
```

Note what is **absent**: no `permissions`, no `host_permissions`, no `background`, no `action`, no `web_accessible_resources`, no `optional_permissions`. An empty permissions surface is the single strongest asset you can bring to store review.

### Required vs. optional manifest fields

| Field | Status | Notes for this project |
|-------|--------|------------------------|
| `manifest_version` | **Required** | Must be `3`. |
| `name` | **Required** | Max 75 characters. |
| `version` | **Required** | 1–4 dot-separated integers. The store **rejects re-uploads with an unchanged version** — bump before every submission. |
| `description` | **Required** | Max 132 characters. This is the line users read in the store; write it deliberately. |
| `icons` | **Required** | 128 is required by the store; 48 strongly recommended (chrome://extensions); 16/32 optional but cheap. **PNG only — SVG and WebP are not supported.** |
| `content_scripts` | Needed here | `matches` + at least one of `js`/`css`. |
| `permissions` | **Omit** | Nothing in v1 needs an API permission. |
| `host_permissions` | **Omit** | See below — this is the most commonly over-declared key. |
| `background` | **Omit** | No state, no cross-tab coordination, no alarms. Omitting it removes the entire MV3 service-worker lifecycle class of bugs. |
| `action` | **Omit in v1** | With no popup and nothing to click, an `action` icon that does nothing is worse than no icon. The extension is still visible and manageable via the puzzle-piece menu. Add it in v2 alongside the options page. |
| `minimum_chrome_version` | **Omit** | Nothing here is newer than Chrome 88-era API surface. Setting it only excludes users for no benefit. |

### `content_scripts` vs. programmatic `chrome.scripting` injection

**Use declarative `content_scripts`. Definitively.**

| | Declarative `content_scripts` | Programmatic `chrome.scripting.executeScript` |
|---|---|---|
| Permissions needed | None beyond the `matches` pattern | `"scripting"` **plus** `host_permissions` **plus** a `background` service worker to call it from |
| Timing | Injected by Chrome as the page loads; CSS lands before first paint | Requires a navigation event to observe, then a round-trip — always later, and it can miss loads |
| Review surface | One manifest key | Three extra declarations to justify on the Privacy tab |
| Code | Zero | A service worker plus `chrome.tabs.onUpdated` plumbing |

Programmatic injection exists for cases where you don't know the target at build time or need a user gesture. You know the target (`*.zendesk.com/agent/*`) and there is no gesture. The declarative path is strictly simpler *and* strictly earlier.

### `host_permissions` — you do not need it

This is worth stating plainly because it is the most common over-declaration in MV3 extensions:

> **A declarative content script's `matches` pattern is itself the host-access request.** Adding `host_permissions` on top grants nothing extra and adds a permission you must separately justify on the Privacy tab.

`host_permissions` is for when the *extension's own* context needs host access — `fetch()` from a service worker with the site's cookies, `chrome.cookies`, or `chrome.scripting` injection. Zhroma does none of those.

The user-facing install warning is the same either way ("Read and change your data on sites in the zendesk.com domain"), so there is nothing to gain and one review question to lose.

### Match pattern: scope it to the agent interface

Recommended: `https://*.zendesk.com/agent/*`

- `https://` only — never `*://`. There is no reason to run on plaintext HTTP, and it narrows the ask.
- `*.zendesk.com` matches any subdomain *and* the bare `zendesk.com` (Chrome match-pattern semantics), which is fine.
- `/agent/*` narrows to the agent interface, excluding help-centre pages and the marketing site on `www.zendesk.com`. This materially strengthens the review story: the extension provably cannot run on a customer-facing page.

**One empirical risk to verify in phase 1 (MEDIUM confidence):** Zendesk is an SPA. If an agent can land on `https://tenant.zendesk.com/` and *client-side route* into `/agent/filters/123` without a full navigation, the content script will never inject, because Chrome evaluates `matches` at navigation time only. In practice the bare subdomain performs a real redirect into `/agent/...`, so `/agent/*` should be safe — but confirm it against a live tenant before shipping.

Fallback if that check fails: widen to `https://*.zendesk.com/*` and early-return in `content.js` when `location.pathname` doesn't start with `/agent/`. This costs you a slightly broader install warning and slightly more review scrutiny, but it is still a narrow, single-vendor pattern that does **not** trip the dashboard's "in-depth review" warning. Do not widen preemptively.

### `run_at` timing

**Use `document_idle`** (the default) for `js`.

- Declarative `css` is injected by Chrome before DOM construction *regardless* of `run_at`, so your tints are registered from the first paint. There's no flash-of-untinted-content to engineer around.
- The JS's job is to set attributes on rows that do not exist yet — Zendesk's ticket table is rendered by client-side JavaScript well after `document_idle`. Choosing `document_start` buys you nothing except running your setup code while the main thread is busy with Zendesk's own boot.
- Correctness comes entirely from the `MutationObserver`, not from injection timing. Design accordingly: assume the table is absent at startup and let the observer bring it in.

Set the observer up immediately, scope it as tightly as you can (observe the view container once it appears, not `document.body` with `subtree: true` forever), and debounce re-application with a microtask or `requestAnimationFrame` so a burst of mutations produces one pass rather than fifty.

### `activeTab` — not viable here

`activeTab` grants temporary host access **only after the user invokes the extension** (toolbar click, context menu, keyboard command). Zhroma must work the instant a view loads, with zero interaction — that is the entire product ("zero configuration", "know within one second").

This deserves a decision record because `activeTab` is the standard advice for dodging permission warnings, and someone will suggest it during review prep. It is genuinely the right call for click-to-activate tools. It is structurally incompatible with an always-on tint.

### What MV3 forbids

| Forbidden | Applies to Zhroma? |
|-----------|--------------------|
| Remotely hosted code — external `<script src>`, `eval()` of fetched strings, custom interpreters running remote commands | No, and trivially provable: the extension makes zero network requests |
| Code whose full functionality isn't discernible from the submitted source | No — unminified, unbundled, ~300 lines |
| Obfuscation (minification *is* permitted) | No — nothing is transformed |
| Relaxing the extension CSP for extension pages | N/A — no extension pages |
| Remote CSS `@import`, remote webfonts | **Avoid.** Use system font stacks and inline all colour values. A remote `@import` in your stylesheet is a remote-resource smell at review for no benefit. |

MV3's only sanctioned remote-execution escape hatches are the Debugger API and the User Scripts API. Neither is relevant, and requesting either would guarantee an extended review.

---

## 2. Build Tooling — the verdict

### **No bundler. Ship hand-written files.**

For a single ~300-line content script with zero runtime dependencies, targeting one browser, with no options page and no popup, a bundler is pure cost.

**What a bundler would buy you, and why each is worthless here:**

| Bundler benefit | Worth it? |
|---|---|
| ESM `import` across multiple source files | Not needed at this size. One `content.js` is honest. If you genuinely want two files, list them in `js: []` — they share one isolated-world global; use a namespace object or IIFEs. |
| npm runtime dependencies | You have none and should keep it that way. |
| TypeScript transpilation | Sidestepped by JSDoc + `checkJs` (see §6). |
| HMR | The Load-unpacked → reload-arrow → refresh loop is comparably fast and never breaks. |
| Cross-browser output | Chrome-only in v1 by explicit decision. |
| Auto-zip on build | A one-line `zip` script. |
| Minification | Actively counterproductive — see the review section. |

**What a bundler costs you:**

- A shipped artifact that differs from your source, against Chrome's explicit "submit your code as authored" guidance.
- A toolchain to keep alive across months of dormancy, on a project whose maintenance pattern is "Zendesk broke a selector, fix it today."
- A `node_modules` supply chain attached to an extension whose entire pitch is "collects nothing, contacts nothing."
- Real, documented failure modes. CRXJS has open issues where content-script HMR breaks `MutationObserver` behaviour (crxjs/chrome-extension-tools #811, #1119) — that is precisely the API this extension is built on.

### If you were building something bigger

| Tool | Version | Verdict |
|------|---------|---------|
| **WXT** | `0.21.4` (2026-08-11) | **The 2026 default.** Actively maintained, framework-agnostic, Vite-based, file-based entrypoints, cross-browser output, good content-script story. This is what Zhroma migrates to *if* v2's options page + storage + configurable colours push it past ~800 lines. Not before. |
| **CRXJS** (`@crxjs/vite-plugin`) | `2.7.1` (2026-07-01) | Maintained, but it's a Vite plugin rather than a framework — you assemble the rest. Its headline feature (state-preserving content-script HMR) is also its buggiest area. Choose only if you're already deep in a Vite config you own. |
| **Plasmo** | `0.90.5` (last published **2025-05-17**) | **Do not start new projects on it.** Sixteen months without a release; WXT's own comparison page describes it as in maintenance mode with little to no active development. Its CSUI content-script system is genuinely excellent, which makes this a real loss — but not one worth inheriting. |
| **esbuild / raw Vite** | `0.28.2` / `8.2.2` | Fine if you need *only* bundling and will hand-write the manifest and copy steps. For MV3 specifically, WXT does this better with less config. |
| **None** | — | **Zhroma v1.** |

**Migration trigger — write this down now so the decision is pre-made:** adopt WXT when *any two* of these become true: (a) more than ~800 lines of source, (b) an options page or popup exists, (c) a second browser target is committed to, (d) a runtime npm dependency becomes genuinely unavoidable. Until then, migrating is a downgrade.

---

## 3. Styling Injected Into a Hostile SPA

This is the most technically interesting decision in the project, and the one most likely to be got wrong.

### The prescribed approach

**JS sets an attribute. CSS does everything else. `!important` on the tint. No cascade layers.**

```css
/* extension/zhroma.css */
:root {
  --zhroma-urgent: rgb(220 38 38 / 14%);
  --zhroma-high:   rgb(234 88 12 / 13%);
  --zhroma-normal: rgb(37 99 235 / 10%);
  --zhroma-low:    rgb(100 116 139 / 9%);
}

[data-zhroma="urgent"], [data-zhroma="urgent"] > * {
  background-color: var(--zhroma-urgent) !important;
}
/* ...three more... */
```

```js
// content.js — the ONLY styling call in the entire codebase
row.setAttribute('data-zhroma', priority);
```

### Why each part of that

**Attribute, not inline styles.** Both get clobbered when React re-renders the row — there is no escaping that, which is why the observer exists. But an attribute is one cheap idempotent `setAttribute` to restore, it keeps every colour value in CSS where it can be tweaked without touching logic, and it gives you a free debugging handle (inspect any row and see what Zhroma decided). Inline styles scatter the palette across your JavaScript and make v2's configurable-colour feature a rewrite instead of a one-line `style.setProperty` on `:root`.

**`!important` — yes, and without apology.** The cascade resolves as: origin/importance → inline styles → cascade layers → specificity → source order. Author `!important` beats **every** normal declaration on the page regardless of specificity or source order.

This matters because Zendesk Garden is a CSS-in-JS design system: it appends `<style>` tags to the document *at runtime*, which means they land **after** your content-script stylesheet in source order. Without `!important`, an equal-specificity tie goes to Zendesk. You would be betting on source order against a stylesheet that doesn't exist yet at the moment you're injected. You will lose that bet.

`!important`'s usual objection — "it makes your own stylesheet unmaintainable" — doesn't apply. You have four rules, you own all of them, and there is no future you fighting past-you. This is the textbook legitimate use: overriding third-party CSS you do not control.

**Do NOT use `@layer` for the tint rules.** This is counterintuitive and will bite anyone who reaches for the modern tool by reflex:

- Cascade-layer order is fixed by **first appearance in the document**.
- Your content-script stylesheet is injected before page CSS, so *your* layer registers first — making it the **lowest**-priority layer.
- Worse, **unlayered normal styles beat all layered normal styles.** Wrapping your rules in a layer moves them *below* every unlayered Zendesk rule.

Plain unlayered rules are strictly stronger than layered ones here. `@layer` is an excellent tool for organising a codebase you own end to end; it is exactly the wrong tool for beating a host page.

**CSS custom properties — yes, as the palette, defined on `:root` in your own stylesheet.** They give you one place to change colours, and they are the seam v2's configurable-colour feature plugs into (`document.documentElement.style.setProperty('--zhroma-urgent', userColour)`). Do **not** consume Zendesk's own custom properties — they are private API and will be renamed without warning.

**Constructed stylesheets (`CSSStyleSheet` + `adoptedStyleSheets`) — no.** They're the right answer when you need to build CSS at runtime from dynamic values. Your colours are hard-coded in v1. Declarative `content_scripts.css` gets injected before first paint (earlier than any JS could manage) and needs zero code. Revisit only in v2 if user-configured colours make a static file impossible — and even then, custom properties on `:root` will probably still cover it.

**Shadow DOM — only for the "no Priority column" hint.** You cannot shadow-DOM elements you don't own, so it's irrelevant to the tinting. But the hint *is* your own UI injected into a hostile page, and a shadow root is exactly right for it: Zendesk's CSS cannot reach in, you need zero `!important`, and you can't accidentally style their page. Note the inversion though — by default host light-DOM styles override shadow styles for inherited properties, so still set an explicit `all: initial` or a tight reset on your shadow host.

### Two traps to budget for

**Cell backgrounds can defeat a row background.** If Zendesk paints a background on each `<td>` / `[role="cell"]`, your row-level tint sits *behind* it and is invisible. Two mitigations, use both:
1. Target the row *and* its direct children (`[data-zhroma="urgent"] > *`), as in the CSS above.
2. Use **semi-transparent** tints (`rgb(220 38 38 / 14%)`). Translucency also makes the extension survive Zendesk's light and dark themes with one palette instead of two, and keeps text contrast readable — which partially hedges the deferred accessibility work.

**Hover and selected states will fight you.** Zendesk styles `:hover` and row-selection states. Your `!important` wins if their rule is normal-priority. If theirs is *also* `!important`, you need higher specificity **and** `!important` to win. Test hover explicitly — a tint that vanishes the moment the mouse crosses the row fails the glance test in the most annoying way possible.

---

## 4. Testing — what's actually testable

Be honest about the shape of the problem: **the highest-risk part of this extension — that the selectors match real Zendesk markup — cannot be tested without a live Zendesk tenant.** Everything else can be, cheaply. Structure the strategy around that fact rather than pretending otherwise.

### Tier 1 — Unit tests on pure logic (Vitest 4.1.11). **Highest value per minute.**

Extract and test as pure functions:
- **Priority text → priority key.** Whitespace, casing, and localisation variants. Zendesk renders priority as display text; an agent on a non-English locale sees different strings. Decide now whether v1 is English-only (fine — but make it a *recorded* decision, and make the parser fail quiet rather than mis-tint).
- **Header row → priority column index.** The "is there a Priority column at all?" determination that drives the hint. This is directly one of the Active requirements and it is 100% testable in isolation.
- **Diffing.** Given a set of rows and their current `data-zhroma` values, which need changing? Getting this right is what keeps the observer cheap.

### Tier 2 — DOM integration (Vitest + happy-dom 20.13.0). **The most valuable test in the project.**

Capture real markup from a live tenant once (`Copy → outerHTML` on the view container in DevTools), commit it as `test/fixtures/zendesk-view.html`, then:

1. Mount the fixture, run the apply pass, assert every row got the right attribute.
2. **Then mutate the fixture the way Zendesk does** — replace the tbody wholesale (a sort), swap in a different row set (a view switch), append rows (infinite scroll) — and assert re-application happens.

That second half directly verifies the hard requirement *"tinting survives scrolling, sorting, refreshing, switching views and tabs"* with no Zendesk account, no network, and a sub-second test run. Build this early.

Also assert the fail-quiet contract: given markup with **no** Priority column, or markup that's structurally unrecognisable, the code must touch nothing and throw nothing.

### Tier 3 — Browser rendering check (Playwright 1.62.1). **Optional, narrow.**

Two things only a real browser can tell you, both about CSS rather than selectors:
- Does the tint actually *win* the cascade against Zendesk's real stylesheet?
- Does it look right? (a screenshot assertion is the only automatable proxy for the glance test)

Pragmatic recipe: load the fixture page, inject `zhroma.css` and `content.js` with `page.addStyleTag` / `page.addScriptTag`, assert computed `background-color` and take a screenshot. This exercises the real cascade in a real engine without any extension plumbing.

If you want to verify the extension *packaging* too, Playwright's documented MV3 path is:

```js
const context = await chromium.launchPersistentContext('/tmp/zhroma-profile', {
  channel: 'chromium',            // enables headless extension testing
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});
```

Extensions require a **persistent context** in Chromium — `browser.newContext()` will not work. (The service-worker caveat in Playwright's docs — MV3 workers suspend after ~30s idle, and in-flight `evaluate` calls throw "Service worker restarted" — doesn't apply to you, since you have no service worker. One more dividend from omitting `background`.)

Caveat if you go this route: your `matches` is `https://*.zendesk.com/agent/*`, so the extension won't inject into a `localhost` fixture. You'd need a test-only manifest variant. That plumbing is usually not worth it — prefer the `addScriptTag` recipe.

### What cannot be tested, and what to do instead

**Not testable without a live tenant:** that your selectors match production Zendesk; that Zendesk hasn't changed its DOM since your fixture was captured; that the priority strings are what you expect on other locales, plans, or the legacy vs. Agent Workspace interfaces.

Compensating controls — these are the real mitigations, and they belong in the roadmap as deliverables:

1. **A written manual smoke checklist**, run against a real tenant before every store submission. Derive it directly from the PROJECT.md acceptance criteria: scroll, sort, refresh, switch view, switch browser tab, open a view with no Priority column, hover a row, select a row, dark mode. Treat this as a version-controlled artifact in `store/`, not tribal knowledge.
2. **Fail-quiet as a tested invariant** (Tier 2), not an aspiration. A Zendesk redesign must produce an untouched page, never a broken one.
3. **Re-capture the fixture** whenever you touch a selector. A stale fixture is worse than no fixture — it produces green tests against markup that no longer exists.
4. **Consider a `console.debug` behind a constant flag** so a user reporting "it stopped working" can be walked through confirming it. No telemetry — that line stays bright.

### What NOT to use for testing

- **Jest** — slower, ESM friction, zero advantage over Vitest here.
- **Puppeteer** — Playwright's extension documentation and headless-extension support are better maintained.
- **Selenium / Karma** — wrong decade for this.
- **A live-Zendesk E2E suite in CI** — credentials in CI, MFA, rate limits, and a test that fails for reasons unrelated to your code. The manual checklist is strictly better value.

---

## 5. Chrome Web Store Publishing

### Cost and account

- **US$5, one time, per developer account.** Still current in 2026. Not per-extension, not annual, non-refundable. Pay it early — it's a gate, not a step.
- **New publishers are capped at 2 published items** initially; the cap lifts with account age and engagement. Irrelevant for one extension, worth knowing.

### Required artifacts

| Asset | Spec | Required? |
|-------|------|-----------|
| Store icon | **128×128 PNG** — 96×96 of artwork with 16px transparent padding on all sides | Yes. Must read well on light *and* dark backgrounds. |
| Screenshots | **1280×800** (preferred, better on HiDPI) or 640×400. 1–5 of them | Yes, at least 1 |
| Small promo tile | **440×280** | Yes |
| Marquee promo tile | **1400×560** | Optional — only needed to be eligible for featuring |
| Manifest icons | 16 / 32 / 48 / 128 PNG | 128 required, 48 strongly recommended |
| ZIP | manifest.json at the **root** of the archive; ≤2GB | Yes |

**Screenshot strategy for this specific product:** the screenshots *are* the pitch. A before/after pair — an untinted view beside a tinted one — communicates the entire value proposition in the store's thumbnail grid better than any prose. Use a scrubbed or demo tenant; do not ship real customer data in a public store listing.

### Listing copy

- `name` ≤ 75 chars (from manifest), `description` ≤ 132 chars (from manifest)
- Detailed description, category, language (dashboard)
- Keep the copy in `store/listing.md` under version control. You will rewrite it after the first rejection and you'll want the diff.

### Privacy tab — four disclosures plus a policy URL

This is where a zero-data extension gets to be smug. Draft all of it before submitting.

1. **Single purpose.** One sentence, narrow: *"Applies a background colour to ticket rows in Zendesk agent views according to each ticket's priority."* Resist adding anything else — "single purpose that is narrow and easy to understand" is the literal policy language.
2. **Permission justification.** You will have exactly one entry — the host access implied by the content script's `matches`. Suggested: *"The extension reads the priority text already rendered in Zendesk agent views and applies a background colour to the corresponding row. It runs only on the Zendesk agent interface, requests no API permissions, makes no network requests, and stores nothing."*
3. **Remote code.** Declare **"No, I am not using remote code."** True and verifiable from source.
4. **Data usage disclosure + limited-use certification.** Tick nothing collected; certify all three limited-use statements.
5. **Privacy policy URL.** Required. Publish it on GitHub Pages from `docs/privacy.md` in the same repo. The content is three sentences: *"Zhroma collects, stores, and transmits no data. It has no servers and makes no network requests. It reads the ticket list already displayed on your screen solely to colour rows locally in your browser."* That policy doubles as your review defence — align the wording with your permission justification so a reviewer reading both sees one consistent story.

### What triggers extended review

Chrome's own review-process page names four signals: **new developer**, **new extension**, **dangerous permissions**, **large code changes**. You unavoidably hit the first two. You can neutralise everything else:

| Trigger | Zhroma's position |
|---------|-------------------|
| Broad host patterns (`<all_urls>`, `*://*/*`, `https://*/*`) | **Clean.** `https://*.zendesk.com/agent/*` is narrow and single-vendor; it does not raise the dashboard's "may require an in-depth review" warning. |
| Sensitive API permissions (`tabs`, `cookies`, `history`, `downloads`, `webRequest`, `debugger`) | **Clean — zero permissions requested.** |
| Obfuscated or minified code | **Clean.** No build step means "code as authored," which Chrome explicitly asks for. |
| Remote code | **Clean.** No network calls at all. |
| Code volume | **Clean.** ~300 readable lines. |

That is about as favourable a review posture as a public extension can have — and it is a direct dividend of the no-bundler, no-permissions decisions above. Worth naming in the roadmap so nobody trades it away later for a convenience.

### Realistic timeline

Chrome documents review as **"a few days, but it can take up to a few weeks,"** and advises contacting developer support if a submission sits past three weeks.

For a first submission from a new account with narrow permissions and unminified code: **plan for 1–5 business days, with a genuine tail risk of 2–3 weeks.** Do not build a launch announcement that assumes same-day approval. Budget one rejection-and-resubmit cycle into the schedule — first submissions commonly bounce on listing/privacy-form details rather than code.

**Deferred publishing** is available for up to 30 days after approval, which is the right way to line up an announcement without racing the reviewer.

---

## 6. TypeScript vs. Plain JavaScript

### Verdict: **JavaScript files with JSDoc types, checked by `tsc --noEmit --checkJs`.**

The decision is downstream of the no-bundler call. With no bundler, real `.ts` forces one of two bad outcomes:

- **Add a build step** — which reintroduces exactly the toolchain complexity you just eliminated, for a file that has no imports and no dependencies.
- **Run `tsc --outDir`** — which produces a shipped `dist/` that differs from your source, costing you the "code as authored" review advantage.

JSDoc dodges both. You get: real structural type checking, editor autocomplete on `chrome.*` and DOM APIs, `strict` null checking, and refactor safety — while the file you edit is byte-identical to the file that ships and the file the reviewer reads.

```js
// @ts-check

/** @typedef {'urgent'|'high'|'normal'|'low'} Priority */

/**
 * @param {string} text - the rendered priority cell text
 * @returns {Priority|null} null when unrecognised (fail quiet)
 */
function parsePriority(text) { /* ... */ }
```

The honest tradeoff: JSDoc generics and conditional types are painful. You will not write either. This code does `querySelectorAll`, string comparison, and `setAttribute` — the type surface is a four-member union and some `Element | null` narrowing, which is exactly where JSDoc is at its best.

**Version note on `typescript@7.0.2`:** TypeScript 7.0 (July 2026) is the Go-native compiler rewrite — 8–12× faster, same language. It ships **without a stable programmatic API** until 7.1, so tools that consume the compiler API (notably `typescript-eslint`, and the Vue/Svelte/Astro toolchains) cannot use it yet. That is irrelevant here because you're not doing type-aware linting — Biome and oxlint have their own parsers. If any tool does complain, pin `typescript@6.0.3` (the last of the JS-implemented line) with no loss of type checking.

**Switch to real `.ts` when** you adopt WXT in v2 — at that point a bundler exists anyway, so `.ts` is free and the options page + storage code will have a type surface worth the ceremony.

### Lint and format

Use **Biome 2.5.11** if you want linting: one binary, lint + format, one config file, no plugin graph, no `eslint-config-*` chain to maintain. `oxlint@1.81.0` is a faster lint-only alternative.

Do **not** assemble ESLint 10 + typescript-eslint + Prettier for a single source file. That's three configs and a dozen transitive dependencies guarding 300 lines. Honestly, `tsc --checkJs` alone is a defensible v1 answer — add Biome when the formatting arguments start.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| No bundler | **WXT 0.21.4** | v2, once an options page + `chrome.storage` + configurable colours land, or a second browser is committed to. The migration is genuinely easy from a clean single file. |
| No bundler | **CRXJS 2.7.1** | Only if you already own a Vite config for other reasons. Be aware of the content-script HMR / MutationObserver friction. |
| Declarative `content_scripts` | `chrome.scripting` + `activeTab` | A click-to-activate tool. Structurally incompatible with Zhroma's zero-interaction requirement. |
| `!important` unlayered CSS | `@layer` | Organising a stylesheet you own end to end. Actively harmful for beating a host page. |
| `content_scripts.css` | Constructed stylesheets / `adoptedStyleSheets` | v2, if user-configured colours can't be expressed as custom properties on `:root`. Probably still won't be needed. |
| Attribute + CSS | Inline styles from JS | Never here. Same re-render clobbering, worse maintainability, blocks the v2 config path. |
| JS + JSDoc | Real TypeScript | Once a bundler exists (i.e. with WXT in v2). |
| happy-dom | **jsdom 30.0.1** | If you hit a DOM API happy-dom doesn't implement faithfully. Swapping is a one-line Vitest config change. |
| Playwright | Puppeteer | No reason identified. Playwright's extension path is better documented. |
| Biome | ESLint 10 + Prettier | A larger codebase with an existing ESLint investment or a needed custom rule. |
| GitHub Pages privacy policy | Any static host | Any host works. Same-repo versioning is the only real argument for Pages. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Manifest V2 | Not accepted by the Chrome Web Store | MV3 |
| **Plasmo** | Last published 2025-05-17; widely described as maintenance mode with no active development | WXT (v2 only) |
| Any bundler in v1 | Ships an artifact ≠ source, adds a toolchain to maintain across dormant months, adds supply chain to a zero-dependency privacy story | Hand-written files |
| `host_permissions` | Redundant with a declarative content script's `matches`; adds a permission to justify at review for zero capability | Just `content_scripts.matches` |
| `permissions: ["scripting"]` | Needs a service worker, `host_permissions`, and runs later than declarative injection | Declarative `content_scripts` |
| `activeTab` | Requires a user gesture — incompatible with zero-configuration always-on tinting | Narrow `matches` pattern |
| `<all_urls>`, `*://*/*`, `https://*/*` | Triggers the "may require an in-depth review" warning and a scary install prompt, for a site-specific tool | `https://*.zendesk.com/agent/*` |
| `background` service worker | v1 has no state and no cross-tab coordination; brings the whole MV3 SW lifecycle bug class along | Omit entirely |
| `chrome.storage` | v1 is explicitly zero-config with hard-coded colours | Nothing. v2 concern. |
| `@layer` around the tint rules | Layer order is set by first appearance, so your layer registers lowest; unlayered styles beat all layered ones | Plain unlayered rules with `!important` |
| Inline styles set from JS | Same re-render clobbering as attributes, but scatters the palette through your logic | `setAttribute` + CSS |
| React / Preact / Svelte / Vue | Nothing is being rendered — you're setting one attribute on existing DOM | Native DOM APIs |
| Tailwind or any CSS framework | Four colours and four rules | A hand-written 20-line stylesheet |
| Remote fonts, remote CSS `@import` | Remote-resource smell at review; breaks the "no network calls" claim | System font stack, inline values |
| Any analytics/telemetry (GA, Sentry, PostHog) | Directly contradicts the privacy positioning and the data-usage certification you must sign | Nothing. This is a stated ethical line. |
| Minification / obfuscation | Obfuscation is banned outright; minification is permitted but slows review and saves ~2KB | Ship as authored |
| `web-ext` | Firefox-oriented tooling; here it only wraps a `zip` call | `zip` in an npm script |
| Jest | Slower, ESM friction, no advantage | Vitest 4.1.11 |
| Puppeteer / Selenium | Playwright's MV3 extension support is better documented and maintained | Playwright 1.62.1 (sparingly) |
| ESLint + typescript-eslint + Prettier | Three configs and a dependency tree guarding one source file | Biome 2.5.11, or nothing |
| Live-Zendesk E2E in CI | Credentials, MFA, rate limits, and failures unrelated to your code | Fixture-based Tier 2 tests + a manual pre-submission checklist |

---

## Stack Patterns by Variant

**If the `/agent/*` match pattern misses SPA entry (verify against a live tenant in phase 1):**
- Widen `matches` to `https://*.zendesk.com/*` and early-return in `content.js` when `location.pathname` doesn't start with `/agent/`
- Because Chrome evaluates `matches` only at navigation time; a client-side route into `/agent/` after landing on `/` would never inject
- Cost: a slightly broader install warning. Still narrow enough to avoid the in-depth-review flag. **Do not widen preemptively.**

**If Zendesk's cell backgrounds defeat the row tint:**
- Target row + direct children, and use semi-transparent colours
- Because a `<td>` background paints over its row's background; translucency also survives light/dark themes with one palette

**If Zendesk's hover/selected rules also use `!important`:**
- Raise specificity (e.g. `tr[data-zhroma="urgent"]:hover`) *in addition to* `!important`
- Because `!important` vs `!important` falls through to specificity, then source order — and their runtime-injected styles win source order

**If v2 adds an options page, storage, and configurable colours:**
- Migrate to WXT 0.21.x, convert `.js` + JSDoc to `.ts`, add `chrome.storage.sync`, keep the attribute + custom-property styling seam exactly as is
- Because a bundler is genuinely warranted at that size — and the `:root` custom properties were designed to be the plug-in point

**If a second browser (Firefox/Edge) is ever committed to:**
- Migrate to WXT and add `web-ext` for Firefox packaging
- Because cross-browser manifest divergence is the one problem WXT solves that you cannot cheaply hand-roll

---

## Version Compatibility

| Package | Version | Requires | Notes |
|---------|---------|----------|-------|
| `typescript` | 7.0.2 | Node ≥16.20 | Go-native compiler. **No stable programmatic API until 7.1** — incompatible with `typescript-eslint` and framework tooling. Irrelevant here (no type-aware lint). Fall back to `6.0.3` if a tool objects. |
| `@types/chrome` | 0.2.8 | TS 5.6–6.0 tag range | Works with TS 7 in practice — these are plain `.d.ts` files. |
| `vitest` | 4.1.11 | Node `^20 \|\| ^22 \|\| >=24` | v5 is at RC as of 2026-08-31; stay on stable 4.x. |
| `happy-dom` | 20.13.0 | Node ≥20 | Vitest environment. Swap to `jsdom@30.0.1` if fidelity issues appear. |
| `@playwright/test` | 1.62.1 | Node ≥20 | Bundles its own Chromium. Extensions require `launchPersistentContext`; `channel: 'chromium'` for headless. |
| `@biomejs/biome` | 2.5.11 | Node ≥14.21 | Optional. |
| Node.js | 22 LTS | — | Dev only. The shipped extension has no Node relationship whatsoever. |
| Chrome | Stable M152 (2026-09) | — | Nothing used here is newer than ~M88 API surface. Omit `minimum_chrome_version`. |

**Compatibility risk assessment: essentially nil.** The shipped extension has zero dependencies, so there is no dependency graph to break. The devDependency set is four packages with no shared peers. This is a deliberate property of the stack, not luck — and it is the main reason this project can survive twelve months of dormancy and still build on the first try.

---

## Sources

**Official (HIGH confidence — verified 2026-09-02):**
- `developer.chrome.com/docs/extensions/reference/manifest` — required vs. optional MV3 manifest fields
- `developer.chrome.com/docs/extensions/reference/manifest/content-scripts` — `matches`, `css`/`js`, `run_at` semantics, `world`, CSS-before-DOM-construction behaviour
- `developer.chrome.com/docs/extensions/reference/manifest/icons` — icon sizes, PNG-only (no SVG/WebP)
- `developer.chrome.com/docs/webstore/publish` — upload flow, dashboard tabs, 2-item new-publisher cap, 30-day deferred publishing
- `developer.chrome.com/docs/webstore/images` — 128×128 icon, 1280×800 / 640×400 screenshots, 440×280 promo, 1400×560 marquee
- `developer.chrome.com/docs/webstore/review-process` — timelines, extended-review triggers, broad-host-permission scrutiny, "submit code as authored"
- `developer.chrome.com/docs/webstore/program-policies/mv3-requirements` — remote-code prohibition, scope, and consequences
- `developer.chrome.com/docs/webstore/cws-dashboard-privacy` — the four privacy disclosures and the policy-URL requirement
- `playwright.dev/docs/chrome-extensions` — `launchPersistentContext`, `channel: 'chromium'` headless, MV3 service-worker caveats
- npm registry API — all version numbers and publish dates queried directly on 2026-09-02
- `chromiumdash.appspot.com` — Chrome stable milestone 152

**Community / secondary (MEDIUM confidence — corroborated across ≥2 sources):**
- WXT's own framework comparison + multiple 2026 framework roundups — Plasmo maintenance status (corroborated by npm publish date 2025-05-17, which is HIGH-confidence primary evidence)
- crxjs/chrome-extension-tools issues #811, #1119 — content-script HMR vs. MutationObserver friction
- MDN + CSS-Tricks cascade-layer references — layer ordering, unlayered-beats-layered, `!important` interaction
- Chrome Web Store developer fee: US$5 one-time, corroborated across multiple 2026 sources and the official registration page

**Known gaps (LOW confidence — flag for phase-level research):**
- **Zendesk agent-view DOM structure is undocumented.** Searches across Zendesk's help centre and developer docs found nothing describing the ticket-table markup. Selectors must be derived empirically from a live tenant, and a captured fixture is the only durable record. This is the project's standing risk and no amount of desk research retires it.
- **Whether Zendesk Garden uses cascade layers.** Assumed not (CSS-in-JS, unlayered) — which is why `!important` is prescribed. If they *do* adopt layers, `!important` still wins, so the recommendation is robust either way.
- **Priority string localisation.** Whether non-English tenants render localised priority text is unverified. Decide English-only explicitly, and make the parser fail quiet on unrecognised strings.
- **SPA entry behaviour for the `/agent/*` match pattern** — needs a one-minute check against a live tenant.

---
*Stack research for: Chrome MV3 content-script extension (Zendesk agent-view priority tinting)*
*Researched: 2026-09-02*
