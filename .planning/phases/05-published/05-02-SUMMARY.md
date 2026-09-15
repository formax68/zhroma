---
phase: 05-published
plan: "02"
subsystem: infra
tags: [chrome-web-store, listing-copy, privacy-policy, disclosures, github-pages, compliance]

# Dependency graph
requires:
  - phase: 02-first-tint-on-a-real-view
    provides: The minimal static MV3 manifest, the content-script match pattern and the four-tint stylesheet every public claim is checked against
  - phase: 04-honest-failure-and-an-off-switch
    provides: The single stored preference boolean, the toolbar/popup diagnosis enum and the acceptance limits the release documents must preserve
provides:
  - Store listing copy with the exact approved title, opening benefit and Works-with scope, plus a full field table separating ready values from account-specific unknowns
  - Reviewer test instructions that reach genuine tinting without exposing operational Zendesk credentials
  - A complete static privacy policy page ready for GitHub Pages, with no scripts, remote assets or analytics
  - A source-to-dashboard disclosure worksheet citing actual source identifiers
  - A bounded disclosure/consent applicability gate that blocks submission with named evidence requirements
affects: [05-03, 05-05, 05-06, 05-07, store submission, privacy policy hosting]

actuals:
  tokens: 12253
  tasks: 2
  commits: 2
plan_head_before: 359276f4cb5a02f80f13b1f8635bb8bed8e48dbd

tech-stack:
  added: []
  patterns:
    - "Release documents state a value only when a source line or a fetched official page proves it; everything else is marked Unresolved with the evidence needed and the plan that will supply it"
    - "A single static policy page whose entire hosted footprint is index.html plus an empty .nojekyll — no scripts, iframes, remote fonts, stylesheets, images or links other than mailto"
    - "Official policy text is re-fetched at execution time and quoted verbatim with its access date, never paraphrased from prior research notes"
    - "Compliance sub-questions are resolved individually, so a genuinely open question blocks submission without stalling the questions the documents do answer"

key-files:
  created:
    - release/listing.md
    - release/reviewer-instructions.md
    - release/privacy/index.html
    - release/privacy/.nojekyll
    - release/disclosures.md
    - release/policy-applicability.md
  modified: []

key-decisions:
  - "Zhroma DOES handle user data under FAQ Q2/Q4 — reading rendered website content is using it — so a privacy policy is required and the copy never claims the extension accesses nothing"
  - "The Limited Use affirmative statement is adapted rather than copied: the policy's example sentence names 'information received from Google APIs', which Zhroma does not receive, so asserting it would be untrue"
  - "In-product prominent disclosure and affirmative consent applicability is recorded UNRESOLVED and blocks submission; a runtime consent requirement is a scope/replan boundary, not an implementation"
  - "The store item name and short description are authored here and installed into the manifest by plan 05-03 Task 2, keeping this plan's shipped bytes unchanged and the 05-01 release candidate valid"
  - "The category is proposed (Workflow & Planning, fallback Tools) and explicitly marked for live-dashboard verification, because the current category list is a dashboard fact and not a documented one"

patterns-established:
  - "Four-part disclosure worksheet: provable source facts, fetched policy evidence, unseen dashboard facts, preserved predecessor limits — each carries different authority and is never mixed"
  - "Every public claim carries a 'verified against' row naming the file and identifier, so a claim can be re-derived rather than trusted"
  - "Account-specific unknowns are enumerated as unknowns rather than filled with plausible placeholders that read as settled fact"

requirements-completed: [STORE-01, STORE-04]

