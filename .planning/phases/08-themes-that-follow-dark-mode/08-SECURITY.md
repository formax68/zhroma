---
phase: 8
audited: 2026-10-09T06:44:25Z
auditor: gsd-code-reviewer
assessment: independent gsd-code-reviewer security assessment
typed_security_auditor_dispatch: unavailable_due_to_thread_limit
depth: standard
round: 1
asvs_level: 1
block_on: high
verdict: OPEN_THREATS
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
threats_total: 24
threats_mitigated: 22
threats_open: 2
blocking_open_threats: 2
nonblocking_open_threats: 0
mandatory_capability_blockers: 1
---

# Phase 08 security assessment

**Verdict: OPEN_THREATS.** Two registered high-severity threats remain open in the browser evidence judge. The current blocked browser report is truthful, but the acceptance helper can admit fabricated or over-tolerance measurements. The required native-pointer execution independently remains incomplete at 5/304.

**Role:** independent gsd-code-reviewer security assessment; separate typed gsd-security-auditor dispatch unavailable due thread limit. This agent read that role's threat-audit instructions and audited the registered threats in this same independent round. A separately typed auditor did not run, and its resolver/effort was not applied. This assessment is independent of the executor, but not a second independent implementation review or full ASVS certification.

The scope and exact 31-file inventory are recorded in 08-REVIEW.md. PROJECT/config, Phase08 context and all five threat tables supplied the trust boundaries. Existing Phase07 dispositions and Phase06 human/custody gaps retain their status.

## Registered threat assessment

Paths below are relative to /Users/mike/code/zhroma. “Mitigated” means the scoped control was inspected in source, with its residual limitations stated; green executor tests are not its sole evidence. Severity is the registered inherent severity; residual severity is separate.

