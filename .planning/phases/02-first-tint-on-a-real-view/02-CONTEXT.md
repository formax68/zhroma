# Phase 2: First Tint on a Real View - Context

**Gathered:** 2026-09-08
**Status:** Ready for planning
**Decision authority:** The user delegated the three remaining appearance/edge-behavior choices: "sensible defaults on those should be fine". Defaults below were selected by the agent under that delegation; they are not individually chosen user answers.

<domain>
## Phase Boundary

Deliver the first working priority tint on initial load of a real English current Zendesk Agent Workspace view, with no configuration. Read the Priority column by its header, render four distinct translucent full-row tints, preserve native interaction states and legibility, and establish the stylesheet-only palette and minimal Manifest V3 permission contract.

This covers DETECT-01, DETECT-02, TINT-01 through TINT-05, CTRL-01, STORE-02, STORE-03, and STORE-05. Sorting may clear tints in this phase; persistent reapplication belongs to Phase 3. Toolbar status, hints, and the persistent on/off control belong to Phase 4; public publication belongs to Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Palette and Emphasis — Delegated Defaults
- **D-01:** Use conventional warm-to-cool priority colours: Urgent soft red, High soft orange, Normal soft yellow, and Low soft green. All four receive a distinct tint; do not introduce a fifth colour for missing or unknown priority. These are product defaults, not a claim about Zendesk's own palette.
- **D-02:** Keep the treatment pale and translucent so a dense list remains comfortable to read. Urgent has the strongest visual emphasis, High next, with Normal and Low quieter but still distinguishable. Do not add flashing, animation, badges, stripes, or text recolouring. Exact colour values and opacity are implementation discretion, constrained by the glance test, text legibility, and live-state validation.

### Hover, Selection, and Unread Rows — Delegated Defaults
- **D-03:** Retain priority tint during hover and selection, composited with Zendesk's existing paint. Native hover/selection must remain clearly distinguishable, including the first-cell selection indicator. Preserve unread/bold text and normal focus/click behavior. If the tint obscures those states, reduce its opacity during those states through CSS; do not replace native highlight colours or interaction handlers.
- **D-04:** Follow the observed paint boundary: tint only direct cells of positively identified ticket rows, leaving Zendesk's row paint and first-cell inset indicator intact. Do not apply colour to sticky headers, group headers, wrappers, or unrelated page elements. The visual full-row effect must not depend on overwriting the native row background.

### Blank and Unreadable Priorities — Delegated Defaults
- **D-05:** In a positively identified, supported English table with an unambiguous Priority column, whitespace-only or empty Priority cells remain untinted. Other rows with exact recognised labels are tinted normally. Never infer Normal or Low from an empty cell, and never present an all-blank column as a missing column. This explicitly distinguishes a deliberately uncoloured blank row from a failed partial application.
- **D-06:** A non-empty unrecognised priority value, an ambiguous header, missing expected cells, or an unsupported language makes the table unsafe to colour. Leave that table untinted, including otherwise recognised rows; do not guess from substrings, nearby text, icons, or position. Validate the candidate table before applying markers so a late unreadable row does not leave earlier rows coloured. No Priority column also means no tint. Phase 2 adds no popup, hint, or locale diagnosis; Phase 4 retains ownership of the three-state user-facing failure behavior. Phase 3 retains ongoing cleanup/reapplication responsibility.
- **D-07:** Use the Phase 1 evidence-supported English boundary and exact trimmed labels: `Priority`, `Urgent`, `High`, `Normal`, and `Low`, in the supported `html[lang="en"]` shell. Blank versus unknown is a conservative rendering policy, not a new claim about the meaning of empty live cells. The observed corpus does not establish broader locale or shell compatibility.

### Carried-Forward Product and Evidence Constraints
- **D-08:** Zero setup, default enabled, full-row tint only, with all palette values in a stylesheet driven by one namespaced row data attribute. JavaScript identifies priority and sets the attribute; it does not contain the product palette. No bundler, minification, remote code, telemetry, or network calls. The loaded extension assets must be byte-identical to their repository source.
- **D-09:** Preserve the settled manifest contract: Manifest V3, `storage` as the only permission, no `host_permissions` block, and content scripts matching only `https://*.zendesk.com/agent/*`. Storage is reserved for the later default-on boolean; no ticket content is persisted. Do not reopen the permission decision or add permissions for test convenience.
- **D-10:** Reuse the admitted Garden/test-id selector strategy and resolve header ownership in the same table as the candidate rows. Preserve the proven boundary even though Phase 3 owns expanded grouped/sticky-header coverage. Do not promote an unproven fallback to production merely because an older research sketch suggests it.
- **D-11:** Validate the final tint against actual native hover, selection, unread/bold states, and all four priority colours in the supported light interface. Offline fixtures establish parsing and marker behavior; they do not prove visual compositing. Preserve the existing authenticated workflow: the user controls login, MFA, sensitive navigation, account actions, and live interaction checkpoints. Operational tickets and saved views are not changed by the agent. Any retained live evidence must satisfy the existing sanitization/privacy boundary.
- **D-12:** Carry Phase 1's passed verification with its explicit AR-01-13 accepted exception. Historical package-approval independence remains not-attested. Existing fixture provenance is approved repository-byte re-admission, not a fresh capture. Do not convert either limitation into stronger evidence or install unapproved dependency versions.

