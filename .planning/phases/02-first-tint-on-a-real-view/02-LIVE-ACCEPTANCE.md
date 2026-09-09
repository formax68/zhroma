# Phase 02 Live Acceptance

Updated 2026-09-09. **Product acceptance: passed within the tested Phase 2 scope.**
Eleven source-bound live checks and twelve explicit scope/prohibition decisions
are recorded in 02-UAT.md. Independent code/security/goal gates remain separate.

## Initial-entry investigation and clarification

The original report was interpreted as both an in-app and direct fresh-document
failure. On 2026-09-09 the user clarified the demonstrated steps as “open zendesk,
click the view” and confirmed the earlier fresh-tab report meant that same
sequence. G-02-1 is reclassified to existing Phase 3 in-app navigation scope;
no Phase 2 repair was implemented or claimed.

Read-only aggregate controls: the earlier full reload and direct-view load had
22 Normal markers and eight unmarked blanks. The later demonstrated in-app view
had 30 rows, five High priorities, 25 blanks and zero markers, with valid current
structural seams. Direct full-address entry to that same view produced five
markers among 30 rows. No injection/disposal timeline, exact startup timing or
naturally delayed-batch coverage was captured. The 15000/100 ms constants below
are source settings, not a universal readiness guarantee.

The user previously confirmed the repository extension folder and required
reloads. All three hashes were recomputed and remain unchanged. The user owns
login, MFA and sensitive interactions. Temporary control tabs were closed;
no ticket edits, account changes, screenshots, raw DOM or private identifiers
are retained in this report.

## Machine-readable record

This is the canonical source-bound record. Existing authentic appearances,
native-state checks and explicit decisions retain their original evidence.

