# Pitfalls Research

**Domain:** Public Chrome MV3 extension that scrapes a third-party SaaS SPA's rendered DOM (Zendesk agent views) and restyles it
**Researched:** 2026-09-02
**Confidence:** MEDIUM overall (store policy claims verified against developer.chrome.com; Zendesk DOM internals UNVERIFIED and deliberately flagged as a Phase 0 blocker)

---

## Prior Art — Read This First

Two extensions have already tried to do exactly what Zhroma does. Both are cautionary tales, and both failed for reasons in this document.

| Extension | Users | Rating | Fate |
|-----------|-------|--------|------|
| **Zendesk Priority Highlights** | 87 | 3.71/5 | Last updated **2019-07-21**. **Delisted from the Chrome Web Store on 2026-08-27** for a minor policy violation **plus a missing privacy policy**. Reviews: *"It no longer works…"*, *"It's currently not working 😔"*, *"This is working again for me"*, and a user having to tell other users *"you have to make sure your Zendesk view has the priority column"*. |
| **Zest – The Zendesk Colour Coder** | — | **2.6/5** | Broke on Chrome 105; users reported it stopped working and asked for a fix. |

Read that table again. The direct predecessor of this project:
1. Broke repeatedly and visibly, in public, in its reviews (Pitfall 1);
2. Never solved the missing-Priority-column problem — its *users* had to explain it to each other (Pitfall 4);
3. Was eventually **killed by the Chrome Web Store for a missing privacy policy** (Pitfall 5).

Zhroma's PROJECT.md already anticipates (2) and (3). It does not yet have an answer for (1)'s detection half, and it has no answer at all for the two pitfalls ranked #2 and #3 below.

*(Prior-art data: extpose.com third-party store analytics + Chrome Web Store listing text. Confidence: MEDIUM.)*

---

## Damage Ranking

| # | Pitfall | Probability | Severity | Detectable by solo dev? |
|---|---------|-------------|----------|-------------------------|
| **1** | **DOM breakage with no way to learn about it** | ~1.0 over project life | Total silent failure | **No** — this is the problem |
| **2** | **Locale-dependent priority reading (English-text matching)** | High | Total silent failure for a large install fraction | **No** — dev works in English |
| **3** | **Zendesk dark mode vs. hard-coded light tints** | High — dark mode is **on by default at account level** | Actively harmful: unreadable text, worse than doing nothing, **no escape hatch in v1** | **No** — dev works in light mode |
| 4 | Chrome Web Store rejection / later delisting | Medium at submission, non-trivial later | Blocks launch; delisting kills the product | Yes |
| 5 | MutationObserver misuse (self-retrigger, scope, thrash, leak) | High if naive | Scroll jank; extension gets uninstalled | Yes, with effort |
| 6 | CSS collision breaking Zendesk's own row states | High | Agents lose hover/selected/unread — worse than no extension | Yes |
| 7 | Scope creep destroying the single-purpose story | Medium-high | Slower reviews forever; eventual rejection | Yes |
| 8 | Enterprise policy blocking / never being allowlisted | Medium | Invisible ceiling on adoption | No |
| 9 | Solo-dev publishing and maintenance traps | High | Schedule slip; slow time-to-repair | Yes |

---

## Critical Pitfalls

### Pitfall 1: You break, and nobody tells you

**What goes wrong:**

Zendesk ships a front-end change. A selector stops matching. The extension does nothing. Agents see plain white rows again, assume Zendesk changed something, and either uninstall or just live with it. You find out weeks or months later — from a 1-star review, or never. Both predecessor extensions lived in exactly this state, publicly, for months at a time. `Zendesk Priority Highlights` has review comments spanning March→June 2019 tracking a break-and-fix cycle the developer clearly discovered from the reviews.

The `no telemetry` constraint (which is correct and worth keeping) means you have deliberately removed the standard detection channel. If you don't build a replacement, you have chosen to be blind. That is a design decision, not a default.

**Why it happens:**

The fragility risk is stated in PROJECT.md and feels handled because it is written down. But "fail quietly (page untouched)" — also in PROJECT.md — is a *user-facing* mitigation that makes the *developer-facing* problem worse. Silent failure plus no telemetry plus users who don't file bugs equals permanent undetected breakage. The three constraints compose into blindness, and nobody notices because each one is individually correct.

**How to avoid:**

Build a detection loop that costs nothing and collects nothing. In descending order of value:

1. **Make the toolbar icon the status channel.** The `action` icon requires no permission and produces no install warning. Colour icon = ran and tinted N rows. Grey icon + `!` badge = ran, found the ticket table, matched zero priorities. Distinct grey state = found no ticket table at all. Now every user is a passive monitor and can *see* that the extension is broken rather than assuming Zendesk changed. This single move converts silent failure into self-reported failure and costs one manifest key.
2. **Ship a "this looks broken — report it" affordance that makes no network call.** A button in the popup that calls `chrome.tabs.create()` with a pre-filled GitHub issue URL (title, extension version, Zendesk locale, which of the three failure states fired). This is a *user-initiated navigation*, not telemetry: your extension sends nothing, the user chooses to open a page. It is fully compatible with the zero-network promise and it is the highest-yield bug channel available to a no-telemetry extension. `chrome.tabs.create()` with a URL does **not** require the `tabs` permission.
3. **Keep a permanent Zendesk sandbox and a recurring calendar reminder.** A free Zendesk trial or sandbox account you log into on a fixed cadence (weekly at launch, monthly once stable) is the only *proactive* signal you will ever have. Budget it as a standing maintenance cost, not a nice-to-have. Without this, mean-time-to-detection is unbounded.
4. **Subscribe to Zendesk's release notes and Agent Workspace announcements.** Zendesk announces agent-interface changes ahead of rollout. This is free lead time.
5. **Log a single structured `console.info` line on every pass** — version, shell detected, locale detected, rows seen, rows tinted, strategy that matched. When a user emails you, "open DevTools console and paste the Zhroma line" is a complete diagnostic in one round trip. Costs nothing, collects nothing, stores nothing.
6. **Watch the Chrome Web Store Support tab and rating trend.** Lagging, noisy, but free. Set the listing's support URL to your issue tracker so complaints land somewhere you read.

**Do not** solve this with a remotely-fetched selector list. See the Technical Debt table — it trades your entire trust story and your narrow permission set for a shorter repair cycle.

**Warning signs:**
- You cannot answer "how would I know if this broke last Tuesday?" without saying "a user would tell me."
- The failure path in code is a bare `return` with no observable side effect.
- The extension has exactly one visual state (working) and one invisible state (everything else).
- You have no Zendesk account of your own, only a colleague's.

**Phase to address:** Phase 0 (establish the sandbox before writing any code) and Phase 4 (Failure States) — the icon states and the three-way failure taxonomy are Phase 4 deliverables, **not** post-launch polish. Ship v1 with them or ship v1 blind.

---

### Pitfall 2: Priority is read by matching English text, and most of your installs aren't English

**What goes wrong:**

The obvious implementation finds the Priority column by matching the header text `"Priority"` and reads the cell text against `"Urgent" | "High" | "Normal" | "Low"`. On a German instance the header is `Priorität` and the values are `Dringend / Hoch / Normal / Niedrig`. On Japanese, `優先度` and `緊急 / 高 / 通常 / 低`. On Brazilian Portuguese, `Prioridade` and `Urgente / Alta / Normal / Baixa`.

**Zendesk's agent interface is localised into 40 languages plus 4 variants** (verified against Zendesk's language-support-by-product page: Arabic, Bulgarian, Czech, Danish, Dutch, English UK/US, Finnish, French, French Canada, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Norwegian, Polish, Portuguese-BR, Romanian, Russian, Simplified Chinese, Slovak, Spanish, Swedish, Thai, Traditional Chinese, Turkish, Ukrainian, and more). Critically, **each agent picks their own interface language independently of the account's supported languages** — so this is not "some instances are German", it is "some *agents on any instance* are German."