| Threat | Severity | Assessment / residual | Inspected mitigation and evidence |
|---|---|---|---|
| T-08-01-S | high | Mitigated / low | background.js:499–527 binds extension ID, absent tab and exact popup URL; exact get-theme keys/request ID; :549–556 limits settings writers to popup/options. Other sender classes do not gain theme reads. |
| T-08-01-T | high | Mitigated / low | zhroma-settings.js:429–437 accepts only v1 accepted enum IDs, bounded payload and non-CAS schema; zhroma-themes.js:142–150 validates/freeze eight numeric slots/mapping; zhroma-colour.js:26–40 rejects nonfinite/out-of-range channels/alpha and emits fixed syntax. |
| T-08-01-I | high | Mitigated / low | manifest.json:1 and packaged module load order retain storage-only permissions, isolated top-frame agent scope; background.js:515–527 reads only theme; content.js:605 onward processes local known settings/status without ticket payload export. No runtime fetch/dependency was added. |
| T-08-01-R | medium | Mitigated / low | popup.js:207–289 keeps confirmed choice, busy/request owner, bounded readback and separate saved/application copy; background.js:518–527 refuses queued or superseded reads. No uncertain write is represented as confirmed failure. |
| T-08-01-D | medium | Mitigated / low | content.js:94–107 deduplicates properties and observes only root data-theme; zhroma-settings.js:580–588 preserves bounded pending queue/deadline and physical-write uncertainty. No theme row traversal. |
| T-08-02-S | high | Mitigated / low | zhroma-themes.js:166–207 pins six branded repositories/commits and palette/licence SHA256; all 12 cached primary files independently rehashed to their pins. Nord decoded notice :193 exactly matches licence bytes. Exact sender/accepted ID gates remain. |
| T-08-02-T | high | Mitigated / low | zhroma-themes.js:142–150 and colour.js:26–40 gate/freeze data; test/extension/theme-validation.js validates full-precision source-over/contrast/Oklab/CVD; theme-colour.test.js:54–105 and :121–195 supply fixed numerical goldens, bad duplicates/ties and independent composition/conversion transcription. Browser-judge gaps are assigned to T-08-05-T. Human perceptual adequacy remains unobserved. |
| T-08-02-I | high | Mitigated / low | zhroma-themes.js:1–223 packages static notices/numeric data; numerical science/report work is developer-only. No runtime upstream fetch, document contents, credentials or ticket data protocol appears. |
| T-08-02-R | medium | Mitigated / low | 08-PRESET-REPORT.md data-bound results, pinned Classic per-case floors and method limits distinguish model acceptance from save/apply; popup.js:270–284 preserves acknowledgement semantics. No repository-wide licence is invented for original contributions. |
| T-08-03-S | high | Mitigated / low | background.js:499–527 and :549–556 require exact trusted sender/message shape; rejected senders never enter registry queue or read theme. |
| T-08-03-T | high | Mitigated / low | popup.js:229–238 validates exact reply/request ownership/enum/status; :291–318 builds labels with DOM textContent and finite preview output; settings.js:429–437 disallows arbitrary ID/CSS. |
| T-08-03-I | high | Mitigated / low | popup.js:246–289 exchanges theme choice/status with local worker only; manifest storage permission unchanged; no row text/properties are added to protocol. |
| T-08-03-R | medium | Mitigated / low | popup.js:257–284 retains last confirmed state across pending/failure, labels post-issuance uncertainty, and only matching current owner lands bounded recovery; background.js:519–525 checks read generation and queue before confirmation. Stored does not assert applied. |
| T-08-03-D | medium | Mitigated / low | popup.js:210–218 disables conflicting interaction while owned; :246–289 has bounded transport/readback and explicit check/focus recovery; no unbounded polling or request accumulation. |
| T-08-04-S | high | Mitigated / low | content.js:76–108 treats exact root dark marker as appearance only; missing/unrecognized marker resolves light. It never authorizes storage writers; worker sender gates remain background.js:492–511. |
| T-08-04-T | high | Mitigated / low | content.js:86–96 sets 12 fixed property names through numeric emitter; themes.js:142–150 validates finite/frozen slots; zhroma.css:1 limits tint to stamped direct cells with Classic literal fallback. Host row/text native paint ownership is retained. |
| T-08-04-I | high | Mitigated / low | content.js:565–605 consumes settings locally; status invalidation contains no ticket text. No new runtime network path, all-row export or private capture was introduced. |
| T-08-04-R | medium | Mitigated / low | content.js:565–590 checks per-key read generations; onChanged and restore supersede old reads; :466 onward suspends/restores lifecycle. Read/event application does not create a popup “applied” acknowledgement. |
| T-08-04-D | medium | Mitigated / low | content.js:103–107 root attributeFilter, :94 property dedup, lifecycle disconnect and existing settings/table bounds contain appearance work. Unrelated attributes/rows do not drive palette work. |
| T-08-05-S | high | **OPEN / high, blocking** | release-source.js:103–142 and :180–191 bind source bytes; runner :123 serves exact local routes and :149–157 checks state/ownership. However verify-theme-paint.js:94–100 accepts claimed identity without required served/style/state/browser evidence and accepts coordinated expected/measured forgery (CR-08-01). The real matrix remains incomplete (CB-08-01). Historical observations cannot substitute. |
| T-08-05-T | high | **OPEN / high, blocking** | Finite emitter controls remain effective, but verify-theme-paint.js:33 expands <=1 channel tolerance by rounding (CR-08-02), :100 trusts supplied expected pixels (CR-08-01), and theme-browser-oracle.test.js:6–29 shares CRC/predictor logic (WR-08-01). Negative controls fail to establish the required judging independence. |
| T-08-05-I | high | Mitigated / low | verify-theme-paint.js:121–131 uses sanitized synthetic fixture, loopback routes/CSP connect-src none and a new mkdtemp user-data-dir; :185 retains numeric/sample facts, not live screenshots/page data; :187–190 kills/closes/removes temporary profile. No user/private profile is reused. |
| T-08-05-R | medium | Mitigated / low | verify-theme-paint.js:185 labels failure block/incomplete reconstructed host and :195–196 exits nonzero; CHROME-PAINT.json:3/:108 remains block; DEV-SMOKE/human records separate pending observations and saved/applied states. No completed live tenant/UI evidence is asserted. |
| T-08-05-D | medium | Mitigated / low, source-inspected | verify-theme-paint.js:125–133 bounds work at 50s and kills hung Chrome, :187–191 closes connections/removes temp directory and checks total <=55s. This single review round preserves the authorized repair/recheck cap. The observed failure cleaned up early; forced deadline/cleanup exhaustion was not independently exercised, so no universal 55s execution attestation is made. |

