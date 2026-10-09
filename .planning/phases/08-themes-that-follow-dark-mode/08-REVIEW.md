---
phase: 8
reviewed: 2026-10-09T06:44:25Z
reviewer: gsd-code-reviewer
depth: standard
round: 1
status: issues_found
phase_verdict: block
branch: codex/phase08-themes
diff_base: b7388405f9393a1929e17cd7f3a65ea0f5323983
reviewed_head: d9d6969ac62509873766ba7c4c91f56d59d9a409
production_digest: de24fbe993a2fc15fd68f620a53df50c96a6f3119648cd7c211d277ae554509b
data_digest: d4db43244d51bb19c0514d29988dd16a2b7334443c42f9d5ccc232272a5e84ce
artifact_digests:
  colour_method: 6726a946080677823cddeb07d7d658bcb552b636035e2bcc000477a3ea6d48bf
  preset_report: 346e679b86c1370e3355a8cf24746e9fc89d37178bf03003d8869d0248847b20
  selectors: 6f55dd849b4d723d4eb37bc175179ffdaa41c000ad0d531bca7f72f607febd84
  dark_fixture: c726244faade76c293fbe3ead63627fb310a4c6fecc24cfca3a71345a316ada6
  browser_harness: 616a9d926c59edf6c46b4c227e5b1a767cc9b0a646e73a6f4dd1f59f643d16e8
  browser_test: 3c3c828b40067bab226027988ccc49f663490fa9e741557e5aa50b0dcbdfd213
files_reviewed: 31
files_reviewed_list:
  - extension/background.js
  - extension/content.js
  - extension/manifest.json
  - extension/popup.html
  - extension/popup.js
  - extension/zhroma-colour.js
  - extension/zhroma-settings.js
  - extension/zhroma-themes.js
  - extension/zhroma.css
  - scripts/release-source.js
  - scripts/verify-theme-paint.js
  - test/extension/chrome-harness.js
  - test/extension/initial-tint.test.js
  - test/extension/parity.test.js
  - test/extension/persistent-tint.test.js
  - test/extension/release-package.test.js
  - test/extension/runtime-contract.test.js
  - test/extension/settings-queue.test.js
  - test/extension/settings-reader.test.js
  - test/extension/theme-browser-oracle.test.js
  - test/extension/theme-colour.test.js
  - test/extension/theme-popup.test.js
  - test/extension/theme-runtime.test.js
  - test/extension/theme-tracer.test.js
  - test/extension/theme-validation.js
  - test/extension/toggle.test.js
  - test/extension/toolbar-popup.test.js
  - test/extension/tracer-world.js
  - test/mutants/settings-foundation.mutants.json
  - tsconfig.json
  - types/zhroma.d.ts
findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
production_defects_proven: 0
judging_blockers: 2
mandatory_capability_blockers: 1
---

# Phase 08 implementation review

One independent standard-depth round reviewed the changed production modules, developer paint runner, numerical validators, browser/popup/runtime/tracer tests, and changed inherited test/harness/mutation representation against the source identity above. The diff contains 31 reviewable files, rather than the initial estimate of 29. Full new modules and tests were read; inherited test changes were examined with their surrounding helpers and contracts. No structural pre-pass was supplied.

The phase is **blocked**. Two defects allow the paint evidence judge to accept incorrect evidence; one control warning weakens decoder independence. Separately, the required browser execution stops at 5/304 samples because native hover never activates. No new packaged runtime defect was proved in this bounded round. That is not a production, browser, or human acceptance attestation.

Context included PROJECT/config, 08-CONTEXT, all five plans and their threat tables, summaries 01–04, COLOUR-METHOD, PRESET-REPORT, CHROME-PAINT, DEV-SMOKE, RETROSPECTIVE, and 07-REVIEW-DISPOSITION. The security assessment in 08-SECURITY.md is authored independently of execution by this same code-reviewer; a separately typed security-auditor dispatch was unavailable due to the thread limit.

## Narrative Findings (AI reviewer)

### CR-08-01 — BLOCKER: complete-report acceptance trusts self-declared pixel expectations

**File:** /Users/mike/code/zhroma/scripts/verify-theme-paint.js:94–100  
**Related control:** /Users/mike/code/zhroma/test/extension/theme-browser-oracle.test.js:55–64  
**Kind:** Evidence validator defect; critical tier.

