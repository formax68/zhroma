# Project Research Summary

**Project:** Zhroma
**Domain:** Public Chrome Manifest V3 content-script extension that scrapes and restyles a third-party React SPA (Zendesk agent views)
**Researched:** 2026-09-02
**Confidence:** MEDIUM-HIGH overall — HIGH on platform mechanics, store policy and competitive landscape; **NONE on the live Zendesk DOM**, which is the project's entire foundation

## Executive Summary

Zhroma is a single-purpose DOM-scraping browser extension, and every researcher independently converged on the same shape: **no build step, no bundler, no runtime dependencies, no `permissions` array, no service-worker-driven anything.** Four hand-written files, a declarative `content_scripts` entry whose `matches` pattern *is* the host-access grant, a debounced `MutationObserver` on `document.body` whose only DOM write is one idempotent `data-zhroma-priority` attribute per row, and a static stylesheet that does all the painting. The architecture is called "Stamp and Style," and its virtues are structural rather than stylistic: the observer cannot self-retrigger because it never watches attributes; the extension degrades to "page untouched" on every failure path; a route change needs no detection because it *is* a large DOM mutation; and the entire deferred v2 roadmap (custom colours, stripe, pill, colourblind palette) becomes a stylesheet edit. The no-bundler choice is not minimalism for its own sake — it is what makes the Chrome Web Store review posture near-optimal ("submit your code as authored"), makes the zero-network privacy claim trivially auditable by an enterprise IT admin, and makes the repo survivable after twelve dormant months when a Zendesk change demands a one-line selector fix under time pressure.

The competitive picture is unusual and should shape ambition. The *exact* product Zhroma is building already existed — "Zendesk Priority Highlights," red/orange/yellow/green, priority read from the view — reached 87 installs, accumulated reviews reading "It no longer works," and was **delisted on 2026-08-27 for a policy violation plus a missing privacy policy.** All three of Features, Architecture and Pitfalls found this independently. The one survivor, Zest (1,000 users), succeeded by being *more general* — colour by any column — and paid for it in configuration friction: you must type a category and pick a colour, then manually refresh the page. **Zhroma's wedge is therefore not "colour by priority"; it is "colour by priority, correct on first paint, with no configuration and no refresh."** That is precisely where Zest is weak, and no Zendesk Marketplace app can ever compete: ZAF v2 sandboxes every app in an iframe with no host DOM access, so a browser extension is one of only two mechanisms on earth that can tint Zendesk's real list.

The risks are not evenly distributed, and the top three are all *silent* failures the developer cannot detect from their own machine. (1) **The Zendesk DOM is undocumented and unverified** — no researcher could establish it from public sources, which is itself the finding: there is no supported way to do what this project does. (2) **English-text matching fails invisibly for a large fraction of installs** — the agent UI ships in 40+ languages, each agent picks their own independently of the account, and this failure is indistinguishable in naive code from "this view has no Priority column," which turns the hint into a false accusation. (3) **Zendesk dark mode already shipped, is activated by default at account level, covers views, and can flip mid-session** — hard-coded light pastels on a dark row give near-white backgrounds under near-white text, with no escape hatch in a zero-config extension. Mitigations, in order: a mandatory live-instance recon spike before any implementation; a locale table plus a three-way failure taxonomy that never accuses; and a single load-bearing CSS technique — a translucent `background-image: linear-gradient(rgba(...), rgba(...))` — which lets Zendesk's own light/dark/hover/selected `background-color` composite through and thereby dissolves the dark-mode problem and the row-state-collision problem simultaneously.

## Key Findings

### Recommended Stack

Ship a **no-build extension**: `manifest.json`, a handful of plain ES2022 `.js` files concatenated by MV3's `js[]` array, one `.css` file, and an `icons/` folder — zipped and uploaded. Type safety comes from JSDoc plus `tsc --noEmit --checkJs`, so the file you edit is byte-identical to the file that ships and the file a reviewer reads. All tooling lives in `devDependencies` and never enters the artifact. The migration trigger to WXT is pre-decided and written down: adopt it when any *two* of (>~800 lines, an options page exists, a second browser target, an unavoidable runtime dependency) become true. Not before.

