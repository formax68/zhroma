---
phase: 08-themes-that-follow-dark-mode
plan: "03"
subsystem: ui
tags: [chrome-mv3, popup, themes, accessibility, bounded-readback, native-writer]
requires:
  - phase: 08-01
    provides: Shared colour composition, theme registry, actual-source popup tracer
  - phase: 08-02
    provides: Eight numerically admitted presets and bundled source notices
  - phase: 08-04
    provides: Document lifetime and all-view theme propagation
provides:
  - Queue-aware bounded theme readback with explicit unresolved recovery
  - Independent confirmed, pending, failed and uncertain theme outcomes
  - Eight native labelled choices with selected text and Light/Dark composite previews
affects: [08-05, 09-colouring-rules, 10-rule-editor]
tech-stack:
  added: []
  patterns: [admission-generation-read-guard, pure-owned-read-result, explicit-theme-recovery, native-radio-catalog]
key-files:
  created: [test/extension/theme-popup.test.js]
  modified: [extension/background.js, extension/popup.js, extension/popup.html, test/extension/settings-queue.test.js, test/extension/toolbar-popup.test.js]
key-decisions:
  - "A theme read confirms only when the serial settings queue is idle before and after the read and no theme request was admitted across its snapshot."
  - "Theme success copy confirms saving only; Priority diagnosis and enable state remain independent."
  - "Uncertain saves get exactly one bounded readback, then deliberate Check theme or focus recovery; physical writes remain owned after requester timeout."
  - "An empty or failed preview catalog reports Themes are unavailable while the enable/status path still runs."
requirements-completed: [THEME-01, THEME-02, THEME-05, THEME-06]
coverage:
  - id: D1
    description: "Confirmed choices survive pending, failed, uncertain and stale operations without inferred no-write or applied claims."
    verification:
      - kind: integration
        ref: "test/extension/theme-popup.test.js; test/extension/settings-queue.test.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "All eight accepted native choices expose shared actual-composite Light/Dark previews and restore on reopening."
    verification:
      - kind: automated_ui
        ref: "test/extension/theme-popup.test.js#full native catalog has named dual composites, selected text and bounded wrapping layout"
        status: pass
    human_judgment: false
  - id: D3
    description: "Native Chrome keyboard navigation, zoom, focus visibility and painted preview agreement."
    verification: []
    human_judgment: true
    rationale: "DOM simulation proves control structure and numeric values; Plan 08-05 owns genuine Chrome observations and the painted-colour oracle."
actuals:
  tokens: 7999
  tasks: 2
  commits: 5
plan_head_before: 6dad481a0a2ed05d6b8d8c9b76eca3bca0f8f1af
duration: 10min
completed: 2026-10-09
status: complete
---

# Phase 08 Plan 03: Accessible Theme Picker Summary

**Eight native theme choices with dual measured-surface composites, independent save outcomes and queue-aware explicit recovery.**

## Accomplishments

- Worker get-theme rejects stale snapshots spanning a newly admitted theme request or active serial queue, including a physical writer surviving its requester timeout. Exact packaged sender/request contracts and exact replies remain finite; reads never write.
- Popup retains the last confirmed choice synchronously while saving, blocks overlapping saves, and separates checking/pending/failed/uncertain copy from Priority status. Uncertainty gets one bounded readback, then Check theme or focus recovery without a timer retry or replay. Read results are accepted only by their current popup owner.
- Missing theme storage stays silent; malformed, future, oversized and unknown saved data confirms Classic with the exact separate fallback warning. Reselecting effective Classic preserves original bytes and emits no write. Off/disconnected configurations save without changing enabled or claiming applied.
- Classic, Catppuccin, Tokyo Night, Dracula, Nord, Gruvbox, Solarized and Colourblind-safe appear once in order. Native radios, Selected text, wrapped labels, bounded scrolling and inset focus outlines support keyboard structure. Every Light/Dark strip shows four composites through shared resolve/preview/emission, labelled in Urgent/High/Normal/Low order. Credits point to bundled notices. Empty/missing/failed preview dependencies leave the original controls usable and report unavailable.

