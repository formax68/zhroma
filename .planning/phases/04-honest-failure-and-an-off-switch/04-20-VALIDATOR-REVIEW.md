---
phase: 04-honest-failure-and-an-off-switch
plan: "20"
reviewed: 2026-09-11T09:47:13Z
depth: standard
reviewer: independent gsd-code-reviewer /root/phase04_plan20/validator_review
review_cycle: 3
diff_base: 70ad1e5
diff_sha256: 9abf9a910f5eb36140a7d862920194412cad42284820e08fdad67e89ccdd32f4
files_reviewed: 5
files_reviewed_list:
  - test/extension/phase-04-live-acceptance.test.js
  - .planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md
  - .planning/phases/04-honest-failure-and-an-off-switch/04-VALIDATION.md
  - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE.md
  - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
gate: pass_for_task_2_human_checkpoint
---

# Plan 04-20 Task 1 Independent Validator Review

**Current disposition: cycle 3 PASS for Task 2's human checkpoint, zero actionable findings.** Counts decreased **4 → 2 → 0** within the three-cycle bound. Earlier findings and rechecks below remain historical evidence; the final cycle 3 section supersedes their current counts and gate rationale. This is validation-tool clearance, not human acceptance or overall phase completion.

## Narrative Findings (AI reviewer)

The exact five-file diff has four actionable findings. Task 2 remains blocked until narrow validation repairs receive independent recheck. This report does not replace canonical 04-REVIEW.md or 04-SECURITY.md. No runtime/tool/harness repair was discovered or performed in this bounded review.

### CR-20-01: Two three-state requirements can complete without unreadable-state observations

**Classification:** BLOCKER.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:169-172`; corresponding mapping in `04-VALIDATION.md`.
**Issue:** FAIL-01 requires distinguishing normal, missing-column and unreadable-locale states; FAIL-05 requires seeing those states in the toolbar. Neither mapping requires `language-icon-copy` or `structure-copy`. With both waived rows pending, the other fifteen checks passed, genuine readiness represented by true test inputs, and resolved judgment test inputs, the actual pure guard accepts checked/Complete FAIL-01 and FAIL-05. Independent in-memory probes returned `true` for both. AR-04-01 permits progression; it does not establish the missing state or authorize completion of other requirements.
**Fix:** Require the unreadable-state observations for both mappings; add direct negative controls for each omitted observation and synchronize the evidence mapping. Preserve both waived rows as pending.

### CR-20-02: Technical readiness trusts old reports without matching their reviewed runtime

**Classification:** BLOCKER.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:452-458`.
**Issue:** The actual repository adapter reads only zero-blocker/verdict strings from code/security reports. It ignores their `reviewed_revision` and `runtime_digest`. Updating the acceptance and timing binding after a source change therefore allows the old technical review to remain ready. Direct in-memory report substitutions setting both reviewed revisions and runtime digests to zero still produce `codeReviewReady: true` and `securityReviewReady: true`. Current runtime hashes happen to match both reports today; the defect is the new guard's inability to enforce that required relationship on the later-runtime-edit path.
**Fix:** Derive technical readiness from strict current report metadata and exact reviewed recursive inventory/revision identity, rejecting missing, stale or mismatched identities. Keep the pure guard's explicit readiness input and avoid requiring the validation report under generation to certify itself. Add independent positive and stale-report controls.

### WR-20-01: Hypothetical controls fail after legitimate canonical promotion

