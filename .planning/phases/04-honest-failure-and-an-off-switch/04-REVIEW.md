---
phase: 04-honest-failure-and-an-off-switch
reviewer: gsd-code-reviewer
reviewed: 2026-09-10T18:35:00Z
depth: standard
review_pass: 2 (incremental — scope is everything changed since bc25a2c)
files_reviewed: 25
files_reviewed_list:
  - extension/background.js
  - extension/content.js
  - extension/popup.js
  - extension/zhroma.css
  - package.json
  - scripts/run-tint-workload.js
  - scripts/verify-mutation-kills.js
  - test/extension/chrome-harness.js
  - test/extension/failure-seam.test.js
  - test/extension/initial-tint.test.js
  - test/extension/performance-harness.test.js
  - test/extension/persistent-tint.test.js
  - test/extension/phase-04-live-acceptance.test.js
  - test/extension/popup-recovery.test.js
  - test/extension/runtime-contract.test.js
  - test/extension/toggle.test.js
  - test/extension/toolbar-popup.test.js
  - test/extension/tracer-world.js
  - test/extension/worker-integrity.test.js
  - test/mutants/failure-seam.mutants.json
  - test/mutants/popup-recovery.mutants.json
  - test/mutants/worker-boundary.mutants.json
  - test/mutants/worker-lifecycle.mutants.json
  - test/mutants/worker-staleness.mutants.json
  - test/performance/tint-workload.js
findings:
  critical: 1
  warning: 6
  info: 5
  total: 12
critical: 1
warnings: 6
info: 5
status: issues_found
verdict: "Eleven of the twelve prior findings are genuinely closed and the mutation gate kills 25/25 independently. But the WR-07 repair introduced a new shipped defect: after a save that succeeds and a read-back that fails, the popup displays the OPPOSITE of the persisted preference under copy claiming the save failed — and the rewritten toggle test asserts that display as correct without ever checking what storage holds."
---

# Phase 4: Code Review Report (incremental pass 2)

**Reviewed:** 2026-09-10
**Depth:** standard, plus independent execution of the shipped mutation gate and five targeted out-of-tree behavioural probes
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Scope is the gap-closure work only: `git diff bc25a2c..HEAD` over the shipped
extension, the two scripts, the twelve test/harness files and the five mutant
registries. I did not re-audit the prior findings; I attacked the new code.

**What I verified independently, not by reading the summaries:**

- `npm test` → 65 `node --test` + **606 Vitest, exit 0**.
- `npm run test:mutants` → **25/25 killed**, run end to end by me. Every mutant
  the prior review measured as SURVIVING is now dead, including all four in
  group A (`project-guard-after-status`, `project-guard-after-preference`,
  `apply-action-guard`, `popup-status-guard`), the per-tab queue
  (`project-queue`), the two `lastError` branches, both `serializePreference`
  and the `onRemoved` pair, and the whole reply-validation set.
- **Registry integrity, checked myself:** all 25 `find` literals occur exactly
  the declared number of times in the current sources, and all 15 referenced
  suite paths exist.
- **Channel sweep** over `extension/*.js`: zero hits for `console.*`, `fetch`,
  XHR, WebSocket, `sendBeacon`, any web storage, `eval`, `innerHTML`,
  `createElement`, `document.write`, `chrome.storage.sync|session|managed`,
  `document.cookie`, `tab.url`, `changeInfo.url`. No debug artifacts, no empty
  catch blocks, no hardcoded secrets. The privacy story still holds.
- **`rmSync` symlink safety** in the new mutation gate: confirmed by experiment
  that Node's recursive removal unlinks the symlinked `.git`/`node_modules`
  rather than recursing into them. The real repository cannot be deleted by an
  interrupted run.
- `git status --short` is byte-identical to the state at review start. **No file
  in the repository was modified by this review**; every probe ran from a
  temporary file that was deleted in the same command.

**The four documented judgment calls, checked rather than re-litigated:**

