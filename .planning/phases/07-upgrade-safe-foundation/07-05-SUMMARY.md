---
phase: 07-upgrade-safe-foundation
plan: 05
subsystem: settings
tags: [mv3, service-worker, sender-checks, d-17, options-page, tracer-world, mutation-testing]

requires:
  - phase: 07-upgrade-safe-foundation
    provides: 07-04 worker settings queue and the set-setting branch (popup only), settings-foundation.mutants.json with five entries
  - phase: 07-upgrade-safe-foundation
    provides: 07-03 options_ui stub (options.html, open_in_tab) that makes an extension page in a tab possible
provides:
  - background.js AGENT_HOST, AGENT_PATH and isAgentDocument; fromContent requires isAgentDocument(sender.url)
  - background.js OPTIONS_PATH and fromOptions; set-setting admitted from fromPopup(sender) || fromOptions(sender)
  - tracer-world CONTENT_URL on the content sender, URL in the worker context, OPTIONS_PATH, OPTIONS_URL, optionsSender(tabId)
  - D-17 sender tests and the D-01 matches agreement test in settings-queue.test.js
  - three measured-killed mutants content-sender-agent-url, agent-url-https, options-sender-url
affects: [07-06 content settings reader, 07-07 upgrade-storage, 08-themes popup picker, 10-options page]

actuals:
  tokens: 5595
  tasks: 2
  commits: 6
plan_head_before: a880538b1a412782a5f013bb07518f96624d4970
plan_head_after: f68d13fd1bcef15dd684eda0a3b88e5473bee6bc

tech-stack:
  added: []
  patterns:
    - "Sender checks read only the sender's own document URL (sender.url), never a tab or navigation URL, so D-17 stays a sender check and not route detection"
    - "Extension-page senders are told apart by their exact packaged URL and own id; the options page is not required to lack sender.tab"

key-files:
  created: []
  modified:
    - extension/background.js
    - test/extension/tracer-world.js
    - test/extension/settings-queue.test.js
    - test/extension/toolbar-popup.test.js
    - test/mutants/settings-foundation.mutants.json

key-decisions:
  - "isAgentDocument accepts the host itself or any subdomain (Chrome's reading of the manifest's *. host), https only, a pathname starting /agent/, and refuses anything that is not a string or does not parse"
  - "fromOptions is a function declaration (the plan's acceptance criterion names `function fromOptions(`); fromContent and fromPopup stay arrow constants as shipped"
  - "The options-page status-hint refusal is measured with optionsSender(TAB_ID), because a hint for the default OTHER_TAB_ID projects a tab that is not open and would show no action-log change even if admitted"

patterns-established:
  - "A single test loops over refused senders with a named marker per case, so one test name can carry two mutants whose first failing case differs (content-sender-agent-url on the first case, agent-url-https on the plain-http case)"

requirements-completed: [COMPAT-04]

