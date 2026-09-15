# Feature Research

**Domain:** Browser extension that visually augments a third-party support-desk SPA (Zendesk Agent Workspace ticket views)
**Researched:** 2026-09-02
**Confidence:** HIGH on the competitive and Zendesk-native landscape (read directly from live Chrome Web Store listing HTML and official Zendesk documentation); MEDIUM on community sentiment and review-driven complaints (small sample sizes).

---

## Headline Findings (read these before the tables)

**1. The space is thin but NOT empty — and the closest competitor died three weeks ago.**

Two products have occupied this exact niche:

- **Zest — The Zendesk Colour Coder** (`kohidmaedanhmmhkhkbeaonheneldfbi`) — **1,000 users, 5.0/5 from 5 ratings, v1.3, updated 2026-04-15.** Manifest V3, permissions `["storage"]` only, declares no data collection. Alive and maintained. Colour-codes rows by **any** column value, not just priority. **Requires the user to configure each category/colour pair in a popup, and requires a manual page refresh for changes to take effect.**
- **Zendesk Priority Highlights** (`kdnlbgealinpnebnoamnabcpjkifokpk`) — **this is Zhroma's exact v1 spec**: red/orange/yellow/green for Urgent/High/Normal/Low, read from the view. **87 installs, 3.71/5 from 7 votes, last updated 2019-07-21, DELISTED on 2026-08-27** with a flagged policy violation and **no privacy policy**. Chrome Web Store's updated privacy-policy enforcement began **2026-08-01**. It also had reviews from 2019 saying it had stopped working.
- **Boost Focus — Zendesk Highlighter** (`eghahjbmnoekjcehalmfloddcjnnedic`) — ~51 users, now paywalled and effectively abandoned: *"Subscription Required. This tool requires a monthly fee to cover server costs and maintenance. Contact Karan to reactivate access."*

The wider Zendesk extension ecosystem is a graveyard of small single-developer tools: Zendesk Utils (887 users, 4.5/5, last updated 2024-04, *not* colour coding), Zendesk Plus (227 users), Zendesk Enhancer (201 users, 1 rating), Zendesk Dark Mode (849 users but **2.6/5** from 11 ratings, unmaintained since 2022), Zendesk Helper, ZenNotifier, Zendesk Tab Manager.

**Read the story here:** the exact product Zhroma is building already existed, reached only 87 installs, stopped working, and was delisted for a policy hygiene failure. The one that thrived did so by being *more general* (any field, not just priority) — but paid for it with configuration friction. **Zhroma's wedge is not "colour by priority"; it is "colour by priority with zero configuration and no manual refresh."** That is precisely where Zest is weak.

**2. Zendesk does NOT natively tint rows. The premise survives — verified, not assumed.**

Zendesk staff have said so on the record, repeatedly, and it is still unshipped in 2026:

- Zendesk employee (2019-04-03): *"Unfortunately there's not a CSS type of thing you can change."*
- Zendesk PM (2024-03): *"Color coding tickets (or certain sections for the Ticket UI) is something we're looking into but I don't have any timelines or confirmation I can provide yet."*
- Zendesk PM Salvador Vazquez (2024-03): logged to backlog for *"future consideration"*, with an explicit non-commitment.
- Feature requests open since Feb 2021 (11 upvotes), Aug 2021 (8 upvotes), May 2025 (4 upvotes), with comments still arriving in **July 2026**: *"You're staring at a queue and every row looks the same, so you end up reading each one instead of just seeing what needs attention."*

**3. But be honest about what Zendesk gives away free — it is more than nothing.**

