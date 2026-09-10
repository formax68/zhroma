---
phase: 04-honest-failure-and-an-off-switch
verified: 2026-09-10T18:41:58Z
status: gaps_found
score: 0/4 must-haves verified
covered_files:
  - ".planning/REQUIREMENTS.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-01-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-01-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-02-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-02-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-03-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-03-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-04-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-04-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-05-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-05-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-06-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-06-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-07-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-07-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-08-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-08-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-09-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-09-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-10-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-10-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-11-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-11-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-12-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-12-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-13-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-13-SUMMARY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-14-PLAN.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-14-SUMMARY.md"
  - "extension/background.js"
  - "extension/content.js"
  - "extension/manifest.json"
  - "extension/popup.html"
  - "extension/popup.js"
  - "extension/zhroma.css"
  - "test/extension/diagnosis.test.js"
  - "test/extension/failure-seam.test.js"
  - "test/extension/phase-04-live-acceptance.test.js"
  - "test/extension/popup-recovery.test.js"
  - "test/extension/runtime-contract.test.js"
  - "test/extension/toggle.test.js"
  - "test/extension/toolbar-popup.test.js"
  - "test/extension/worker-integrity.test.js"
covered_digest: "v1:sha256:bde95b9e92384c55ea07e109faef18a8c965333c651f0ce601feecab957c3b56"
behavior_unverified: 3
overrides_applied: 0
gaps:
  - truth: "The popup carries an on/off switch that is already on; turning it off clears every tint from the view currently on screen without a refresh, and turning it back on restores them."
    status: failed
    reason: >-
      Reproduced independently against the shipped bytes: after a save that
      SUCCEEDS and a storage read-back that FAILS, the popup shows the switch
      ON while storage holds `false` and the tint is already gone. Three
      surfaces give three answers and the one the agent acts on is wrong. The
      test that should catch it asserts the wrong thing and its own name is
      falsified by its assertion, so the green suite cannot see it. This is
      04-REVIEW CR-01, still open in HEAD.
    artifacts:
      - path: "extension/popup.js"
        issue: >-
          Lines 77-100 (`showPreference`) revert `control.checked` to
          `lastConfirmed` whenever `enabled === null`, including the case where
          `reply.saved === true`. Line 189 additionally collapses `!reply.saved`
          and `reply.enabled === null` into one NOT_SAVED branch, so a write that
          landed is reported as a failed save.
      - path: "test/extension/toggle.test.js"
        issue: >-
          Lines 233-244, "a rejected read after a write refuses to claim a
          preference it could not confirm", assert `checked === true` and
          `disabled === false` but never assert `world.getStored('enabled')`.
          The contradiction is invisible to the suite; the test is a false green.
    missing:
      - "In requestEnabled, branch on `reply.saved` before `reply.enabled === null`: when the write landed, show `reply.enabled === null ? desired : reply.enabled` and never revert to `lastConfirmed`."
      - "Add `expect(world.getStored('enabled')).toBe(false)` and `expect(control(popup.document).checked).toBe(false)` to toggle.test.js:233-244 so the test can fail."
      - "Register a popup-recovery mutant that reverts the control after a SUCCESSFUL write, so the repaired behaviour is fenced."
  - truth: "Requirement status in the repository does not claim acceptance the phase never observed."
    status: failed
    reason: >-
      `.planning/REQUIREMENTS.md` marks FAIL-01, FAIL-02, FAIL-05, CTRL-02 and
      CTRL-03 as `[x]` / `Complete` for Phase 4. `04-VALIDATION.md`'s own
      requirement-coverage table marks all seven `pending-human` and states
      verbatim that "none should read `Complete` while Phase 4 carries zero live
      browser evidence." Phase 4 carries zero live browser evidence: all 17
      checks in `04-LIVE-ACCEPTANCE.md` are `pending` and the validator prints
      `PHASE 04 LIVE ACCEPTANCE STATUS: human_needed`. Five requirements are
      therefore recorded as accepted on the strength of simulated delivery
      alone, which is the exact shape the ratified `untested-is-not-consent`
      prohibition forbids.
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Lines 47-58 and 127-135 mark 5 of 7 Phase 4 requirements Complete against the phase's own promotion rules."
    missing:
      - "Return FAIL-01, FAIL-02, FAIL-05, CTRL-02 and CTRL-03 to Pending until live browser evidence exists, or record an explicit, attributed user decision that redefines Complete for this project."
  - truth: "With the agent UI set to a language the extension does not read, the toolbar shows a third, distinct state and nothing anywhere claims the view is missing a Priority column."
    status: partial
    reason: >-
      The stated criterion holds in code — a genuinely non-English shell yields
      `cannot-read` / `unsupported-language`, its own packaged artwork and its
      own copy, and the `missing` line is unreachable from that path. The
      converse fails: an English shell whose `lang` carries stray whitespace or
      a Java-style underscore is told its interface language is not supported.
      This is 04-REVIEW WR-01, confirmed by reading `extension/content.js:71-76`.
    artifacts:
      - path: "extension/content.js"
        issue: >-
          Line 76 returns `unsupported` for anything whose `trim()` is non-empty,
          so `lang=\" en\"`, `lang=\"en \"`, `lang=\" en-GB \"` and `lang=\"en_US\"`
          all publish `cannot-read` / `unsupported-language` for an English agent.
      - path: "test/extension/runtime-contract.test.js"
        issue: "Line 333 lists the refused shells but asserts only that no markers are written, never which {diagnosis, reason} is published, so the false claim is locked in silently."
    missing:
      - "Keep the untrimmed comparison that governs painting, but decide the REASON from the trimmed value so an English shell falls to `unsafe`/`structure` rather than `unsupported`."
      - "Extend the refused-shell test set to assert the published {diagnosis, reason}, not just the absence of markers."
  - truth: "The off switch stays operable when a storage hop stalls."
    status: partial
    reason: >-
      04-REVIEW WR-02, confirmed by reading `extension/background.js`. `bounded()`
      is applied to the two `chrome.tabs.sendMessage` document hops only
      (lines 170, 198). `setEnabled` awaits `writePreference`, `readPreference`
      and `activeTab` unbounded before it ever reaches a bounded hop, and every
      write chains through `serializePreference`, so one stalled storage read
      leaves the off switch inoperative in every tab for the life of the worker.
      The source comment at lines 14-19 states the guarantee as closed, so the
      comment now claims more than the code delivers.
    artifacts:
      - path: "extension/background.js"
        issue: "Lines 103-131 and 246-270 — three unbounded awaits upstream of the only bounded hop, behind a single-writer chain."
    missing:
      - "Wrap `readPreference`, `writePreference` and `chrome.tabs.query` in the existing `bounded()` helper."
      - "Correct the lines 14-19 comment so it describes the bound the code actually has."
      - "Add a failure-seam mutant per newly bounded site, driven by a never-flushed deferred read."
