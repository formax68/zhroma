# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-09-14 (store submission; reported live 2026-09-25)
**Phases:** 5 | **Plans:** 49 (46 with summaries) | **Sessions:** not tracked

### What Was Built

- A live-DOM recon spike with three sanitized, checksum-bound fixtures that settled the two terminal risks (closed Shadow DOM, Garden identifiers) before any extension code
- First-load priority tinting from a header-located column, using translucent direct-cell CSS keyed on one data attribute, with the permission set frozen at `storage` only
- A debounced observer that keeps tints correct through in-app entry, sort, refresh, view switch, pagination, scroll, grouped views and tab return
- A three-way toolbar diagnosis and a persistent off/on popup switch that report failures truthfully
- An exact-source release pipeline, a published privacy policy and a submitted Chrome Web Store listing

### What Worked

- **The recon spike first.** Every selector was traced to observed DOM, and no Zendesk-structure surprise reached runtime code
- **Freezing the permission set in Phase 2.** The toolbar and popup work in Phase 4 added `background` and `action` but never needed a new permission
- **Fail-closed evidence validators.** They caught stale observations being rebound to new bytes more than once (04-11), and a mutation gate that registers only measured kills stopped vacuous tests (WR-01)
- **Agreement tests for duplicated encodings.** No build step means JS and CSS each encode the language predicate. One test holding both kept that safe

### What Was Inefficient

- **Gap-closure volume.** Phase 1 used 15 plans for a spike (7 of them gap closure). Phase 4 used 20 plans for three features (14 of them gap closure, across two review rounds)
- **The evidence apparatus outgrew the product.** About 16,000 lines of test and evidence tooling guard 1,295 lines of runtime
- **Byte-bound evidence reset human work.** Repairs that moved shipped bytes invalidated 14 recorded live observations in Phase 4, and they had to be collected again
- **The human-verification gates were heavier than the user would carry.** UAT was skipped in Phase 3 and at release, and three Phase 4 checks were waived or deferred, so both phases shipped `human_needed` rather than passed
- **Phase 5 finished outside GSD.** Plans 05-04 to 05-07 have no summaries, so this close had to reconstruct them from `release/`

### Patterns Established

- An observation is evidence only about the exact bytes it was taken on. Historical evidence is read from pinned Git blobs, never the working tree
- A duplicated constant in a no-build codebase must have one agreement test that parses every copy, with a minimum match count so an empty parse fails
- A mutant is registered only after it has been measured killed, and its note names the assertion that actually fires
- Waivers, deferrals and green suites never promote a requirement. Only current-source human evidence does

### Key Lessons

1. Plan UAT as one session the user will actually sit through, sized and scheduled when the phase is planned. Otherwise it gets skipped and the phase ends `human_needed` no matter how rigorous the tooling is.
2. Cap review→repair rounds per phase, and push remaining findings into the next phase or a backlog rather than opening a third round.
3. When work happens outside GSD, record it back (summaries, STATE) at the time. Reconstructing it at milestone close is lossy.
4. Tests that read planning documents tie the test suite to the planning lifecycle. This close had to repoint `phase-04-live-acceptance.test.js` at the requirements archive. Keep such paths in one place, or read from pinned revisions.
5. For a ~1k-line extension, lighter acceptance evidence would probably have shipped the same product sooner. The byte-binding rigor pays off mainly at store review and when Zendesk changes its DOM.

### Cost Observations

- Model mix: not tracked
- Sessions: not tracked
- Notable: 332 commits in 13 calendar days. Gap-closure plans (21 of 49) took a large share of execution

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | not tracked | 5 | Byte-bound evidence and fail-closed acceptance validators; UAT skipped at close |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 1,147 (65 smoke + 1,082 Vitest) | not measured | 0 runtime dependencies |

### Top Lessons (Verified Across Milestones)

1. *(Needs a second milestone to cross-validate.)*
