---
phase: 01-dom-recon-spike
verified: 2026-09-08
acceptance_source: 01-RISK-ACCEPTANCE.md
source_snapshot: 1341022a96c4adbbb439c534ab48e1750129d83f
head_at_verification: f73ea9f810c39a0614f9874d7f40d23eb5b55607
status: passed
score: 23/24 must-haves verified; 1 explicit acceptance exception
behavior_unverified: 0
overrides_applied: 1
accepted_exceptions:
  - truth: 8
    reason: Historical approval independence remains not-attested; user explicitly accepted the residual risk.
    evidence: 01-RISK-ACCEPTANCE.md
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
re_verification:
  previous_status: gaps_found
  previous_score: 10/15
  previous_report: history/01-VERIFICATION-2026-09-04.md
  gaps_closed:
    - "Sanitizer and sensitive-data admission: shared production scanner, canonical Unicode matching, external denylist custody, unfiltered Priority indexing, shared output grammar, and value-free default diagnostics."
    - "Corpus admission: actual header identity, required assertion kinds, canonical distinct files, exact hashes, shared grammar, and approved repository-byte re-admission."
    - "Final gate: per-ID contracts, production paint validation, structured proof registry and metadata, parsed assumptions, and consistent evidence-derived verdict."
  gaps_remaining: []
  regressions: []
  unresolved_human_items: []
human_verification: []
resolved_human_verification:
  - truth: 8
    result: accepted-risk
    evidence: 01-RISK-ACCEPTANCE.md
    historical_attestation: not-attested
security_gate:
  status: verified
  open_threats: []
  accepted_risk: AR-01-13
flagged_assumptions:
  - id: RECON-01/unclassified
    status: unresolved
    gating: false
    disposition: "Explicitly approved in 01-15-DECISION.md and surfaced in SELECTORS.md; no specification-derived edge contract is claimed."
---

# Phase 1: DOM Recon Spike Verification Report

**Phase Goal:** Every DOM assumption needed for the English-only v1 path is answered against a live English Zendesk agent view. Localization-specific assumptions are explicitly excluded from this spike, while the two terminal DOM risks are still ruled in or out before implementation begins.

**Verified:** 2026-09-08T07:34:03Z

**Status:** passed with one explicit acceptance exception

**Re-verification:** Yes — Plans 01-09 through 01-15 and subsequent audit fixes.
**Source:** 1341022a96c4adbbb439c534ab48e1750129d83f; HEAD f73ea9f contains only subsequent report changes.

## Goal Achievement

The three prior technical gaps are closed at the inspected source. The recorded English DOM conclusions, safe offline corpus, and mechanical ledger gate have current code and focused behavioral evidence. The final CLI returns `FINAL VERDICT: proceed`; this is the repository DOM-evidence result, not overall phase acceptance.

Historical independence of the two original exact-version dependency approvals remains **not-attested**. Both exact releases were separately re-attested as approved before installation. The subsequent explicit user decision “risk accepted” resolves the governance gate while preserving that uncertainty. Truth 8 has one explicit acceptance exception, T-01-05/T-01-SC are closed by AR-01-13, and this report is **passed**. No historical event is retroactively verified.

The previous report is preserved verbatim in `history/01-VERIFICATION-2026-09-04.md`. Its historical risk acceptances are not must-have overrides and are not used to close any implementation gap.

### Scope and Must-Have Reconciliation

Read all fifteen PLAN and SUMMARY files, the prior verification, roadmap and requirements, CONTEXT, current code/security/UI reviews, dependency record, checkpoint 10, decisions 12 and 15, and SELECTORS. SUMMARY claims supplied an inventory, not verification evidence. No project AGENTS.md or project-local skill directory was found; the configured gsd-verifier skill query was empty. Runtime identity was confirmed as `@opengsd/gsd-core 1.12.0`.

The four roadmap success criteria remain the first four truths below, with their contract wording retained. The previous fifteen truth identities are retained; their consolidated descriptions incorporate overlapping plan detail. Nine additional truths expose the new contracts in Plans 09–15 rather than silently keeping the old denominator. Repeated plan truths map as follows:

| Plan | Truth coverage | Reconciliation |
|---|---|---|
| 01 | 1, 5–7, 16, 24 | Initial unresolved inventory has its planned terminal successor; scanner moved in 09. |
| 02 | 4, 8–9 | Exact-version approvals are attested; historical independence remains uncertain. |
| 03 | 6, 8, 10–11, 18–19 | Toolchain/admission implementation checked separately from approval history. |
| 04 | 1, 3–4, 9, 12–13, 15 | Marker-staged handoff was consumed by 05; current state is interaction-evidence-complete. |
| 05 | 1–4, 6, 11–15, 19 | Complete bounded corpus and explicit verdict; later re-admission is disclosed. |
| 06 | 4, 5, 13, 22 | Positive human-observed interaction evidence and production enforcement. |
| 07 | 6, 11, 19 | Cwd-independent CLI, bounded topology, ARIA classes, Priority-cell confinement. |
| 08 | 5, 9–11, 14–15 | Shared corpus/final path and explicit provenance/prohibition dispositions. |
| 09 | 16–18, 21 | Production ownership, Unicode matching, diagnostics, ordering, engine range. |
| 10 | 8, 10, 15 | Truthful dependency record and drift guard; first affirmative independence truth remains uncertain. |
| 11 | 6, 11, 19 | Unfiltered indexing, canonical denylist custody, shared grammar, header preservation/parity. |
| 12 | 2, 11, 19 | Approved source/provenance and measured token renumbering; exact second-pass parity. |
| 13 | 11, 20 | Assertion kind/topology, aliases, grammar, header index, malformed/empty roots. |
| 14 | 5, 13, 16, 21–22 | Per-ID contract, shared paint grammar, stable ordering; temporary todos consumed by 15. |
| 15 | 3, 14, 23–24 | Structured authorization, all seven assumption rows, and the explicitly tagged backstop truth. |