behavior_unverified_items:
  - truth: "On a view that has a Priority column the toolbar icon shows that tinting is working; on a view without one it shows a visibly different state, and opening the popup tells the agent to add the column."
    test: "Load the repaired extension/ unpacked into Chrome. Open a Zendesk agent view WITH a Priority column, then one WITHOUT. Look at the toolbar icon in each, then open the popup in each."
    expected: "Working view: the working icon and 'Priority tinting is working'. Missing-column view: a visibly different icon at 16px and 'Add a Priority column to this view to use tinting'."
    why_human: "Whether two 32px PNGs are distinguishable as toolbar icons at their rendered size, and whether Chrome actually delivers the per-tab setIcon write, are browser-rendering facts. The suite proves the two files are byte-distinct and that the worker projects them; it cannot prove a person can tell them apart."
  - truth: "With the agent UI set to a language the extension does not read, the toolbar shows a third, distinct state and nothing anywhere claims the view is missing a Priority column."
    test: "Set the Zendesk agent UI to a non-English language and open a view. Read the toolbar icon and the popup copy."
    expected: "The unreadable icon, and 'This interface language is not supported'. Nothing anywhere says a Priority column is missing."
    why_human: "No non-English tenant context was available (AR-04-01 waives the two checks but is explicitly not evidence). Whether Zendesk actually sets html[lang] to the agent's chosen locale is a live-tenant fact no fixture establishes."
  - truth: "Quitting Chrome and reopening it preserves whichever way the switch was left."
    test: "Turn the switch off. Fully quit Chrome (not just close the window). Reopen, open a Zendesk agent view, open the popup. Repeat with the switch left on."
    expected: "The switch is in the position it was left in, and the view is tinted or untinted to match."
    why_human: "The phase's own validation states the point directly: a simulated restart is context recreation in a VM, not a browser restart. Nothing in the suite exercises chrome.storage.local surviving a real process exit."
