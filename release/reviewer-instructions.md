# Reviewer instructions (Chrome Web Store "Test instructions" field)

**Prepared:** 2026-09-11
**Status:** local draft for review. Not entered into the dashboard; no submission is authorized by this document.
**Field:** the optional test-instructions box on the dashboard's Privacy practices tab. Optional does not mean useless here — Zhroma only shows its behaviour inside an authenticated Zendesk agent view, which a reviewer may not have.

**No credentials appear in this document, and none will be supplied.** The publisher has no sandbox or demo Zendesk instance, and the only available Zendesk account is an operational one containing real customer tickets. Handing out access to it would expose third-party personal data, so it will not be shared with a reviewer under any circumstance. Everything below is written so a reviewer can reach the behaviour with their own Zendesk access, or evaluate it from the submitted screenshots if they have none.

---

## Paste-ready text for the dashboard

Zhroma colours ticket rows in a Zendesk agent view by the priority already displayed in that view. It needs no account, no sign-in, no API key and no configuration of its own.

**Where it runs**

Only on `https://*.zendesk.com/agent/*`. On every other page the content script is never injected.

**What you need to see it work**

A Zendesk Agent Workspace instance, with the agent interface language set to English, and a ticket view whose columns include **Priority**. Any Zendesk trial or existing instance works. Zhroma reads the Priority value already rendered in the table; it cannot add the column, and it deliberately does nothing if the column is absent.

**Steps**

1. Install Zhroma from the Chrome Web Store. No sign-in, onboarding or options screen appears — there is none.
2. Sign in to your own Zendesk instance and open the agent interface (`https://<your-subdomain>.zendesk.com/agent/`).
3. Open a ticket view that shows a **Priority** column. If none of your views shows it, edit a view and add the Priority column, or open a view you know already has it.
4. Ticket rows whose priority is Urgent, High, Normal or Low are tinted with four distinct translucent background colours. Rows with no priority set are left untinted. Nothing is added, moved or hidden — only the row background changes.
5. Click the Zhroma toolbar icon. The popup reports the state of the current view in words and carries a single on/off switch, which is already on.
6. Turn the switch off. The tints clear from the view on screen immediately, with no page reload. Turn it back on and they return. Quitting and reopening Chrome preserves whichever way you left it.

**If you open a view without a Priority column**

Zhroma applies no colour, and the toolbar icon changes to a visibly different state. The popup says "Add a Priority column to this view to use tinting". That is the intended behaviour, not a failure.

**If the agent interface is in a language other than English**

Zhroma applies no colour and the popup says the interface language is not supported. It never claims the Priority column is missing in that case. English regional variants (`en-GB`, `en-US` and so on) are treated as English.

**What Zhroma does with what it reads**

It reads the rendered ticket table on the page — structure, column headings, Priority cell text and the page's declared language — in order to choose which rows to colour. That stays in the browser. It stores exactly one value, a boolean for the on/off switch, in local extension storage. It makes no network requests of any kind, includes no analytics or tracking, and transmits nothing to the publisher or to any third party.

**Account access**

We cannot provide a test Zendesk account. No sandbox or demo instance exists for this project, and the only instance available to the publisher is a live one containing real customers' tickets, which we will not expose. The submitted screenshots show genuine extension behaviour in a real view, with ticket details replaced by fictional text so that no customer information is published.

---

## Notes for the submitter (not for the dashboard)

- Keep the paste-ready section above free of subdomains, ticket IDs, agent names, email addresses and any other identifying detail. It contains none today; re-read it before pasting if it is ever edited.
- The supporting evidence a reviewer can see without Zendesk access is the screenshot pair prepared in plan 05-05: `release/assets/before-after.png` (the same view with tinting off and on, side by side) and `release/assets/popup.png` (the real popup and its switch). **Neither file exists yet.** Do not reference them in the dashboard until they have been produced and their sanitisation reviewed against D-07 and D-09.
- Sanitised screenshots demonstrate the product to a reviewer. They are not acceptance evidence and do not convert any pending live check into an observed pass. Phase 3 remains `human_needed` (11 passed, 9 skipped by the user) and Phase 4 remains `human_needed` (14 of 17 current-source live checks passed; `language-icon-copy` and `structure-copy` pending under AR-04-01, `english-regional-locale` deferred as non-blocking).
- A reviewer without Zendesk access may still be unable to reproduce the behaviour. That is a known and unavoidable risk of this product, recorded as Research open question 4. Clear instructions and honest screenshots reduce it; they do not remove it, and rejection on those grounds remains possible.
- Every behavioural statement above was checked against the current source: `extension/manifest.json` (match pattern, single `storage` permission), `extension/content.js` (`inspectCandidateTable`, the `en`/`en-` language family, Priority header lookup), `extension/zhroma.css` (four translucent row-cell tints), `extension/background.js` and `extension/popup.js` (toolbar states, popup copy, the one stored boolean defaulting to `true`).
