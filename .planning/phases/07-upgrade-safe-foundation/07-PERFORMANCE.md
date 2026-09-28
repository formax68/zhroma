---
phase: 07-upgrade-safe-foundation
plan: "09"
technical_timing: passed
d29_comparison: passed
timed_source_commit: df28338ca59e0541af05a53f23e66e3295f6e77a
baseline_source_revision: 6d3ab0b10e9419a5c1077e59e468977c00d59d4a
live_responsiveness: not-taken
layout_attribution: not-taken
retainer_attribution: not-taken
---

# Phase 07 Same-Session Synthetic Chrome Timing (D-29)

Eight Chrome synthetic runs, all on 2026-09-28, in one session on one machine.
Seven ran on the Phase 7 working tree and one on the pinned 0.1.0 bytes. Nothing
else heavy ran between them. This measures the shipped content controller
through a test-only Chrome seam. It is not an authenticated Zendesk session and
does not cover the installed popup or worker.

## Identity of the timed bytes and the session

- Timed source commit: `df28338ca59e0541af05a53f23e66e3295f6e77a`.
  `git rev-parse HEAD` was taken before the runs, and
  `git status --porcelain -- extension` printed nothing.
- Baseline bytes: revision `6d3ab0b10e9419a5c1077e59e468977c00d59d4a` (0.1.0).
  These were served only through `scripts/baseline-source.js`, which checks the
  revision, the inventory, every blob's size and sha256, and the aggregate
  digest against `release/candidate.json`. Nothing was read from `extension/`.
- Served-asset sha256, working tree (`identity.source: working`, four assets in manifest order):
  - `manifest.json` `55831ebffaf6cf55990c1ff16cc21ed9653c3b58714d066a2e4ece0172bb3100`
  - `zhroma-settings.js` `8613799d35e885a3881f7fe63a956a81463e17f92959c9b009e23c137dfddcef`
  - `content.js` `51ba4f88b2a06618ff169f138442a585590cece6fc2e87d804ed2ecbaf44598d`
  - `zhroma.css` `8eb5da85190bbada5c2f4c6d9a84c068fd988c46ebe2995c1bba9242f2b726c0`
- Served-asset sha256, 0.1.0 (`identity.source: baseline`, three assets, each equal to `release/candidate.json`):
  - `manifest.json` `5cf11d9aafa1b773bde9b55b40b1ad1bcd694a0af3a85e1421625b7df8d84f95`
  - `content.js` `c9e83c837e4933827853a03bc9d7b63f308f403d679a8dc5c34701a6792b3126`
    (the same content bytes Phase 4 measured)
  - `zhroma.css` `8eb5da85190bbada5c2f4c6d9a84c068fd988c46ebe2995c1bba9242f2b726c0`
- Harness (runner bytes, then workload page bytes): `8a951ca610ced549c8496ec73ad35d4c95abc0a64ad8763e165293a427dd08a9`.
  Both sources used the same value.
- Chrome `153.0.8010.53`, revision `@792bf6722e73a45aa9e47c163b9901bdc17f3230`.
  OS: Darwin `25.3.0 arm64`. CPU: Apple M4. CPU throttle 1. Headless
  (`--headless=new`) with an isolated temporary profile for each run.
- The Phase 3 and Phase 4 figures come from a different machine (Apple M5 Max)
  and different Chrome builds, so they are context only. D-29 compares only the
  two sources measured in this session.

The page loads `content_scripts[0].js` in the order the served manifest lists
them. For the working tree that is `zhroma-settings.js` then `content.js`; for
0.1.0 it is `content.js` alone. The seam answers both admitted reads, and
measurement starts only after the `enabled` read and the settings read have
both landed.

## Protocol and results

Each run executed six operation families: edit, reorder, body replacement,
table replacement, invalid-then-repair, and an unrelated mutation. Each family
had ten warmups and 100 measured operations, so every run is 60 warmups and 600
measurements. Working-tree runs accumulated in one fresh temporary output file,
and the baseline run in a separate one. The runner's identity-equality and
duplicate-run guards stayed on for both.

