# Disclosure and consent applicability — evidence gate

**Prepared:** 2026-09-11
**Overall status:** **UNRESOLVED — blocks submission.**
**Resolution owner:** plan 05-07, Task 1 (before any dashboard certification or submission).

This document exists to answer one question with evidence rather than with confidence:

> Zhroma reads rendered website content automatically, locally, with no onboarding and no consent step. Does the Chrome Web Store's prominent-disclosure-and-consent requirement apply to that, and if so, what satisfies it?

Four sub-questions are **resolved** below and one is **unresolved**. Status is `resolved` only where the official text actually explains this specific local-only automatic feature. Where it does not, the status is `unresolved` and the narrow evidence needed is named.

---

## Evidence refreshed during execution

All four pages were fetched directly and read during this plan's execution, not quoted from earlier research notes.

| Source | Accessed | Page's own "Last updated" |
|---|---|---|
| https://developer.chrome.com/docs/webstore/program-policies/user-data-faq | 2026-09-11 | not stated on the page body (FAQ; enforcement note dated 2019-10-15) |
| https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements | 2026-09-11 | 2022-11-01 UTC |
| https://developer.chrome.com/docs/webstore/program-policies/limited-use | 2026-09-11 | 2022-11-01 UTC |
| https://developer.chrome.com/docs/webstore/cws-dashboard-privacy | 2026-09-11 | not stated on the page body |

A page being reachable today is not proof that the live dashboard presents identical fields. Recheck immediately before submission.

---

## Resolved: Zhroma handles user data

**FAQ Q2 — "What does 'handle' mean in the User Data Policy?"**

> Generally, by "handle" we mean collecting, transmitting, using, or sharing user data. Here are some examples of functionality that handle user data: … Clipping or scraping content from a website that the user visits, such as taking screenshots or capturing data from a web page … Collecting web browsing activity and any information about the website content or resources a user requests or interacts with …

**FAQ Q4 — "What are examples of user data?"** lists, among others:

> Website content and resources

**Conclusion — RESOLVED, yes.** Zhroma reads text that Zendesk rendered on a page the user visits (`extension/content.js` → `inspectCandidateTable`, reading `documentElement.lang`, header cell text and Priority cell text). That is *using* website content. The honest answer to "does this Product handle user data" is **yes**, and every downstream document says so rather than claiming the extension never accesses anything.

## Resolved: local-only processing is not an exemption

**FAQ Q3 — "Does an extension need to disclose user data handling if the data is only processed or stored locally on a user's device?"**

> Yes. Extensions are required to disclose how they handle user data, even when data is processed or stored locally on a user's device and is not transmitted to external servers or third parties.

**Conclusion — RESOLVED.** "It never leaves the browser" is a true and important fact about Zhroma, and it is *not* a reason to skip disclosure. This is the finding that justifies D-11's retention of STORE-04 against the user's initial preference to omit a policy.

## Resolved: a posted privacy policy is required

**FAQ Q6 — "My Product DOES handle user data. What do I need to do?"**

> Products that handle user data must, at a minimum: Post a privacy policy in the Chrome Web Store Developer Dashboard, and Handle the user data securely, including transmitting it via modern cryptography.

**FAQ Q14 — "My extension or app handles user data, but only stores information locally … Do I still need to post a privacy policy?"**

> Yes. This policy requires all Products that handle user information to post a privacy policy. Users may not easily be able to tell which apps or extensions save information locally or transmit it back to their servers. Your privacy policy, however, may not need to be long or complicated. It just needs to describe how the Product collects, uses, and shares user data.

**Conclusion — RESOLVED, required.** `release/privacy/index.html` is written to Q7's three prompts — what is collected, how it is used, what is shared — and is deliberately short, as Q14 permits. The secure-transmission half of Q6 is not engaged by any transmission, because Zhroma performs none (FAQ Q8 and Q9 govern transmission and storage of user data). *Our reading — not a documented ruling — is that the single stored on/off boolean is a user preference rather than one of the Q4 user-data categories, and so triggers no encryption-at-rest obligation. If a reviewer disagrees, the remedy is a disclosure change, not a runtime change.*

## Resolved: the Limited Use statement, and how to word it

**Limited Use policy:**

> An affirmative statement that your use of the data complies with the Limited Use restrictions must be disclosed on a website belonging to your extension; for example, a link on a homepage to a dedicated page or privacy policy noting: "The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements."

> Collection and use of web browsing activity is prohibited, except to the extent required for a user-facing feature described prominently in the Product's Chrome Web Store page and in the Product's user interface.

**Conclusion — RESOLVED.** The affirmative statement is required and is published in `release/privacy/index.html`. The policy's example sentence is about "information received from Google APIs"; Zhroma receives none, so copying that sentence verbatim would assert something untrue. The published wording is adapted to the actual product:

> Zhroma's use of user data complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.

On the web-browsing-activity clause: Zhroma's reading is confined to the page content of the Zendesk agent interface and is required for its one user-facing feature — row tinting, which is visible in the interface itself and is described prominently in the store listing (`release/listing.md`) and surfaced in the popup and toolbar icon. FAQ Q13's definition of a user-facing feature ("functionality provided by the extension via a user interface element") is satisfied by the tinted rows, the toolbar icon and the popup. No browsing history, URL list or cross-site activity is gathered.

---

## UNRESOLVED: does an in-product disclosure and consent step apply before the first read?

**Disclosure Requirements policy (in full, the operative clauses):**

> You must be transparent in how you handle user data … including by disclosing the collection, use, and sharing of the data.
>
> If your Product handles any user data, then prior to installation, it must: Prominently disclose what user data will be collected and how it will be used. Obtain the user's affirmative and informed consent for such use.

