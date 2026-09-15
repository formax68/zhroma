# Phase 1: DOM Recon Spike - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 01-dom-recon-spike
**Areas discussed:** Live capture workflow and confidentiality, Recon scenario matrix, Fixture corpus shape, Evidence and gate protocol

---

## Live Capture Workflow and Confidentiality

### Authenticated session operator

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid handoff | User handles login, MFA, locale changes, and sensitive navigation; agent performs or guides DOM inspection after the target view is open. | ✓ |
| User-operated capture | User runs a prescribed DevTools checklist and supplies sanitized outputs. | |
| Agent-operated session | Agent controls an already-authenticated Chrome session throughout recon. | |

**User's choice:** Hybrid handoff
**Notes:** Authentication and sensitive account actions remain under user control.

### Fixture sanitization boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Sanitized structural copy only | Preserve topology and selector-relevant attributes while removing ticket, customer, account, and embedded-state data. | ✓ |
| Minimal redaction | Replace visible content and obvious identifiers while otherwise keeping the capture intact. | |
| Reduced synthetic fixture | Reconstruct only the table markup needed by known tests. | |

**User's choice:** Sanitized structural copy only
**Notes:** Only the sanitized derivative may be committed.

### Unsanitized capture retention

| Option | Description | Selected |
|--------|-------------|----------|
| Delete after verification | Keep raw HTML temporarily, then remove it after comparing the sanitized fixture. | |
| Retain privately outside the repository | Keep an encrypted local copy for future breakage investigations, without recording its location. | ✓ |
| Never save raw HTML to disk | Transform directly from browser memory or clipboard. | |

**User's choice:** Retain privately outside the repository
**Notes:** The raw capture must be encrypted at rest and absent from project metadata.

### Admission to Git

| Option | Description | Selected |
|--------|-------------|----------|
| Automated scan plus human review | Require a sensitive-value scan and a manual structural inspection. | |
| Human review only | Rely on manual inspection before commit. | |
| Automated scan only | Fail admission when automated checks detect suspicious content; no required human sign-off. | ✓ |

**User's choice:** Automated scan only
**Notes:** The automated scan is the mandatory fixture privacy gate.

---

## Recon Scenario Matrix

### UI-language coverage

| Option | Description | Selected |
|--------|-------------|----------|
| English, German, and Japanese | Baseline plus Latin- and non-Latin-script localized views. | |
| English and Japanese | Minimum count with strongest script contrast. | |
| English and German | Minimum count with an accessible localized comparison. | |
| English only | Redefine Phase 1 so it makes no cross-locale claim. | ✓ |

**User's choice:** “Just English for now,” followed by “redefine Phase 1 then. English only.”
**Notes:** The user explicitly changed the phase boundary rather than accepting an incomplete spike. `ROADMAP.md` was updated after a displayed diff and confirmation. `RECON-02` was then narrowed, with explicit confirmation, to English-path DOM assumptions while retaining the same ID and phase mapping.

### Requirement reconciliation

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow RECON-02 | Require all English-path assumptions and mark localization-only items outside Phase 1. | ✓ |
| Leave RECON-02 unchanged | Keep a formal contradiction that prevents Phase 1 completion. | |
| Remove RECON-02 | Leave the recon requirement unmapped. | |

**User's choice:** Narrow RECON-02
**Notes:** Requirement counts and traceability remain unchanged.

### Live view configurations

| Option | Description | Selected |
|--------|-------------|----------|
| Compact risk matrix | Inspect Priority-present ungrouped, Priority-absent, and grouped or long behavior. | ✓ |
| Priority-present only | Inspect a single representative view. | |
| Every accessible view style | Expand recon to every available combination. | |

**User's choice:** Compact risk matrix
**Notes:** Fixture count was discussed separately.

### Zendesk interface variants

| Option | Description | Selected |
|--------|-------------|----------|
| Current Agent Workspace only | Record the observed shell, plan, capture date, and UI metadata; make no legacy claim. | ✓ |
| Current plus accessible legacy shell | Inspect legacy UI if the account exposes it. | |
| Multiple accounts or plans | Acquire a second tenant or trial for comparison. | |

**User's choice:** Current Agent Workspace only
**Notes:** Cross-plan and legacy-shell compatibility are not claimed.

### Producing missing scenarios