**Core technologies:**
- **Manifest V3 + declarative `content_scripts`**: injection and host access — the `matches` pattern is itself the grant; **no `host_permissions` block, ever** (converged finding, Stack + Pitfalls)
- **Plain JS (ES2022) + JSDoc + `// @ts-check`**: the whole extension, ~300 lines — real type checking with zero emitted output
- **`content_scripts.css` static stylesheet**: all colour — Chrome injects declarative CSS before DOM construction, so there is no flash of untinted content to engineer around
- **`MutationObserver` (childList + subtree, `attributes: false`), debounced 50 ms**: the re-render survival mechanism; also handles SPA route changes for free
- **Vitest 4.1.11 + happy-dom 20.13.0** (dev only): fixture-driven unit and DOM-integration tests, including the mutate-the-fixture test that verifies re-application without a Zendesk account

**What NOT to use:** any bundler in v1, `host_permissions`, `scripting`, `activeTab`, `webNavigation`, a `background` service worker beyond ~20 lines for the badge, inline styles from JS, `@layer`, hashed class names, `nth-child` selectors, `setInterval` polling, remote CSS/fonts, any telemetry, Plasmo (dead since 2025-05-17).

### Expected Features

**Must have (table stakes):**
- Tint rows by priority, all four values — the product
- Survive re-render: sort, refresh, view switch, scroll, tab switch — a load-time-only tint looks broken within seconds
- **Dark-mode-correct tint, reacting to a live theme flip** — *missing from PROJECT.md v1 scope; see verdict below*
- Do not fight the host's own hover / selected / unread / status-dot styling — agents lose their place in a 200-row queue and blame the extension
- Ticket text stays legible over the tint, in both themes
- Fail silently, never break the page — *promote from PROJECT.md Context to an Active, tested requirement*
- A stated performance budget, verified on a large view (<2 ms typical pass, <16 ms worst, zero forced layouts, no detached-node growth over 30 view switches)
- Hint when the view has no Priority column — **and it must distinguish "column genuinely absent" from "extraction failed," or it lies**
- Privacy policy + narrow justified permissions — evidenced as *existential*, not bureaucratic: this is what delisted the incumbent
- Works on any `*.zendesk.com` agent view with zero setup

**Should have (competitive):**
- **Zero configuration** — the wedge. Make it the headline of the store listing, not a footnote
- **No manual refresh, ever** — falls out of the observer; Zest's own store copy tells users to refresh. Free differentiation; say it explicitly
- **A visible liveness/status signal on the toolbar icon** — converts silent failure into self-reported failure at the cost of one manifest key
- Legend / counts per priority — one component, two jobs; strong v1.x candidate
- Native-feeling dark mode — same work as the table stake; the differentiation is polish

**Defer (v2+):**
- User-configurable colours — **confirmed strongly.** Zest proves configuration is the friction, not the draw
- SLA-breach-risk tinting — strongest v2 idea; needs a second extraction path, plan-awareness, and a mode selector
- Alternative treatments (stripe, pill) — confirmed, **but architect behind a single "apply treatment to row" seam** so switching is contained
- Ticket page, tab strip, search results; Firefox/Edge/Safari
- Zendesk API for priority — **not deferred: permanently rejected.** It would destroy zero-config and expand the permission ask that just killed a competitor

### Architecture Approach

"Stamp and Style": a stateless pass, re-derived from scratch every time, whose only DOM write is `setAttribute('data-zhroma-priority', token)` on rows selected by `[data-garden-id="tables.row"]` (attribute-only, no element qualifier, so a future virtualisation to `<div role="row">` costs an afternoon not a rewrite). The Zendesk agent UI is built on Zendesk Garden, whose `@zendeskgarden/react-tables` package emits `data-garden-id` on every table element unconditionally in production — verified by extracting the published npm tarball (v9.15.8) and reading `dist/esm/styled/*.js`. That is a versioned, published, first-party contract and it is the stable selector surface; `data-test-id` values are a useful secondary tier; styled-components `sc-*` hashes are exactly how the incumbent went from working to "It no longer works."

