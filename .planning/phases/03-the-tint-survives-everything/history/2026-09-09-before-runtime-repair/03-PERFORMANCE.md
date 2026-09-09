---
phase: 03-the-tint-survives-everything
status: human_needed
synthetic_timing: passed
synthetic_layout: human_needed
synthetic_retention: human_needed
live: pending
---

# Phase 03 Performance Evidence

## Synthetic timing — passed

Actual unchanged manifest-declared content.js and CSS ran in an isolated temporary Chrome profile against admitted topology populated with neutral synthetic content. No authenticated session was accessed. All six operation matrices contain ten warmups plus 100 retained measurements for each of 30/200/1000 rows, enabled and disabled: 1800 enabled and 1800 control samples. Raw samples are in 03-PERFORMANCE-SAMPLES.json. No outlier was dropped or overwritten.

| Rows | Operation | Median CPU ms | p95 CPU ms | Max CPU ms | Median settle latency ms |
|---|---|---:|---:|---:|---:|
| 30 | edit | 0.700 | 1.000 | 1.300 | 19.100 |
| 30 | reorder | 0.600 | 0.900 | 1.000 | 19.100 |
| 30 | body | 0.500 | 0.700 | 0.800 | 19.400 |
| 30 | table | 0.400 | 0.700 | 0.800 | 19.500 |
| 30 | invalid-repair | 1.300 | 1.800 | 1.900 | 37.900 |
| 30 | unrelated | 0.000 | 0.100 | 0.200 | 14.100 |
| 200 | edit | 2.300 | 3.300 | 3.800 | 19.200 |
| 200 | reorder | 2.000 | 2.400 | 2.700 | 20.300 |
| 200 | body | 1.500 | 1.800 | 1.800 | 27.300 |
| 200 | table | 1.500 | 1.700 | 2.300 | 26.800 |
| 200 | invalid-repair | 3.600 | 4.100 | 4.600 | 40.400 |
| 200 | unrelated | 0.000 | 0.100 | 0.200 | 14.100 |
| 1000 | edit | 7.000 | 7.800 | 8.000 | 22.700 |
| 1000 | reorder | 6.800 | 7.200 | 7.400 | 28.400 |
| 1000 | body | 6.500 | 8.800 | 12.100 | 69.200 |
| 1000 | table | 6.900 | 8.800 | 10.600 | 70.100 |
| 1000 | invalid-repair | 13.700 | 14.600 | 15.400 | 66.900 |
| 1000 | unrelated | 0.000 | 0.100 | 0.100 | 14.700 |

Every 30-row operation median is below 2 ms (largest 1.300 ms). Maximum total extension callback CPU across all 1800 enabled samples is 15.400 ms, below 16 ms. Disabled controls have zero extension callbacks, passes and writes. This finite workload on this machine does not prove universal device/table performance (E15 remains flagged-unclassified).

CPU sums every wrapped observer and timer/lifecycle segment through quiescence, including filtering, validation, cleanup, marker writes and self-delivery. Timer scheduling latency is reported separately and is not substituted for CPU. Wrapper timing overhead is included within timed callback segments; bookkeeping after each segment is excluded. Driver DOM construction and correctness assertions are outside CPU timing. Invalid/repair samples include both invalidation and recovery. Runtime instrumentation is development-only. Profile tracing is separate and does not contribute budget samples.

## Environment and source identity

- hashes: {"content.js": "85aa975028d5c2653167a5c13a7d9e6031891b43ba0cf03a7ac6285dce5c2ac1", "manifest.json": "0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6", "zhroma.css": "f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61"}
- browser: "Chrome/152.0.7977.83"
- revision: "@79460ebecaa5625e57a5fb679a735659e73dc687"
- os: "darwin 27.0.0 arm64"
- cpu: "Apple M5 Max"
- cpuThrottle: 1
- headed: false
- harnessHash: "2115a61e5a7fbe3a96f4eafbb812e68cddb32f1a1439266899be426d882ce680"

