# Historical Phase 04 evidence — before the 04-REVIEW repair

Exact copies preserved before the `04-REVIEW.md` gap-closure repair on 2026-09-10.
Repository HEAD at preservation: `77b3a19f3f96fa99b97b47930cd44f75bc52dd57`.

## The pre-repair shipped inventory

The eleven SHA-256 digests below are transcribed from the preserved
`04-LIVE-ACCEPTANCE.md`'s own `source.assets` block — the bytes these records were
actually bound to. They are deliberately **not** recomputed from a working tree that
has already moved past them.

| Asset | SHA-256 (pre-repair) |
|---|---|
| `background.js` | `ab871ca87b871e071b7db633c8909acda90247f98dd74a081d8c41d99c635dfe` |
| `content.js` | `1c1e0b037cdbd54baaa003e603af35f4e8c47096f74901f3f2d4bf5c176d4935` |
| `icons/missing.png` | `68a032b0500b1ae062a455e3b1bdbf20db8dd71c8d16dee1461e6f3dbf5e8fa0` |
| `icons/neutral.png` | `a13c2447cb31526e666a4e050451228480a6221efcee673a6fd30ac2d943f9d4` |
| `icons/off.png` | `c1289da1a9235cba4ddb0f8bcd85ca90e355ce89ddf3c24340c6409205198638` |
| `icons/unreadable.png` | `1131af46ac5cc421e7e951a4de067566c9a31bbfa032787f5346fb6db8e30c3a` |
| `icons/working.png` | `28fc0380a220982d523d39564123933db92e8d492100cd690c0dd333200845bb` |
| `manifest.json` | `dafa656a55a1b69b42d4aa6490101e593bc9eea36afe35feacf34f7090b768e5` |
| `popup.html` | `4c621c9d92fd21130dc2cafbf5bcaf705a98993c53eb755a53011a381729ad7c` |
| `popup.js` | `0f87b1a68a25a5b1c7e34cb48f116308db64190729c2dc535579cfc5f912b5fc` |
| `zhroma.css` | `f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61` |

## What these records retain

- **Fourteen user-attested live passes**, dated 2026-09-10 and attributed to the
  Phase 4 blocking checkpoint recorded in `04-UAT.md`. Each carries its own
  `observed_on`, its own sanitized aggregate evidence line and its `04-UAT.md` test
  number.
- **Two never-observed FAIL-03 checks** — `language-icon-copy` and `structure-copy` —
  both `pending`, both waived by the user as accepted residual risk **AR-04-01**
  (`04-RISK-ACCEPTANCE.md`). The waiver permitted progression; it never created
  evidence.
- **The three product prohibition judgments** carried as `flagged-unverified`, with
  their user ratifications recorded in the `disposition` text only.
- **The original six-run synthetic timing samples** (3600 measured operations; worst
  30-row median 1.300 ms, worst enabled batch 13.900 ms) and the `04-PERFORMANCE.md`
  that reports them, taken against harness digest
  `f889a9eb8b2ff52bbca303a7a1dfe1039449a006ecc4afbf552999e917978877`.
- **`04-VALIDATION.md`** as it stood: the five-gate inventory, the four promotion
  rules and the automated results measured against the pre-repair bytes.

## What these records do not do

**They do not validate the repaired source.** Every claim in this directory is a
claim about the eleven digests listed above, and four of them no longer ship. An
observation is evidence about the bytes it was taken on; no amount of record editing
transfers it. `04-VALIDATION.md` promotion rule 3 and `04-LIVE-ACCEPTANCE.md` rule 5
both say so, and `test/extension/phase-04-live-acceptance.test.js` enforces it at the
`live-source-evidence` gate.

Re-observing any of the fourteen is a **UAT** activity against the repaired bytes, and
it was out of scope for the run that created this directory.

## What moved the bytes

Four `04-REVIEW.md` findings were repaired in waves 7 and 8, changing four of the
eleven shipped assets:

| Finding | Repair | Plan | Assets changed |
|---|---|---|---|
| **CR-01** — every English regional locale was told its interface language is unsupported | Case-insensitive BCP-47 primary-subtag predicate in JavaScript, `html[lang\|="en" i]` at the head of all four tint rules | `04-07` | `content.js`, `zhroma.css` |
| **WR-08** — the tint stylesheet used no `!important`, contrary to the project's explicit styling directive | `!important` on all four `background-color` declarations | `04-07` | `zhroma.css` |
| **WR-04** — an unresponsive document wedged the extension's only preference writer, with no timeout anywhere | `REQUEST_TIMEOUT_MS = 2000` and a `Promise.race` deadline bounding both worker `sendMessage` hops; `REQUEST_TIMEOUT_MS = 5000` bounding both popup hops | `04-08`, `04-10` | `background.js`, `popup.js` |
| **WR-07** — after a failed save the checkbox displayed a value nothing confirmed, and the control was then dead with focus dropped | `lastConfirmed` revert target, an operable control after a failed save, unconditional focus restoration | `04-10` | `popup.js` |

`04-REVIEW.md` itself is deliberately **not** copied here. It is the input to this
repair, not evidence about the pre-repair bytes, and it stays in the phase directory.

Manual profiling remains deferred, and synthetic layout and retainer attribution
remain `human_needed`, exactly as the preserved `04-PERFORMANCE.md` states.

---

*Phase: 04-honest-failure-and-an-off-switch*
*Preserved: 2026-09-10 by plan 04-11*
