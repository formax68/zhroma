# Plan 08-05 durable checkpoint

**Type:** human-verify
**Gate:** blocking-human
**Plan:** 08-05
**Progress:** 2/3 tasks complete; Task 1 has committed partial implementation and nonpassing evidence.
**Phase verdict:** block / required capability missing. Missing real tenant checks remain separately human_needed.

## Completed work

| Task | Work | Commits | Result |
|---|---|---|---|
| 1, partial | PNG/model/complete-evidence controls and isolated exact-source Chrome runner | bda1d4e, d3f5bb1, 372022f | 15 unit controls pass; actual browser **block**, 5/304 samples |
| 2 | Final regression, mutation/dependency checks, one independent combined implementation/security round, one bounded repair/local recheck | d9d6969, 2085f6c, 372022f, 802619a | Exact dispositions recorded; mandatory browser blocker remains explicit |
| 3 | Every accepted preset's source-bound dev checklist and Phase 11 rerun | e0870cc | Complete accounting; all real host/native popup observations **pending** |

## Current task and blocker

Task 1: independently compare real Chrome paint to final composites.

The final runner exits 1 at `zhroma-classic/light/hover/Urgent/cell`. Existing Chrome `154.0.8037.98` / protocol1.3 delivers a trusted mousemove to the correct synthetic DIV/TD within row1 at (20,10). Target and row `matches(':hover')` are false even in the mousemove callback; `document.querySelectorAll(':hover')` is empty. Headless, windowed, front/focus and explicit desktop mouse/touch settings did not establish the required native state. No user/private browser profile was used. Profile/process/server cleanup completes; final work failure recorded after1052ms. Do not infer packaged CSS is broken from this capability failure.

The numeric-only `08-CHROME-PAINT.json` retains status **block** and five captured Classic/light/normal pixels: four priority cells and one untinted control. It requires **304** samples:192 cells,64 previews,48 controls. Other presets/modes, hover/selected and all previews are unmeasured. `THEME_PAINT_OK` was not emitted. The maximum measured normal-channel error is0.48, but partial agreement cannot satisfy the gate.

## Exact final identities

- Production inventory: `de24fbe993a2fc15fd68f620a53df50c96a6f3119648cd7c211d277ae554509b` (16 exact packaged assets).
- Numeric catalog: `d4db43244d51bb19c0514d29988dd16a2b7334443c42f9d5ccc232272a5e84ce` (eight accepted IDs).
- Method: `6726a946080677823cddeb07d7d658bcb552b636035e2bcc000477a3ea6d48bf`.
- Admission report: `346e679b86c1370e3355a8cf24746e9fc89d37178bf03003d8869d0248847b20`.
- Final harness: `5a260896a5006686c152dabc46fcc58845f8504ea6e219044975e744c274c34a`.
- Final browser controls: `2741b275371c59835c6595aa013459dddb6821c17902abf3aa5877009b4f7423`.

## Verification and review cap

Final full recheck: both TypeScript projects pass;112/112 Node smoke and1583/1583 Vitest tests across37files pass, no skips. Targeted final six suites244/244 pass. Existing mutants measured52/52 killed on unchanged packaged production bytes and unchanged registry; no redundant post-judge-only mutant rerun. Dependency smoke7/7 pass. Browser verification fails as above.

One independent gsd-code-reviewer authored implementation plus all24threat assessments. Separate typed security-auditor dispatch was unavailable at the runtime thread limit; the report states this limitation. Reviewed head `d9d6969ac62509873766ba7c4c91f56d59d9a409`; reports preserved in2085f6c. One bounded repair batch372022f locally repairs CR-08-01/SEC-08-01, CR-08-02/SEC-08-02 and WR-08-01/SEC-08-03, followed by one local recheck. There was no second independent review. CB-08-01/SEC-CB-08-01 remains **open**. Original security verdict OPEN_THREATS22/24 mitigated remains historically intact; acceptance stays blocked despite local judge repairs.

## Resume routing

Resume with a fresh executor at **Task 1 browser capability verification**, preserving all listed commits and the one-round cap. First establish an existing Chrome environment where real trusted pointer movement yields native CSS hover, then run `node scripts/verify-theme-paint.js --output .planning/phases/08-themes-that-follow-dark-mode/08-CHROME-PAINT.json` through the complete exact-source matrix. The agent runs all CLI work; the user need not run commands. Do not replace native hover with CSS.forcePseudoState, dispatchEvent, computed RGBA or a human rubber-stamp. No dependency/browser download or private-profile access is authorized.

If that capability cannot be established, retain block and obtain an explicit plan decision before changing the required verification method. Do not begin a second review/repair cycle. Record new source/harness/test identity if bytes move and invalidate affected evidence. Human Zendesk/popup checks remain pending until actual user-controlled observation; optional absence is not a skip. Phase11 must repeat full regression and every-preset/session checks on release bytes.

Shared STATE/ROADMAP/REQUIREMENTS/state.json remain the orchestrator's responsibility and were not edited/committed by this executor. Preserve Phase6 gaps_found14/15/custody/six human checks, Phase7 WR-02 skipped and WR-03/04/05 plus IN-01–05 open. Do not absorb the uncommitted custody closeout or repair the inherited WINDOWS accepted-risk entry11.