**Major components:**
1. **Palette (CSS, declarative)** — the token to colour mapping and *all* visual treatment. Knows nothing about tables, headers or locales.
2. **Observer Controller** — the only stateful component: one `MutationObserver` on `document.body`, a 50 ms debounce, a reentrancy flag. Narrowing happens inside the pass, not in the `observe()` call, because a narrow root gets replaced on view switch and the observer goes silently deaf.
3. **Table Locator → Column Resolver → Priority Extractor** — three pure, individually unit-testable functions. The Column Resolver derives the index from the header row (never hard-coded), memoised in a **`WeakMap` keyed on the `<table>` element**; a module-level `let priorityIndex` survives a route change and tints the wrong column — the single most likely bug in this architecture. The Extractor owns **all** localisation.
4. **Stamper** — the *only* DOM-mutating call site in the codebase, with an idempotence guard. This is an auditable boundary, not tidiness: "can this loop?" is a review of one 20-line file.
5. **Hint Presenter + ~20-line service worker** — `chrome.action.setBadgeText({tabId})` needs no permission at all; the popup is static HTML.

### Critical Pitfalls

1. **You break and nobody tells you.** "Fail quietly" + "no telemetry" + "users don't file bugs" compose into permanent blindness. Each constraint is individually correct. Fix: make the **toolbar icon the status channel** (tinting / ran-but-matched-nothing / no-table-found), ship a report button that calls `chrome.tabs.create()` with a pre-filled GitHub issue URL (user-initiated navigation, zero egress, no `tabs` permission), log one structured `console.info` per pass carrying counts and locale but **never ticket content**, and keep a permanent Zendesk sandbox on a calendar cadence. Detection latency and Google's review latency *add*.
2. **Locale-dependent priority reading.** See the dedicated section below — this is the finding most likely to be under-weighted and it must not be.
3. **Dark mode vs. hard-coded light tints.** Already shipped, account setting *"activated by default"*, covers views, flips without a reload, and `prefers-color-scheme` will lie to you because Zendesk's toggle is in-app. Fix: the translucent-gradient technique (below).
4. **Fragile selectors.** DevTools' "Copy selector" hands you `.sc-1x2y3z4 > tbody > tr:nth-child(n) > td:nth-child(4)` and it works on the first try — that is the trap. `nth-child` breaks the instant a *user* reorders their view columns, which is per-user configuration, so it breaks for some people immediately. Layer strategies, feature-detect never version-detect, derive column position from the header row, and write a `SELECTORS.md` recording every assumption and its fallback.
5. **CSS collision that kills hover and selection.** Opaque `background-color` + `!important` wins the wrong fight: agents doing bulk actions can no longer see what they have checked, which is a data-integrity problem, not a cosmetic one. Fix: don't compete for the property at all.
6. **Store rejection and later delisting.** The non-obvious one is **Yellow Potassium (minimum functionality)** — a reviewer opens a fresh Zendesk trial whose default view has no Priority column, and Zhroma correctly does nothing. Your core design decision and the store's minimum-functionality bar point in opposite directions. Beat it with the listing: real 1280x800 before/after screenshots and an explicit note that the view needs a Priority column.

---

## Resolved Tensions

The four research files converged on most things. Where they diverged, here are the rulings the roadmapper should treat as settled.

### 1. Storage and the on/off toggle — **take `storage`, spend it on exactly one boolean**

PROJECT.md commits to "no options page, no storage, nothing to configure." Features argues `storage` is worth it for a kill switch. Architecture argues an in-page hint banner would need dismissal, hence persistence, and therefore recommends the badge + popup instead — which needs no storage. Pitfalls argues for zero API permissions, full stop.

**These reconcile cleanly, because Architecture's objection dies with the banner.** Adopt badge + popup for the hint (no storage, no permission, no page footprint, and it doubles as the Pitfall-1 status channel). Then, separately: **take the `storage` permission for a single on/off boolean in that same popup, defaulting to on.**

Rationale: (a) "no options page" and "nothing to configure" survive intact — those are the wedge, and a default-on switch requires no decision before first value; only the literal "no storage" clause is amended. (b) An always-on DOM-modifying extension on someone's primary work tool with no kill switch other than uninstall is a permanent loss when it misfires during a screen share, a customer-facing screenshot, or the week Zendesk ships a change. (c) `storage` produces **no user-visible install warning**, and the surviving competitor ships `["storage"]` as its *only* permission while still declaring zero data collection. (d) Most importantly: **permission-set changes trigger extended review on every subsequent update**, so this decision belongs in the first implementation phase, not at packaging time. Deciding it once, early, and never touching the manifest's permission surface again is worth more than the marginal purity of an empty `permissions` array.