**Classification:** WARNING.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:399-405`, `:428-445`.
**Issue:** Hypothetical tests derive their initial state from the real canonical document. Once FAIL-01 legitimately becomes checked, the checkbox replacement is a no-op and `expect(forged).not.toBe(markdown)` fails. The Pending/Gaps Found test also passes actual Complete requirements to an explicitly pending example and expects success. This couples test reliability to today's incomplete project state and obstructs valid future Task 3 promotion. Direct in-memory promotion of FAIL-01 proves the replacement becomes identical.
**Fix:** Normalize only in-memory hypothetical documents into a known pending/unchecked baseline, exercise Pending and Gaps Found explicitly, and retain a separate unmodified actual-file guard. Demonstrate controls remain meaningful when their source document begins legitimately checked/Complete.

### WR-20-02: Malformed language tags satisfy genuine regional-English evidence

**Classification:** WARNING.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:260-265`.
**Issue:** The revised regular expression accepts arbitrary 2–8 character subtags and does not validate their structure. Both `en-12` and `en-GB-GB` are admitted as regional-English evidence by the actual validator; installed Node's `Intl.getCanonicalLocales` rejects each with `RangeError`. This admits malformed tags into a slot expressly requiring genuine regional-English evidence. The exact ordered descriptors and rejection of valid English-family tags in the non-English slot otherwise work.
**Fix:** Validate well-formed language tags before enforcing the raw case-insensitive English-family and slot predicates. Preserve mixed-case legitimate tags and add malformed-tag negative controls; do not broaden the product's supported language set.

## Exact reviewed identity

`git diff 70ad1e5 --` with precisely the five listed paths hashes to `8830425c69f51298bfb9cba58acf3eda7636d121e8da4d19eebe741921cdbbc3`, independently matching `/tmp/zhroma-04-20-review.diff`.

| File | SHA-256 |
|---|---|
| test/extension/phase-04-live-acceptance.test.js | 7e330ba9c11cef277b5763c94aeb291542441afe66f5a91d82002ba339885e9c |
| 04-LIVE-ACCEPTANCE.md | 982be8b23e9d25c396d4b241b7f2e994346fc91d6289f12845459806c336520f |
| 04-VALIDATION.md | 4d93910fb80f4ed87949b48a4889c025ed9f1b644198dad62db4cafb0340bb48 |
| 04-PERFORMANCE.md | 3a3b4fc218e7649e7dc5d37e6c17ba597c45f4247a76654dbc4b956735a5ddd0 |
| 04-PERFORMANCE-SAMPLES.json | d74114bb9447fb2cf4de602d44ba53782890a566961ab61a250633880ec3dfda |

The evidence filenames above are relative to this phase directory. All eleven current shipped files independently match Git revision `255ba31e2b25f7b8c5bde8a3900fb93151594f50`. SHA-256 of sorted `hash  extension/path` lines with newlines is `46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065`. Runner followed by workload bytes hash to `285074ead931dde0f5212951835e10da5e1fb70ba1f8d1a51142ee93b715617b`.

## Commands and independently checked evidence

- Ran `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-04-live-acceptance.test.js`: **75/75 passed**, one executed file, exit 0; repository disposition `human_needed`. Passing tests did not detect the four findings above.
- Ran `node --input-type=module -e` probes evaluating the unchanged validator function bodies in memory with their actual Node dependencies and real current samples; no source or canonical data was written. Counterexamples and exact observed outcomes are in each finding. Also checked invalid-tag behavior with installed `Intl.getCanonicalLocales`.
- Recomputed the entire seven-run sample object with `validateWorkloadReport` and `summarizeSamples`: **7/7 passed**, all 42 operation matrices contain 100 measurements, all stored metrics equal independent recomputation. The temporary output is byte-identical to the canonical JSON.
- Read executor raw default, mutation, workload and smoke logs, now retained in `04-20-MEASUREMENTS.json`: default **65 smoke + 975 Vitest**, 22 Vitest files; mutation **39/39 intended behavioral kills**; smoke `smoke_passed`; seven sequential workload start/completion pairs. These are inspected executor outcomes, not additional reviewer browser executions.
- Inspected the measured raw/normalized RED evidence and its retained gate results. Locale and false-canonical controls preceded implementation; these do not cover the independent counterexamples above.
- Independently derived predecessor observation revision using `git log -1 --format=%H -- .planning/phases/03-the-tint-survives-everything/03-LIVE-ACCEPTANCE.md`: `3979fb0730c6f778ddd31ad5ec89cfa997b79cc5`. Derived last extension revision at that record: `382cc881334aa7edf2103150bd8fe663236b6357`. All three recorded prior asset hashes match `git show` bytes. Current Phase 3 record is unchanged from 70ad1e5, **11 pass / 9 pending / 0 fail**, `human_needed`.
- Independently compared all five historical files against `/tmp/zhroma-preserved-history-inventory.json`: **5/5 identical**. Fourteen original observations retain their historical provenance.
- `git diff --check --` on the changed validator/evidence Markdown paths: exit 0. No project AGENTS.md, .codexignore or project skill directories exist; configured `agent_skills` is empty. Existing ignored/private paths were not reviewed.

