---
phase: 08-themes-that-follow-dark-mode
plan: "05"
subsystem: testing
tags: [chrome-cdp, png, pixel-oracle, themes, independent-review, blocked]
status: halted
requires:
  - phase: 08-03
    provides: Eight confirmed theme choices and dual production previews
  - phase: 08-04
    provides: Root-only appearance changes and lifetime ownership
provides:
  - Independently tested PNG decoder and source-bound evidence judge
  - Nonpassing actual Chrome report with five normal pixels and explicit native-hover block
  - One independent combined implementation/security review and one local repair/recheck
  - Every-preset pending dev checklist and exact durable resume checkpoint
affects: [08-verification, 09-colouring-rules, 11-release]
tech-stack:
  added: []
  patterns: [isolated-existing-chrome, loopback-exact-source, independent-fixed-png-goldens, nonpassing-evidence]
key-files:
  created: [scripts/verify-theme-paint.js, test/extension/theme-browser-oracle.test.js, .planning/phases/08-themes-that-follow-dark-mode/08-CHROME-PAINT.json, .planning/phases/08-themes-that-follow-dark-mode/08-REVIEW.md, .planning/phases/08-themes-that-follow-dark-mode/08-SECURITY.md, .planning/phases/08-themes-that-follow-dark-mode/08-REVIEW-DISPOSITION.md, .planning/phases/08-themes-that-follow-dark-mode/08-DEV-SMOKE.md, .planning/phases/08-themes-that-follow-dark-mode/08-05-CHECKPOINT.md]
  modified: [test/extension/initial-tint.test.js, test/extension/release-package.test.js, test/extension/runtime-contract.test.js, test/extension/toggle.test.js]
key-decisions:
  - "Native-pointer capability failure remains a mandatory browser block, never replaced by pseudo-state or numerical evidence."
  - "The sole independent code reviewer also assesses security, with typed-security-dispatch limitation explicit."
  - "One local evidence-judge repair batch addresses review findings; original review identities and verdicts remain intact."
requirements-completed: []
requirements-assigned: [DARK-01, DARK-02, DARK-03, DARK-04, DARK-05, THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, THEME-07]
coverage:
  - id: D1
    description: "Independent PNG filters/CRC and evidence forgery/tolerance controls"
    verification:
      - kind: unit
        ref: test/extension/theme-browser-oracle.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: "Complete exact-source native-state browser paint matrix"
    verification:
      - kind: automated_ui
        ref: scripts/verify-theme-paint.js --output 08-CHROME-PAINT.json
        status: fail
    human_judgment: true
    rationale: "Required real pointer hover is unavailable; only5/304samples captured. Human approval cannot substitute for the failed capability."
  - id: D3
    description: "One independent review, bounded local repair and final source regressions"
    verification:
      - kind: integration
        ref: npm run test:recon
        status: pass
    human_judgment: true
    rationale: "Independent reports remain OPEN_THREATS/phase block pending complete browser evidence; repaired judging code has local recheck, not a second independent review."
  - id: D4
    description: "Source-bound every-preset real tenant/native popup smoke accounting"
    verification: []
    human_judgment: true
    rationale: "Checklist prepared with zero observed human checks; every real host/popup item remains pending."
actuals:
  tokens: 24387
  tasks: 2
  commits: 7
commits: 7
plan_head_before: 627e91ed6632b4251e0f7d471138bb2558ee185e
duration: 34min
completed: 2026-10-09
---

# Phase 8 Plan 5: Browser Paint and Bounded Review Halt

**Source-bound PNG controls and one independent review are complete; real native hover prevents the required304-case Chrome paint proof.**

## Performance

- First recorded test:2026-10-09T06:20:32Z; final verification/close-out:2026-10-09T06:54Z.
- Tasks2/3 complete in accounting; Task1 partial and blocked, not complete.
- Eleven implementation/test/report paths committed before checkpoint/summary metadata.
- Actual cost:97,546 realized diff characters /4, rounded up24,387tokens. Seven pre-metadata commits measured from the persisted plan ledger, not narrated or harness usage.

## Accomplishments and Limits

- Implemented isolated existing Chrome/NodeCDP runner serving exact inventoried production content/popup/CSS bytes and admitted sanitized topology. Four finite Priority substitutions create the matrix without depending on the captured ticket mix; computed main-text colour and source-rule ownership are checked before pixels. No user profile/private data or retained screenshot is used.
- Actual PNG decoder verifies RGB/RGBA, CRC, filter0–4, opaque/in-bounds samples and bounded formats. Independent Python-generated fixed binary goldens and fixed CRC reference supplement roundtrip controls. The judge independently recomputes each canonical expectation, requires complete ownership/source/count facts and refuses coordinated forgery and >1 full-precision channel error.
- Browser report honestly records **block**, Chrome154.0.8037.98 and only five Classic/light/normal samples. All five agree with the independent model within0.48 encoded channel. The next real-hover case fails;299cases remain missing. Full-browser agreement, previews, selected states, other modes/presets and Chrome106 execution are unproven.
- One independent gsd-code-reviewer reviewed31changed implementation/test/type/config files and all24threats, reproducing two judge defects and one correlated-control warning. One bounded repair/local recheck addresses them. The required browser capability stays open; original OPEN_THREATS22/24 and reviewed identities remain preserved.
- Every accepted preset and session check appears in08-DEV-SMOKE with **pending** real tenant/native popup status. No live observation or user skip was invented. Phase11 rerun remains required on exact release bytes.

