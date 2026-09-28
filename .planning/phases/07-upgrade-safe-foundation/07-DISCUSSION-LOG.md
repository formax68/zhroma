# Phase 7: Upgrade-Safe Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-28
**Phase:** 07-upgrade-safe-foundation
**Areas discussed:** None individually. The user accepted sensible defaults for all four areas presented.

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Unreadable settings | If a saved setting can't be read (corrupted, or written by a newer version before a rollback), does Zhroma fall back to the 0.1.0 look and leave the data alone, or reset it? And if an agent picks the default again, is that saved or removed? | defaults |
| How much lands now | Build only the settings machinery with a Classic-only theme key, or also define the rule and identity formats (and their limits) before Phase 9 has tested rule behaviour? Also: when the options page entry first appears. | defaults |
| Type checking | Adopt `tsc --checkJs` now, later, or never? Check only the new files, or also add annotations to the accepted `content.js` and `background.js` (which changes their bytes)? Should it block the test run or only warn? It needs two new dev dependencies. | defaults |
| How much proof | Should the parity test cover only the page, or also the popup, toolbar and worker? Is there a live "upgrade in place" smoke check now (the user copies a folder to the Chrome machine), or does it wait for the Phase 11 release candidate? How much slower than 1.3 ms is still acceptable? | defaults |

**User's choice:** "nothing, sensible defaults for the above"
**Notes:** No per-area questions were asked. Claude recorded its recommended default for each area in CONTEXT.md D-08 to D-31. The main defaults:
- **Unreadable settings:** fall back to the default and never delete or rewrite the stored value automatically. A settings failure never blocks priority tinting, unlike `enabled`. Writes happen only on a real change, and switching back to the default stores it explicitly.
- **How much lands now:** the machinery, plus one real `theme` key whose only valid value is Classic. Rules and identity formats and limits wait for Phases 9 and 10. Compare-and-swap is proven with test-only keys. Sender checks are tightened now. The `options_ui` stub lands now.
- **Type checking:** adopt now, dev-only and blocking. New files are typed from the start. Accepted v1 files join only if they pass without checker-only edits. Each dependency version is approved separately at install time.
- **How much proof:** a page-only differential parity harness across three upgrade storage states. Existing v1 suites and mutants guard the worker and popup. No live smoke in Phase 7; the upgrade-in-place check moves to the Phase 11 release-candidate checklist. Timing is compared with 0.1.0 in the same session (within 10% or 0.2 ms). Review is capped at one round.

---

## Claude's Discretion

- File layout for the shared files
- Namespace/global names and how they are frozen
- Queue message names, the per-key status vocabulary, the `settingsReady` time bound and the `theme` value shape
- How the settings reader sits alongside the `enabled` read
- The exact frozen list beyond the D-26 minimum, and the Chrome API allowlist
- Type-check config details
- Stub page wording
- Commit ordering within D-06 and D-25

## Deferred Ideas

- Upgrade-in-place live check → Phase 11 release-candidate checklist
- User-visible wording for unreadable settings → Phases 8, 9 and 10
- Rules and identity key formats and limits → Phases 9 and 10
- `fast-check` / `colorjs.io` → Phase 8
- Version bump to 1.0.0 → Phase 11
