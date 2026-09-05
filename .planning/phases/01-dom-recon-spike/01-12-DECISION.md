# Plan 01-12 Approved Re-admission

Date: 2026-09-05

The developer was asked separately:

1. Should existing sanitized fixtures be used to continue?
2. Is the provenance wording "re-admitted from previously sanitized repository bytes, not a fresh live capture" approved, including 62 canonical and 170 grouped placeholder renumberings?

Developer response, verbatim:

> yes on both

Decision: re-admit the existing repository fixtures with the approved provenance wording and disclosed deterministic placeholder renumbering. The original bytes and hashes remain recoverable from Git; the contrary one-way claim in the original plan is superseded by the verified preview.

This approval supersedes the original requirement that the first emitted output equal the two-edit input. Instead, permit only the measured stand-in renumbering on that first pass, then require a second sanitizer pass to be byte-identical, with matching SHA-256. Preserve every structural, selector, and assertion declaration. The prior record states that original private inputs were deleted; this run makes no fresh live-capture claim.
