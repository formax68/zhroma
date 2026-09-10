---
phase: 04-honest-failure-and-an-off-switch
status: human_needed
source_confirmation: pending
uat_execution: not-started
prior_phase_status: human_needed
---

# Phase 04 Current-Source Live Acceptance

**Nothing in this document has been observed yet.** All sixteen checks below are
`pending`. They were written by preparation tasks 04-05/1 and 04-05/2 against the
current shipped bytes; a person still has to load the extension in Chrome and
watch it behave. A green run of `test/extension/phase-04-live-acceptance.test.js`
proves this record is *well-formed and correctly bound to current source*. It
proves nothing about the product.

## Relationship to Phase 3 — stated, not restated

Phase 3 remains **`human_needed`**: independent verification 28/34 truths, eleven
source-bound live passes and **nine untested live checks** after the user
explicitly skipped UAT, with LIVE-05 and FAIL-04 still lacking human evidence.
Manual profiling remains deferred.

This phase neither resumes nor closes any of that. `03-LIVE-ACCEPTANCE.md` and
`test/extension/phase-03-live-acceptance.test.js` were not touched by 04-05; the
Phase 3 record stays bound to its own historical revision
`382cc881334aa7edf2103150bd8fe663236b6357` (see `04-BASELINE.md`). The
`prior_source` block in the canonical record below is validated **against Phase
3's own file**, so a later edit that quietly promotes Phase 3 fails this phase's
test rather than passing unnoticed.

Phase 3's nine pending checks are `skipped-by-user`. **Phase 4's sixteen checks
are not skipped — they are new and untested.** Do not carry the Phase 3 skip
across.

## Start with source confirmation

1. In `chrome://extensions`, load (or reload) the unpacked repository directory
   `extension/`. Refresh the Zendesk document once so the new content-script
   instance is the one under test. This is setup, not a recovery workaround
   permitted during the checks.
2. Confirm that the loaded directory is this repository's `extension/` and that
   its complete eleven-asset inventory hashes to the `source.assets` block in the
   canonical record. Reproduce with:

   ```sh
   find extension -type f | sort | while read -r f; do
     printf '%s ' "${f#extension/}"; shasum -a 256 "$f" | cut -d' ' -f1
   done
   ```

3. Confirm Chrome version, OS, the English (`html[lang="en"]`) current Agent
   Workspace in **light** appearance, and the actual mounted ticket-row count.
   Do not infer the row count from an earlier phase or from the synthetic
   workload.
4. Record the confirmation date and set `loaded_from_repository` only after that
   confirmation. Begin observations afterwards.
5. **Any source change invalidates this run.** Preserve the observations made so
   far as history and start fresh source-bound evidence; do not re-point an old
   observation at new bytes.

The user controls login, MFA, navigation, language/account changes and browser
restart (Phase 1 D-01). Retain only dated, sanitized, aggregate outcomes: no
tenant identity, ticket text, ticket or account identifiers, URLs, credentials,
raw DOM or screenshots (Phase 1 D-02/D-03). The validator enforces the shape of
this — an observation whose text contains a URL, an email-shaped string or a
six-or-more-digit run is rejected.

**Do not edit an operational Zendesk view to manufacture a failure state.** The
`structure-copy` check requires a context the user prepares and approves; if no
safe context exists, it stays pending with a reason.

## Operation checklist

Sixteen observations. Each names what to do, what a *correct* result looks like,
and which decision it is evidence for. "Without refreshing" means without
reloading the browser document.

### Diagnosis and toolbar (FAIL-01, FAIL-02, FAIL-03, FAIL-05)

| Check | Observable steps | Expected result |
|---|---|---|
| `working-icon` | Open an existing supported view that has a Priority column with values. Look at the Zhroma toolbar icon, hover it for the title, then open the popup. | Tint appears without refreshing. The toolbar shows the **check** artwork with the title "Priority tinting is working"; the popup reads the same. Icon and popup agree. (D-02, FAIL-01, FAIL-05) |
| `blank-copy` | Open a view that has a Priority column where the visible tickets have **no** priority values set. | The toolbar still shows the **check** artwork — this is a working state, not a failure. The popup reads "Priority column found. These tickets have no priority values set". It never says the column is missing. (D-02) |
| `missing-icon-hint` | On a table you have confirmed is supported and fully rendered but which has **no** Priority column, look at the icon and open the popup. | The toolbar shows the **column-plus** artwork, visually distinct from the check. The popup reads "Add a Priority column to this view to use tinting". **No hint, banner or badge is written into the Zendesk page itself.** (D-01, D-03, FAIL-02) |
| `missing-settle-transition` | Watch the icon while a Priority-less table mounts or is replaced (enter the view, or switch to it and back). | While the table is mounting the icon is the neutral **hollow circle**, not the column-plus. The missing-column claim appears only after the table has settled — a header row and a width-matched ticket row present, and ~100 ms of quiet. It never flashes a missing claim mid-mount. (D-01, FAIL-02) |
| `language-icon-copy` | In a context **you control**, switch the Zendesk interface to a non-English language, then open a ticket view. Record only the language tag (e.g. `de`), nothing else. | The toolbar shows the **question-mark** artwork and the popup reads "This interface language is not supported". It does **not** claim a Priority column is missing and does not name or echo any view content. (D-04, D-08, FAIL-03) |
| `structure-copy` | In a safely prepared, user-approved context where the ticket table cannot be interpreted (not an operational view, and no ticket data mutated). | The toolbar shows the **question-mark** artwork and the popup reads "Zhroma cannot read this view's ticket table". An English view is **never** told its language is unsupported. (D-04, FAIL-03) |