| Native capability | What it actually does | Why it does not solve the problem |
|---|---|---|
| Coloured status icon per row | Small coloured dot preceding each ticket, indicating **status** (New/Open/Pending/On-hold/Solved) | Status ≠ priority. Already consumes the row's only native colour affordance. |
| SLA / Group SLA column badge | Badge coloured **green** (>15 min), **amber** (<15 min), **red** (breached) | Badge-level, not row-level; requires an SLA policy; **Professional+ plans only**. Still a small object in one column. |
| View column configuration | Admin can add a Priority column to a view | This is the prerequisite Zhroma depends on, not a solution. Priority renders as plain text with no visual weight. |
| View **Group by** priority | Clusters urgent tickets together under a header | This is the strongest "do nothing" alternative. But it costs the view's only grouping slot and is admin-controlled. |
| View **Order by** priority / column-header sort | Urgent floats to top | Costs the sort slot — competes directly with sorting by requested date or SLA, which agents also need. |
| Agent-side **Filter** button | Agents can filter a view by priority; filters persist until sign-out | Filtering *removes* the other tickets. Scanning a mixed queue is the actual job. |
| Custom fields + triggers as a visual column | DIY indicator column | Heavy admin lift, produces more plain text. |
| **Dark mode** | GA in 2026, all Suite/Support plans, covers views | See finding 5 — this is a constraint on Zhroma, not a competitor. |

**4. No Zendesk Marketplace app can ever do what Zhroma does. This is a structural moat.**

Zendesk Apps Framework v2 sandboxes every marketplace app inside an iframe with **no host DOM access**. A ZAF app physically cannot tint a row in Zendesk's own ticket list. The only paid Marketplace competitor, **Super Views**, works around this by **replacing** the native list with its own iframe-rendered table (1000 tickets/view, multi-column sort, colour coding, CSV export) — a different product, for a different buyer (paid, admin-installed), with a different failure mode. **Browser extension and userstyle are the only two mechanisms that can tint Zendesk's real list.** That narrows the competitive set to Zest and nothing else.

**5. Dark mode is the single biggest gap in the current v1 scope.**

Zendesk Agent Workspace dark mode is **generally available in 2026**, on all Suite plans (Team → Enterprise Plus) and Support plans. The admin toggle (*Admin Center > Workspaces > Agent tools > Agent interface*) is **activated by default**. Agents pick Light / Dark / **Match system appearance** from Profile > Appearance — meaning **the theme can flip mid-session without a page load**. Coverage explicitly includes **views**.