The Plan 12 decision explicitly supersedes its incorrect first-pass equality/irreversible-history assumptions: only the disclosed 62/170 placeholder renumberings are permitted, followed by byte-identical second passes. The original bytes/hashes remain in Git. The Plan 15 decision explicitly approves six resolved gating rows and the surfaced non-gating RECON-01/unclassified row. Neither decision supplies dependency independence or new live evidence.

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A `SELECTORS.md` in the repo answers every English-path DOM item with a yes/no, the evidence behind it, and the fallback if the answer is no — including which element actually paints the row background and whether a locale-independent priority signal exists on the row or cell. Localization-only ledger items are explicitly marked outside Phase 1 rather than presented as verified. | VERIFIED | Fifteen required live entries cover all named questions; exact probes, sanitized results, interpretations, fallbacks and scenarios are present. Same-table headers, no observed recycling, and marker non-survival are valid disproofs, not missing evidence. CLI admits 18 total entries including tracer and two excluded localization entries. |
| 2 | A captured `outerHTML` fixture of a real agent view is committed under `test/fixtures/`, and a test can load it and locate the ticket table and its header row with no Zendesk account present. | VERIFIED | Three admitted structural projections; historical live-origin judgment retained in the security record; current source is explicitly approved repository-byte re-admission. The named committed-corpus test passes without a server/account. This does not claim all normalized priority values were observed live. |
| 3 | Anyone reading the repo can state, from the recorded answers alone, whether a closed Shadow DOM wraps the ticket list and whether `data-garden-id` is present on rows in a current agent view — the two answers that decide whether the project proceeds as designed. | VERIFIED | SELECTORS root-chain/reachability record direct Document roots in all three observed scenarios; stable-identifiers lists actual Garden/test pairs. Plan 15 backstop is supported by those recorded direct observations and retained human disposition, plus a fresh named negative test rejecting null-shadowRoot-only proof. No current live-session or future-shell claim. |
| 4 | The recon was performed in the English agent UI only. `SELECTORS.md` records the observed page-language signal, but Phase 1 makes no claim that it works across UI languages. | VERIFIED | Recorded `htmlLang: en`, current shell/date and unknown/not-shared plan; localization entries explicitly outside scope. Scope judgments were previously resolved and no new session occurred. |
| 5 | The ledger contract cannot authorize proceed while required English evidence inputs are unresolved or semantically unsafe. | VERIFIED | `requireFinalEvidence`, `collectBlockingPredicates`, `assumptionBlockers` are called by final mode. Named relabeling, unresolved-gating and proof-reference regressions pass. Valid block remains a conservative result. |
| 6 | Fixture sanitization and sensitive-data admission are one-way, bounded, and fail closed on the identified invalid inputs. | VERIFIED | `sanitizeFixture` canonicalizes custody, reads only external input/denylist, validates unfiltered owned cells and final output before exclusive write. Named mixed-child, custody, and corrupt-output/no-write tests pass. No broader arbitrary-OS-write-failure guarantee is inferred. |
| 7 | The offline tracer proves a complete synthetic ledger path without asserting a live Zendesk fact. | VERIFIED | Explicit synthetic entry, evidence-mode contract, and final complete-matrix requirement; synthetic-only evidence cannot satisfy final mode. Earlier passed truth regression checked against current source/tests. |
| 8 | Both exact dependency releases were independently human-approved before installation. | ACCEPTED EXCEPTION — AR-01-13 | `01-10-CHECKPOINT.md` and `DEPENDENCY-APPROVALS.md` record two yes answers and the separate independence answer “I don't remember, it should be fine”. Independence remains not-attested and is not counted as verified. The user explicitly accepted the residual risk; one governance override is recorded in 01-RISK-ACCEPTANCE.md. |
| 9 | Authenticated scenario provenance and retained user control have explicit human judgment dispositions. | VERIFIED | Current security report retains the two Plan 08 judgments; historical report records them separately from technical risk acceptance. SELECTORS preserves the completed human interaction seam and the recovered read-only navigation incident. No new authenticated actions were taken. |
| 10 | Only the two exact development dependencies are installed and the approval record cannot drift unnoticed from package/lock pins. | VERIFIED | `package.json`, lock resolutions and five freshly passing dependency smoke tests agree on vitest 4.1.11 and happy-dom 20.13.1; no runtime dependencies. Tests assert consistency, not the historical truth in row 8. |
| 11 | One production corpus validator proves scan-before-parse, detached parsing, exact hashes, actual header identity, scenario semantics, and three distinct canonical files. | VERIFIED | `validateFixtureManifest` preflights canonical identity, scans, invokes shared grammar, parses detached, binds actual header via `resolveBoundedDocument`, then validates purpose/kind/topology. Named scan-order, alias, false-header and committed-corpus tests pass. |
| 12 | Static recorded live evidence covers reachability, roots, identifiers, headers, Priority presence/absence, row distinction, scrolling, paint ownership, sticky ownership, language, and host scope. | VERIFIED | SELECTORS named evidence entries retain exact observed results and scenario bounds; source fields checked against the complete per-ID map. The historical scrolling/marker observations are recorded evidence, not a claim to have re-run Zendesk today. |
| 13 | Positive normal, hovered, and selected-row paint evidence is recorded under the user-controlled seam. | VERIFIED | Recorded positive counts, distinct rows and paint summaries in `interaction-and-sticky-states`; prior human completion retained, current final CLI accepts production grammar. Existing no-state and wrong-owner cases remain active. |
| 14 | The current repository verdict follows required evidence/corpus predicates and contains no unresolved gating contradiction. | VERIFIED | Fresh CLI returns proceed after real corpus validation. Seven exact assumption identities are parsed, six have bound tests, one approved exception is surfaced. Old zero-state handoff is historical and is superseded by the positive interaction entry; it is not current paint evidence. |
| 15 | Every inherited and added must-NOT obligation has an auditable technical or existing human disposition. | VERIFIED | All 36 declarations across Plan 04 and Plans 09–15 are mapped into fourteen groups below; no automatic LLM-only judgment or unwired test-tier prohibition is silently passed. Dependency inability-to-attest is preserved rather than falsified. |
| 16 | One production-owned scanner performs canonical Unicode matching and deterministically ordered value-free findings. | VERIFIED | Only `scripts/sensitive-patterns.js` defines the scanner; producer and consumer import it. NFC-before-case-fold applies to both sides and generic matching. Named NFC/NFD and stable-order tests pass; corpus scan-order test exercises the normalized production path. |
| 17 | Default recon CLI failures emit stable codes without supplied private paths or untrusted values. | VERIFIED | Fresh missing-ledger CLI exits 1 with only `RECON_GATE_REJECTED ledger-readable-required`. CLI catch is code-only; detailed output requires the explicit Plan 09 `ZHROMA_RECON_DEBUG=1` opt-in. |
| 18 | The declared Node range excludes unsupported Node 23 and the private-capture conventions are ignored. | VERIFIED | Package range is `^20.19.0 || ^22.12.0 || >=24.0.0`; pins unchanged. All three named capture/denylist conventions were reported ignored. Ignore rules are defense in depth behind custody enforcement. |
| 19 | Shared output grammar preserves the proven Priority header, and every approved re-admitted fixture re-sanitizes identically without structural reclassification. | VERIFIED | Three separately named round-trip tests pass with exact bytes/hashes. Fresh object comparison against f391241 confirms all manifest fields except approved hash/method/header-index changes are identical. Current source declaration and decision disclose renumbering and no fresh capture. |
| 20 | Malformed, empty and incomplete manifest inputs have stable, non-vacuous outcomes. | VERIFIED | Root guard precedes dereference; fresh named null-root test passes. Active parameterized scalar/array/list cases and explicit single-entry/matrix branches inspected. Existing root-shape failure cannot escape as raw TypeError. |
| 21 | Every required ID has an exact scope/status/scenario contract and verdict blocker order is independent of ledger section order. | VERIFIED | Frozen fifteen-ID map, duplicate-scenario checks and `BLOCKER_ORDER`; fresh named all-ID relabeling and section-transposition tests pass. |
| 22 | A single production paint assessor rejects private payloads and equivalent paint masquerading as distinct states. | VERIFIED | Both production gate and smoke suite import `assessInteractionEvidence`; bounded computed RGB/RGBA/transparent grammar, image:none, numeric bounds and canonical alpha/color equality. Fresh equivalent-transparency test passes; private-function and owner-vocabulary regressions inspected. |
| 23 | Authorization uses closed enums and validator-owned per-rung proof contracts; unrelated files/unproven metadata cannot authorize fallback. | VERIFIED | `FALLBACK_PROOFS`, canonical test-path checks, registered case anchors, four enums and closed metadata tokens are actually used. Named unrelated-proof and metadata-injection tests pass. Only Garden-pair is currently admitted; other strategies remain unproven. |
| 24 | All seven assumptions are parsed; unresolved gating rows or unbound proofs block, and the approved non-gating exception must be surfaced by exact name. | VERIFIED | Exact seven identities/classifications and proof sets in production; fresh unresolved-row and missing-proof tests pass. No silent row deletion, proof substitution, or unrecorded specification claim. |

