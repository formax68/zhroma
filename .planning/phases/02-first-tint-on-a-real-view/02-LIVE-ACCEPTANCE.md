# Phase 02 Live Acceptance

Prepared on 2026-09-08; updated on 2026-09-09. **Product acceptance: gaps_found.**
The user reports tinting requires a reload after both in-app and fresh-tab entry.
The current untinted table recovered after an agent-controlled reload; one
independent fresh-tab attempt succeeded. The reported fresh-load failure remains
unresolved. Ten source-bound checks passed; initial-load failed based on the
user report. The user confirmed the repository folder and reload used throughout
testing. All three source hashes match the inventory below.

## Live investigation — 2026-09-09

- User authorized read-only inspection and navigation for this issue.
- Existing English view: 30 ticket rows, zero tint markers before reload.
- Full reload: 22 Normal rows marked, eight blank-priority rows unmarked.
- One temporary fresh tab to the same view: 22 Normal rows marked and eight
  blank-priority rows unmarked. Computed direct-cell backgrounds were
  `rgba(202, 138, 4, 0.09)` for Normal and transparent for unmarked rows.
- No failing fresh startup was independently reproduced; the original tab's
  entry history, transient startup state and cause remain unknown. No timing
  measurement or delayed-batch coverage is claimed.
- The temporary tab was closed; no tickets, saved views or account settings were
  changed. Only aggregate observations are retained here.
- UAT gap `G-02-1` retains the user's report. In-app view switching remains Phase
  3 scope; the fresh-load report remains a Phase 2 issue. No runtime edit made.
- User accepted all four priority appearances, hover, selection/inset, unread
  emphasis, safe focus/click behavior and Priority column reordering after reload.
  Individual answers and observation boundaries are retained in UAT and the JSON.
- User also reported that Next-page navigation clears tint. Pagination is an
  explicit Phase 3 follow-up in UAT; it does not close the fresh-load gap.
- At 2026-09-09T07:00:14Z all three repository hashes were recomputed and matched.
  The user then confirmed that this repository folder and the required reloads
  were used throughout testing. The source-bound records are now populated.

## Load and review the prepared extension

1. In Chrome, open `chrome://extensions`, enable Developer mode, and use **Load
   unpacked** to select this repository's existing **extension/** folder. Select
   that folder itself, containing `manifest.json`, `content.js`, and `zhroma.css`.
   There is no build step, copied distribution, or product configuration.
2. If Zhroma is already loaded, confirm its source directory is the same
   repository folder and press its extension reload control. The agent checks
   the three hashes below against the source before recording observations; the
   user confirms the chosen folder and extension reload. Neither confirmation
   alone establishes both source identity and loading.
3. The user opens an approved English current Agent Workspace view in the light
   interface and performs a **full page reload**. Login, MFA, sensitive navigation,
   native interactions and any safe view reconfiguration remain user-controlled.
   The supported document signal is `html[lang="en"]`; other shells/locales are
   outside this acceptance scope.
4. Follow the checks below, recording only the date, supported shell and
   non-identifying aggregate outcomes. Compare authentic native states with the
   unmodified appearance. The user can temporarily disable Zhroma and fully
   reload to establish a baseline, then re-enable it, reload the extension and
   fully reload the view before the final comparison. No bulk action is needed.
5. A Priority-column move is tested only when it can be done safely in a
   user-owned disposable view, followed by a **full page reload**. Do not alter
   operational tickets, operational saved views or account settings to obtain
   coverage. An unavailable priority/state or safe reorder remains pending.

The report is ready for the end-of-phase user-controlled product gate. No browser
or authenticated account action was performed while preparing it. No server or
package installation is needed for this unpacked extension.

## Required observations

Every row needs genuine observations against the final loaded bytes. State
coverage need not form a four-priority-by-every-state matrix; the four hue and
legibility checks and authentic native-state checks must each be covered.