PROJECT.md does not mention dark mode anywhere. A hard-coded light-surface palette will render as either invisible smudges or eye-searing blocks on a dark surface, and the extension will be uninstalled on day one by every agent who uses dark mode. **This is table stakes, not a differentiator.** The evidence that bolting on themes is unforgiving: the third-party "Zendesk Dark Mode" extension has 849 users and a **2.6/5** rating.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and the extension is uninstalled within a day.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Tint rows by priority, all four values** | The entire product. Already in v1 scope. | MEDIUM | Already an Active requirement. Distinct tints for Urgent/High/Normal/Low. |
| **Survive re-render (sort, refresh, view switch, scroll, tab switch)** | Zendesk is an SPA; a load-time-only tint looks broken within seconds. Already in v1 scope. | HIGH | Already an Active requirement. `MutationObserver` scoped to the list container, debounced/batched, never a global `<all_urls>` observer. This is the highest-effort table stake. |
| **⚠️ Dark mode: correct tint on both themes, reacting to a live theme switch** | Dark mode is GA, admin-default-on, covers views, and flips without a page load. **MISSING FROM v1 SCOPE.** | MEDIUM | Detect Zendesk's theme signal (DOM class/attribute or computed background of the list surface) rather than `prefers-color-scheme` alone — Zendesk's "Match system appearance" is only one of three settings. Derive tints from the host surface (e.g. low-alpha overlay) so one hue set works on both, or ship two palettes. Re-evaluate on theme change. |
| **⚠️ On/off toggle that is not "uninstall"** | Every DOM-modifying extension on a work tool needs a kill switch — for screen-sharing, for screenshots to customers, for the day Zendesk ships a change and tinting goes wrong. **MISSING FROM v1 SCOPE.** | LOW | Toolbar popup with one switch. Requires the `storage` permission — see the storage note below. |
| **⚠️ Do not fight the host's own row states (hover, selected, unread/bold, status dot)** | If the tint overrides hover or selection, agents lose their place in a 200-row queue and blame the extension. **MISSING FROM v1 SCOPE.** | MEDIUM | Apply tint at a layer host states can win over (e.g. tint the row background, let Zendesk's hover/selected styles composite on top; avoid `!important` blanket rules). Do not obscure the native status dot — it is the agent's other primary signal. |
| **⚠️ Ticket text stays legible over the tint** | If subject/requester text becomes hard to read, the extension made the job *harder*. **NOT stated in v1 scope.** | LOW | Distinct from the deferred colourblind palette. Just means: keep tints low-saturation/low-alpha so foreground text contrast survives, in both themes. Cheap. |
| **⚠️ Fail silently — never break the page** | Zendesk owns the DOM and can change it without notice. A broken Zendesk costs an agent their day. **In PROJECT.md Context but not an Active requirement.** | MEDIUM | Wrap extraction and application in guards; on any unexpected structure, do nothing and leave the page untouched. Never throw into Zendesk's own error surface. Promote to a requirement. |
| **⚠️ Performance budget — no perceptible slowdown** | A support agent's queue is their workday. Any lag and it goes. **NOT in v1 scope.** | MEDIUM | Batch DOM writes, avoid layout thrash, cap observer work per frame, disconnect the observer when the view is not visible. Set an explicit budget and test on a large view. |
| **Hint when the view has no Priority column** | Turns a silent no-op into a self-service fix. Already in v1 scope. | MEDIUM | Already an Active requirement. **Must distinguish "column genuinely absent" from "extraction failed"** — otherwise the hint lies and tells agents to add a column they already have. See dependency notes. |
| **Privacy policy + narrow, justified permissions** | Chrome Web Store privacy enforcement began **2026-08-01**. The direct competitor was delisted **2026-08-27** for exactly this. Already in v1 scope. | LOW | Already an Active requirement — and now evidenced as existential, not bureaucratic. Host permissions scoped to `*.zendesk.com`, no remote code, explicit "does not collect user data" declaration (Zest ships exactly this). |
| **Works on any `*.zendesk.com` with no setup** | Required for a public listing. Already in v1 scope. | LOW | Already an Active requirement. |