1. **Popup deadline 5000 > worker 2000, asserted from both shipped sources.**
   Correct in direction and the assertion does read both files
   (`popup-recovery.test.js:29-42,277-286`). But the property it proves is
   weaker than the one its comment claims — see WR-03.
2. **Two redundant guard sites in `requestStatus`, fenced at mechanism level by
   `generation-counter`.** Verified: `project` and `popupStatus` both recheck
   immediately after their `await requestStatus(...)` with no macrotask able to
   interleave, so neither inner recheck is individually observable. The registry
   note at `worker-staleness.mutants.json:60` and
   `status-catch-reports-unavailable`'s note both say exactly what they do and
   do not fence. Honest.
3. **A refused apply reports `unavailable`, not `NOT_APPLIED`.** Verified in
   source order: `popup.js:190` tests `reply.status === 'unavailable'` before
   `popup.js:191` tests `!reply.applied`, and `background.js:258-261` maps
   `outcome === null` to `status: 'unavailable'`. The branch really is
   unreachable, and WINDOWS entry 14 records it rather than asserting it away.
4. **Projection for a closed tab still paints against the dead tab id.**
   Verified in `background.js:217-219`: `project` → `invalidate` → `stateFor`
   mints a fresh entry after `onRemoved` deleted it. WINDOWS entry 22 states
   this as an unmet truth and the test asserts only the honest form.

**Language-family agreement (the CR-01 repair).** `content.js:71-72`
(`lower !== 'en' && !lower.startsWith('en-')` after `toLowerCase()`) and
`zhroma.css`'s `html[lang|="en" i]` do agree on `en`, `EN`, `en-US`, `en-GB`,
`EN-gb`, `en-Latn-GB`, and both refuse `fr`, `fr-CA`, `eng`, `ende`, `''`. The
fix is real. Two things it does not cover are WR-01 and WR-06 below.

What follows is what I can prove is wrong.

---

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: After a save that succeeds and a read-back that fails, the popup displays the OPPOSITE of the persisted preference, under copy saying the save failed

**Severity:** BLOCKER
**Files:** `extension/popup.js:77-100,185-192` (with `extension/background.js:246-270`), locked in by `test/extension/toggle.test.js:233-244`

**Evidence — measured, not inferred.** I drove the shipped bytes through the
tracer world: `stored: {enabled: true}`, popup open and confirmed, then
`setReadMode('rejected')` and a flip to OFF. The write commits; only the
read-back fails.

```
stored   : false          <- the setting WAS saved, and the page obeyed it
markers  : []             <- the tint is gone; the document is already off
checkbox : true           <- the switch displays ON
disabled : false
status   : "Zhroma could not save that setting"
writeLog : [ { "enabled": false } ]
```

The agent is shown a switch reading **ON**, next to copy saying the save
**failed**, on a view whose tint has **already disappeared** — while storage
holds `false`. Three surfaces, three different answers, and the one the agent
acts on is the wrong one.

**Mechanism.** `background.js:251-253` reports `saved`, `enabled` and `applied`
as three separate facts, correctly: here `saved: true`, `enabled: null`.
`popup.js:189` then collapses two of them — `if (!reply.saved || reply.enabled === null) say(NOT_SAVED)` — so a write that succeeded is reported as
"could not save". That conflation predates this pass. What is **new** is
`popup.js:89-92`: the WR-07 repair makes `showPreference(null)` revert
`control.checked` to `lastConfirmed`, which is the value from *before* the
successful write. Before this pass the control stayed at the clicked position —
which in this exact scenario is the value storage actually holds — and was
merely disabled. The repair traded "a position nothing confirmed" for a position
that is actively, provably wrong.