**FAQ Q10 — "How do I satisfy the prominent disclosure requirement?"**

> You must describe the types of user data to be collected and how they will be used, and obtain the user's consent to that collection and use. You must present the disclosure in a prominent way, so that the user sees it prior to agreeing. The disclosure, however, must not be located only in a privacy policy, terms of service, or similar document.
>
> To obtain consent, the Product must ask the user to agree to the prominent disclosure in a manner that requires them to take a specific action clearly agreeing to the disclosure before collecting or handling user data.
>
> The prominent disclosure and consent must occur within the Product's user interface. Disclosures in the Chrome Web Store description or inline installation page do not satisfy this requirement.

### Why this is not settled

The two texts pull in different directions when applied to an extension with no onboarding:

- The Disclosure Requirements policy locates the obligation **"prior to installation"**. For a Chrome extension the only thing a user sees prior to installation, other than the store page, is Chrome's own permission prompt — and the store page is explicitly excluded by Q10.
- Q10 locates the disclosure and consent **"within the Product's user interface"**, with a "specific action clearly agreeing" required **"before collecting or handling user data"**. Zhroma has a user interface (toolbar icon and popup) but no agreement gate, and it begins reading a matching page as soon as one is open, with tinting on by default.
- Neither text says whether reading page content that is never retained, transmitted or shared engages the same obligation as collection, and neither addresses an extension whose single purpose *is* the reading. Q3 establishes that local processing still requires **disclosure**; it does not say whether it requires **in-product affirmative consent**.
- The dashboard's own Privacy practices tab frames its first checkbox group as "which types of data your extension collects" — a collection question. Whether the live labels treat "read, used for display, never retained" as collection is a fact about the dashboard, and the dashboard has not been seen.

Reading the texts strictly implies a consent gate before the first read. Reading them in the context of the Limited Use section's "collect, use, or transmit" framing implies the obligation targets data that is taken rather than merely displayed. **We cannot honestly pick between those readings from the documents alone, so the status stays unresolved.** No exemption has been assumed.

### The narrow evidence that would resolve it

Exactly these, and nothing broader:

1. **The real pre-install disclosure.** Capture what Chrome actually shows a user installing this exact package — one `storage` permission, one `https://*.zendesk.com/agent/*` content-script match, no `host_permissions`. Record the literal prompt text. This determines whether Chrome's own prompt is the "prior to installation" disclosure the policy names for extensions.
2. **The live Privacy practices tab.** Record the exact wording of every data-category checkbox and every certification statement. If a category matching "reads website content, retains nothing" exists, or if the certification statements themselves describe what satisfies the disclosure obligation, that is authoritative in a way the documentation is not.
3. **If 1 and 2 still leave it open: a direct answer from Chrome Web Store developer support**, asked as a specific question about this item, with the question and the reply recorded verbatim here.

Record the outcome in this file with its date and source. Update `release/disclosures.md` §2 to match.

### The boundary this gate must not cross

- **A runtime consent requirement triggers a scope decision and a replan, not an implementation.** If the resolved answer is that Zhroma must obtain affirmative in-product consent before its first read, that contradicts the zero-configuration requirement in `.planning/PROJECT.md` and D-13's runtime boundaries. Stop, surface it to the user as an explicit scope decision, and replan. Do not quietly add a consent dialog, a first-run screen or a default-off switch under this plan or any plan in this phase.
- **A user waiver cannot satisfy Chrome policy.** The user can accept the risk of rejection; they cannot make a non-compliant submission compliant. Do not record a waiver as a resolution.
- **This gate blocks submission only.** All other preparation — listing copy, policy text, brand assets, screenshots, packaging, smoke evidence, account setup — proceeds unaffected. Plan 05-07 must confirm this file reads `resolved` before requesting final submission approval.

---

## Flagged prohibitions carried into this document

Three prohibitions from `05-02-PLAN.md` are recorded as `flagged-unverified`. Document review can supply judgment evidence for them; it cannot silently change their lifecycle, and this review does not change it.

| Prohibition | Judgment evidence from this review | Lifecycle |
|---|---|---|
| MUST NOT imply Zendesk endorsement or compatibility beyond the disclosed supported scope. | `release/listing.md` states independence and non-affiliation explicitly, and the "Works with" section names English current Agent Workspace views, a visible Priority column and the light interface as requirements, with dark mode stated as unsupported. `release/privacy/index.html` carries the same non-affiliation footer. | Remains flagged-unverified. |
| MUST NOT describe local website-content processing as never accessing user data. | The policy page states what is read, field by field, before stating what happens to it, and says so in terms ("This reading is how the extension works, and we state it plainly rather than claiming that Zhroma never accesses anything"). The listing does the same. §"Resolved: Zhroma handles user data" above answers **yes**. | Remains flagged-unverified. |
| MUST NOT expand the required privacy-policy footprint into an optional homepage or marketing site. | The hosted footprint is exactly two files: `index.html` and an empty `.nojekyll`. No homepage, no custom domain, no additional pages, no navigation, no assets, no analytics, no external requests. `release/listing.md` omits the optional homepage and support URL fields. | Remains flagged-unverified. |

## Predecessor acceptance limits

Unchanged and not promoted by anything in this document. Phase 3 remains `human_needed` with 11 live checks passed and 9 skipped by the user. Phase 4 remains `human_needed` with 14 of 17 current-source live checks observed; `language-icon-copy` and `structure-copy` remain pending under AR-04-01, and `english-regional-locale` remains pending under the user's explicit non-blocking deferral.