For every one of those agents, an English-text implementation silently does nothing. They install, see no change, uninstall, and possibly leave a review saying it doesn't work. You will never reproduce it, because you work in English.

Worse: this failure is **indistinguishable in your code** from "the view has no Priority column." If you route it to the existing "add the Priority column" hint, you will actively mislead a German agent whose view *does* have the column into a wild goose chase.

**Why it happens:**

The developer speaks English, tests in English, and reads a DOM that says "Urgent" in it. There is no error, no exception, no red flag. The `*.zendesk.com` global-audience decision in PROJECT.md is precisely what makes this bite — a single-tenant internal tool would never hit it.

**How to avoid:**

In strict preference order:

1. **Find a locale-independent signal first, and treat this as a Phase 0 gate.** Before writing any matching logic, inspect the real rendered DOM for anything machine-readable attached to the priority cell or row: a `data-*` attribute, a CSS class encoding the value, an `aria-label` with a stable token, an SVG icon `id`/`href`, a `title` attribute, or a sort key. If any exists, the entire pitfall evaporates and you should build on it exclusively. **This is currently unverified** — Zendesk publishes no DOM contract and no `data-test-id` scheme for the agent-view ticket table. Phase 0 must answer it empirically on a real instance, in at least two locales.
2. **If no locale-independent signal exists, build a locale lookup table.** 4 values × ~44 locales ≈ 176 strings. Tedious, bounded, one-time. Harvest them by switching a sandbox agent's language and reading the rendered strings, or from Zendesk's published translation resources. Select the table by `document.documentElement.lang` (or whichever locale marker the Zendesk shell exposes) rather than trying every locale at once — though note that trying all locales simultaneously is actually *safe* here, since no two Zendesk priority strings collide across locales in a way that changes the ordinal.
3. **Normalise before comparing.** Case-fold, trim, strip diacritics where safe, and handle non-breaking spaces. `Priorität` vs `PRIORITÄT` vs `Priorität` (combining diacritic) are all live possibilities.
4. **Do not use column position as a fallback.** Zendesk views are user-configured; the Priority column can be in any position or absent. Position is less durable than text, not more.
5. **Make "unknown locale" a first-class, distinct failure state.** Three states, three behaviours:
   - *No ticket table found* → do nothing, grey icon, distinct console line. (Probably not an agent view, or the shell changed.)
   - *Table found, no Priority column* → the PROJECT.md hint: "add the Priority column to this view."
   - *Table and Priority column found, values unreadable* → a **different** message: "Zhroma couldn't read this view's priority values — please report this," with the report button and the detected locale pre-filled. This is the single most valuable diagnostic you can ship, because it converts your worst blind spot into an inbound bug report.

**Warning signs:**
- A string literal `'Urgent'` appears anywhere in the source.
- The test plan says "open a view and check the colours" without specifying a locale.
- The failure taxonomy has two states instead of three.
- Nobody has opened the extension against a non-English Zendesk before submission.

**Phase to address:** Phase 0 (DOM recon must include a non-English locale — this is a hard gate, not a stretch goal) and Phase 1 (Priority Detection). Retrofitting locale support after launch means republishing to a user base that has already churned.

---

### Pitfall 3: Zendesk dark mode makes your hard-coded light tints unreadable — and v1 has no escape hatch

**What goes wrong:**

Zendesk Support **already has native dark mode**, and the account-level setting is, per Zendesk's own documentation, *"activated by default."* Individual agents opt in from profile → Appearance, with a **"match system appearance"** option — meaning any agent on a dark-themed OS who touches that setting gets dark Zendesk automatically. Dark mode explicitly covers *"tickets, views, Support settings pages, and so on."*

So: pastel light-mode tints (`#ffe5e5` red, `#fff4e5` orange, …) painted onto a dark row give you near-white row backgrounds with Zendesk's near-white dark-mode text on top. Unreadable. Worse than no extension. And because PROJECT.md deliberately ships **hard-coded colours with no options page**, the agent has no way to fix it and no way to turn it off short of disabling the extension.

This is not a v2 problem. It is live today, on by default at the account tier, and it is the most likely source of your first 1-star review.

**Why it happens:**

The developer builds and tests in light mode. Dark mode is mentally filed as "a future Zendesk feature" — the brief itself frames it as *"when Zendesk ships its own dark mode."* It already shipped. The "hard-coded colours, zero config" decision — which is right for the zero-setup goal — removes the user's ability to compensate, converting a cosmetic problem into an unfixable one.

**How to avoid:**

1. **Tint translucently via `background-image`, not opaquely via `background-color`.** Apply the tint as a flat translucent gradient over Zendesk's own background:
   ```css
   [data-zhroma-priority="urgent"] {
     background-image: linear-gradient(rgba(220, 38, 38, 0.14), rgba(220, 38, 38, 0.14));
   }
   ```
   `background-image` paints *above* `background-color` on the same element. This means Zendesk's own row colour — light, dark, hover, selected, whatever — shows through, and your hue composites onto it. **This one technique solves the dark-mode problem and most of Pitfall 6 simultaneously, without you ever needing to know which theme is active.** It is the highest-leverage decision in this document.
2. **Do not rely on `prefers-color-scheme`.** Zendesk's dark mode is an explicit in-app toggle. An agent can run dark Zendesk on a light OS. `prefers-color-scheme` will lie to you a meaningful fraction of the time.
3. **If you need a theme-aware alpha (dark backgrounds mute a translucent tint more than light ones), feature-detect by measured luminance, not by class name.** Read the computed background colour of one row *once* per palette decision, compute relative luminance, pick a light-theme or dark-theme alpha. Never key off a Zendesk CSS class name like `.dark` — that is exactly the version-detection anti-pattern from Pitfall 4. Read it once and cache it; do not do this per row (see Pitfall 5, forced layout).
4. **Re-evaluate the theme on change.** The agent can flip dark mode without a page reload. Observe `class`/`style`/`data-*` on `<html>`/`<body>` cheaply, or simply re-measure luminance on your existing periodic sweep.
5. **Verify contrast in both themes before submission.** A 200-row view screenshot in dark mode is a required Phase 2 acceptance artifact. Text must remain readable and the four tints must remain distinguishable from each other.

**Warning signs:**
- Any opaque hex colour in the stylesheet applied to a row background.
- No dark-mode screenshot in the test evidence.
- The word "dark mode" appears only in the v2 backlog.
- The stylesheet contains a Zendesk-authored class name.

**Phase to address:** Phase 2 (Tint Rendering). The translucent-`background-image` decision must be made *before* any colour values are chosen, because it changes what the colour values are (alphas, not hexes).

---

### Pitfall 4: Selector strategy that hard-codes today's DOM

**What goes wrong:**

The recon spike finds `.sc-1x2y3z4 > tbody > tr:nth-child(n) > td:nth-child(4)`, it works, it ships. Zendesk rebuilds a component, the generated class hash changes, and every install breaks at once. The `nth-child` index breaks the moment an agent reorders their view columns — which is a per-user configuration, so it breaks for *some* users immediately, not for everyone later.

The tempting fix is worse: sniffing a Zendesk version or app-shell marker and branching. That fails on the first partial rollout, A/B test, or EAP flag — Zendesk does not ship one UI to everyone at once.

**Why it happens:**

DevTools' "Copy selector" produces exactly this. It works on the first try, which is the trap. Nothing about a working selector tells you how durable it is.

**How to avoid:**

**Selector durability ranking, most to least durable:**