coverage:
  - id: D1
    description: "Store listing copy carries the exact D-03 title and D-04 opening benefit, with the D-05 Works-with scope immediately after it, and states the Priority-column prerequisite, English Agent Workspace scope and light-interface limit"
    requirement: "STORE-01"
    verification:
      - kind: automated_ui
        ref: "node --input-type=module -e '…release/listing.md title, /See ticket priorities at a glance\\.\\s+#+ Works with/, Priority/English/light…' → LISTING_DOSSIER_OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "Reviewer instructions take a reviewer from store install to genuine tinting in a supported view, explain the visible-Priority prerequisite and the popup, and disclose that no sandbox account exists and no production credentials will be supplied"
    requirement: "STORE-01"
    verification:
      - kind: automated_ui
        ref: "node --input-type=module -e '…release/reviewer-instructions.md length > 200…' → LISTING_DOSSIER_OK"
        status: pass
    human_judgment: true
    rationale: "The automated check proves the file exists and is substantial. Whether the steps are genuinely followable by a reviewer without Zendesk access, and whether the credential refusal is worded acceptably, is a judgment the user must make before submission (Research open question 4)."
  - id: D3
    description: "A complete static privacy policy is ready for GitHub Pages: publisher identity, required contact, local reading described plainly, exactly one stored boolean, zero transmission, Limited Use commitment, and GitHub's own visitor IP logging stated as separate from extension execution"
    requirement: "STORE-04"
    verification:
      - kind: automated_ui
        ref: "node --input-type=module -e '…Michalis Efstratiadis, zhroma@efstratiadis.me, GitHub, local; .nojekyll size 0; no script/iframe…' → POLICY_DOSSIER_OK"
        status: pass
      - kind: other
        ref: "grep for https?:// and <a …> in release/privacy/index.html → only mailto:zhroma@efstratiadis.me; no src=, link rel or @import"
        status: pass
    human_judgment: true
    rationale: "Automated checks prove document structure and the absence of remote resources. Whether the prose is an adequate and legally sound privacy policy for this publisher is the task's own <human-check> and is deferred to end-of-phase verification (human_verify_mode: end-of-phase)."
  - id: D4
    description: "A source-to-disclosure worksheet maps single purpose, storage, website access, remote code, data categories, publisher collection, retention and Limited Use to actual source identifiers, and separates them from unseen dashboard facts and predecessor limits"
    requirement: "STORE-04"
    verification:
      - kind: automated_ui
        ref: "node --input-type=module -e '…release/disclosures.md length > 200…' → POLICY_DOSSIER_OK"
        status: pass
      - kind: other
        ref: "Each source row re-derived by reading extension/manifest.json, content.js, background.js, popup.js, zhroma.css during execution; grep across extension/ for fetch|XMLHttpRequest|sendBeacon|import( returned only a code comment"
        status: pass
    human_judgment: false
  - id: D5
    description: "The disclosure/consent applicability gate resolves what official evidence settles, records the remainder as unresolved with the narrow evidence needed, and names the runtime-change replan boundary"
    requirement: "STORE-04"
    verification:
      - kind: other
        ref: "Four official pages fetched and read at execution (user-data-faq, disclosure-requirements, limited-use, cws-dashboard-privacy; accessed 2026-09-11); quotes in release/policy-applicability.md match the fetched text"
        status: pass
    human_judgment: true
    rationale: "The gate's conclusion is a legal/policy classification, not a document-structure fact. It stays UNRESOLVED by design and must be closed in plan 05-07 against the real install flow and the live dashboard before submission."

duration: 8 min
completed: 2026-09-11
status: complete
---

# Phase 05 Plan 02: Listing, Policy and Disclosure Dossier Summary

**Six local release documents that say only what the current source and freshly fetched Chrome policy text can prove — approved listing copy, credential-free reviewer instructions, a script-free static privacy policy, a source-cited disclosure worksheet, and a submission-blocking consent-applicability gate that stays honestly unresolved.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-11T12:48:05Z
- **Completed:** 2026-09-11T12:56:29Z
- **Tasks:** 2
- **Files modified:** 6 (all created)

## Accomplishments

