<!-- GSD:project-start source:PROJECT.md -->

## Project

**Zhroma**

Zhroma is a Chrome extension that colour-codes ticket rows in Zendesk agent views by priority, so an agent can see what's urgent at a glance instead of reading a column of plain text. It installs from the Chrome Web Store, works on any `*.zendesk.com` agent interface with zero setup, and is aimed at support agents who live in Zendesk views all day.

**Core Value:** Open a Zendesk view and know within one second which tickets are urgent — without reading a word.

### Constraints

- **Tech stack**: Chrome Extension Manifest V3 — MV2 is no longer accepted by the Chrome Web Store
- **Platform**: Chrome only for v1
- **Permissions**: As narrow as possible — host access scoped to `*.zendesk.com`, no API tokens, no remote code, nothing that complicates store review
- **Setup**: Zero configuration. It must work correctly the moment a stranger installs it, with no options to set first
- **Dependency**: Reads Zendesk's own rendered DOM, which Zendesk can change at any time without notice
- **Privacy**: Ticket data never leaves the browser. No telemetry, no network calls, nothing stored off-device — this is both an ethical line and what makes the store listing simple

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## The Headline Verdict

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

## Installation

# Runtime dependencies — none, and this is load-bearing

# (no `npm install` line here on purpose)

# Dev dependencies

# Optional dev dependencies

### Repository layout

## 1. Manifest V3 Essentials

### The complete v1 manifest

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

| | Declarative `content_scripts` | Programmatic `chrome.scripting.executeScript` |
|---|---|---|
| Permissions needed | None beyond the `matches` pattern | `"scripting"` **plus** `host_permissions` **plus** a `background` service worker to call it from |
| Timing | Injected by Chrome as the page loads; CSS lands before first paint | Requires a navigation event to observe, then a round-trip — always later, and it can miss loads |
| Review surface | One manifest key | Three extra declarations to justify on the Privacy tab |
| Code | Zero | A service worker plus `chrome.tabs.onUpdated` plumbing |

### `host_permissions` — you do not need it

### Match pattern: scope it to the agent interface

- `https://` only — never `*://`. There is no reason to run on plaintext HTTP, and it narrows the ask.
- `*.zendesk.com` matches any subdomain *and* the bare `zendesk.com` (Chrome match-pattern semantics), which is fine.
- `/agent/*` narrows to the agent interface, excluding help-centre pages and the marketing site on `www.zendesk.com`. This materially strengthens the review story: the extension provably cannot run on a customer-facing page.

### `run_at` timing

- Declarative `css` is injected by Chrome before DOM construction *regardless* of `run_at`, so your tints are registered from the first paint. There's no flash-of-untinted-content to engineer around.
- The JS's job is to set attributes on rows that do not exist yet — Zendesk's ticket table is rendered by client-side JavaScript well after `document_idle`. Choosing `document_start` buys you nothing except running your setup code while the main thread is busy with Zendesk's own boot.
- Correctness comes entirely from the `MutationObserver`, not from injection timing. Design accordingly: assume the table is absent at startup and let the observer bring it in.

### `activeTab` — not viable here

### What MV3 forbids

| Forbidden | Applies to Zhroma? |
|-----------|--------------------|
| Remotely hosted code — external `<script src>`, `eval()` of fetched strings, custom interpreters running remote commands | No, and trivially provable: the extension makes zero network requests |
| Code whose full functionality isn't discernible from the submitted source | No — unminified, unbundled, ~300 lines |
| Obfuscation (minification *is* permitted) | No — nothing is transformed |
| Relaxing the extension CSP for extension pages | N/A — no extension pages |
| Remote CSS `@import`, remote webfonts | **Avoid.** Use system font stacks and inline all colour values. A remote `@import` in your stylesheet is a remote-resource smell at review for no benefit. |

## 2. Build Tooling — the verdict

### **No bundler. Ship hand-written files.**

| Bundler benefit | Worth it? |
|---|---|
| ESM `import` across multiple source files | Not needed at this size. One `content.js` is honest. If you genuinely want two files, list them in `js: []` — they share one isolated-world global; use a namespace object or IIFEs. |
| npm runtime dependencies | You have none and should keep it that way. |
| TypeScript transpilation | Sidestepped by JSDoc + `checkJs` (see §6). |
| HMR | The Load-unpacked → reload-arrow → refresh loop is comparably fast and never breaks. |
| Cross-browser output | Chrome-only in v1 by explicit decision. |
| Auto-zip on build | A one-line `zip` script. |
| Minification | Actively counterproductive — see the review section. |

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

## 3. Styling Injected Into a Hostile SPA

### The prescribed approach

### Why each part of that

- Cascade-layer order is fixed by **first appearance in the document**.
- Your content-script stylesheet is injected before page CSS, so *your* layer registers first — making it the **lowest**-priority layer.
- Worse, **unlayered normal styles beat all layered normal styles.** Wrapping your rules in a layer moves them *below* every unlayered Zendesk rule.

### Two traps to budget for

## 4. Testing — what's actually testable

### Tier 1 — Unit tests on pure logic (Vitest 4.1.11). **Highest value per minute.**

