# Dependency Approval Record

Installed versions and commit chronology are machine-checkable in `package.json`, `package-lock.json`, and Git history. The historical approval event is a human attestation. The developer answered the two exact-version questions separately on 2026-09-05; their verbatim answers are below. Independence of the original approvals remains unconfirmed.

## Exact-version attestations

| package | approved-version | approval-basis | attestation-state | attested-on |
| --- | --- | --- | --- | --- |
| vitest | 4.1.11 | Developer answered "yes" to approval of this exact version before installation | attested | 2026-09-05 |
| happy-dom | 20.13.1 | Developer answered "yes" to approval of this exact version before installation | attested | 2026-09-05 |
| typescript | 7.0.2 | Developer answered "Yes, approve 7.0.2" to approval of this exact version before installation | attested | 2026-09-28 |
| @types/chrome | 0.3.0 | Developer answered "Yes, approve 0.3.0" to approval of this exact version before installation | attested | 2026-09-28 |

## Questions and verbatim answers

1. Did you approve `vitest@4.1.11` as that exact version before it was installed?

   > yes

2. Did you approve `happy-dom@20.13.1` as that exact version before it was installed?

   > yes

3. Do you approve `typescript@7.0.2` as that exact version, as a dev-only dependency, before it is installed? Registry page: https://www.npmjs.com/package/typescript

   > Yes, approve 7.0.2

4. Do you approve `@types/chrome@0.3.0` as that exact version, as a dev-only dependency, before it is installed? Registry page: https://www.npmjs.com/package/@types/chrome

   > Yes, approve 0.3.0

5. If `typescript@7.0.2` cannot check this project's JavaScript, do you approve `typescript@6.0.3` as the exact fallback version?

   > Yes, approve 6.0.3 fallback

   The fallback was not installed: `typescript@7.0.2` ran on this machine (`tsc --version` printed `Version 7.0.2`), so `typescript@6.0.3` is approved but unused.

The Phase 7 questions (3, 4 and 5) were asked separately, one package per question, on 2026-09-28, after the npm registry was re-read in the same session and before either package was installed.

## Independence — answered separately

Question: Were the two approvals given independently—neither inferred from nor bundled with the other?

Developer answer, verbatim, received 2026-09-05:

> I don't remember, it should be fine

Independence attestation state: `not-attested`.

The developer cannot recall the independence of the historical approvals. The phrase "it should be fine" is not evidence that the approvals were independent. The two per-package attestations do not establish independence, and verification truth 8 remains uncertain on that point.

This would be settled by an independent contemporaneous record of both separate approvals before installation, or an explicit historical re-attestation based on recollection. Passing the version drift tests proves record consistency only.

## Subsequent explicit risk disposition

On 2026-09-08, after the approval-history gap and its consequence were explained, the user stated:

> risk accepted

This accepts proceeding despite the unverified historical independence of the original approvals. The independence attestation remains `not-attested`; no historical event is re-attested by this decision. See `.planning/phases/01-dom-recon-spike/01-RISK-ACCEPTANCE.md` and security risk AR-01-13 for the separate governance disposition.