- **`release/listing.md`** carries the exact approved title `Zhroma — Priority Colours for Zendesk` (37 characters) and opens with `See ticket priorities at a glance.` followed immediately by the Works-with scope — English current Agent Workspace views, a view that already shows a Priority column, and the light interface with dark mode stated as unsupported. A full store-field table separates values that are ready from values that cannot be settled without the user's account, and every public claim has a "verified against" row naming the file and identifier that proves it.
- **`release/reviewer-instructions.md`** walks a reviewer from store install to a tinted supported view, explains that Zhroma reads a Priority column it cannot add, describes the popup and switch, and states outright that no sandbox exists and that access to the publisher's live Zendesk instance will not be shared because it contains real customers' tickets. It carries no subdomain, ticket ID, name or address.
- **`release/privacy/index.html`** is a single static page — system font stack, `lang="en"`, an effective-date field, no scripts, no iframes, no remote fonts, stylesheets or images, and exactly one link, a `mailto:`. It names Michalis Efstratiadis and `zhroma@efstratiadis.me`, describes field by field what is read, states the one stored boolean, states that nothing is transmitted, carries an adapted Limited Use statement, and separates GitHub Pages' own visitor IP logging from extension execution. `release/privacy/.nojekyll` is a genuinely empty file.
- **`release/disclosures.md`** maps every dashboard declaration to an actual source identifier — `"permissions": ["storage"]`, `PREFERENCE_KEY = 'enabled'`, `"matches": ["https://*.zendesk.com/agent/*"]`, `inspectCandidateTable`, `DIAGNOSES`/`REASONS` — and keeps four kinds of authority apart: provable source facts, fetched policy evidence, dashboard facts nobody has seen, and preserved predecessor acceptance limits.
- **`release/policy-applicability.md`** re-fetched four official pages during execution rather than trusting research notes, quotes the operative text verbatim with its access date, and **resolves four sub-questions while leaving one open**: Zhroma does handle user data (FAQ Q2, Q4), local-only processing is not an exemption (Q3), a posted policy is required (Q6, Q14), and the Limited Use statement is required and must be adapted away from its Google-APIs example. Whether an in-product prominent disclosure and affirmative consent step applies before the first read is **UNRESOLVED and blocks submission**.

## Task Commits

1. **Task 1: Write store copy and safe reviewer instructions** — `01d3da9` (`docs(05-02)`)
2. **Task 2: Prepare the policy and resolve bounded disclosure evidence** — `33c7e75` (`docs(05-02)`)

**Plan metadata:** see the `docs(05-02): complete listing, policy and disclosure dossier plan` commit.

This is a documents-and-assets plan; `TDD_APPLICABLE` resolved `false` and no RED→GREEN sequence was forced.

## Files Created/Modified

- `release/listing.md` — store field values, the paste-ready detailed description, claim-to-source table, deliberate omissions, and the five open account-specific unknowns
- `release/reviewer-instructions.md` — paste-ready dashboard text plus submitter notes that are explicitly not for the dashboard
- `release/privacy/index.html` — the complete policy, ready to deploy once the effective date is set to the real publication date
- `release/privacy/.nojekyll` — empty marker for branch-root Pages publishing
- `release/disclosures.md` — the four-part source-to-dashboard worksheet
- `release/policy-applicability.md` — the bounded evidence gate, the flagged prohibitions and the replan boundary

## Decisions Made

