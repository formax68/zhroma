# Zhroma — source-to-disclosure worksheet

**Prepared:** 2026-09-11
**Status:** local draft. Nothing here has been entered into the Chrome Web Store dashboard, and no declaration has been certified.
**Purpose:** hold every dashboard declaration against the line of source that proves it, so that a certification is an act of reading rather than of memory.

This worksheet has four deliberately separate parts, because they carry different kinds of authority:

1. **Source facts** — provable right now from the repository. A reviewer or an auditor can re-derive each one.
2. **Policy evidence** — what current official Chrome documentation requires, recorded with its URL and access date in `release/policy-applicability.md`.
3. **Unresolved dashboard items** — facts that exist only in the live dashboard or the real install flow, which have not been seen. These are blank, not guessed.
4. **Predecessor acceptance limits** — what remains unverified from earlier phases, preserved unchanged.

---

## 1. Source facts

Verified on 2026-09-11 against the working tree at commit `01d3da9`. Every row cites the actual identifier, not a paraphrase.

| Dashboard / policy topic | Prepared declaration | Source evidence |
|---|---|---|
| **Single purpose** | Colour existing ticket rows in a Zendesk agent view according to the Priority value already displayed in that view. | `extension/zhroma.css` — four rules keyed on `[data-zhroma-priority="Urgent"\|"High"\|"Normal"\|"Low"]`, each setting only `background-color` on `> td[data-garden-id="tables.cell"]`. `extension/content.js` — `PRIORITY_ATTRIBUTE = 'data-zhroma-priority'`, `PRIORITY_LABELS = new Set(['Urgent','High','Normal','Low'])`. Nothing else is written to the page. |
| **Permission requested** | `storage`, used only to remember one on/off boolean. | `extension/manifest.json` → `"permissions": ["storage"]`. `extension/background.js` → `const PREFERENCE_KEY = 'enabled';` with `chrome.storage.local.get({ [PREFERENCE_KEY]: true }, …)` and `chrome.storage.local.set({ [PREFERENCE_KEY]: enabled }, …)` — one key, one area, one boolean. `extension/content.js` reads the same key; `extension/popup.js` reads and writes nothing itself. |
| **Permission justification (`storage`)** | The popup carries an on/off switch that must survive closing the popup, navigating, and quitting and reopening Chrome. `storage` is the narrowest API that does this. No broader alternative is requested; the value is a single boolean and never carries ticket data. | `extension/background.js` `readPreference` / `writePreference`; the default in the `get` call is `true`, which is why tinting is on at install. |
| **Host / website access** | Access is limited to the rendered DOM of pages matching `https://*.zendesk.com/agent/*`, top frame only. No `host_permissions` key is declared; access comes from the content-script match itself. | `extension/manifest.json` → `"matches": ["https://*.zendesk.com/agent/*"]`, `"all_frames": false`, `"world": "ISOLATED"`, `"run_at": "document_idle"`, and the complete absence of a `host_permissions` key. `extension/content.js` → `if (window.top !== window) return result('unsafe');`. |
| **What is read on those pages** | Table structure, column heading text, the Priority cell's text, and the document's declared language. Nothing else. | `extension/content.js` `inspectCandidateTable`: `document.documentElement.lang`; the Garden selectors `TABLE`/`HEAD`/`BODY`/`HEADER_ROW`/`HEADER_CELL`/`ROW`/`CELL`; `cell.textContent.trim() === 'Priority'` for the header; `cells[priorityIndex].textContent.trim()` for the value, accepted only if it is empty or in `PRIORITY_LABELS`. |
| **Remote code** | **No.** The extension executes no remote code. | No `fetch`, `XMLHttpRequest`, `sendBeacon`, dynamic `import()`, remote `<script>` source, remote CSS `@import` or remote font exists anywhere under `extension/`. Manifest V3 forbids remotely hosted code and the package contains none; the eleven-file shipped inventory is pinned in `scripts/release-source.js` and independently in `test/extension/runtime-contract.test.js`. |
| **Data transmitted off the device** | **None.** The extension makes no network request of any kind. | Same negative evidence as the row above, plus `release/privacy/index.html` making the same claim publicly. |
| **Data retained** | Exactly one boolean under one key in `chrome.storage.local`. No ticket, view, account, usage or diagnostic data is written. | `extension/background.js` — `PREFERENCE_KEY` is the only key ever passed to `chrome.storage.local.set`, and the stored value is type-checked as a boolean on read (`typeof value === 'boolean' ? value : null`). |
| **Publisher collection** | The publisher receives nothing. There is no server, no endpoint and no analytics, so no ticket data, identifier or usage signal ever reaches the publisher. | The absence of any network call, combined with the absence of a `background` fetch path — `extension/background.js` is a message router between the popup and content scripts only. |
| **Diagnostics / status reporting** | The only value crossing between content script, worker and popup is a finite enum, never page text. | `extension/content.js` — `statusDiagnosis` / `statusReason` with the comment "Finite values; never a row, a cell value, a language string, a URL or an error". `extension/background.js` — `DIAGNOSES = ['working','missing','cannot-read','neutral']`, `REASONS = ['blank','unsupported-language','structure', null]`. `extension/popup.js` — fixed `COPY` strings selected by that enum. |
| **Sale or sharing of data** | None; nothing to sell or share. | As above. |
| **Limited Use certification** | Zhroma's use of user data complies with the Chrome Web Store User Data Policy, including the Limited Use requirements; the affirmative statement is published at `release/privacy/index.html` → "Limited Use". | The statement is deliberately written without the "information received from Google APIs" clause of the policy's example, because Zhroma receives no Google API data. See `release/policy-applicability.md` §Limited Use. |

