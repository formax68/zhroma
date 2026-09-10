---
phase: 04-honest-failure-and-an-off-switch
reviewer: gsd-code-reviewer
reviewed: 2026-09-10T13:05:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - extension/manifest.json
  - extension/background.js
  - extension/content.js
  - extension/popup.html
  - extension/popup.js
  - extension/zhroma.css
  - test/extension/chrome-harness.js
  - test/extension/tracer-world.js
  - test/extension/diagnosis.test.js
  - test/extension/initial-tint.test.js
  - test/extension/persistent-tint.test.js
  - test/extension/runtime-contract.test.js
  - test/extension/toggle.test.js
  - test/extension/toolbar-popup.test.js
  - test/extension/phase-03-live-acceptance.test.js
  - test/extension/phase-04-live-acceptance.test.js
  - test/performance/tint-workload.js
findings:
  critical: 1
  warning: 10
  info: 9
  total: 20
critical: 1
warnings: 10
info: 9
suite_adequacy: ADEQUATE-WITH-GAPS
regression_hazard: CORRECT-AS-DOCUMENTED
status: issues_found
verdict: "The named regression is correctly fixed and the privacy/trust surface holds under attack; one shipped defect (every English regional locale is told its language is unsupported) and a mutation-proven blind spot over the worker's entire staleness machinery keep this short of clean."
---

# Phase 4: Code Review Report

**Reviewed:** 2026-09-10
**Depth:** standard (with adversarial mutation probing of the shipped scripts)
**Files Reviewed:** 17
**Status:** issues_found

## Summary

I read all six text assets of the packaged product plus the eleven test/harness
files, then attacked the claims instead of the code's self-description. Method,
so the findings are checkable:

- **Static review** of `manifest.json`, `background.js`, `content.js`,
  `popup.html`, `popup.js`, `zhroma.css` against the project constraints in
  `CLAUDE.md` (zero permissions beyond `storage`, no host permissions, no
  network, no telemetry, no remote code, attributes-only DOM contract).
- **A channel sweep** of every shipped script for `console.*`, `fetch`, `XHR`,
  `WebSocket`, `sendBeacon`, `localStorage`/`sessionStorage`/`indexedDB`,
  `eval`, `innerHTML`, `createElement`, `document.write`, `chrome.storage.sync|
  session|managed`, `location.*`, `document.cookie`, `tab.url`,
  `changeInfo.url`. **One hit total:** `background.js:259`, which *compares*
  `sender.url` to `chrome.runtime.getURL('popup.html')` and never stores,
  transmits or logs it. The message protocol really is finite and value-free.
- **Mutation probing.** I copied the repo (`git archive`) into a scratch tree
  with a symlinked `node_modules` — **no file under `/Users/mike/code/zhroma`
  was modified by this review** — and applied **43 single-clause mutants** to
  the three shipped scripts, running six behavioural suites (`toolbar-popup`,
  `toggle`, `diagnosis`, `initial-tint`, `persistent-tint`, `runtime-contract`,
  277 tests) against each. **26 mutants were caught. 17 survived.** The
  survivors are not scattered; they cluster in two places, and that clustering
  is the substance of the suite-adequacy judgment below.
- I confirmed the baseline first: `npm test` → **65 `node --test` + 518 Vitest,
  exit 0**, and `git status --short` is unchanged by this review.

The good news is real and should be recorded as such. The trust boundary
survived direct attack: no `externally_connectable`, no
`web_accessible_resources`, `world: "ISOLATED"`, so page script and foreign
extensions cannot reach `chrome.runtime.onMessage` at all, and `fromContent` /
`fromPopup` (`background.js:250-259`) are each pinned by named negative tests —
mutating away `frameId === 0`, the `documentId` identity, the popup URL check or
the content script's own `sender.tab !== undefined` refusal all fail the suite.
Storage is exactly one boolean, exactly one writer: `background.js` is the only
file containing `chrome.storage.local.set`, the content script and popup are
denied write surfaces by the doubles, and absent-key default-on comes from
`get({enabled: true})` in both processes. Nothing in the shipped scripts
constructs DOM, writes CSS, or carries a colour literal.