- **Answer "does this handle user data" with yes.** FAQ Q2 names "capturing data from a web page" as handling and Q4 lists "Website content and resources" as user data. Reading a rendered Priority cell is using website content. Every document therefore describes the reading before describing what happens to it, rather than leaning on "it never leaves your browser" as if that were an exemption — which Q3 explicitly says it is not. This is also the evidence that justifies D-11's retention of STORE-04 against the user's initial preference to drop the policy.
- **Adapt the Limited Use statement instead of copying it.** The policy's example sentence is "The use of information received from Google APIs will adhere to…". Zhroma receives no Google API data, so pasting that sentence would publish a false claim in order to look compliant. The page states compliance in terms of the data Zhroma actually uses.
- **Leave the consent question open rather than picking the convenient reading.** The Disclosure Requirements policy locates the obligation "prior to installation"; FAQ Q10 locates it "within the Product's user interface" and excludes the store description. Neither addresses an extension whose single purpose is the reading and which retains nothing. A strict reading implies a consent gate, which would contradict the zero-configuration requirement; a contextual reading implies the obligation targets data that is taken rather than displayed. The documents do not choose, so neither does this plan.
- **Author the manifest strings here, install them in 05-03.** The store item name comes from `manifest.name` and the short description from `manifest.description`; the manifest currently reads `"name": "Zhroma"` and has no `description` key. Plan 05-03 Task 2 already owns that edit and already reads `release/listing.md`. Editing the manifest here would have changed shipped bytes and invalidated the 05-01 release candidate for no gain.
- **Propose the category, do not certify it.** The dashboard's category list is a dashboard fact. `Workflow & Planning` with a `Tools` fallback is recorded as a proposal to check against the live form.
- **Keep the hosted footprint at two files.** `index.html` and an empty `.nojekyll`, no homepage, no custom domain, no navigation, no assets — D-02's "just what is required to publish", made literal.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' `<verify>` commands passed on their first run, and no auto-fix under any deviation rule was needed.

## Constraint Compliance

- **D-13:** nothing under `extension/` was touched, no dependency, bundler, permission, remote code, telemetry or network call was added, and `package.json` is unchanged. Packaged bytes still equal repository source, so the 05-01 candidate and its digests remain valid. Targeted regression (`release-package.test.js`, `runtime-contract.test.js`) passed 45/45 after both commits.
- **D-14:** no shipped asset changed, so no acceptance revalidation is triggered. Official requirements were re-researched at execution time rather than inherited from the phase research document.
- **Threat register:** T-05-05 (reviewer instructions use supported-view steps only, name no subdomain or ticket, and refuse operational credentials outright); T-05-06 (every disclosure row cites a source identifier, all four policy pages are recorded with URL and access date, and the submission gate is explicit and unresolved); T-05-07 (the policy is one static document with a local style block, zero scripts, zero iframes, zero remote assets, and one `mailto:` link).

## Truthfulness Compliance

- Disclosures were derived by reading `extension/manifest.json` during execution, not from memory or research notes: one permission (`storage`), no `host_permissions` key, one content-script match, `all_frames: false`, `world: "ISOLATED"`.
- The "no network requests" claim was checked by grepping all of `extension/` for `fetch`, `XMLHttpRequest`, `sendBeacon` and dynamic `import(` — the only hit is the word "fetch" inside a code comment in `content.js`.
- The listing states plainly that a view must already show a Priority column and that scope is English current Agent Workspace with the light interface; dark mode is named as unsupported rather than omitted.
- Phase 3 (`human_needed`, 11 passed / 9 skipped) and Phase 4 (`human_needed`, 14 of 17, with `language-icon-copy`, `structure-copy` and `english-regional-locale` pending) are restated unchanged in `release/disclosures.md` §4 and `release/policy-applicability.md`. Nothing here promotes a pending requirement or describes either phase as accepted.
- Publisher account identity, the real privacy policy URL, the dashboard category list, which fields the dashboard marks required, and whether the mailbox verifies are all recorded as open unknowns, each attached to the plan that will resolve it.

## Flagged Prohibitions

All three descriptor-less prohibitions remain `flagged-unverified`; this review supplies judgment evidence for each but does not alter their lifecycle. The evidence is tabulated in `release/policy-applicability.md` § "Flagged prohibitions carried into this document": non-endorsement wording and bounded Works-with scope; the policy describing what is read before describing what happens to it; and a hosted footprint of exactly two files with the optional homepage and support URL fields omitted.

## Known Stubs

None. No placeholder value is presented as settled fact. Five listing fields and eight worksheet rows are deliberately blank and explicitly labelled as account-specific unknowns with the plan that will fill them — that is the plan's required output, not an unfinished stub.

