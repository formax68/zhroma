# Phase 04 Unobserved FAIL-03 Live Evidence — Risk Acceptance

Recorded on: 2026-09-10

**Risk ID:** AR-04-01
**Requirement:** FAIL-03 — an unsupported interface language must never be
reported as a missing Priority column.

## What is being waived

FAIL-03 has exactly two live acceptance checks, and neither was observed:

| Check | Why unobserved |
|---|---|
| `language-icon-copy` | No non-English tenant context available to the user. |
| `structure-copy` | No safely prepared, user-approved uninterpretable-table context available. An operational view was deliberately not edited to manufacture the state. |

Both remain `status: pending` in `04-LIVE-ACCEPTANCE.md`
`limitations.unavailable_scenarios`. FAIL-03 therefore ships with **automated
coverage on final source and zero live browser evidence.**

## What the user was told before deciding

- These are FAIL-03's only two live checks, so waiving them leaves the
  requirement with no live evidence at all.
- FAIL-03 is specifically the requirement that a non-English agent is never
  shown a false "missing Priority column" claim. The behaviour has been
  exercised offline against shipped bytes; it has never been seen in a browser.
- The waiver cannot promote the canonical record. `phase-04-live-acceptance.test.js`
  computes the disposition mechanically: `complete` requires every check to be
  `pass`, so two `pending` checks hold the record at `human_needed` regardless of
  this acceptance. There is no `waived` check status, and marking an unobserved
  check `pass` is blocked by the `forged pass with an unconfirmed source` and
  `synthetic-is-not-live` guards — and prohibited outright by
  `untested-is-not-consent`, which the user ratified in this same session.

## User decision, verbatim

> it's a pass, the blocked tests are no blockers

> waive the pendings one from FAIL-03

## Disposition

Explicitly accept the residual risk that FAIL-03's live behaviour is unobserved.
This acceptance permits Phase 04 to proceed to its remaining independent gates
without those two observations.

It does **not**:

- promote `04-LIVE-ACCEPTANCE.md` — its disposition stays `human_needed`;
- convert either check to `pass`, or create any evidence for FAIL-03;
- resolve the seven unclassified edge assumptions in `04-SOURCE-AUDIT.md`,
  including the FAIL-03 entry "Unsupported/missing language presentation needs
  evidence", which remains `unresolved`;
- waive independent code review, the ASVS level 1 security verdict, or phase
  goal verification;
- carry to any later phase, or authorize the store listing to describe
  non-English behaviour as verified.

If a non-English tenant context or a safe unreadable-table context becomes
available, these two observations should be taken and the record re-established
against the then-current bytes — not re-pointed at old bytes.

## Addendum — 2026-09-10, after the `04-REVIEW.md` repair

Recorded by plan 04-11 when the acceptance record was re-established against the
repaired bytes under `04-VALIDATION.md` promotion rule 3.

**What the CR-01 repair changed about this waiver's subject.** Before the repair,
`extension/content.js` compared `document.documentElement.lang !== 'en'` as an
exact case-sensitive string, so every English *regional* locale — `en-GB`,
`en-US`, `en-AU` — reached the unsupported-language branch. After the repair the
accepted set is the English language **family**, matched case-insensitively on the
primary subtag, in both the JavaScript and the CSS encodings. The branch's domain
is therefore **narrower** than it was: a set of shells that used to be told their
language is unsupported no longer are.

That is a strict reduction in the false-blame surface FAIL-03 exists to prevent.
It is not evidence for FAIL-03, and it does not shrink what this waiver covers.

**What is unchanged.**

- **`language-icon-copy`'s scenario and expected result are unchanged.** A
  genuinely non-English shell still takes the unsupported-language branch and
  still must show the question-mark artwork with "This interface language is not
  supported". The check tests the same thing it always tested.
- **`structure-copy` is unaffected by the repair.** The repair did not touch the
  structure branch.
- **Both checks remain `pending`** — now against the repaired bytes rather than
  the pre-repair ones. Neither was observed before the repair and neither has been
  observed since.
- **The waiver stands.** It still permits Phase 04 to proceed to its remaining
  independent gates, and it is still **not evidence**. FAIL-03 continues to carry
  automated coverage on final source and zero live browser evidence.

**One thing the repair does change: the value of taking the observation.** The
unsupported-language branch is now reached by a smaller, more precisely defined
set of shells, and the boundary between "English regional, tints" and "not
English, refuses" is newly drawn. A live observation of either side would be worth
more than it was before the repair, because there is now a boundary to observe
rather than a single blanket refusal. Taking one was **out of scope for this run by
explicit user direction**, and nothing here asks for it now.

Neither check is flipped by this addendum, and nothing in it may be read as proof.

## Related

- `AR-04-UAT-01` in `04-UAT.md` — the progression waiver this formalizes.
- `AR-01-13` (`01-RISK-ACCEPTANCE.md`) — precedent for an attributed,
  scope-limited acceptance that is never rewritten as proof.
- `ACK-04-01` in `04-VALIDATION.md` — the separate, still-outstanding
  acknowledgement that the fourteen observations the user *did* attest no longer
  count. That is a different item from this waiver and is not answered by it.