**Storage note (challenges a stated v1 constraint):** PROJECT.md's Out of Scope entry says v1 has *"no options page, no storage, and nothing to configure."* "No options page" and "nothing to configure" are correct and are the wedge. **"No storage" is an over-correction** — it costs you the on/off toggle, which is table stakes. `storage` is not a store-review risk: Zest ships with `["storage"]` as its *only* permission and still declares zero data collection. Recommend: take `storage`, use it for one boolean, keep the promise of zero configuration intact.

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Zero configuration — works the instant it is installed** | **This is the wedge.** Zest requires the agent to type a category name and pick a colour before anything happens. Zhroma should be correct on first paint. | LOW | Already the v1 thesis. Make it the headline of the store listing, not a footnote. |
| **No manual refresh, ever** | Zest's own store copy says *"Refresh your Zendesk page to see the changes take effect."* Zhroma's mutation-driven re-application beats this outright. | — | Falls out of the re-render table stake. Free differentiation; say it explicitly in the listing. |
| **Native-feeling dark mode** | Zest predates GA dark mode; the dedicated dark-mode extension is 2.6/5 and abandoned. Being the tinting extension that *looks right* in dark mode is a real advantage. | MEDIUM | Same work as the table stake — the differentiation is in polish, not scope. |
| **Legend / key** | New agents (and team leads reviewing screenshots) need to know red = Urgent without guessing. Also silently teaches the palette. | LOW | Small, dismissible, mounted once near the view header. Depends on a stable mount point — the same selector-fragility risk as tinting. Strong v1.x candidate. |
| **Counts per priority** | *"7 Urgent, 22 High"* answers a question agents ask constantly, that Zendesk answers only by filtering (which hides everything else). | LOW | Natural pairing with the legend — one component, two jobs. Caveat: only counts *loaded/paginated* rows; must be labelled honestly or it becomes a bug report. |
| **Colourblind-safe palette** | ~8% of men have colour-vision deficiency. Red/orange/yellow/green — the palette the delisted competitor used — collapses Urgent and Low into the same colour under deuteranopia. For a product whose *entire* value is colour, this is closer to table stakes than PROJECT.md admits. | LOW | **Cheapest possible fix: no toggle, no options page — just choose hues that also vary in lightness so the four levels remain distinguishable in greyscale.** Costs nothing at v1 and removes a whole class of one-star reviews. Recommend pulling this in. |
| **Per-view enable/disable** | Some views are already sorted by priority; tinting them is noise. Team leads want it on triage views, off elsewhere. | MEDIUM | Requires `storage` + stable view identity (view ID is in the URL) + the on/off toggle. v1.x. |
| **Tint by SLA-breach risk instead of raw priority** | The strongest v2 idea. Zendesk already colours the SLA *badge* — proving Zendesk agrees the signal matters — but only at badge scale and only on Professional+. Community threads explicitly ask to *"highlight overdue tickets."* | HIGH | Needs a second extraction path (SLA column), plan-dependent availability, and a **mode selector** because it conflicts with priority tinting for the row background. Defer past v1, correctly. |
| **Hover tooltip showing priority** | Marginal — the tint already says it, and the Priority column is on screen by definition. | LOW | Low value. Only worth it if the legend proves people can't learn the palette. |
| **Graceful, honest degradation messaging** | Zendesk *will* change its DOM. The competitor that died had reviews saying "it stopped working." An extension that says *"Zhroma couldn't read this view"* instead of silently doing nothing keeps trust and converts a one-star review into a bug report. | MEDIUM | Depends on distinguishing failure modes (see dependencies). This is reputation insurance for a product whose standing risk is selector fragility. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Reading, storing or transmitting ticket content** | "Cache priorities", "sync settings", "count tickets across sessions" | Ticket bodies are customer PII on a support tool. Any collection triggers Chrome Web Store's Limited Use policy (enforced since 2026-08-01), requires disclosure, and makes every enterprise IT team block the extension. | Read priority from the DOM, act on it, keep nothing. Declare "does not collect user data" — the same declaration Zest carries. |
| **Any write-back to Zendesk** (bulk-set priority, quick actions, macros) | "While I can see it's urgent, let me fix it" | Turns a cosmetic read-only extension into something that can corrupt a customer's ticket data. Catastrophic blast radius, needs write permissions, needs auth, kills the "does not modify functionality" claim that Zest leans on. | Stay strictly read-only and say so in the listing. Read-only is a *feature* for the IT team approving the install. |
| **API token / OAuth / any credential** | "Then it works even without a Priority column" | Already correctly rejected in PROJECT.md. Adds an auth flow before first value (destroying zero-config), a heavier permissions ask, a privacy policy with teeth, and a support burden. The gap it closes is one the agent can fix themselves in 30 seconds. | The hint. Already the chosen design — hold this line. |
| **Growing into a Zendesk "power tools" suite** (auto-refresh, tab management, notifications, pinning, copy-ticket-ID) | Every adjacent extension does one of these; it feels like easy growth | Violates Chrome Web Store **single purpose** policy, forces a permissions expansion (`tabs`, `notifications`, `scripting`), invalidates the privacy declaration, and puts you head-to-head with Zendesk Plus and Zendesk Utils — who are already there and still under 1,000 users. The niche does not reward breadth. | Stay a colour extension. Depth on tinting (SLA mode, palettes, per-view) beats breadth. |
| **A full dark theme for Zendesk** | Historically the top Zendesk extension request | **Zendesk shipped it natively and it is on by default.** The third-party attempt sits at 2.6/5, unmaintained since 2022, and demanded `identity` + `googleapis` + the user's email for a *cosmetic* feature. Dead category. | Support Zendesk's dark mode. Do not compete with it. |
| **Filtering / sorting / search inside the extension** (incl. keyboard-driven filtering) | "Show me only Urgent, fast" | Zendesk already gives agents a Filter button, column-header sort and persistent filters on every Suite/Support plan. Duplicating it means far more invasive DOM surgery (hiding/reordering rows), which breaks pagination, selection and Zendesk's own counts — the exact class of change that gets an extension blamed for breaking the page. | Point at Zendesk's native filter. Counts-per-priority gives the same *information* with none of the risk. |
| **Telemetry or analytics, even anonymous** | "How would we know if it works?" | Any network call breaks the "nothing leaves the browser" promise, forces a real privacy policy with data categories, and is exactly the surface the 2026-08-01 enforcement targets. For a free extension there is no payoff. | Chrome Web Store install/uninstall counts and reviews. That is the feedback channel. |
| **Auto-refreshing views** | "So I see new urgent tickets appear" | Occupied by three existing extensions, changes Zendesk's behaviour (not just its appearance), and can cause an agent to lose in-progress state. | Out of scope. Users who want it already have Zendesk Utils. |
| **Broad host permissions (`<all_urls>`)** | Convenience during development | ZenNotifier ships `<all_urls>` for a Zendesk tool — a red flag to reviewers and IT. Guarantees the scariest possible install warning. | `*://*.zendesk.com/agent/*` — narrower than `*.zendesk.com/*`, and it is what both Zest-class competitors and Zendesk Utils use. |
| **An options page in v1** | "Users will want their own colours" | Zest's 1,000 users came *despite* configuration, not because of it. An options page is a decision the user must make before getting value — it dissolves the only real differentiator Zhroma has. | Hard-coded, well-chosen palette. Revisit only if reviews demand it. |
| **Replacing the ticket list with your own rendering** | "Then the DOM can't break us, and we could show 1000 rows" | This is Super Views' approach and it requires the API, an admin install, and a paid model. It is a different product with a different buyer. | Tint the list Zendesk renders. Fragility is the price of the zero-config, agent-installable model. |
| **Desktop notifications / sounds for urgent tickets** | "Alert me when something urgent lands" | Needs `notifications` + polling + background work, breaks single purpose, and is the fastest route to an annoyed agent disabling the extension. | Out of scope. |