coincidental_reliance_items: []
human_verification:
  - test: "All 17 checks in 04-LIVE-ACCEPTANCE.md, observed against the repaired bytes."
    expected: "Each check moves from pending to pass with an attributed observation and a confirmed source load."
    why_human: "Phase 4 carries zero live browser evidence. The 14 attestations taken on 2026-09-10 were correctly reset by 04-11 under promotion rule 3 because four of eleven shipped assets moved; they are preserved as history and cannot be carried forward."
  - test: "ACK-04-01 — the attester reads 04-LIVE-ACCEPTANCE.md's opening, the ACK-04-01 entry in 04-VALIDATION.md and the dated AR-04-01 addendum, and responds."
    expected: "Acknowledgement that the 14 prior attestations are now dated history, that Phase 4 closes carrying zero live browser evidence, and that re-observing is a separate UAT activity. Disagreement becomes a finding rather than a silent write-off."
    why_human: "Only the person who made those attestations can accept that they no longer count. No executor may answer this item; doing so would itself violate untested-is-not-consent."
  - test: "Prohibition `no-agent-blame` — read the three diagnosis lines as a support agent would."
    expected: "'Add a Priority column to this view to use tinting' reads as help, not as an accusation that the agent broke something."
    why_human: "unverified-prohibition — human review recommended. Judgment-tier, no wired enforcement. Whether copy reads as blame is a judgment about a reader. Non-authoritative LLM-judge reading: the copy is imperative and view-directed rather than agent-directed, and no string attributes cause; that is a reading, not a verdict."
  - test: "Prohibition `re-enable-not-pressured` — turn the switch off and sit with the popup, including the failed-save path on the REPAIRED popup.js."
    expected: "Off reads as a legitimate state, not an error, and nothing nudges the agent to switch back on."
    why_human: "unverified-prohibition — human review recommended. The user judged this on the PRE-repair popup; popup.js then changed under WR-04/WR-07 (WINDOWS entry 19). The ratification is explicitly qualified and does not cover the shipped bytes."
  - test: "Prohibition `untested-is-not-consent` — read how this phase's completion is reported."
    expected: "Nothing presents simulated Chrome delivery, a green suite or a waiver as observed acceptance."
    why_human: "unverified-prohibition — human review recommended, and currently CONTRADICTED in the repository: .planning/REQUIREMENTS.md marks 5 of 7 Phase 4 requirements Complete on zero live evidence. Recorded as a gap above."
  - test: "Confirm the Phase 4 goal is not a User Story while ROADMAP.md declares `Mode: mvp`."
    expected: "Either the goal is rewritten as 'As a …, I want to …, so that ….' via /gsd mvp-phase 4, or the mvp mode declaration is removed."
    why_human: "A roadmap-contract decision, not a code change. The MVP-mode User Flow Coverage section was withheld from this report for exactly this reason."
---

# Phase 4: Honest Failure and an Off Switch — Verification Report

**Phase Goal:** The agent can tell from the toolbar which of three states the extension is in, is told to add a Priority column only when that is certainly the problem, and can turn tinting off and back on without uninstalling.
**Verified:** 2026-09-10T18:41:58Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## MVP-mode format guard

ROADMAP.md declares `**Mode:** mvp` for this phase, but the goal is not a User
Story. `gsd-tools query user-story.validate` returns:

```
{ "valid": false, "errors": [
  "Story must start with \"As a [user role],\" (role must be non-empty).",
  "Story must include \", I want to [capability],\" (capability must be non-empty).",
  "Story must include \", so that [outcome].\" (outcome must be non-empty)." ] }
```