What follows is what I can prove is wrong or unguarded.

## Required judgment 1 — Suite adequacy (04-06 coverage entry D7)

**Verdict: ADEQUATE-WITH-GAPS.**

The assertion *set* is unusually strong on the two things this phase is about —
the diagnosis detector and the preference state machine. Mutants that break
those are caught hard and by name: shrinking `SETTLE_MS` 100→40 fails 3 tests;
accepting an unrecognised priority string fails 21; claiming `missing` without a
width-matched row witness fails 10; accepting malformed rows fails 13; removing
the `document.hidden` gate fails 4; treating a non-boolean stored value as
enabled fails 6; projecting `off` as `neutral` fails 8. The popup's honesty
branches (`NOT_SAVED`, `NOT_APPLIED`, the one-request-at-a-time guard) are each
pinned. That is a genuinely good suite for `content.js` and for the popup's
reporting logic.

The gaps are concentrated in **`background.js`'s ordering, staleness and cleanup
machinery**, and in **failure discrimination at the storage seam**. Seventeen
surviving mutants, grouped:

**A. The worker's entire staleness mechanism is unguarded (the largest gap).**
I deleted, in one mutant, *every* generation guard in the worker — both
post-await rechecks in `project()` (`background.js:202,206`), the recheck inside
`applyAction()` (`:190`), both in `requestStatus()` (`:152,154`), the one in
`popupStatus()` (`:218`) — leaving `generationOf(` with **zero call sites**, so
`invalidate()`'s only purpose was gone. Result across all of `test/extension`:
**1 failed test, and it was the SHA-256 byte pin in
`phase-04-live-acceptance.test.js`**, which fires on any edit whatsoever. Not
one behavioural assertion noticed. Separately, deleting the per-tab
serialization (`state.queue.then(...)` → an immediately-invoked async function,
`background.js:200`) also failed nothing.

The reason is diagnosable, not mysterious: the test named as this property's
guardian — `toolbar-popup.test.js:343` *"a slow earlier reply cannot repaint
over a newer projection"* — cannot construct the hazard it names. The tracer's
`replyDelays` is applied inside `deliver()` (`tracer-world.js:142-157`), which
delays **delivery to the listener**, so the content script's handler runs 120 ms
late and answers with the status it holds *at that moment* — already the new
one. There is no stale payload in flight, so no guard is needed to make the
assertion pass. The test is vacuous for its stated purpose (see WR-01).

**B. Failure is not distinguished from absence anywhere it is claimed to be.**
Removing `if (chrome.runtime.lastError) …` from `background.js:85` *and*
independently from `content.js:439` both survive. Both doubles model a rejected
read as `callback(undefined)` (`chrome-harness.js:123`,
`tracer-world.js:196-203`), so the observed dormancy comes from the
`values ? … : null` falsy path, never from the `lastError` branch. `04-06`
coverage entry D2 claims "a rejected read … stays dormant" is verified; the
*mechanism* the source comments call load-bearing is not (WR-03).

**C. Boundary validation of replies is unverified.** Replacing the worker's
whole reply gate — `isExact(reply, [...]) || !validDiagnosis(...)` at
`background.js:155-158` — with `if (false)` survives. So does deleting
`reply.requestId === requestId` (`:136`) and the `Object.hasOwn(TITLES, …)`
pairing clause (`:139`). So does deleting the popup's own `validStatus` /
`validPreference` gate (`popup.js:109`) and its unknown-key fallback
(`popup.js:55`). These are defence-in-depth against a compromised or buggy
peer, so their survival is less alarming than group A — but the pairing clause
is exactly what a reviewer wants pinned **before 04-03-style taxonomy growth**,
which is the question D7 asks (WR-05).