- **Priority text → priority key.** Whitespace, casing, and localisation variants. Zendesk renders priority as display text; an agent on a non-English locale sees different strings. Decide now whether v1 is English-only (fine — but make it a *recorded* decision, and make the parser fail quiet rather than mis-tint).
- **Header row → priority column index.** The "is there a Priority column at all?" determination that drives the hint. This is directly one of the Active requirements and it is 100% testable in isolation.
- **Diffing.** Given a set of rows and their current `data-zhroma` values, which need changing? Getting this right is what keeps the observer cheap.

### Tier 2 — DOM integration (Vitest + happy-dom 20.13.0). **The most valuable test in the project.**

### Tier 3 — Browser rendering check (Playwright 1.62.1). **Optional, narrow.**

- Does the tint actually *win* the cascade against Zendesk's real stylesheet?
- Does it look right? (a screenshot assertion is the only automatable proxy for the glance test)

### What cannot be tested, and what to do instead

### What NOT to use for testing

- **Jest** — slower, ESM friction, zero advantage over Vitest here.
- **Puppeteer** — Playwright's extension documentation and headless-extension support are better maintained.
- **Selenium / Karma** — wrong decade for this.
- **A live-Zendesk E2E suite in CI** — credentials in CI, MFA, rate limits, and a test that fails for reasons unrelated to your code. The manual checklist is strictly better value.

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

### Listing copy

- `name` ≤ 75 chars (from manifest), `description` ≤ 132 chars (from manifest)
- Detailed description, category, language (dashboard)
- Keep the copy in `store/listing.md` under version control. You will rewrite it after the first rejection and you'll want the diff.

### Privacy tab — four disclosures plus a policy URL

### What triggers extended review

| Trigger | Zhroma's position |
|---------|-------------------|
| Broad host patterns (`<all_urls>`, `*://*/*`, `https://*/*`) | **Clean.** `https://*.zendesk.com/agent/*` is narrow and single-vendor; it does not raise the dashboard's "may require an in-depth review" warning. |
| Sensitive API permissions (`tabs`, `cookies`, `history`, `downloads`, `webRequest`, `debugger`) | **Clean — zero permissions requested.** |
| Obfuscated or minified code | **Clean.** No build step means "code as authored," which Chrome explicitly asks for. |
| Remote code | **Clean.** No network calls at all. |
| Code volume | **Clean.** ~300 readable lines. |

### Realistic timeline

## 6. TypeScript vs. Plain JavaScript

### Verdict: **JavaScript files with JSDoc types, checked by `tsc --noEmit --checkJs`.**

- **Add a build step** — which reintroduces exactly the toolchain complexity you just eliminated, for a file that has no imports and no dependencies.
- **Run `tsc --outDir`** — which produces a shipped `dist/` that differs from your source, costing you the "code as authored" review advantage.

### Lint and format

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

## Stack Patterns by Variant

- Widen `matches` to `https://*.zendesk.com/*` and early-return in `content.js` when `location.pathname` doesn't start with `/agent/`
- Because Chrome evaluates `matches` only at navigation time; a client-side route into `/agent/` after landing on `/` would never inject
- Cost: a slightly broader install warning. Still narrow enough to avoid the in-depth-review flag. **Do not widen preemptively.**
- Target row + direct children, and use semi-transparent colours
- Because a `<td>` background paints over its row's background; translucency also survives light/dark themes with one palette
- Raise specificity (e.g. `tr[data-zhroma="urgent"]:hover`) *in addition to* `!important`
- Because `!important` vs `!important` falls through to specificity, then source order — and their runtime-injected styles win source order
- Migrate to WXT 0.21.x, convert `.js` + JSDoc to `.ts`, add `chrome.storage.sync`, keep the attribute + custom-property styling seam exactly as is
- Because a bundler is genuinely warranted at that size — and the `:root` custom properties were designed to be the plug-in point
- Migrate to WXT and add `web-ext` for Firefox packaging
- Because cross-browser manifest divergence is the one problem WXT solves that you cannot cheaply hand-roll

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

## Sources

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
- WXT's own framework comparison + multiple 2026 framework roundups — Plasmo maintenance status (corroborated by npm publish date 2025-05-17, which is HIGH-confidence primary evidence)
- crxjs/chrome-extension-tools issues #811, #1119 — content-script HMR vs. MutationObserver friction
- MDN + CSS-Tricks cascade-layer references — layer ordering, unlayered-beats-layered, `!important` interaction
- Chrome Web Store developer fee: US$5 one-time, corroborated across multiple 2026 sources and the official registration page
- **Zendesk agent-view DOM structure is undocumented.** Searches across Zendesk's help centre and developer docs found nothing describing the ticket-table markup. Selectors must be derived empirically from a live tenant, and a captured fixture is the only durable record. This is the project's standing risk and no amount of desk research retires it.
- **Whether Zendesk Garden uses cascade layers.** Assumed not (CSS-in-JS, unlayered) — which is why `!important` is prescribed. If they *do* adopt layers, `!important` still wins, so the recommendation is robust either way.
- **Priority string localisation.** Whether non-English tenants render localised priority text is unverified. Decide English-only explicitly, and make the parser fail quiet on unrecognised strings.
- **SPA entry behaviour for the `/agent/*` match pattern** — needs a one-minute check against a live tenant.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
