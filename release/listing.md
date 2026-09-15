# Zhroma — Chrome Web Store listing copy

**Prepared:** 2026-09-11
**Status:** local draft for review. No value here has been entered into the Chrome Web Store dashboard, and nothing in this document authorizes a submission.
**Authority:** D-01 to D-05, D-11, D-13 and D-14 in `.planning/phases/05-published/05-CONTEXT.md`.
**Source of truth for claims:** `extension/manifest.json`, `extension/content.js`, `extension/background.js`, `extension/popup.js`, `extension/zhroma.css`.

Every public claim below was checked against the current extension source, not against earlier research notes. Where a value cannot be settled without the user's own Chrome Web Store account or the live dashboard, it is marked **Unresolved** rather than filled with a plausible-looking placeholder.

---

## Store field values

| Store field | Prepared value | Status |
|---|---|---|
| Item name (comes from manifest `name`) | `Zhroma — Priority Colours for Zendesk` (37 characters; limit 75) | **Ready.** The manifest currently reads `"name": "Zhroma"`. Plan 05-03 Task 2 installs this exact string; this document is its source. |
| Short description (comes from manifest `description`) | `See ticket priorities at a glance in English Zendesk Agent Workspace views.` (75 characters; limit 132) | **Ready.** The manifest currently has no `description` key. Plan 05-03 Task 2 adds this exact string. |
| Detailed description | The block under "Detailed description" below | **Ready for user review.** |
| Category | Closest offered productivity/workflow category. Proposal: **Workflow & Planning**; fall back to **Tools** if that label is not offered. | **Verify in the live dashboard.** The current category list is a dashboard fact, not a documented one. Do not certify a category from this proposal alone. |
| Language | English | **Verify the exact dashboard label** (the field may be a locale such as "English (United States)"). |
| Pricing | Free | **Ready.** No revenue model exists (`.planning/PROJECT.md`). |
| Visibility / distribution | Public | **Ready.** |
| Distribution regions | Leave the dashboard default. | **Verify.** No decision restricts regions; do not invent one. |
| Privacy policy URL | Not known yet. | **Unresolved — account-specific.** The policy page is prepared at `release/privacy/index.html`; its hosted address depends on the GitHub Pages deployment in plan 05-06. The proposed destination is `formax68/zhroma-privacy`, whose availability has not been checked (Research A2). |
| Homepage URL | Omit. | **Deliberate.** Optional field; D-02 limits the public footprint to what publication requires. |
| Support URL | Omit. | **Deliberate.** Optional field. |
| Listing support / contact email | Omit **unless** the dashboard marks it required. If required, use `zhroma@efstratiadis.me`. | **Conditional, per D-02.** The account-level verified contact email is separately required and is `zhroma@efstratiadis.me`. Mailbox existence and Google's verification of it are not established by any document in this repository. |
| Promotional video | Omit. | **Deliberate.** Optional; the documented images guidance marks only icon, small promotional image and screenshots as mandatory. If the live dashboard genuinely marks a video required, that is a real blocker to raise, not a scope decision to make here. |
| Marquee promo tile (1400×560) | Omit. | **Deliberate.** Optional marketing asset, outside required-only scope. |
| Small promo tile (440×280) | `release/assets/promo.png` | **Not produced yet** — plan 05-03 Task 2. |
| Store icon (128×128) | `extension/icons/brand.png` | **Not produced yet** — plan 05-03 Task 2. The manifest today declares only a 32-pixel icon. |
| Main screenshot (1280×800) | `release/assets/before-after.png` — the same view side by side with tinting off and on | **Not produced yet** — plan 05-05. |
| Supporting screenshot (1280×800) | `release/assets/popup.png` — the real popup showing its on/off switch | **Not produced yet** — plan 05-05. |

The screenshot and promotional asset paths above are the destinations plans 05-03 and 05-05 own. They do not exist on disk yet, and nothing in this document should be read as evidence that they do.

---

## Item name (store field)

```
Zhroma — Priority Colours for Zendesk
```

## Short description (manifest `description`)

```
See ticket priorities at a glance in English Zendesk Agent Workspace views.
```

## Detailed description

Paste the text below into the dashboard's detailed description field. The `###` markers are this document's structure; in the dashboard, type each heading as a plain line with no leading `#` characters. The wording, the order of the sections and the fact that "Works with" comes immediately after the opening line are all fixed by D-04 and D-05.

See ticket priorities at a glance.

### Works with

- English Zendesk Agent Workspace views — the current agent interface, on your own `*.zendesk.com` address.
- Views that already show a Priority column. Zhroma colours the priority that is already on screen; it does not add the column for you.
- The light Zendesk interface. Dark mode is not supported in this version.

Outside that, Zhroma stays quiet. It leaves the view exactly as Zendesk rendered it, and the popup tells you why.

### What it does

Zhroma tints whole ticket rows by the priority already shown in the view. Urgent, High, Normal and Low each get their own translucent background colour, so the shape of your queue is visible before you read a word. Nothing moves, nothing is hidden, and no column is added or removed — only the row background changes.

### The toolbar icon and the switch