**Score:** 23/24 truths verified; 0 present-but-behavior-unverified; 1 historical fact uncertain with an explicit user acceptance exception. One acceptance override is applied; no new regression exists. The backstop tag in Plan 15 was evaluated explicitly; a parser token alone was not treated as proof of the external DOM fact.

### Required Artifacts

| Artifact | Expected | Status | Substantive implementation and wiring |
|---|---|---|---|
| `SELECTORS.md` | Complete recorded ledger and derived verdict | VERIFIED | 18 entries, human handoff, corpus provenance, seven-row table and structured final fields; consumed by CLI and regression tests. |
| `scripts/verify-recon-gate.js` | Production final/evidence validator | VERIFIED | 735 lines; parses entries/questions/verdict/assumptions, checks per-ID contracts and production interaction assessor; CLI validates real manifest first. |
| `scripts/sensitive-patterns.js` | Shared policy | VERIFIED | NFC normalization, mandatory denylist, frozen code/category findings; sanitizer and corpus imports use it. |
| `scripts/sanitize-fixture.js` | Bounded one-way transformation | VERIFIED | 336 lines; external canonical custody, size bounds, shared parse/output policy, immutable input and exclusive output; CLI/library and tests share path. |
| `scripts/sanitized-output-contract.js` | Shared pure grammar | VERIFIED | 338 lines, no filesystem import; owned-table parsing, attributes/ARIA/text and header rules; producer and consumer both call it. |
| `scripts/fixture-contract.js` | Corpus admission | VERIFIED | 454 lines; canonical preflight, hashes, scan, grammar, detached parse, actual header binding and scenario validation; called from final CLI and tests. |
| `scripts/interaction-evidence.js` | Production paint/privacy grammar | VERIFIED | 184 lines; closed fields/counts/owner/scenario, bounded paint and canonical equality; one definition shared with tests. |
| `package.json`, `package-lock.json`, `vitest.config.js` | Exact toolchain and test discovery | VERIFIED | Exact pins, no runtime deps, supported engines, Node smoke and Happy DOM Vitest globs. Approval history remains row 8. |
| `DEPENDENCY-APPROVALS.md` | Truthful version/approval record | VERIFIED as record | Rows bind to pins via five passing tests; uncertainty explicitly preserved, not an artifact stub. |
| `test/fixtures/zendesk-view-priority-present.html` | Canonical four-label structural projection | VERIFIED | 16 headers, four ordered ticket rows and exact labels; checksum, grammar and round-trip pass. |
| `test/fixtures/zendesk-view-priority-absent.html` | Genuine absence control | VERIFIED | Six headers/four ticket rows; no Priority header/value; actual header binding prevents body-row substitution. |
| `test/fixtures/zendesk-view-grouped-long.html` | Group/sticky/scroll structure | VERIFIED | Fifteen headers, twelve ordered ticket rows and one group row, same-table header/scroll ownership; round-trip passes. |
| `test/fixtures/manifest.json` | Exact source declarations and structural assertions | VERIFIED | All three current hashes and full scenario matrix admitted; prior structural/selector declarations unchanged. |
| Eight `test/recon/*` files | Contract and regression evidence | VERIFIED | Active globs, production imports, explicit negative and positive checks; test-quality audit below. |
| `01-SECURITY.md` | Independent threat/prohibition dispositions | VERIFIED as governance record | 68/68 threat IDs closed; two IDs share explicit risk acceptance AR-01-13. Historical independence remains not-attested. |
| Checkpoint 10 and decisions 12/15 | Human evidence and scope decisions | VERIFIED as records | Exact answers and constraints read directly; no fresh facts inferred. |

All fifteen plan artifact/key-link queries ran. Their shallow checks returned three expected historical mismatches: deleted `test/recon/sensitive-patterns.js` (explicitly moved by 09), replaced `REQUIRED_LIVE_EVIDENCE_IDS` export (explicitly promoted to `REQUIRED_LIVE_EVIDENCE` by 14), and consumed `state: marker-staged` link (planned successor in 05). Plan 02 declares no artifacts. These are documented successor contracts, not missing current deliverables or new overrides. Generic “pattern found” responses were cross-checked against actual imports/calls.

### Key Link Verification