**D. Two single-purpose lifecycle mechanisms are untested.** Collapsing
`serializePreference` to `return task()` survives, even though
`toolbar-popup.test.js:722` is named *"two popups asking for opposite values are
serialized, and neither inverts the other"*. Deleting the
`chrome.tabs.onRemoved` cleanup (`background.js:297-299`) survives; nothing can
observe the `tabs` Map (WR-06).

**E. Untested-but-benign.** `window.top !== window` (`content.js:62`) is
unreachable with `all_frames: false` (IN-01); the first-announce nudge
(`content.js:421`) and `isExact`'s key-count clauses have no isolating test.

**What this means for the D7 question as posed.** "Whether the restored suites
are the right suites … before 04-03 expands the diagnosis taxonomy": they are
the right suites for the *detector* and for the *preference*, and they are not
sufficient for the *worker*. Every property in group A/C/D is one a reviewer
would want pinned before the taxonomy grows, because each will be edited when it
does. Concretely, the minimum I would require before calling this ADEQUATE:

1. A tracer capability that delays the **response** rather than the delivery
   (capture the reply payload, then release it late), so the stale-repaint test
   can actually fail — then re-assert both `project()` guards and the queue.
2. A `readMode` that sets `lastError` **and** delivers a values object, in both
   doubles, so the `lastError` branches become load-bearing.
3. One test that drives an unpaired `{diagnosis, reason}` from a content double
   through the worker and asserts the toolbar is not repainted with a stale
   title, plus a `TITLES`/`ICONS`/`DIAGNOSES`/`REASONS` completeness assertion
   over the whole product set.
4. An inversion test with genuinely interleaved writes (deferred write mode)
   for `serializePreference`, and an observable for closed-tab cleanup.

## Required judgment 2 — The named silent-regression hazard

**Verdict: CORRECT-AS-DOCUMENTED.**

**`requestApply` is keyed on the echoed `requestId`, not on the generation.**
`extension/background.js:172-182`: `requestId` is minted at `:173`, sent at
`:176`, and the reply is accepted only if
`isExact(reply, ['type','requestId','applied','diagnosis','reason'])` and
`validDiagnosis(reply, requestId, 'applied')` (`:178-180`) — and
`validDiagnosis` (`:133-140`) tests `reply.requestId === requestId` at `:134`.
There is **no `generationOf` call anywhere in the function**; the reason is
written out at `:166-171`.

**`project()` is still generation-guarded.** `extension/background.js:195-210`:
`const generation = invalidate(tabId)` at `:196`, then a recheck after **every**
await — `:202` after `requestStatus`, `:206` after `readPreference` — before
`applyAction` at `:207`, which rechecks again between its own two awaits at
`:190`. `popupStatus` carries the same guard at `:218`.

I did not take this on reading alone. In the scratch tree I re-introduced the
historical defect — capture `generationOf(tabId)` before the send in
`requestApply` and recheck it after the await — and the suite went red with
precisely the documented symptom:

```
FAIL test/extension/toggle.test.js
  > switching back on restores tint for priorities that changed while it was off
AssertionError: expected 'No readable view is connected' to be 'Priority tinting is working'
```

So `toggle.test.js:81` is a real, sensitive tripwire against re-adding the wrong
guard, and the 04-04 fix is genuinely in the shipped bytes.

**One correction to the record.** `04-VALIDATION.md` says both
`#switching back on restores tint…` **and** `#a slow earlier reply cannot
repaint over a newer projection` "must both keep passing" as the pair that keeps
this from regressing silently. Only the first is load-bearing. The second passes
with every generation guard *and* the per-tab queue removed (judgment 1, group
A), so it protects the "painting stays generation-guarded inside `project()`"
half of the invariant not at all. The tripwire is half-armed: **adding** a wrong
guard is caught, **removing** the right one is not — including removing the
echoed-`requestId` check itself, which also survives. That asymmetry is the
residual silent-regression risk, and it is filed as WR-01 and WR-02 rather than
as a defect in the fix.

