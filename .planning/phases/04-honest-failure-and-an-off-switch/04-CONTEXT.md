# Phase 4: Honest Failure and an Off Switch - Context

**Gathered:** 2026-09-09
**Status:** Ready for planning
**Decision authority:** Four decisions below (D-01 through D-04) are explicit user selections made during this discussion. Three further gray areas were offered and **not** selected — they are recorded in `<deferred>` as unresolved, bounded by invariants. They are **not** delegated defaults; no prior "sensible defaults are fine" delegation covers them.

<domain>
## Phase Boundary

Make the extension honest about what it is doing and give the agent a way to switch it off. Three distinguishable states surfaced on the toolbar icon; a popup that explains the actual state; an add-a-Priority-column hint that fires only when that diagnosis is certain; and a default-on toggle that clears tints from the current view without a refresh, restores them on re-enable, and survives a browser restart.

Covers FAIL-01, FAIL-02, FAIL-03, FAIL-05, CTRL-02, CTRL-03 and CTRL-04. Ongoing liveness and fail-quiet page cleanup (FAIL-04) remain Phase 3. Public store publication remains Phase 5. Configurable colours, alternative treatments, dark mode and additional locales remain v2.

**Dependency status — carry this forward, do not soften it.** Phase 3 is 3/4 plans with independent verification `human_needed` (28/34 truths; nine canonical live checks untested after the user skipped UAT; LIVE-05 and FAIL-04 lack human evidence). `03-HANDOFF.md` authorizes Phase 4 planning from the verified source baseline but states planning must not claim the Phase 3 dependency fully accepted. Do not restart UAT or profiling prompts unless the user asks.

</domain>

<decisions>
## Implementation Decisions

### Missing-Column Certainty — User-Selected

- **D-01:** "This view has no Priority column" may be claimed only when **all three** hold: the candidate table has a well-formed header row (non-zero header cells, all passing the existing malformed-cell check) with no cell whose trimmed text is exactly `Priority`; **and** at least one ticket row is present whose cell count matches the header count, proving the table is genuinely rendered rather than mid-mount; **and** no interpretation-affecting mutation has landed for a settle period. Until all three hold, the state is neutral — never a missing-column claim. Accepting a brief neutral state on views that genuinely lack the column is the deliberate trade for never accusing wrongly.

  Today `inspectCandidateTable` returns `waiting` for seven distinct situations — absent table, absent `thead`/`tbody`, empty header row, zero header cells, headers present with no `Priority` cell, rows with fewer cells than headers, and zero entries. Only the fifth is a missing column. The state model must separate that case out; `waiting` must never be treated as proof of a missing column.

