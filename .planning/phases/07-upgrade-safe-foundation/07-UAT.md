---
status: resolved
phase: 07-upgrade-safe-foundation
source: [07-VERIFICATION.md]
started: 2026-09-28T12:00:00Z
updated: 2026-10-02T02:42:34Z
---

## Current Test

[testing complete]

## Tests

### 1. Decide WR-02 — popup switch-on while the settings read has not settled
expected: 0.1.0 answers `applied: true, diagnosis: working` immediately. The Phase 7 bytes answer `applied: true, diagnosis: neutral` until the 500 ms settings gate opens; the open popup shows "Checking this view" and does not update. Accept as the cost of D-09's bounded wait, or apply the reviewer's one-line fix plus a hang-mode handshake test before Phase 8.
result: pass
decision: "A — accept. The fault-window divergence is recorded as a known cost of D-09's bounded wait; no fix before Phase 8. Options B (reviewer's applied:false one-liner) and C (defer the apply reply until the gate opens) were presented and declined."
decided_at: 2026-09-30

### 2. Confirm D-29's same-session band replaces SC 4's literal "about 1.3 ms"
expected: 07-CONTEXT.md D-29 records the replacement; the recomputed same-session 30-row medians are 1.7 ms (Phase 7) vs 1.8 ms (0.1.0), band 0.2 ms, passed. Either add an override for SC 4's wording or update the ROADMAP text.
result: pass
decision: "B — update the ROADMAP text. SC 4 in .planning/ROADMAP.md now states D-29's same-session rule (within 10% or 0.2 ms of the 0.1.0 bytes, same session and machine, existing budgets passing) in place of the machine-specific 'about 1.3 ms'. No override is added to 07-VERIFICATION.md."
decided_at: 2026-09-30

### 3. Resolve the 11 judgment-tier prohibitions (plan frontmatter, all `flagged: true`)
expected: Verifier's non-authoritative verdicts in 07-VERIFICATION.md: 9 hold on the evidence; 1 is human-attestation only (07-02 approval before install); 1 is partly contradicted in the fault window (07-06 COMPAT-04, see WR-02).
result: pass
decision: "A — confirm all. 9 verifier verdicts upheld. 07-02: the developer attests that typescript@7.0.2 and @types/chrome@0.3.0 were each approved as exact versions before installation (record and install share commit 2da0edf, so git cannot show the order). 07-06 COMPAT-04: accepted as a recorded exception confined to the 500 ms settings window — the WR-02 behaviour accepted in test 1. Note carried forward: the 07-04 'never writes an unchosen setting' verdict holds for `theme` only; WR-03 must be fixed before a normalising Phase 9/10 key lands."
decided_at: 2026-09-30

### 4. Decide WR-01 and WR-06 — guards sound today but evadable later
expected: WR-01 — commit 2441c64 narrowed scripts/phase-04-source.js from a whole-file pin to judge-text slices; today's runner has no top-level code altering the judges, but a later edit could. WR-06 — frozen-contract patterns miss `fetch.call`, scheme-relative URLs and aliased `chrome.storage`; shipped code has none today. Because the frozen file is never to be edited, tightening must happen now or be explicitly waived.
result: issue
reported: "A"
decision: "A — fix both now. One test-only gap-closure plan before Phase 8: run the pinned Phase 4 judges in a fresh VM context (WR-01) and tighten the frozen-contract network, scheme-relative and sync patterns with negative controls (WR-06). Uses D-31's single repair round. Options B (WR-06 only) and C (defer both) were presented and declined."
decided_at: 2026-10-01
severity: minor

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-07-4a
  truth: "The Phase 4 timing-judge guard cannot be bypassed by code outside the pinned judge slices: historical samples are judged by the pinned judge code itself, not by the working copy of scripts/run-tint-workload.js (WR-01)"
  status: resolved
  reason: "User reported: A (fix WR-01 and WR-06 now, before Phase 8)"
  severity: minor
  test: 4
  root_cause: "Commit 2441c64 replaced the byte-identical pin on scripts/run-tint-workload.js with a text-equality check over slices (scripts/phase-04-source.js L139-168 build them, L229-231 compare), but nothing executes the pinned text: phase-04-live-acceptance.test.js:35/350 and phase-03-live-acceptance.test.js:7/126 import validateWorkloadReport from the working copy. Any top-level statement outside the slices, any side effect in its imports (fixture-contract.js, baseline-source.js) or any patched built-in changes the historical verdicts while the text check stays equal. Reproduced 4 mutants (OPERATIONS.length = 0; Math.ceil = () => 1; Array.prototype.sort/at patches). The reviewer's VM sketch fixes M1/M2 but not M3/M4: host-realm arrays carry a patched Array.prototype into the context, so inputs must be built inside it (JSON.parse in-context). The Phase 3 test has no guard at all today."
  artifacts:
    - path: "scripts/phase-04-source.js"
      issue: "readPhase04Source() only compares judge text (L229-231) and exposes no pinned judges"
    - path: "test/extension/phase-04-live-acceptance.test.js"
      issue: "L35 imports the working-copy validateWorkloadReport, used at L350"
    - path: "test/extension/phase-03-live-acceptance.test.js"
      issue: "L7 imports the working-copy validateWorkloadReport, used at L126; no judge guard in its module graph"
    - path: "test/extension/performance-harness.test.js"
      issue: "L127-139 negative controls only mutate text inside the slices; none edits outside them"
  missing:
    - "Build the pinned judges from blob(observation_revision, TIMING_JUDGE_PATH) (git show via the existing blob(), not a new readFileSync) in a fresh node:vm context (codeGeneration strings/wasm off) and expose them from readPhase04Source(); keep the text-equality check as a tripwire"
    - "Construct judge inputs inside the context (e.g. pass sample JSON text to an in-context JSON.parse) so patched host built-ins cannot reach the pinned judges"
    - "Point phase-04 and phase-03 live-acceptance tests at the pinned judges and drop their run-tint-workload.js imports (verdicts stay unchanged: Phase 4 pinned judges also pass all six Phase 3 runs)"
    - "Add negative controls for edits outside the slices (M1-M4 from the debug repro) proving the pinned verdict does not move while the text check still passes"
    - "Respect: exactly one readFileSync( in scripts/phase-04-source.js (phase-04-live-acceptance L741-747); keep readBaseline, timingJudgeSource and phase-04-timing-judge-* rejection codes; no new dependencies (D-23); assertion changes in their own commit with a reason (D-25/D-06); do not edit pinned evidence files or 05-BASELINE.json; do not register mutants against phase-04-live-acceptance.test.js"
  debug_session: .planning/debug/resolved/07-wr01-judge-pin-bypass.md