## Open mechanisms and required remediation

**SEC-08-01 — BLOCKER / high, T-08-05-S and T-08-05-T.** File: /Users/mike/code/zhroma/scripts/verify-theme-paint.js:94–100. A fabricated complete 304-case report with constant expected/measured [21,26,30], matching identity and no browser/style/served/count evidence was independently admitted. Recompute canonical expectations and require complete browser/source/state/text/CSS/control evidence; add coordinated-forgery and every missing-evidence negative control. This concerns release evidence integrity, not a demonstrated remotely exploitable extension boundary or a forged current report.

**SEC-08-02 — BLOCKER / high, T-08-05-T.** File: /Users/mike/code/zhroma/scripts/verify-theme-paint.js:33. Independently reproduced 1.49 channel error being admitted as maxError=1. Compare against unrounded expectation, record full precision and exercise exact/over boundary controls.

**SEC-08-03 — WARNING / medium control gap, T-08-05-T.** File: /Users/mike/code/zhroma/test/extension/theme-browser-oracle.test.js:6–29. Shared encoder/decoder CRC and predictors permit correlated error cancellation. Add independently generated fixed PNG/CRC vectors; do not treat current round trips as independent decoder goldens.

**SEC-CB-08-01 — BLOCKER / capability.** File: /Users/mike/code/zhroma/.planning/phases/08-themes-that-follow-dark-mode/08-CHROME-PAINT.json:108; runner :151/:166. Correct trusted pointer delivery does not activate native :hover. Only five Classic/light/normal pixels were captured; 299 required cases remain missing. Resolve actual native pointer capability and execute the complete exact-source matrix; forced CSS state and synthetic or historical results cannot close it. Preserve OPEN_THREATS/phase block until required evidence and relevant control dispositions exist.

## Inspected controls versus executor tests

Source inspection covered forged sender/schema boundaries, accepted finite IDs/values, nested freezing, local-only data flow, confirmed/failure/stale read ownership, queue/observer/lifecycle bounds, exact release inventory and served routes, PNG measurement and report checks, temporary isolated profiles and bounded cleanup. Independent read-only probes reproduced the two judge defects and matched all 12 pinned primary files/Nord notice. No production source was changed.

Executor evidence records passing typechecks, smoke 112/112, Vitest 1577/1577 in 37 files, inherited mutants 52/52, dependency checks 7/7 and targeted six suites 238/238. Reconciliation/mutation logs were inspected; other counts are reported execution outcomes. None substitutes for independent source audit, full browser paint, minimum Chrome106 observation or human acceptance. No live tenant/browser UI human evidence exists here. All inherited skips/open findings and human/custody gates remain unchanged.

Twenty-two registered controls are mitigated at this bounded ASVS1 inspection level; two high threats are open. No threat was silently accepted, and no additional unregistered attack surface was proved. The executor may make one bounded relevant repair/local recheck and record new source identity and disposition. This audit remains pinned to the original reviewed bytes and must not be presented as review of repaired code.

_Independent gsd-code-reviewer security assessment; separately typed security-auditor unavailable due thread limit. No source edits or commits._