## Task Commits

1. Task 1 RED — `cfb5a4c`: fence uncertain theme saves and stale readback.
2. Task 1 GREEN — `568457e`: confirm theme reads only after native writes settle.
3. Task 2 RED — `52fac4c`: specify accessible complete catalog and composed previews.
4. Inventory restatement — `0cdc9ee`: exactly two additional static span construction sites, retaining closed allowed tags/no page markup.
5. Task 2 GREEN — `78c67f3`: complete accessible theme catalog and dual tint previews.

No additional refactor was required. Actual commits are measured from the persisted plan baseline before this metadata commit; tokens are realized source/test diff characters divided by four, rounded up.

## Verification

- Task 1 prescribed command: `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/theme-popup.test.js test/extension/settings-queue.test.js test/extension/popup-recovery.test.js test/extension/preference-outcome.test.js test/extension/worker-integrity.test.js test/extension/toolbar-popup.test.js` — **440/440 passed**, six files, final popup bytes.
- Task 2 prescribed command: `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/theme-popup.test.js test/extension/theme-tracer.test.js test/extension/toolbar-popup.test.js test/extension/frozen-contract.test.js` — **156/156 passed**, four files, final popup bytes.
- New theme-popup suite executes 28 tests. Tests join actual storage, checked controls, messages, write counts and connection state. Coverage includes malformed ACK/read payloads, mismatched IDs, sender refusals, unknown IDs, queued read timeout before issuance, unknown after issuance, late landing, held old responses, corrupt bytes, worker/content/popup restart, every catalog preview and choice, and unavailable dependencies.
- Task 1 RED intentionally failed `uncertain native writer stays unconfirmed until explicit Check theme after landing`: expected uncertainty, actual empty status after stale Classic read. Task 2 RED intentionally failed `full native catalog has named dual composites, selected text and bounded wrapping layout`: expected eight named titles, actual zero. Both were validated as `RED_EVIDENCE_OK` before implementation. Vitest emits nested TAP without Node summary counts; records flatten its actual named inner results and add their measured summary counts. Original TAP/records remain in `/tmp/zhroma-08-03-task{1,2}-red.*`. Initial malformed test fixtures were corrected before accepting RED evidence.
- `git diff --check` passed. No tracked deletion, new runtime dependency, network call, preference store, HTML injection or host style expansion was introduced. Stub/threat scan found no unfinished goal-blocking stub or security surface beyond the planned worker/read boundary.

## Deviations from Plan

**[Rule 3 - Blocking] Restated the static popup element inventory.** The prescribed toolbar-popup suite pins each literal createElement tag. Selected text and side-by-side grouping require two additional static spans, so `test/extension/toolbar-popup.test.js` was added to scope after reporting the exact failure to the orchestrator. Commit `0cdc9ee` changes only the inventory/comment and preserves closed tags and no-page-markup restrictions. The final prescribed commands both pass.

**Shared orchestration adjustment:** STATE.md, ROADMAP.md, REQUIREMENTS.md and state.json are deliberately left to the orchestrator because this sequential shared checkout contains incoming state changes. Existing unrelated files are preserved. This summary establishes plan execution only, not phase acceptance or inherited finding closure.

## Issues and Remaining Evidence

No unresolved implementation failure was found by the prescribed checks. Genuine Chrome keyboard/200% zoom observations, actual flattened paint comparison, full phase regression and independent review belong to 08-05. This plan supplies structure and actual-source synthetic evidence only. Phase 7 WR-02 remains its separately attributed skipped enable-handshake concern; IN-01/IN-03 and Phase 6 custody/human signoffs retain their prior status.

## Self-Check: PASSED

All six changed source/test files and this summary exist. All five listed commits exist in this branch. Required suites passed on final source bytes; unrelated incoming changes and untracked artifacts remain untouched.