### The off switch (CTRL-02, CTRL-03, CTRL-04)

| Check | Observable steps | Expected result |
|---|---|---|
| `off-clears` | On a tinted view, open the popup and turn "Enable priority tinting" off. Do not refresh. | Every tint disappears from the current view immediately, with no reload. The popup reads "Tinting is off" and the toolbar shows the **power-symbol** artwork. Nothing implies off is an error or invites you to turn it back on. (CTRL-02, CTRL-04, D-10) |
| `on-restores` | Turn the switch back on. Do not refresh. | Tint returns on the current view immediately and matches the priorities as they are **now**, including any that changed while it was off. (CTRL-02, CTRL-04) |
| `restart-off` | Leave the switch off. Quit Chrome completely and reopen it, then return to the view. | The switch is still off, the view is untinted, and the toolbar still shows the power symbol. (CTRL-03) |
| `restart-on` | Leave the switch on. Quit Chrome completely and reopen it, then return to the view. | The switch is on and the tint is back. (CTRL-03) |
| `cross-tab-preference` | Open two Zendesk view tabs. Flip the switch in one. Then look at the other. | The preference is global: both tabs converge on it. Each tab keeps its **own** diagnosis — the other tab's status describes the view it is showing, not the one you flipped it from. Convergence is not promised to be instantaneous. (CTRL-03, D-06) |
| `frozen-resume` | Leave a Zendesk tab in the background long enough for Chrome to freeze/discard it. Flip the preference elsewhere. Return to the frozen tab. | On resume the tab applies the **currently persisted** intent — no stale tint left behind, and no reversion to the value it froze with. (CTRL-03, D-10) |

### Connection honesty and lifecycle (FAIL-05, CTRL-02)

| Check | Observable steps | Expected result |
|---|---|---|
| `nonreceiver-status` | Open the popup on a tab where no Zhroma content script is running (a new tab page, or any non-Zendesk page). | The popup reads "No readable view is connected". It does **not** assert that the tab is outside Zendesk and does not invent a diagnosis about a view it cannot see. (D-11, decided copy) |
| `navigation-status` | With the popup closed, move between tabs and documents — including from a tinted view to a non-view surface and back. | The icon and popup always describe the **current** document. A previous tab's positive "working" state is never carried over to a tab where it is not true. (FAIL-05) |
| `worker-restart` | In `chrome://extensions`, use the service-worker control to stop/restart the extension worker in this controlled test session. Then look at the icon and popup. | Status is rebuilt from a fresh request to the current document, not recalled. No stale diagnosis reappears, and nothing needs a page refresh to recover. (FAIL-05, CTRL-03) |
| `popup-keyboard` | Open the popup and operate it with the keyboard only: Tab to the switch, toggle with Space, read the status line. | Focus lands on the switch by default and is clearly visible. Its label reads "Enable priority tinting" and the announced state matches what is actually stored. Turning it off produces no nag, warning tone or prompt to re-enable. (CTRL-02, D-11) |

If a safe context for any observation is unavailable, mark that check **pending**
with a reason in `limitations.unavailable_scenarios` and stop honestly. Do not
substitute a fixture test, a screenshot from another phase or a plausible
expectation for live evidence. A failed observation stays **failed** and returns
for repair and re-verification; it is not renegotiated inside the checkpoint.

## Judgments this record cannot close

Three descriptor-less product prohibitions survived adversarial recall in
`04-SOURCE-AUDIT.md` with **no fabricated check descriptor**. They are carried in
the canonical record as `flagged-unverified`. They are not accepted risk, not
resolved, and not closable by any automated test in this repository: each is a
judgment about how wording and behaviour *land on a person*. While any of them is
unresolved the record's disposition can never compute to `passed`.

Also unclosed, and deliberately so:

- The **seven unclassified edge assumptions** (FAIL-01, FAIL-02, FAIL-03,
  FAIL-05, CTRL-02, CTRL-03, CTRL-04) from `04-SOURCE-AUDIT.md`. Their planned
  tests do not change their probe classification.
- **AR-01-13** remains historical, not-attested risk acceptance. It is never
  rewritten as proof.
- The **permanent native marker-removal** platform limit (T-04-16) is a disclosed
  limit, honoured by reporting `applied: false` rather than a claimed cleanup.