**Why the suite does not catch it.** `toggle.test.js:233-244`, named *"a
rejected read after a write refuses to claim a preference it could not
confirm"*, now asserts `checked === true` and `disabled === false`. It never
asserts `world.getStored('enabled')`, so the contradiction is invisible to it.
The test's own name is falsified by its assertion: the popup **does** claim a
preference — it claims ON while storage holds OFF. `popup-recovery.test.js`'s
two sibling cases both happen to be the benign direction (write rejected →
storage still holds the old value → the revert is correct), which is why the
whole cluster is green.

**Fix.** A successful write is itself confirmation of the value that was
written; a failed read-back does not un-write it. In `popup.js`, distinguish the
two facts the worker already sends separately:

```js
// requestEnabled, replacing the single showPreference/NOT_SAVED pair
outstanding = false;
if (!reply.saved) {
  // Nothing was persisted: the last confirmed value is still what storage holds.
  showPreference(null);
  say(NOT_SAVED);
} else {
  // The write landed. `desired` is what storage holds, even if the read-back
  // could not confirm it, so never revert away from it.
  showPreference(reply.enabled === null ? desired : reply.enabled);
  if (reply.status === 'unavailable') render('unavailable', null);
  else if (!reply.applied) say(NOT_APPLIED);
  else render(reply.status, reply.reason);
}
end(hadFocus);
```

Then repair the test so it can fail: add `expect(world.getStored('enabled')).toBe(false)`
and `expect(control(popup.document).checked).toBe(false)` to
`toggle.test.js:233-244`, and add a `popup-recovery` mutant that reverts the
control after a *successful* write. If the ratified copy set genuinely cannot
carry a fourth line, the minimum acceptable behaviour is still to show the
persisted value — never `lastConfirmed` — whenever `reply.saved === true`.

---

## Warnings

### WR-01: A whitespace- or underscore-padded English shell is still told its language is unsupported

**Severity:** WARNING
**Files:** `extension/content.js:71-76`; encoded into the test set at `test/extension/runtime-contract.test.js:333`, `test/extension/initial-tint.test.js:175`, `test/extension/persistent-tint.test.js:135`

**Evidence — measured against the shipped bytes:**

```
lang=" en"      -> cannot-read / unsupported-language
lang="en "      -> cannot-read / unsupported-language
lang=" en-GB "  -> cannot-read / unsupported-language
lang="en_US"    -> cannot-read / unsupported-language
lang="en"       -> working / null
```

All four rejected shells produce the toolbar and popup line **"This interface
language is not supported"** (`background.js:50`, `popup.js:38`) for an agent
whose interface is English. That is the same false claim CR-01 was raised
against, narrowed from "every regional locale" to "any tag with stray
whitespace or a Java-style underscore separator". Browsers trim `lang` when
computing the document language for `:lang()`, so `lang=" en"` is English to
Chrome and unsupported to Zhroma.

The refusal itself is defensible — `zhroma.css` cannot trim, so if the JS
accepted these the popup would say `working` while nothing painted, which is
the exact drift `runtime-contract.test.js:330-344` exists to prevent. The defect
is not the refusal, it is the **reason attached to it**: `content.js:76` sends
`unsupported` for anything whose `trim()` is non-empty, which blames the
language for what is really a shell the stylesheet cannot select.
`runtime-contract.test.js:333` lists `' '` and `' en'` among `refused` but only
asserts that no markers are written — it never asserts which diagnosis is
published, so the false claim is silently locked in.

**Fix.** Keep the untrimmed comparison that governs painting, and decide the
*reason* from the trimmed value so an English shell is never blamed on its
language:

```js
const raw = document.documentElement.lang;
const lower = raw.toLowerCase();
const supported = (tag) => tag === LANGUAGE_PRIMARY || tag.startsWith(LANGUAGE_PREFIX);
if (!supported(lower)) {
  const trimmed = lower.trim();
  // An empty shell, or an English shell the stylesheet cannot select, is a
  // structural fact about this view — never a claim about the agent's language.
  if (trimmed === '' || supported(trimmed)) return result('unsafe');
  return result('unsupported');
}
```