---

## Feature Dependencies

```
[Priority extraction from rendered Priority column]
    ├──required by──> [Row tinting]
    ├──required by──> [Counts per priority]
    ├──required by──> [Legend]
    └──required by──> [No-Priority-column hint]

[Re-application on DOM mutation]
    └──required by──> [Row tinting]  (without it, tinting is cosmetically broken in seconds)
    └──required by──> [Counts per priority]  (counts go stale on sort/scroll)

[Theme detection: Zendesk light vs dark, live]
    └──required by──> [Row tinting]        (wrong palette = illegible or garish)
    └──required by──> [Legend]             (swatches must match the applied tints)

[storage permission]
    ├──required by──> [On/off toggle]
    ├──required by──> [Per-view enable/disable]
    └──required by──> [User-configurable colours (v2)]

[On/off toggle] ──required by──> [Per-view enable/disable]

[Failure-mode discrimination: "column absent" vs "extraction failed"]
    ├──required by──> [No-Priority-column hint]  (or the hint lies)
    └──required by──> [Graceful degradation messaging]

[Legend] ──enhances──> [Row tinting]
[Counts per priority] ──shares a component with──> [Legend]

[SLA-risk tinting] ──CONFLICTS with──> [Priority tinting]
[Full-row tint]    ──CONFLICTS with──> [Host hover / selected-row / unread styling]
[Full-row tint]    ──CONFLICTS with──> [Zest, if both installed]
```

### Dependency Notes