Sample timestamps are retained per run. Sizes are synthetic and have 16 direct cells per ticket. The historical live observation was 30 mounted rows; actual current live count remains unobserved. No manifest or stylesheet change was needed.

## Synthetic layout and retention — human_needed

Both enabled and disabled profile commands completed separately, each performing thirty whole-table switches with explicit garbage collection and before/after heap snapshots. Raw synthetic heap/trace data was consumed in memory and not retained.

| Mode | Observer count | Pending timers | Row wrappers before/after | Detached rows before/after | Layout events |
|---|---:|---:|---|---|---:|
| enabled | 1 | 0 | 45 / 45 | 2 / 2 | 7 |
| disabled | 0 | 0 | 45 / 45 | 2 / 2 | 7 |

Counts show zero aggregate detached-row growth in both runs. They do not establish retainer attribution to the extension controller/ownedRows. The trace contains seven Layout events in each run and 57 extension callback markers in enabled mode; absence of a content.js string in an event stack is insufficient to claim zero forced layouts. Both dimensions therefore remain human_needed, with null attributed counts. No synthetic full-performance pass is claimed.

For manual interpretation, run `node scripts/run-tint-workload.js --size 30 --mode enabled --profile --headed` in a dedicated local profile. DevTools inspection must distinguish Layout synchronously inside content.js callbacks from later rendering and examine detached-row retainers after post-GC thirty-switch runs, with disabled control. The command closes the temporary profile at completion; open DevTools during execution or use the local harness driver during a paused debugging session. Use a separate output file for different headed/harness identities; existing runs intentionally cannot be overwritten.

## Live measurements — pending

Partial observation, 2026-09-09: live environment confirmed as Chrome 152.0.7977.77, macOS 27 beta 6, 30 mounted ticket rows. User prepared a DevTools recording of one sort with screenshots off and no CPU throttling, located reconcileCurrentTable, and reported 0.16 ms total duration (self 39 microseconds / 0.039 ms). This is one callback, not the full triggering-batch cost. Observer filtering/invalidation, other callbacks, representative sample distribution, forced-layout and retainer attribution remain unmeasured. Do not add inclusive and self durations together or mark live-pass-budget passed from this observation.

Source-directory/environment confirmation, mounted-row count and user-reported enabled/disabled responsiveness are recorded in 03-LIVE-ACCEPTANCE.md. Complete callback CPU median/p95/max, synchronous forced-layout attribution and post-GC thirty-user-controlled-switch retention comparison remain pending. No synthetic result or historical Phase 2 observation fills these dimensions.

Continuation of the same sort inspection: user reported 11 microseconds (0.011 ms) for the enclosing observer callback requested at content.js around line 187. Combined with the reported 0.16 ms reconciliation callback, the observed pair totals 0.171 ms inclusive CPU. Completeness of the same-sort callback inventory remains unconfirmed; this is not yet a complete batch measurement or a representative median/p95/max result.

User controls all authenticated navigation and DevTools inspection. Record only sanitized aggregates and conclusions, never raw live heap dumps, traces, screenshots, DOM or ticket values. Clear console node references before memory comparison. Unavailable restoration/admin scenarios stay pending with a reason.

## Verification and remaining gates

Chrome smoke passed; six complete timing commands passed; both profile commands returned human_needed truthfully. Extension suite at measurement time: 193 passed; final recon gate: proceed. Sixteen live checks now have user-reported passes; four remain pending, including unavailable cached-document restoration. Independent review/security/goal verification remains outstanding.

Protocol references: [CDP HeapProfiler](https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/) and [CDP Tracing](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/).

## Manual profiling deferred — 2026-09-09

The user said, "I don't know but we are overccomplicating. let's move on" after the callback-count question. Stop further manual profiling questions. Preserve 16/20 live passes, four pending checks, the unavailable persisted-restoration scenario and the partial callback measurements. This is a decision to defer measurement, not a failed observation, a full-batch timing result or acceptance of unresolved risks. Proceed with independent code/security review; phase completion remains unclaimed.