## Critical Issues

### CR-01: Every English regional locale is told its interface language is unsupported

**File:** `extension/content.js:63-68` (with `extension/zhroma.css:1,8,15,22`)
**Evidence:**

```js
const shellLanguage = document.documentElement.lang;
if (shellLanguage !== 'en') {
  return result(shellLanguage.trim() === '' ? 'unsafe' : 'unsupported');
}
```

`'unsupported'` maps to `['cannot-read', 'unsupported-language']`
(`content.js:218`) → the popup and toolbar say **"This interface language is not
supported"** (`popup.js:23`, `background.js:44`). The comparison is exact and
case-sensitive, so `lang="en-US"`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, or
`EN` all take that branch. `zhroma.css` encodes the same predicate
independently as `html[lang="en"]`, so nothing paints either.

Zendesk ships multiple English agent locales (US, GB, AU, CA, IE, IN, NZ, ZA),
all of which render the priority labels this detector already accepts —
`Urgent`, `High`, `Normal`, `Low` (`content.js:5`). For any agent on one of
them, Zhroma is silently inert **and** makes a false statement about their
interface, in the phase whose entire subject is honest failure. It is the exact
mirror of FAIL-03/D-04 ("an English view is never blamed on its language",
`04-LIVE-ACCEPTANCE.md` `structure-copy`).

This is not an oversight that a later phase will notice: it is **locked in by
tests as intended behaviour** — `initial-tint.test.js:166` and
`persistent-tint.test.js:122` list `'en-US'` among the variants that must
produce zero writes, and `runtime-contract.test.js:261` asserts that setting
`lang = 'en-US'` makes every CSS rule stop matching.

Mitigating context, stated fairly: `03-LIVE-ACCEPTANCE.md` records an observed
`html_lang: "en"` on the real tenant, and `04-LIVE-ACCEPTANCE.md` pins
`scope.html_lang: 'en'`, so the shipping default locale is empirically fine. The
claim is not "this is broken today for the author" but "this is broken for a
class of users the product promises to serve with zero setup", and
`CLAUDE.md` already flags Zendesk's DOM/locale behaviour as the project's
standing unverified risk.

**Fix:** compare the BCP-47 primary subtag, case-insensitively, in both places —
and change them together, because they are two copies of one predicate with no
shared source:

```js
// content.js
const shellLanguage = document.documentElement.lang.trim();
const primary = shellLanguage.toLowerCase().split('-')[0];
if (primary !== 'en') {
  return result(shellLanguage === '' ? 'unsafe' : 'unsupported');
}
```

```css
/* zhroma.css — repeat for High, Normal, Low */
html[lang="en" i] table[...],
html[lang|="en" i] table[...] { background-color: rgb(220 38 38 / 0.14); }
```

Then move `'en-US'` out of the invalid-variant lists into a positive case
(`en-US`/`en-GB` tint exactly as `en` does), keep `fr` and `''` where they are,
and add one test that fails if the JS predicate and the CSS predicate disagree —
the drift hazard here is a shipped state where the popup says "working" and
nothing paints. Re-bind the acceptance record afterwards
(`04-VALIDATION.md` promotion rule 3).

## Warnings

### WR-01: The stale-repaint test cannot fail, so the worker's generation machinery is unguarded

