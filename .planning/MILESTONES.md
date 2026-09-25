# Milestones

## v1.0 MVP (Shipped: 2026-09-14 · Closed: 2026-09-25)

**Delivered:** Zhroma 0.1.0, a zero-setup MV3 Chrome extension. It tints Zendesk agent-view tickets by priority, keeps the tint through everyday view interactions, reports three honest toolbar states and has a persistent off switch. It was submitted to the Chrome Web Store on 2026-09-14, and the user reported the public listing live and installable on 2026-09-25.

**Phases completed:** 1-5 (49 plans, 46 with summaries, 57 tasks recorded in summaries)

**Key accomplishments:**

- Answered every English-path DOM question against a live Agent Workspace and committed three sanitized, checksum-bound fixtures. This ruled out a closed Shadow DOM and confirmed Garden identifiers before any extension code was written
- Tinted every supported ticket row on first load from a header-located Priority column, using translucent direct-cell CSS keyed on one data attribute. The permission set was frozen at `storage` only, with `/agent/*` matches
- Kept tints correct through in-app entry, sorting, native refresh, view switching, Next/Previous pagination, scrolling, grouped views and tab return, all passed live on current source
- Shipped a three-way diagnosis (working / no Priority column / unreadable) on the toolbar. It claims a missing column only after 100 ms of mutation-quiet certainty and never blames an English-family locale
- Added a persistent off/on switch that clears and restores tints without a refresh, survives Chrome restarts and reports a failed save honestly
- Built an exact-source release pipeline (ZIP bytes equal repo bytes), published a privacy policy at https://formax68.github.io/zhroma-privacy/ and submitted 0.1.0 with genuine sanitized screenshots

**Stats:**

- 332 commits over 13 days (2026-09-02 → 2026-09-14 submission; archive 2026-09-25)
- Shipped runtime: 1,295 lines across 6 files (`content.js` 561, `background.js` 461, `popup.js` 201, CSS/HTML/manifest 72) plus 6 PNG icons
- Test and evidence tooling: ~16,000 lines. At close, 65 Node smoke tests and 1,082 Vitest tests pass
- Zero runtime dependencies. Two dev dependencies (`vitest`, `happy-dom`)

**Git range:** `a8840cf` (docs: initialize project) → `37e0082` (release 0.1.0)

### Known Gaps

16 of 32 v1 requirements are checked. The other 16 stay unchecked because their evidence is incomplete, not because a defect is known. Full outcomes are in [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md).

- **Satisfied in verification, not promoted:** DETECT-03, DETECT-04, LIVE-01, LIVE-02, LIVE-03, LIVE-04. Phase 3 verification is `human_needed` (28/34 truths, zero failed)
- **Missing human evidence (Phase 3):** LIVE-05 (four live performance checks), FAIL-04 (failure-cleanup). Isolation checks for ticket, dashboard and admin, and document-restoration, are also untested
- **Live checks passed, blocked on judgment review (Phase 4):** FAIL-02, CTRL-02, CTRL-03, CTRL-04. Three prohibitions remain `flagged-unverified`
- **Waived or deferred checks (Phase 4):** FAIL-01, FAIL-03, FAIL-05. They depend on `language-icon-copy` and `structure-copy` (AR-04-01) and `english-regional-locale` (deferred)
- **Partial (Phase 5):** STORE-06. The checklist exists, but the pre-submission smoke run ended `human_needed`
- **Process gap:** Phase 5 plans 05-04 to 05-07 were finished outside GSD with no summaries. `release/PUBLISHING-STATUS.md` is the record
- **Unverified here:** public installation (STORE-01) is user-reported; `release/submission.json` still says `public_availability_verified: false`

Known deferred items at close: 3 (see STATE.md Deferred Items)

**What's next:** Close the v1.0 evidence gaps cheaply, since most need one UAT session rather than code. Then take up v2 scope: dark mode and a colourblind-safe palette together, and localisation of priority strings.

---