Final v1 manifest surface: `content_scripts` (`https://*.zendesk.com/agent/*`, `all_frames: false`), `action`, `permissions: ["storage"]`, **no `host_permissions`**, no `tabs`, no `scripting`, no `activeTab`, no `webNavigation`.

### 2. Styling — **the two prescriptions are compatible; here is the single combined one**

Stack prescribes plain unlayered rules with `!important`. Pitfalls prescribes a translucent `background-image: linear-gradient(rgba(...), rgba(...))`. They are not in conflict — they answer different halves of the question, and the combined prescription is:

> **Attribute selector → unlayered rule → translucent `background-image` gradient. Never `@layer`. `!important` held in reserve for at most one declaration, added only if a live instance proves it necessary.**

`background-image` paints *above* `background-color` on the same element, so Zendesk keeps `background-color` for hover, selected, unread and dark mode, and Zhroma's hue composites on top. You never enter a specificity war because you are never competing for the same property — which is why `!important` becomes contingency rather than doctrine. Stack's `!important` reasoning (Garden is CSS-in-JS and appends `<style>` at runtime, so it wins source order) remains correct and remains the fallback if the empirical check shows a conflict; Architecture's specificity maths (`tr[attr] > td` at (0,2,1) beats a Garden single class at (0,1,1)) suggests it usually won't be needed. **The `@layer` prohibition is absolute and unanimous** — layer order is fixed by first appearance, your injected sheet registers first and therefore lowest, and unlayered normal declarations beat *all* layered normal declarations. Reaching for the modern tool by reflex inverts the intended precedence.

**The consequence the roadmapper must carry:** the palette must be **authored as alphas over an unknown substrate, not as hex values.** There is no "the red" — there is `rgba(220, 38, 38, 0.14)` compositing onto whatever Zendesk painted. This changes what a "choose the colours" task even is, and it must be settled *before* any colour value is picked. If dark backgrounds mute the tint too much, tune the alpha from a **once-per-pass measured relative luminance** of one row — never from a Zendesk class name, never from `prefers-color-scheme`, and never inside a per-row loop (forced layout).

### 3. Colourblind-safe palette — **pull the hue selection forward; the audit can still wait**

Verdict: **Features is right, adopt the challenge.** Split the deferral. The formal WCAG audit and any user-facing accessibility toggle stay deferred to v2, correctly. But **hue selection is a v1 decision that cannot be deferred**, because it is being made either way the moment someone writes a colour value. Red/orange/yellow/green — the palette the delisted competitor used — collapses Urgent and Low into the same apparent colour under deuteranopia, which makes a product whose *entire* value is colour useless to roughly 8% of male agents.

The fix costs nothing: **choose the four hues so that lightness also varies monotonically with priority**, so the levels remain distinguishable in greyscale. Free at design time; expensive to retrofit once users have learned the palette; removes a whole class of one-star reviews. Update PROJECT.md's Out of Scope entry to reflect the split rather than leaving it as a blanket deferral.

### 4. Dark mode — **v1 cannot ship without it, but the gradient technique makes it nearly free**

PROJECT.md does not mention dark mode. Features and Pitfalls both independently rank it **table stakes, not polish**: it is generally available in 2026 across all Suite and Support plans, the account-level toggle is *activated by default*, coverage explicitly includes views, and agents can pick "match system appearance" so the theme flips mid-session without a page load. Shipping hard-coded light pastels means near-white rows under Zendesk's near-white dark-mode text — worse than doing nothing, with no escape hatch in a zero-config extension. The cautionary data point: the third-party "Zendesk Dark Mode" extension has 849 users and a **2.6/5** rating. Bolting themes on afterwards is unforgiving.

**But note the payoff of decision 2:** the translucent-gradient technique means you never need to know which theme is active. Zendesk's own surface colour shows through and the hue composites onto it. That demotes dark mode from a feature requiring theme detection to (a) an acceptance criterion — light and dark screenshots of a large view, text readable and all four tints mutually distinguishable — and (b) *possibly* a two-tier alpha selected by measured luminance, only if the empirical check shows dark surfaces mute the tint below the glance threshold. **Do not build a theme-detection subsystem before proving you need one.**

### 5. Localisation — carry this at full weight