The sample identity is Chrome/153.0.8010.37, Darwin 27.0.0 arm64, Apple M5 Max, throttle 1, headless. The completed-run interval is 09:24:41.220Z–09:27:19.613Z. Enabled 30/200/1000 largest family medians are approximately 1.3/3.9/11.7 ms; maximum batches 1.8/4.9/13.6 ms. All disabled runs have absent runtime and zero callbacks/writes. The separate 30-row dormant run has loaded runtime, zero callbacks/writes, zero observers and zero pending timers. Counts total 4200 measured operations plus 420 declared warmups. No mixed identity or disabled/dormant relabeling was found in the supplied samples.

## Gate and limits

**BLOCK — four actionable validation findings (2 BLOCKER, 2 WARNING).** This is cycle 1's initial review; no repair cycle has yet been rechecked. At most three bounded cycles are authorized, with a mandatory stop if actionable findings do not decrease.

The live record retains exactly `['en','en-*','non-English']`, seventeen pending rows with null evidence, `loaded_from_repository:false`, `source_confirmed_on:null` and every environment member null. Existing qualified judgment text and AR-04-01's two-row waiver remain intact. No ACK, prohibition judgment or live observation was manufactured. Synthetic samples do not prove live responsiveness, layout/retainer attribution, restart, cleanup or product judgment. This review does not close deferred T-04G3-21..24, goal verification, Phase 3 human gates, the seven unclassified edges, or canonical phase acceptance. Any discovered runtime/tool/harness defect must return through 04-19; none was identified here. Only this review artifact was written by the reviewer; no commit was made.

## Cycle 2 independent recheck — 2026-09-11T09:43:39Z

**BLOCK: actionable count decreased 4 → 2.** CR-20-01 and WR-20-02 are closed. The explicit independent expected mapping now covers both unreadable-state rows for FAIL-01/FAIL-05. Well-formed tag checking rejects both malformed counterexamples and retains mixed-case, script/region and Unicode-extension English examples. CR-20-02 and WR-20-01 remain open on adjacent same-mechanism counterexamples below. One final bounded cycle remains; a nondecreasing count requires stopping.

The supplied `/tmp/zhroma-04-20-review-cycle2.diff` independently hashes to `b085df03b729e55501759a7f27d6fe2b8b3d11fba6e21928809871859029996c`. During review, evidence bookkeeping changed the working five-file diff to `5a60ae21f7a631c7e70960a8e0bb7a1a9d48ed6324619259d11c79215a586008`; the reviewed validator bytes remained `40b33fe9e57ca865b12991c4ad1ad2619b789c715ff48abd55d59171261da21d`. This review does not conflate the two captures.

| Working file at recheck capture | SHA-256 |
|---|---|
| test/extension/phase-04-live-acceptance.test.js | 40b33fe9e57ca865b12991c4ad1ad2619b789c715ff48abd55d59171261da21d |
| 04-LIVE-ACCEPTANCE.md | 3fdc1640683dc52d7289ba5e2801b27dca2e7c9fe44c4170b1110545f92c09f6 |
| 04-VALIDATION.md | 81f27fafa589a7b1dd55161800c2d7eb40c381ca8387a2915f51089001f05896 |
| 04-PERFORMANCE.md | 3a3b4fc218e7649e7dc5d37e6c17ba597c45f4247a76654dbc4b956735a5ddd0 |
| 04-PERFORMANCE-SAMPLES.json | d74114bb9447fb2cf4de602d44ba53782890a566961ab61a250633880ec3dfda |

