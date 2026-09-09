---
phase: 03-the-tint-survives-everything
status: human_needed
synthetic_timing: passed
synthetic_layout: human_needed
synthetic_retention: human_needed
live: pending
---

# Phase 03 Performance Evidence — repaired source

## Synthetic timing — passed

The final repaired manifest-declared runtime ran in isolated temporary Chrome profiles against neutral synthetic fixture-derived topology. All six size/mode matrices completed ten warmups plus 100 retained measurements per operation: 1800 enabled and 1800 disabled samples. No authenticated browser session was accessed. Raw samples and complete source/harness/environment identity are in 03-PERFORMANCE-SAMPLES.json.

| Rows | Operation | Median CPU ms | p95 CPU ms | Max CPU ms | Median settle latency ms |
|---|---|---:|---:|---:|---:|
| 30 | edit | 0.700 | 0.900 | 1.100 | 19.000 |
| 30 | reorder | 0.700 | 0.900 | 1.100 | 19.000 |
| 30 | body | 0.500 | 0.700 | 0.800 | 19.500 |
| 30 | table | 0.400 | 0.700 | 1.200 | 19.500 |
| 30 | invalid-repair | 1.400 | 1.600 | 1.900 | 37.800 |
| 30 | unrelated | 0.000 | 0.100 | 0.100 | 13.800 |
| 200 | edit | 2.400 | 3.400 | 3.900 | 19.200 |
| 200 | reorder | 2.000 | 2.400 | 2.800 | 20.000 |
| 200 | body | 1.500 | 1.700 | 1.800 | 26.900 |
| 200 | table | 1.500 | 1.700 | 2.000 | 26.800 |
| 200 | invalid-repair | 3.400 | 4.100 | 4.700 | 40.100 |
| 200 | unrelated | 0.000 | 0.100 | 0.100 | 14.000 |
| 1000 | edit | 7.100 | 8.400 | 8.700 | 23.800 |
| 1000 | reorder | 6.300 | 6.800 | 7.000 | 27.600 |
| 1000 | body | 7.100 | 8.800 | 9.400 | 73.100 |
| 1000 | table | 6.800 | 8.900 | 12.000 | 68.700 |
| 1000 | invalid-repair | 12.700 | 13.900 | 14.500 | 64.300 |
| 1000 | unrelated | 0.000 | 0.100 | 0.100 | 15.000 |

Largest 30-row operation median: 1.400 ms (<2 ms). Largest measured enabled batch: 14.500 ms (<16 ms). All disabled controls have zero extension callbacks and writes. These are finite synthetic measurements, not universal performance or live acceptance.

CPU sums observer filtering/invalidation and scheduled reconciliation through quiescence, including cleanup, writes and self-delivery. Timer latency is separate. Measurements do not establish synchronous layout or heap-retainer attribution. The six-operation batch timeout was extended from 60 to 180 seconds after the original 1000-row attempt timed out without returning samples; individual setup/profile CDP commands remain bounded at 60 seconds. Product timing budgets were unchanged.

## Environment and source identity

- hashes: {"manifest.json": "0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6", "content.js": "aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2", "zhroma.css": "f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61"}
- browser: "Chrome/153.0.8010.37"
- revision: "@b75a5a95ea1a1b55bdbfd6d9f42d47be7507fb8b"
- os: "darwin 27.0.0 arm64"
- cpu: "Apple M5 Max"
- cpuThrottle: 1
- headed: false
- harnessHash: "bae9a93ce7f2812e10a7d7fd90ab55717adc62ad859f7a07d8f8ffefa749ce86"

## Synthetic layout and retention — human_needed

Both enabled and disabled thirty-switch profiles completed. No raw heap dumps or traces were retained.

| Mode | Observers | Pending timers | Row wrappers before/after | Detached rows before/after | Layout events |
|---|---:|---:|---|---|---:|
| enabled | 1 | 0 | 45 / 45 | 2 / 2 | 7 |
| disabled | 0 | 0 | 45 / 45 | 2 / 2 | 7 |

Zero aggregate detached growth does not establish extension-retainer attribution, and seven Layout events in each run do not establish zero synchronous forced layouts. Attributed counts remain unproven. Manual profiling remains deferred at the user's request.

## Historical runs and live observations

- [Pre-repair evidence](history/2026-09-09-before-runtime-repair/03-PERFORMANCE.md) preserves the original measurements and partial user-reported live callback timings. Its sixteen live passes and four pending checks remain bound to the original source.
- [First repair experiment](history/2026-09-09-first-repair-performance/README.md) retains the failed 1000-row enabled matrix (47.2 ms maximum) and corresponding source. It used a full-document marker scan on every relevant pass. The final repair limits copied-marker discovery to lifecycle entry and mutation-added subtrees; that implementation change justified a new measurement. Failed samples were not removed from history.
- The final repaired source has no user-confirmed live acceptance yet. Current-source source confirmation and live observations remain pending in 03-LIVE-ACCEPTANCE.md; synthetic timing cannot replace them.

Phase 03 remains incomplete. Manual profiling deferral is not risk acceptance or a measurement pass.
