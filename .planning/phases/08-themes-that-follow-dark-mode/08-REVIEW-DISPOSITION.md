---
phase: 08
rounds: 1
repair_batches: 1
local_rechecks: 1
status: block
reviewed_head: d9d6969ac62509873766ba7c4c91f56d59d9a409
repair_commit: 372022f
production_digest: de24fbe993a2fc15fd68f620a53df50c96a6f3119648cd7c211d277ae554509b
data_digest: d4db43244d51bb19c0514d29988dd16a2b7334443c42f9d5ccc232272a5e84ce
final_harness_digest: 5a260896a5006686c152dabc46fcc58845f8504ea6e219044975e744c274c34a
final_browser_test_digest: 2741b275371c59835c6595aa013459dddb6821c17902abf3aa5877009b4f7423
findings:
  - id: CR-08-01
    severity: critical
    disposition: fixed
    title: "Complete report trusts supplied pixel expectations and lacks evidence ownership"
  - id: CR-08-02
    severity: critical
    disposition: fixed
    title: "Rounded expectation expands the one-channel raster tolerance"
  - id: WR-08-01
    severity: warning
    disposition: fixed
    title: "PNG control encoder shares decoder predictor and CRC"
  - id: CB-08-01
    severity: critical
    disposition: open
    title: "Required native-pointer browser matrix remains 5/304"
open: 1
total: 4
---

# Phase 08 single-round disposition

**Phase/Plan 08-05 remains blocked.** One independent `gsd-code-reviewer` assessed implementation and all 24 threat rows; a separately typed `gsd-security-auditor` dispatch failed at the runtime thread limit. `08-SECURITY.md` explicitly labels the combined reviewer security assessment. This limitation is not presented as the missing typed execution. No second review was dispatched.

The immutable independent reports `08-REVIEW.md` and `08-SECURITY.md` concern head `d9d6969`, production digest above and pre-repair harness `616a9d926c59edf6c46b4c227e5b1a767cc9b0a646e73a6f4dd1f59f643d16e8` / test `3c3c828b40067bab226027988ccc49f663490fa9e741557e5aa50b0dcbdfd213`. Review reports were committed separately as `2085f6c`. This disposition records the executor's **one bounded repair/local recheck**, not an independent re-review of repaired judging code. Packaged runtime, palette data, colour-method and admission record bytes did not change.

| Finding / security counterpart | Disposition | Repair and exact local evidence |
|---|---|---|
| CR-08-01 / SEC-08-01 | fixed, locally verified | `372022f` recomputes expected pixel from canonical ID/mode/state/priority/kind; requires browser/version, exact served module inventory, 192/64/48 count breakdown, native state, text/rule ownership, production CSS owner and untinted marker. The source-derived positive scaffold passes; coordinated expected+measured forgery, missing browser/count/served/style fields, wrong owner/state/marker and wrong count controls reject. |
| CR-08-02 / SEC-08-02 | fixed, locally verified | `372022f` measures error against unrounded full-precision expected channels. Error 1.49 rejects, exactly 1 passes, 1.00001 rejects; report retains fractional model channels and actual integer PNG pixels. No colour contrast/distance floor changes. |
| WR-08-01 / SEC-08-03 | fixed, locally verified | `372022f` adds five fixed PNG binaries generated independently with Python standard-library DEFLATE/CRC from hand-calculated filtered scanlines. Every RGB channel in each 2×2 filter0–4 image matches its fixed golden; standard CRC32 `123456789 → cbf43926` passes. Existing roundtrip controls remain supplemental. |
| CB-08-01 / SEC-CB-08-01 | **open, required capability blocker** | Actual final Chrome recheck exits 1 at Classic/light/hover/Urgent/cell. Trusted CDP mousemove reaches the correct synthetic row, but target/row `:hover` and global hover set remain false/empty. `08-CHROME-PAINT.json` retains **block**, five normal pixels, required total304, exact refreshed harness/test identity. No forced pseudo-state or computed-RGBA substitution was used. |

The repaired oracle unit suite passes **15/15**. The full source-bound recheck passes both typechecks, **112/112** Node smoke and **1583/1583** Vitest in 37 files. Existing mutation gate measured **52/52 killed** on these exact packaged runtime bytes before the developer-only judge repairs; neither production source nor the mutant registry changed during this repair. It was not redundantly rerun and no new kill was invented. Dependency approvals pass **7/7**. These outcomes are local execution evidence, separate from the independent source review and browser capability.

The independent original security verdict was **OPEN_THREATS**, 22/24 controls mitigated and T-08-05-S/T open high. Their identified judge mechanisms are locally repaired; **complete actual browser evidence is still missing, so the final acceptance boundary remains blocked**. This disposition does not relabel the original audit SECURED or independently attest repaired code. No production security defect was proved by that review; this is a source/evidence integrity and mandatory capability halt.

Human native-popup/tenant checks remain **human_needed**, all pending in `08-DEV-SMOKE.md`, and Chrome106 execution is unobserved. Phase 6 remains gaps_found14/15 with custody and six human checks pending; its uncommitted close-out was not absorbed. Phase 7 remains WR-01/WR-06 fixed, WR-02 skipped, WR-03/04/05 and IN-01–05 open. No unrelated CAS/schema/default/dependency repair was performed.

The inherited WINDOWS ledger contains unsupported kind `accepted-risk` in entry11, preventing append; this is recorded here as an existing process gap rather than editing history. Phase 11 must rerun the full regression, complete pixel/native-state matrix and every-preset dark/session human checklist on exact release-candidate bytes. No phase completion is claimed.