The MVP User Flow Coverage section is therefore **withheld** — synthesising a
user flow from a non-User-Story goal would manufacture the very thing this phase
exists to refuse. Verification proceeded against the four ROADMAP Success
Criteria, which are the roadmap contract and are present and specific. The
format defect is raised as a human item, not treated as a code gap.

(Note: several plans, e.g. `04-05-PLAN.md:54`, carry a well-formed User Story in
their body. The ROADMAP goal itself was never updated to match.)

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP Success Criterion) | Status | Evidence |
|---|---|---|---|
| 1 | On a view that has a Priority column the toolbar icon shows that tinting is working; on a view without one it shows a visibly different state, and opening the popup tells the agent to add the column. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Present and wired: `background.js:30-37` maps `working`→`icons/working.png`, `missing`→`icons/missing.png`; `:211` writes it per-tab via `chrome.action.setIcon`; `popup.js:36` carries `'missing': 'Add a Priority column to this view to use tinting'`. Five icons confirmed byte-distinct 32×32 RGBA by `shasum`/`file`. Simulated-Chrome tests pass. **No live browser observation exists** — `working-icon`, `blank-copy`, `missing-icon-hint`, `missing-settle-transition`, `navigation-status` are all `pending`. |
| 2 | With the agent UI set to a language the extension does not read, the toolbar shows a third, distinct state and nothing anywhere claims the view is missing a Priority column. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Present and wired: `content.js:72-76` yields `unsupported` only for a shell that actually declares another language; `background.js:33` maps `cannot-read`→`icons/unreadable.png`; the `missing` copy key is unreachable from that path. **No live observation** — `language-icon-copy` and `structure-copy` are FAIL-03's only two live checks, both `pending`, both waived under AR-04-01 (a waiver, explicitly not evidence). Converse defect WR-01 recorded as a gap. |
| 3 | The popup carries an on/off switch that is already on; turning it off clears every tint from the view currently on screen without a refresh, and turning it back on restores them. | ✗ FAILED | **CR-01 reproduced independently against the shipped bytes** (see Behavioural Spot-Checks). The switch can display ON while `chrome.storage.local` holds `false` and the tint has already gone. Additionally WR-02: the preference writer is wedgeable. Additionally no live evidence — `off-clears`, `on-restores`, `popup-keyboard`, `nonreceiver-status` all `pending`. |
| 4 | Quitting Chrome and reopening it preserves whichever way the switch was left. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Present and wired: `background.js:20,106,120` — one boolean `enabled` in `chrome.storage.local`, absent key defaults `true`; `content.js:444` reads the same key. Simulated restart tested. **A simulated restart is context recreation in a VM**, as `04-VALIDATION.md` states itself; `restart-off`, `restart-on`, `frozen-resume`, `cross-tab-preference`, `worker-restart` all `pending`. |

