---
phase: 04-honest-failure-and-an-off-switch
status: human_needed
source_confirmation: unconfirmed
uat_execution: re-established-on-repaired-bytes-0-of-17-observed
prior_phase_status: human_needed
---

# Phase 04 Current-Source Live Acceptance

**Seventeen checks. Zero have been observed against the bytes that now ship.**
The source has not been confirmed in a browser: `loaded_from_repository` is
`false`, `source_confirmed_on` is `null`, and every `environment` member is
`null`. Nobody has loaded the repaired `extension/` into Chrome yet, and this
record does not pretend otherwise.

**Fourteen observations were attested by the user on 2026-09-10, and they are not
carried forward.** They were taken against the pre-repair bytes and are preserved
verbatim — with their user attributions, their dates and their `04-UAT.md` test
numbers — at `history/2026-09-10-before-review-repair/04-LIVE-ACCEPTANCE.md`,
bound to repository revision `77b3a19f3f96fa99b97b47930cd44f75bc52dd57`. An
observation is evidence about the bytes it was taken on. The `04-REVIEW.md`
repairs changed four of the eleven shipped assets — `content.js` and `zhroma.css`
(CR-01, WR-08), `background.js` (WR-04) and `popup.js` (WR-04, WR-07) — so
`04-VALIDATION.md` promotion rule 3, rule 5 below and the validator's
`live-source-evidence` gate each independently forbid re-pointing them at the new
bytes. **Re-observing them is a UAT activity against the repaired bytes and was
explicitly out of scope for the run that re-established this record.**

The user has not yet acknowledged that reset. It is recorded as the outstanding
item **`ACK-04-01`** in `04-VALIDATION.md` and queued for the end-of-phase human
verification harvest. It asks for acknowledgement only; it requests no
re-observation.

**Two checks were never observed at all and remain unobserved:**
`language-icon-copy` (no non-English tenant context available) and
`structure-copy` (no safely prepared uninterpretable-table context available).
Both are recorded in `limitations.unavailable_scenarios` with reasons. They are
**FAIL-03's only two live checks**, so that requirement carries automated coverage
and **zero live evidence**. The user **waived** both as accepted residual risk
**`AR-04-01`** (`04-RISK-ACCEPTANCE.md`, recorded 2026-09-10; dated addendum for
the repair). The waiver permits Phase 04 to proceed to its remaining gates. It is
**not evidence**: FAIL-03 still has no live observation, both checks stay
`pending`, and the waiver did not survive into this record as anything other than
a reason string.

**One check is new.** `english-regional-locale` covers a behaviour the repaired
bytes carry and no existing check did: an English *regional* locale (`en-GB`,
`en-US`, …) now tints instead of being told its interface language is
unsupported. Shipping that behaviour with no live-evidence slot would have been
exactly the silent gap promotion rule 3 exists to prevent.

The three product prohibitions were **ratified by the user** at the 2026-09-10
checkpoint, and `WINDOWS.md` entry 11's copy set with them. Their `status` fields
are nonetheless left at `flagged-unverified`: this file's own test asserts the
repository record carries all three that way, as a guard against an executor
self-ratifying them. Each ratification is recorded in its `disposition` text
instead. Promoting the status fields requires changing that guard — a user
decision, not a side effect of re-binding a record.

**The disposition is `human_needed`, and it is computed rather than asserted.**
There is no failed check and no unresolved defect, so it is not `gaps_found`; the
source is unconfirmed and seventeen checks are pending, so it cannot be `passed`.
A green run of `test/extension/phase-04-live-acceptance.test.js` proves this record
is *well-formed and correctly bound to current source*. It does not promote it,
and it is not an observation.

## Relationship to Phase 3 — stated, not restated

Phase 3 remains **`human_needed`**: independent verification 28/34 truths, eleven
source-bound live passes and **nine untested live checks** after the user
explicitly skipped UAT, with LIVE-05 and FAIL-04 still lacking human evidence.
Manual profiling remains deferred.

This phase neither resumes nor closes any of that. `03-LIVE-ACCEPTANCE.md` and
`test/extension/phase-03-live-acceptance.test.js` were not touched by 04-05 or by
04-11; the Phase 3 record stays bound to its own historical revision
`382cc881334aa7edf2103150bd8fe663236b6357` (see `04-BASELINE.md`). The
`prior_source` block in the canonical record below is validated **against Phase
3's own file**, so a later edit that quietly promotes Phase 3 fails this phase's
test rather than passing unnoticed.