### CR-20-02 recheck — contradictory metadata remains ready

**Classification:** BLOCKER; same readiness mechanism, still open.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:206-227`.
The new runtime check correctly rejects stale digests, an invalid revision and the real older `77b3a19` revision. However, readiness uses matching-line presence rather than unique metadata values. Independent actual-function probes appended `runtime_blockers: 1` after `runtime_blockers: 0`, and `technical_threats_open: 1` after its zero value: both report readiness booleans stayed true. Appending `runtime_digest: invalid` after a correct digest also leaves both true because only correctly shaped values are counted. Such contradictory report metadata cannot establish zero defects or an unambiguous source identity. The validation readiness fields use the same pattern.

**Fix:** Require a single unambiguous occurrence of each relevant metadata key before validating its exact value; reject duplicates even if one value is malformed. Apply this to source, verdict, blockers, technical-tests and ACK inputs, with contradictory and malformed duplicate controls.

### WR-20-01 recheck — genuine reset acknowledgement breaks a new test

**Classification:** WARNING; same canonical-state coupling, still open.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:520-525`.
Normalization repairs the original hypothetical REQUIREMENTS controls. The new positive-readiness test now reads actual VALIDATION and hard-asserts `historicResetAcknowledged` false. Changing only the in-memory validation field from outstanding to acknowledged correctly returns true, which makes that assertion fail after genuine Task 2 acknowledgement. No user response should require repairing an unrelated positive test.

**Fix:** Supply explicit hypothetical validation text for outstanding/acknowledged readiness controls, and retain the separate actual-file promotion guard without asserting that genuine human progress must stay absent.

Reviewer reran `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-04-live-acceptance.test.js`: **85/85 passed**, one executed file, exit 0, actual status human_needed. Direct in-memory `technicalReviewReadiness` probes produced the outcomes above, including a successful current-inventory positive control. Inspected seven intended assertion failures in `/tmp/zhroma-04-20-review-red.json` (82 selected/filtered total, seven failed, 75 filtered); no module-load failure substituted for RED. Executor's completed full default recheck log shows **65 smoke + 985 Vitest** across 22 files. Runtime/tool/harness/sample bytes and the live-human boundaries remain unchanged; no browser execution or mutation rerun was performed by this reviewer.

## Cycle 3 final independent recheck — 2026-09-11T09:47:13Z

**PASS for Task 2's blocking human checkpoint. Zero actionable findings; 4 → 2 → 0.** This is the final authorized bounded cycle. All four finding IDs are closed for the reviewed validation diff, with their original classifications and evidence retained above.

CR-20-02 now extracts a single value for each relevant metadata key before checking its value. Bare and quoted duplicates, including invalid-valued duplicates, return no valid field. Exact current aggregate, the reviewed revision's recursive inventory and every asset byte remain prerequisites for code/security readiness. Missing or invalid revisions fail closed through bounded read-only Git invocations. No readiness dependency on this review report was introduced.

WR-20-01 now uses explicit in-memory validation documents for outstanding and acknowledged controls. The real canonical file remains unmodified input to the separate actual promotion guard. Genuine acknowledgement is accepted without requiring an unrelated test edit. CR-20-01's complete unreadable-state mappings and WR-20-02's well-formed raw language-tag checks remain intact.

### Final exact scope and identity

Both independently recomputed working diff `git diff 70ad1e5 --` over the five owned paths and `/tmp/zhroma-04-20-review-cycle3.diff` hash to **`9abf9a910f5eb36140a7d862920194412cad42284820e08fdad67e89ccdd32f4`**. All five files remained frozen during this final appraisal.