Then extend `runtime-contract.test.js`'s refused set to assert the published
`{diagnosis, reason}`, not just the absence of markers.

### WR-02: The bound was applied to the two document hops only — the preference writer is still wedgeable, and the source comment overstates the fix

**Severity:** WARNING
**Files:** `extension/background.js:14-19,103-131,246-270`

**Evidence — measured.** With the tracer's storage read parked (`readMode: 'deferred'`, never flushed) I sent two `set-enabled` requests from the popup
sender:

```
first  : NEVER RESOLVED   (9 s ceiling)
second : NEVER RESOLVED   (9 s ceiling)
stored : false
```

`setEnabled` awaits `writePreference` (`:251`), `readPreference` (`:252`) and
`activeTab` (`:253`) — **none of which is passed through `bounded()`** — before
it ever reaches the one hop that is bounded. Because every write chains through
`serializePreference` (`:127-131`), the second request never even started. This
is precisely the failure WR-04 described, reproduced on a different seam.

The comment at `background.js:14-19` states the guarantee as closed: *"A top
frame that receives a message and never answers must cost one wait, not the off
switch: every preference write chains behind the pending task below, so an
unbounded await here would leave the switch inoperative in EVERY tab."* That
reasoning applies verbatim to the three unbounded awaits immediately below it,
so the comment now claims more than the code delivers.

From the agent's side the popup does recover visually (its own 5000 ms deadline
fires and it reports the failed-save path), but the off switch is inoperative
for the life of the worker, with no honest message distinguishing that from a
transient failure.

**Fix.** Reuse the existing helper — it already resolves `null` on the deadline,
which both `readPreference` and `activeTab` already treat as an unusable answer:

```js
function readPreference() {
  return bounded(new Promise((resolve) => { /* unchanged body */ }));
}
function writePreference(enabled) {
  // `null` on the deadline is falsy, which is exactly the `saved: false` the
  // popup already reports honestly.
  return bounded(new Promise((resolve) => { /* unchanged body */ })).then(Boolean);
}
```

and wrap `chrome.tabs.query` in `activeTab` the same way. Then add a
`failure-seam` mutant per site (unwrap each `bounded(...)`) driven by a
never-flushed `deferred` read, mirroring `worker-status-unbounded`. Correct the
comment at `:14-19` to name what is and is not bounded.

### WR-03: The deadline-ordering test asserts a strictly weaker property than the one its own comment names

**Severity:** WARNING
**File:** `test/extension/popup-recovery.test.js:277-286` (with `extension/popup.js:16-25`)

**Evidence.** The test body is one comparison of two parsed constants:

```js
expect(bound()).toBeGreaterThan(workerBound());   // 5000 > 2000
```

Its comment asserts the safety property: *"a popup deadline at or below the
worker's would cut off the worker's honest answer just before it arrived."* That
property requires `popupBound > worst-case worker answer latency`, and the
worker's answer latency is **not** bounded by `REQUEST_TIMEOUT_MS`. Two
measurable reasons: the three unbounded awaits in WR-02, and the serialized
queue — `failure-seam.test.js:115-132` itself measures two chained `set-enabled`
requests against a silent frame and only asserts `elapsed < bound() * 4`
(i.e. under 8000 ms), which is already past the popup's 5000 ms deadline.

So a future edit that raises the worker's deadline to 4900 ms would keep this
test green while destroying the property it is named for, and an edit that adds
a second serialized await would destroy it without touching either constant.
This is the same failure class the prior review's WR-01 identified: a named
guardian test that cannot construct the hazard it names.

**Fix.** Replace the constant comparison with a behavioural bound. Drive the
whole worker (not a `fakeWorker`) against a silent top frame and assert that the
popup receives a legible reply — `expect(box.disabled).toBe(false)` and
`expect(lastConfirmed)`-equivalent — rather than the timeout path. Keep the
constant comparison as a cheap secondary assertion, but stop describing it as
the enforcement of the ordering.