**File:** `test/extension/toolbar-popup.test.js:343-354`, `test/extension/tracer-world.js:142-157`, `extension/background.js:74-75,190,195-210,218`
**Evidence:** `replyDelays` is consumed as the `delay` argument of `deliver()`,
which wraps the *listener invocation* in `setTimeout`. The content script
therefore computes its reply after the DOM change, so the "slow earlier reply"
carries the current status and the assertion (`icons.at(-1) === neutral`) holds
with or without any ordering guard. Proven: with `generationOf(` reduced to zero
call sites and the per-tab queue removed, all 277 behavioural tests still pass.
**Impact:** the worker's staleness design has no executable specification. A
refactor that drops it — the single most likely edit when 04-03 adds diagnoses —
lands silently, and the failure it re-enables (one tab's diagnosis painted onto
another tab's toolbar, a positive `working` surviving a navigation) is exactly
what FAIL-05's `navigation-status` check exists to catch, unobserved.
**Fix:** give the tracer a response-side delay — have the content double capture
`sendResponse`'s payload immediately and release it after a delay (or add a
`stalePayload` mode that replies with a snapshot taken before the DOM change) —
then assert (a) the icon never shows `working` after the table is removed, and
(b) `actionLog` contains no write attributable to the superseded generation.
Re-run the four mutants in group A and require each to fail.

### WR-02: The echoed-requestId guard and the whole reply-shape gate can be deleted without failing a test

**File:** `extension/background.js:133-140,155-158,178-180`
**Evidence:** three surviving mutants — deleting `&& reply.requestId ===
requestId` (`:134`); replacing `if (!isExact(reply, [...]) ||
!validDiagnosis(reply, requestId, 'status'))` with `if (false)` (`:155`);
deleting the `Object.hasOwn(TITLES, statusKey(...))` clause (`:139`).
**Impact:** the property `04-VALIDATION.md` names as `requestApply`'s *only*
staleness key is unprotected in the removal direction. The suite catches the
wrong guard being added but not the right one being taken away, so the
"silent regression" the document warns about is only half-fenced.
**Fix:** one test per clause. For the requestId echo, have the content double
reply with `requestId + 1` and assert the worker treats it as `unavailable`
(status path) / `null` (apply path); for the shape gate, reply with an extra
member and with an out-of-set `diagnosis`.

### WR-03: `lastError` is never exercised, so "a failure is never absence" is unverified in both processes

**File:** `extension/background.js:85`, `extension/content.js:439`; doubles at `test/extension/chrome-harness.js:122-126`, `test/extension/tracer-world.js:196-203`
**Evidence:** both doubles implement a rejected read as
`lastError = {...}; callback(undefined)`. Deleting either shipped `lastError`
check leaves 277/277 passing, because `values ? values[KEY] : null` /
`isObject(values) ? … : undefined` already yields the dormant answer.
**Impact:** the mechanism that keeps a *failed* read from being read as an
*absent* key — i.e. the thing standing between a storage error and tinting a
view the agent switched off — has no coverage. If Chrome ever invokes the
callback with the defaults object alongside `lastError` (quota/IO paths), the
only code that prevents default-on is the untested branch.
**Fix:** add a `readMode: 'rejected-with-values'` to both doubles that sets
`lastError` *and* delivers `{ enabled: true }`, and assert dormancy in
`content.js` and `enabled === null` in the worker.

### WR-04: An unresponsive document wedges the extension's only preference writer, with no timeout anywhere

**File:** `extension/background.js:105-109,172-182,229-247`; `extension/content.js:479-495`; `extension/popup.js:91-98`
**Evidence:** `setEnabled` awaits `requestApply` (`:235`) with no bound;
`requestApply` awaits `chrome.tabs.sendMessage` with no bound; the content
handler returns `true` and defers `sendResponse` until a
`chrome.storage.local.get` callback that is itself unbounded
(`content.js:485-493`). Every subsequent write chains behind the pending task in
`serializePreference` (`:106-107`). The popup's `ask()` has no timeout either.
**Impact:** a single top frame that receives `apply-preference` and never
answers (a document that stops running JS at that instant, a storage callback
that never lands) leaves the off switch inoperative **in every tab** — the popup
shows the disabled control and stale copy, and each retry queues behind the
wedged task — until Chrome terminates the worker. The user-visible failure is
"the off switch stopped working", with no honest message, in a phase whose
promise is control without uninstalling.
**Fix:** bound both hops. In the worker,
`Promise.race([sendMessage(...), timeout(2000).then(() => TIMED_OUT)])` and
treat a timeout as `outcome === null` (already reported honestly as
`applied: false` + "Setting saved, but this view did not update"). In the popup,
race `ask()` against a timeout and fall back to `NOT_SAVED` with the control
re-enabled. Optionally guard `readPreference(done)` so `done` cannot be dropped.