**Score:** 0/4 truths verified (3 present, behavior-unverified; 1 failed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `extension/manifest.json` | MV3, narrow host match, popup action | ✓ VERIFIED | 23 lines. `permissions: ["storage"]` only; `matches: ["https://*.zendesk.com/agent/*"]`; `world: "ISOLATED"`, `all_frames: false`; `minimum_chrome_version: "106"`. No `host_permissions`, no `scripting`. |
| `extension/background.js` | Per-tab diagnosis → icon + popup protocol + storage writer | ✓ VERIFIED | 322 lines. Substantive, imported by the manifest service_worker key, exercised by 6 suites. |
| `extension/content.js` | Diagnosis, marker writes, apply-preference | ✓ VERIFIED | 556 lines. Declared in `content_scripts.js`. |
| `extension/popup.js` | One switch + finite status copy | ⚠️ HOLLOW (defective wiring) | 205 lines, wired via `popup.html:19`. Present and substantive, but `showPreference` reverts to a value that contradicts persisted storage on the saved-but-unread path — the value it renders is not the value the data source holds. See CR-01. |
| `extension/popup.html` | Exactly one labelled checkbox + status region | ✓ VERIFIED | One `input[type=checkbox]#zhroma-enabled`, native `<label>`, `role="status"` panel, ships `disabled`. |
| `extension/zhroma.css` | Four unlayered `!important` tint rules gated on English | ✓ VERIFIED | 27 lines, four declarations, all `!important`, all gated on `html[lang|="en" i]`. No `@layer`, no `@import`, no remote resources. |
| `extension/icons/*.png` (5) | Byte-distinct 32×32 RGBA artwork per state | ✓ VERIFIED | 5 of 5 SHA-256 distinct; `file` confirms 32×32 8-bit RGBA for each. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `extension/popup.html` | `extension/popup.js` | `<script src="popup.js">` | ✓ WIRED | Line 19. |
| `extension/manifest.json` | `extension/background.js` | `background.service_worker` | ✓ WIRED | |
| `extension/manifest.json` | `extension/content.js` + `zhroma.css` | `content_scripts` | ✓ WIRED | |
| `extension/popup.js` | `extension/background.js` | `chrome.runtime.sendMessage({type:'set-enabled'})` | ✓ WIRED | `popup.js:170` ↔ `background.js:294`. Bounded at 5000 ms; ordering vs the worker's 2000 ms asserted from shipped bytes. |
| `extension/background.js` | `extension/content.js` | `chrome.tabs.sendMessage({type:'apply-preference'})` | ✓ WIRED | `background.js:198` ↔ `content.js:487`. |
| `extension/background.js` | `chrome.storage.local` | `get`/`set` on `enabled` | ⚠️ PARTIAL | Lines 106/120. Functionally wired, but the three awaits around it are outside `bounded()` while the two document hops are inside it (WR-02). |
| `extension/background.js` | toolbar | `chrome.action.setIcon` per tabId | ✓ WIRED | Line 211, keyed on the projected status. |
| `extension/popup.js` render | persisted preference | reply `{saved, enabled, applied}` | ✗ BROKEN | The rendered switch position can be the opposite of the persisted value. See CR-01. |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| `content.js` | row priority markers | Live DOM `querySelectorAll` over the ticket table | Yes | ✓ FLOWING |
| `background.js` | `ICONS[result.status]` | Per-tab diagnosis published by the content script | Yes | ✓ FLOWING |
| `popup.js` | status copy | Worker reply `{status, reason}`, finite enum validated | Yes | ✓ FLOWING |
| `popup.js` | `control.checked` | `lastConfirmed` when `enabled === null`, regardless of `saved` | **No** — renders a stale local value, not the persisted one | ✗ CONTRADICTS SOURCE |

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| Full suite on shipped bytes | `npm test` | 65 `node --test` + **606 Vitest passed** across 17 files, exit 0 | ✓ PASS |
| Phase 4 acceptance validator | (in the run above) | prints `PHASE 04 LIVE ACCEPTANCE STATUS: human_needed` | ✓ PASS (and it says `human_needed`) |
| Phase 3 acceptance validator | (in the run above) | prints `PHASE 03 LIVE ACCEPTANCE STATUS: human_needed` | ✓ PASS |
| Packaged icons distinct + 32×32 RGBA | `shasum -a 256 extension/icons/*.png`; `file …` | 5/5 distinct; all `32 x 32, 8-bit/color RGBA` | ✓ PASS |
| Byte pin: no `extension/` change since 04-11 | `git log --oneline -- extension/` | newest is `11eded7` (04-10), before 04-11 | ✓ PASS |
| **CR-01: successful write + failed read-back** | Out-of-tree probe through `tracer-world.js` against shipped bytes; file deleted in the same command, `git status --short` unchanged | `{"stored":false,"markers":[],"checkbox":true,"disabled":false,"status":"Zhroma could not save that setting"}` | ✗ **FAIL** |

The CR-01 probe is my own, not the reviewer's, and it reproduces their measurement
exactly: storage holds `false`, the document is already untinted, and the switch
the agent looks at reads **ON** under copy saying the save failed.

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist in this repository and no plan declares
one. Probe execution: **SKIPPED (no probes declared or discoverable)**. The
project's equivalent gates — the Vitest suites, the acceptance validator and
`npm run test:mutants` — were exercised or independently corroborated instead.
`npm run test:mutants` was **not** re-run by this verification: it is a gate on
the tests rather than on the product, and it has two independent 25/25 results
already (the orchestrator's and the code reviewer's).

### Requirements Coverage

All seven declared phase requirements are claimed by at least one plan.
`.planning/REQUIREMENTS.md` maps exactly FAIL-01, FAIL-02, FAIL-03, FAIL-05,
CTRL-02, CTRL-03, CTRL-04 to Phase 4. **No orphaned requirements.**

| Requirement | Source plans | Description | Status | Evidence |
|---|---|---|---|---|
| FAIL-01 | 01,02,03,04,05,06,07,11,12,13 | Three distinct states | ? NEEDS HUMAN | Taxonomy + five packaged shapes verified offline. Zero live evidence. REQUIREMENTS.md wrongly reads `Complete`. |
| FAIL-02 | 01,03,05,11,13 | Missing-column hint only when certain | ? NEEDS HUMAN | Certainty gate and eleven not-missing shapes verified offline. Zero live evidence. REQUIREMENTS.md wrongly reads `Complete`. |
| FAIL-03 | 01,03,05,07,11 | Unsupported locale never claims a missing column | ✗ BLOCKED | The stated direction holds offline. The converse (WR-01) publishes a false language claim for a padded English shell. Both live checks unobserved; AR-04-01 waives them and is not evidence. |
| FAIL-05 | 01,02,03,05,06,07,08,11,12,13 | Toolbar icon exposes the state | ? NEEDS HUMAN | Per-tab projection and distinct artwork verified offline. 16px legibility is a human check. REQUIREMENTS.md wrongly reads `Complete`. |
| CTRL-02 | 01,04,05,08,09,10,11,12,14 | Popup off/on | ✗ BLOCKED | CR-01: the switch can display the opposite of the persisted preference. WR-02: the writer is wedgeable. REQUIREMENTS.md wrongly reads `Complete`. |
| CTRL-03 | 01,02,04,05,06,08,10,11,12,14 | Setting survives restart | ✗ BLOCKED | Storage seam correct, but CR-01 means the displayed value is not always the persisted one. Real restart unobserved. REQUIREMENTS.md wrongly reads `Complete`. |
| CTRL-04 | 01,04,05,09,10,11 | Off clears without refresh | ? NEEDS HUMAN | Marker removal and the honest `applied:false` path verified offline. `off-clears`/`on-restores` unobserved. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `extension/popup.js` | 89-92, 185-192 | Rendered state contradicts the persisted source of truth | 🛑 Blocker | CR-01. The agent acts on the wrong reading. |
| `test/extension/toggle.test.js` | 233-244 | Test asserts the defect as correct; name falsified by its own assertion | 🛑 Blocker | A false green that hides CR-01 from the suite. |
| `extension/content.js` | 76 | A shell blamed on its language when the real fault is a selector-unmatchable tag | ⚠️ Warning | WR-01. An English agent told their language is unsupported. |
| `extension/background.js` | 14-19 vs 103-131, 246-270 | Source comment claims a guarantee the code does not deliver | ⚠️ Warning | WR-02. Wedgeable off switch; misleading comment invites regression. |
| `.planning/REQUIREMENTS.md` | 47-58, 127-135 | Untested behaviour recorded as accepted | 🛑 Blocker | Contradicts the phase's own promotion rules and the ratified `untested-is-not-consent` prohibition. |
| `extension/`, `test/`, `scripts/` | — | `TBD` / `FIXME` / `XXX` / `TODO` / `HACK` / `PLACEHOLDER` | ℹ️ Info | **Zero hits.** Debt-marker gate: clean. |

### Prohibitions

Three prohibitions, all **judgment-tier** (`04-05-PLAN.md:42-48`), all
`flagged-unverified` in the canonical record. Under the judgment-tier
soft-gate this autonomous verification records a **non-authoritative** reading
and flags each as `unverified-prohibition — human review recommended`. None is
green; each appears in `human_verification` above.

| id | Statement | Disposition |
|---|---|---|
| `no-agent-blame` | The diagnosis must not blame an agent. | flagged — LLM-judge reading only |
| `re-enable-not-pressured` | The off switch must not pressure re-enabling. | flagged — the user's ratification is explicitly qualified and predates the popup.js repair (WINDOWS 19) |
| `untested-is-not-consent` | Untested browser behaviour must not be presented as observed acceptance. | flagged — and currently **contradicted** by REQUIREMENTS.md; raised as a gap |

### Honest Disclosures — Verified, Not Re-Discovered

These were recorded by the phase as unmet rather than asserted away. I checked
each against the code and each disclosure is accurate:

- **WINDOWS 22** — a projection for a closed tab still paints against the dead
  tab id. Confirmed at `background.js:217-219`: `project` → `invalidate` →
  `stateFor` mints a fresh entry after `onRemoved` deleted it. The test asserts
  only the honest form. Correctly disclosed.
- **WINDOWS 20/21** — two of the seven named worker guard sites are provably
  unfenceable individually because both callers recheck immediately after the
  await with no macrotask able to interleave. The registry says exactly what it
  does and does not fence. Correctly disclosed.
- **WINDOWS 14** — the timeout path reports `unavailable`, not `NOT_APPLIED`,
  because a timed-out apply yields `outcome === null`. Verified in source order
  at `popup.js:190-191` and `background.js:258-261`. Correctly disclosed.
- **WINDOWS 16** — the popup ships a 5000 ms deadline, not the planned 2000 ms,
  with the ordering asserted from shipped bytes. Confirmed at `popup.js:25`.
- **04-11's reset of the 14 attestations** — correct under promotion rule 3.
  `git log -- extension/` confirms `content.js`, `zhroma.css`, `background.js`
  and `popup.js` all moved after those attestations were taken. The reset was
  mandatory, and history was preserved rather than deleted.

### Deferred Items

None. Phase 5 is "Published" (Chrome Web Store listing). Nothing in its goal
addresses CR-01, WR-01, WR-02, the requirement-status contradiction, or the
outstanding live acceptance. No gap qualifies for deferral.

### Gaps Summary

The phase built the right machine and documented itself with unusual honesty —
five distinct packaged states, a finite validated protocol, a single serialized
boolean writer, three facts (`saved`/`enabled`/`applied`) reported as three
facts, and a `WINDOWS.md` that records unmet truths instead of rounding them up.
The acceptance record's own validator computes `human_needed` and refuses to be
talked out of it. That is the phase working as designed.

It nonetheless does not achieve its goal, for two independent reasons.

**First, a shipped defect in the exact behaviour the phase is named for.** On
the saved-but-unread path the popup shows the agent a switch reading ON while
storage holds `false` and the tint has already vanished. I reproduced this
myself against the shipped bytes; I did not take the reviewer's word for it. A
phase called "Honest Failure and an Off Switch" cannot close with an off switch
that lies about its own position on a failure path — and the test written to
guard that path asserts the defect as correct, so 606 green tests cannot see it.

**Second, zero live browser evidence, recorded as accepted anyway.** All 17
acceptance checks are `pending`, and every one of the four success criteria is a
live-browser observation: an icon distinguishable at 16px, a tint visibly
disappearing, a real Chrome quit and relaunch. `04-VALIDATION.md` states that
"none should read `Complete` while Phase 4 carries zero live browser evidence" —
and `.planning/REQUIREMENTS.md` nevertheless marks five of the seven `Complete`.
That is not a bookkeeping slip; it is the specific failure mode the ratified
`untested-is-not-consent` prohibition exists to prevent, committed in the
repository that ratified it.

Two warnings sit behind those: an English shell with a padded `lang` is told its
language is unsupported (WR-01), and the preference writer is wedgeable by a
single stalled storage read while a source comment claims otherwise (WR-02).

Fix CR-01 and its false-green test, correct the requirement statuses, then
re-establish the acceptance record and run live UAT. AR-04-01 permits FAIL-03 to
proceed without its two live checks; it does not supply evidence for the other
fifteen, and nothing in it addresses CR-01.

---

_Verified: 2026-09-10T18:41:58Z_
_Verifier: Claude (gsd-verifier)_