### WR-04: The mutation gate cannot distinguish "the suite refused the mutant" from "the suite never ran"

**Severity:** WARNING
**File:** `scripts/verify-mutation-kills.js:116-134,151-175`

**Evidence.** `runMutant` returns `{ killed: result.status !== 0 }`. I verified
that `node node_modules/vitest/vitest.mjs run --config vitest.config.js
test/extension/does-not-exist.test.js` **exits 1**. Therefore a registry entry
naming a suite path that does not exist — a typo, or a suite renamed in a later
phase — reports its mutant as `killed`. The same is true of any mutant whose
`replace` produces unparseable JavaScript, of a `node_modules` symlink that goes
stale, and of a `spawnSync` that fails outright (`result.status` is `null`,
which `!== 0`).

The gate has an excellent guard against a stale `find` literal
(`assertFindCounts`, and I confirmed all 25 currently match) but **no baseline
run**: nothing ever establishes that the named suites pass *unmutated* inside
the throwaway copy. A copy that is broken for any reason reports
`MUTATION KILLS: 25/25 killed` and exits 0. Given that this script exists
specifically to make "the mutant is dead" checkable rather than trusted, the
inverse claim being uncheckable is the defect that matters most in it.

Today's 25/25 is genuine — I confirmed every suite path exists and every find
count matches before running it — but the gate cannot tell you that next time.

**Fix.** Two cheap additions:

```js
// 1. Refuse a registry entry whose suites are not on disk, alongside the
//    find-count check, before anything runs.
for (const suite of entry.suites) {
  requireValue(existsSync(join(REPOSITORY_ROOT, suite)), 'mutant-suite-missing', `${entry.id} ${suite}`);
}

// 2. Prove the copy is green before trusting a red. Once per run, over the
//    union of every selected entry's suites.
const baseline = spawnSync(process.execPath, [...], { cwd: buildCopy(), ... });
requireValue(baseline.status === 0, 'baseline-not-green');
```

Optionally also treat `result.signal !== null` / `result.error` as
`gate-error` rather than `killed`, so a timeout is reported as its own outcome.

### WR-05: The only thing keeping the mutant registry honest is never run by `npm test`

**Severity:** WARNING
**Files:** `package.json:10-13`, `scripts/verify-mutation-kills.js:89-102`

**Evidence.** `npm test` runs `test:recon` only. `test:mutants` is a separate,
opt-in script, and `grep -rn "mutants" test/ vitest.config.js` finds no test
that reads `test/mutants/*.json` at all. So `assertFindCounts` — the mechanism
that catches a `find` literal going stale, which the file's own header calls
"the exact class of defect this gate exists to catch" — executes only when
somebody remembers to type the command.

The realistic failure is not malice, it is the project's own maintenance
pattern: `CLAUDE.md` describes "Zendesk broke a selector, fix it today". One
such edit to `background.js` silently invalidates the `find` literals of up to
fourteen mutants, and nothing in the green CI run says so. The registry then
documents guards that are no longer being checked.

**Fix.** Add a cheap Vitest file (a few hundred milliseconds, no mutants run)
that loads every `test/mutants/*.json`, validates the schema, and asserts each
`find` occurs exactly `count` times in its `file` and each `suites` entry
exists. Export `loadRegistry`/`assertFindCounts` from the script so the test
uses the shipped implementation rather than a second copy. Leave the expensive
`test:mutants` opt-in.

### WR-06: The JS/CSS language-agreement guard is only as good as happy-dom's selector engine, which the test itself records as already diverging

**Severity:** WARNING
**File:** `test/extension/runtime-contract.test.js:298-344`

**Evidence.** `cssAcceptsShell` decides whether the stylesheet accepts a shell
by asking **happy-dom** to evaluate `html[lang|="en" i] …`. The test's own
comment at `:340-343` records that happy-dom's `|=` matches a right-padded value
where Chrome does not, and excludes `'en '` from the agreement assertion for
that reason. So the guard added specifically to prevent JS/CSS drift is measured
against a matcher that has already been shown to disagree with the target
browser once, in the very predicate under test.

