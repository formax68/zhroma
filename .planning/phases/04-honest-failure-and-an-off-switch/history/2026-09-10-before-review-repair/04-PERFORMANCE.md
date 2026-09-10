---
phase: 04-honest-failure-and-an-off-switch
plan: "05"
timing_status: passed
layout_attribution: not-taken
retainer_attribution: not-taken
subjective_responsiveness: pending-human
overall: human_needed
---

# Phase 04 Final-Source Synthetic Timing

**Three different things are recorded here and they are not interchangeable:**

1. **Finite measurements** — 3600 real samples taken in this plan. `passed`.
2. **Layout / retainer attribution** — **not taken in this plan.** No
   `--profile` run was executed, so no attribution number exists. It is recorded
   as absent, not as zero.
3. **Subjective responsiveness** — whether the extension *feels* slow to an
   agent in a real Zendesk view. `pending-human`, and no aggregate counter here
   substitutes for it.

The overall verdict is therefore `human_needed`.

## Source and environment identity

Every one of the six runs carries an identical identity block; the report writer
(`mergeReport`) refuses a mixed source or environment outright, so the six runs
are provably one measurement session against one set of bytes.

| Field | Value |
|---|---|
| `manifest.json` | `dafa656a55a1b69b42d4aa6490101e593bc9eea36afe35feacf34f7090b768e5` |
| `content.js` | `1c1e0b037cdbd54baaa003e603af35f4e8c47096f74901f3f2d4bf5c176d4935` |
| `zhroma.css` | `f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61` |
| Browser (synthetic profile) | `Chrome/153.0.8010.37` @ `b75a5a95ea1a1b55bdbfd6d9f42d47be7507fb8b` |
| OS | `darwin 27.0.0 arm64` |
| CPU | Apple M5 Max, throttle rate 1 |
| Mode | headless (`headed: false`) |
| Harness digest | `f889a9eb8b2ff52bbca303a7a1dfe1039449a006ecc4afbf552999e917978877` |

The runner hashes only the three assets it serves. The **complete** eleven-asset
binding lives in `04-LIVE-ACCEPTANCE.md` `source.assets`; the three digests above
are byte-identical to their entries there, so the timing session and the
acceptance record describe the same source.

**This is the synthetic profile browser, not the live acceptance environment.**
Chrome 153 headless on a developer page is not the agent's Chrome on a real
tenant. The live environment is confirmed separately by the user at the Phase 4
checkpoint and recorded in `04-LIVE-ACCEPTANCE.md` `environment`.

## Protocol

Six runs — sizes 30, 200 and 1000 in both `enabled` and `disabled` mode — each
covering the same six operation families with **10 warmup batches and 100
measured batches** per family. 6 × 6 × 100 = **3600 measured operations**, each
recording per-callback CPU segmented by category (`observer` / `timer` /
`lifecycle`), total callback CPU, callback and pass counts, marker writes, and
scheduling latency separately from CPU.