The privacy policy at `release/privacy/index.html` and the store copy at `release/listing.md` make these same claims in the same terms. If any row above changes, all three files change together.

## 2. Policy evidence

Recorded in `release/policy-applicability.md`, which carries the URLs, the access date, the exact quoted questions and the reasoning. In brief:

| Question | Answer | Basis |
|---|---|---|
| Does Zhroma "handle" user data as the policy defines it? | **Yes.** | User Data FAQ Q2 names "capturing data from a web page" and "information about the website content … a user requests or interacts with" as handling; Q4 lists "Website content and resources" as user data. |
| Does local-only processing exempt it from disclosure? | **No.** | FAQ Q3: disclosure is required "even when data is processed or stored locally on a user's device and is not transmitted to external servers". |
| Is a posted privacy policy required? | **Yes — required.** | FAQ Q6 and Q14. Q14 answers the local-only case explicitly: "Yes. This policy requires all Products that handle user information to post a privacy policy." This is why D-11 retains STORE-04. |
| Are the secure-transmission and encryption-at-rest requirements engaged? | **Not engaged by any transmission**, because there is none (FAQ Q8, Q9). The one stored boolean is a user preference, not one of the FAQ Q4 categories. *This last sentence is our reading, not a documented ruling.* | FAQ Q8, Q9. |
| Is an in-product prominent disclosure and affirmative consent step required before Zhroma first reads a page? | **UNRESOLVED.** | Disclosure Requirements policy and FAQ Q10 are quoted and analysed in `release/policy-applicability.md`; they do not settle this case. **This gate blocks submission** until resolved in plan 05-07. |

## 3. Unresolved dashboard items

None of the following can be answered from documentation or from this repository. Each must be read off the live dashboard or the real install flow and written back into this worksheet before anything is certified.

| Item | What must be observed | Where |
|---|---|---|
| **The actual data-category checkbox labels** | The dashboard's Privacy practices tab offers a first group of checkboxes for "which types of data your extension collects". The documented page does not list those labels. Record the exact wording of each, and decide against that wording — not against a remembered category list — whether reading rendered ticket text to compute a tint is "collecting" website content in the sense the checkbox means. **Do not select "no data collected" merely because the data stays local.** | Plan 05-07, Task 1 |
| **The certification checkbox group** | The second group certifies compliance with each disclosure statement. Record the exact statements before ticking any of them. | Plan 05-07, Task 1 |
| **Single-purpose and permission-justification field limits** | Character limits and required/optional markers. | Plan 05-07, Task 1 |
| **The remote-code field wording** | Confirm the option is phrased as "No, I am not using remote code." and select it only after the final package has been checked. | Plan 05-07, Task 1 |
| **Whether the dashboard requires a listing-level contact email** | D-02 permits the required contact `zhroma@efstratiadis.me` only where publication actually requires it. | Plan 05-06 / 05-07 |
| **The hosted privacy policy URL** | The proposed `formax68/zhroma-privacy` repository name and its default `github.io` address are proposals whose availability has not been checked (Research A2). Record the real returned URL and confirm anonymous HTTPS access before entering it. | Plan 05-06, Task 3 |
| **Trader / Non-Trader self-declaration** | A legal self-declaration by the user. Personal publishing and free distribution do not settle it. | Plan 05-06, Task 1 |
| **The install-flow disclosure evidence** | The exact permission prompt Chrome shows for this manifest, captured from the real install. Needed to close the applicability gate. | Plan 05-07, Task 1 |

## 4. Predecessor acceptance limits

Preserved unchanged from `.planning/phases/05-published/05-HANDOFF.md` and the canonical verification records. Preparing these disclosures does not alter any of it.

- **Phase 3** remains `human_needed`: **11 live checks passed, 9 skipped by the user** (`uat_execution: skipped-by-user`). Source: `.planning/phases/03-the-tint-survives-everything/03-VERIFICATION.md`.
- **Phase 4** remains `human_needed`: **14 of 17 current-source live checks observed**. Source: `.planning/phases/04-honest-failure-and-an-off-switch/04-VERIFICATION.md`.
  - `language-icon-copy` — pending under AR-04-01; no non-English Zendesk context was available.
  - `structure-copy` — pending under AR-04-01; no safely prepared uninterpretable table context was available.
  - `english-regional-locale` — pending; explicitly deferred by the user as non-blocking.
- Neither phase is complete, and nothing in this worksheet, in `release/listing.md`, in the policy page or in any sanitised screenshot converts a pending check into an observed pass.

**Release-readiness consequence.** The disclosures above describe behaviour that automated tests and source reading do prove. They do not depend on the three pending live checks, all of which concern how the extension *reports* an unsupported or unreadable view rather than what data it handles. The declarations are therefore preparable now; they remain blocked from certification by the applicability gate in §2, not by the predecessor limits.