| Rank | Strategy | Durability | Notes |
|------|----------|------------|-------|
| 1 | Semantic HTML + ARIA roles (`[role="row"]`, `[role="gridcell"]`, `<tr>`, `<th scope>`) | **Highest** | Survives restyles and framework swaps; accessibility requirements make Zendesk unlikely to remove them |
| 2 | Stable `data-*` / `data-test-id` attributes | **High** *if they exist* | Often maintained for the vendor's own E2E tests. **Unverified for Zendesk — Phase 0 must confirm.** |
| 3 | Structural relationships anchored to (1) or (2) — "the cell in this row at the index of the header cell whose text matches" | **Medium-high** | Derives position from content rather than hard-coding it; survives column reordering |
| 4 | Visible text content | **Medium** | Durable against restyles, **fatal against localisation** — see Pitfall 2 |
| 5 | Generated/hashed class names (`.sc-xxxx`, `.css-xxxx`, BEM-ish emotion output) | **Low** | Changes on every build of the component |
| 6 | `nth-child` / absolute position | **Lowest** | Breaks on user configuration, not just vendor changes |

**Concrete rules:**

- **Layer strategies; never depend on one.** Try (2), fall back to (1), fall back to (3). Record which tier matched in the console line and in the icon state — a silent downgrade from tier 2 to tier 4 is an early warning that Zendesk changed something, weeks before it breaks fully.
- **Feature-detect, never version-detect.** Ask "does this node have a priority-bearing attribute?" not "is this the new agent workspace?". Both Zendesk shells (classic Support UI and the newer Agent Workspace with unified navigation) should be handled by the same capability probes.
- **Derive column position from the header row.** Find the header cell that identifies priority, take its index, use that index for body cells. This survives column reordering, which `nth-child(4)` does not.
- **Fail closed and fail silent.** Wrap every DOM read in a boundary that, on any exception or empty match, leaves the page **completely untouched** and flips the icon state. An extension that half-tints or throws in the console is worse than one that does nothing. Never inject partial styles before you have confirmed you can read every row.
- **Never modify structure.** Add an attribute, add a class, apply a stylesheet. Do not wrap, reparent, insert, or reorder nodes. A React/Ember reconciler will fight you, and structural edits are how extensions crash host apps.
- **Assume Shadow DOM might arrive.** Manifest-injected content-script CSS does **not** cross a shadow boundary, and `document.querySelectorAll` does not descend into shadow roots. Probe for `element.shadowRoot` during recon and again at runtime. Open shadow roots can be handled by injecting a `<style>` into each root (and using `adoptedStyleSheets`); **closed shadow roots are unreachable and would end the project's current approach** — detect that case explicitly and fail to the icon state rather than mysteriously.
- **Write down the DOM contract you depend on.** A short `SELECTORS.md` listing each assumption ("priority cell is identified by X; if X disappears, fall back to Y") turns future breakage from an archaeology exercise into a checklist.

**Warning signs:**
- A selector string contains a hash, a random-looking suffix, or `nth-child`.
- The code branches on a Zendesk version, build ID, or shell class name.
- One selector constant is used in more than one place with no fallback.
- Recon was performed on one account, one view, one locale, one theme.

**Phase to address:** Phase 0 (DOM Recon Spike — produce the durability-ranked inventory) and Phase 1 (Priority Detection — implement layered strategies with tier reporting).

---

### Pitfall 5: Chrome Web Store rejection at submission, and delisting later

**What goes wrong:**

First submission bounces, or — as happened to the direct predecessor — the extension is delisted *years later* for a compliance gap that was never fixed.

Chrome Web Store rejections arrive as an email containing a cryptic colour-element violation code. The ones that realistically hit a content-script extension like this one (all verified against developer.chrome.com/docs/webstore/troubleshooting):

| Code | Means | Risk for Zhroma |
|------|-------|-----------------|
| **Purple Potassium** | Excessive/unnecessary permissions. Policy intent: *"prevent excessive and unnecessary access to user data."* | **Medium** — only if the permission set drifts |
| **Blue Argon** | MV3 package requirements; most commonly remotely-hosted code or unsafe execution | **Low** if you ship no remote anything — but a CDN font URL or an `eval`-shaped bundler output will trigger it |
| **Red Titanium** | *"Developers must not obfuscate code or conceal functionality."* | **Medium** — an aggressive default minifier config looks like obfuscation |
| **Yellow Zinc** | Missing/insufficient listing metadata. *"Users should be able to understand what features and functionality an item provides based on its listing before they choose to install it."* | **Medium** — first-timers underinvest here |
| **Yellow Potassium** | Minimum functionality. *"Extensions must provide a basic degree of functionality and utility that provide value to the catalog."* | **Genuine risk — see below** |
| **Purple Lithium / Purple Nickel** | Privacy disclosure requirements | **This is what delisted the predecessor** |
| **Red Magnesium / Copper / Lithium / Argon** | Single purpose violations | Low for v1, rising with every feature (Pitfall 7) |

**The non-obvious one: Yellow Potassium.** A reviewer opens a fresh Zendesk trial. The default view may have no Priority column. Your extension — correctly, by design — does nothing except show a small hint. To a reviewer with no Zendesk context, that is an extension with no discernible functionality. Your core design decision ("fail silently") and the store's minimum-functionality bar point in opposite directions. This risk is specific to Zhroma and would not appear in a generic checklist.

**On the privacy policy paradox:** the Chrome user-data documentation says extensions must disclose data handling *"even when data is processed or stored locally on a user's device and is not transmitted to external servers"* — yet the user-data FAQ says an extension that genuinely handles no user data has *"no special or new obligations."* Reading ticket priority off a page you never store, transmit, or persist is defensible as "no user data handled." **Do not gamble on that reading.** Publishing a one-page privacy policy that says "Zhroma collects nothing, stores nothing, transmits nothing" costs an hour and a GitHub Pages URL, and it is exactly the omission that got the predecessor delisted seven years after it stopped being maintained.

**How to avoid:**