### the agent's Discretion
- Choose and tune exact CSS colours, opacities, and state-specific reductions without asking for individual shade approvals. Keep the D-01 colour mapping and D-02/D-03 outcomes.
- Choose the namespaced attribute, extension source folder, file names, module/test organization, and initial-load readiness mechanism within the no-build/no-network constraints.
- Reuse the installed exact-version test tools. Identify any additional dependency need during research; user delegation of visual defaults does not approve new packages.
- Reconcile the roadmap's literal "no JavaScript file in the repo contains a colour value" wording with existing recon evidence parsers/tests, which already contain RGB strings. Product palette separation is mandatory; do not silently delete historical evidence or claim a literal repository-wide check passes when it does not.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.** No new external specification was supplied during discussion.

### Scope and Acceptance
- `.planning/ROADMAP.md` — Phase 2 goal, eleven requirements, five success criteria, accepted sorting gap, and later phase boundaries.
- `.planning/REQUIREMENTS.md` — Tint composition, legibility, native states, minimal permissions, zero setup, failure behavior, and v2 exclusions.
- `.planning/PROJECT.md` — Glance test, English current Workspace boundary, full-row default, and zero-network product constraints.

### Evidence and Existing Contracts
- `SELECTORS.md` — Current evidence ledger, exact selector/English fallback contract, direct-cell paint boundary, native interaction evidence, and proceed verdict.
- `test/fixtures/manifest.json` — Admitted fixture scenarios, selector topology, checksums, and re-admission provenance.
- `.planning/phases/01-dom-recon-spike/01-CONTEXT.md` — User-controlled live inspection and confidential evidence handling.
- `.planning/phases/01-dom-recon-spike/01-VERIFICATION.md` — Passed Phase 1 verification and explicit accepted exception.
- `.planning/phases/01-dom-recon-spike/01-RISK-ACCEPTANCE.md` — AR-01-13; historical independence is not retroactively attested.
- `DEPENDENCY-APPROVALS.md` — Exact-version dependency approvals and limits.

### Earlier Research — Reconcile Against Current Evidence
- `.planning/research/ARCHITECTURE.md` — Architecture and verification-ledger starting points; current SELECTORS evidence takes precedence over old hypotheses.
- `.planning/research/STACK.md` — No-build extension and test starting points. Sample colours, CSS targeting, and old permission/privacy examples are not locked decisions and must be reconciled with this context and current requirements.
- `.planning/research/PITFALLS.md` — DOM fragility and failure cases to consider during phase research.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `test/fixtures/zendesk-view-priority-present.html`, `test/fixtures/zendesk-view-priority-absent.html`, and `test/fixtures/zendesk-view-grouped-long.html` provide admitted offline structural examples. Do not overwrite them with synthetic edge cases; add clearly labelled synthetic cases separately.
- `scripts/fixture-contract.js` and `test/recon/fixture-contract.test.js` already validate fixture admission, topology, and hashes.
- `scripts/interaction-evidence.js` and `scripts/verify-recon-gate.js` preserve the Phase 1 interaction/evidence contracts.

### Established Patterns
- There is no shipped extension source or manifest yet; existing JavaScript is recon tooling and tests.
- `package.json` provides Node smoke tests plus Vitest 4.1.11 / happy-dom 20.13.1. `vitest.config.js` currently includes only `test/recon/*.test.js`; product tests require deliberate discovery configuration.
- Production evidence helpers live under `scripts/`; avoid importing developer-only fixture or sanitization code into shipped browser assets.

### Integration Points
- New manifest, content-script JavaScript, and declarative CSS form the first product surface, with a separate runtime asset boundary from recon tooling.
- Product detection tests can load the admitted fixtures and vary column order synthetically while retaining their recorded provenance.
- The single row attribute and CSS palette are the styling seam for later liveness and controls; no observer expansion, popup, or store submission is implied by this discussion.

</code_context>

<specifics>
## Specific Ideas

- The user requested sensible defaults for all three presented areas rather than a detailed design interview. The exact palette and conservative unknown-value rule were selected by the agent under that authority.
- Priority should be visible while scanning the list, with Urgent immediately noticeable and native selection still unmistakable.
- The real Phase 1 observations included many empty-or-unreadable cells. Their presence is an everyday rendering case, not permission to invent priorities.

</specifics>

<deferred>
## Deferred Ideas

None newly introduced. Preserve existing scope: continuous reapplication and broad fail-quiet cleanup in Phase 3; toolbar states, hints, and persistent toggle in Phase 4; public publishing in Phase 5; dark mode, colourblind-safe palette, custom colours, alternate treatments, and additional locales in v2.

</deferred>

---

*Phase: 02-first-tint-on-a-real-view*
*Context gathered: 2026-09-08*