One item needs an edit before deployment and is flagged in the file itself by an HTML comment: the effective date in `release/privacy/index.html` is set to 2026-09-11 and must be reset to the actual publication date in plan 05-06 Task 3.

## Threat Flags

None. This plan adds no network endpoint, auth path, file access or schema at a trust boundary. `release/privacy/index.html` becomes a public surface only when plan 05-06 deploys it, and it is a static document with no inputs.

## Issues Encountered

- The Chrome Web Store item name is taken from `manifest.name`, which currently reads `Zhroma`, and the short description from `manifest.description`, which does not exist. This is not a blocker: plan 05-03 Task 2 already owns both edits and already reads `release/listing.md` as their source. It is recorded here because the dependency runs the opposite way from how it reads — the listing document is upstream of the manifest, not downstream of it.
- The dashboard privacy documentation describes the Privacy practices fields but does not list the actual data-category checkbox labels, and it frames that group as "which types of data your extension collects". Whether "reads and displays, retains nothing" is collection in the sense those labels mean cannot be decided from documentation. Recorded as an unresolved dashboard item, not guessed.

## User Setup Required

None for this plan — no external service was configured and no account action was taken. Publisher account registration, two-step verification, the Trader/Non-Trader declaration and the GitHub Pages deployment all remain in plan 05-06, where they belong to the user.

## Next Phase Readiness

- **Ready for 05-03:** `release/listing.md` supplies the exact `name` and `description` strings that Task 2 of that plan installs into the manifest, and the store-asset rows name the destinations (`extension/icons/brand.png`, `release/assets/promo.png`) it must produce.
- **Ready for 05-05:** `release/reviewer-instructions.md` names the two screenshot destinations (`release/assets/before-after.png`, `release/assets/popup.png`) and states that they must not be referenced in the dashboard until they exist and their sanitisation has been reviewed against D-07 and D-09.
- **Ready for 05-06:** `release/privacy/index.html` and `.nojekyll` are the complete deployable contents of the policy repository. Two things must happen there: set the effective date to the real publication date, and record the actual returned Pages URL — the proposed `formax68/zhroma-privacy` name has never been checked for availability (Research A2).
- **Blocking 05-07:** `release/policy-applicability.md` reads **UNRESOLVED**. Submission must not be requested until it reads `resolved`, and it can only be resolved by three specific observations: the literal Chrome install prompt for this exact manifest, the live Privacy practices tab's checkbox and certification wording, and — if those still leave it open — a recorded answer from Chrome Web Store developer support. If the answer requires affirmative in-product consent before the first read, that is a scope decision and a replan, not an implementation; a user waiver cannot make a non-compliant submission compliant.
- Predecessor limits are unchanged: Phase 3 and Phase 4 both remain `human_needed`.

## Self-Check: PASSED

- All six created files present on disk: `release/listing.md`, `release/reviewer-instructions.md`, `release/privacy/index.html`, `release/privacy/.nojekyll`, `release/disclosures.md`, `release/policy-applicability.md`
- Both commits present in `git log`: `01d3da9`, `33c7e75`
- `git rev-list --count 359276f..HEAD` = 2, matching `actuals.commits`
- Task 1 `<verify>` re-run after both commits → `LISTING_DOSSIER_OK`, exit 0
- Task 2 `<verify>` re-run after both commits → `POLICY_DOSSIER_OK`, exit 0
- Remote-asset audit of the policy page: no `src=`, no `link rel`, no `@import`, one anchor (`mailto:zhroma@efstratiadis.me`), and the only `https://` occurrences are the match pattern printed inside `<code>`
- Regression: `release-package.test.js` + `runtime-contract.test.js` → 45/45 pass, confirming no shipped byte changed
- Task 2's `<human-check>` — reviewing the policy prose against source and official guidance — is deferred to end-of-phase verification per `human_verify_mode: end-of-phase`, and is recorded as `human_judgment: true` on coverage D3

---
*Phase: 05-published*
*Completed: 2026-09-11*