**Permissions — get this exactly right at v1, because it is expensive to change later:**
- Use **only** `content_scripts.matches`. Do **not** declare a `host_permissions` block: a static content script declared in the manifest does not need one, and declaring it broadens your ask for nothing.
- Narrow the match pattern beyond PROJECT.md's stated constraint: **`https://*.zendesk.com/agent/*`**, not `*://*.zendesk.com/*`. This is `https`-only (Zendesk is HTTPS-only anyway) and — critically — it **excludes `/hc/`, the customer-facing Help Center on the same domain**. An extension that can read customer-facing pages is a materially harder sell to a security-conscious admin than one confined to the agent console. The agent interface always lives at `<subdomain>.zendesk.com/agent/`, so nothing is lost.
- Request **zero API permissions** if you possibly can. No `storage` (v1 has nothing to store), no `tabs` (`chrome.tabs.create(url)` doesn't need it), no `scripting` (a static content script suffices), no `activeTab`. A manifest whose only capability is a scoped content script is close to the cheapest possible review.
- Set `"all_frames": false` explicitly. Zendesk apps (ZAF) run in iframes; you have no business in them, and running there costs performance and looks worse in review.

**Listing and dashboard:**
- Fill **every** field on the Privacy practices tab: the single-purpose description, a justification for each permission, the host-permission justification, the remote-code declaration, the data-usage matrix, and the Limited Use certification. The permission-justification free text is effectively the only prose a reviewer reads about your intent — use it to explain that you read one rendered column and write CSS. **Inconsistency between the dashboard disclosures, the privacy policy, and actual behaviour is itself a violation** — so make all three say the same thing.
- Publish a privacy policy at a stable URL even though you collect nothing. GitHub Pages is free and permanent enough.
- **Beat Yellow Potassium with the listing.** 1280×800 screenshots showing a real before/after of a tinted 200-row view; a short demo video if you can; a description whose first sentence is unambiguous; and an explicit line stating that the view must include the Priority column. Make the value legible to someone who has never used Zendesk.
- Ship **unminified or lightly-minified** source with source maps. The whole extension is a few kilobytes. Publish the repo publicly and link it from the listing. This is both a Red Titanium defence and an enterprise-allowlisting asset (Pitfall 8).

**Timeline expectations (verified against developer.chrome.com/docs/webstore/review-process):**
- *"For most extensions, review is completed within a few days, but it can take up to a few weeks."* Contact support past three weeks.
- Explicitly listed slow-review triggers that apply to you: **new developers**, **new extensions**, broad host permissions like `*://*/*`, dangerous or sensitive permissions, significant code changes, and extensive/hard-to-review code. As a first-time publisher you start in the slow lane by definition; the only lever you control is keeping the permission set and the code small.
- **On rejection:** you get an email naming the policy. Your existing listing, description, images, privacy disclosures and published CRX are **unaffected**, and **users are not notified**. Appeal via the Appeal button on the item detail page in the dashboard. A rejected *update* never removes the currently-published version — existing users keep working.

**Warning signs:**
- The manifest has a `host_permissions` array.
- The match pattern is `*://*.zendesk.com/*` rather than `https://*.zendesk.com/agent/*`.
- A permission is present "in case we need it later" — the policy explicitly forbids this: don't *"future proof"* by requesting permissions for unimplemented features.
- The privacy policy URL is a TODO.
- The screenshots are of a mock, not a real Zendesk view.
- Launch is coupled to a specific date.

**Phase to address:** Phase 5 (Store Packaging & Submission), but the permission set is a **Phase 1** decision that Phase 5 merely documents. Permission changes trigger extra review on every future update, so a wrong choice here taxes every hotfix for the life of the project.

---

### Pitfall 6: MutationObserver misuse

**What goes wrong, in four distinct ways:**

1. **Unbounded scope.** `observer.observe(document.body, { childList: true, subtree: true, attributes: true })` on a React/Ember SPA fires continuously — every tooltip, every timestamp tick, every hover state, every ZAF app iframe repaint. You are now running your callback thousands of times a minute for a page that changed in a way you don't care about.
2. **Self-retrigger.** Your callback writes `data-zhroma-priority` to a row. That attribute write is a mutation. Your observer sees it. Your callback runs again. If you are observing attributes without a filter, this is an infinite loop that pins a CPU core and freezes the tab.
3. **Layout thrashing.** You loop over 200 rows doing `getComputedStyle(row).backgroundColor` (read) then `row.setAttribute(...)` (write) then read the next row. Each read after a write forces a synchronous layout/style recalculation. 200 rows × forced reflow = hundreds of milliseconds of blocked main thread.
4. **Leaks across SPA route changes.** The Zendesk agent workspace never unloads the page. Switching views tears down the table and builds a new one. An observer bound to the old table keeps the old detached subtree alive forever. A `Set` of processed row elements does the same. After an eight-hour agent shift with dozens of view switches, the tab is holding megabytes of detached DOM.

**What "slow" looks like to an agent scrolling a 200-row view:** the scroll budget is 16.7 ms per frame. Anything in the hot path that forces layout blows it. The symptom is not a freeze — it's a scroll that feels *sticky*, rows that flash white before tinting, and a page that lags a beat behind the trackpad. Agents will not file a bug about this. They will uninstall and say Zendesk "feels slow with that extension."

**How to avoid:**

- **Scope tightly.** Observe the nearest stable ancestor of the ticket table, not `document.body`. If the table itself is replaced, observe its stable container and re-anchor.
- **Observe the minimum.** `{ childList: true, subtree: true }`. Set `attributes: false`, or if you must observe attributes, use `attributeFilter` that **excludes the attribute you write**.
- **Batch.** Never work inside the callback. Set a dirty flag and schedule one pass in `requestAnimationFrame` (or a microtask). Multiple mutation batches collapse into a single pass.
- **Be idempotent, cheaply.** Read the existing `data-zhroma-priority` value and skip the write if it is unchanged. No write, no mutation, no retrigger, no style recalc.
- **Split reads from writes.** Phase 1: read all 200 rows' priority text into an array. Phase 2: write all 200 attributes. Never interleave. The theme-luminance measurement (Pitfall 3) happens **once**, outside the loop, cached.
- **Let CSS do the painting.** JS writes one attribute per row; a single static stylesheet in `content_scripts[].css` does all the colour work. Never set inline styles per row — that is 200 style-attribute writes and 200 more mutations.
- **Use `WeakSet`/`WeakMap`, never `Set`/`Map`, for DOM-keyed bookkeeping.** A `Set` of elements is a guaranteed leak in an SPA that never unloads.
- **Use `takeRecords()` before `disconnect()`** to drain the pending queue when re-anchoring, so you don't process stale mutations against a torn-down tree.
- **Keep exactly one observer**, re-anchored on view change, rather than a new observer per table. Multiple live observers is how the leak starts.
- **Add a cheap safety-net sweep.** Frameworks strip unknown attributes on re-render, and if you aren't observing attributes you won't see it. A ~1 s idle re-sweep (plus a sweep on `visibilitychange` and on scroll-idle) that early-exits when nothing changed costs almost nothing and recovers from every class of missed mutation. This is the pragmatic answer to the observe-attributes-or-not trade-off: don't observe them, sweep instead.
- **Set a budget and measure it.** Target: < 2 ms per re-tint pass, < 16 ms worst case, **zero** forced layouts in the hot path. Verify in the DevTools Performance panel — look for "Recalculate Style" and "Layout" entries attributed to your script, and check the "Forced reflow" warnings.
- **Leak test:** heap snapshot, switch views 30 times, heap snapshot, compare detached-node counts. This is a five-minute test that catches the single hardest bug in this project.

**Warning signs:**
- `observe(document.body, ...)` anywhere.
- `attributes: true` without `attributeFilter`.
- `getComputedStyle` or `offsetHeight` inside a per-row loop.
- Any `new Set()` or `new Map()` holding elements.
- `element.style.backgroundColor = ...` instead of an attribute plus a stylesheet.
- Fan noise, or a Zendesk tab above ~5% CPU while idle.
- More than one `new MutationObserver` in the codebase.

**Phase to address:** Phase 3 (Re-application & Performance). Budget-and-measure must be an explicit acceptance criterion, not a vibe check.

---

### Pitfall 7: CSS collision that breaks Zendesk's own row states

**What goes wrong:**

You set `background-color: #ffe5e5 !important` on the row. Now:
- **Hover** is dead. Zendesk's hover rule sets `background-color`; yours has `!important` and wins. Agents lose the primary affordance for tracking which row they're on in a 200-row list.
- **Selected** is dead, the same way. Agents doing bulk actions can no longer see what they've checked — a genuine data-integrity risk, not a cosmetic one.
- **Unread/bold** and focus rings may survive (different properties) or may not.
- **Drag** feedback breaks if Zendesk uses a background change for it.

Then the escalation war: you notice hover is broken, so you add a `:hover` override. Zendesk ships a more specific rule. You chain another selector. You now have a 90-character selector that will break on the next restyle, and you have re-implemented Zendesk's interaction design badly.

Two adjacent failures:
- **Tinting the wrong element.** Setting the background on `<tr>` does nothing visible if the `<td>`s have their own opaque backgrounds painting over it. Setting it on the row `<div>` of a virtualised list does nothing if an inner wrapper paints. You will see "it doesn't work" and blame the selector when the selector was fine.
- **Shadow DOM.** Content-script CSS injected via the manifest does not cross shadow boundaries. If the ticket table lives in a shadow root, your stylesheet is inert while your JS may still appear to "find" nothing.

**Why it happens:**

`background-color` is the obvious property for "colour this row," and `!important` is the obvious tool for "beat the host app." Both obvious choices are wrong here, and both are individually reasonable.

**How to avoid:**

1. **Use a property the host app is not using.** Apply the tint as a translucent `background-image: linear-gradient(rgba(...), rgba(...))`. Zendesk keeps `background-color` for hover/selected/dark-mode; your `background-image` composites on top. **Hover still works. Selection still works. Dark mode still works. You never enter a specificity war because you are never competing for the same property.** Same recommendation as Pitfall 3 — it is the load-bearing decision of the whole styling approach.
   - Alternative if `background-image` is taken: `box-shadow: inset 0 0 0 100vmax rgba(...)`. Check first that Zendesk doesn't use `box-shadow` for the row focus ring — if it does, you'd clobber accessibility affordances, which is a worse trade.
2. **Do not use `@layer`.** This is a counterintuitive but verified trap: per MDN, **normal unlayered declarations beat *all* normal layered declarations.** Putting your extension CSS in a cascade layer makes it *lose* to Zendesk's ordinary unlayered styles — the exact opposite of the intent. (`!important` reverses layer order, so a layered `!important` does beat an unlayered `!important` — but relying on that is obscure enough to be a maintenance hazard.) Keep your rules unlayered.
3. **Keep specificity low and constant.** One attribute selector: `[data-zhroma-priority="urgent"] { … }`. Low specificity is fine when you aren't competing for the property. If you ever genuinely need `!important`, apply it to exactly one declaration and write a comment saying which host rule it beats.
4. **Find the painting element empirically.** During Phase 0, apply `background: magenta` at each candidate level — row element, cell, inner wrapper — and see which one actually shows. Record the answer.
5. **Probe for Shadow DOM** during recon and at runtime. Open roots: inject a `<style>` or use `adoptedStyleSheets` per root. Closed roots: unreachable — detect and fail to the icon state.
6. **Regression-test the row states explicitly.** Hover, hover-while-tinted, select one, select all, unread/bold, keyboard focus, and drag — in both themes, on every tint colour. This belongs in the acceptance criteria as a checklist, because "the colours look right" will pass while hover is silently dead.

**Warning signs:**
- `!important` count > 1.
- Any selector longer than ~40 characters.
- A `:hover` or `:where(.selected)` rule in your stylesheet — you should not need to reimplement host states.
- A Zendesk-authored class name in your CSS.
- The test plan checks colours but not interaction states.

**Phase to address:** Phase 2 (Tint Rendering), with the painting-element question answered in Phase 0.

---

### Pitfall 8: Scope creep dissolving the single-purpose story

**What goes wrong:**

"Tint rows by priority" is a perfect single-purpose extension. The gravitational pull toward "Zendesk power tools" is strong and arrives as individually reasonable requests:

> "Can it also colour by status?" → "…by SLA breach risk?" → "…by assignee?" → "Can it colour the tab strip too?" → "Can it show a countdown?" → "Can it colour search results?" → "Can it bulk-assign?" → "Can it save my favourite views?"

Each is small. The aggregate is a different product with a different permission profile and no defensible single purpose. Chrome's policy is explicit: *"An extension must have a single purpose that is narrow and easy to understand. Don't create an extension that requires users to accept bundles of unrelated functionality."* Clearly separate functionalities are supposed to ship as separate extensions.

The mechanical damage: **SLA countdowns and status-not-in-the-view require the Zendesk API**, which means auth handling and a real `host_permissions` ask — which is precisely the Purple Potassium trigger, and which slows *every subsequent review* forever. PROJECT.md already rejected the API for v1 on exactly these grounds; scope creep is how that decision gets quietly reversed one feature at a time.

**Why it happens:**

Feature requests from happy users feel like validation. "It's just one more field" is true of each request and false of the set. A solo developer with no product manager has no natural brake.

**How to avoid:**

- **Adopt a one-sentence test:** *if the store description needs the word "and", the single purpose is broken.* "Zhroma tints Zendesk ticket rows by priority." Not "…by priority and status." Not "…by priority and shows SLA."
- **Adopt a permission test:** *any feature that requires a new manifest permission is a new extension, not a new feature.* This is a hard, falsifiable line that maps directly onto how the store actually evaluates you.
- **Note that the v2 items already in PROJECT.md are safe.** Custom colours, stripe/pill treatments, an options page — these are all *the same purpose, configured*. They add `storage` (which produces no user-visible install warning) and stay squarely inside "tint rows by priority." Distinguishing "configuring the one purpose" from "adding a second purpose" is the whole discipline.
- **Keep an explicit "not this extension" list**, distinct from the "later" list. PROJECT.md's Out of Scope section already does this well — protect it. Colouring by status is on it. Adding a second field type is where the single-purpose story actually dies, so it belongs in the permanent-no column, not the maybe-later column.
- **Redirect requests, don't refuse them.** "That's a great idea for a separate extension" is both true and a decent answer.

**Warning signs:**
- The manifest gains a permission.
- The one-sentence description needs a conjunction.
- The options page grows a second tab.
- The word "suite", "toolkit", or "power" appears in any planning document.
- A feature request thread has more replies than the bug tracker.

**Phase to address:** Phase 5 (the single-purpose description you write for the dashboard is the artifact that pins this down) and every milestone boundary thereafter.

---

### Pitfall 9: Failing the trust test and never getting allowlisted

**What goes wrong:**

Zendesk instances belong to companies. Many are administered by IT teams running Chrome Enterprise with `ExtensionInstallBlocklist: ["*"]` and an allowlist — verified: Chrome Enterprise's `ExtensionSettings` policy lets admins set `installation_mode: blocked` by default, and additionally block extensions **by the permissions they request** via `blocked_permissions`, and restrict them **by host** via `runtime_blocked_hosts`. An agent who wants Zhroma may simply be unable to install it, and their IT ticket will be evaluated in about ninety seconds by someone who has never heard of you.

What makes that ninety seconds go badly: broad host permissions; any API permission that reads like data access; a network call of any kind; a minified blob with no source; a privacy policy that hedges; an anonymous publisher name; a listing that says the extension reads the customer-facing Help Center too.

**How to avoid:**

Everything that makes you cheap to review also makes you cheap to allowlist. There is no tension here.

- **Zero API permissions**, or as close as you can get. `blocked_permissions` can't block what you don't request.
- **`https://*.zendesk.com/agent/*`**, not `*://*.zendesk.com/*`. Being visibly confined to the agent console — and explicitly *not* to customer-facing Help Center pages on the same domain — is the single most persuasive line in an allowlisting conversation.
- **Zero network egress. No exceptions.** No CDN, no font, no analytics, no crash reporter, no "just a version check." A trivially verifiable "makes no requests" claim is worth more than any feature.
- **Public source repository, linked from the listing.** Let the admin diff the CRX against the repo. For an extension this small it is a genuinely feasible audit, and offering it is disproportionately reassuring.
- **Ship readable code.** Unminified, or minified with source maps. This defends against Red Titanium *and* against "we don't allowlist obfuscated bundles."
- **A real publisher name and a working support URL.** Anonymous publishers do not get allowlisted.
- **A one-page privacy policy that says nothing is collected**, in plain language, at a permanent URL.
- **A written "for IT" section** in the listing or the repo README: exact permission list, exact host pattern, statement of no network activity, link to source, statement of what data is read (rendered text already visible to the agent) and what is done with it (nothing — a CSS attribute is written to the same page). This is a half-page document that converts a "no" into a "yes" and almost nobody writes it.
- **A boring release history.** Frequent small updates that never change the permission set build the strongest signal available to an admin.

**Warning signs:**
- The manifest has more than one capability.
- Any `fetch`, `XMLHttpRequest`, `sendBeacon`, `<link rel=stylesheet href=https://…>`, or `@import url(https://…)` in the bundle.
- The build output is a single mangled line.
- The listing does not name a human or an organisation.

**Phase to address:** Phase 5 (Store Packaging), with the permission set fixed in Phase 1.

---

### Pitfall 10: Solo-developer publishing and maintenance traps

**What goes wrong:**

**At registration:**
- One-time **$5** developer registration fee (no renewal).
- **The account email is permanent and cannot be changed.** Use a dedicated Google account you will still control in five years — not a work address you'll lose when you change jobs, and not an address you'd rather not have associated with a public listing.
- **2-Step Verification is mandatory** before you can publish or update anything. Set it up before you need it, with recovery codes stored somewhere you'll find them during a broken-in-production panic.
- The **publisher display name** appears under the extension title on every listing. Decide it deliberately; it's part of the trust story in Pitfall 9.
- The contact email must be verified and is where **all rejection and policy notices land**. Actually read it. The predecessor's 2026 delisting notice almost certainly went to an address nobody had checked since 2019.

**At and after launch:**
- Review takes **days to weeks**, and "new developer" plus "new extension" are both explicitly listed slow-review triggers. Do not couple a launch announcement to a date.
- **Every update is a new review.** Your time-to-repair when Zendesk breaks you has a hard floor set by Google's queue, not by your fix. A one-line selector fix still takes days to reach users. Plan for it: this is the real cost of the DOM-scraping dependency, and it is why Pitfall 1's *detection* speed matters so much — detection latency and review latency add.
- **Permission changes trigger extra scrutiny.** Never bundle a permission change with an urgent hotfix; ship the fix alone. And get the permission set right at v1, because changing it later taxes every future release.
- The maintenance burden is not the code — it's the standing obligation to notice, diagnose, fix, resubmit and wait, for as long as the listing is public, triggered by a vendor you don't control on a schedule you don't know. **Decide now what happens when you stop wanting to do this.** The predecessor's answer was to abandon it while leaving it installed and broken for 87 people, until Google removed it seven years later. Unpublishing deliberately is a more respectful ending than that.

**Warning signs:**
- The developer account uses a work email or a shared address.
- No recovery codes for 2SV.
- Nobody has opened the developer contact inbox in a month.
- A hotfix PR also touches `manifest.json`'s permissions.
- The launch has a date attached.

**Phase to address:** Phase 5 (account setup is a prerequisite to submission — start it early, it has its own latency) and Phase 6 (Post-Launch Maintenance Loop as an explicit, scheduled phase, not a footnote).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Match priority by English text only | Ships in an afternoon | Silent total failure for a large fraction of a global install base; unfixable without a full release cycle; churned users don't come back | **Never for a public `*.zendesk.com` listing.** Acceptable only for a single-tenant internal tool |
| Opaque `background-color` tints | Simplest possible CSS | Breaks hover and selection; unreadable in dark mode; triggers a specificity war | **Never.** The translucent `background-image` alternative is the same effort |
| `nth-child` / hashed-class selectors | Works immediately; DevTools hands them to you | Breaks on any Zendesk rebuild *and* on user column reordering | Only inside a throwaway Phase 0 spike, never in shipped code |
| `observe(document.body, {subtree:true, attributes:true})` | One line; catches everything | CPU burn, self-retrigger risk, scroll jank agents blame on Zendesk | **Never** |
| No telemetry **and** no icon status **and** no report button | Purest privacy story | Permanent blindness; you learn about breakage from 1-star reviews, if ever | Never — the icon/report combination preserves the privacy story at zero cost |
| Ship without a privacy policy because you collect nothing | Saves one hour | This is literally what delisted the predecessor | **Never** |
| Aggressive minification/mangling by bundler default | Smaller bundle (irrelevant at this size) | Red Titanium rejection risk; enterprise allowlisting failure | Never — ship readable |
| Skipping dark-mode verification | Faster to "done" | Actively harmful output for a default-on Zendesk feature, with no user escape hatch in v1 | Never |
| Remotely-fetched selector config to fix breakage without a review cycle | Repair without waiting for Google | Requires a network call → destroys the zero-egress trust story, adds a host permission, risks Blue Argon, breaks the privacy claim, and makes enterprise allowlisting much harder | **Never for this project.** Reconsider only if the extension ever legitimately needs the network for another reason |
| Hard-coded colours with no way to disable | Zero configuration — the actual product thesis | Every colour complaint (contrast, colourblindness, dark mode, taste) is a support burden with no self-service answer | **Acceptable for v1**, and correct — but only if the translucent-tint technique makes the colours theme-safe, so the remaining complaints are about taste rather than legibility |
| Testing on a mock HTML fixture instead of a live Zendesk | No account needed; fast tests | Fixtures encode today's DOM and give false confidence forever; the failure mode you must catch is precisely "the real DOM changed" | Acceptable for unit-testing the *parsing* logic; never as the only pre-release verification |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Zendesk agent-view DOM | Assuming a stable, documented structure | Zendesk publishes **no** DOM contract for the ticket table — no documented `data-test-id` scheme, no stability guarantee. Its supported extensibility path is the ZAF SDK (iframed apps), not DOM access. Treat every selector as unsupported, layer fallbacks, fail closed |
| Zendesk agent-view DOM | Recon on one instance/view/locale/theme | Recon across ≥2 locales (one non-English), both themes, ≥2 views (one with and one without a Priority column), and both UI shells if you can reach them |
| Zendesk localisation | Matching English strings | 40 languages + 4 variants, **selected per agent** independently of the account's supported languages. Prefer a machine-readable signal; fall back to a locale table; never assume English |
| Zendesk dark mode | Treating it as a future feature | Already shipped. Account setting *"activated by default."* Per-agent opt-in including *"match system appearance."* Covers views. Use theme-agnostic translucent tints |
| Zendesk dark mode | Detecting it with `prefers-color-scheme` | Zendesk's toggle is in-app and independent of the OS. Measure the rendered background luminance once instead |
| Zendesk apps (ZAF) | Content script running in every app iframe | Set `"all_frames": false` explicitly; you have no business inside ZAF app frames |
| Zendesk Help Center | `*://*.zendesk.com/*` sweeps in `/hc/` | Scope to `https://*.zendesk.com/agent/*`. The agent console always lives under `/agent/`; Help Centers do not |
| Chrome MV3 manifest | Declaring `host_permissions` alongside `content_scripts.matches` | A static manifest-declared content script does not need `host_permissions`. Declaring it broadens your permission ask for no capability |
| Chrome MV3 | Any remotely-hosted code, including CDN CSS/fonts | Blue Argon. Bundle everything locally. No `@import url(https://…)`, no `<link>` to a CDN |
| Chrome Web Store dashboard | Treating Privacy practices as optional because nothing is collected | Every field is mandatory: single purpose, per-permission justification, host justification, remote-code declaration, data-usage matrix, Limited Use certification. Dashboard, privacy policy and behaviour must all agree |
| Chrome Enterprise | Not knowing admins filter by permission | `ExtensionSettings.blocked_permissions` blocks by requested permission and `runtime_blocked_hosts` by host. Requesting nothing is the only fully robust defence |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Observer scoped to `document.body` with `subtree` | Idle Zendesk tab burning CPU; fans audible; battery drain | Observe the nearest stable ancestor of the ticket table | Immediately on the agent workspace — it mutates constantly even when idle |
| Missing batching/debounce | Callback runs hundreds of times per second during a view load | Set a dirty flag; do one pass per `requestAnimationFrame` | On any view load or refresh; worse as row count grows |
| Self-retriggering observer | Tab freezes; one CPU core pinned at 100% | Don't observe attributes, or `attributeFilter` excluding your own; skip writes when the value is unchanged | Instantly, on the first row you tint |
| Layout thrashing (read/write interleaved) | Scroll feels sticky; rows flash white before tinting; "Forced reflow" warnings in DevTools | Read all rows into an array, then write all attributes. Measure theme luminance **once**, outside the loop | Noticeable around 50–100 rows; ugly at 200 |
| Per-row inline styles | Slow paint; huge DOM diffs; extra mutations feeding your own observer | Write one `data-*` attribute per row; do all colour work in one static stylesheet | ~100+ rows |
| `Set`/`Map` of DOM nodes as processed-markers | Memory climbs across a shift; tab eventually sluggish | `WeakSet`/`WeakMap` only | After a few dozen view switches — hours into a shift, which is exactly when you won't be watching |
| Observer never re-anchored / never disconnected on view change | Detached DOM accumulates; multiple live observers duplicate work | One observer, re-anchored on view change, `takeRecords()` before `disconnect()` | After dozens of view switches |
| Content script running in every ZAF app iframe | Multiplied cost per open ticket tab | `"all_frames": false` | As soon as an agent opens several tickets |

**Budget:** < 2 ms per re-tint pass, < 16 ms worst case, **zero** forced layouts in the hot path, no detached-node growth across 30 view switches. Verify in the DevTools Performance panel (Recalculate Style / Layout attribution, forced-reflow warnings) and via before/after heap snapshots.

---

## Security & Privacy Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `*://*.zendesk.com/*` instead of `https://*.zendesk.com/agent/*` | Grants read access to customer-facing Help Center pages you never touch; worse install warning; harder allowlisting; Purple Potassium surface | Scope to the agent console over HTTPS only |
| Declaring `host_permissions` when `content_scripts.matches` suffices | Broader permission ask for zero capability | Delete the `host_permissions` block |
| Requesting `storage`/`tabs`/`scripting` "for later" | Policy explicitly forbids future-proofing; enterprise `blocked_permissions` filters on it | Request nothing v1 doesn't use |
| Any network call at all, including a CDN font | Destroys the zero-egress claim; MV3 remote-code risk; kills allowlisting; contradicts the privacy policy | Bundle everything. Zero requests, verifiable in the Network panel |
| Obfuscated or heavily-mangled bundle | Red Titanium rejection; enterprise refusal | Ship readable code with source maps; publish the repo |
| Logging ticket subjects, requester names, or IDs to the console | Console logs are shoulder-surfable and screenshot-able; contradicts "ticket data never leaves the browser" in spirit | Log only counts, versions, locale and strategy tiers. **Never log ticket content**, even in a debug build |
| A report-a-bug flow that posts data | Turns "no telemetry" into a lie | `chrome.tabs.create()` to a pre-filled issue URL — the *user* navigates; the extension sends nothing |
| Privacy policy that hedges or is copy-pasted boilerplate | Inconsistency between the policy, the dashboard disclosures and behaviour is itself a violation | Write four honest sentences; make the dashboard checkboxes match exactly |
| Structural DOM edits (wrapping/reparenting rows) | Can break Zendesk's own event handling and bulk-action selection — an integrity risk in an agent's real workflow | Attributes and stylesheets only. Never touch structure |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Tint kills hover and selected states | Agents lose row tracking and can't see what they've bulk-selected — a correctness problem, not a cosmetic one | Translucent `background-image` so `background-color` stays Zendesk's |
| Light tints on dark mode | White-on-white text; unreadable; worse than uninstalled; no escape hatch in v1 | Theme-agnostic translucent tints, alpha tuned by measured luminance |
| One generic "something's wrong" message for all failures | The German agent whose view *does* have a Priority column is told to add one, and chases a non-problem | Three distinct states: no table / no priority column / column found but unreadable |
| Rows flash white then tint on every scroll or refresh | Reads as flicker and lag; the most-cited complaint about extensions like this | Inject the stylesheet at `document_start`; batch attribute writes into one rAF; make repeat passes no-ops |
| All four tints too similar or too loud | Fails the one-second glance test, or gives agents a migraine over an eight-hour shift | Hue separation matters more than saturation. Low alpha, high hue contrast. Verify against a real 200-row view, both themes |
| The hint about the missing Priority column is intrusive | An unclosable banner in a tool someone uses for eight hours is an uninstall | PROJECT.md already says "unobtrusive" — hold that line: dismissible, small, once per view, never modal |
| No visible signal that the extension is alive | Agents can't distinguish "no urgent tickets" from "broken" | The toolbar icon state (Pitfall 1) is a UX feature as much as a diagnostic one |
| Colours that are meaningless to colourblind agents | ~8% of male agents can't distinguish red/green tints | Explicitly deferred in PROJECT.md, which is a legitimate call — but choose the v1 hues so that *lightness* also varies monotonically with priority. Free, and it partially mitigates the gap at no scope cost |

---

## "Looks Done But Isn't" Checklist

- [ ] **Tinting persists** — verify across: sort by any column, Zendesk's own periodic view auto-refresh, manual refresh, switching views, switching agent tabs, browser back/forward, window resize, scrolling to the bottom of a 200-row view and back, and returning to a backgrounded tab after 30 minutes.
- [ ] **Non-English locale** — set a sandbox agent to German *and* Japanese. Tints must appear, or the third failure state must fire with the right message. This is the check most likely to be skipped and most likely to matter.
- [ ] **Dark mode** — enable Zendesk dark mode. Text readable, all four tints distinguishable from each other and from untinted rows.
- [ ] **Row states intact** — hover, hover-while-tinted, select one, select all, unread/bold, keyboard focus ring, drag. In both themes. On every tint colour.
- [ ] **The three failure states are actually distinguishable in the UI**, not just in code.
- [ ] **Toolbar icon reflects state** — tinting / ran-but-matched-nothing / no-table-found.
- [ ] **Zero network requests** — DevTools Network panel filtered to the extension, across a full session. Not "we didn't add any" — verified empty.
- [ ] **No leak** — heap snapshot, 30 view switches, snapshot, compare detached nodes.
- [ ] **Performance budget met** — Performance panel shows no forced reflow attributed to the extension; re-tint pass under budget on a 200-row view.
- [ ] **Not running where it shouldn't** — confirm the content script does not execute on `/hc/` Help Center pages or inside ZAF app iframes.
- [ ] **Manifest is minimal** — no `host_permissions` block, no unused API permissions, `all_frames: false`, match pattern is `https://*.zendesk.com/agent/*`.
- [ ] **Privacy practices tab 100% complete** and consistent with the privacy policy and with actual behaviour.
- [ ] **Privacy policy live** at a permanent URL, linked in the listing.
- [ ] **Listing survives a Zendesk-naive reviewer** — 1280×800 screenshots of a real before/after, 128×128 icon, a description whose first sentence is unambiguous, and an explicit note that the view needs a Priority column.
- [ ] **Bundle is readable** — open the packaged CRX's JS and confirm a human can follow it.
- [ ] **Developer account is durable** — dedicated Google account, 2SV with stored recovery codes, contact inbox someone actually reads.
- [ ] **`SELECTORS.md` exists**, documenting each DOM assumption and its fallback.
- [ ] **Tested against a live Zendesk instance**, not only a captured HTML fixture.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Zendesk changed the DOM; tinting broken | **MEDIUM** — the fix is minutes, the *review latency is days*, and detection latency may be weeks | Reproduce in the sandbox → re-run the Phase 0 recon procedure → update selectors within the existing layered strategy → ship a code-only update with an **unchanged permission set** (reviews fastest) → post a note on the support URL. Detection latency dominates; this is why Pitfall 1 is ranked first |
| Shipped English-only; non-English users report nothing happens | **HIGH** | Requires a full detection rewrite plus a locale table, plus a release cycle, against users who have already uninstalled. Prevention is an order of magnitude cheaper than recovery — this is why it's ranked #2 |
| Dark-mode tints unreadable in the wild | **HIGH in reputation, MEDIUM in code** | The CSS fix is small (switch to translucent). The damage — 1-star reviews naming unreadability — persists on the listing indefinitely. Prevent in Phase 2 |
| Submission rejected (Purple Potassium / Yellow Zinc / Yellow Potassium) | **LOW–MEDIUM** | The listing and any published version are unaffected and users are not notified. Fix the specific issue, resubmit, or use the Appeal button on the item detail page. Cost is schedule, not product |
| Delisted post-launch for a compliance gap | **HIGH** | Installed users keep the extension but it's unlisted and undiscoverable; new installs stop. Fix and appeal. Entirely preventable by completing the privacy policy and disclosures at v1 |
| Broke Zendesk's hover/selection in production | **MEDIUM** | Genuinely harms agents' work. Hotfix immediately; the underlying fix (translucent `background-image`) is small but the release still costs a review cycle |
| Performance complaints / uninstalls for jank | **MEDIUM** | Hard to attribute after the fact because users blame Zendesk. Profile against a 200-row view, fix scope/batching/thrash. Detection is the hard part — treat the Phase 3 budget as a gate, not a target |
| Scope crept; single purpose now indefensible | **HIGH** | Splitting a shipped extension means a new listing with zero install count and zero reviews. Prevent with the one-sentence and permission tests |
| Zendesk moves the table into a **closed** Shadow DOM | **VERY HIGH — potentially terminal** | Closed roots are unreachable from a content script. The remaining options are the ZAF SDK (a different product shape) or discontinuation. Detect early via the Phase 0 shadow probe and re-probe on every maintenance sweep so it isn't a surprise |

---

## Pitfall-to-Phase Mapping

Suggested phases; map onto whatever the roadmap actually names.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Undetected breakage | **Phase 0** (sandbox exists) + **Phase 4** (icon states, three-way failure taxonomy, report button) | Answer "how would I know if this broke last Tuesday?" with a mechanism, not a hope. Manually break a selector and confirm the icon changes and the report link pre-fills correctly |
| 2. Locale-dependent priority reading | **Phase 0** (recon in ≥2 locales — **hard gate**) + **Phase 1** (locale-independent signal, else locale table) | Tints appear on a German and a Japanese Zendesk, or the correct third failure state fires. No English string literal in the source |
| 3. Dark mode vs. hard-coded tints | **Phase 2** (translucent `background-image`; luminance-measured alpha) | Side-by-side light/dark screenshots of a 200-row view; text readable, four tints distinguishable in both |
| 4. Fragile selectors | **Phase 0** (durability-ranked inventory + shadow probe + painting-element probe) + **Phase 1** (layered strategies with tier reporting) | `SELECTORS.md` exists; no hashed classes or `nth-child` in shipped code; column index derived from the header row; forcing a selector failure leaves the page pixel-identical to no extension |
| 5. Store rejection / delisting | **Phase 1** (permission set is fixed here) + **Phase 5** (listing, policy, disclosures) | Manifest has no `host_permissions`, no unused API permissions, pattern is `https://*.zendesk.com/agent/*`. Privacy practices tab complete and consistent. Privacy policy live. Listing legible to a Zendesk-naive reviewer |
| 6. MutationObserver misuse | **Phase 3** | Budget met (< 2 ms typical, < 16 ms worst, zero forced layouts); heap-snapshot leak test passes across 30 view switches; exactly one observer; no `Set`/`Map` of nodes |
| 7. CSS collision | **Phase 2** (with painting element identified in Phase 0) | Interaction-state checklist passes in both themes on all four tints; `!important` count ≤ 1; no `@layer`; no Zendesk class names in the stylesheet |
| 8. Scope creep | **Phase 5** (the single-purpose description is the pinning artifact) + every milestone boundary | The one-sentence description contains no "and"; no feature has been added that requires a new permission |
| 9. Trust / enterprise allowlisting | **Phase 1** (permissions) + **Phase 5** (public source, readable bundle, "for IT" section) | Network panel empty across a full session; repo public and linked; bundle human-readable |
| 10. Solo-dev publishing & maintenance | **Phase 5** (account setup — start early, it has latency) + **Phase 6** (scheduled maintenance loop) | Dedicated account with 2SV and stored recovery codes; a calendar-recurring sandbox check exists; a documented plan for what happens if the project is abandoned |

**Ordering implication for the roadmap:** Phase 0 is not optional and not a formality. Three of the top four pitfalls are decided by what Phase 0 finds — whether a locale-independent priority signal exists, which element actually paints, and whether Shadow DOM is in play. Attempting Phase 1 or 2 before Phase 0 answers those questions means building on assumptions that this research could not verify.

---

## Confidence & Gaps

| Claim area | Confidence | Basis |
|------------|------------|-------|
| Chrome Web Store policies, violation codes, review timelines, rejection/appeal behaviour | **MEDIUM** | Fetched from developer.chrome.com (program-policies, troubleshooting, review-process, cws-dashboard-privacy); several claims cross-checked against a second source. Per the classify-confidence seam, single-fetch first-party claims tier at LOW; cross-checked ones at MEDIUM. Re-verify before submission — policy pages change |
| Zendesk dark mode: shipped, account setting "activated by default", per-agent opt-in, covers views | **MEDIUM** | Two official Zendesk articles. Note the two articles read differently in isolation: the *account-level* setting is activated by default; each *agent* still opts in via Appearance. Both statements are true at different tiers |
| Zendesk agent UI localised into 40 languages + 4 variants, agent-selected independently of account languages | **MEDIUM** | Official Zendesk language-support-by-product article |
| CSS `@layer` precedence (unlayered beats layered for normal declarations; reversed for `!important`) | **MEDIUM** | MDN, and counterintuitive enough that it is worth re-confirming before relying on it |
| MutationObserver hazards and mitigations | **MEDIUM** | MDN plus corroborating sources; standard, well-established practice |
| Prior-art extension data (install counts, ratings, 2026-08-27 delisting, review quotes) | **MEDIUM** | extpose third-party store analytics + Chrome Web Store listing text. Third-party analytics — treat counts as approximate; the delisting reason is a strong signal but not first-party |
| **Zendesk agent-view DOM structure, attributes, painting element, Shadow DOM usage** | **NONE — UNVERIFIED** | **Zendesk publishes no DOM contract for the agent-view ticket table, and none could be recovered from public sources.** This is itself the finding: there is no documented, supported way to do what this project does. Phase 0 must establish it empirically on a live instance |
| Whether `background-image` compositing preserves Zendesk's hover/selected in practice | **MEDIUM** | The CSS behaviour (background-image paints above background-color) is certain. Whether Zendesk's row markup makes it *effective* — i.e. whether the row or the cells paint — is an empirical Phase 0 question |
| Whether the Chrome Web Store offers a reviewer-notes field | **LOW** | The permission-justification free text on the Privacy practices tab is the closest equivalent and is definitely read by reviewers. Verify at submission time |

**Open questions for Phase 0 to close:**
1. Does the priority cell or row carry any locale-independent machine-readable signal? *(Determines whether Pitfall 2 is a one-line fix or a 176-string table.)*
2. Which element actually paints the row background — the row, the cells, or an inner wrapper?
3. Is Shadow DOM in use anywhere in the ticket table? Open or closed? *(Closed would be terminal for this approach.)*
4. Which Zendesk UI shell(s) exist in the wild, and can one capability-probe set handle all of them?
5. Does Zendesk's framework strip unknown `data-*` attributes on re-render? *(Determines whether the safety-net sweep is necessary or merely prudent.)*

---

## Sources

**Chrome Web Store — official (developer.chrome.com):**
- Program policies: Quality guidelines (single purpose), Quality guidelines FAQ, Permissions, User data FAQ, Spam and abuse
- Troubleshooting Chrome Web Store violations (violation code reference)
- Chrome Web Store review process
- Privacy practices tab (`cws-dashboard-privacy`)
- Declare permissions (MV3)
- Register your developer account

**Chrome Enterprise — official:**
- `ExtensionSettings` policy (`blocked_permissions`, `runtime_blocked_hosts`, `installation_mode`)
- `ExtensionInstallAllowlist` / `ExtensionInstallBlocklist`
- Allow or block apps and extensions (Chrome Enterprise and Education Help)

**Zendesk — official (support.zendesk.com):**
- Zendesk language support by product
- Configuring Zendesk Support for your locale and language
- Announcing dark mode for Zendesk Support
- Using dark mode to increase agent display options
- Activating and deactivating dark mode for your account
- Documentation resources for the Zendesk Agent Workspace

**Web platform — MDN:**
- `@layer` (cascade layer precedence)
- `MutationObserver`, `MutationObserver.takeRecords()`, `MutationObserver.disconnect()`
- CSS Specificity

**Prior art:**
- Chrome Web Store listings and reviews: *Zendesk Priority Highlights*, *Zest – The Zendesk Colour Coder*
- extpose.com store analytics for both extensions
- Zendesk community threads: "Colour coding tickets", "Ticket views with added colours?"

---
*Pitfalls research for: public Chrome MV3 extension scraping and restyling a third-party SaaS SPA (Zendesk agent views)*
*Researched: 2026-09-02*