| Order | Run | Source | Runtime | Largest family median CPU (ms) | Largest batch CPU (ms) | Verdict |
|---:|---|---|---|---:|---:|---|
| 1 | 30-enabled | working | loaded | 1.7 (invalid-repair) | 2.8 | passed |
| 2 | 30-enabled | baseline (0.1.0) | loaded | 1.8 (invalid-repair) | 3.0 | passed |
| 3 | 30-disabled | working | absent | 0 | 0 | passed |
| 4 | 200-enabled | working | loaded | 4.3 (invalid-repair) | 5.1 | passed |
| 5 | 200-disabled | working | absent | 0 | 0 | passed |
| 6 | 1000-enabled | working | loaded | 11.9 (invalid-repair) | 13.9 | passed |
| 7 | 1000-disabled | working | absent | 0 | 0 | passed |
| 8 | 30-dormant | working | loaded | 0 | 0 | passed |

The runs finished between 11:28:26Z and 11:32:15Z. The working-tree file's
`timingStatus` is `passed`. All seven working-tree runs pass the inherited
budgets: every enabled batch is under 16 ms and every 30-row family median is
under 2 ms. The dormant run loaded the real controller, confirmed a stored
`false`, and recorded zero callbacks and zero writes.

Per-family 30-row medians (ms), working / 0.1.0: edit 1.2 / 1.1, reorder 1.0 /
1.1, body 0.7 / 0.7, table 0.5 / 0.5, invalid-repair 1.7 / 1.8, unrelated 0 / 0.

Between the baseline run and the next working run, a shell-loop bug stopped
six invocations at argument parsing (`Missing value for --mode`). None of them
started Chrome or wrote output. The six runs then went ahead with explicit
arguments. No run was repeated and no sample was discarded.

## D-29 comparison

| Figure | 30-row largest family median CPU |
|---|---:|
| v1, Phase 3 (03-PERFORMANCE.md) | 1.3 ms |
| v1, after the Phase 3 repair | 1.4 ms |
| 0.1.0 bytes (`6d3ab0b`), this session | 1.8 ms |
| Phase 7 bytes (`df28338`), this session | 1.7 ms |

- Band: `max(10%, 0.2 ms)` of the 0.1.0 median = max(0.18 ms, 0.2 ms) = **0.2 ms**.
- Absolute difference: |1.7 − 1.8| = **0.1 ms**, which is inside the band.
- **Verdict: passed.** The Phase 7 bytes time within the D-29 band of the 0.1.0
  bytes measured in the same session, and every existing budget still passes.

The harness records CPU at 0.1 ms resolution, so a difference of 0.1 ms is one
step of that resolution. The two absolute figures sit above the v1 figures
because this is a different, slower machine running a different Chrome build.
That is the drift D-29 exists to factor out; it is not a regression.

## Limits retained

- These are synthetic controller timings only. No profile pass,
  forced-layout attribution, DevTools retainer inspection or live
  responsiveness comparison was taken. Those stay with the Phase 11
  release-candidate checklist, and Phase 7 runs no live smoke check (D-28).
- The disabled controls load no runtime, so they are a no-runtime baseline and
  not an observed off/on check.
- Chrome 153 is not the minimum supported browser (`minimum_chrome_version`
  106), so this run does not test that floor.
- Samples: `07-PERFORMANCE-SAMPLES.json` (seven working-tree runs, sha256
  `d3db500df04ec3bbf9fbce2b61ed92c9043f9f398a0d58e19b69ed71bad354a5`) and
  `07-PERFORMANCE-BASELINE-SAMPLES.json` (the 0.1.0 run, sha256
  `184d4ad238b6406eeabebd1ff1700d7c434b1550ce0b2514cb2ffe55a3a76e6b`).