Multiple researchers escalated this independently and it should not be smoothed over. The Zendesk agent UI is localised into **40 languages plus 4 variants**, and critically **each agent selects their own interface language independently of the account's configured languages** — so this is not "some tenants are German," it is "some agents on *any* tenant are German." The header is `Prioritaet` / Japanese / `Prioridade`; the values are `Dringend / Hoch / Normal / Niedrig`, the Japanese equivalents, `Urgente / Alta / Normal / Baixa`.

Three properties make this the nastiest item in the research:

- **It fails silently and invisibly.** No exception, no console error, no red flag. Those agents install, see nothing change, uninstall, and possibly leave a review. The developer will never reproduce it, because the developer works in English.
- **It is indistinguishable in naive code from "this view has no Priority column."** Route it to the existing hint and you tell a German agent whose view *already has* the column to go add one. The hint becomes a false accusation and reads as "this extension is broken" — the exact review the incumbent collected.
- **Recovery is an order of magnitude more expensive than prevention.** Retrofitting means a detection rewrite plus a ~176-string table plus a full review cycle, aimed at a user base that has already churned.

Required responses, in order: (1) **Phase 0 recon must include at least one non-English locale — this is a hard gate, not a stretch goal.** Look first for a locale-independent machine-readable signal on the priority cell (a `data-*`, a class, an `aria-label` token, an icon `href`); if one exists the entire pitfall evaporates. (2) Otherwise build `locales.js` as **data, not logic**, so adding Japanese is a JSON edit and locale growth is a data PR. (3) Normalise before comparing — case-fold, trim, handle non-breaking spaces and combining diacritics, compare with `localeCompare(..., {sensitivity:'base'})`. (4) **Never** fall back to column position: views are user-configured, so position is *less* durable than text, not more. (5) Make "unknown locale" a first-class third failure state, and **gate the hint on locale coverage** — an unknown locale must stay silent rather than accuse. (6) A value-set fingerprint (the column whose distinct values number <= 4) is a useful *hint suppressor* for unknown locales, but it can never tell you which value means Urgent, so it must never become a tinting path. **A wrong tint is worse than no tint.**

Warning signs to treat as build-blockers: a string literal `'Urgent'` anywhere in shipped source; a test plan that says "open a view and check the colours" without naming a locale; a failure taxonomy with two states instead of three.

---

## Implications for Roadmap

Coarse MVP phases, each delivering an end-to-end user-visible capability. **Phase 0 is a prerequisite spike and cannot be planned around.**

### Phase 0: DOM Recon Spike — *prerequisite, not a deliverable phase*

**Rationale:** All four researchers independently demanded this. Zendesk publishes **no DOM contract** for the agent-view ticket table — that absence is itself the finding. Three of the top four pitfalls are *decided* by what recon finds, and the answers change the plan rather than merely informing it. Pitfalls states it plainly: attempting real implementation before recon reports means building on assumptions research could not verify. Architecture states it equally plainly: do not plan later stages in detail before stage 0 reports.

**Delivers:** a captured HTML fixture per scenario (committed to `test/fixtures/`), a `SELECTORS.md` recording each DOM assumption and its fallback, a durability-ranked selector inventory, and a written answer to each open question. Half a day of DevTools work against a live tenant. Not shippable, not optional.

**Must answer, empirically:**
1. Is `data-garden-id` present on rows in a *current* agent view? (The whole architecture rests on this. Fallbacks: `data-test-id="generic-table-row"`, then structural.)
2. Is there a **locale-independent** priority signal on the cell or row? *Highest value per minute spent* — if yes, the entire localisation pitfall evaporates and components 4/5/6 may collapse to a stylesheet.
3. **Which element actually paints the row background** — the row, the cells, or an inner wrapper? Probe with `background: magenta` at each level.
4. Does `tr[data-zhroma-priority] > td` win the cascade without `!important`, and does the translucent gradient in fact let hover and selected states show through?
5. Is Shadow DOM in play? Open or closed? **A closed root would be terminal for this approach.**
6. Does `document.documentElement.lang` reflect the *agent UI* language? Recon in **two or more locales, one non-English** — hard gate.
7. Are views virtualised? Does the body table carry its own `<thead>`? Are agent views inside an iframe? Is `https://*.zendesk.com/agent/*` sufficient, or do vanity domains break the promise of "any Zendesk"?
8. Does Zendesk's framework strip unknown `data-*` attributes on re-render? (Determines whether the safety-net sweep is necessary or merely prudent.)