### WR-05: The `{diagnosis, reason}` pairing gate is untested, and bypassing it leaves a stale toolbar rather than a clean fallback

**File:** `extension/background.js:24-49,133-140,184-193`
**Evidence:** `TITLES` is keyed by the whole pair while `ICONS` is keyed by
status alone; the only thing stopping an unpaired combination is
`Object.hasOwn(TITLES, statusKey(...))` at `:139`, whose deletion survives the
suite. If an unpaired or unknown status does reach `applyAction`,
`ICONS[result.status]` / `TITLES[key]` are `undefined`, `chrome.action.setIcon`
rejects, the `catch` at `:192` swallows it, and `setTitle` is never reached — so
**the tab keeps the previous icon and title**, i.e. a stale claim about the view,
which is the failure mode FAIL-05 exists to prevent.
**Impact:** this is the specific hazard D7 asks about. 04-03-style taxonomy
growth means editing `DIAGNOSES`, `REASONS`, `ICONS`, `TITLES` and `popup.js`'s
`COPY` in five places; nothing asserts they stay in agreement, and the penalty
for disagreement is a silently stale toolbar.
**Fix:** add a structural test — every `status:reason` pair derivable from
`DIAGNOSES × REASONS` that `validDiagnosis` admits must have a `TITLES` entry, an
`ICONS` entry for its status, and a `popup.js` `COPY` entry; plus a behavioural
test that an out-of-set diagnosis from a content double leaves `actionLog`
untouched instead of half-written.

### WR-06: Single-writer serialization and closed-tab cleanup have no coverage

**File:** `extension/background.js:105-109,297-299`
**Evidence:** collapsing `serializePreference` to `return task()` survives, as
does deleting the `chrome.tabs.onRemoved` listener entirely. The test named
*"two popups asking for opposite values are serialized, and neither inverts the
other"* (`toolbar-popup.test.js:722`) passes without the queue, because with
immediate write mode the two tasks commit in arrival order anyway.
**Impact:** the two mechanisms that keep the preference from inverting and the
`tabs` Map from growing without bound are effectively unspecified. `04-06`
lists single-writer serialization as a headline property.
**Fix:** drive the inversion test with `setWriteMode('deferred')` so the two
tasks genuinely interleave, flush in reverse order, and assert the last request
wins; expose a projection/known-tab count (or assert via a per-tab observable)
so closed-tab cleanup is checkable.

### WR-07: After a failed save the checkbox displays a value nothing confirmed, and the control is then dead with focus dropped

**File:** `extension/popup.js:58-68,127-137`
**Evidence:** the `change` event has already moved `control.checked` to the
desired value before the request is sent. On the illegible-reply path,
`showPreference(null)` deliberately leaves `checked` alone — but the comment says
"leave the control exactly where the agent last saw it", and where the agent last
saw it is the *new*, unconfirmed position. `control.disabled = true` then makes
the switch permanently inert for the life of the popup, and `end(hadFocus)`
cannot restore focus because it is guarded by `!control.disabled` (`:88`).
**Impact:** the agent sees an unchecked box next to "Zhroma could not save that
setting" — the copy is honest and the control contradicts it, which is precisely
the ambiguity this phase set out to remove; a keyboard user additionally loses
focus into `body` with no recovery. `popup-keyboard` is still a pending human
check, so this will be judged by a person against the code as it stands.
**Fix:** on an illegible or unsaved reply, revert `control.checked` to
`control.defaultChecked` (or to the last confirmed value, kept in a variable) and
leave the control **enabled** so a retry is possible, keeping `NOT_SAVED` as the
copy; restore focus unconditionally when `hadFocus`.