| From | To | Via | Status / evidence |
|---|---|---|---|
| Sanitizer | Production scanner | `finalMarkup → scanSensitiveContent` | WIRED; runs before shared validation and exclusive write. |
| Sanitizer | Shared output grammar | `parseBoundedCapture / validateSanitizedOutput` | WIRED; named corrupt-product test proves fail-before-write. |
| Corpus validator | Scanner → grammar → detached parser | Ordered direct calls | WIRED; named DOMParser-spy test proves scan-before-parse. |
| Corpus validator | Manifest and exact fixture files | Canonical preflight, SHA-256, actual header, scenario assertions | WIRED; committed-corpus and adversarial header/alias tests pass. |
| Final CLI | Corpus validator → ledger function | Await complete matrix then pass `corpus.scenarios` | WIRED; final command independently validates real files. Library caller supplies admitted scenarios by declared API contract. |
| Final ledger | Production interaction assessor | `collectBlockingPredicates` | WIRED; equivalence rejection exercised through final mode. |
| Final ledger | Per-ID map, enums and assumptions | `requireFinalEvidence`, `assumptionBlockers` | WIRED; relabeling, order and unresolved-gating tests pass. |
| Final ledger | Registered proof paths/cases | `FALLBACK_PROOFS / ASSUMPTION_PROOFS` | WIRED; rejects unrelated existing files and unbound references. Reference presence is supplemented here by behavioral execution. |
| Tests | Current committed corpus | Default manifest plus optional `GSD_FIXTURE_MANIFEST` | WIRED; positive committed-corpus test passed independently of synthetic harness cases. |
| Approval record | Package and lock resolutions | Dependency smoke file | WIRED; five fresh checks pass without asserting historical independence. |
| Recorded DOM result | Phase 2 acceptance | Explicit final rationale and independent verification/security gates | DOM result is proceed; advancement remains CLOSED until the human/security disposition. |

### Data-Flow Trace (Level 4)

There is no authored product UI or database in this phase. The actual evidence/admission flow, rather than fictitious rendered application data, was traced.

| Source | Processing | Output | Status |
|---|---|---|---|
| Previously observed English live DOM | Exact probes and sanitized direct results, retained human provenance/control judgments | SELECTORS ledger | FLOWING — historical observed evidence; no fresh session claimed. |
| Approved previously sanitized repository bytes | External temporary input, deterministic sanitizer, shared scan/output grammar | Three current fixture files | FLOWING — each exact second pass reproduced bytes/hash. |
| Manifest + canonical fixture bytes | Actual hashes, grammar, detached selectors, actual header identity, scenario assertions | Three admitted scenarios | FLOWING — complete current corpus test passes; no empty hardcoded manifest bypass. |
| Admitted scenarios + real ledger | Per-ID/interaction/root/fallback/assumption predicates | CLI proceed | FLOWING — current positive result plus targeted rejection evidence. |
| Historical human answers | Verbatim record and package/lock consistency checks | Two exact approvals attested; independence not-attested | FLOWING WITH DECLARED LIMITATION — no code path manufactures the missing event. |

### Behavioral Spot-Checks

Fresh verifier execution used the following exact command forms. Every named test invocation completed in under one second; no server or external service started. Temporary fixture writes were confined to existing test harnesses and cleaned by their teardown. No source, captured tenant data, or operational state was modified.

- `V(file, name)` = `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/recon/<file> -t '<name>'`.
- `N(file, name)` = `node --test --test-name-pattern='<name>' test/recon/<file>`.

