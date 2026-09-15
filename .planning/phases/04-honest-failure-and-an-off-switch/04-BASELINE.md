# Phase 4 Baseline: Phase 3 Historical Runtime Revision

**Recorded:** 2026-09-10
**Recorded by:** 04-02 Task 1, before any `extension/` byte was modified.
**Purpose:** Bind `.planning/phases/03-the-tint-survives-everything/03-LIVE-ACCEPTANCE.md` to the
exact runtime bytes its human observations were made against, so that Phase 4's edits to
`extension/` cannot silently invalidate — or silently re-validate — Phase 3's evidence.

## Why this record exists

`test/extension/phase-03-live-acceptance.test.js` read the **current** working-tree bytes of
`extension/manifest.json`, `extension/content.js` and `extension/zhroma.css`, hashed them, and
required the Phase 3 acceptance record's `runtime_sha256` block to match. It also derived the
record's `settings` block from those same current bytes with a source regex.

That was correct while Phase 3's source was the current source. It stops being correct the moment
Phase 4 adds a service worker, a popup and a preference read to `content.js`: the hashes diverge,
and the only two ways to make the test pass again would be to (a) rewrite Phase 3's recorded
hashes to describe bytes no human ever observed, or (b) delete the check. Both destroy the
evidence. Threat **T-04-06 (Repudiation)** is exactly this failure.

The fix is the pattern Phase 2 already uses in `test/extension/live-acceptance.test.js`: read the
assets from a pinned Git revision with `git show`, not from the working tree.

## Resolved baseline revision

| Field | Value |
|---|---|
| Revision | `382cc881334aa7edf2103150bd8fe663236b6357` |
| Subject | `fix(03): clear copied tint markers and recover table discovery` |
| Resolution method | Enumerated every revision touching `extension/` and hashed `extension/content.js` at each; exactly one matched the pinned digest. |
| Availability | Local, reachable from `main`. Not a tag; the test fails loudly if the object is absent. |

## Verified asset digests at that revision

| Asset | SHA-256 |
|---|---|
| `extension/manifest.json` | `0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6` |
| `extension/content.js` | `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2` |
| `extension/zhroma.css` | `f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61` |

All three are byte-identical to the working tree **as of this record**, and all three match the
`runtime_sha256` block already written in `03-LIVE-ACCEPTANCE.md`. The `content.js` digest is the
value 04-02-PLAN.md independently pinned, so the revision is confirmed against the plan rather
than merely against itself.

Reproduce:

```sh
for f in manifest.json content.js zhroma.css; do
  git show "382cc881334aa7edf2103150bd8fe663236b6357:extension/$f" | shasum -a 256
done
```

## Derived settings at that revision

`03-LIVE-ACCEPTANCE.md` records `settings = {"reconcile_delay_ms": 0, "startup_deadline_ms": null}`.
Both are derived from the historical `content.js` by the same regexes the test already used —
`setTimeout(reconcileCurrentTable, 0)` is present, and the identifier `STARTUP_DEADLINE_MS` is
absent. After this change the derivation reads historical bytes, so the recorded settings stay
true regardless of what Phase 4 does to the scheduler.

## Outcomes preserved, not re-derived

The Phase 3 record is **unchanged by this plan**. Its state, verified immediately before the
first `extension/` edit and re-asserted by the test:

| Property | Value |
|---|---|
| `status` | `human_needed` |
| Checks passed | **11** |
| Checks pending | **9** |
| Checks failed | 0 |
| `loaded_from_repository` | `true` |
| `source_confirmed_on` | `2026-09-09` |
| Unresolved observed defects | none |
| Unavailable scenarios | `document-restoration` (persisted bfcache restoration could not be exercised) |

Pre-change control run, executed before any source edit:

```
node node_modules/vitest/vitest.mjs run --config vitest.config.js \
  test/extension/phase-03-live-acceptance.test.js
→ Test Files 1 passed (1) | Tests 28 passed (28)
→ PHASE 03 LIVE ACCEPTANCE STATUS: human_needed
```

## What this record does not claim

- It does **not** advance Phase 3. Independent verification remains `human_needed` at 28/34
  truths; nine canonical live checks are still untested after the user's UAT skip, and LIVE-05
  and FAIL-04 still lack human evidence.
- It does **not** restart Phase 3 UAT or profiling. Those remain skipped until the user asks.
- It does **not** transfer any Phase 3 pass to Phase 4's changed bytes. Phase 4 needs its own
  live acceptance record against its own runtime hashes; that is 04-05's work.
- It is a statement about **which bytes were observed**, not about whether the observation was
  sufficient.

## Failure mode by design

The historical reader has **no current-byte fallback**. If the pinned object is not present in
the local repository the test throws

```
Restore historical commit 382cc881334aa7edf2103150bd8fe663236b6357 locally to validate Phase 3 evidence
```

rather than quietly hashing whatever `extension/` happens to contain. A shallow clone or a
pruned history must be repaired, never worked around.

---

*Phase: 04-honest-failure-and-an-off-switch*
*Plan: 04-02*