- **`WINDOWS.md` entry 11** — two operational copy strings ("Zhroma could not
  save that setting", "Setting saved, but this view did not update") were added
  by 04-04 beyond the 04-01 decided set because the plan mandates finite honest
  failure text and the decided set contained none. Both are statements about
  Zhroma's own action, never a diagnosis about the view. **The copy set was a
  user decision, so this addition needs user ratification before ship.** It is
  open in the ledger and is surfaced at the Phase 4 checkpoint; it is not
  self-ratified here.

## Independent gates remain separate

Automated technical results live in `04-VALIDATION.md`; synthetic timing lives in
`04-PERFORMANCE.md` and `04-PERFORMANCE-SAMPLES.json`. Independent code review,
the ASVS level 1 (high/critical-blocking) security verdict, phase goal
verification and human acceptance are **four separate verdicts** and none of them
is supplied by this document or by a green test suite.

## Canonical record

Exactly one JSON record governs consistency; the validator rejects a second one
and rejects duplicate JSON members before `JSON.parse` can silently discard them.
`null` means no observation. `source.assets` is the complete recursive inventory
of `extension/` — all eleven files, including the service worker, the popup
document and every PNG — so a change to any shipped byte invalidates the binding
rather than hiding behind an unchanged `content.js`.

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
  "source": {
    "inventory_count": 11,
    "assets": {
      "background.js": "ab871ca87b871e071b7db633c8909acda90247f98dd74a081d8c41d99c635dfe",
      "content.js": "1c1e0b037cdbd54baaa003e603af35f4e8c47096f74901f3f2d4bf5c176d4935",
      "icons/missing.png": "68a032b0500b1ae062a455e3b1bdbf20db8dd71c8d16dee1461e6f3dbf5e8fa0",
      "icons/neutral.png": "a13c2447cb31526e666a4e050451228480a6221efcee673a6fd30ac2d943f9d4",
      "icons/off.png": "c1289da1a9235cba4ddb0f8bcd85ca90e355ce89ddf3c24340c6409205198638",
      "icons/unreadable.png": "1131af46ac5cc421e7e951a4de067566c9a31bbfa032787f5346fb6db8e30c3a",
      "icons/working.png": "28fc0380a220982d523d39564123933db92e8d492100cd690c0dd333200845bb",
      "manifest.json": "dafa656a55a1b69b42d4aa6490101e593bc9eea36afe35feacf34f7090b768e5",
      "popup.html": "4c621c9d92fd21130dc2cafbf5bcaf705a98993c53eb755a53011a381729ad7c",
      "popup.js": "0f87b1a68a25a5b1c7e34cb48f116308db64190729c2dc535579cfc5f912b5fc",
      "zhroma.css": "f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61"
    }
  },
  "settings": {
    "settle_ms": 100,
    "preference_key": "enabled",
    "preference_area": "local",
    "minimum_chrome_version": "106"
  },
  "loaded_from_repository": false,
  "source_confirmed_on": null,
  "environment": {
    "browser": null,
    "os": null,
    "mounted_rows": null,
    "interface_language": null,
    "appearance": null
  },
  "prior_source": {
    "phase": "03-the-tint-survives-everything",
    "revision": "382cc881334aa7edf2103150bd8fe663236b6357",
    "status": "human_needed",
    "checks_passed": 11,
    "checks_pending": 9,
    "checks_failed": 0,
    "verification": "28/34",
    "uat_execution": "skipped-by-user"
  },
  "checks": [
    {
      "id": "working-icon",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "blank-copy",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "missing-icon-hint",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "missing-settle-transition",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "language-icon-copy",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "structure-copy",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "off-clears",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "on-restores",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "restart-off",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "restart-on",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "cross-tab-preference",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "frozen-resume",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "nonreceiver-status",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "navigation-status",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "worker-restart",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    },
    {
      "id": "popup-keyboard",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null,
      "language_context": null
    }
  ],
  "flagged_unverified": [
    {
      "id": "no-agent-blame",
      "statement": "The diagnosis must not blame an agent or imply they caused an unsupported or malformed view.",
      "status": "flagged-unverified",
      "disposition": "No fabricated check descriptor was authored for this judgment and none is possible from the repository: whether the decided copy reads as accusatory is a judgment about how wording lands on a person. Offline tests establish only that the copy is finite, fixed and evidence-branched. Requires explicit human or independent-reviewer disposition."
    },
    {
      "id": "re-enable-not-pressured",
      "statement": "The off switch must not pressure the agent to re-enable tinting or imply that off is an error.",
      "status": "flagged-unverified",
      "disposition": "Tests establish that off projects its own packaged artwork, that the popup reads 'Tinting is off', and that no add-a-column hint accompanies it. They cannot establish absence of felt pressure. Requires explicit human or independent-reviewer disposition."
    },
    {
      "id": "untested-is-not-consent",
      "statement": "Untested browser behavior must not be presented as observed acceptance or consent.",
      "status": "flagged-unverified",
      "disposition": "This record is the mitigation and simultaneously the thing at risk: all sixteen checks are pending and the disposition cannot compute to passed while they are. It stays flagged because compliance is a property of how the record is read and reported over time, not a state a single test run can certify."
    }
  ],
  "limitations": {
    "unresolved_observed_defects": [],
    "unavailable_scenarios": []
  }
}
```

---

*Phase: 04-honest-failure-and-an-off-switch*
*Prepared: 2026-09-10 — pending human observation*
