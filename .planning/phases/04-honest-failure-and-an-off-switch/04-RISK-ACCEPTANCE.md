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

## Related

- `AR-04-UAT-01` in `04-UAT.md` — the progression waiver this formalizes.
- `AR-01-13` (`01-RISK-ACCEPTANCE.md`) — precedent for an attributed,
  scope-limited acceptance that is never rewritten as proof.