Phase 3's nine pending checks are `skipped-by-user`. **Phase 4's seventeen checks
are not skipped — they are untested against the repaired bytes.** Do not carry
the Phase 3 skip across, and do not describe Phase 4's reset as a skip either;
they have different causes and different remedies.

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
   observation at new bytes. This record is itself the second application of that
   rule.

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

Seventeen observations. Each names what to do, what a *correct* result looks like,
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
| `english-regional-locale` | In a context **you control**, set the Zendesk agent interface to an English **regional** locale — one whose tag is English but is not the bare `en` (`en-GB`, `en-US`, `en-AU`…) — then open a ticket view with a Priority column that has values. Record only the language tag. | The view **tints**, and the toolbar shows the **check** artwork with the working title. The popup agrees with the icon and **never** says the interface language is unsupported. An English view is never blamed on its language, whatever its region. (D-04, D-08, FAIL-01, FAIL-03) |

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
- **`ACK-04-01`** — the user's fourteen 2026-09-10 attestations no longer count
  toward Phase 4 acceptance, and the user has not yet acknowledged that. Recorded
  as outstanding in `04-VALIDATION.md` and queued for the end-of-phase human
  verification harvest. No executor may answer it; an executor answering it would
  be the silent write-off it exists to prevent.

`WINDOWS.md` entry 11 — the two operational copy strings added by 04-04 beyond the
04-01 decided set — was **ratified by the user** at the 2026-09-10 checkpoint
(`04-UAT.md` test 21) and the ledger entry is closed. Both strings are statements
about Zhroma's own action, never a diagnosis about the view, so the three product
diagnoses remain three. The ratification is a decision about copy, not about
bytes, and the repair did not touch either string, so it survives this
re-establishment unchanged.

## Independent gates remain separate

Automated technical results live in `04-VALIDATION.md`; synthetic timing lives in
`04-PERFORMANCE.md` and `04-PERFORMANCE-SAMPLES.json`. Independent code review,
the ASVS level 1 (high/critical-blocking) security verdict, phase goal
verification and human acceptance are **four separate verdicts** and none of them
is supplied by this document or by a green test suite.

The independent code review has now been performed once (`04-REVIEW.md`, one
critical and ten warnings). Its findings are what moved the bytes this record is
re-bound to. Whether the repairs themselves satisfy an independent reviewer is a
separate question and is not answered here.

## Canonical record

