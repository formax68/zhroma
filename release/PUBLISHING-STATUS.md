# Zhroma publishing status

Checked 14 September 2026. Phase 5 delivers a public Chrome Web Store listing, hosted privacy policy, genuine sanitized screenshots, and exact-candidate release smoke evidence.

## Current status — submitted for review

On 14 September 2026, after the user's explicit approval of the three data-use certifications and public-release submission, Google confirmed: **Your extension was submitted for review**. Version 0.1.0 is submitted with automatic publication after approval enabled. It is not yet verified publicly available. Submission identity is recorded in `submission.json`.

The user explicitly skipped remaining UAT. Untested checks and Phase 3/4 `human_needed` statuses remain unchanged. Submission approval does not resolve the consent-applicability interpretation in `policy-applicability.md`.

Remaining external dependency: Google's review. After approval, verify public listing availability and store installation. Earlier entries below are historical snapshots, superseded by this status.

## Verified this session

- Resumed the existing publishing work on `codex/phase04-gap-closure` at `4aae068`; the previous `main` checkout lacked the prepared release work.
- `node scripts/verify-release.js --candidate release/candidate.json` returned `RELEASE_EVIDENCE_OK human_needed`: archive, source and extracted candidate still validate; live smoke is not complete.
- `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm test` passed: 65 Node smoke tests and 1,082 Vitest tests across 24 files.
- GitHub API authenticated as `formax68`. The proposed `formax68/zhroma-privacy` repository returned HTTP 404 and has not been created.
- Opened the Chrome Web Store developer dashboard; it requires Google sign-in. The user has been asked to sign in directly and complete MFA privately.
- No store upload, submission, policy publication, or account certification was performed.

## Remaining publishing work

### Dashboard progress, 14 September 2026

Latest: user explicitly stopped further UAT and requested publishing; remaining smoke checks remain untested rather than passed. Created, reviewed and uploaded the genuine sanitized 1280x800 before/after screenshot. Subject replacements are fictional; original labels and tint pixels are retained. Private temporary captures were deleted. Optional popup image could not be captured correctly; direct extension-page navigation was blocked by browser policy, with no bypass attempted. Saved the 456-character reviewer instructions. Distribution is Free of charge, Public, All regions. Dashboard confirms screenshot and contact blockers are cleared. The policy URL required a second save through the native field; final persistence check follows. Three data-usage certifications remain unchecked pending explicit final approval. The existing consent-applicability uncertainty is not a proven policy violation or a resolved exemption; a local gate must not be represented as a Google rejection.

Subsequent authorized completion: user explicitly approved contact verification and public policy hosting. Google sent the verification message; after the user's confirmation, a refreshed dashboard showed `Verified email address`. Published only `index.html` and `.nojekyll` in `formax68/zhroma-privacy`; GitHub Pages reports built with HTTPS enforced. Anonymous HTTPS fetch matches the local policy byte-for-byte. Public URL: https://formax68.github.io/zhroma-privacy/ . Saved that URL in the Privacy draft. See `policy-publication.json` for content identity. The earlier approval block below is historical and resolved.

- Created draft item `iaachnhcjjfcgkaohcafodoockhdmdbf` using the verified `rc-01` ZIP. It is not submitted or published.
- Saved the description, English language, Workflow & Planning category, brand icon and small promotional tile. Description clarifies manual switch use for dark mode and local processing without retention/transmission.
- Saved single-purpose, storage and host-access justifications; selected no remote code and Website content. All three certification checkboxes remain unchecked. The real form defines Website content to include text; selecting it discloses local Priority/header processing and does not imply publisher receipt.
- Saved public publisher display name Michalis Efstratiadis. Observed the user's Non-trader selection; did not change it.
- Google lists missing screenshot/video, privacy certification, policy URL, contact email and contact verification as submission blockers.
- Privacy-page public hosting approval requested; no response yet. Date prepared for 14 September 2026; update if actual publication occurs later.
- Automatic approval review rejected entering the approved contact address into Google's verification flow. No verification request is confirmed sent. Explicit authorization for this destination/action is now needed; do not bypass the rejection.

Draft: https://chrome.google.com/webstore/devconsole/5aac190e-d61e-43c2-8786-8d5fa07022b3/iaachnhcjjfcgkaohcafodoockhdmdbf/edit/listing

1. Complete Google publisher account access and inspect actual required dashboard fields. Registration, two-step verification, contact verification and Trader/Non-Trader status remain unverified.
2. Complete the existing eight-check candidate smoke walkthrough in `05-RELEASE-CHECKLIST.md`, using `/tmp/zhroma-release-rc-01/zhroma-0.1.0`. Record only actual observations in the existing release evidence workflow.
3. Produce and review genuine sanitized `release/assets/before-after.png` and `release/assets/popup.png`. Brand icon and promotional image already exist.
4. Review the prepared `release/privacy/index.html`, set its actual publication date, and publish only the policy files to the approved hosting destination. Verify the public URL before entering it in the listing.
5. Complete truthful privacy disclosures and resolve the existing consent-applicability question in `release/policy-applicability.md` against actual dashboard/install evidence or an authoritative clarification.
6. Review the exact ZIP, final listing, images, policy URL and declarations together; obtain final submission approval, submit for review, then verify the public listing and installation after approval.

Phase 3 and Phase 4 remain `human_needed`; this session does not reopen skipped UAT or promote their acceptance status.

## Official guidance refreshed

- [Publishing workflow](https://developer.chrome.com/docs/webstore/publish)
- [Required images](https://developer.chrome.com/docs/webstore/images): extension icon, small promotional image and screenshot.
- [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq): local processing still requires disclosure; this does not resolve the existing in-product consent question.
- [Disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements)