## Task Commits

1. Task1 RED controls — `bda1d4e` (9executed expected failures; initial missing-module discovery was not treated as valid RED).
2. Task1 partial runner/nonpassing evidence — `d3f5bb1`.
3. Task2 separate inherited representation rationale — `d9d6969`.
4. Task2 immutable independent implementation/security reports — `2085f6c`.
5. Task1/2 single review repair batch and actual browser recheck — `372022f`.
6. Task2 exact findings/disposition/browser halt — `802619a`.
7. Task3 source-bound every-preset pending dev checklist — `e0870cc`.

Checkpoint/summary metadata is a separate commit. No production extension byte changed in08-05.

## Final Verification

- Both TypeScript projects pass;112/112Node smoke and1583/1583Vitest across37files, zero skips.
- Final prescribed six theme/parity/frozen suites244/244pass; browser judge15/15pass.
- Existing mutation gate52/52killed on the unchanged packaged source and unchanged mutant registry before the developer-judge-only repair. No redundant mutation rerun or new kill claim.
- Dependency approval smoke7/7pass.
- Actual final Chrome command exits1, emits THEME_PAINT_ERROR, no THEME_PAINT_OK; report statusblock,5/304. Refreshed report identity equals current source/data/method/admission/harness/test records. Cleanup completes after the1052mswork failure; no broad universal timeout proof is claimed.

## Deviations from Plan

**1. [Rule3 — Blocking representation] Four inherited test pins required deliberate restatement.** Final regression initially had78failures; separate `d9d6969` distinguishes the root-only appearance observer from row disposal/dormancy and filters delivered mutations by real target/options, admits the two palette modules in the exact16-file release inventory, retains one enable checkbox beside eight theme radios/explicit recovery button, and pins the single precomputed numeric property emission loop. Original behavioural assertions, frozen contracts and baseline remain intact. Root explicitly authorized these scoped test paths.

**2. [Rule1 — Evidence bugs] One independent review repair batch.** CR-08-01/SEC-08-01 expected-pixel forgery/ownership, CR-08-02/SEC-08-02 rounded tolerance and WR-08-01/SEC-08-03 correlated PNG controls are locally fixed by372022f with15passingcontrols and one full source recheck. Original reports are unchanged; no second independent review or further repair cycle ran.

**3. [Execution limitation] Combined independent security assessment.** Separate typed security-auditor dispatch hit the runtime thread limit. The root authorized the sole independent code reviewer to assess every threat and write08-SECURITY, explicitly labelled as that role's security assessment. No false typed-role guarantee is made.

**4. [Required capability halt] Actual native hover cannot be established.** Trusted CDP mousemove reaches the correct synthetic row but native:hover remains false even at event delivery. Bounded headless/windowed/front/focus/desktop touch investigation failed. No CSS-force/synthetic-state fallback was accepted. Task1 and plan completion remain blocked; this summary intentionally usesstatushalted and marks no requirements completed.

## Deferred Issues and Known Stubs

CB-08-01/SEC-CB-08-01 is open and mandatory. Resume via08-05-CHECKPOINT at Task1 in an environment supporting real native hover or obtain an explicit plan decision before changing the verification method. No new runtime/UI stub, skipped test or silently unrun automated command was introduced. Prepared human checks are pending, not skipped. The inherited WINDOWS ledger's unsupported accepted-risk entry11 prevents routine append; record the process gap without modifying historical entries.

## Evidence Custody and State

Production digest `de24fbe993a2fc15fd68f620a53df50c96a6f3119648cd7c211d277ae554509b`; data digest `d4db43244d51bb19c0514d29988dd16a2b7334443c42f9d5ccc232272a5e84ce`. Final harness `5a260896a5006686c152dabc46fcc58845f8504ea6e219044975e744c274c34a`; browser test `2741b275371c59835c6595aa013459dddb6821c17902abf3aa5877009b4f7423`. See checkpoint/report for full method/admission/asset identity and exact reviewed-to-repaired boundary.

Phase6 retainsgaps_found14/15,custodyfollow-up and six humanchecks. Its uncommitted close-out user report does not establish the actual private-input existence/deletion/encryption check or inspected view removal. Phase7 retainsWR-02skipped; WR-03/04/05 andIN-01–05open; WR-01/WR-06fixed. No records were relabelled or absorbed.

STATE/ROADMAP/REQUIREMENTS/state.json were not modified/committed by this executor; parent owns shared updates and must preserve incoming dirty changes. Unrelated .DS_Store/.gsd/milestone lock, Phase5walkthrough, Phase6custodycloseout and research caches remain untouched. No authentication, external publication, new package/browser install, protected-branch commit or tracked deletion occurred. No new trust boundary beyond the plan's developer loopback/evidence model was introduced.

## Self-Check: PASSED

All11committed task paths exist; all7listed task commits exist. Final report/source identities match. Required checks have their actual pass/fail results recorded; browser capability is explicitly blocked. The checkpoint and halted summary preserve continuation without promoting phase completion.