**Also, and separately from code:** stand up a permanent Zendesk sandbox account and register the $5 Chrome developer account with a *dedicated, durable* Google identity and 2SV recovery codes stored. Both have latency; both gate later phases.

### Phase 1: One row is tinted, on a real view, on first load — **the thinnest vertical slice**

**Rationale:** This is the thinnest slice that proves the riskiest assumption. It exercises the *entire* vertical — manifest matching, declarative CSS injection, Garden selectors, header-text column resolution, value extraction, the attribute stamp, and the cascade — while deliberately excluding the observer, because the observer only makes sense once the one-shot pass works and debugging "nothing is tinted" is dramatically easier without a timer in the loop. It is honest about being incomplete: **sorting visibly breaks it, and that is fine.** That break is the demo that motivates Phase 2 and the fastest possible route to knowing whether the product is feasible at all.

**Delivers:** manifest + palette.css + table-locator + column-resolver (English) + priority-extractor (English) + stamper, run once at `document_idle`. Load a real view, rows are tinted.

**Decides, permanently — these are cheap now and expensive to retrofit:**
- **The permission set** (see Resolved Tension 1). Every later change taxes every future release with extended review.
- **The styling seam** — attribute + declarative CSS, unlayered, translucent gradient, one "apply treatment to row" chokepoint so a v2 stripe or pill is a contained change.
- **The palette hues** — alphas not hexes, lightness monotonic with priority (see Resolved Tensions 2 and 3).
- **The single-write boundary** — exactly one file calls a DOM-mutating method.

**Avoids:** Pitfalls 4 (fragile selectors), 5 (permission drift), 7 (CSS collision), and pre-empts 3 (dark mode) by construction.

### Phase 2: The tint survives everything an agent does

**Rationale:** Without this the product is visibly broken within seconds, and this is the highest-effort table stake. It is also where the two performance-shaped pitfalls live.

**Delivers:** the debounced `MutationObserver` on `document.body` with `attributes: false`, the `WeakMap` column memo keyed on the `<table>` element, group-row exclusion, two-header-table handling, the top-frame guard, try/catch fail-quiet, and a measured performance budget. Demonstrable by: sort, scroll, refresh, switch view, switch tab, return to a backgrounded tab — the tint persists through all of them.

**Explicitly does not build:** route detection. A route change *is* a DOM mutation; adding `webNavigation` or a Navigation API path would cost a permission (or a second lifecycle) for a capability already free, and gives you a second code path that can disagree with the first.

**Acceptance is a gate, not a target:** <2 ms typical pass, <16 ms worst case, **zero** forced layouts in the hot path, and no detached-node growth across 30 view switches verified by heap snapshot. Plus the interaction-state checklist — hover, hover-while-tinted, select one, select all, unread/bold, keyboard focus, drag — **in both themes, on all four tints.** "The colours look right" will pass while hover is silently dead.

### Phase 3: It works in every language, and it is honest when it doesn't work

**Rationale:** This is where the two silent-failure pitfalls are closed, and they belong together because they are the same problem seen from two sides: the extension must know *which* way it failed before it can say anything, and saying the wrong thing is worse than saying nothing. Ship before this and a large fraction of the global install base gets an extension that does nothing and says nothing.

**Delivers:**
- `locales.js` as data, locale detection, normalised matching, and the value-set fingerprint used strictly as a hint suppressor
- The **three-way failure taxonomy**, distinguishable in the UI and not merely in code: *no ticket table found* (silent) / *table found, locale known, no Priority column* (the hint) / *table and column found, values unreadable or locale unknown* (a different message, with the report affordance and detected locale pre-filled)
- The `action` badge + static popup that carries the hint, the icon status channel, the report-a-bug button (`chrome.tabs.create()` to a pre-filled issue URL — the *user* navigates, the extension sends nothing), and the on/off toggle
- One structured `console.info` per pass: version, locale, strategy tier that matched, rows seen, rows tinted. **Never ticket content.**

**Avoids:** Pitfall 1 (undetected breakage) and Pitfall 2 (locale failure) — the #1 and #2 ranked risks in the entire research corpus.