### WR-08: The tint stylesheet uses no `!important`, contrary to the project's explicit styling directive

**File:** `extension/zhroma.css:1-27` (inherited from Phase 3; not modified by Phase 4)
**Evidence:** all four rules are plain declarations. `CLAUDE.md` prescribes
"Plain unlayered rules with `!important`" and warns that "`!important` vs
`!important` falls through to specificity, then source order — and their
runtime-injected styles win source order".
**Impact:** the tint currently wins on selector specificity alone against
Zendesk Garden's CSS-in-JS. It was observed painting live (Phase 3
`in-app-entry`, `native-states`, `tab-return` all `pass`), so this is fragility
rather than breakage — but a single Garden restyle that adds a `td` background
at equal-or-greater specificity, or with `!important`, silently un-tints every
row, and the cascade check is exactly the item Phase 3 left to a deferred
Playwright/manual step.
**Fix:** add `!important` to the four `background-color` declarations, keeping
the existing high-specificity selectors, and re-bind the acceptance hashes. The
`runtime-contract` paint assertions read `rule.style.backgroundColor`, which is
unaffected by the priority flag.

### WR-09: The workload's `mode` parameter fails open, and "disabled" measures a page with no extension

**File:** `test/performance/tint-workload.js:13,29-57,152-165`
**Evidence:** `const enabled = params.get('mode') === 'enabled';` — any other
value, including a typo or an omitted parameter, silently means *disabled*, and
disabled mode installs no seam and never loads `content.js`. `verify()` then
expects zero markers and zero observers, so the run reports `passed` with
0 callbacks / 0 writes. Separately, the seam's `get` always answers
`{...defaults}` (`:52`), so no run ever exercises a **stored `false`**.
**Impact:** two ways to be misled. A mis-invoked "enabled" run measures nothing
and still exits 0 — and six such runs are the timing evidence
`04-VALIDATION.md` records as `passed` and
`phase-04-live-acceptance.test.js` consumes (`validateWorkloadReport`, which
accepts `callbacks: 0` for `mode: 'disabled'`). And the "disabled control"
measures a *different program*, so it establishes nothing about the cost of the
shipped off state (a loaded controller that declines to act) — a claim the
validation document words carefully but which the report's `mode: "disabled"`
label invites readers to over-read.
**Fix:** validate the parameter (`throw` unless mode is exactly `enabled` or
`disabled`, and unless `size` is a positive integer); add a third mode that
installs the seam, stores `false`, loads `content.js`, and asserts 0 markers /
0 observers / 0 pending timers — that is the real dormancy cost — keeping the
no-runtime run as a separately named baseline.

### WR-10: An assertion inside the fake Chrome is swallowed by the shipped script's try/catch

**File:** `test/extension/tracer-world.js:288`
**Evidence:** `expect(options).toEqual({ frameId: 0 })` runs inside
`workerChrome.tabs.sendMessage`, which the worker calls inside `try { await … }
catch { … }` (`background.js:147-153,175-177`). A thrown assertion is caught by
production code and converted into `unavailable` / `null`.
**Impact:** a real contract violation (a missing or wrong `frameId`, which would
let a subframe answer for the document) degrades into a plausible-looking
"no receiver" result instead of a red test, and only fails indirectly where a
test happens to expect a positive projection. `chrome-harness.js:56-59` already
solved this — record the violation, throw, and fail via `assertClean()`.
**Fix:** in `tracer-world.js`, push `frameId` violations onto the existing
`forbidden` array (which suites already assert empty) instead of calling
`expect` inside the double.

## Info

### IN-01: Unreachable subframe guard

**File:** `extension/content.js:62` — `if (window.top !== window) return result('unsafe');` cannot be true while the manifest declares `all_frames: false`. Dead defensive code (its removal survives the suite). Keep it if `all_frames` may ever change, but note it is unverifiable today.

### IN-02: `content_scripts[].world` is below its platform floor