**Mechanism and impact:** The validator checks the identity object, labels, complete unique keys, and agreement between each supplied measured and supplied expected pixel. It never derives the expected pixel from the identified record, mode, state, priority, and case kind. It also does not require browser identity, count breakdown, served-byte inventory, or CSS/text/native-state ownership evidence. A caller can provide all 304 keys with identical expected/measured pixels and obtain true even when the represented paint is wrong. Digest strings identify a claimed source; they do not establish the measurement's provenance.

**Independent evidence:** A read-only Node invocation constructed all caseKeys(records) with expected=[21,26,30], measured=[21,26,30], maxError=0 and only status, identity, cases, measurement, tolerance. requireCompleteReport returned true for all 304 fabricated samples. The existing positive fixture at test lines 57–59 explicitly admits that construction; its forged-pixel control changes only measured, so it cannot expose coordinated alteration or missing ownership metadata. The live runner itself samples decoded PNG pixels and checks ownership before sampling; this finding does not assert that the current blocked report was fabricated.

**Specific fix:** Recompute expectations from the canonical source records and parsed exact case key, including untinted controls. Require the 192 cell / 64 preview / 48 untinted count breakdown, nonempty browser/version and measurement metadata, exact served-source inventory, and case-specific native state, production cell/text ownership and untinted-marker evidence. Reject absent/malformed evidence before arithmetic. Add negative controls that alter both supplied expected and measured, omit each required evidence field, forge state/style/source ownership, and supply wrong count breakdowns. A positive scaffold must carry valid source-derived expectations and required evidence rather than weakening the acceptance contract.

### CR-08-02 — BLOCKER: rounding expands the explicit channel tolerance

**File:** /Users/mike/code/zhroma/scripts/verify-theme-paint.js:30–35  
**Kind:** Evidence validator defect; critical tier.

**Mechanism and impact:** maxError measures distance from Math.round(expected[i]), rather than from the full-precision expected channel. Rounding plus the permitted one-channel error can accept a difference approaching 1.5. This contradicts the stated <=1 encoded-channel measurement gate and overstates the remaining margin.

**Independent evidence:** comparePixel([100,0,0],[101.49,0,0]) returns maxError=1 and rasterMargin=0, although the channel difference is 1.49. This is distinct from the numerical contrast/distance validators, whose acceptance comparisons use full precision.

**Specific fix:** Compare measured directly to the full-precision expectation; round only display values. Add exact-boundary, just-above-boundary, and the 1.49-error refusal control. Preserve measured integer pixels and unrounded model channels in the durable report.

### CB-08-01 — BLOCKER: required native-pointer browser capability is unfulfilled

**File:** /Users/mike/code/zhroma/scripts/verify-theme-paint.js:149–168  
**Evidence:** /Users/mike/code/zhroma/.planning/phases/08-themes-that-follow-dark-mode/08-CHROME-PAINT.json:108  
**Kind:** Mandatory capability/evidence blocker; critical tier, not a proved production defect.

**Mechanism and impact:** The runner requires actual CSS :hover from CDP mouse movement. The durable report has status=block, Chrome/154.0.8037.98, and only five captured cases: Classic light normal's four priority cells and one untinted control. The next case, Classic/light/hover/Urgent/cell, fails because row hover is false. The trusted mouse event reaches the correct synthetic row, including the event callback, but neither target nor row matches :hover and document.querySelectorAll(':hover') is empty. The required 304 matrix therefore lacks hover/selected, other theme/mode, and preview evidence. The failure remains truthful; there is no CSS.forcePseudoState fallback.

**Specific resolution:** Restore a browser environment in which real trusted pointer movement produces native CSS hover, then run the exact served bytes through all 192 cells, 64 previews and 48 controls. Retain the correct state/ownership refusal checks. Forced pseudo-state, synthetic pointer events, copied expectations, or green unit suites cannot satisfy this capability. Until resolved, 08-05 and phase closure remain blocked. This review does not infer that packaged CSS is broken from an unavailable probe capability.

### WR-08-01 — WARNING: PNG golden controls share the decoder's predictor and CRC

**File:** /Users/mike/code/zhroma/test/extension/theme-browser-oracle.test.js:6–29  
**Related implementation:** /Users/mike/code/zhroma/scripts/verify-theme-paint.js:42–74  
**Kind:** Test reliability / judging independence.

**Mechanism and impact:** The test PNG encoder imports the decoder's crc32 and reproduces the same left/up/corner predictor, average and Paeth decision logic. A matching encoder/decoder error can cancel during a round trip, leaving apparently correct pixels. Calling these independently authored golden rows overstates what they establish. No concrete decoder defect was proved.