| Check ID | What the user observes | Current result |
|---|---|---|
| initial-load | With no product configuration, the complete supported initial table receives the expected tints. Describe startup timing, whether initial rows arrived in delayed batches, and whether any initial batch was missed. Record the final 15000 ms deadline and 100 ms quiet interval as settings, not a universal guarantee. If no delayed batch occurs, say so; do not claim it was tested. Blank cells stay untinted; an unsafe table is intentionally refused. | fail |
| urgent | Authentic Urgent is soft red, distinguishable from the other three hues, legible and identifiable at a glance. Jointly compare emphasis: Urgent strongest, High next, Normal and Low quieter, with pale/translucent treatment throughout. | pass |
| high | Authentic High is soft orange, distinct and legible; confirm its emphasis relative to Urgent, Normal and Low. | pass |
| normal | Authentic Normal is soft yellow, distinct and legible with quieter emphasis. | pass |
| low | Authentic Low is soft green, distinct and legible with quieter emphasis. | pass |
| native-hover | Genuine hover remains clearly distinguishable from the baseline/normal state with tint retained and text readable. | pass |
| native-selection-inset | Genuine selection remains clearly distinguishable with tint retained; the native first-cell inset indicator is visible. Do not execute a bulk action. | pass |
| unread-bold | Existing authentic unread/bold text remains visible and readable. Do not manufacture an unread state by changing tickets. | pass |
| focus-click | Ordinary native focus and click behavior is preserved on approved safe controls. Do not open or change tickets to manufacture coverage; unavailable safe coverage stays pending. | pass |
| reordered-reload | After a user-owned safe Priority header/cell reorder and full page reload, tint mapping follows the current header position. This is not a Phase 3 live-reapplication test. | pass |
| source-identity | Confirm the same repository extension/ folder was loaded and reloaded; the agent confirms all three current hashes below. Observations refer to those final bytes. | pass |

## Machine-readable record

This is the single canonical JSON record. Empty observations mean **not observed**.
`scope` names the target boundary; it is not a claim that a session was opened.
The settings are measured source values awaiting authentic acceptance. The
defect inventory preserves unresolved reports even before loaded-source
confirmation permits a completed source-bound check row.

```json
{
  "schema_version": 1,
  "status": "gaps_found",
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
      "status": "fail",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reports that both in-app entry and opening a fresh tab require reload before tint appears. Read-only inspection found an existing untinted table, followed by correct tint after reload. One independent fresh-tab attempt succeeded; the reported fresh-load failure remains unresolved and its cause is unconfirmed. No delayed-batch or precise startup-timing coverage is claimed."
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
    "unresolved_observed_defects": [
      "G-02-1 (2026-09-09): User reports no tint until reload after both in-app and fresh-tab entry. Agent observed an untinted existing table recovering after reload; one independent fresh-tab attempt succeeded. Fresh-load failure cause remains unconfirmed. Source identity was subsequently confirmed by the user and repository hash verification."
    ],
    "provenance": "Existing fixtures are approved repository-byte re-admission, not fresh captures or Phase 02 live observations.",
    "historical_approval": "AR-01-13 is an accepted historical exception; original package-approval independence remains not-attested.",
    "assumptions": "A1 initial-load timing sufficiency remains unresolved under G-02-1. A2 appearance and native-state checks have user acceptance for the tested English light-interface views. On 2026-09-09 the user explicitly closed E01 with no additional behaviour beyond finding Priority by its header, E12 with no additional behaviour beyond preserving native hover, selection, unread emphasis and keyboard/click states, and E13 with no additional behaviour beyond pale translucent tints preserving readability and native row states in the light interface. E17 was explicitly closed as adding no separate requirement beyond first-load tinting without configuration; CTRL-01 and the unresolved G-02-1 remain binding. These are scope decisions, not executed unnamed edge tests or acceptance of the startup defect. E19 was explicitly closed on 2026-09-09 with no additional URL-matching behaviour beyond exactly https://*.zendesk.com/agent/*; STORE-03 remains binding. E20 was explicitly closed on 2026-09-09 with no additional behaviour beyond authored/loaded-source identity; STORE-05 and future source-invalidation, reload and retesting rules remain binding. All six unspecified edge placeholders now have explicit scope decisions in UAT.",
    "prohibitions": "On 2026-09-09 the user explicitly accepted P-02-01 within the reviewed source and observed scope, supported by exact-header/label source evidence and column-reordering/blank-row observations. The user also accepted P-02-02 for the reviewed source and tested light-interface views, supported by four alpha cell-background rules, owned markers and accepted native-state checks. Both prohibitions remain binding; no waiver, exhaustive coverage or broader theme coverage is claimed. P-02-03 was explicitly accepted on 2026-09-09 for the reviewed local-only implementation, with no collection, persistence, telemetry, network calls or expanded permissions. This grants no new access and does not accept unresolved security threats or replace separate security review. P-02-04 was explicitly accepted on 2026-09-09 with compatibility claims limited to tested English current Agent Workspace views in the light interface; other languages, legacy interfaces and untested account plans remain unproven. P-02-05 was explicitly accepted on 2026-09-09 for the accurate record of ten source-bound live passes and one unresolved initial-load failure, retaining gaps_found, separate fixture evidence and source-change invalidation rules. The approval does not waive G-02-1. P-02-06 was explicitly accepted on 2026-09-09 with repository-byte re-admission and the original not-attested approval independence preserved, retaining AR-01-13 without a new exception. All six prohibition judgments are explicitly accepted within their recorded evidence limits; no startup-defect waiver is granted.",
    "scope": "No cross-locale, legacy-shell, account-plan, dark-mode, colourblind-safe, Phase 3 liveness or store-publication acceptance is established."
  }
}
```