```json
{
  "schema_version": 1,
  "status": "passed",
  "scope": {
    "language": "English",
    "html_lang": "en",
    "shell": "current Agent Workspace",
    "interface": "light"
  },
  "runtime_sha256": {
    "manifest.json": "0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6",
    "content.js": "35051cca30a12217e121d270715b70616b3deeaca1e697b7904358516f29cd70",
    "zhroma.css": "f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61"
  },
  "loaded_from_repository": true,
  "settings": {
    "STARTUP_DEADLINE_MS": 15000,
    "SETTLE_MS": 100,
    "palette": {
      "Urgent": "rgb(220 38 38 / 0.14)",
      "High": "rgb(234 88 12 / 0.12)",
      "Normal": "rgb(202 138 4 / 0.09)",
      "Low": "rgb(22 163 74 / 0.08)"
    }
  },
  "checks": [
    {
      "id": "initial-load",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "On 2026-09-09 the user clarified both earlier reports meant opening Zendesk then clicking the view, including in a fresh tab; no separate direct-view-address failure was reported. Earlier authentic full-reload and direct-view controls had 22 Normal markers and eight blank rows unmarked. A later direct entry to the demonstrated view produced five markers for its five High rows among 30 rows (25 blanks); the in-app-entry page had zero markers. The demonstrated issue belongs to Phase 3 in-app liveness. No runtime change. No precise startup timing or naturally delayed-batch coverage is claimed."
    },
    {
      "id": "urgent",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported \"Urgent works fine\" in response to the pale-red appearance and readability check."
    },
    {
      "id": "high",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"passed\" to the pale-orange appearance and readability check, with less emphasis than Urgent."
    },
    {
      "id": "normal",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" to pale-yellow appearance, readability and less emphasis than Urgent or High."
    },
    {
      "id": "low",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" to pale-green appearance, readability and less emphasis than Urgent or High."
    },
    {
      "id": "native-hover",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" to visible hover distinction, retained tint and readable text, including comparison with the extension disabled and a full reload."
    },
    {
      "id": "native-selection-inset",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" to checkbox selection remaining obvious with retained tint and the left-edge native indicator, including the unmodified baseline comparison."
    },
    {
      "id": "unread-bold",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" to an existing unread row retaining clear bold emphasis and readable text over the tint."
    },
    {
      "id": "focus-click",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" to normal visible keyboard focus and safe checkbox clicks, including the unmodified baseline comparison."
    },
    {
      "id": "reordered-reload",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" to correct priority mapping after moving the Priority column in a disposable test view and fully reloading."
    },
    {
      "id": "source-identity",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User replied \"pass\" confirming the repository extension folder and extension/page reload used throughout these checks. The reviewer recomputed all three SHA-256 hashes and confirmed they match the inventory."
    }
  ],
  "limitations": {
    "unresolved_observed_defects": [],
    "provenance": "Existing fixtures are approved repository-byte re-admission, not fresh captures or Phase 02 live observations.",
    "historical_approval": "AR-01-13 is an accepted historical exception; original package-approval independence remains not-attested.",
    "assumptions": "A1 is accepted within the observed direct-entry/full-reload scope, supported by the controls and the user clarification recorded in UAT; no universal timing guarantee or unobserved delayed-batch coverage. A2 has authentic user acceptance for four hues and native states. E01, E12, E13, E17, E19 and E20 were individually resolved by explicit user scope decisions in UAT; requirements remain binding. The earlier fresh-tab issue interpretation is superseded by explicit clarification that both reports meant opening Zendesk then clicking a view.",
    "prohibitions": "On 2026-09-09 the user explicitly accepted P-02-01 within the reviewed source and observed scope, supported by exact-header/label source evidence and column-reordering/blank-row observations. The user also accepted P-02-02 for the reviewed source and tested light-interface views, supported by four alpha cell-background rules, owned markers and accepted native-state checks. Both prohibitions remain binding; no waiver, exhaustive coverage or broader theme coverage is claimed. P-02-03 was explicitly accepted on 2026-09-09 for the reviewed local-only implementation, with no collection, persistence, telemetry, network calls or expanded permissions. This grants no new access and does not accept unresolved security threats or replace separate security review. P-02-04 was explicitly accepted on 2026-09-09 with compatibility claims limited to tested English current Agent Workspace views in the light interface; other languages, legacy interfaces and untested account plans remain unproven. P-02-05 was explicitly accepted on 2026-09-09 for the accurate record of ten source-bound live passes and one unresolved initial-load failure, retaining gaps_found, separate fixture evidence and source-change invalidation rules. The approval does not waive G-02-1. P-02-06 was explicitly accepted on 2026-09-09 with repository-byte re-admission and the original not-attested approval independence preserved, retaining AR-01-13 without a new exception. All six prohibition judgments are explicitly accepted within their recorded evidence limits; no startup-defect waiver is granted. Subsequent clarification reclassifies G-02-1 as existing Phase 3 in-app navigation scope; the earlier references to an open startup gap describe the historical judgment context. No source changed and no prohibition was waived.",
    "scope": "No cross-locale, legacy-shell, account-plan, dark-mode, colourblind-safe, Phase 3 liveness or store-publication acceptance is established.",
    "deferred_phase_3": "Opening Zendesk then clicking a view, switching views, sorting and Next/Previous pagination require Phase 3 liveness. These remain unimplemented and are not accepted as working."
  }
}
```

## Evidence handling and limits

Any runtime asset change requires fresh hashes/settings, loaded_from_repository
false, eleven pending live rows, extension reload and authentic retesting. Missing
coverage stays human_needed; an unresolved Phase 2 defect requires gaps_found.
Fixture tests cannot supply live observations. No source changed during 02-03.

Phase 3 in-app navigation, sorting, pagination and ongoing reapplication remain
unimplemented. No route hooks, wider matches or permissions were introduced.
Compatibility remains English current Agent Workspace in the tested light
interface. AR-01-13 remains a not-attested historical acceptance exception.

## Verification

2026-09-09 before record reconciliation: 65 Node smoke tests and 236 Vitest tests
passed (301 total); final recon verdict proceed. The focused evidence validator
is rerun after this record update. Historical observations and checkpoint details
are retained in 02-UAT.md, the debug record and Git history.