### Phase 4: Published

**Rationale:** Store submission has its own latency (days to weeks; new developer and new extension are both explicitly listed slow-review triggers), and the incumbent died here rather than in code. Budget one rejection-and-resubmit cycle. Do not couple a launch announcement to a date; use deferred publishing if you need to line one up.

**Delivers:** icons, real 1280x800 before/after screenshots of a genuine tinted view, the 440x280 promo tile, listing copy under version control, a live privacy policy on GitHub Pages, a fully completed Privacy practices tab (single purpose, per-permission justification, remote-code declaration, data-usage matrix, Limited Use certification — all consistent with each other *and* with actual behaviour, since inconsistency is itself a violation), a public source repo linked from the listing, and a short **"for IT"** section stating the exact permission list, host pattern, zero network activity and what is read. Almost nobody writes that last one and it converts enterprise "no" into "yes."

**Specifically defends against Yellow Potassium:** the listing must make the value legible to a reviewer who has never used Zendesk and whose trial view may have no Priority column.

### Phase Ordering Rationale

- **Phase 0 gates everything** because three of the top four pitfalls are decided by its findings, and one possible finding (a closed Shadow DOM) is terminal. This is the one ordering constraint that admits no negotiation.
- **Tint-once before tint-forever** because debugging a missing tint with an observer and a timer in the loop is dramatically harder than without, and because the one-shot pass is what proves the Garden selectors are real.
- **Survival before localisation** because the observer is the highest-effort table stake and everything downstream runs on top of it; and because locale work is bounded, tedious and data-shaped once the extraction seam exists.
- **Honesty before publication** because the failure taxonomy and the icon status channel are what convert a delisting-shaped ending into a bug report, and because the reviewer will very likely encounter one of those failure states.
- **The permission set is fixed in Phase 1, not Phase 4.** Packaging merely documents it. A permission change triggers extended review on every subsequent update forever, so it must never ride along with an urgent hotfix.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 0** — by definition. It *is* research, but empirical rather than desk-based; no further desk research will retire the gap, so do not plan a research pass here, plan a spike.
- **Phase 3 (localisation)** — the exact localised strings for the Priority header and the four values are **not publicly published** by Zendesk. They must be harvested from a sandbox by switching agent language, or from a Zendesk locale export. Budget real time for acquisition, and re-scope this phase once Phase 0 reports whether a locale-independent signal exists — that single finding is the difference between a one-line fix and a ~176-string table.
- **Phase 4 (store submission)** — Chrome Web Store policy pages change; re-verify violation codes, the Privacy practices field list and review timelines immediately before submitting rather than trusting this document.

Phases with standard patterns (skip research-phase):
- **Phase 1** — the manifest, declarative injection and cascade behaviour are all verified against first-party Chrome docs. Nothing here is novel; the only unknowns are the Zendesk-side ones Phase 0 closes.
- **Phase 2** — `MutationObserver` hazards and their mitigations are well-established and fully enumerated in PITFALLS.md. Implement against that list; do not re-research it.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Manifest and store mechanics verified against developer.chrome.com; all package versions queried against the npm registry on 2026-09-02. The shipped artifact has zero dependencies, so there is no dependency graph to break. |
| Features | **HIGH / MEDIUM** | HIGH on the competitive and Zendesk-native landscape (read directly from live Chrome Web Store listing HTML including embedded manifests, and from official Zendesk documentation); MEDIUM on community sentiment and review-driven complaints (small sample sizes, third-party analytics). |
| Architecture | **HIGH / MIXED** | HIGH on the recommended pattern — the Garden `data-garden-id` contract was verified by extracting and reading the published npm tarball, which is primary-source evidence. MIXED on Zendesk-specific DOM facts: ten explicitly enumerated assumptions remain unvalidated, each a few minutes in DevTools. |
| Pitfalls | **MEDIUM** | Store policy claims verified against developer.chrome.com with several cross-checked; Zendesk dark-mode and localisation claims from two official Zendesk articles each; prior-art install counts and the delisting date from third-party store analytics (strong signal, not first-party). |

**Overall confidence:** **MEDIUM-HIGH** on how to build it; **LOW** on the one thing that determines whether it can be built at all.

### Gaps to Address