- gap_id: G-07-4b
  truth: "test/extension/frozen-contract.test.js catches evasive network calls (fetch.call, Reflect.apply, bracket access, aliasing), quoted scheme-relative URLs and aliased or destructured chrome.storage sync access, each proven by a negative control (WR-06)"
  status: resolved
  reason: "User reported: A (fix WR-01 and WR-06 now, before Phase 8)"
  severity: minor
  test: 4
  root_cause: "The guards in test/extension/frozen-contract.test.js check syntax shape on raw text, not presence: NETWORK_CALL (L69) needs the API name directly followed by '(' or after 'new'; REMOTE_REFERENCE (L71) needs an explicit http(s)/ws(s) scheme; SYNC_AREA (L95) needs the literal 'storage' then .sync/?.sync/['sync']. This was deliberate (07-01: 'Match calls, not words, so prose comments do not trip the check') because the file never strips comments and shipped comments content.js:227 ('fetch') and background.js:438 ('sync') would trip a name-level ban. Reproduced 16 network, 8 scheme-relative and 7 sync evasions. Shipped code has none (7/7 frozen tests pass at HEAD). The reviewer's scheme-relative pattern also misses unquoted src=//, url(//) inside JS strings, style attributes and srcset; a naive comment stripper would delete '//host' strings and so must be string-aware."
  artifacts:
    - path: "test/extension/frozen-contract.test.js"
      issue: "L68-71 and L95 patterns encode call shape only; no comment-stripping helper; no negative controls for indirection, scheme-relative URLs or storage aliasing"
  missing:
    - "Add a string-aware comment stripper codeOf(src) (strings matched before comment starts; '' and \"\" contents blanked unless the literal is itself a banned name; template literals kept whole) with a non-vacuity check that it removes comments from the shipped scripts"
    - "Add identifier rules on codeOf(script) for scripts only: \\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|WebTransport|RTCPeerConnection)\\b (consider fetchLater, WebSocketStream) and \\bsync\\b"
    - "Add a scheme-relative rule [`'\"(=,]\\s*//[^\\s/] on RAW scripts, pages and stylesheets (never on stripped text)"
    - "Optionally add image-set( to STYLE_LOAD and apply STYLE_LOAD to page style attributes"
    - "Negative controls: every WR-06 evasion plus '/*'; fetch(u); '*/' and '//'; fetch(u) must be caught; existing prose control, the two shipped comments, 'Settings never sync to other devices', syncController() and async must pass; document remaining limits (concatenation, escapes, page-data URLs) in the file"
    - "Respect: strictly additive (no existing pattern or control loosened or removed); own test-only commit touching only this file with a Why: body (D-06/D-25), not bundled with WR-01; nothing under extension/ changes (do not reword the shipped comments); runtime-contract.test.js pins unchanged; afterwards refresh 07-VERIFICATION.md truth 3 / STATE.md wording that the file is untouched since 8e9373b"
  debug_session: .planning/debug/resolved/07-wr06-frozen-contract-evasion.md