| Behavior | Command / exact named case | Result |
|---|---|---|
| Mixed-child rejection and no output | V(sanitize-fixture.test.js, rejects a mixed td/th header before it can preserve wrong-column Priority text) | PASS — 1 test |
| External denylist custody/alias | V(sanitize-fixture.test.js, rejects a denylist inside the worktree, directly or through an outside symlink) | PASS — 1 |
| Corrupt product rejected before write | V(sanitize-fixture.test.js, validates its own serialized product before any write) | PASS — 1 |
| Normalized scan precedes parse | V(fixture-contract.test.js, normalizes a canonical generic-rule hit and scans before any detached parse) | PASS — 1 |
| Actual header binding | V(fixture-contract.test.js, audit: a body-row header selector cannot conceal the real Priority header) | PASS — 1 |
| Three aliases cannot form matrix | V(fixture-contract.test.js, rejects three relative aliases of a single multi-table file) | PASS — 1 |
| Actual committed corpus offline | V(fixture-contract.test.js, the selected admitted corpus satisfies the complete non-vacuous contract) | PASS — 1 |
| Three exact corpus round trips | Three separate V(corpus-provenance.test.js, <scenario>: re-sanitization preserves exact bytes and manifest hash), scenarios priority-present-ungrouped, priority-absent, grouped-long | PASS — 1 each |
| Coded null root | V(fixture-contract.test.js, rejects malformed manifest root null with a stable code) | PASS — 1 |
| Stable blocker order | N(recon-gate.smoke.js, blocker ordering does not depend on ledger section order) | PASS — 1 |
| Equivalent paint rejected | N(recon-gate.smoke.js, audit: equivalent transparent paint cannot masquerade as distinct states) | PASS — 1 |
| Unrelated fallback proof rejected | N(recon-gate.smoke.js, audit: existing unrelated test files cannot prove a fallback rung) | PASS — 1 |
| Null-only root proof rejected | N(recon-gate.smoke.js, null-shadowRoot alone does not rule out a closed root) | PASS — 1 |
| Unresolved gate row rejected | N(recon-gate.smoke.js, CR-10: declared-input-unresolved blocks a gating row) | PASS — 1 |
| Required English IDs cannot be relabeled | N(recon-gate.smoke.js, required evidence cannot be relabeled as localization-only) | PASS — 1 |
| Unbound assumption references rejected | N(recon-gate.smoke.js, resolved gating rows need bound proof references) | PASS — 1 |
| Structured metadata injection rejected | N(recon-gate.smoke.js, audit: new verdict metadata uses closed identifiers and proof tokens) | PASS — 1 |
| Stable scanner findings | N(sensitive-patterns.smoke.js, deduplicates overlapping matches and returns findings in stable order) | PASS — 1 |
| Canonical Unicode denylist match | N(sensitive-patterns.smoke.js, rejects NFD content against NFC denylist with value-free findings) | PASS — 1 |
| Version record consistency | `node --test test/recon/dependency-approvals.smoke.js` | PASS — 5 |
| Complete evidence command | `node scripts/verify-recon-gate.js evidence SELECTORS.md` | PASS — EVIDENCE READY: 18 terminal entries |
| Real final command | `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` | PASS — FINAL VERDICT: proceed |
| Private path rejection | Same final CLI with a nonexistent temporary ledger path | Expected exit 1; only RECON_GATE_REJECTED ledger-readable-required |
| Readmission structure preservation | Read-only Node deep comparison with `git show f391241:test/fixtures/manifest.json`, excluding only sha256/sanitizationMethod/priorityHeaderIndex | PASS — all 3 entries identical in remaining fields |

**Fresh behavioral result:** 26 passing tests (21 individually selected cases plus 5 dependency cases). Vitest's other cases were deselected by `-t`; those displayed skips are selection exclusions, not disabled requirements.