- **Everything requires priority extraction.** It is the single root dependency, and the single point of failure. Build it as an isolated, individually testable module with a fixture set of captured view markup (light and dark), so a Zendesk DOM change is a one-file fix rather than an archaeology project.
- **Row tinting requires theme detection, not just mutation handling.** These are two independent inputs to the same output. Treating dark mode as a later "polish pass" means the palette gets designed against light surfaces and then has to be redesigned. Decide the palette strategy (two palettes vs. one alpha-overlay set composited on the host surface) *before* picking hues.
- **The hint requires failure-mode discrimination.** "I found the table but there is no Priority column" and "I could not find the table at all" must produce different behaviour. If they collapse, agents with a Priority column get told to add one — which reads as "this extension is broken", exactly the review the delisted competitor collected. If you cannot distinguish them reliably, the hint should stay silent on the ambiguous case.
- **Full-row tint conflicts with the host's row states.** Zendesk's hover, selected-row and status-dot styling are load-bearing for navigation. The tint must sit at a specificity/layer where those still win. This constrains *how* the tint is applied, not whether — decide it at design time, not by adding `!important` when it looks wrong.
- **SLA tinting conflicts with priority tinting** for the same pixels. If SLA mode ever ships, it needs a mode selector — which needs storage and an options surface. That chain is why it is correctly a v2 item.
- **The on/off toggle unlocks the per-view feature for nearly free.** Both need `storage` and a popup. Building the toggle in v1 makes per-view a v1.x afternoon rather than a new subsystem.

---

## MVP Definition

### Launch With (v1)

- [x] **Tint rows by priority, all four values** — the product.
- [x] **Priority read from the rendered Priority column** — keeps permissions narrow, no auth.
- [x] **Re-application on DOM mutation (sort, refresh, view switch, scroll, tabs)** — without it the product is visibly broken.
- [x] **Hint when the view has no Priority column** — converts silent failure into a self-service fix.
- [x] **Works on any `*.zendesk.com` agent view with zero configuration** — the wedge against Zest.
- [x] **Published listing with privacy policy and minimal permissions** — the direct competitor was delisted for missing this on 2026-08-27.
- [ ] **➕ Dark-mode-correct palette, reacting to live theme change** — *add to v1.* Dark mode is GA and admin-default-on; shipping without it means a broken-looking product for a large share of installs.
- [ ] **➕ On/off toggle in the toolbar popup** — *add to v1.* Costs one boolean and the `storage` permission; without it, "disable" means "uninstall".
- [ ] **➕ Tint layered so host hover / selected-row / unread styling still wins** — *add to v1.* A design constraint on the tinting approach, not a separate feature.
- [ ] **➕ Fail-silent guarantee as an explicit, tested requirement** — *promote from Context to Active.*
- [ ] **➕ Stated performance budget, verified on a large view** — *add to v1.*
- [ ] **➕ Palette that varies in lightness as well as hue** — *pull forward from the deferred accessibility item.* Zero cost at design time; removes the deuteranopia failure where Urgent-red and Low-green become indistinguishable.

### Add After Validation (v1.x)

- [ ] **Legend / key** — trigger: any review or support message asking what a colour means.
- [ ] **Counts per priority** — trigger: ships with the legend; same component.
- [ ] **Per-view enable/disable** — trigger: users report tinting is noise on views already sorted by priority.
- [ ] **Graceful degradation messaging** — trigger: the first Zendesk DOM change that breaks extraction. Build the hooks in v1 even if the messaging ships later.

### Future Consideration (v2+)

- [ ] **User-configurable colours** — defer. **Confirmed correct.** Zest proves configuration is the friction, not the draw. Needs storage + options UI + migration story.
- [ ] **Alternative treatments (left-edge stripe, coloured pill)** — defer. **Confirmed, with one caveat** (see below).
- [ ] **SLA-breach-risk tinting** — defer. Strongest v2 differentiator; needs a second extraction path, plan-awareness, and a mode selector.
- [ ] **Open ticket page, tab strip, search results, org/user lists** — defer. **Confirmed correct**; list-scanning pain is in views.
- [ ] **Firefox / Edge / Safari** — defer. **Confirmed correct.**
- [ ] **Zendesk API for priority** — **do not build.** Confirmed as a permanent anti-feature, not a deferral.

### Verdict on the Stated Deferrals