A second, smaller point in the same area: in HTML documents `lang` is one of the
attributes whose *value* is matched ASCII case-insensitively by default, so the
` i` flag in `html[lang|="en" i]` is redundant in Chrome. The `EN` and `EN-gb`
rows therefore pass whether or not the flag is present, and nothing in the suite
would notice its removal.

**Fix.** Do not rely on the double for the encoding half. Assert the shipped
CSS text directly — every rule's selector must begin with the exact string
`html[lang|="en" i] `, checked with string equality across all four rules — so a
hand-edit to the selector head fails on the bytes rather than on happy-dom's
opinion of them. Keep `cssAcceptsShell` as the semantic cross-check, and move
the real browser confirmation of a regional shell into the
`english-regional-locale` live-acceptance slot (which 04-11 has already created)
or a Playwright check.

---

## Info

### IN-01: `serializePreference`'s rejection handler is unreachable

**File:** `extension/background.js:127-131` — `preferenceQueue.then(task, task)` supplies `task` as both handlers, but `preferenceQueue` is only ever reassigned to `run.then(() => {}, () => {})`, which can never reject. The second `task` is dead. Harmless, but it reads as a deliberate guard against something that cannot happen. Either drop it or note why it is defensive.

### IN-02: The acceptance record's declared scope now contradicts a check it is required to carry

**File:** `test/extension/phase-04-live-acceptance.test.js:46,209-212` — `SCOPE` pins `html_lang: 'en'` and the validator enforces whole-object equality on it, while the new `english-regional-locale` check must carry a `language_context` that is English but explicitly **not** `en`. The record therefore declares an environment its own required observation is defined to contradict. Not a validator bug (scope describes the primary walkthrough environment), but the scope object no longer describes the full set of shells the record must evidence. Consider adding `html_lang_variants` or widening `scope.html_lang` to a list.

### IN-03: `refresh()` has no in-flight guard; only the markup keeps the two request paths apart

**File:** `extension/popup.js:147-161,196-201` — the `change` listener guards on `outstanding`, which `refresh()` never sets. The only thing preventing an overlapping `set-enabled` during the opening `refresh()` (now up to 5000 ms) is that `popup.html:16` ships the checkbox with the `disabled` attribute. That is load-bearing markup with no assertion tying it to the invariant it protects. Add `expect(control(popup.document).disabled).toBe(true)` immediately after `loadPopup` in one suite, or set `outstanding` around `refresh()`.

### IN-04: The `i` flag in the tint selectors is redundant

**File:** `extension/zhroma.css:1,8,15,22` — `lang` is on HTML's ASCII-case-insensitive attribute-value list, so `[lang|="en"]` already matches `EN` and `EN-gb` in an HTML document. Keeping the flag is correct and defensive (it also holds in XML contexts), but no test can show it is doing work, so do not treat it as a guarded property.

### IN-05: The project's prescribed type-safety mechanism is still absent, in a pass that touched `package.json`

**Files:** `extension/*.js`, `package.json:14-17` — still no `// @ts-check`, no JSDoc annotations, and no `typescript`/`@types/chrome` devDependency, though `CLAUDE.md` specifies "JavaScript files with JSDoc types, checked by `tsc --noEmit --checkJs`" as the stack's answer and marks it "Always". Carried forward from the prior review's IN-06; noted again only because `package.json` was in scope this pass and would have been the place to add it. Costs no build step and no shipped bytes.

---

_Reviewed: 2026-09-10_
_Reviewer: Claude (gsd-code-reviewer) — independent of the implementing agents_
_Depth: standard, plus an independent 25/25 run of `npm run test:mutants` and five out-of-tree behavioural probes_
_No file in the repository was modified by this review (`git status --short` unchanged)._
