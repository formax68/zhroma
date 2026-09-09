---
status: resolved
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

## 02-03 execution checkpoint — 2026-09-09

Task 1 remains inconclusive; Task 2's causal-reproduction precondition is unmet.
All three source hashes were recomputed and match the canonical live-acceptance
record; its prior user-confirmed loaded directory remains the recorded source
confirmation. No new loaded-directory claim is made.

One focused comparison was performed using read-only aggregate DOM sampling:

| Entry | Exact English | Tables | Body rows | Owned markers |
|---|---|---|---|---|
| Existing user tab, entry history unknown | yes | 1 | 30 | 0 |
| Temporary direct fresh document, first sample | yes | 0 | 0 | 0 |
| Same fresh document, later sample | yes | 1 | 30 | 9 |
| Full reload of temporary document, first sample | yes | 0 | 0 | 0 |
| Same reload, later sample | yes | 1 | 30 | 9 |

Counts are aggregate body rows and owned attributes, not a validated per-priority
completeness or appearance assertion. No startup timings were measured. Samples
do not expose injection time, observer disposal, transient refusal, or replacement
history. In particular, zero markers in the existing tab do not prove a failing
fresh startup. The direct fresh-load failure was not reproduced, and this browser
interface's read-only DOM sampling cannot establish the missing lifecycle facts.
No second comparison was attempted without a new hypothesis. The temporary tab
was closed; the existing user tab was not navigated or reloaded. No DOM exports,
screenshots, ticket content, URLs, or identifiers are retained in this record.

**Blocking-human unmet-precondition:** obtain the precise failing fresh-entry
sequence or a user-demonstrated failed fresh load left open before reloading.
G-02-1 and Phase 02 remain gaps_found. No runtime/test changes or completed
02-03 summary were made. Existing UAT decisions and independent review limits
remain unchanged.

**INVESTIGATION INCONCLUSIVE.** No observed live root cause is established. Do not change timers, broaden URL matches, weaken table validation, add history hooks, or implement Phase 3 liveness on this evidence alone.

### User-demonstrated untinted page — follow-up

After the user reported readiness, inspected the newly opened view without
reloading it: exact English, one matching table, 16 headers with one Priority
header, 30 body rows, five High priorities, 25 blanks and zero owned markers.
Current structural checks found matching head/body/header-row/row/cell seams,
no malformed spans or nested cell topology, no incomplete/excess cells, no
nested table and a top-level document. This establishes an untinted currently
admissible table; it does not establish its earlier lifecycle or injection.

A temporary direct navigation to the same view first sampled no table and later
sampled one table, 30 rows and five owned markers. Closed the temporary control;
left the user's failed page untouched. All three repository hashes still match
the acceptance record. No timing measurement or transient lifecycle is claimed.

Asked the user for the entry sequence: direct full view address versus Zendesk
landing page followed by clicking a view, or another sequence. Await that answer
before attributing the symptom to fresh-document startup or Phase 3 navigation.
Task 2 remains blocked by missing causal evidence; no runtime change.

### Entry sequence clarified

User clarified the demonstrated sequence: "open zendesk, click the view".
This is in-app view entry after the initial document, within the existing Phase 3
view-switch/liveness scope. The same view's direct-document control received five
markers. The demonstrated symptom is therefore not evidence of a failed direct
view-document startup. The precise injection/disposal lifecycle remains unobserved.

Asked whether the earlier "fresh tab" report also meant opening Zendesk then
clicking the view, or whether direct entry to the full view address separately
failed. Until clarified, retain G-02-1 and the existing acceptance disposition.
No Phase 3 behavior is pulled into this conditional Phase 2 repair plan.

Next: execute 02-03's bounded reproduction gate using confirmed source and aggregate startup observations. Correlate a failing load to injection/readiness/disposal, create a failing exact-byte regression derived from that evidence, then repair only the confirmed cause within Phase 2. If no failure can be reproduced, retain the gap and ask for the specific failed-entry sequence; repeated successful loads alone do not erase the report.

## Final disposition — explicit report clarification

User confirmed the earlier fresh-tab report was also "Same sequence: Zendesk,
then click view". Both reports are now classified as in-app entry, not a direct
view-document startup failure. Direct-view controls tinted recognized rows.
G-02-1 is resolved as a Phase 2 classification issue and transferred to the existing
Phase 3 liveness scope. The exact earlier injection/disposal lifecycle remains
unknown; no startup-cause or runtime-fix claim is made. Prior inconclusive entries
above are historical. Task 2 repair and Task 3 changed-source retest are unnecessary
because the report's precondition was corrected and no source bytes changed.