| Reviewed file | Final SHA-256 |
|---|---|
| test/extension/phase-04-live-acceptance.test.js | 534ef7de8c882c82e11b923d3a3c016c4857ac8c95f47969688642322a4c4ca7 |
| 04-LIVE-ACCEPTANCE.md | 7023677fb13eb5bb23b7c9b52f6d0285b3287f2b20e20fe5d05b5a8aa390198c |
| 04-VALIDATION.md | 44629a7c56c90c45a9a09fa3d5202932b4eda840ccbd6455de006a038f982bad |
| 04-PERFORMANCE.md | 3a3b4fc218e7649e7dc5d37e6c17ba597c45f4247a76654dbc4b956735a5ddd0 |
| 04-PERFORMANCE-SAMPLES.json | d74114bb9447fb2cf4de602d44ba53782890a566961ab61a250633880ec3dfda |

This is the pre-appraisal-result metadata snapshot. Appending an attributed review outcome later changes VALIDATION's file/diff digest; it must name this reviewed digest and retain this snapshot, rather than claim the later metadata file has the same hash. Semantic changes or source/test changes require their own gate and are not covered by a metadata-only appendix.

### Final verification and counterexamples

- Reviewer independently ran `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-04-live-acceptance.test.js`: **94/94 passed**, one executed file, exit 0, repository `human_needed` (12:46:23 local, duration 1.81 seconds).
- Reviewer ran actual unchanged function bodies through in-memory Node probes: **21 negative controls rejected**. These comprise 12 bare/single-quoted/double-quoted duplicate code metadata controls across four keys, three duplicate security fields, two duplicate technical/ACK fields, and four independently omitted unreadable observations across FAIL-01/FAIL-05. No disk claim was changed.
- Two legitimate checked/Complete positive controls passed with all required observed fields represented solely as test data, resolved judgment test inputs and explicitly acknowledged test metadata. Actual current reports yield code/security/test readiness true; the hypothetical ACK update yields ACK true. These controls prove the guard permits genuine progress without asserting such progress happened.
- Read the nine pre-fix intended duplicate-metadata assertion failures in `/tmp/zhroma-04-20-metadata-red.json` and matching raw TAP: command selected `review metadata gap:`, exit 1, 94 total, nine failed, 85 filtered. This is actual behavioral RED, not a failed import. The final 94-test run exercises the corresponding repaired checks.
- Inspected the completed executor `/tmp/zhroma-04-20-default-cycle3.log`: **65 smoke + 994 Vitest**, 22 Vitest files passed, no skipped smoke checks. This is the full default rerun after the final validator repair. The unchanged 39 intended mutation kills and seven actual synthetic Chrome runs retain the already independently checked evidence described above; the reviewer did not launch additional browser runs.
- Independently rechecked all **11/11** shipped files against `255ba31e2b25f7b8c5bde8a3900fb93151594f50`: byte-identical. Runtime aggregate remains `46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065`; runner/workload concatenation remains `285074ead931dde0f5212951835e10da5e1fb70ba1f8d1a51142ee93b715617b`. Samples are unchanged from the fully parsed cycle 1 matrix.
- Checked revised LIVE prose against current popup copy and mixed/disabled behavior: it describes expected current-source uncertainty without populating observations, and correctly distinguishes FAIL-03's regional-English row from the two historically waived scenarios. Final scoped whitespace check exits 0.

### Remaining non-review gates

Seventeen current-source checks remain pending; source confirmation is false/null and all environment fields null. ACK-04-01 remains outstanding in the real document. AR-04-01 remains limited to its original two pending scenarios. The three prohibition statuses and qualified historical judgments, fourteen preserved historical attestations, seven unclassified edge assumptions and Phase 3's independent human_needed disposition are not promoted. The final checkpoint must obtain the user's own evidence and judgment; a validator cannot provide them. Runtime code/security reviews, synthetic timing, independent goal verification and human acceptance remain separate outcomes. No new permission, package, account action, runtime change or commit occurred in this review. No out-of-scope runtime/tool/harness defect was identified; if one arises, the required route remains 04-19.