coverage:
  - id: D1
    description: "A status hint is refused from a sender identical to the content script except for its URL: a foreign host, a host only ending in the name, a look-alike host, a help-centre path, an empty host, a non-string URL, no URL, and plain http on the genuine host and path"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-queue.test.js#a status hint from a sender identical to the content script except for its URL is refused (D-17)"
        status: pass
      - kind: other
        ref: "node scripts/verify-mutation-kills.js --only content-sender-agent-url -> MUTATION KILLS: 1/1 killed"
        status: pass
      - kind: other
        ref: "node scripts/verify-mutation-kills.js --only agent-url-https -> MUTATION KILLS: 1/1 killed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The genuine content sender and https://zendesk.com/agent/ are accepted, and the worker's AGENT_HOST and AGENT_PATH agree with the manifest's single matches entry (D-01)"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-queue.test.js#a status hint from the genuine content sender, or from the bare host under the agent path, is accepted (D-17)"
        status: pass
      - kind: unit
        ref: "test/extension/settings-queue.test.js#the worker's agent host and path agree with the manifest's single match pattern (D-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "An options page in a tab is refused for a status hint, popup-status and set-enabled; set-setting is answered only from the packaged popup or options page, while a content sender, a foreign id with the options URL, an agent document named options.html and a bare options path get no reply and write nothing"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-queue.test.js#an options page open in a tab is refused for a status hint (D-17)"
        status: pass
      - kind: integration
        ref: "test/extension/settings-queue.test.js#set-setting is admitted only from the packaged popup or the packaged options page (D-17, D-18)"
        status: pass
      - kind: integration
        ref: "test/extension/settings-queue.test.js#popup-status and set-enabled from the options page are refused, as in v1 (D-17)"
        status: pass
      - kind: other
        ref: "node scripts/verify-mutation-kills.js --only options-sender-url -> MUTATION KILLS: 1/1 killed"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every v1 message shape keeps its v1 outcome: the restated route pin (no changeInfo.url, webNavigation or history; zendesk and agent/ exactly once each) and the negative-sender tables, each content-shaped sender now carrying url: CONTENT_URL, pass unchanged in name; the enabled path is byte-identical to 6d3ab0b"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/toolbar-popup.test.js (105 tests, including a navigation event only invalidates and requeries; it never reads the URL it carries)"
        status: pass
      - kind: other
        ref: "ENABLED_PATH_UNCHANGED node check from the plan's verify"
        status: pass
      - kind: other
        ref: "node scripts/verify-mutation-kills.js -> MUTATION KILLS: 47/47 killed"
        status: pass
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon -> 30 files, 1348 Vitest tests, exit 0"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 05: D-17 Sender Checks Summary

**The worker now admits a content message only from an `https` document on `zendesk.com` or a subdomain whose path starts `/agent/` (`isAgentDocument(sender.url)` in `fromContent`). It admits `set-setting` only from the packaged popup or the packaged options page (`fromPopup(sender) || fromOptions(sender)`). An options page open in a tab can no longer pose as content. The v1 message shapes and the `enabled` path are unchanged. Three new sender mutants were measured killed before registration, and the full gate passes 47/47.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-09-28T08:55:47Z
- **Completed:** 2026-09-28T09:05:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `background.js` gains `AGENT_HOST = 'zendesk.com'`, `AGENT_PATH = '/agent/'` and `isAgentDocument`. The function refuses a non-string or unparsable URL. It compares the protocol with `'https:'` and accepts the host itself or a subdomain ending in `.` plus the host. The pathname must start with the agent path. `fromContent` requires it on `sender.url`. The source contains no scheme-prefixed URL literal, and `zendesk` and `agent/` each appear once.
- `fromOptions` checks the extension's own id and the exact `chrome.runtime.getURL(OPTIONS_PATH)`. It does not require `sender.tab` to be undefined. The `set-setting` branch accepts either packaged page. The three v1 branches keep their v1 predicates.
- The tracer's content sender now carries `CONTENT_URL`, a synthetic tenant, and the worker context has `URL`. `optionsSender(tabId)` models an options page open in a tab, and its replies use the popup-response stage.
- The v1 pins were restated in their own commit (D-25), with the reason given there. Every content-shaped sender in `toolbar-popup.test.js` carries the genuine URL, so each case is still refused by the clause its name describes. No case name changed.
- Final checks:
  - full recon suite: 1348 Vitest tests, exit 0;
  - full mutation gate: 47/47 killed (39 v1, 5 from 07-04, 3 new);
  - `ENABLED_PATH_UNCHANGED`.

## Task Commits

1. **Task 1: A status hint from anything but a Zendesk agent document is refused, end to end (tracer)**
   - `e1a1098` (test): the tracer content sender URL and the worker `URL` global, as a separate test-double commit
   - `fdf91c9` (feat): `isAgentDocument`, the `fromContent` clause, and the content-side D-17 tests with the D-01 agreement test
   - `e0f2431` (test): the restated route-detection and negative-sender pins (own commit, D-25)