Reproduce (vary only `--size` and `--mode`; `--output` was directed **only** at
this phase's file):

```sh
node scripts/run-tint-workload.js --size 30 --mode enabled \
  --output .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json
```

The runner refuses to overwrite an existing run key and refuses a mismatched
identity, so a repeat needs a new output file. A slow sample cannot be quietly
deleted and re-measured into a pass.

## Budget

Inherited from Phase 3 and unchanged: **30-row median at most 2 ms** and **no
enabled batch over 16 ms**. The authoritative comparator is
`validateWorkloadReport` in `scripts/run-tint-workload.js`; the numbers below are
its inputs, not a re-implementation of its judgment.

`timingStatus: passed`.

| Run | Largest median | Largest p95 | Largest max | Callbacks | Marker writes |
|---|---|---|---|---|---|
| 30-enabled | **1.300** ms (`invalid-repair`) | 1.700 ms | **1.800** ms | 1900 | 18200 |
| 30-disabled | 0.000 ms | 0.000 ms | 0.000 ms | **0** | **0** |
| 200-enabled | 4.000 ms (`invalid-repair`) | 4.600 ms | 5.100 ms | 1900 | 120200 |
| 200-disabled | 0.000 ms | 0.000 ms | 0.000 ms | **0** | **0** |
| 1000-enabled | 12.400 ms (`invalid-repair`) | 13.300 ms | **13.900** ms | 1900 | 600200 |
| 1000-disabled | 0.000 ms | 0.000 ms | 0.000 ms | **0** | **0** |

- **30-row median budget:** worst 30-row median is **1.300 ms** against the 2 ms
  ceiling.
- **Batch ceiling:** worst enabled batch across all sizes is **13.900 ms**
  against the 16 ms ceiling. The 1000-row `invalid-repair` family is the binding
  case, as in Phase 3 — it is the one that both repairs a corrupted marker set
  and re-runs a full pass, so it does two batches' work in one.
- **Disabled control is genuinely disabled.** Zero callbacks and zero marker
  writes in all six families of all three disabled runs. Disabled mode installs
  no preference seam and loads no runtime at all, so this is an absence of the
  extension rather than an extension that chose to do nothing.

### Per-operation detail, enabled runs (median / p95 / max, ms)

| Operation | 30 | 200 | 1000 |
|---|---|---|---|
| `edit` | 0.700 / 0.900 / 1.000 | 2.700 / 3.600 / 3.900 | 6.900 / 7.400 / 10.100 |
| `reorder` | 0.700 / 0.900 / 0.900 | 2.400 / 3.100 / 4.200 | 6.200 / 6.600 / 6.800 |
| `body` | 0.600 / 0.900 / 1.000 | 1.500 / 1.700 / 1.900 | 6.100 / 6.900 / 8.800 |
| `table` | 0.400 / 0.700 / 0.800 | 1.400 / 1.700 / 1.800 | 6.100 / 7.000 / 7.500 |
| `invalid-repair` | 1.300 / 1.700 / 1.800 | 4.000 / 4.600 / 5.100 | 12.400 / 13.300 / 13.900 |
| `unrelated` | 0.000 / 0.100 / 0.100 | 0.000 / 0.100 / 0.100 | 0.000 / 0.100 / 0.100 |

`unrelated` is the mutation-filtering case: a change that does not affect
interpretation costs ~0 ms and produces **zero timer passes** at every size
(100 observer callbacks, 0 passes, 0 writes). The filter is doing its job at
1000 rows exactly as at 30.

Scheduling latency is retained separately from CPU (`latencyMedian` per family in
`04-PERFORMANCE-SAMPLES.json`) and is deliberately **not** folded into the
budget: it includes the harness's own settling delays and the browser's native
rendering, neither of which is extension CPU.

## Comparison with Phase 3 — informational only

| | Phase 3 (`aaf2596d…`, Chrome 152) | Phase 4 (`1c1e0b03…`, Chrome 153) |
|---|---|---|
| Largest 30-row median | 1.400 ms | 1.300 ms |
| Largest enabled batch | 14.500 ms | 13.900 ms |
| Measurements | 1800 enabled + 1800 disabled | 1800 enabled + 1800 disabled |

Both are inside budget. **This is not evidence that Phase 4 made anything
faster.** The browser version, the source and the session all differ, so the
difference is within the noise of a changed measurement environment. The only
claim being made is that adding a service worker, a popup, a preference read and
the settle window did not push the controller out of the inherited budget.

Phase 3's records were **not** overwritten: `--output` was pointed only at this
phase's file, and `git status .planning/phases/03-the-tint-survives-everything/`
is clean.

## Attribution — recorded as not taken

`03-PERFORMANCE.md` leaves synthetic **layout attribution** and **retainer
attribution** at `human_needed`, and Phase 3's manual profiling is deferred at
the user's request. **This plan did not run a `--profile` pass and did not
resume Phase 3 profiling.** There is therefore no Phase 4 attribution number,
and none was invented:

| Dimension | Phase 4 status | Why |
|---|---|---|
| Attributed forced layouts | **not-taken** | Requires a `--profile` trace run; not executed here. Phase 3's own `human_needed` disposition stands, unchanged. |
| Attributed detached-row retention | **not-taken** | Requires post-GC snapshots plus DevTools **retainer** inspection. Aggregate node counts cannot establish retainer attribution and are not offered as a proxy. |
| Live responsiveness | **pending-human** | `03-LIVE-ACCEPTANCE.md` `live-responsiveness` remains pending. Not resumed here. |

What **can** be said, and is a source-level fact rather than a measurement, is
that the shipped code contains nothing that *could* force a synchronous layout
or hold a timer open. Verified by grep over all four shipped scripts
(`content.js`, `background.js`, `popup.js` and the popup's single external
script reference) after the final commit:

| Property | Result |
|---|---|
| Forced-geometry reads (`getBoundingClientRect`, `offset*`, `client*`, `scroll*`, `getComputedStyle`, `getClientRects`) | **none** |
| Idle/interval timers, keepalive (`setInterval`, `requestIdleCallback`, `chrome.alarms`, `requestAnimationFrame`, `chrome.runtime.connect`) | **none** |
| `setTimeout` call sites | exactly **two** — the 100 ms settle timer and the 0 ms reconcile timer, both cancellable and both asserted to drain (`expect(vi.getTimerCount()).toBe(0)`) |
| Network / web storage / console (`fetch`, `XHR`, `WebSocket`, `EventSource`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`, `caches`, `console.*`) | **none** |
| Colour literals (`#hex`, `rgb()`, `hsl()`) in shipped JS | **none** — palette stays in `zhroma.css` (D-07) |
| CSS writes / DOM construction (`.style`, `innerHTML`, `createElement`, `cssText`, `adoptedStyleSheets`, `attachShadow`, `insertAdjacentHTML`) | **none** |
| Inline script in `popup.html` | none — one external `<script src="popup.js">` |

**A source-level absence is not a runtime measurement, and none of the above is
human visual acceptance.** They are the reason an attribution run would be
expected to come back clean; they are not that run.

## Package and privacy boundary on final source

| Property | Result |
|---|---|
| `permissions` | exactly `["storage"]` |
| `host_permissions` / `optional_permissions` / `optional_host_permissions` | absent (pinned absent **by name**, with eight further keys, in `runtime-contract.test.js`) |
| `matches` | exactly `https://*.zendesk.com/agent/*` |
| `world` / `all_frames` | `ISOLATED` / `false` |
| Packaged inventory | 11 files, 5 icons, recursively pinned; no generator, no test double, no build output |
| Persisted state | exactly one boolean, `{enabled}`, in `chrome.storage.local`, written by the worker alone |
| `minimum_chrome_version` | `106` |

**Chrome 106 compatibility floor.** `sender.documentId` is load-bearing for
content-script identity at the worker's trust boundary, and it is a Chrome 106
API. The floor is therefore a security decision, not a convenience: without it
the worker cannot distinguish two documents in the same tab. Carry it into the
store listing — installs below Chrome 106 are excluded deliberately.

**`storage.local`, one boolean, no `sync`.** The `global-local` decision persists
`{enabled: boolean}` in `chrome.storage.local` and nothing else; an absent key
means `true`, so a fresh install tints with zero configuration.
`chrome.storage.sync`, `session` and `managed` are pinned absent by name.
Consequences to carry forward: the preference does **not** follow the agent to
another machine, and cross-tab delivery is **asynchronous** — a frozen tab
converges on resume, not atomically. The `global-local` decision states that
limit explicitly and the product must not claim better.

## Gates this document does not supply

Independent **code review**, the **ASVS level 1** security verdict (high and
critical findings blocking), phase **goal verification**, and **human
acceptance** are four separate verdicts that must be issued after implementation
by someone other than the implementing agent. This plan prepares their evidence.
It does not award any of them, and a green timing run is not an input to three of
the four.

Full sample data: `04-PERFORMANCE-SAMPLES.json` (six runs, 3600 measured
operations, ~1.4 MB).

---

*Phase: 04-honest-failure-and-an-off-switch*
*Plan: 04-05 Task 2 — measured 2026-09-10*