**Specific fix:** Keep these as round-trip controls and add fixed binary RGB/RGBA PNG vectors generated by an independent implementation, with precomputed filtered scanlines, expected pixels, all five filters, multiple rows and Paeth boundary/tie cases. Add the fixed CRC32 reference for ASCII 123456789 and malformed/CRC refusal controls. Do not generate the independent vectors with the JavaScript predictor or crc32 under test.

## Source and control assessment

- **Numerical judging:** The developer validator checks full-precision contrast and Oklab distances, each state's Classic baseline floors and untinted/native distinctions. The independent test transcription exercises source-over composition and fixed conversion/CVD golden vectors rather than relying solely on production preview output. Duplicate/tied priorities and numerical boundary negative controls exist. The CVD model uses linear-light matrix application, clamping and re-encoding. These are model-based admission checks; they establish neither universal human colour perception nor native browser paint. The browser expectation transcription is separate from production colour.preview; CR-08-01/02 concern its admission checks.
- **Registry/emitter and custody:** zhroma-colour.js:26–40 confines emitted CSS to finite bounded RGB and alpha. zhroma-themes.js:142–150 validates all eight slots and complete semantic mappings and freezes nested values. The source inventory in release-source.js:103–142 excludes missing/extra/symlinked bytes and compareReleaseSources:180–191 compares hashes. All 12 cached primary palette/licence files independently rehashed to their recorded pins and byte counts. Nord's decoded source.notice at zhroma-themes.js:193 exactly equals the pinned licence bytes; the escaped slashes preserve the URL's runtime value. Credits accurately distinguish original contributions and retained upstream attribution.
- **Popup ownership and truthful claims:** background.js:499–527 restricts reads to the exact popup sender and exact request shape and refuses unsettled queue/generation reads; :549–556 admits only existing trusted writers. popup.js:207–289 maintains last confirmed choice while pending, request ownership, exact reply validation, truthful failure/unknown states and one bounded readback. An older read cannot acquire a newer owner's state. “Saved” remains separate from “applied”; unreadable fallback has distinct copy. Native radio/label structure and visible non-colour selection/focus controls exist; keyboard, zoom and screen-reader use remain human checks.
- **Root appearance boundary:** content.js:76–108 writes only the 12 fixed root properties and observes only html[data-theme], with exact dark selection and safe light fallback. It performs no palette-driven row interpretation. Settings generations (:565–605), pagehide suspension and restore avoid stale read landing. Existing table, locale, top-frame, row-interpretation and lifecycle admission remain intact. zhroma.css changes only the four stamped direct-cell background declarations with literal Classic fallbacks; host hover/selection/text and group headers are retained.
- **Browser evidence controls:** The runner uses actual screenshot PNG decoding and 3x3 interior samples, not computed-RGBA assertions. It inspects text, native state, stamped marker and matching CSS rule ownership before recording cells (:149–157). Exact local source routes and inventory checks support served identity, but the exported report judge does not enforce those facts (CR-08-01). Decoder malformed/opacity/bounds/filter checks are present; independent decoder goldens remain deficient (WR-08-01). Reconstructed sanitized fixtures and injected local storage listeners are synthetic integration evidence, not live extension transport or live Zendesk tenant observation.
- **Regression representation:** Inherited test changes load the actual manifest/module inventory, distinguish the new root observer from row observers and model target/type/attribute filtering. Classic parity's mutant changes the effective registry alpha. No newly changed assertion was found to abandon the inherited table/locale/network boundary. Historical findings WR-02 (skipped), WR-03/04/05 and IN-01–05 (open) remain unchanged and are not reopened or closed here.

## Evidence limits and disposition boundary

Executor reconciliation records report passing typechecks, 112/112 smoke assertions, 1577/1577 Vitest tests in 37 files, 52/52 inherited mutation kills, 7/7 dependency checks and six targeted suites at 238/238. The reconciliation and mutation logs were inspected; dependency/targeted counts are executor-reported. These outcomes are separate from this source review and the required Phase08 browser gate. Historical LIVE ACCEPTANCE STATUS labels in regression output refer to their pinned historical judges and cannot rebind prior observations to the new theme bytes.

08-CHROME-PAINT remains 5/304 and blocked. No live tenant/browser UI human evidence was supplied. Chrome106 compatibility, focus/keyboard/zoom/readability and the listed human acceptance checks remain pending/human_needed. Phase06 gaps_found/custody and Phase07 dispositions are not implicitly cleared. Plan08-05 permits one bounded repair/local recheck of relevant findings; that executor disposition must identify new bytes and must not claim a second independent review or that this original report reviewed repaired bytes.

_Independent reviewer: gsd-code-reviewer. One source-bound round; no source edits or commits._

