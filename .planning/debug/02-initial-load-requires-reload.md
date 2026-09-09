---
status: inconclusive
phase: 02-first-tint-on-a-real-view
gap_id: G-02-1
created: 2026-09-09
updated: 2026-09-09
goal: find_root_cause_only
---

# Initial view requires a second reload

## Symptoms and established evidence

- Expected: a fresh supported English Agent Workspace view tints recognized rows without product configuration or a second reload.
- User: "approved. When I opened the agent view it didn't load, I had to reload the page"; clarified "both and it doesn't work until I reload. you can check yourself if you want" for in-app navigation and a fresh tab.
- Agent read-only observation: existing table had 30 rows and zero markers. After full reload, 22 Normal rows were marked; eight blank-priority rows were unmarked.
- One independent fresh-tab navigation to the same URL succeeded, with the same counts and the expected Normal direct-cell background. The failing fresh-tab sequence has not been independently reproduced.
- The user subsequently confirmed the repository extension directory and extension/page reloads used throughout UAT. The three recorded SHA-256 values match current source.
- User separately reports pagination clears tint. Persistent reapplication, including explicit Next/Previous coverage, belongs to Phase 3. This does not dismiss the fresh-load report.
- No ticket content, tenant URL, account identifier, raw DOM, screenshot or new fixture capture is stored here.

## Source trace

`extension/content.js` installs a childList/characterData observer and a non-extending 15000 ms deadline, coalescing checks for 100 ms. `inspectCandidateTable` returns unsafe when html language is not exactly en or topology/labels are unsafe. `check` calls `disposeStartup` for both safe and unsafe results; safe results get one synchronous revalidated commit. Expiry, pagehide and exceptions also dispose the observer.

Consequently there is no later retry following success or refusal. Existing `initial-tint.test.js` explicitly tests disposal and later rows remaining unmarked. This explains the known in-app/pagination limitation but is not proof of the user's fresh-load cause.

The test harness sets html language to en before injecting the runtime. Its delayed-batch tests exercise missing table/head/cells and blank-to-known text before the first safe commit; they do not prove authentic startup readiness.

## Controlled experiments — 2026-09-09

Inline Node diagnostic, using actual `extension/content.js` bytes in a vm, the existing admitted priority-present fixture in an inert happy-dom window, a controlled observer and deterministic clock. No network or external script evaluation; mutations are synthetic and in memory only. Every case ends with zero active observers and zero pending timers.

| Synthetic scenario | Markers at first stopping point | Markers after later content and 20 seconds | Meaning |
|---|---:|---:|---|
| Stable English table before injection | 4 | 4 | Control succeeds |
| Empty html language at first check, en later | 0 | 0 | Terminal refusal cannot recover |
| Safe table tinted at 100 ms, replaced afterwards | 4 | 0 | One-shot success cannot cover replacement |
| No table until after the 15000 ms deadline | 0 | 0 | Deadline prevents late recovery |

These reproduce mechanisms, not the original live failure. Do not relabel a synthetic sequence as observed Zendesk behavior. Diagnostic recipe: create the inert fixture window as in `loadRuntimeFixture`; run current source with fake timers and controlled observer; advance 100 ms (or 15000 for expiry); change only the named synthetic condition; deliver a mutation only if the observer remains active; advance another 20000 ms; count owned markers and pending resources.

Existing exact-byte runtime suite: 64/64 passed. Evidence validator: 56/56 passed with `LIVE ACCEPTANCE STATUS: gaps_found`. These tests do not close A1 or G-02-1.

## Remaining hypotheses

1. A transient unsupported/malformed state causes terminal refusal before the complete supported view arrives.
2. An initial safe snapshot is replaced during first-load rendering after disposal.
3. The table or a quiet interval arrives after the deadline, including possible background-tab timing effects.
4. Initial navigation/injection differs from the final /agent/ view, such as a landing page followed by SPA navigation. No initial URL or injection timeline was retained, so this remains unproven.

## Disposition

**INVESTIGATION INCONCLUSIVE.** No observed live root cause is established. Do not change timers, broaden URL matches, weaken table validation, add history hooks, or implement Phase 3 liveness on this evidence alone.

Next: execute 02-03's bounded reproduction gate using confirmed source and aggregate startup observations. Correlate a failing load to injection/readiness/disposal, create a failing exact-byte regression derived from that evidence, then repair only the confirmed cause within Phase 2. If no failure can be reproduced, retain the gap and ask for the specific failed-entry sequence; repeated successful loads alone do not erase the report.