- **The Zendesk agent-view DOM is entirely unverified — and there is no supported way to do what this project does.** Zendesk publishes no DOM contract for the ticket table; its sanctioned extensibility path is the iframed ZAF SDK, which structurally cannot tint a row. Handle via Phase 0 recon, before any implementation planning. Capture fixtures the day tinting first works; a stale fixture is worse than none.
- **Closed Shadow DOM would be terminal.** Content-script CSS does not cross a shadow boundary and `querySelectorAll` does not descend into one. Probe in Phase 0 and re-probe on every maintenance sweep, so it is a known risk rather than a surprise.
- **Exact localised priority strings are not publicly available.** Harvest from a sandbox; treat `locales.js` as a growable data file, and gate the hint on locale coverage so unshipped locales fail silent rather than falsely.
- **Whether the translucent gradient actually preserves hover and selected states in practice.** The CSS behaviour is certain; whether Zendesk's markup makes it *effective* depends on which element paints. Phase 0 magenta probe; Phase 2 interaction-state checklist.
- **Vanity/custom agent domains.** If real deployments serve the agent console off a non-`zendesk.com` domain, "works on any Zendesk" is overclaimed in the listing. Confirm in Phase 0 before writing store copy.
- **SPA entry vs. the `/agent/*` match pattern.** Chrome evaluates `matches` at navigation time only. One-minute live check; the fallback (widen to `/*` and early-return on pathname) costs a slightly broader install warning and should **not** be applied preemptively.
- **Detection latency is unbounded by design.** No telemetry means the only proactive signal is a human logging into a sandbox on a cadence. Budget it as a standing maintenance cost, and decide now, in writing, what happens when the maintainer stops wanting to do this. The predecessor's answer was to leave it installed and broken for 87 people for seven years.

## Sources

### Primary (HIGH confidence)
- `developer.chrome.com` — manifest reference, content-scripts semantics, icons, webstore publish/images/review-process, MV3 requirements, Privacy practices tab, permissions, developer registration
- Chrome Enterprise policy docs — `ExtensionSettings` (`blocked_permissions`, `runtime_blocked_hosts`, `installation_mode`), install allow/blocklists
- `@zendeskgarden/react-tables@9.15.8` — published npm tarball, `dist/esm/styled/*.js` read directly (the `data-garden-id` contract)
- `support.zendesk.com` — dark mode (announcement, usage, account activation), language support by product, locale configuration, views, SLA targets, sorting and filtering
- `developer.zendesk.com` — Apps Framework (ZAF iframe sandboxing, no host DOM access)
- Chrome Web Store listing HTML incl. embedded manifests — Zest, Zendesk Utils, Zendesk Enhancer, Zendesk Priority Highlights
- npm registry API — all package versions and publish dates, queried 2026-09-02
- MDN — `@layer` precedence, CSS specificity, `MutationObserver` (+ `takeRecords`, `disconnect`), Navigation API, data attributes
- `playwright.dev/docs/chrome-extensions` — `launchPersistentContext`, headless extension channel

### Secondary (MEDIUM confidence)
- `holatuwol/liferay-zendesk-userscript` — maintained production prior art; corroborates Garden selectors, the two-table header layout, route shapes, sortable-header text extraction
- `pioug` gist — simpler prior art; resorts to `tr.textContent` regex, which corroborates the absence of a priority marker on rows
- extpose.com store analytics — install counts, ratings, the 2026-08-27 delisting and its stated reason, review quotes
- Zendesk community threads with on-record staff/PM responses (2019, 2024, active to Jul 2026) — no native row tinting, logged for "future consideration"
- WXT framework comparison and 2026 roundups — Plasmo maintenance status (corroborated by its npm publish date, which is primary)
- crxjs issues #811, #1119 — content-script HMR vs. `MutationObserver` friction

### Tertiary (LOW confidence — needs validation)
- Every warning item in ARCHITECTURE.md's Verification Ledger and every open question in PITFALLS.md's Confidence & Gaps — Zendesk DOM structure, painting element, Shadow DOM usage, attribute stripping on re-render, agent-UI locale marker, exact localised strings, vanity domains
- Whether the Chrome Web Store offers a reviewer-notes field (the permission-justification free text is the closest equivalent)

---
*Research completed: 2026-09-02*
*Ready for roadmap: yes*
