# Zhroma release smoke checklist

**Run this before every submission — including a resubmission of unchanged bytes.**
A checklist that is only run "when something changed" stops being evidence the
first time somebody is wrong about whether something changed.

This checklist produces one immutable record per candidate, at
`.planning/phases/05-published/release-runs/rc-NN.json`. The record is validated
by `scripts/release-evidence.js` and re-proved against the archive by
`scripts/verify-release.js`. Nothing in this document, and nothing in that
validator, can create an observation: every `pass` below is something a person
saw in a browser, on the exact extracted candidate, at a recorded time.

---

## 0. What binds a run to a candidate

A run is bound to one candidate by three facts, all recorded inside the run:

| Fact | Where it comes from | Why it is here |
|---|---|---|
| Archive **SHA-256** | recomputed from the ZIP's own bytes by `verify-release.js` | Two archives of identical source bytes are still two different archives. |
| Complete **source inventory** — every packaged file's name, size and SHA-256, plus the aggregate digest | `scripts/release-source.js` | A per-file inventory catches a changed byte at identical length; an aggregate alone does not tell you which file moved. |
| **Extracted directory** actually loaded into Chrome | observed during section 2 | The thing under test is the extracted archive, not `extension/`. |

`release/candidate.json` is the candidate record. It carries the version,
`out_dir`, `frozen_at`, `source_git_revision`, the ZIP hash, the full source
inventory, the extracted path, the automated command results, and `smoke_run` —
the exact path of the run this candidate's evidence lives in.

**A changed shipped byte invalidates the candidate.** It does not invalidate the
*label*; it invalidates the candidate. Package again into a **new** output
directory, create the **next unused** `rc-NN.json`, and point `smoke_run` at it.
Completed runs are append-only: never edit one, never re-date one, never reuse
one for different bytes. Any prior review or submission approval attached to the
old candidate is void.

---

## 1. Before touching the browser (the executor does this)

- [ ] Run the complete default suite: `npm test`. Record the command and result
      in `candidate.automated_checks`.
- [ ] Package the exact bytes: `node scripts/package-release.js --out-dir <fresh dir>`.
      Expect `RELEASE_PACKAGE_OK <version> <archive sha256>`.
- [ ] Copy the produced `candidate.json` into `release/candidate.json` and add
      `out_dir`, `frozen_at`, `source_git_revision`, `smoke_run` and
      `automated_checks`.
- [ ] Create the run record with every required check `pending`.
- [ ] Confirm the honest status: `node scripts/verify-release.js --candidate release/candidate.json`.
      A prepared run must report `RELEASE_EVIDENCE_OK human_needed`. If it
      reports anything else at this point, stop — the record is describing
      observations that have not happened.

---

## 2. The eight required checks (the user drives the browser)

The user controls login, any authenticated navigation, and the browser restart.
The executor records what is reported and nothing else.

Use a **real, unmodified** Zendesk view the user already works in: English
current Agent Workspace, light interface, with a visible Priority column. Do
**not** create, edit or reorder a saved view, do not open or modify a ticket, and
do not change any account setting to make a check pass. An unavailable context is
recorded as unavailable.

| # | Check id | What to do | What counts as a pass |
|---|---|---|---|
| 1 | `candidate-loaded` | Load the **extracted candidate directory** as an unpacked extension. Inspect existing copies first; there must be exactly **one** active Zhroma copy, and it must be this one. | `chrome://extensions` shows this candidate's directory and version, and no second active copy. |
| 2 | `default-tint` | Open the working view on a **genuinely fresh install preference** — the preference must not have been switched on by hand first. | Priority rows carry their distinct tints on the first load, with no manual step. |
| 3 | `toolbar-popup` | Look at the toolbar icon, then open the popup. | The brand icon and title are the shipped ones; the popup opens and shows its on/off switch and current status. |
| 4 | `off-clears` | Switch the extension **off** from the popup, on the same view, **without refreshing**. | Every tint clears; the underlying view is untouched. |
| 5 | `on-restores` | Switch it **on** again, same view, **without refreshing**. | Tints return, matching the priorities actually shown. |
| 6 | `safe-transition` | Make **one** safe, normal transition the user is comfortable with — a sort, a pagination step, or navigating between existing views. Nothing destructive. | Tinting is correct after the transition, with no leftover or misplaced tint. |
| 7 | `restart-preference` | With the user's agreement, restart the browser and reopen the view. | The stored on/off preference is exactly what it was before the restart. |
| 8 | `extension-errors-channels` | Inspect extension-origin errors on `chrome://extensions` and the network activity attributable to the extension. | No extension-origin errors; no network channel attributable to the extension — ordinary Zendesk requests are the page's, not Zhroma's, and must be told apart before anything is recorded. |

**Conditional, recorded only if the context already exists:**

| # | Check id | Condition |
|---|---|---|
| 9 | `missing-column` | Record this **only if** a safe existing view without a Priority column is already available. Do **not** create one, and do **not** remove a column from a real view. If no such view exists, the check stays `pending` with the reason stated in `unavailable`. Unavailable is never a pass. |

### Recording rules

- Every non-`pending` check needs: `observed_at` (a UTC instant at or after the
  candidate's `frozen_at`, and not in the future), an `observation` describing
  what was actually seen, and an `observer`.
- Observations are **categorical outcomes only**. No URLs, no email addresses, no
  ticket identifiers, no screenshots, no raw browser logs. The validator rejects
  ticket-shaped text.
- A check nobody performed stays `pending`. A check that was performed and did
  not behave stays `fail` — the run then reports `gaps_found`, which is the
  honest answer, not a problem to be edited away.
- Automated command results live in `automated_checks` and may **never** occupy a
  required check's slot. The validator refuses an automated entry that borrows a
  smoke check's id.

### Out of scope, deliberately

- Do **not** restart any of the nine Phase 3 UAT checks the user skipped.
- Do **not** attempt `language-icon-copy`, `structure-copy` or
  `english-regional-locale`; those remain pending under Phase 4's own record.
- Do **not** profile, benchmark, or exercise non-English or structural contexts.
- Do **not** repair a runtime defect discovered here. A defect, or a
  compliance-driven runtime change, returns for scope and replan and produces a
  **new** candidate — it is not silently fixed inside a release run.
- Restore the user's original preference and profile state when the run is done.

---

## 3. Closing the run

- [ ] Set `finished_at` once the observations are recorded.
- [ ] `node scripts/verify-release.js --candidate release/candidate.json` — read the
      reported status honestly.
- [ ] `node scripts/verify-release.js --candidate release/candidate.json --require-smoke`
      — this exits 1 unless all eight required checks carry genuine current-candidate
      observations. It is the submission gate, not a formality.

`smoke_passed` means one thing: this exact candidate was loaded and observed.
It does **not** mean the predecessors are accepted, and it does **not** authorize
publication.

---

## 4. Predecessor limits carried by every run

Restated from `.planning/phases/05-published/05-BASELINE.json`, which the run
record must match exactly:

| Phase | Status | Live checks | Notes |
|---|---|---|---|
| 03-the-tint-survives-everything | `human_needed` | 11 pass, 9 pending | Nine remain skipped by the user (`uat_execution: skipped-by-user`). |
| 04-honest-failure-and-an-off-switch | `human_needed` | 14 pass, 3 pending, 0 fail | `language-icon-copy`, `structure-copy` and `english-regional-locale` remain pending. |

A release smoke run reports **its own** observations. It cannot promote,
re-open, waive or improve any of the above, and the validator refuses a run that
restates them differently.
