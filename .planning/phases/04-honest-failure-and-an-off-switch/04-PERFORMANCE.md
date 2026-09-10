---
phase: 04-honest-failure-and-an-off-switch
plan: "11"
timing_status: passed
layout_attribution: not-taken
retainer_attribution: not-taken
subjective_responsiveness: pending-human
overall: human_needed
---

# Phase 04 Final-Source Synthetic Timing

**Three different things are recorded here and they are not interchangeable:**

1. **Finite measurements** — 4200 real samples taken in this plan (3600 canonical
   plus a 600-sample dormant run). `passed`.
2. **Layout / retainer attribution** — **not taken in this plan.** No `--profile`
   run was executed, so no attribution number exists. It is recorded as absent,
   not as zero.
3. **Subjective responsiveness** — whether the extension *feels* slow to an agent
   in a real Zendesk view. `pending-human`, and no aggregate counter here
   substitutes for it.

The overall verdict is therefore `human_needed`.

> **Re-measured on repaired bytes by plan 04-11.** The `04-REVIEW.md` repairs in
> waves 7 and 8 changed `content.js` and `zhroma.css` (CR-01, WR-08),
> `background.js` (WR-04) and `popup.js` (WR-04, WR-07), and 04-09 changed the
> harness itself. Two of the three hashed assets and the harness digest all moved,
> so `mergeReport`'s identity-equality guard correctly refused to extend the old
> file. The previous six-run samples and the document that reported them are
> preserved verbatim at
> `history/2026-09-10-before-review-repair/`. **Every figure below is a fresh
> measurement; none is carried over.**

## Source and environment identity

All seven runs carry an identical identity block; the report writer (`mergeReport`)
refuses a mixed source or environment outright, so the seven runs are provably one
measurement session against one set of bytes.

| Field | Value |
|---|---|
| `manifest.json` | `dafa656a55a1b69b42d4aa6490101e593bc9eea36afe35feacf34f7090b768e5` |
| `content.js` | `2dd1ac4c892aaadf5c4bc14b47c61e5a7aee4f9bdca42b26351b9ecd999c6c42` |
| `zhroma.css` | `8eb5da85190bbada5c2f4c6d9a84c068fd988c46ebe2995c1bba9242f2b726c0` |
| Browser (synthetic profile) | `Chrome/153.0.8010.37` @ `b75a5a95ea1a1b55bdbfd6d9f42d47be7507fb8b` |
| OS | `darwin 27.0.0 arm64` |
| CPU | Apple M5 Max, throttle rate 1 |
| Mode | headless (`headed: false`) |
| Harness digest | `285074ead931dde0f5212951835e10da5e1fb70ba1f8d1a51142ee93b715617b` |

The runner hashes only the three assets it serves. The **complete** eleven-asset
binding lives in `04-LIVE-ACCEPTANCE.md` `source.assets`; the three digests above
are byte-identical to their entries there, so the timing session and the acceptance
record describe the same source.

**This is the synthetic profile browser, not the live acceptance environment.**
Chrome 153 headless on a developer page is not the agent's Chrome on a real tenant.
As of this measurement **nobody has loaded the repaired bytes into a browser at
all**: `04-LIVE-ACCEPTANCE.md` carries `loaded_from_repository: false` and a null
`environment`. A synthetic run is not that confirmation and cannot become it.

## Protocol

Six canonical runs — sizes 30, 200 and 1000 in both `enabled` and `disabled` mode —
each covering the same six operation families with **10 warmup batches and 100
measured batches** per family. 6 × 6 × 100 = **3600 measured operations**, each
recording per-callback CPU segmented by category (`observer` / `timer` /
`lifecycle`), total callback CPU, callback and pass counts, marker writes, and
scheduling latency separately from CPU.

A **seventh** run, `30-dormant`, follows the same protocol and adds 600 more
measured operations. It is additional evidence and is deliberately not one of the
six keys `mergeReport` requires for `timingStatus`.

