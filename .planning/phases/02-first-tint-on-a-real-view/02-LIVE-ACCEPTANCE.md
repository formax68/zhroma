# Phase 02 Live Acceptance

Prepared on 2026-09-08. **Product acceptance: human_needed.** No Phase 02 live
observations have been supplied. All eleven required checks are pending. The
runtime inventory below is measured from repository bytes; it does not confirm
that Chrome has loaded them or that the tints look correct.

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
| initial-load | With no product configuration, the complete supported initial table receives the expected tints. Describe startup timing, whether initial rows arrived in delayed batches, and whether any initial batch was missed. Record the final 15000 ms deadline and 100 ms quiet interval as settings, not a universal guarantee. If no delayed batch occurs, say so; do not claim it was tested. Blank cells stay untinted; an unsafe table is intentionally refused. | pending |
| urgent | Authentic Urgent is soft red, distinguishable from the other three hues, legible and identifiable at a glance. Jointly compare emphasis: Urgent strongest, High next, Normal and Low quieter, with pale/translucent treatment throughout. | pending |
| high | Authentic High is soft orange, distinct and legible; confirm its emphasis relative to Urgent, Normal and Low. | pending |
| normal | Authentic Normal is soft yellow, distinct and legible with quieter emphasis. | pending |
| low | Authentic Low is soft green, distinct and legible with quieter emphasis. | pending |
| native-hover | Genuine hover remains clearly distinguishable from the baseline/normal state with tint retained and text readable. | pending |
| native-selection-inset | Genuine selection remains clearly distinguishable with tint retained; the native first-cell inset indicator is visible. Do not execute a bulk action. | pending |
| unread-bold | Existing authentic unread/bold text remains visible and readable. Do not manufacture an unread state by changing tickets. | pending |
| focus-click | Ordinary native focus and click behavior is preserved on approved safe controls. Do not open or change tickets to manufacture coverage; unavailable safe coverage stays pending. | pending |
| reordered-reload | After a user-owned safe Priority header/cell reorder and full page reload, tint mapping follows the current header position. This is not a Phase 3 live-reapplication test. | pending |
| source-identity | Confirm the same repository extension/ folder was loaded and reloaded; the agent confirms all three current hashes below. Observations refer to those final bytes. | pending |

## Machine-readable record

This is the single canonical JSON record. Empty observations mean **not observed**.
`scope` names the target boundary; it is not a claim that a session was opened.
The settings are measured source values awaiting authentic acceptance. The empty
defect list means no defect has been reported, not that the product has passed.

```json
{
  "schema_version": 1,
  "status": "human_needed",
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
  "loaded_from_repository": false,
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
    { "id": "initial-load", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "urgent", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "high", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "normal", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "low", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "native-hover", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "native-selection-inset", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "unread-bold", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "focus-click", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "reordered-reload", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" },
    { "id": "source-identity", "status": "pending", "evidence_kind": "pending", "observed_on": "", "evidence": "" }
  ],
  "limitations": {
    "unresolved_observed_defects": [],
    "provenance": "Existing fixtures are approved repository-byte re-admission, not fresh captures or Phase 02 live observations.",
    "historical_approval": "AR-01-13 is an accepted historical exception; original package-approval independence remains not-attested.",
    "assumptions": "A1 initial-load timing sufficiency and A2 authentic visual suitability remain unverified. E01, E12, E13, E17, E19 and E20 remain unresolved unclassified specification assumptions for explicit verifier disposition.",
    "prohibitions": "P-02-01 through P-02-06 remain descriptor-less judgment records, flagged-unverified until explicit verification review; tests do not auto-dismiss them.",
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
