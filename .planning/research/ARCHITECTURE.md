# Architecture Research

**Domain:** Chrome MV3 content-script extension that observes and restyles a third-party React SPA (Zendesk agent views)
**Researched:** 2026-09-02
**Confidence:** HIGH on the recommended architecture; MIXED on specific Zendesk DOM facts (see [Verification Ledger](#verification-ledger))

---

## Executive answer

Build **"Stamp and Style"**: a debounced `MutationObserver` on a stable ancestor whose *only* DOM write is a single `data-zhroma-priority` attribute on each ticket `<tr>`. All colour comes from a declaratively injected stylesheet that matches on that attribute. Route changes are not detected at all — they are just a large DOM mutation, and the same observer already handles them.

This is not a compromise between the options in the brief. It is strictly better than each of them:

- It **cannot** infinite-loop, because the observer never watches attributes and the write is idempotent.
- It needs **zero permissions** beyond `*://*.zendesk.com/*` host access — no `webNavigation`, no `scripting`, no `storage`, no `MAIN`-world injection.
- It puts the paint in the CSS engine, so scroll and hover repaints cost nothing and Zendesk's own re-render cannot strip the colour before our next pass.
- It degrades to "page untouched" on every failure path, which is the PROJECT constraint.

The CSS-only-with-no-JS option is **dead**: CSS has no text-content selector, and Zendesk emits no priority class or attribute on rows (verified — see below). Polling is **dead**: it is what the existing prior art does and it is why the existing prior art is rated 3.71/5 with reviews saying "It no longer works."

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  DECLARATIVE LAYER  (manifest.json — no JS, runs before DOM exists)   │
│  ┌────────────────────────┐   ┌─────────────────────────────────┐    │
│  │ content_scripts.matches│   │ content_scripts.css → palette.css│   │
│  │  *://*.zendesk.com/*   │   │  tr[data-zhroma-priority="..."] │    │
│  └────────────────────────┘   └─────────────────────────────────┘    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ (browser injects both)
┌───────────────────────────────▼──────────────────────────────────────┐
│  ISOLATED WORLD  (content script, run_at: document_idle)             │
│                                                                       │
│  ┌─────────────┐                                                     │
│  │ 1 Bootstrap │  entry, top-frame guard, one-shot init              │
│  └──────┬──────┘                                                     │
│         │ starts                                                     │
│  ┌──────▼──────────────────────────────────────────────────────┐     │
│  │ 2 Observer Controller   ◄─── the ONLY stateful component    │     │
│  │   MutationObserver(childList, subtree) + debounce + reentry │     │
│  └──────┬──────────────────────────────────────────────────────┘     │
│         │ schedules pass()                                           │
│         ▼                                                            │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐      │
│  │ 3 Table     │──►│ 4 Column     │──►│ 5 Priority Extractor │      │
│  │   Locator   │   │   Resolver   │   │   (i18n lives here)  │      │
│  │  (pure)     │   │  (pure+cache)│   │       (pure)         │      │
│  └─────────────┘   └──────────────┘   └──────────┬───────────┘      │
│         │                   │                     │ token            │
│         │ tables[]          │ columnIndex | NONE  ▼                  │
│         │                   │          ┌────────────────────┐        │
│         │                   │          │ 6 Stamper          │        │
│         │                   │          │  ★ ONLY DOM WRITE ★│        │
│         │                   │          └────────┬───────────┘        │
│         │                   │                   │ setAttribute       │
│         │                   ▼                   │                    │
│         │            ┌──────────────┐           │                    │
│         └───────────►│ 7 Hint       │           │                    │
│                      │   Presenter  │           │                    │
│                      └──────┬───────┘           │                    │
└─────────────────────────────┼───────────────────┼────────────────────┘
                              │ runtime.sendMessage│
┌─────────────────────────────▼────────────┐      │
│  SERVICE WORKER (≈20 lines, no perms)    │      │
│  chrome.action.setBadgeText({tabId})     │      │
│  + default_popup: hint.html (static)     │      │
└──────────────────────────────────────────┘      │
                                                   ▼
                              ┌────────────────────────────────────┐
                              │  PAGE DOM (shared, light DOM)      │
                              │  <tr data-garden-id="tables.row"   │
                              │      data-zhroma-priority="urgent">│
                              └────────────────────────────────────┘
                                       ▲
                                       │ CSS engine paints from
                                       │ the declarative stylesheet
                                       └── no JS involved in painting
```

### Component Responsibilities

| # | Component | Owns | Never does | Purity |
|---|-----------|------|------------|--------|
| 0 | **Palette (CSS)** | The mapping token → colour. All visual treatment. Specificity battles with Garden. | Know anything about tables, headers, or locales. | Declarative |
| 1 | **Bootstrap** | Entry point. Top-frame guard. Constructing and wiring 2–7 once. | Touch the DOM. Contain any Zendesk knowledge. | Impure (wiring) |
| 2 | **Observer Controller** | The `MutationObserver`, the debounce timer, the "pass in flight" flag, `disconnect()` on teardown. Calling `pass()`. | Know what a ticket row is. Know what priority is. Write to the DOM. | Stateful |
| 3 | **Table Locator** | "Which `<table>` elements on this page are ticket views?" Returns an array, possibly empty. | Read cells. Write anything. Cache across passes. | Pure read |
| 4 | **Column Resolver** | Given one table, "which column index holds priority, or NONE?" Owns the header→index mapping and its per-table memo. | Read row values for tinting. Write anything. | Pure read + memo |
| 5 | **Priority Extractor** | Given a cell, "which canonical token (`urgent`/`high`/`normal`/`low`/`none`)?" **Owns all localisation.** | Know about tables or indices. Write anything. | Pure |
| 6 | **Stamper** | The *only* `setAttribute` / `removeAttribute` call site in the codebase. Idempotence guard. | Compute anything. Decide anything. | Impure (writes) |
| 7 | **Hint Presenter** | "This view has no priority column" signal. Debounces its own state so it does not flap. | Inject anything into the page. Persist anything. | Impure (messages) |

### The one boundary that matters

> **Rule: exactly one file in this codebase calls a DOM-mutating method, and that file is `stamper.js`.**

Everything else is a pure function from DOM to data. This is not stylistic tidiness — it is the mechanism that makes the infinite-loop hazard *auditable*. When someone asks "can this extension retrigger its own observer?", the answer is a code review of one ~20-line file, not of the whole extension. If a future contributor adds `row.style.background = ...` in the extractor, the review catches it because that file is supposed to have zero writes.

The second-order benefit: components 3, 4 and 5 are unit-testable against static HTML fixtures with no browser, no extension host, and no Zendesk account. That matters enormously for a project whose main risk is "Zendesk changed the DOM" — a captured fixture from a real instance becomes a regression test.

---

## Recommended Project Structure

Ship **no build step** for v1. MV3 concatenates the `js` array into a single isolated-world scope in array order, so multiple files work without a bundler and without ES module syntax (classic content scripts are not modules). What is shipped to the Chrome Web Store is then byte-identical to what is in the repo, which is the easiest possible story at review — and this extension was already told, by the PROJECT constraints, that "no remote code" and reviewability are load-bearing.

```
zhroma/
├── manifest.json              # matches, content_scripts.js[], content_scripts.css[], action
├── src/
│   ├── constants.js           # attribute names, garden ids, token enum. No logic.
│   ├── locales.js             # DATA: locale → {header, urgent, high, normal, low}
│   ├── table-locator.js       # (3) document → HTMLTableElement[]
│   ├── column-resolver.js     # (4) table → {index, locale} | NONE
│   ├── priority-extractor.js  # (5) (cellText, locale) → token
│   ├── stamper.js             # (6) ★ the only writes ★
│   ├── hint.js                # (7)
│   ├── observer.js            # (2) debounce + lifecycle
│   └── main.js                # (1) bootstrap — LAST in the js[] array
├── css/
│   └── palette.css            # (0) declarative, injected by manifest
├── sw.js                      # badge only
├── popup/
│   ├── hint.html
│   └── hint.css               # static; no JS needed
├── test/
│   └── fixtures/              # captured real Zendesk view HTML, one per scenario
└── icons/
```

### Structure Rationale

- **`js[]` ordering is the dependency graph.** `constants` → `locales` → pure components → `stamper` → `observer` → `main`. If a file needs something declared later, that is a real cycle and the load order forces you to see it. Cheap discipline, zero tooling.
- **`locales.js` is data, not code.** Adding Japanese is a JSON edit, not a logic change. This is the seam that makes the i18n problem tractable incrementally (see build order — v1 ships English + a handful, and growth is a data PR).
- **`css/palette.css` is separate from `src/`** because it is injected by a completely different mechanism (the browser, declaratively, before DOM construction) and has a different failure mode. Co-locating it with JS invites someone to start writing styles from JS.
- **`test/fixtures/` exists from day one.** The standing risk on this project is Zendesk changing its DOM. A fixture captured the day you first get tinting working is the artefact that tells you *what* changed when it breaks in eight months.
- **No `options/`, no `storage`.** v1 is zero-config by decision. Not creating the folder is how that decision stays made.

---

## The re-render problem: strategy comparison and recommendation

Zendesk agent views are React. Rows are replaced — not mutated — on sort, refresh, filter, pagination and view switch. Any tint written into a node is gone the moment React swaps that node. Four candidate strategies:

| Strategy | Survives re-render? | Infinite-loop risk | Permissions | Verdict |
|----------|--------------------|--------------------|-------------|---------|
| **A. Pure CSS, no JS** (Zendesk emits a priority class) | Perfectly | None | Host only | **Impossible.** See below. |
| **B. Polling `setInterval`** | Yes, after up to N ms | None | Host only | **Rejected.** See below. |
| **C. MutationObserver → inline styles** | Yes | **High** | Host only | **Rejected.** See below. |
| **D. MutationObserver → `data-*` stamp + declarative CSS** | Yes | **Structurally zero** | Host only | ★ **Recommended** |

### A. Pure CSS-only — investigated and ruled out

This would collapse the architecture to a stylesheet, so it was worth checking properly. It fails on two independent grounds:

1. **Zendesk emits no priority marker on rows.** Across the Zendesk-specific attributes actually observed in agent views (`generic-table-row`, `generic-table-cells-id`, `ticket-table-cells-subject`, `table_main`, `table_header`, `table_container`, `status-badge-state`) and across all Garden `data-garden-id` values, there is nothing priority-bearing on a `<tr>`. Corroborating: the most substantial maintained Zendesk userscript (`holatuwol/liferay-zendesk-userscript`) does not read priority from the list DOM at all — it fetches it from the Zendesk REST API — and the simpler `pioug` gist resorts to regexing `tr.textContent`. Neither would do that if a class existed. *(Confidence: MEDIUM-HIGH. Marked as an assumption to disprove in five minutes on a live instance — if it turns out a `data-priority` exists, throw away components 4, 5 and 6 and ship a stylesheet. Check this first.)*
2. **Even if the value is present as text, CSS cannot select on text content.** There is no text-content selector and there is no realistic prospect of one; the documented workaround is precisely "have JS mirror the text into an attribute, then select on the attribute" — which is exactly strategy D.

There is a tempting near-miss worth explicitly dismissing: `tr:has(td:nth-child(7))` can select *structurally* but still cannot read the word "Urgent". Column position is user-configurable, so even structural targeting has nothing stable to hang on.

### B. Polling — the case against

Polling with `setInterval` is what the incumbent prior art does (`liferay-zendesk-userscript` literally comments *"Since there's an SPA framework in place that I don't fully understand, attempt to apply updates once per second"*). Reject it because:

- **It fails the core value proposition.** The product promise is "know within one second." A 1000 ms poll means an agent who sorts a view watches uncoloured rows, then a flash of colour. That flash *is* the bug report. Tightening to 100 ms to hide it means 10 full table scans per second, forever, on a tab an agent leaves open all day.
- **It burns CPU on the 99.9% of ticks where nothing changed.** On a background tab Chrome throttles the timer, which means the tint is stale exactly when the agent tab-switches back — one of the four survival scenarios in the requirements.
- **It has no natural teardown.** An interval outlives the thing it was watching.
- It offers **no upside** over an observer here. Observers are strictly better-informed about the same events.

Polling is only defensible when the mutation is invisible to `MutationObserver` (canvas repaints, shadow-DOM-closed widgets, cross-origin frames). None applies.

### C. MutationObserver + inline styles — the trap

This is the obvious implementation and it is where the infinite loop lives. The failure:

```js
// ✗ DO NOT
const obs = new MutationObserver(() => {
  for (const row of rows()) row.style.backgroundColor = colourFor(row);
});
obs.observe(table, { childList: true, subtree: true, attributes: true });
```

`element.style.x = y` writes the `style` **attribute**. With `attributes: true` the observer fires on its own write, which writes again, which fires again — a tight loop that pegs a core and freezes the tab. It also loses a specificity fight it did not need to have: Garden paints backgrounds on `<td>`, and a `<td>` background paints over a `<tr>` background, so the naive inline style on the row is often invisible anyway.

**The standard mitigations, and why each is insufficient on its own:**

| Mitigation | What it does | Why not enough alone |
|-----------|--------------|----------------------|
| Drop `attributes: true` | Observer never sees attribute writes | Doesn't help if you ever need attribute observation; and `childList` writes (inserting a badge element) still self-trigger |
| `attributeFilter: [...]` excluding your own | Narrows what is reported | Only helps if you enumerate every attribute you *do* want; brittle |
| `disconnect()` → write → `observe()` | Observer is deaf during the write | **Loses genuine page mutations** that land in the gap. React can re-render mid-write. Silent, intermittent, unreproducible bugs |
| `takeRecords()` before reconnect | Drains and *discards* queued records | Same flaw, more explicitly: you are throwing away Zendesk's real mutations along with your own |
| Idempotence guard (`if (el.getAttribute(A) === v) return;`) | Self-triggered pass becomes a no-op | Loop terminates after exactly one extra cycle. **Strong**, but on its own still costs a wasted pass per write |
| Debounce | Coalesces React's render batches into one pass | Doesn't prevent the loop, just slows it down |
| A "pass in flight" reentrancy flag | Stops nested passes | Doesn't stop *sequential* self-retriggering |

**The `disconnect`/`takeRecords` dance is the mitigation people reach for, and it is the worst one.** It trades a loud, obvious bug (frozen tab) for a quiet, intermittent one (occasional untinted rows nobody can reproduce). Avoid it.

### D. ★ Recommended: stamp a `data-*` attribute, style declaratively

```js
// observer.js — the only place a timer or observer exists
let timer = null;
let inPass = false;

const observer = new MutationObserver(() => {
  if (inPass) return;                      // guard 3: reentrancy
  clearTimeout(timer);
  timer = setTimeout(runPass, 50);          // guard 2: debounce React batches
});

observer.observe(root, {
  childList: true,
  subtree: true,
  attributes: false,                        // guard 1: THE structural fix
  characterData: false
});

function runPass() {
  inPass = true;
  try { pass(); } catch (e) { /* fail quiet: page untouched */ }
  finally { inPass = false; }
}
```

```js
// stamper.js — the ONLY DOM write in the extension
function stamp(row, token) {
  if (row.getAttribute(ATTR) === token) return;   // guard 4: idempotence
  if (token === 'none') row.removeAttribute(ATTR);
  else row.setAttribute(ATTR, token);
}
```

```css
/* css/palette.css — injected declaratively by the manifest */
/* Paint the CELLS, not the row: Garden sets td backgrounds, which
   would otherwise paint over any tr background. */
tr[data-zhroma-priority] > td { background-color: transparent; }
tr[data-zhroma-priority="urgent"] > td { background-color: var(--zhroma-urgent); }
tr[data-zhroma-priority="high"]   > td { background-color: var(--zhroma-high);   }
tr[data-zhroma-priority="normal"] > td { background-color: var(--zhroma-normal); }
tr[data-zhroma-priority="low"]    > td { background-color: var(--zhroma-low);    }
```

**Why the loop is structurally impossible, not merely mitigated:**

The stamp writes an **attribute**. The observer watches **`childList` only**. There is no path from the write back to the callback. The idempotence guard (guard 4) is defence-in-depth — even if a future maintainer flips `attributes: true`, the loop terminates after one extra cycle instead of hanging the tab. Four independent guards, of which any one would suffice, and none of which discards a real page mutation.

**Additional wins that fall out of this choice:**

- **Scroll costs nothing.** Colour lives in the cascade, so scroll and hover repaints are handled by the compositor. No JS runs on scroll at all. (Requirement: "tinting survives scrolling" — satisfied by doing nothing.)
- **Stale stamps are self-healing.** If React reuses a `<tr>` node with different ticket data, the next pass overwrites the attribute. If it discards the node, the attribute goes with it.
- **Uninstall is instant and total.** Remove the extension, the stylesheet unloads, colour vanishes. No orphaned inline styles baked into the page.
- **DevTools stays readable.** An agent (or a Zendesk engineer debugging a support case) sees one extra attribute, not a wall of inline styles.
- **`!important` is usually avoidable.** `tr[attr] > td` is `(0,2,1)` specificity, which beats a Garden styled-components single class `(0,1,1)` on `td`. Reach for `!important` only if a real conflict is observed on a live instance — do not pre-emptively splatter it.

### Observer scope: what to observe

Observe the **narrowest stable ancestor you can find, falling back to `document.body`**:

```js
function findRoot() {
  return document.querySelector('#views_views-ticket-table')   // narrow, if present
      ?? document.querySelector('[data-test-id="table_container"]')
      ?? document.body;                                         // always works
}
```

Do **not** hold a reference to the narrow root forever — on a view switch React may replace it, at which point your observer is watching a detached node and everything silently stops. The safe pattern:

- Observe `document.body` with `childList: true, subtree: true` **always**. It never gets replaced, so the observer never goes deaf.
- Use the narrow selectors inside `pass()` to bound the *work*, not the *watching*.

This is the "observe a stable ancestor container" strategy from the brief, and it is the correct one — but the stable ancestor is `body`, and the narrowing belongs in the pass, not the observe call. Observing `body` sounds expensive; it is not, because the callback does nothing except reset a 50 ms timer. The cost is one function call per mutation batch.

**Debounce interval: 50 ms.** Rationale: below human perception of "instant" (~100 ms), comfortably longer than a React commit batch, and short enough that sorting a view feels like the colours were always there. Do not use `requestAnimationFrame` — a background tab does not tick rAF, which breaks the tab-switch requirement. Do not use a microtask — it fires mid-React-batch and you will scan a half-rendered table.

---

## SPA route changes: don't detect them

The brief asks how a content script detects navigation inside the agent workspace. **Recommendation: it doesn't, and shouldn't.** Here is the reasoning, including why each of the obvious mechanisms is a worse deal.

The Zendesk agent workspace routes are `/agent/filters/<view_id>` (agent views), `/agent/tickets/<id>`, `/agent/dashboard`, `/agent/admin/…`. Moving between them changes the URL with no page load. Options:

| Mechanism | Works from a content script? | Cost | Verdict |
|-----------|------------------------------|------|---------|
| **`popstate`** | Yes | Free | **Insufficient.** Does not fire for `pushState`/`replaceState`, which is how a React router navigates. Only fires on back/forward. Misses the majority of navigations. |
| **Patch `history.pushState`** | **No** | — | **Broken by design.** Content scripts run in an isolated world; `history.pushState` there is a *different function object* than the page's. Patching it has no effect on Zendesk's router. Requires `world: "MAIN"` injection plus a `CustomEvent` bridge back to the isolated world — a second script, a second execution context, and a script the store reviewer has to reason about. |
| **Navigation API (`navigation.addEventListener('navigate')`)** | Yes (Chromium; Baseline newly-available Jan 2026) | Free | **Viable but unnecessary.** Chrome-only is fine here. But it introduces a *second* lifecycle path alongside the observer, doubling the states you have to reason about, and it does not fire on initial load, so you need the observer path anyway. Also `pushState`/`replaceState` semantics differ between `navigate` and `currententrychange`, which is a footgun. |
| **`chrome.webNavigation.onHistoryStateUpdated`** | Via service worker + messaging | **A permission** | **Rejected.** Costs the `webNavigation` permission, which is broad, needs justifying at store review, and directly contradicts the PROJECT constraint "as narrow as possible." Note that the incumbent competitor was delisted in Aug 2026 for policy violations. Do not add reviewable surface for a capability you can get for free. |
| **★ Nothing — the observer already covers it** | Yes | Free | **Recommended.** |

**The insight:** a route change in a React SPA *is* a DOM mutation — a very large one. The old view's table is unmounted and a new one is mounted. `MutationObserver` on `document.body` with `subtree: true` sees this unambiguously. Since the extension is **stateless across passes** (it recomputes the table list, the column index and every row value from scratch each pass), it does not need to know *why* the DOM changed. "The DOM changed, so re-derive everything" is both simpler and more robust than "the URL changed, so invalidate these three caches."

Route detection is therefore an *anti-requirement*: adding it would give you a second code path that can disagree with the first.

**One caveat this creates**, which must be handled anyway: the per-table column-index memo (component 4) must be keyed on something that dies with the table — use a `WeakMap` keyed by the `<table>` element, or stamp `data-zhroma-col` on the table itself. A module-level `let priorityIndex` survives the route change and will tint the wrong column on the next view. This is the single most likely bug in this architecture; call it out in the plan.

---

## Reading priority robustly

This is the second-hardest problem after re-render, and the one most likely to be under-scoped.

### Verified DOM foundation

Zendesk's agent UI is built on **Zendesk Garden**, whose `@zendeskgarden/react-tables` package emits `data-garden-id` attributes on every table element, unconditionally, in production builds. Verified by extracting the published npm tarball (v9.15.8) and reading `dist/esm/styled/*.js`:

| Selector | Element | Source |
|----------|---------|--------|
| `table[data-garden-id="tables.table"]` | `<table>` | `StyledTable = styled.table.attrs({'data-garden-id': 'tables.table'})` |
| `thead[data-garden-id="tables.head"]` | `<thead>` | `StyledHead = styled.thead.attrs(…)` |
| `tbody[data-garden-id="tables.body"]` | `<tbody>` | `StyledBody = styled.tbody.attrs(…)` |
| `tr[data-garden-id="tables.header_row"]` | `<tr>` in head | `StyledHeaderRow` |
| `th[data-garden-id="tables.header_cell"]` | `<th>` | `StyledHeaderCell = styled(StyledCell).attrs({as:'th', 'data-garden-id':'tables.header_cell'})` |
| `tr[data-garden-id="tables.row"]` | `<tr>` in body | `StyledRow` |
| `tr[data-garden-id="tables.group_row"]` | `<tr>` **group header** | `StyledGroupRow` |
| `td[data-garden-id="tables.cell"]` | `<td>` | `StyledCell = styled.td.attrs(…)` |
| `button[data-garden-id="tables.sortable"]` | sort `<button>` inside `<th>` | `StyledSortableButton = styled.button.attrs(…)` |

A `data-garden-version` attribute is emitted alongside. Corroborated independently: the `liferay-zendesk-userscript` selects the view ticket table with exactly `table[data-garden-id="tables.table"] tbody` and distinguishes group rows by `data-garden-id === 'tables.group_row'`.

**This is the stable selector surface. Use it, and nothing else, wherever possible.** The class names on the same elements are styled-components hashes (`sc-xxxxxx`) that change on any Garden release — targeting them is the classic way these extensions rot.

Zendesk *also* stamps its own `data-test-id` attributes (`generic-table`, `generic-table-row`, `generic-table-cells-id`, `ticket-table-cells-subject`, `table_main`, `table_header`, `table_container`, `views_views-ticket-table`). These are useful as **secondary** selectors but are less trustworthy than `data-garden-id`, because `data-test-id` values are an internal testing convention with no external contract, whereas `data-garden-id` is baked into a published, versioned, open-source package.

### The three real hazards

1. **Column order is user-configurable** (a view has up to 15 columns, drag-ordered). Never hard-code an index.
2. **There are two header tables.** Views render a sticky duplicate header (`table[data-test-id="table_header"]`) *alongside* the body table (`table[data-test-id="table_main"]`), inside a shared `div[data-test-id="table_container"]`. Naively `document.querySelector('th')`-ing across the page finds headers belonging to the wrong table. **Always resolve headers from within the same `<table>` element as the rows you are about to stamp.** *(Assumption to validate: the body table appears to carry its own `<thead>` as well as its `<tbody>` — userscript code reads `table.tHead.rows[0].cells` on it successfully. If a live instance shows the body table has no `<thead>`, the resolver must walk up to `[data-test-id="table_container"]` and read headers from the sibling header table by index.)*
3. **Group rows are `<tr>` too.** A view with "Group by" inserts `tr[data-garden-id="tables.group_row"]` elements. These must be excluded — tinting them looks like a rendering bug. Select `tr[data-garden-id="tables.row"]`, not `tbody tr`.

### Header text is localised — the layered resolver

The Zendesk agent UI ships in a large set of languages, and an agent picks their own UI language independently of the account default. **Both the "Priority" header and the four values are translated UI strings.** An extension that greps for the literal `"Urgent"` is an English-only extension, and the target is *any* `*.zendesk.com`.

Recommended resolver, tried in order, first hit wins:

**Tier 1 — Locale-keyed string table (the primary path).**
Read the UI locale from the document (`document.documentElement.lang`, falling back to `<html lang>`/`navigator.language`), look it up in `locales.js`, and match the header text against that locale's `header` string. The same entry supplies the four value strings for component 5.

```js
// locales.js — DATA, not logic
export const LOCALES = {
  en: { header: 'Priority', urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' },
  de: { header: 'Priorität', urgent: 'Dringend', high: 'Hoch', normal: 'Normal', low: 'Niedrig' },
  // …grown by data PR, not code change
};
```

Match rules: case-fold, trim, strip the sort-indicator `<button>` wrapper (header text lives inside `button[data-garden-id="tables.sortable"]` when the column is sortable, and as a bare text node when it is not — handle both), and compare with `localeCompare(…, {sensitivity:'base'})` so accents and case do not defeat you.

**Tier 2 — Value-set fingerprint (fallback for unknown locales).**
For each column, collect the distinct non-empty cell values across the visible rows. The priority column is the one whose distinct set has **cardinality ≤ 4**. This is language-independent, but it is **ambiguous** — Type (Question/Incident/Problem/Task) is also 4, and Status can be 4 in a filtered view. Therefore apply it **only** when exactly one column qualifies after excluding columns that can be positively identified as something else (the Status column is identifiable structurally by `div[data-cy-test-id="status-badge-state"]` inside its cells — verified in prior art). If two columns qualify, return `NONE` rather than guess. **A wrong tint is worse than no tint.**

**Tier 3 — `NONE`.** Do not tint. Notify the Hint Presenter.

**Ordering the values without knowing the language** is the subtle part: Tier 2 finds *a* four-valued column but cannot tell you which value is `urgent`. Two honest options: (a) don't tint on Tier 2 at all — use it only to suppress a false "no priority column" hint; (b) exploit ordering by clicking the sort header, which is far too invasive. **Recommend (a).** Tier 2 is a *hint suppressor*, not a tinting path. This keeps the promise "fail quietly" intact.

### Handling the column being absent

`NONE` must be distinguishable into two cases, because they need different behaviour:

| Case | Detection | Behaviour |
|------|-----------|-----------|
| **Not a ticket view at all** (dashboard, ticket page, admin) | No `table[data-garden-id="tables.table"]` matching the view-table shape | Silent. No hint. No badge. |
| **A ticket view, locale known, no Priority header** | Table found, locale in `LOCALES`, no header matched | **Show the hint.** This is the actionable case. |
| **A ticket view, locale unknown** | Table found, locale not in `LOCALES` | Silent. Showing "add a Priority column" to a Japanese agent who already has one is a false accusation and a 1-star review. |

That last row is why the hint must be gated on locale coverage. It also means the **locale table is not optional polish** — every locale you don't ship is a locale where the product silently does nothing. Budget for it.

---

## Virtualisation

**Finding: Zendesk agent views appear NOT to virtualise. Confidence: MEDIUM-HIGH. Marked as an assumption to validate.**

Evidence for:
- Views paginate at **30 tickets per page**, with explicit pagination controls in the DOM: `button[data-test-id="generic-table-pagination-first"]`, `…-next`, and a page counter `span[data-test-id="views_views-header-page-amount"]`. Thirty real `<tr>` elements is nothing; windowing 30 rows would be pointless engineering.
- Prior-art userscripts iterate `table.tBodies[0].rows` and `document.querySelectorAll('table[data-garden-id="tables.table"] tbody tr')` directly and work. A windowed list would give them only the visible slice, and their features (group-row counting across a whole page) would visibly under-count.
- Garden's Table docs *do* document a `react-window` virtual-scrolling recipe — but as an opt-in integration example, not default behaviour.

**What it would imply if wrong.** Reassuringly little, because of the recommended architecture:

| Concern | Under strategy D |
|---------|------------------|
| Rows enter the DOM on scroll | The observer fires on the `childList` mutation and stamps them. Already handled. |
| Rows leave the DOM | Nothing to clean up — the attribute leaves with the node. |
| Scroll fires the observer constantly | The 50 ms debounce coalesces it; each pass is ~30 rows. Acceptable. |
| Header lives outside the virtualised container | Already handled: the resolver reads headers from the table/container, not from the row's parent. |
| Rows are `<div role="row">` not `<tr>` | **This is the one that hurts.** `react-window` renders divs, so `tr[data-garden-id="tables.row"]` finds nothing and the CSS selectors miss. Mitigation: write the locator and the CSS against `[data-garden-id="tables.row"]` (attribute-only, no element qualifier) so it survives an element-type change. Cheap insurance — do it. |

So: assume no virtualisation, but **write element-agnostic selectors** so that being wrong costs an afternoon rather than a rewrite. Validate on a live instance with a view containing 30 rows by scrolling and counting `document.querySelectorAll('[data-garden-id="tables.row"]').length` at top and bottom of scroll.

---

## Where the "no Priority column" hint lives

| Option | Annoyance | Discoverability | Cost | Verdict |
|--------|-----------|-----------------|------|---------|
| **Injected in-page banner** | **High** | High | Medium | **Rejected** |
| **Toast / floating pill** | Medium | Medium | Medium | Rejected |
| **Action badge + popup** | **Minimal** | Medium | Low | ★ **Recommended** |
| **Popup only, no badge** | None | **Too low** | Lowest | Rejected |
| **`console.info`** | None | ~Zero | Trivial | Useful as a debug adjunct, not as the hint |

**Why not an injected banner**, despite it being the most discoverable:

1. It violates the project's own stated failure mode: *"the extension must fail quietly (page untouched) rather than loudly (page broken)."* A banner is the extension being loud precisely when it has failed to do its job.
2. It reflows Zendesk's layout. Agent views are dense and often on 13" laptops; stealing 40px of vertical space from the ticket list to say "this extension can't help you" is a net negative for the agent.
3. **It needs a dismiss button, and dismissal needs persistence — and v1 has explicitly decided on no storage.** A banner you cannot dismiss is intolerable on every view switch. A banner you can dismiss requires the `storage` permission and an options surface, both of which v1 ruled out. The banner is not just annoying; it is architecturally incompatible with the zero-config, zero-storage decision.
4. It is the highest-risk component for CSS conflicts with Zendesk, and the one most likely to look broken after a Garden update.

**Why badge + popup:**

- `chrome.action.setBadgeText({ text: '!', tabId })` **requires no permission at all** — the `action` key in the manifest is sufficient. Nothing to justify at store review, which matters given the incumbent was delisted on policy grounds.
- It is per-tab, so it accurately reflects the view the agent is currently looking at.
- It is *ignorable by construction*. An agent who doesn't care never has their workflow interrupted. An agent who wonders why nothing is coloured has a visible affordance in exactly the place they'd look.
- The popup is **static HTML** — no JS, no messaging, no permissions. It explains the situation and links to Zendesk's own "add a column to a view" documentation. One-click fix, self-service, exactly as the PROJECT decision intends.
- Zero page footprint. Uninstall leaves nothing.

**Cost:** it requires a service worker, because a content script cannot call `chrome.action`. This is ~20 lines:

```js
// sw.js
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== 'zhroma:hint' || !sender.tab) return;
  chrome.action.setBadgeText({ tabId: sender.tab.id, text: msg.show ? '!' : '' });
  chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#B0. …' });
});
```

The Hint Presenter must **debounce its own state transitions** and only message on *change*, not every pass. Otherwise a 50 ms observer cadence becomes 20 messages/second to the service worker, which will look like abuse and will keep the SW alive needlessly.

**MVP note:** the hint is cleanly severable. Ship v1's first slice with no hint at all; the badge is a self-contained later phase that touches only `sw.js`, `hint.js`, `popup/`, and one line of `manifest.json`.

---

## Data Flow

### Flow 1: Cold start (page load → tinted row)

```
Agent opens https://acme.zendesk.com/agent/filters/360012345
        │
        ▼
[Browser] matches content_scripts.matches  → injects css/palette.css
        │                                     (BEFORE DOM construction;
        │                                      rules are inert — nothing
        │                                      carries the attribute yet)
        ▼
[Browser] run_at: document_idle            → executes src/*.js in js[] order
        │
        ▼
(1) Bootstrap: window.top === window ? proceed : bail (skip iframes)
        │
        ▼
(2) Observer Controller: observer.observe(document.body, {childList, subtree})
    then immediately schedules a first pass (React may not have rendered yet)
        │
        ▼  pass()
(3) Table Locator: document.querySelectorAll('[data-garden-id="tables.table"]')
        │            filtered to those containing [data-garden-id="tables.row"]
        │  → HTMLTableElement[]           (empty on /agent/dashboard → stop, silent)
        ▼
(4) Column Resolver: for each table
        │   memo hit?  → WeakMap<table, {index, locale}>
        │   memo miss? → read th[data-garden-id="tables.header_cell"]
        │                extract text (unwrap button[data-garden-id="tables.sortable"])
        │                match vs LOCALES[lang].header
        │  → {index: 6, locale: 'en'}     or  NONE ──────┐
        ▼                                                 │
(5) Priority Extractor: for each tr[data-garden-id="tables.row"]   │
        │   cell = row.cells[6]                           │
        │   text = cell.textContent.trim()                │
        │   LOCALES['en'] reverse-map → token             │
        │  → 'urgent'                                     │
        ▼                                                 │
(6) Stamper:  if (row.getAttribute(ATTR) === 'urgent') return;   │
        │     row.setAttribute('data-zhroma-priority','urgent')  │
        ▼                                                 │
[Browser CSS engine] re-evaluates the cascade             │
        │  tr[data-zhroma-priority="urgent"] > td { background: … }
        ▼                                                 │
🎨 ROW IS TINTED                                          │
                                                          ▼
                                            (7) Hint Presenter
                                                locale known? → sendMessage
                                                → [SW] setBadgeText('!')
```

Note the write in step 6 produces an **attribute** mutation, which the observer (`attributes: false`) does not see. The cycle terminates.

### Flow 2: Re-render (agent clicks a column header to sort)

```
Agent clicks the "Requester" sort header
        │
        ▼
[Zendesk React] refetches, unmounts old <tr>s, mounts new <tr>s
        │        ⚠ our data-zhroma-priority is GONE — those nodes no longer exist
        ▼
[Browser] fires MutationObserver: many childList records on document.body
        │
        ▼
(2) Observer Controller callback:
        │   inPass? no.
        │   clearTimeout(timer); timer = setTimeout(runPass, 50)
        │   ← fires ~30 more times as React commits; each just resets the timer
        ▼  (50 ms of quiet)
     runPass():  inPass = true
        │
        ▼
(3) Table Locator re-queries from scratch  ← no stale node references held
        ▼
(4) Column Resolver:  WeakMap.get(table)
        │   Same <table> node reused by React?  → memo HIT, index reused (fast)
        │   New <table> node?                   → memo MISS, re-derive (correct)
        │   ⚠ THIS is why the memo must be a WeakMap keyed on the element
        ▼
(5)+(6) extract + stamp all ~30 rows.  Rows whose token is unchanged
        │       hit the idempotence guard and cost one string compare.
        ▼
[CSS engine] repaints
        ▼
🎨 ROWS RE-TINTED  (total elapsed ≈ 50–60 ms — below the perception threshold)
        │
        ▼
     inPass = false
```

The identical flow handles: refresh, filter, pagination, **view switch** (route change), and tab switch (which fires mutations on refocus). One path, five requirements.

### Key Data Flows

1. **DOM → token → attribute → colour.** Strictly one-directional. Nothing reads the attribute back except the idempotence guard and the CSS engine.
2. **Column index memo.** `WeakMap<HTMLTableElement, {index, locale}>`. The only cache in the system. Keyed on the element so it dies with the table.
3. **Hint state.** `boolean` in the content script → `runtime.sendMessage` on transition only → `chrome.action.setBadgeText`. Fire-and-forget; no reply, no round-trip.
4. **No flow exists** for: network, storage, cross-tab, page↔isolated-world. Their absence is the privacy and store-review story.

---

## Build Order

Dependencies are strict; each stage is independently demonstrable.

| Stage | Ships | Depends on | Demonstrable by |
|-------|-------|-----------|-----------------|
| **0. Recon spike** (½ day, do this first) | Nothing — a captured HTML fixture + a validation note | A live Zendesk instance | Confirming/refuting every ⚠ assumption below |
| **1. ★ Thinnest slice** | manifest + palette.css + locator + resolver(en) + extractor(en) + stamper, run **once** at `document_idle` | 0 | Load a view, one row is tinted. Sort it — tint disappears. **That's fine.** |
| **2. Observer** | observer.js | 1 | Sort, scroll, refresh, switch view, switch tab — tint persists through all five |
| **3. Robustness** | group-row exclusion, two-header-table handling, WeakMap memo, try/catch fail-quiet, top-frame guard | 2 | Grouped view, wide view, dashboard, ticket page — no crashes, no wrong tints |
| **4. i18n** | locales.js populated; locale detection; Tier-2 fingerprint as hint suppressor | 3 | Switch agent UI language to German — still tints |
| **5. Hint** | sw.js + hint.js + popup/ + action key | 3 (not 4 — but gate on 4's locale table) | Open a view without a Priority column — badge appears; with one — badge clears |
| **6. Store readiness** | icons, screenshots, privacy policy, permission justification | 5 | Submitted |

### The thinnest end-to-end vertical slice

**"On a real Zendesk view in English, at least one row is tinted on first load."**

Concretely, the whole of stage 1 is roughly:

```json
// manifest.json
{
  "manifest_version": 3,
  "name": "Zhroma",
  "version": "0.0.1",
  "content_scripts": [{
    "matches": ["*://*.zendesk.com/agent/*"],
    "js": ["src/constants.js","src/locales.js","src/table-locator.js",
           "src/column-resolver.js","src/priority-extractor.js",
           "src/stamper.js","src/main.js"],
    "css": ["css/palette.css"],
    "run_at": "document_idle"
  }]
}
```

```js
// src/main.js — stage 1 only; no observer yet
for (const table of locateTables(document)) {
  const col = resolveColumn(table);
  if (col === NONE) continue;
  for (const row of table.querySelectorAll('[data-garden-id="tables.row"]')) {
    stamp(row, extractPriority(row.cells[col.index], col.locale));
  }
}
```

**Why this is the right slice:** it exercises the *entire* vertical — manifest matching, declarative CSS injection, Garden selectors, header-text column resolution, value extraction, the attribute stamp, and the cascade — and it proves the single riskiest assumption in the project (that the Garden `data-garden-id` selectors are actually present in a real agent view) in the cheapest possible way. It deliberately excludes the observer, because the observer only makes sense once you know the one-shot pass works. Debugging "nothing is tinted" is dramatically easier without a timer and an observer in the loop.

It is also honest about being incomplete: sorting visibly breaks it. That is the demo that motivates stage 2, and it is the fastest possible route to a real answer about whether this product is feasible at all.

**Ordering constraint worth stating explicitly:** stage 0 must precede stage 1. Every ⚠ item in the ledger below is a five-minute DevTools check on a live instance, and any one of them coming back different changes the plan. Do not plan stages 2–6 in detail before stage 0 reports.

---

## Anti-Patterns

### 1. Inline styles instead of an attribute + stylesheet
**What people do:** `row.style.backgroundColor = '#f48fb1'` — both surveyed pieces of prior art do exactly this.
**Why it's wrong:** writes the `style` attribute (observer self-trigger risk), loses the `td`-over-`tr` background fight, cannot be cleanly reverted, pollutes DevTools, and moves the paint decision from the CSS engine into JS.
**Instead:** stamp `data-zhroma-priority`, style declaratively.

### 2. `setInterval` because the SPA is confusing
**What people do:** poll once per second and hope.
**Why it's wrong:** visible colour flash after every user action, constant CPU on an all-day tab, throttled to uselessness in background tabs.
**Instead:** debounced `MutationObserver` on `document.body`.

### 3. Matching priority by scanning the whole row's text
**What people do:** `if (/Urgent/.test(tr.textContent))`.
**Why it's wrong:** a ticket whose *subject* is "URGENT: server down" gets tinted red regardless of its actual priority. Silent, plausible, and wrong — the worst combination. Also matches the requester's name, the organisation, tags, anything.
**Instead:** resolve the column index, read exactly `row.cells[index]`.

### 4. Caching node references or a bare column index across passes
**What people do:** `let priorityIndex = 6;` at module scope, or holding `const rows = [...]` between passes.
**Why it's wrong:** React replaces nodes and the user switches views. Stale index → tinting by the wrong column. Stale nodes → operating on detached elements. This is the single most likely bug in this architecture.
**Instead:** re-query every pass; memo only in a `WeakMap` keyed on the `<table>` element.

### 5. Targeting styled-components class names
**What people do:** `.sc-1a2b3c > td`.
**Why it's wrong:** those hashes change on every Garden release. This is precisely how the incumbent extension went from working to "It no longer works."
**Instead:** `[data-garden-id="tables.row"]` — a versioned, published, first-party contract.

### 6. `disconnect()` / `takeRecords()` around your writes
**What people do:** deafen the observer while writing.
**Why it's wrong:** discards genuine page mutations that land in the gap, producing intermittent untinted rows that nobody can reproduce. Trades a loud bug for a quiet one.
**Instead:** don't observe attributes; keep the write idempotent. Then there is nothing to deafen.

### 7. Element-qualified selectors that assume `<tr>`
**What people do:** `tr[data-garden-id="tables.row"]` everywhere.
**Why it's wrong:** if any surface ever virtualises, rows become `<div role="row">` and every selector silently misses.
**Instead:** `[data-garden-id="tables.row"]`. Costs nothing today, saves a rewrite if wrong.

### 8. Tinting group rows
**What people do:** `tbody tr`.
**Why it's wrong:** grouped views insert `tr[data-garden-id="tables.group_row"]` section headers. Tinting them looks like a rendering fault.
**Instead:** select on `tables.row` explicitly; never on `tbody tr`.

### 9. An injected in-page banner for the hint
**Why it's wrong:** violates "fail quietly," steals vertical space, and needs dismiss-state that v1's no-storage decision forbids.
**Instead:** action badge + static popup. No permission, no footprint.

### 10. Reaching for `webNavigation` to detect view switches
**Why it's wrong:** a permission you must justify at store review, for a capability the observer already gives you for free. The incumbent was delisted on policy grounds; don't add surface.
**Instead:** treat a route change as what it is — a DOM mutation.

---

## Scaling Considerations

This extension has no backend and no users-per-server dimension. The meaningful axes are **rows per view** and **mutations per second**.

| Scale | Behaviour | Adjustment |
|-------|-----------|------------|
| **~30 rows/page** (Zendesk default) | One pass = ~30 `textContent` reads + ~30 string compares ≈ well under 1 ms | None. This is the expected case. |
| **~200 rows** (third-party "Lovely Views"-style tools raise the page size) | ~7× the work; still ≈1–2 ms | None. |
| **High mutation rate** (live-updating view, agent scrolling fast) | Observer callback fires hundreds of times/sec, but each call is `clearTimeout` + `setTimeout` | The debounce already bounds work to ≤20 passes/sec. If profiling shows a problem, raise the debounce to 100 ms — still imperceptible. |
| **Many Zendesk tabs open** | Independent content script per tab | None. Nothing is shared, nothing coordinates. |
| **Locale table grows to 40 locales** | A ~40×5 string object parsed once at load | Negligible. If it ever mattered, load only the detected locale — but it won't. |

### First and second bottlenecks

1. **First thing to break: correctness, not performance.** A Zendesk front-end change that alters or removes `data-garden-id`. Mitigation is not architectural but operational: captured fixtures as regression tests, element-agnostic selectors, and fail-quiet everywhere so a break is invisible rather than page-destroying.
2. **Second: the pass on a page with many tables.** If Zendesk ever renders several Garden tables in an agent view, the locator returns all of them and the resolver runs per table. Bounded and cheap. Do not pre-optimise this.

**Explicitly do not** build a virtual-DOM diff, an incremental row tracker, or an `IntersectionObserver` to stamp only visible rows. At 30 rows, the full re-scan is faster than the bookkeeping needed to avoid it, and it is the thing that makes statelessness (and therefore free route-change handling) possible.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|--------------------|-------|
| Zendesk REST API | **None** | Explicitly rejected in PROJECT — needs auth and a heavier permission ask. Note that prior art *does* use it for priority, which is a genuine alternative if DOM reading proves impossible — but it changes the permission story completely. |
| Any network | **None** | No telemetry, no analytics, no remote config. This is the privacy-policy story and the store-review story. |
| `chrome.storage` | **None in v1** | Zero-config decision. Adding it later (for v2 custom colours) is additive and does not disturb this architecture — the palette becomes CSS custom properties set from storage. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Manifest → content script | Declarative injection | The browser does this. No code. |
| Manifest → page CSS | Declarative injection | Injected before DOM construction; inert until an attribute matches. |
| Observer → pure components | Direct call | Synchronous, one direction, no callbacks back |
| Pure components → Stamper | Direct call with a token | The only inbound edge to the write layer |
| Stamper → page | `setAttribute` | **Single choke point.** Audit here. |
| Content script → service worker | `chrome.runtime.sendMessage`, fire-and-forget, on state change only | Debounced. No reply expected. |
| Service worker → browser UI | `chrome.action.setBadgeText({tabId})` | Requires only the `action` manifest key, no permission |
| Popup → anything | **Nothing** | Static HTML. Deliberately inert. |

### The seam for v2

The PROJECT defers custom colours, alternative treatments (stripe, pill) and a colourblind palette to v2. Under this architecture **all three are pure CSS changes**:

- Custom colours → set `--zhroma-urgent` etc. from `chrome.storage` (adds one permission, one options page; touches no other component).
- Left-edge stripe → `tr[data-zhroma-priority="urgent"] > td:first-child { box-shadow: inset 4px 0 0 var(--zhroma-urgent); }`
- Coloured pill → style the priority `<td>` only.

The stamp is the stable contract; the treatment is swappable. That is the strongest argument for strategy D beyond the loop safety: it makes the entire deferred v2 roadmap a stylesheet.

---

## Verification Ledger

Everything load-bearing, with how it was established.

### Verified — HIGH confidence

| Claim | Method |
|-------|--------|
| Garden emits `data-garden-id` on table elements, unconditionally, in production | Downloaded and extracted `@zendeskgarden/react-tables@9.15.8` from the npm registry; read `dist/esm/styled/Styled{Table,Head,Body,Row,GroupRow,Cell,HeaderCell,SortableButton}.js`. Zero `NODE_ENV` references in the dist bundle — not dev-gated. |
| `tables.table`→`<table>`, `tables.head`→`<thead>`, `tables.body`→`<tbody>`, `tables.cell`→`<td>`, `tables.header_cell`→`<th>` (via `.attrs({as:'th'})`), `tables.sortable`→`<button>` | Same, read directly from `styled.X.attrs(…)` declarations |
| `tables.group_row` is a distinct row type from `tables.row` | Same — `StyledGroupRow` vs `StyledRow`, both extending `StyledBaseRow` |
| Garden class names are styled-components hashes (unstable) | `styled-components` is a declared dependency; hashed `sc-*` class generation is its documented default |
| History API monkeypatching does not work from an isolated world | Documented: isolated-world `history.pushState` is a different function object; the standard workaround is `world: "MAIN"` injection plus a CustomEvent bridge |
| `popstate` does not fire for `pushState`/`replaceState` | Long-standing documented History API limitation |
| CSS has no text-content selector; the documented workaround is JS→attribute→CSS | Confirmed; this *is* the recommended pattern |
| MV3 `content_scripts.css[]` is injected declaratively, before DOM construction, needing only `matches` | Chrome extension manifest documentation |
| Navigation API is Baseline newly-available (Jan 2026); Chromium-supported | MDN / web.dev |

### Verified — MEDIUM confidence (real-world code, one source)

| Claim | Method |
|-------|--------|
| Zendesk agent views use a Garden table: `table[data-garden-id="tables.table"] tbody` | `holatuwol/liferay-zendesk-userscript`, `src/group_rows.ts` — a maintained production userscript against real Zendesk |
| Agent view route is `/agent/filters/<view_id>`; also `/agent/tickets/<id>`, `/agent/dashboard`, `/agent/admin/` | Same repo, `src/main.ts` path checks |
| Views render **two** tables — `table[data-test-id="table_header"]` and `table[data-test-id="table_main"]` — inside `div[data-test-id="table_container"]` | Same repo, `src/main.ts` |
| Zendesk-specific attrs exist: `generic-table`, `generic-table-row`, `generic-table-cells-id`, `ticket-table-cells-subject`, `views_views-ticket-table`, `views_views-header-page-amount`, `generic-table-pagination-{first,next}`, `status-badge-state` (`data-cy-test-id`) | Same repo, multiple files |
| Header text lives inside a `<button>` when sortable, as a text node otherwise | Same repo, `getTextHeader()` |
| Views paginate at 30 tickets/page | Zendesk community/help sources, corroborated by pagination controls in the DOM |
| The incumbent competitor ("Zendesk Priority Highlights") has 87 installs, 3.71/5, last updated 2019, **delisted 2026-08-27** for "Minor Policy Violation / No Privacy Policy", with reviews reading "It no longer works" | Extpose listing |
| No priority class/attribute on Zendesk ticket rows | Negative evidence: absent from every observed attribute set; both prior-art implementations work around its absence (one via API, one via `textContent` regex) |

### ⚠ ASSUMPTIONS TO VALIDATE — stage 0, on a live instance

None of these could be confirmed without a real Zendesk account. Each is a few minutes in DevTools.

1. ⚠ **`data-garden-id` is present on rows in a *current* agent view.** The corroborating userscript may target an older Garden version. **Check first — the whole architecture rests on this.** Fallback if absent: `data-test-id="generic-table-row"`, then structural `table tbody tr`.
2. ⚠ **`table[data-test-id="table_main"]` carries its own `<thead>`** (so headers and rows are resolvable within one `<table>`). If not, the resolver must reach the sibling header table via `[data-test-id="table_container"]`.
3. ⚠ **No priority class or `data-*` on ticket rows.** If one exists, delete components 4/5/6 and ship a stylesheet. Highest-value check per minute spent.
4. ⚠ **Views are not virtualised** — count `[data-garden-id="tables.row"]` at scroll top vs bottom on a 30-row view.
5. ⚠ **The priority `<td>` contains the plain localised word**, not an icon, badge, abbreviation, or `aria-label`-only element. If it is a badge (like Status is), `textContent` may be empty and the extractor needs a different read.
6. ⚠ **`document.documentElement.lang` reflects the *agent UI* language**, not the account default or the help-centre locale. If not, find the real source (a `<meta>`, a global, or a data attribute on `<body>`).
7. ⚠ **Exact localised strings** for the Priority header and the four values in each shipped locale. Zendesk publishes a supported-language list but not, publicly, the agent-UI strings; these must be captured from live instances or from a Zendesk locale export.
8. ⚠ **CSS specificity actually wins.** Verify `tr[data-zhroma-priority] > td` beats Garden's `td` background without `!important`, and decide the precedence against Garden's row `:hover` and selected-row states — a tint that vanishes on hover will read as a bug.
9. ⚠ **Agent views are not inside an iframe.** The top-frame guard assumes the table is in the top document. If Zendesk frames it, adjust `all_frames`.
10. ⚠ **`*://*.zendesk.com/agent/*` is sufficient.** Some accounts use custom/vanity domains for the agent interface; those would be out of match scope. Confirm whether that is a real deployment pattern before promising "any Zendesk."

---

## Sources

- `@zendeskgarden/react-tables@9.15.8` — published npm tarball, `dist/esm/styled/*.js` (primary source, HIGH)
- [Zendesk Garden — Table component](https://garden.zendesk.com/components/table/) (official docs)
- [`holatuwol/liferay-zendesk-userscript`](https://github.com/holatuwol/liferay-zendesk-userscript) — `src/main.ts`, `src/group_rows.ts`, `src/view_columns.ts` (maintained production prior art)
- [pioug — Highlight Zendesk tickets based on their priority (gist)](https://gist.github.com/pioug/33d2a6a7e1ac8e5c52404cbfee11f2d6) (simple prior art)
- [Zendesk Priority Highlights — Extpose listing](https://extpose.com/ext/65981) (incumbent; delisting and failure evidence)
- [Chrome — Manifest content_scripts reference](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Chrome — Content scripts (isolated worlds)](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [MDN — `MutationObserver.takeRecords()`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/takeRecords)
- [MDN — `MutationObserver.disconnect()`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect)
- [MDN — Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)
- [web.dev — Navigation API is Baseline newly available](https://web.dev/blog/baseline-navigation-api)
- [MDN — `scripting.ExecutionWorld`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/ExecutionWorld)
- [MDN — Use data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes)
- [Zendesk — Creating views to build customized lists of tickets](https://support.zendesk.com/hc/en-us/articles/4408888828570-Creating-views-to-build-customized-lists-of-tickets)
- [Zendesk — Zendesk language support by product](https://support.zendesk.com/hc/en-us/articles/4408821324826-Zendesk-language-support-by-product)
- [Zendesk — Configuring Zendesk Support for your locale and language](https://support.zendesk.com/hc/en-us/articles/4408887059866-Configuring-Zendesk-Support-for-your-locale-and-language)

---
*Architecture research for: Chrome MV3 content-script extension over a third-party React SPA*
*Researched: 2026-09-02*
