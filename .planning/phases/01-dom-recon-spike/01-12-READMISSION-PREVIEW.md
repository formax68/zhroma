# Plan 01-12 Re-admission Preview

Status: decision required; no committed fixture or manifest was changed.

## Proposed change

Use the three previously sanitized repository fixtures as inputs. Remove only the 20 invalid enum ARIA redaction stand-ins (4 canonical, 4 absence, 12 grouped), restore the already recorded exact Priority header at index 6 in the two presence scenarios, and run the current sanitizer. The manifest would identify this as re-admission of previously sanitized repository bytes, not a fresh live capture.

## Measured divergence from the plan

The plan requires edited input to equal emitted output and instructs the executor to stop on divergence. That check fails for both Priority-present files: replacing the old numbered header stand-in with the preserved Priority token causes all subsequent text stand-ins to be numbered one lower. This was observed in temporary copies only. No additional corpus edits were made after the failed check.

| Fixture | Invalid ARIA attributes removed | Priority header restored | Emitted bytes equal edited input | Additional placeholder renumberings |
| --- | --- | --- | --- | --- |
| zendesk-view-priority-present.html | 4 | yes | no | 62 |
| zendesk-view-priority-absent.html | 4 | no | yes | 0 |
| zendesk-view-grouped-long.html | 12 | yes | no | 170 |

All three proposed edited inputs pass the new output grammar. Comparing edited input with emitted output after replacing `TEXT-NNN` tokens with a common marker yields exact equality in every file: the divergence is limited to stand-in numbering. Accepting sanitizer-emitted bytes therefore requires extending Plan 01-12's two-edit constraint to disclose this renumbering and then proving a second sanitizer pass is byte-identical before admission.

## Provenance and reversibility correction

The plan incorrectly says rewriting tracked bytes destroys the prior byte-level provenance chain and cannot be reversed with Git. Every current fixture was read from commit `f391241` and its SHA-256 was verified against the existing manifest. The original bytes and hashes are recoverable from Git history. Re-admission does not recover the original private raw captures or establish a new live observation; SELECTORS.md records that those inputs were deleted, and their current availability has not been independently reconfirmed.

## Proposed manifest wording

> Re-admitted through scripts/sanitize-fixture.js from previously sanitized repository bytes; not a fresh live capture. The prior admission record states that the private inputs were deleted. Unrecoverable enum ARIA redaction stand-ins were removed, the recorded Priority header token was restored in the two Priority-present scenarios, and deterministic text stand-ins were renumbered by the sanitizer. Original repository bytes and hashes remain in Git history.

Only `sha256`, `sanitizationMethod`, and the new `priorityHeaderIndex` fields would change. Existing selectors, assertions, scenario names, and structural declarations would be retained.

## Exact hashes

- `zendesk-view-priority-present.html`
  - Original: `256ea070bfd2fa3c71e9b05cf7873cd8e88bf29280ec753008313417cbedcc9c`
  - Edited input: `cd5e355e2f0fc230e3b5e5989e835ae207427dcb0e888fbeca0d73b5dd611945`
  - Sanitizer output candidate: `c0a5b18f96707c8497f22faece606c53eacce170e30781861a1f17a03a346a91`
- `zendesk-view-priority-absent.html`
  - Original: `8e79ca98ca55f1c0d39c3c80f244ddd4eb07180e2b89fd3b099dd0d99c79693f`
  - Edited input: `70ed2ad8c6d53485a1eb3addbbee8f52c24a047520591e93359ca5b3c86db930`
  - Sanitizer output candidate: `70ed2ad8c6d53485a1eb3addbbee8f52c24a047520591e93359ca5b3c86db930`
- `zendesk-view-grouped-long.html`
  - Original: `24c6a9bc9a6e4b7d9dd88dad48ba7103750b265f820e9b25ea6a27f68a107b58`
  - Edited input: `35397122f54a97c9b29bc006e0c6d639f67f9e667363917ceb5a5291c45b5288`
  - Sanitizer output candidate: `78d403b7f530fad4fbdcbe1f1b3969c9cb0b316513e1454eaa39fac6b8758b6e`

## Pending decisions

1. Source: existing sanitized repository bytes, retained original private captures if available, or a fresh live recapture.
2. If repository-byte re-admission is chosen, approve or reject the provenance wording above and the disclosed placeholder renumbering.

No approval for these choices has been inferred from the dependency-approval conversation. Plan 01-12 has no SUMMARY and remains incomplete; later waves have not started.