The toolbar icon shows which state Zhroma is in: tinting is working, this view has no Priority column to read, or this view cannot be read. Open the popup and it says the same thing in words.

The popup also carries one on/off switch. It is already on when you install. Turn it off and the tints clear from the view on screen straight away; turn it back on and they come back. Whichever way you leave it is remembered, including after you quit and reopen Chrome.

### Privacy

Everything Zhroma does happens inside your browser.

To decide which rows to colour, Zhroma reads what Zendesk has already drawn on the page: the ticket table's structure, its column headings, the priority values in the Priority column, and the language the page declares. That reading is how the extension works, and it never leaves your browser.

Zhroma stores exactly one thing: whether tinting is on or off. It is a single yes/no kept in your browser's local extension storage. No ticket, customer, view or account information is stored.

Zhroma makes no network requests of its own. It contains no analytics and no tracking, and it sends nothing to the developer or to anyone else. Your ticket data is never collected, transmitted, sold or shared.

### Permissions

Zhroma runs only on `https://*.zendesk.com/agent/*`, the Zendesk agent interface. It asks for one Chrome permission, `storage`, and uses it only to remember the on/off switch.

### Independence

Zhroma is an independent extension published by Michalis Efstratiadis. It is not made by, affiliated with, endorsed by or supported by Zendesk. "Zendesk" is used here only to say where Zhroma works.

---

## Where each public claim comes from

| Claim in the copy | Verified against |
|---|---|
| Runs only on the Zendesk agent interface | `extension/manifest.json` → `"matches": ["https://*.zendesk.com/agent/*"]`, `all_frames: false`, no `host_permissions` key |
| One Chrome permission, `storage` | `extension/manifest.json` → `"permissions": ["storage"]` |
| Reads table structure, headings, priority values and declared language | `extension/content.js` → `inspectCandidateTable`: `documentElement.lang`, the Garden table/head/body/row/cell selectors, and `cells[priorityIndex].textContent.trim()` |
| Four priorities, translucent row backgrounds on the row's cells | `extension/zhroma.css` → four rules for `Urgent`, `High`, `Normal`, `Low`, each an `rgb(... / 0.0x)` `background-color` on `> td` |
| English only, and `en-*` regional variants | `extension/content.js` → `LANGUAGE_PRIMARY = 'en'`, `LANGUAGE_PREFIX = 'en-'`; `extension/zhroma.css` → `html[lang\|="en" i]` |
| Exactly one stored boolean | `extension/background.js` → `PREFERENCE_KEY = 'enabled'`, `chrome.storage.local.get`/`set` with that single key and a boolean value |
| Already on when you install | `extension/background.js` and `extension/content.js` → `chrome.storage.local.get({ [PREFERENCE_KEY]: true }, ...)`; the default is `true` |
| Toolbar states and popup wording | `extension/background.js` → `ICONS`/`TITLES`; `extension/popup.js` → `COPY` |
| No network requests | No `fetch`, `XMLHttpRequest`, `sendBeacon` or dynamic `import()` exists anywhere under `extension/` |

The privacy paragraphs above and `release/privacy/index.html` make the same claims in the same terms: local reading of rendered page content, exactly one stored boolean, no transmission to the publisher, no analytics.

---

## What this listing deliberately does not say

- It does not claim Zendesk endorsement, affiliation, partnership or support, and it does not use Zendesk branding.
- It does not claim compatibility with non-English interfaces, dark mode, older Zendesk shells, or views without a Priority column. Those are outside the observed scope and are stated as limits, not omitted.
- It does not claim that Zhroma never accesses user data. It accesses rendered website content on the page; the copy says so plainly and then says what happens to it.
- It does not promise review speed, approval, or a publication date.
- It does not describe a homepage, support site, marketing site or roadmap, because none is required to publish.

## Open account-specific unknowns

These cannot be settled from this repository and must not be guessed:

1. **The privacy policy URL.** Depends on the GitHub Pages repository being created and deployed (plan 05-06). The proposed `formax68/zhroma-privacy` name and its default `github.io` address are proposals whose availability has not been checked.
2. **The exact category list and whether a category matching this product exists.** Read the live dashboard.
3. **Which listing fields the dashboard actually marks required**, including whether a listing-level contact email or a promotional video is required. D-02's "just what is required to publish" is decided against the real form, not against documentation.
4. **The publisher account itself** — identity, two-step verification, the fee shown at registration, and the Trader/Non-Trader self-declaration. All are user-owned actions (plan 05-06).
5. **Whether the chosen mailbox `zhroma@efstratiadis.me` exists and can complete Google's verification.**

## Release-readiness limits carried into this listing

Preparing this copy does not change any predecessor acceptance record. Phase 3 remains `human_needed` (11 live checks passed, 9 skipped by the user). Phase 4 remains `human_needed` (14 of 17 current-source live checks passed; `language-icon-copy` and `structure-copy` pending under AR-04-01, `english-regional-locale` deferred by the user as non-blocking). The "Works with" scope above is written to stay inside what has actually been observed, which is why it names English current Agent Workspace views and the light interface rather than every locale, shell or theme.