The independent source review already records a full **173 passed (65 Node + 108 Vitest)** on the same source, and security independently rechecked the focused final paths. That full result is attributed to those reviews; it was not re-run or claimed as this verifier's execution. All newly scored ordering/no-write/parity invariants above have fresh behavioral evidence. Previously verified historical observations retain their explicit human dispositions.

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` files or phase-declared shell probe files exist. No missing probe artifact is alleged. The phase's declared executable checks are Node/Vitest commands; the verifier independently ran the relevant gate/negative commands above. Inline probe claims in summaries were not substituted for execution.

### Requirements Coverage

| Requirement | Source plans | Description | Status | Evidence and limit |
|---|---|---|---|---|
| RECON-01 | 01–15 | Captured real-view outerHTML fixture committed and usable offline | SATISFIED within approved provenance | Current three-file corpus passes real admission and exact parity; historical live-origin judgment retained; normalized structural projection and approved repository-byte re-admission explicitly disclosed. Not fresh capture. |
| RECON-02 | 01–15 | Every English-path assumption answered live and recorded; localization outside scope | SATISFIED within recorded scenarios | Fifteen complete live entries; positive interaction evidence, observed English signal, explicit disproofs/fallbacks and excluded localization entries. Seven planning assumptions separately accounted. |
| RECON-03 | 01–15 | Closed Shadow DOM and Garden-absence risks ruled in/out | SATISFIED within recorded scenarios | Direct root/reachability observations and current Garden pairs; invalid null-only proof and unproven fallback rejected. |

All three roadmap-assigned requirement IDs occur in the phase plans; **orphaned requirements: 0**. These requirement findings do not close the separate phase-level historical approval/security gate. REQUIREMENTS.md and roadmap/state remain orchestrator-owned and were not edited by this verifier.

### Prohibition Coverage

Thirty-six declarations were found: five object-form inherited entries in Plan 04 and thirty-one string-form entries in Plans 09–15. String forms have no authored tier; they are grouped by obligation below and resolved with actual enforcement evidence or previously explicit human decisions. Repeated declarations are all mapped using plan.item notation. No unwired test-tier item or new unaccepted judgment is silently green.

| Group | Declarations | Obligation | Disposition / evidence |
|---|---|---|---|
| P1 | 04.1, 09.1, 10.2, 11.1, 12.2, 13.2, 14.2, 15.3 | No tenant content/identifying metadata/private path in admitted artifacts/default diagnostics | VERIFIED — shared scanner/output grammar, strict paint and metadata, custody and code-only diagnostics; current safe evidence inspected. Historical session confidentiality is limited to the retained judgment, not universally inferred from tests. |
| P2 | 04.2, 11.2, 12.1, 13.1 | No toy capture represented as live; no fabricated re-admission structure | VERIFIED — existing Plan 08 live-origin judgment plus explicit decision 12; manifest source limitation, original Git record, unchanged structural fields, grammar/parity/canonical identity. Tests prove current conformance, not historical live origin. |
| P3 | 04.3, 09.2, 14.1, 15.1 | No English evidence generalized to locale/shell/domain/plan | VERIFIED — recorded bounds and active all-ID relabeling rejection; observed disproofs retained. |
| P4 | 04.4 | Operational actions and authentication remain user-controlled | VERIFIED by existing human judgment — historical security record and SELECTORS handoff; earlier recovered read-only navigation incident remains disclosed. No new browser session. |
| P5 | 04.5, 14.3, 15.2 | Null shadowRoot is not conclusive | VERIFIED — recorded two-part observations and fresh named negative final-gate test. |
| P6 | 09.3, 11.3, 12.5, 13.3, 14.4, 15.5 | No blocker closed by stand-in/deferral/risk-acceptance narrative | VERIFIED — production fixes and targeted counterexamples close all three prior technical concerns; no later-phase deferral or risk override used. Decisions 12/15 explicitly approve the identified contract corrections. |
| P7 | 09.4, 11.4, 12.4 | Do not weaken rejection policy merely to pass corpus/tests | VERIFIED — shared grammar enforcement, corrupt-product rejection, exact parity and preserved structural fields. Header-token preservation is the planned contract; approved token renumbering is documented. Bounded observed-paint support rejects unsupported alternatives rather than fabricating observations. |
| P8 | 10.1 | Do not invent independent approval | VERIFIED — separate verbatim not-attested answer retained; truth 8 remains uncertain. |
| P9 | 10.3 | Do not use SUMMARY as approval proof | VERIFIED — checkpoint 10/approval record are the evidence; SUMMARY affirmative claim is not used. |
| P10 | 12.3 | Absence control must gain neither Priority header nor value | VERIFIED — actual header-bound corpus admission and current absence parity/structure. |
| P11 | 13.4 | Purpose string alone cannot satisfy an assertion | VERIFIED — required kind map and topology checks; wrong-kind and false-header regressions are active. |
| P12 | 14.5 | Test-local assessor cannot be stricter than production | VERIFIED — one production definition imported by both callers and final-mode negative test. |
| P13 | 15.4 | No declared gate input silently dropped | VERIFIED — seven exact identities, bound proof sets and exact surfaced exception; negative tests pass. |
| P14 | 15.6 | Verdict must be gate output rather than target | VERIFIED — decision 15 explicitly authorizes either outcome; unmodified current ledger/corpus command returns its recorded proceed; separate phase/security limitation remains explicit. |

No new prohibition override was applied. Existing judgments were not re-requested. The unresolved independence fact is a positive must-have/human item, while faithfully recording that uncertainty satisfies the negative prohibition against inventing it.

### Test Quality Audit

| Test file | Linked requirements | Active inventory | Disabled | Circular expected oracle | Strongest evidence | Finding |
|---|---|---:|---:|---|---|---|
| sensitive-patterns.smoke.js | RECON-01/02 | 10 | 0 | No | Exact findings/codes, Unicode and order | Production scanner, positive and negative cases. |
| dependency-approvals.smoke.js | Phase prerequisite; RECON-01/02/03 traceability | 5 | 0 | No | Exact record/package/lock values | Consistency only; deliberately does not prove historical independence. |
| interaction-evidence.smoke.js | RECON-02 | 11 | 0 | No | Positive/blocked states and paint rejection | Production assessor; explicit observed-computed-paint support boundary. |
| recon-gate.smoke.js | RECON-02/03 | 39 | 0 | No | Mutated real-ledger rejection, blocker arrays, CLI integration | No remaining 14-era todo; case/order/proof/metadata regressions active. |
| sanitize-fixture.test.js | RECON-01/02 | 42 | 0 | No | Output absence/input immutability, exact bytes, CLI and DOM seams | Mixed-child, custody, output-corruption and header parity cases present. |
| sanitized-output-contract.test.js | RECON-01/03 | 18 | 0 | No | Exact acceptance summary and rejection codes | Independent explicit invalid structures/attributes/text. |
| corpus-provenance.test.js | RECON-01 | 11 | 0 | No, within stated claim | Current committed bytes versus re-sanitized bytes/hash; mutation negative | Proves parity/conformance, not real-world origin or original labels. |
| fixture-contract.test.js | RECON-01/03 | 37 | 0 | No | Exact scenario/structure, parser spy, aliases and actual header | Synthetic harness is supplemented by default committed-corpus test. |

**Disabled requirement tests:** 0. **Circular expected-value generators:** 0 found. **Insufficient assertions for the claimed software behaviors:** 0.

Test filesystem writes create isolated input corpora, deliberate mutations and temporary sanitizer outputs; they do not generate the expected committed fixture from the system under test before comparing it. Hash generation for synthetic input integrity is not a live-provenance oracle. The corpus parity test asserts the deliberately narrow idempotence contract; treating it as proof of live origin would be circular reasoning, and this report does not do so.

Disconfirmation checks: (1) package history remains partially established; (2) passing dependency and synthetic fixture tests do not establish historical/live facts; (3) default missing-ledger error path was directly invoked and stayed value-free. For the Plan 15 backstop, negative parser tests alone are insufficient; the recorded direct root-chain/reachability observations provide the external evidence. No undeclared production precondition or incidental ordering was used to upgrade an untested invariant.

### Anti-Patterns and Regression Review

No unreferenced TBD/FIXME/XXX, TODO/HACK/PLACEHOLDER, disabled tests or todos were found in phase source/tests/current evidence. Empty arrays are populated accumulators or intentional negative inputs; null Priority indexes represent proven absence. TEXT/ARIA placeholders are the explicit sanitization product, not empty implementation.

The clean 01-REVIEW.md and the then-blocked 01-SECURITY.md were read during independent technical verification. The subsequent acceptance addendum resolves the sole governance issue; it does not replace the independent technical audits.

| Prior concern | Current evidence | Result |
|---|---|---|
| CR-01/02/03/04/11 sanitizer/privacy/grammar | Shared production paths and fresh mixed-child, normalized scan, custody, output, parity and CLI checks | Closed |
| CR-05/06 corpus semantics/identity | Actual shared-parser header binding, required kinds, canonical preflight and fresh false-header/alias tests | Closed |
| CR-07/08/09/10 final evidence gate | Exact IDs, bounded canonical paint, registered proof contracts, parsed assumptions and fresh negative cases | Closed |
| CR-12 structured metadata | Closed unproven-proof and flagged-ID tokens; named injection test | Closed |
| WR-01/02/03/04 | Engine intersection, root guard, production scanner location, direct-cells vocabulary | Closed; source and focused evidence agree |
| Old seven-unresolved/proceed contradiction | Explicit decision 15, six test-bound gating rows plus one surfaced exception | Closed under approved contract |
| Historical dependency approval independence | Two exact-version yes answers; separate answer cannot attest | ACCEPTED EXCEPTION / AR-01-13; history remains not-attested |

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts.

The canonical non-blocking decision-coverage query returned **16/16**, with no not-honored entries. Direct inspection retained D-01/D-03 user-control/confidentiality limits, D-05 English-only scope, D-09–12 corpus/source facts, and D-13–16 evidence/verdict wiring. The explicitly approved 12/15 decisions refine implementation details without inventing new observations.

### Human Verification — Resolved by Explicit Risk Acceptance

#### 1. Historical independence of dependency approvals

**Resolution:** User explicitly stated “risk accepted” after the gap and consequence were explained. See 01-RISK-ACCEPTANCE.md and AR-01-13. The following test describes the original question; its governance disposition is now resolved, with historical independence still not-attested.

**Test:** Resolve the original separate-approval fact from an independent contemporaneous record or a truthful historical re-attestation based on recollection. If no such evidence exists, choose an explicit governance disposition that keeps the fact unproven.

**Expected:** Truth 8 and the security dispositions for T-01-05/T-01-SC agree with that explicit decision. A later “continue”, package-consistency test, source/provenance re-admission approval or derived-verdict approval cannot supply it.

**Why human:** The user already said they do not remember. Repeating the same technical tests cannot answer a historical question. This report preserves the existing answer rather than asking the user to invent certainty.

All deferred human-check blocks were accounted for: Plans 02/04/06/08 retain their prior explicit session/provenance/control judgments; Plan 10's truthful record is complete but its historical independence truth remains uncertain; decisions 12/15 resolve their stated source/contract questions. No new live session is requested. Product UI acceptance is not applicable to this reconnaissance/tooling phase; 01-UI-REVIEW.md correctly records not_applicable.

### Deferred Items

No actionable technical gap was deferred. The full later-phase roadmap was checked: tinting, liveness, toolbar controls and store publishing do not own the historical approval event or any Phase 1 admission repair. RECON-01/unclassified is an approved, explicitly surfaced non-gating specification limitation, not a secretly deferred failed must-have.

### Outcome

Three prior technical gap groups are closed; **23/24 truths are verified**, with one explicitly accepted historical uncertainty and no behavior-unverified software invariant. The sole human item is resolved by the user’s separate risk acceptance. Security has zero open threats; status is **passed with one acceptance exception**. Phase completion may proceed without claiming the missing historical fact was proved.

No source edits, dependency installations, authenticated actions, commits, requirement updates or roadmap/state updates were performed by this verifier.

---

_Verified: 2026-09-08T07:34:03Z_
_Verifier: the agent (gsd-verifier)_

## Acceptance Addendum — 2026-09-08

The orchestrator recorded the explicit user risk disposition after the independent verifier completed its technical review. Source remains 1341022; no technical findings or source checks were changed. The single pending UAT item passed through the governance-disposition option stated in this report. This addendum changes acceptance status only; it does not inflate the independent technical score to 24/24 or alter the original not-attested record.