Exactly one JSON record governs consistency; the validator rejects a second one
and rejects duplicate JSON members before `JSON.parse` can silently discard them.
`null` means no observation. `source.assets` is the complete recursive inventory
of `extension/` — all eleven files, including the service worker, the popup
document and every PNG — so a change to any shipped byte invalidates the binding
rather than hiding behind an unchanged `content.js`. Every digest below was
derived from the working tree, not transcribed.

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
      "background.js": "141b192fecc263a2add910bed0bc29f3f18ec9abbcfd1c03510925235a840e6e",
      "content.js": "2dd1ac4c892aaadf5c4bc14b47c61e5a7aee4f9bdca42b26351b9ecd999c6c42",
      "icons/missing.png": "68a032b0500b1ae062a455e3b1bdbf20db8dd71c8d16dee1461e6f3dbf5e8fa0",
      "icons/neutral.png": "a13c2447cb31526e666a4e050451228480a6221efcee673a6fd30ac2d943f9d4",
      "icons/off.png": "c1289da1a9235cba4ddb0f8bcd85ca90e355ce89ddf3c24340c6409205198638",
      "icons/unreadable.png": "1131af46ac5cc421e7e951a4de067566c9a31bbfa032787f5346fb6db8e30c3a",
      "icons/working.png": "28fc0380a220982d523d39564123933db92e8d492100cd690c0dd333200845bb",
      "manifest.json": "dafa656a55a1b69b42d4aa6490101e593bc9eea36afe35feacf34f7090b768e5",
      "popup.html": "4c621c9d92fd21130dc2cafbf5bcaf705a98993c53eb755a53011a381729ad7c",
      "popup.js": "6a6f07c3e1dc891faf6b8f341e074d941115965f1907b8bc5a1b5b70293fa79f",
      "zhroma.css": "8eb5da85190bbada5c2f4c6d9a84c068fd988c46ebe2995c1bba9242f2b726c0"
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
      "id": "english-regional-locale",
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
      "disposition": "Ratified by the user at the Phase 4 blocking checkpoint (04-UAT.md test 18) after observing the diagnosis copy live in the browser: the add-a-Priority-column line and the other diagnosis copy read as help, not as accusation. This is an explicit human disposition, which is the only thing that can close this judgment. RATIFICATION SURVIVES THE 2026-09-10 RE-ESTABLISHMENT: the copy strings this judgment is about are byte-identical before and after the repair, so the ratification is about the same words the user read. GUARD NOT RELAXED: the status field is deliberately left flagged-unverified because test/extension/phase-04-live-acceptance.test.js asserts the repository record carries all three that way — a guard against an executor self-ratifying them. Promoting these to reviewed-resolved requires changing that guard, which is a user decision. The disposition is unaffected either way: seventeen pending checks and an unconfirmed source already hold the record at human_needed."
    },
    {
      "id": "re-enable-not-pressured",
      "statement": "The off switch must not pressure the agent to re-enable tinting or imply that off is an error.",
      "status": "flagged-unverified",
      "disposition": "Ratified by the user at the Phase 4 blocking checkpoint (04-UAT.md test 19) after observing the off state live: off reads as a legitimate choice rather than a broken or discouraged one, with no nag or prompt to re-enable. RATIFICATION QUALIFIED BY THE 2026-09-10 RE-ESTABLISHMENT: popup.js changed in the WR-04 and WR-07 repairs, so the popup the user judged is not byte-identical to the one that ships. The repair added no copy and no prompt — it changed the revert target after a failed save, kept the control operable and restored focus — but whether the repaired failure path still reads as unpressured is a judgment nobody has made against the new bytes. GUARD NOT RELAXED: the status field stays flagged-unverified for the same guard reason as the other two, and this qualification is an additional reason not to promote it."
    },
    {
      "id": "untested-is-not-consent",
      "statement": "Untested browser behavior must not be presented as observed acceptance or consent.",
      "status": "flagged-unverified",
      "disposition": "Ratified by the user at the Phase 4 blocking checkpoint (04-UAT.md test 20): the record continues to state that language-icon-copy and structure-copy are unobserved, keeps its disposition at human_needed, and does not present the user's progression waiver as evidence. The user separately accepted those two as non-blocking for progression, recorded as attributed acknowledged risk AR-04-UAT-01 in 04-UAT.md, not as observation. THIS JUDGMENT IS THE ONE THE 2026-09-10 RE-ESTABLISHMENT MOST DIRECTLY TESTS, AND IT WAS OBEYED: fourteen observations taken on pre-repair bytes were preserved as dated history rather than re-pointed at the repaired bytes, and every check now reads pending. The outstanding acknowledgement of that reset is ACK-04-01 in 04-VALIDATION.md; leaving it outstanding rather than having an executor answer it is what this judgment requires. GUARD NOT RELAXED: the status field stays flagged-unverified."
    }
  ],
  "limitations": {
    "unresolved_observed_defects": [],
    "unavailable_scenarios": [
      {
        "id": "language-icon-copy",
        "reason": "No non-English tenant context available to the user; deferred at the Phase 4 checkpoint rather than manufactured. Recorded verbatim in 04-UAT.md test 6. Waived by the user on 2026-09-10 as accepted residual risk AR-04-01 (04-RISK-ACCEPTANCE.md): the user accepted that FAIL-03 carries no live evidence. The check remains pending because a waiver is not an observation — it permits progression, it does not create evidence, and it cannot promote this record. RE-ESTABLISHED 2026-09-10 against the repaired bytes under promotion rule 3: the CR-01 repair narrowed which shells reach the unsupported-language branch, so this check's own scenario and expected result are unchanged — a non-English shell still takes the branch. AR-04-01 continues to apply unchanged, and this check was pending before the repair and is pending after it."
      },
      {
        "id": "structure-copy",
        "reason": "No safely prepared, user-approved uninterpretable-table context available; an operational view was deliberately not edited to manufacture the state. Recorded in 04-UAT.md test 7. Waived by the user on 2026-09-10 as accepted residual risk AR-04-01 (04-RISK-ACCEPTANCE.md): the user accepted that FAIL-03 carries no live evidence. The check remains pending because a waiver is not an observation — it permits progression, it does not create evidence, and it cannot promote this record. RE-ESTABLISHED 2026-09-10 against the repaired bytes under promotion rule 3: the repair does not touch the structure branch at all, so this check is unaffected by it. AR-04-01 continues to apply unchanged, and this check was pending before the repair and is pending after it."
      }
    ]
  }
}
```

---

*Phase: 04-honest-failure-and-an-off-switch*
*Re-established: 2026-09-10 by plan 04-11 — bound to repaired bytes, zero live evidence, pending human observation*