| Deferral | Verdict | Reasoning |
|---|---|---|
| User-configurable colours → v2 | **Confirm — strongly** | Zest's configuration requirement is the gap Zhroma exploits. Adding config in v1 forfeits the only differentiator. |
| Alternative treatments → v2 | **Confirm, with a caveat** | Full-row tint is the right call for the glance test. **But it is also the treatment most likely to collide with dark mode and with host hover/selected styling.** A left-edge stripe is cheaper and safer on both counts. Do not change v1 — but architect the tint behind a single "apply treatment to row" seam so that if dark mode or host-state collisions prove intractable, switching to a stripe is a contained change rather than a rewrite. |
| Colourblind-safe palette → deferred | **Challenge — partially pull forward** | The *audit and toggle* can wait. The *hue choice* cannot: for a product whose entire value is colour, shipping red/orange/yellow/green (the palette the delisted competitor used) makes it useless to ~8% of male agents. Varying lightness across the four levels costs nothing now and is expensive to retrofit once users have learned the palette. |
| Zendesk API for priority → rejected | **Confirm — strongly** | Would destroy zero-config, expand permissions, and complicate the privacy story that just got a competitor delisted. |
| Colour by anything other than priority → out of scope | **Confirm for v1** | Zest's "any field" generality is what forced its configuration friction. Staying priority-only is what buys zero-config. |
| Chrome only → v1 | **Confirm** | No evidence of Firefox demand in this niche. |
| Views only (not ticket page/tabs) → v1 | **Confirm** | Every community complaint is about scanning a queue. |

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Tint rows by priority (4 values) | HIGH | MEDIUM | **P1** |
| Survive DOM re-render | HIGH | HIGH | **P1** |
| Dark-mode-correct palette + live theme reaction | HIGH | MEDIUM | **P1** *(currently missing)* |
| Zero configuration / works on install | HIGH | LOW | **P1** |
| Privacy policy + narrow permissions | HIGH *(existential)* | LOW | **P1** |
| Fail silently, never break the page | HIGH | MEDIUM | **P1** |
| On/off toggle | MEDIUM | LOW | **P1** *(currently missing)* |
| Don't fight host hover/selected/unread | MEDIUM | MEDIUM | **P1** *(currently missing)* |
| Text legibility over tint | MEDIUM | LOW | **P1** *(currently missing)* |
| Performance budget | MEDIUM | MEDIUM | **P1** *(currently missing)* |
| Lightness-varying (CVD-tolerant) palette | MEDIUM | LOW | **P1** *(recommend pulling forward)* |
| Hint when no Priority column | MEDIUM | MEDIUM | **P1** |
| Legend / key | MEDIUM | LOW | P2 |
| Counts per priority | MEDIUM | LOW | P2 |
| Per-view enable/disable | MEDIUM | MEDIUM | P2 |
| Graceful degradation messaging | MEDIUM | MEDIUM | P2 |
| SLA-breach-risk tinting | HIGH | HIGH | P3 |
| User-configurable colours | MEDIUM | MEDIUM | P3 |
| Left-edge stripe / pill treatments | LOW | MEDIUM | P3 |
| Hover tooltip | LOW | LOW | P3 |

---

## Competitor Feature Analysis

| Feature | Zest (1,000 users, live) | Zendesk Priority Highlights (delisted 2026-08-27) | Super Views (paid ZAF app) | Zendesk native | **Zhroma** |
|---------|---|---|---|---|---|
| Colour source | Any column value, user-defined | Priority only, fixed red/orange/yellow/green | Own rules, inside its own list | — | Priority only, fixed palette |
| Setup required | Type a category, pick a colour, per category | Options page to pick which priorities | Admin installs the app, paid | — | **None** |
| Applies without refresh | **No** — store copy says "Refresh your Zendesk page" | Unknown; reviews said it stopped working | N/A (own render) | — | **Yes** — mutation-driven |
| Dark mode aware | Predates GA dark mode; unlikely | No (2019) | Its own UI | Native, GA, default-on | **Yes** |
| Row-level colour on Zendesk's real list | Yes | Yes | No — replaces the list | **No** | **Yes** |
| Permissions | `storage` only, MV3, no data collection | Unknown; **no privacy policy** → delisted | ZAF iframe, no host DOM access | — | `storage` + `*.zendesk.com/agent/*` |
| Price | Free | Free | Paid | Included | **Free** |
| Maintained | Yes (2026-04) | No (2019) | Yes | Yes | — |
| Legend / counts | No | No | Column-based | — | v1.x opportunity |

