# Phase 1: DOM Recon Spike - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 performs an English-only reconnaissance of the current Zendesk Agent Workspace. It produces sanitized, testable DOM fixtures and a reproducible `SELECTORS.md` ledger that resolves every English-path DOM assumption needed before extension implementation begins. It does not build tinting behavior, claim compatibility with non-English interfaces, or validate legacy Zendesk shells.

</domain>

<decisions>
## Implementation Decisions

### Live Capture and Confidentiality
- **D-01:** Use a hybrid authenticated-session workflow. The user controls login, MFA, locale settings, sensitive navigation, and other account actions; the agent leads or guides DOM inspection after the target view is open.
- **D-02:** Commit only structurally faithful sanitized fixtures. Preserve DOM topology and selector-relevant attributes while replacing ticket subjects, people, emails, organization data, account and ticket identifiers, URLs, embedded state, and other tenant-specific content.
- **D-03:** An unsanitized capture may be retained privately outside the repository, but it must be encrypted at rest. Project artifacts must not reveal its path, tenant identity, or identifying metadata.
- **D-04:** A fixture may enter Git only after an automated sensitive-data scan passes. Human review is not a mandatory admission gate.

### Recon Scenario Matrix
- **D-05:** Phase 1 is intentionally English-only. Localization-specific Verification Ledger items must be labeled outside Phase 1 or unverified; they must not be presented as tested. The phase makes no cross-locale compatibility claim.
- **D-06:** Inspect three live configurations: an ungrouped view with Priority, a view without Priority, and a grouped or sufficiently long view that exposes duplicate or sticky headers plus scrolling or virtualization behavior.
- **D-07:** Inspect the current Zendesk Agent Workspace only. Record the capture date, observed shell, account plan, and other relevant non-identifying UI metadata. Do not claim legacy-interface or cross-plan coverage without evidence.
- **D-08:** Create dedicated disposable recon views when existing views do not cover the matrix. Do not alter operational views. Creation, configuration, and any cleanup remain under the user's authenticated control.

### Fixture Corpus
- **D-09:** Commit one structurally complete Priority-present canonical fixture plus smaller faithful Priority-absent and grouped/long variants.
- **D-10:** The canonical capture boundary is the nearest complete table container: wrapper, sticky or duplicate header table, body table, relevant accessibility attributes, and immediate state-bearing ancestors. Exclude navigation, sidebars, user menus, and unrelated page state.
- **D-11:** Replace non-priority row content with deterministic placeholders while preserving the real row structure and English Priority labels. The canonical fixture must contain at least one Urgent, High, Normal, and Low row.
- **D-12:** Maintain a sidecar fixture manifest containing scenario, capture date, non-identifying Agent Workspace metadata, DOM boundary, sanitization method, and checksum of each sanitized fixture. Do not include tenant identity or the raw-capture location.

### Evidence and Gate Protocol
- **D-13:** Each `SELECTORS.md` item is a reproducible ledger entry containing the question, status (`verified`, `disproved`, or `outside English-only scope`), exact DevTools probe, sanitized result or markup excerpt, interpretation, fallback, and capture scenario.
- **D-14:** Use textual probe output or sanitized markup as primary evidence. Add cropped, sanitized screenshots only for visual facts that text cannot establish, including the painting element, sticky-header layout, or hover and selection behavior.
- **D-15:** Closed Shadow DOM around the ticket list is terminal and blocks Phase 2. Missing `data-garden-id` is not terminal by itself: a stable fallback must work across the complete scenario matrix or Phase 1 remains blocked. Absence of a machine-readable priority signal permits the planned English-text fallback.
- **D-16:** Phase 1 completes only when every English-path ledger item has a terminal status, the sensitive-data scan passes, every committed fixture loads successfully, provenance checksums match, and `SELECTORS.md` ends with an explicit proceed or block verdict. Any unresolved English-path item keeps the phase open.

### the agent's Discretion
- Exact filenames for focused fixtures and the fixture sidecar manifest.
- Exact automated scanning implementation and suspicious-value patterns, provided it covers all sensitive categories in D-02 and fails closed.
- Exact DevTools probe scripts and fixture-loading test organization, provided the evidence and completion contracts above are met.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and Requirements
- `.planning/ROADMAP.md` — Defines the English-only Phase 1 boundary, goals, and success criteria.
- `.planning/REQUIREMENTS.md` — Defines RECON-01 through RECON-03, including the narrowed English-path wording of RECON-02.
- `.planning/PROJECT.md` — Defines the product boundary, privacy posture, zero-network constraint, and fail-quiet requirement.

### Recon Assumptions and Evidence
- `.planning/research/ARCHITECTURE.md` § Verification Ledger — Canonical list of verified facts, live-instance assumptions, probes, selector tiers, and fallbacks.
- `.planning/research/PITFALLS.md` § Confidence & Gaps — Defines the high-risk DOM unknowns, privacy hazards, and failure consequences the recon must address.
- `.planning/research/SUMMARY.md` — Summarizes the load-bearing assumptions, terminal Shadow DOM risk, and expected recon deliverables.

### Fixture and Test Shape
- `.planning/research/STACK.md` § Testing — Defines the real-capture fixture strategy, fixture-loading tests, and limits of offline DOM verification.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application source or test harness exists yet; this is a greenfield repository.
- The research Verification Ledger in `.planning/research/ARCHITECTURE.md` is the primary reusable asset and should seed the `SELECTORS.md` checklist rather than being rewritten from memory.

### Established Patterns
- Research already converges on fixture-driven DOM tests under `test/fixtures/` and an empirical live-instance gate before extension code.
- Stable selector candidates are ranked as current `data-garden-id`, then Zendesk `data-test-id`, then structural fallback. Styled-components hashes and copied positional selectors are not durable evidence.
- The project privacy boundary forbids tenant data in Git and forbids network or telemetry-based evidence collection.

### Integration Points
- New phase artifacts connect at repository-root `SELECTORS.md`, `test/fixtures/`, the fixture provenance sidecar, an automated sanitization scan, and a minimal fixture-loading test.
- Phase 2 may consume the canonical fixture and proceed verdict only after D-16 passes.

</code_context>

<specifics>
## Specific Ideas

- The canonical fixture must retain the duplicate-header/body-table relationship because resolving headers within the correct table is load-bearing downstream.
- The grouped/long scenario must expose group-row structure and whether scrolling changes the set or identity of rendered rows.
- The highest-value probes are current `data-garden-id` presence, Shadow DOM accessibility, a locale-independent priority signal, the element that paints row backgrounds, same-table versus sibling-header structure, iframe placement, and stable fallback selectors.
- English-only is a deliberate phase redefinition, not evidence that locale handling is solved.

</specifics>

<deferred>
## Deferred Ideas

- Non-English live reconnaissance and localized priority strings are outside Phase 1. Localization-only ledger entries remain explicitly unverified; later phases must not infer cross-locale support from this spike.

</deferred>

---

*Phase: 01-dom-recon-spike*
*Context gathered: 2026-09-02*