| Option | Description | Selected |
|--------|-------------|----------|
| Disposable recon views | Create dedicated test views so operational views remain unchanged. | ✓ |
| Read-only existing views | Inspect only cases that already exist and block on missing coverage. | |
| Temporarily edit a non-production view | Change and later restore a non-production view. | |

**User's choice:** Disposable recon views
**Notes:** Creation, configuration, and cleanup stay under the user's authenticated control.

---

## Fixture Corpus Shape

### Scenario-to-fixture mapping

| Option | Description | Selected |
|--------|-------------|----------|
| One canonical fixture plus focused variants | Keep one complete Priority-present fixture and smaller Priority-absent and grouped/long variants. | ✓ |
| One full fixture per scenario | Keep a complete capture for each live scenario. | |
| One comprehensive fixture only | Combine as many states as possible in one large fixture. | |

**User's choice:** One canonical fixture plus focused variants

### Canonical DOM boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Nearest complete table container | Include wrapper, duplicate header, body table, accessibility attributes, and immediate state-bearing ancestors. | ✓ |
| Entire agent-view page body | Preserve maximum page fidelity. | |
| Ticket table only | Keep the smallest table-centric fixture. | |

**User's choice:** Nearest complete table container
**Notes:** Unrelated navigation, sidebars, user menus, and page state are excluded.

### Sanitized row contents

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic representative rows | Preserve structure and English priority labels, replace other data with stable placeholders, and cover all four priorities. | ✓ |
| Preserve observed distribution | Keep the original row count and priority mix after redaction. | |
| Minimize to a few rows | Retain only enough markup to locate the table and header. | |

**User's choice:** Deterministic representative rows

### Fixture provenance

| Option | Description | Selected |
|--------|-------------|----------|
| Sidecar manifest | Record scenario, capture date, workspace metadata, boundary, sanitization method, and checksums. | ✓ |
| HTML comments | Store provenance inside each fixture. | |
| Git history only | Rely on commits and timestamps. | |

**User's choice:** Sidecar manifest
**Notes:** Tenant identity and raw-capture location must never appear.

---

## Evidence and Gate Protocol

### Per-finding evidence standard

| Option | Description | Selected |
|--------|-------------|----------|
| Reproducible ledger entry | Record status, exact probe, sanitized result, interpretation, fallback, and scenario. | ✓ |
| Concise yes/no table | Record answer, rationale, and fallback only. | |
| Narrative recon report | Describe the investigation chronologically. | |

**User's choice:** Reproducible ledger entry

### Screenshot policy

| Option | Description | Selected |
|--------|-------------|----------|
| Only for visual facts | Use screenshots only when textual probes or markup cannot establish the conclusion. | ✓ |
| Never | Keep all evidence textual. | |
| For every finding | Pair every ledger entry with a screenshot. | |

**User's choice:** Only for visual facts
**Notes:** Screenshots must be cropped and sanitized.

### Findings that block Phase 2

| Option | Description | Selected |
|--------|-------------|----------|
| Capability-based hard gate | Closed Shadow DOM is terminal; missing `data-garden-id` blocks only when no stable fallback works; English text may backstop absent machine-readable priority. | ✓ |
| Strict two-risk gate | Closed Shadow DOM or missing `data-garden-id` immediately stops the project. | |
| Document and continue | Permit Phase 2 planning around every negative finding. | |

**User's choice:** Capability-based hard gate

### Phase completion authority

| Option | Description | Selected |
|--------|-------------|----------|
| Mechanical completion gate | Require resolved English-path items, passing privacy and fixture checks, matching checksums, and an explicit verdict. | ✓ |
| Risk-accepted completion | Allow unresolved items with documented fallbacks and owners. | |
| Independent sign-off | Require a second person to rerun probes and approve the verdict. | |

**User's choice:** Mechanical completion gate
**Notes:** Any unresolved English-path item keeps the phase open.

---

## the agent's Discretion

- Exact filenames for focused fixtures and the sidecar manifest.
- Exact implementation of the sensitive-data scan and fixture-loading checks, within the locked fail-closed contracts.
- Exact DevTools probe script organization and textual evidence formatting.

## Deferred Ideas

- Non-English live reconnaissance and localized priority strings are outside the redefined Phase 1. No cross-locale support may be inferred from its evidence.