**Positioning statement this supports:** *"Zest colours anything, once you tell it what. Zhroma colours priority, correctly, the moment you install it — and it keeps up when Zendesk re-renders, in dark mode and light."*

---

## Sources

**Chrome Web Store — read directly from live listing HTML (includes embedded manifests). Confidence: HIGH.**
- Zest — The Zendesk Colour Coder: https://chromewebstore.google.com/detail/zest-the-zendesk-colour-c/kohidmaedanhmmhkhkbeaonheneldfbi
- Zendesk Utils: https://chromewebstore.google.com/detail/zendesk-utils/mdcmhkfioihfkfggfpiibohmkmnpanjh
- Zendesk Enhancer: https://chromewebstore.google.com/detail/zendesk-enhancer/ldfmooebdhnddkbjknljafcignoflkmg
- Zendesk Priority Highlights (now delisted): https://chromewebstore.google.com/detail/zendesk-priority-highligh/kdnlbgealinpnebnoamnabcpjkifokpk

**Extension analytics (install history, delisting date, review text). Confidence: MEDIUM — third-party tracker.**
- Zest on Extpose: https://extpose.com/ext/200580/en
- Zendesk Priority Highlights on Extpose: https://extpose.com/ext/65981

**Zendesk official documentation. Confidence: HIGH — primary source.**
- Using dark mode to increase agent display options: https://support.zendesk.com/hc/en-us/articles/9011095783322-Using-dark-mode-to-increase-agent-display-options
- Activating and deactivating dark mode: https://support.zendesk.com/hc/en-us/articles/9235063674138-Activating-and-deactivating-dark-mode-for-your-account
- Viewing and understanding SLA targets: https://support.zendesk.com/hc/en-us/articles/4408832852122-Viewing-and-understanding-SLA-targets
- Accessing your views of tickets: https://support.zendesk.com/hc/en-us/articles/4408829483930-Accessing-your-views-of-tickets
- Sorting and filtering tickets in a view: https://support.zendesk.com/hc/en-us/articles/5430058226330-Sorting-and-filtering-tickets-in-a-view-to-refine-results
- Zendesk Apps Framework (iframe sandboxing, no DOM access): https://developer.zendesk.com/documentation/apps/app-developer-guide/using-the-apps-framework/

**Zendesk community — feature requests and staff responses. Confidence: HIGH for quoted staff statements, MEDIUM for aggregate sentiment.**
- Colour coding tickets (8 upvotes, Zendesk PM response Mar 2024, active to Jul 2026): https://community.zendesk.com/ideas/colour-coding-tickets-4601
- Ticket views with added colours? (11 upvotes, Zendesk PM response Mar 2024): https://community.zendesk.com/fid-0/tid-5012
- Looking for a way to track high-priority tickets visually (Zendesk staff: no CSS customisation possible): https://community.zendesk.com/support-7/looking-for-a-way-to-track-high-priority-tickets-visually-in-the-zd-support-agent-15921
- Ability to customize the color of fields in a ticket view (4 upvotes, logged for PM review May 2025): https://community.zendesk.com/fid-0/tid-1965

**Chrome Web Store policy. Confidence: HIGH — primary source.**
- Chrome Web Store policy updates: enhancing user privacy and platform integrity (enforcement from 2026-08-01): https://developer.chrome.com/blog/cws-policy-updates-2026
- Limited Use policy: https://developer.chrome.com/docs/webstore/program-policies/limited-use

---
*Feature research for: Chrome extension colour-coding Zendesk agent-view ticket rows by priority*
*Researched: 2026-09-02*