**File:** `extension/manifest.json:5,20` — `world` in `content_scripts` is honoured from Chrome 111, while `minimum_chrome_version` is `"106"` (set for `sender.documentId`). On 106–110 the key is ignored with a manifest warning; behaviour is unchanged because ISOLATED is the default, so this is cosmetic — but the "world is pinned twice over" guarantee is not platform-enforced across the whole supported range. Either raise the floor to 111 or record that ISOLATED there is a default, not a declaration.

### IN-03: Only a 32 px icon ships

**File:** `extension/manifest.json:9,11` — matches the recorded user decision ("Five static shape treatments in 32x32 PNG … Store artwork stays Phase 5"), so not a defect here. Carry forward: `CLAUDE.md` lists 128 as store-required and 48 as strongly recommended; Chrome upscales 32→48 on `chrome://extensions`. Adding them in Phase 5 will require updating the manifest deep-equal (`runtime-contract.test.js`), the icon inventory (`toolbar-popup.test.js`) and the acceptance byte binding together.

### IN-04: The worker projects into every tab in the browser

**File:** `extension/background.js:287-295` — `tabs.onActivated` / `tabs.onUpdated` are unfiltered, so every navigation and tab switch anywhere triggers `project()`, a `tabs.sendMessage` that rejects, and a tab-scoped `setIcon`/`setTitle` writing "No readable view is connected". No data is read or leaked (verified: `changeInfo.url` and `tab.url` are never touched), and the copy is the decided non-committal line, so this is intentional. Worth stating explicitly in the store-review notes: the worker reacts to all navigations while reading nothing about them.

### IN-05: The popup never updates after its first render

**File:** `extension/popup.js:103-117,156-157` — `refresh()` runs once on open with no subscription to `storage.onChanged` or to status pushes. Re-enabling on a Priority-less view answers `neutral` ("Checking this view") and the popup keeps that text while the toolbar transitions to the missing-column hint ~100 ms later. The acceptance script watches the **icon** for `missing-settle-transition`, so this does not contradict a check; it is a known transient inconsistency between two surfaces that are asserted elsewhere to "agree".

### IN-06: The project's prescribed type-safety mechanism is absent

**Files:** `extension/*.js`, `package.json` — no `// @ts-check` and no JSDoc annotations in any shipped script, and no `typescript` devDependency, though `CLAUDE.md` specifies "JavaScript files with JSDoc types, checked by `tsc --noEmit --checkJs`" as the stack's answer to type safety ("Always"). Adding `// @ts-check` + `@types/chrome` costs no build step and no shipped bytes.

### IN-07: Harness hygiene

**File:** `test/extension/chrome-harness.js:120-126,154-162` — `reads += 1` is counted before the `readMode === 'throws'` throw (a read that never happened is tallied), and `flush()` drains with an unbounded `while (pending.length > 0)`, so a double that re-queues on release would hang the suite rather than fail it. Add a drain-generation cap.

### IN-08: The predecessor revision is transcribed, not derived

**File:** `test/extension/phase-04-live-acceptance.test.js:132` — `revision: '382cc881…'` is a literal. Phase 3's *counts* and *status* are read from its own file (good), but the revision it is bound to is asserted only against the record's copy of the same literal. Deriving it (or hashing Phase 3's three assets) would close the loop.

### IN-09: Parameter shadows the global `document`

**File:** `extension/content.js:58` — `function inspectCandidateTable(document)` shadows the global it is always called with. Harmless today; it makes `confirmMissingColumn`/`reconcileCurrentTable`'s "inspect the CURRENT document" invariant read as a promise about a parameter rather than about the global, which is the sort of ambiguity that invites a future caller to pass a snapshot.

---

_Reviewed: 2026-09-10_
_Reviewer: Claude (gsd-code-reviewer) — independent of the implementing agent_
_Depth: standard, plus 43 single-clause mutants run against six behavioural suites in an out-of-tree copy_
_No file in the repository was modified by this review._
