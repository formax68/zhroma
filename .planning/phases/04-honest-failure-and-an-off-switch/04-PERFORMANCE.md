---
phase: 04-honest-failure-and-an-off-switch
plan: "20"
technical_timing: passed
live_responsiveness: pending-human
layout_attribution: not-taken
retainer_attribution: not-taken
---

# Phase 04 Final-Source Synthetic Chrome Timing

Seven actual Chrome synthetic runs passed on 2026-09-11. These measure the shipped
content controller with a test-only Chrome preference seam, not an authenticated
Zendesk session or the complete installed popup/worker interaction.

## Identity and recoverable provenance

- Reviewed source: `255ba31e2b25f7b8c5bde8a3900fb93151594f50`; runtime last changed
  at `31ed0716a0da44a3004bb961c6d89fa1f9836bd9`.
- Eleven-asset aggregate: `46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065`.
- Measured content: `c9e83c837e4933827853a03bc9d7b63f308f403d679a8dc5c34701a6792b3126`.
- Harness (runner followed by workload bytes): `285074ead931dde0f5212951835e10da5e1fb70ba1f8d1a51142ee93b715617b`.
- Chrome `153.0.8010.37`, revision `@b75a5a95ea1a1b55bdbfd6d9f42d47be7507fb8b`;
  Darwin `27.0.0 arm64`, Apple M5 Max, CPU throttle 1, headless isolated profiles.
- Previous samples and report remain recoverable at pre-update committed revision
  `70ad1e5`, at these same phase-directory paths: `04-PERFORMANCE-SAMPLES.json`
  and `04-PERFORMANCE.md`. They are historical samples, not final-runtime timing.
- The five-file `history/2026-09-10-before-review-repair/` directory is
  byte-identical to the preservation inventory. No Phase 3 artifact moved.

All seven runs first accumulated in fresh temporary output
`/tmp/zhroma-04-20-final-samples-20260911.json`. The existing runner's identity
equality and duplicate-run guards remained active. Only after exact seven keys,
all source/harness hashes, every operation matrix and loaded/off resource checks
passed was the canonical samples file replaced.

## Actual protocol and results

Each run executed edit, reorder, body replacement, table replacement,
invalid-then-repair and unrelated mutation families, with ten warmups and 100
measured operations each: 4200 measurements plus 420 warmups. Runs finished from
09:24:41Z through 09:27:19Z on 2026-09-11.

| Run | Runtime | Largest family median CPU (ms) | Largest batch CPU (ms) | Verdict |
|---|---|---:|---:|---|
| 30-enabled | loaded | 1.300 | 1.800 | passed |
| 30-disabled | absent | 0 | 0 | passed |
| 200-enabled | loaded | 3.900 | 4.900 | passed |
| 200-disabled | absent | 0 | 0 | passed |
| 1000-enabled | loaded | 11.700 | 13.600 | passed |
| 1000-disabled | absent | 0 | 0 | passed |
| 30-dormant | loaded | 0 | 0 | passed |

The inherited budgets require every enabled batch below16ms and every30-row
family median below2ms. CPU sums every observer/timer callback in a batch.
Scheduling latency remains separate in JSON and includes browser/harness waits.

Disabled controls load no extension runtime. The distinct dormant run loads the
actual controller, confirms stored false, and records zero callbacks, writes,
observers and pending timers. No speed budget substitutes for zero-work assertions.
Neither control supplies an observed user off/on check.

The existing runWorkload API ran sequentially with size30/200/1000 and
mode enabled/disabled, then size30/dormant, smoke:false, profile:false,
headed:false, and the temporary output above. The equivalent CLI is
`node scripts/run-tint-workload.js --size SIZE --mode MODE --output PATH`.
Each actual run returned passed; progress is retained in 04-20-MEASUREMENTS.json.

## Limits retained

No profile pass, attributed forced-layout measurement, DevTools retainer
inspection or live responsiveness comparison was taken. These remain
not-taken/pending-human; no source grep or aggregate count substitutes for them.
Phase3's independent human_needed and user-requested profiling/UAT deferral remain.

Permissions remain exactly storage, with one persisted local boolean. Chrome106
is the documentId compatibility floor; the explicit ISOLATED manifest key is
recognized from Chrome111 (ISOLATED is the earlier default). This Chrome153 run
does not test the minimum supported browser.

Synthetic controller timing does not certify live visual cleanup, browser restart,
popup judgments, independent goal verification or overall phase acceptance.