## Evidence handling and invalidation

- Only non-identifying aggregate facts belong in `evidence`: hue distinction,
  legibility, native-state preservation, startup completeness, safe reorder and
  source confirmation. Do not retain raw DOM, tenant URLs, ticket text, identifiers,
  screenshots or private paths. This validator checks evidence consistency; it
  cannot prove human truth or replace review of the privacy boundary.
- A completed row uses `pass` or `fail`, `evidence_kind: live`, a real calendar
  date and a nonempty observation. `loaded_from_repository` must be confirmed
  before recording completed observations. Synthetic test objects stay solely
  in test memory and cannot close a real row.
- Any missing authentic coverage means `human_needed`. A failed observation or
  unresolved reported defect means `gaps_found`, even when other rows are pending.
  `passed` requires all eleven rows to pass with current hashes and confirmed
  source loading. It does not replace independent code/security/goal reviews.
- After any runtime asset edit, refresh all three hashes and the source settings,
  set `loaded_from_repository` false, and reset previous live rows to pending with
  empty dates/evidence. Reload the extension and view before repeating acceptance.
  Preserve a sanitized defect description until it is genuinely rechecked and
  resolved. A CSS-only adjustment leaves JavaScript bytes unchanged.
- Runtime tuning is delegated only within D-01 through D-12 and needs actual
  evidence. A readiness defect first needs a failing sanitized timing regression;
  retain a hard non-extending deadline and whole-table preflight. Further captures
  require the existing sanitized admission workflow and a concrete separate scope.

## Carried-forward limits

The manifest remains MV3 with only `storage`, no `host_permissions`, and exactly
`https://*.zendesk.com/agent/*`. Storage is reserved and unused by this phase.
The only marker seam is `data-zhroma-priority`; CSS paints direct ticket cells.
Original fixture checksums/provenance and historical RGB records are preserved.

Phase 1 passed with the explicit AR-01-13 acceptance exception. Historical
approval independence remains **not-attested**; this report adds no attestation
or fresh capture. A1/A2, the six unclassified probes and all six judgment
prohibitions remain visible for independent review. Phase 2 stays open; Phase 3,
controls, storage behavior and publication are not authorized by this record.

## Automated preparation verification — 2026-09-08

| Check | Result | What it establishes |
|---|---|---|
| Focused `test/extension/live-acceptance.test.js` | 39 tests passed; `LIVE ACCEPTANCE STATUS: human_needed` | Rejects incomplete, contradictory, stale and non-live acceptance claims; validates this pending record and source settings. |
| Product `test/extension` | 111 tests passed across initial-tint, runtime-contract and live-acceptance | Existing actual-byte detection/refusal/disposal, direct-cell CSS and frozen permission contracts remain intact. |
| `GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon` | 284 tests passed: 65 Node smoke + 219 Vitest across 7 files; no skipped tests | Recon smoke, admitted fixture and product tests all execute together. |
| `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` | `FINAL VERDICT: proceed` | The historical admitted recon corpus and its gate remain valid; this is not Phase 02 live acceptance. |
| Runtime/corpus/dependency comparison to 02-01 completion | No differences | No CSS, timing, fixture, dependency or historical approval change was needed or made. |

At the 2026-09-08 preparation checkpoint, **authentic checks were 0 pass, 0 fail,
11 pending**, and there was no actual live evidence to justify changes. The
2026-09-09 UAT now records ten live passes, twelve accepted decisions and one
unresolved initial-load defect. The palette has user acceptance within the tested
scope; the unchanged 15000/100 ms startup heuristic remains under investigation.
Current focused validation passed 56 evidence tests and 64 initial-tint tests;
the actual acceptance disposition remains gaps_found. Independent security and
goal-verification refresh remain separate. Passing the historical preparation
table above does not close Phase 2.