2. **Task 2: Extension pages may write settings but never pose as content, and the sender mutants**
   - `1de43df` (test): the options-page sender doubles, as a separate test-double commit
   - `f2e2f9e` (feat): `fromOptions`, the widened `set-setting` gate, and the extension-page D-17 tests
   - `f68d13f` (test): three measured-killed mutants appended to `settings-foundation.mutants.json`

The tracer feedback gate ran in interactive `end-of-phase` mode, and Task 1's verify is automated-only. That verify was re-run and passed: 9 files, 506 tests, plus `ENABLED_PATH_UNCHANGED`. The plan then went on to Task 2.

## Files Created/Modified
- `extension/background.js` - the D-17 sender-check block (`AGENT_HOST`, `AGENT_PATH`, `isAgentDocument`), the `fromContent` clause, `OPTIONS_PATH`, `fromOptions` and the `set-setting` sender gate.
- `test/extension/tracer-world.js` - `CONTENT_URL`, `URL` in the worker context, `OPTIONS_PATH`, `OPTIONS_URL`, `optionsSender` and the response-stage choice.
- `test/extension/settings-queue.test.js` - six new tests: the refused and accepted content URLs, the D-01 agreement, the options page refused as content, `set-setting` admission, and v1 shapes refused from the options page. The 07-04 content-sender row now uses the genuine content sender.
- `test/extension/toolbar-popup.test.js` - the restated route pin and the negative-sender tables.
- `test/mutants/settings-foundation.mutants.json` - `content-sender-agent-url`, `agent-url-https` and `options-sender-url`.

## Decisions Made
- `isAgentDocument` treats the manifest's `*.` host the way Chrome does: the host itself or any subdomain. Anything else is refused, including a host that only ends in the name without a dot.
- The options page status-hint test uses `optionsSender(TAB_ID)`. With the default `OTHER_TAB_ID`, an admitted hint projects a tab that is not open, so the test would pass even without the check.
- `fromOptions` is a function declaration, as the acceptance criterion names it.

## Deviations from Plan

### Auto-fixed Issues

None. The plan's contract was delivered as written.

### Procedural

**1. [Process] One commit is red on its own.** The route pin restatement has to be its own commit (D-25). The restated pin says `zendesk` occurs exactly once, and the old pin forbids it entirely, so no order keeps every commit green. The feature commit `fdf91c9` fails that one pin by itself. The next commit, `e0f2431`, restates it, and both commit messages say so. This follows the 07-04 precedent (feature, then restated pin).

**2. [Process] Extra refused cases beyond the plan's list.** These are a host that only ends in the name (`evilzendesk.com`), a missing URL, and a bare `options.html` URL for `set-setting`. They strengthen the negative tables and change no shipped byte.

**3. [Process] The HEAD safety check reports `main` as protected.** Commits went to `main` as directed, with `branching_strategy: none`, the same as 07-01 to 07-04.

---

**Total deviations:** 0 auto-fixed, 3 procedural
**Impact on plan:** None on the delivered contract.

## Issues Encountered
- The mutation runner requires the target assertion's first failure line to carry the marker. The plain-http case therefore carries both `[mutant:content-sender-agent-url]` and `[mutant:agent-url-https]`, so either mutant is proven on its own first failing case.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 07-06 runs next in the same wave. This plan did not touch its files: `content.js`, `chrome-harness.js`, `settings-reader.test.js` and `parity.test.js`.
- Phase 10's options page can send `set-setting` as soon as it exists. The worker already admits the packaged options URL and refuses everything else.

## Self-Check: PASSED
- FOUND: extension/background.js, test/extension/tracer-world.js, test/extension/settings-queue.test.js, test/extension/toolbar-popup.test.js, test/mutants/settings-foundation.mutants.json
- FOUND commits: e1a1098, fdf91c9, e0f2431, 1de43df, f2e2f9e, f68d13f

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