Reproduce (vary only `--size` and `--mode`; `--output` was directed **only** at this
phase's file):

```sh
node scripts/run-tint-workload.js --size 30 --mode enabled \
  --output .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json
```

The runner refuses to overwrite an existing run key and refuses a mismatched
identity, so a repeat needs a new output file. A slow sample cannot be quietly
deleted and re-measured into a pass.

## Budget

Inherited from Phase 3 and unchanged: **30-row median at most 2 ms** and **no
enabled batch over 16 ms**. The authoritative comparator is `validateWorkloadReport`
in `scripts/run-tint-workload.js`; the numbers below are its inputs, not a
re-implementation of its judgment.

`timingStatus: passed`.

| Run | `runtime` | Largest median | Largest p95 | Largest max | Callbacks | Marker writes |
|---|---|---|---|---|---|---|
| 30-enabled | loaded | **1.100** ms (`invalid-repair`) | 1.700 ms | **1.800** ms | 1900 | 18200 |
| 30-disabled | absent | 0.000 ms | 0.000 ms | 0.000 ms | **0** | **0** |
| 200-enabled | loaded | 4.000 ms (`invalid-repair`) | 5.000 ms | 5.400 ms | 1900 | 120200 |
| 200-disabled | absent | 0.000 ms | 0.000 ms | 0.000 ms | **0** | **0** |
| 1000-enabled | loaded | 11.200 ms (`invalid-repair`) | 12.000 ms | **12.200** ms | 1900 | 600200 |
| 1000-disabled | absent | 0.000 ms | 0.000 ms | 0.000 ms | **0** | **0** |
| 30-dormant | **loaded** | 0.000 ms | 0.000 ms | 0.000 ms | **0** | **0** |

- **30-row median budget:** worst 30-row median is **1.100 ms** against the 2 ms
  ceiling.
- **Batch ceiling:** worst enabled batch across all sizes is **12.200 ms** against
  the 16 ms ceiling. The 1000-row `invalid-repair` family is the binding case, as in
  Phase 3 — it is the one that both repairs a corrupted marker set and re-runs a
  full pass, so it does two batches' work in one.
- **Disabled control is genuinely disabled.** Zero callbacks and zero marker writes
  in all six families of all three disabled runs. But see the next section: what the
  disabled control measures is a page with **no runtime at all**, which is not the
  shipped off state.

### Per-operation detail, enabled runs (median / p95 / max, ms)

| Operation | 30 | 200 | 1000 |
|---|---|---|---|
| `edit` | 0.600 / 0.800 / 0.900 | 2.700 / 3.600 / 4.000 | 5.500 / 7.900 / 9.000 |
| `reorder` | 0.500 / 0.700 / 0.700 | 2.500 / 4.200 / 4.400 | 4.800 / 5.000 / 5.100 |
| `body` | 0.700 / 0.900 / 1.000 | 1.200 / 1.400 / 1.500 | 6.000 / 6.800 / 7.600 |
| `table` | 0.400 / 0.600 / 0.700 | 1.200 / 1.400 / 1.500 | 6.100 / 6.900 / 7.400 |
| `invalid-repair` | 1.100 / 1.700 / 1.800 | 4.000 / 5.000 / 5.400 | 11.200 / 12.000 / 12.200 |
| `unrelated` | 0.000 / 0.000 / 0.100 | 0.000 / 0.100 / 0.100 | 0.000 / 0.100 / 0.100 |

`unrelated` is the mutation-filtering case: a change that does not affect
interpretation costs ~0 ms and produces **zero timer passes** at every size (100
observer callbacks, 0 passes, 0 writes). The filter is doing its job at 1000 rows
exactly as at 30.

Scheduling latency is retained separately from CPU (`latencyMedian` per family in
`04-PERFORMANCE-SAMPLES.json`) and is deliberately **not** folded into the budget:
it includes the harness's own settling delays and the browser's native rendering,
neither of which is extension CPU.

## The dormant run — what it establishes that the disabled control does not

The `disabled` control never loaded `extension/content.js`. It measures **a page
with no extension**, which is the right baseline for "how much does the page cost
without us" and the wrong evidence for "how much does the shipped off switch cost".
Those are different programs, and until 04-09 the report conflated them. The
`runtime` field now names the difference: `absent` for the three disabled controls,
`loaded` for everything else.

`30-dormant` measures the **shipped off state**. It installs the preference seam,
stores a real `false` through it, loads `extension/content.js` for real, and then
runs the identical six-family protocol:

| Property | 30-dormant | What it means |
|---|---|---|
| `runtime` | `loaded` | The controller was genuinely present, not skipped |
| Extension callbacks | **0** across all six families | A stored `false` produces no observer or timer work |
| Marker writes | **0** across all six families | Nothing was tinted, and nothing was cleaned up either |
| `resources.observers` | **0** | No `MutationObserver` was left attached |
| `resources.pendingTimers` | **0** | No settle or reconcile timer was left armed |

**No timing budget applies to a dormant run, deliberately.** The claim dormancy
makes is *zero observable work*, not *a fast amount of it*, so `callbacks === 0`,
`writes === 0` and a clean resource ledger are the entire assertion.
`validateWorkloadReport` enforces exactly that and additionally refuses a dormant
run that declares `runtime: 'absent'` — a run cannot claim to have measured the off
switch while admitting it never loaded the switch.

What this still is **not**: a person turning the switch off in Chrome and watching
tint disappear. That is `off-clears` in `04-LIVE-ACCEPTANCE.md`, and it is `pending`.

## Comparison with the pre-repair session — informational only

| | Pre-repair (`1c1e0b03…`, harness `f889a9eb…`) | Repaired (`2dd1ac4c…`, harness `285074ea…`) |
|---|---|---|
| Largest 30-row median | 1.300 ms | 1.100 ms |
| Largest enabled batch | 13.900 ms | 12.200 ms |
| Canonical measurements | 1800 enabled + 1800 disabled | 1800 enabled + 1800 disabled |
| Dormant measurements | — | 600 |

Both are inside budget. **This is not evidence that the repair made anything
faster.** The source, the harness and the session all differ, and run-to-run
variance on a shared developer machine comfortably covers a 0.2 ms and a 1.7 ms
difference. The only claim being made is that broadening the language predicate,
adding `!important` to four declarations and bounding four message hops did not push
the controller out of the inherited budget.

Phase 3's records were **not** overwritten: `--output` was pointed only at this
phase's file. The previous Phase 4 samples were **not** overwritten either — they
were preserved to `history/2026-09-10-before-review-repair/` before the live file was
removed.

## Attribution — recorded as not taken

`03-PERFORMANCE.md` leaves synthetic **layout attribution** and **retainer
attribution** at `human_needed`, and Phase 3's manual profiling is deferred at the
user's request. **This plan did not run a `--profile` pass and did not resume Phase 3
profiling.** There is therefore no Phase 4 attribution number, and none was invented:

| Dimension | Phase 4 status | Why |
|---|---|---|
| Attributed forced layouts | **not-taken** | Requires a `--profile` trace run; not executed here. Phase 3's own `human_needed` disposition stands, unchanged. |
| Attributed detached-row retention | **not-taken** | Requires post-GC snapshots plus DevTools **retainer** inspection. Aggregate node counts cannot establish retainer attribution and are not offered as a proxy. |
| Live responsiveness | **pending-human** | `03-LIVE-ACCEPTANCE.md` `live-responsiveness` remains pending. Not resumed here. |
| Manual profiling | **deferred** | Deferred at the user's explicit request and not resumed by this plan. |

What **can** be said, and is a source-level fact rather than a measurement, is that
the shipped code contains nothing that *could* force a synchronous layout or hold a
timer open. Re-verified by grep over all four shipped scripts (`content.js`,
`background.js`, `popup.js` and the popup's single external script reference)
against the **repaired** bytes:

| Property | Result |
|---|---|
| Forced-geometry reads (`getBoundingClientRect`, `offset*`, `client*`, `scroll*`, `getComputedStyle`, `getClientRects`) | **none** |
| Idle/interval timers, keepalive (`setInterval`, `requestIdleCallback`, `chrome.alarms`, `requestAnimationFrame`, `chrome.runtime.connect`) | **none** |
| `setTimeout` call sites | **four** — see below |
| Network / web storage / console (`fetch`, `XHR`, `WebSocket`, `EventSource`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`, `caches`, `console.*`) | **none** |
| Colour literals (`#hex`, `rgb()`, `hsl()`) in shipped JS | **none** — palette stays in `zhroma.css` (D-07) |
| CSS writes / DOM construction (`.style`, `innerHTML`, `createElement`, `cssText`, `adoptedStyleSheets`, `attachShadow`, `insertAdjacentHTML`) | **none** |
| Inline script in `popup.html` | none — one external `<script src="popup.js">` |

**The `setTimeout` count changed, and the change is stated rather than glossed.**
The pre-repair document reported exactly two call sites. There are now **four**:

| Site | Purpose | Cancellation |
|---|---|---|
| `content.js:251` | the 100 ms settle timer | cancellable; asserted to drain (`expect(vi.getTimerCount()).toBe(0)`) |
| `content.js:309` | the 0 ms reconcile timer | cancellable; asserted to drain |
| `background.js:79` | the worker's `REQUEST_TIMEOUT_MS = 2000` deadline (WR-04) | `clearTimeout` on every winning path, both fulfilment and rejection |
| `popup.js:131` | the popup's `REQUEST_TIMEOUT_MS = 5000` deadline (WR-04) | `clearTimeout` in a `finally`, so every path clears it |

The two new timers are one-shot deadlines that exist so an unresponsive document
cannot wedge the extension's only preference writer. Neither is a keepalive, neither
repeats, and both are cleared as soon as the race settles. The `30-dormant` run's
`pendingTimers: 0` is the measured counterpart to that source-level claim.

**A source-level absence is not a runtime measurement, and none of the above is
human visual acceptance.** They are the reason an attribution run would be expected
to come back clean; they are not that run.

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

`manifest.json` is byte-identical to its pre-repair digest, so the permission surface
is provably unmoved by the repair.

**Chrome 106 compatibility floor.** `sender.documentId` is load-bearing for
content-script identity at the worker's trust boundary, and it is a Chrome 106 API.
The floor is therefore a security decision, not a convenience: without it the worker
cannot distinguish two documents in the same tab. Carry it into the store listing —
installs below Chrome 106 are excluded deliberately.

**`storage.local`, one boolean, no `sync`.** The `global-local` decision persists
`{enabled: boolean}` in `chrome.storage.local` and nothing else; an absent key means
`true`, so a fresh install tints with zero configuration. `chrome.storage.sync`,
`session` and `managed` are pinned absent by name. Consequences to carry forward: the
preference does **not** follow the agent to another machine, and cross-tab delivery is
**asynchronous** — a frozen tab converges on resume, not atomically. The
`global-local` decision states that limit explicitly and the product must not claim
better.

## Gates this document does not supply

Independent **code review**, the **ASVS level 1** security verdict (high and critical
findings blocking), phase **goal verification**, and **human acceptance** are four
separate verdicts that must be issued after implementation by someone other than the
implementing agent. This plan prepares their evidence. It does not award any of them,
and a green timing run is not an input to three of the four.

Full sample data: `04-PERFORMANCE-SAMPLES.json` (seven runs, 4200 measured
operations). Previous session: `history/2026-09-10-before-review-repair/04-PERFORMANCE-SAMPLES.json`.

---

*Phase: 04-honest-failure-and-an-off-switch*
*Plan: 04-11 Task 2 — measured 2026-09-10 on repaired bytes*