- **D-02:** A Priority column that is present and unambiguous but whose every readable cell is empty (today's `blank` state) reports as **working** on the toolbar. The popup adds one honest line to the effect that a Priority column was found but these tickets have no priority values set, so an agent looking at a colourless list gets an answer instead of assuming breakage. This keeps the toolbar at exactly the three states FAIL-01 commits to and puts the nuance where there is room for it. It never reads as a missing column (Phase 2 D-05).

  Phase 1 evidence makes this a realistic case, not an edge case: the observed ungrouped live view had 7 readable priorities against 23 empty-or-unreadable cells, and the grouped-long view 6 against 24.

- **D-03:** The add-a-Priority-column hint appears in the **popup only**. The distinct toolbar icon state is the entire in-toolbar signal — FAIL-05 already requires that state to look different — and no hint, banner, badge overlay or other diagnostic UI is written into the Zendesk page. This reconciles PROJECT.md's "unobtrusive hint" (which does not say where) with ROADMAP Phase 4 success criterion 1 ("opening the popup tells the agent to add the column"), and preserves FAIL-04, Phase 2 D-06 and Phase 3 D-06 with no exception carved out. Record the reconciliation so the ambiguity does not resurface. — **Reversibility:** costly — undoing it means amending FAIL-04's "page left visually untouched", re-opening the no-page-diagnostic-UI decisions in both Phase 2 and Phase 3, and adding a DOM-construction path to a runtime whose contract test currently asserts the shipped source contains no `createElement`, `innerHTML`, `insertAdjacentHTML` or `.style` write at all.

- **D-04:** Structural unreadability and unsupported locale **share** the third toolbar state ("cannot read this view"), preserving FAIL-01's three-state commitment. The **popup wording branches on the actual evidence**: it names the interface language only when `document.documentElement.lang` genuinely is not `en`, and otherwise says it cannot read this view's ticket table. An English agent whose view broke structurally is never told their language is unsupported, and neither branch ever produces a missing-column claim (FAIL-03).

  The structural family includes everything today's `unsafe` covers besides locale: more than one candidate table, nested or ancestor tables, foreign children of the table element, more than one `thead`/`tbody`/header row, malformed header or body cells, two headers reading `Priority`, a non-empty unrecognised priority value, and anomalous group-row topology. The locale family is `document.documentElement.lang !== 'en'` and the non-top-frame guard.

### Carried-Forward Constraints — Not Reopened

- **D-05:** The permission surface stays frozen at `"permissions": ["storage"]`, no `host_permissions` block, and `matches` of exactly `https://*.zendesk.com/agent/*`. Adding the `action` manifest key, icon assets, a popup document and (if needed for per-tab icon state) a service worker introduces **no new permission entry** — `chrome.action` and `chrome.runtime` messaging require none. Any plan that would add a permission entry is out of bounds and must stop for the user.
- **D-06:** Persist exactly one boolean. No ticket content is persisted, transmitted or logged. No network calls, no telemetry, no remote code, no build step or bundler — shipped bytes equal repository bytes and the source stays unminified.
- **D-07:** The product palette stays entirely in `extension/zhroma.css`, driven by the single `data-zhroma-priority` attribute. Shipped extension JavaScript contains no colour values and writes no CSS. Phase 4 adds no new tint, no fifth colour and no alternative treatment.
- **D-08:** The English boundary holds: `html[lang="en"]` shell, exact trimmed labels `Priority`, `Urgent`, `High`, `Normal`, `Low`. Phase 1 established that **no locale-independent priority signal exists** in the observed DOM, so the unsupported-language state is a permanent v1 property, not a gap to engineer around.
- **D-09:** Retain mutation-driven discovery. No SPA route hooks, no history patching, no `webNavigation`, no navigation permissions. Unsupported states preserve native page behaviour.
- **D-10:** A persistent user-off state must remain distinct from the existing temporary hidden/`pagehide` pause, so a tab switch, background/foreground cycle or bfcache restore can never silently undo or override the user's stored preference in either direction.
- **D-11:** The popup stays a status panel plus one switch. "Any options page beyond the on/off toggle" is explicitly out of scope, and zero-config on install is the product's wedge.

### Claude's Discretion

- The internal state model and naming that replaces today's `safe` / `waiting` / `unsafe` / `blank` return values, and how the settle window is implemented, as long as D-01's three conditions are what gate the missing-column claim.
- The settle-window duration. No user constraint was given; choose and justify it against the existing measured budget rather than asking. Note the existing runtime-contract test asserts timers drain to zero (`expect(vi.getTimerCount()).toBe(0)`) — a settle timer must satisfy that, and must not become a resetting loop against the page.
- The messaging seam between content script, popup and any service worker; module and file organisation; test organisation. Constrained by D-05, D-06 and the no-build rule.
- Exact popup copy, within D-02's, D-03's and D-04's required distinctions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.** No new external specification was supplied during this discussion.

### Scope and Acceptance
- `.planning/ROADMAP.md` — Phase 4 goal, seven requirements, four success criteria, the three-state commitment, the frozen-permission note, the route-detection anti-requirement, and the dark-mode/palette v1 exclusion for which CTRL-02 is the accepted mitigation.
- `.planning/REQUIREMENTS.md` — FAIL-01/02/03/05 and CTRL-02/03/04 wording, FAIL-04's page-untouched guarantee (Phase 3), and the v1/v2 exclusion tables.
- `.planning/PROJECT.md` — Glance test, zero-configuration promise, privacy and zero-network boundary, and the "unobtrusive hint" wording that D-03 reconciles.

### Phase 3 Baseline and Its Limits
- `.planning/phases/03-the-tint-survives-everything/03-HANDOFF.md` — Verified baseline (runtime SHA-256, 403 passing tests), the six unverified goal truths, the nine untested live checks, the explicit Phase 4 planning inputs, and the source seams called out for this phase.
- `.planning/phases/03-the-tint-survives-everything/03-VERIFICATION.md` — Independent 28/34 `human_needed` verdict and per-requirement tracing.
- `.planning/phases/03-the-tint-survives-everything/03-LIVE-ACCEPTANCE.md` — The eleven source-bound live passes, the nine pending checks and the recorded UAT skip.
- `.planning/phases/03-the-tint-survives-everything/03-CONTEXT.md` — Transition appearance, automatic recovery, cleanup ownership and long-session decisions this phase must not contradict.

### Earlier Phase Decisions
- `.planning/phases/02-first-tint-on-a-real-view/02-CONTEXT.md` — Settled palette, the blank-versus-unknown rule (D-05, D-06), the permission contract (D-09), and the explicit statement that Phase 4 owns the three-state user-facing failure behaviour.
- `.planning/phases/01-dom-recon-spike/01-CONTEXT.md` — User-controlled authenticated interaction protocol and confidential-evidence handling, required for any live check in this phase.
- `.planning/phases/01-dom-recon-spike/01-RISK-ACCEPTANCE.md` — AR-01-13; historical package-approval independence remains an accepted exception, not a verified fact.

### Evidence and Existing Contracts
- `SELECTORS.md` — In particular the `english-language-signal` entry (`html[lang="en"]` is the observed shell signal; if absent or non-English, return unsupported/unreadable rather than interpreting English labels) and the entry recording that **no locale-independent Priority signal exists**. Both are load-bearing for FAIL-03 and D-04.
- `test/fixtures/manifest.json` — Admitted fixture provenance, scenario matrix and checksums; the three-fixture corpus is asserted by the runtime contract test.
- `DEPENDENCY-APPROVALS.md` — Exact-version dependency approvals. Any new package needs its own approval; nothing in this discussion authorizes one.

### Earlier Research — Reconcile Against Current Evidence
- `.planning/research/ARCHITECTURE.md` — Observer and lifecycle hypotheses; current admitted evidence takes precedence over the original sketches.
- `.planning/research/PITFALLS.md` — Failure cleanup, observer feedback and performance-budget gates.
- `.planning/research/STACK.md` — MV3 manifest field guidance, including its "omit `background`" and "omit `action`" recommendations, both of which Phase 4 necessarily revisits for FAIL-05. Treat as a starting point, not a locked decision.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extension/content.js` — `inspectCandidateTable` already validates the English shell, top-frame placement, single-candidate-table ownership, same-table header resolution, exact-label parsing, malformed-cell rejection and group-row exclusion. Its four return states are the raw material for the three-way product diagnosis; the diagnosis is a new layer over it, not a rewrite of it.
- `extension/content.js` — the controller already has fresh reconciliation, a single non-resetting reconcile timer, owned/copied marker tracking (`ownedRows`, `expectedMarkers`, `adoptCopiedMarkers`), rollback-on-failed-write in `commitSnapshot`, self-write suppression in `mutationsAffectInterpretation`, and `pauseController`/`resumeController` bound to `visibilitychange`, `pagehide` and `pageshow`. The off-switch reuses this teardown; it does not need a second cleanup mechanism.
- `test/extension/runtime-contract.test.js`, `test/extension/persistent-tint.test.js`, `test/extension/initial-tint.test.js`, `test/extension/live-acceptance.test.js`, `test/extension/phase-03-live-acceptance.test.js` — existing runtime and acceptance regression seams.
- `test/fixtures/zendesk-view-priority-present.html`, `zendesk-view-priority-absent.html`, `zendesk-view-grouped-long.html` — the admitted offline corpus. The Priority-absent fixture is the direct D-01 test vehicle. Do not overwrite admitted fixtures; add clearly labelled synthetic cases separately.

### Established Patterns
- The shipped extension currently makes **zero** `chrome.*` calls. `runtime-contract.test.js` actively asserts this: `chrome.storage` is a throwing Proxy and `forbiddenCalls` must stay empty across every mode. Phase 4 necessarily introduces `chrome.storage` and runtime messaging, so those sentinels must be **narrowed deliberately** — permitting exactly the one boolean and the state message while still failing on `fetch`, `XHR`, `WebSocket`, `EventSource`, workers, `sendBeacon`, `localStorage`/`sessionStorage`/`indexedDB`/`caches` and console output.
- The same test asserts `readdirSync(extension/).sort()` equals exactly `['content.js', 'manifest.json', 'zhroma.css']`, and asserts the manifest deep-equals its current object. Both **will** fail the moment a popup document, icons or a service worker are added. Update them as an intentional contract change that still pins the permission surface, the match pattern, `world: "ISOLATED"` and `all_frames: false`.
- The same test also asserts the shipped source matches no `#hex`/`rgb()`/`hsl()`, no `getBoundingClientRect`/`offsetHeight`/`offsetWidth`/`getComputedStyle`, and no `createElement`/`innerHTML`/`cssText`/`adoptedStyleSheets`. D-03 keeps all of these true for `content.js`; a popup document is a separate asset with its own boundary and must not become a loophole for putting palette values back into JavaScript (D-07).
- `vitest.config.js` scopes test discovery deliberately; new Phase 4 tests need explicit inclusion.
- `package.json` pins `happy-dom` 20.13.1 and `vitest` 4.1.11 as the only devDependencies. Popup and service-worker testing must work within those or raise a dependency-approval request.

### Integration Points
- `extension/manifest.json` — needs an `action` key (popup + default icon) and an `icons` block; per-tab icon state additionally needs a background service worker, since `chrome.action` is unavailable to content scripts. Neither adds a permission entry (D-05).
- `extension/content.js` — becomes the producer of the product diagnosis and the consumer of the stored boolean. The user-off path routes through the existing `pauseController` teardown while staying distinguishable from the visibility pause (D-10).
- New popup document and any service worker are the first extension surfaces beyond the content script; keep developer-only tooling under `scripts/` out of shipped assets, as in prior phases.
- Live visual confirmation of icon states, popup wording and the toggle remains separate evidence from offline tests, under the Phase 1 authenticated-interaction protocol.

</code_context>

<specifics>
## Specific Ideas

- The user selected exactly one of four offered gray areas and then chose to write context rather than continue. Treat the four captured decisions as firm and the rest as genuinely open — do not manufacture agreement.
- Two of the four decisions (D-02, D-04) resolve by pushing nuance into the popup rather than onto the toolbar. The popup consequently carries the honesty burden and needs at least five distinct messages: working, working-but-no-values-set, no-Priority-column, interface-language-not-supported, and cannot-read-this-view. That is a consequence of decisions already made, not new scope.
- The `waiting`-conflation problem was the specific thing that made this area worth discussing, and `03-HANDOFF.md` had independently flagged it. D-01 is the resolution.

</specifics>

<deferred>
## Deferred Ideas

### Offered but not discussed — unresolved, in scope for this phase

These are **not** decided and **not** delegated. Research and planning must resolve them against the invariants above and surface the choices; a `checkpoint:decision` before implementing them is appropriate.

- **Toolbar state vocabulary** — whether the three states read as three distinct icon artworks, one icon plus a badge, or another treatment; what the toolbar shows when the switch is OFF and when the tab is not a Zendesk agent view (the roadmap names three states; there are arguably five). This also determines how much icon artwork has to exist, which is a real cost with no designer on the project and which overlaps Phase 5's required 128×128 store icon.
- **Toggle scope and immediacy** — global versus per-tab; whether other open Zendesk tabs clear immediately or on next focus; `storage.local` versus `storage.sync`. Bounded by D-06 (exactly one boolean), D-10 (user-off distinct from visibility pause) and CTRL-03/CTRL-04.
- **Popup contents and boundary** — the actual copy for the five messages, whether it offers step-by-step instructions for adding a Priority column or an outbound link to Zendesk documentation, and what it shows when the active tab is not a Zendesk agent view. Bounded by D-11 (status panel plus one switch, never an options page).

### Out of this phase

None newly introduced. Preserve existing scope: Phase 3 retains ongoing liveness and FAIL-04 page cleanup; Phase 5 retains public publication, privacy policy and the pre-submission checklist; v2 retains dark mode, the colourblind-safe palette, custom colours, alternative visual treatments and additional locales.

</deferred>

---

*Phase: 04-honest-failure-and-an-off-switch*
*Context gathered: 2026-09-09*
