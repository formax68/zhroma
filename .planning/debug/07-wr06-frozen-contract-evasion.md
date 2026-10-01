---
status: diagnosed
trigger: "UAT gap G-07-4b (Phase 07 test 4, WR-06): test/extension/frozen-contract.test.js catches evasive network calls (fetch.call, Reflect.apply, bracket access, aliasing), quoted scheme-relative URLs and aliased or destructured chrome.storage sync access, each proven by a negative control"
created: 2026-10-01T17:30:00Z
updated: 2026-10-01T18:05:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

bug_class: Bohrbug (deterministic, latent guard weakness - every evasive string reproduces 100% against the frozen regexes)
hypothesis: CONFIRMED - NETWORK_CALL (L69) requires `name\s*(` or `new name`, REMOTE_REFERENCE (L71) requires an explicit `https?|wss?` scheme, and SYNC_AREA (L95) requires the literal `storage` token immediately followed by `.sync` / `?.sync` / `['sync']`; any indirection between the name and the call, a scheme-less URL, or a rebinding of `chrome.storage` passes all three
test: done - $TMPDIR/wr06/repro.mjs (verbatim L69-71, L95 regexes against evasion corpus); $TMPDIR/wr06/fp*.mjs, sim*.mjs (false-positive scan of every shipped js/html/css with raw, naive-stripped and lexer-stripped source)
expecting: n/a
next_action: return ROOT CAUSE FOUND to orchestrator (goal find_root_cause_only); plan-phase --gaps owns the fix
reasoning_checkpoint:
  hypothesis: "The frozen contract misses WR-06 evasions because its three patterns encode syntax shapes (call-adjacency, explicit scheme, storage-dot-sync adjacency) rather than the presence of the banned identifier / any protocol-relative URL / the sync member name"
  confirming_evidence:
    - "repro.mjs: fetch.call, fetch.apply, Reflect.apply(fetch), window['fetch'], const f = fetch, fetch?.(), fetch`u`, (0, fetch)(u), Reflect.construct(WebSocket), new WebTransport, new RTCPeerConnection all EVADE NETWORK_CALL"
    - "repro.mjs: '//t.example/p.gif' in every quoting form, unquoted src=//, url(//...), srcset all EVADE REMOTE_REFERENCE"
    - "repro.mjs: const { sync } = chrome.storage; const s = chrome.storage; s.sync; Reflect.get(chrome.storage,'sync'); chrome['storage'].sync; storage: st alias all EVADE SYNC_AREA"
  falsification_test: "If any of those strings matched the verbatim regexes, the hypothesis would be wrong - none did"
  fix_rationale: "n/a (diagnose only) - direction: additive identifier-level rules on comment-stripped script source plus a context-anchored protocol-relative rule on raw source"
  blind_spots: "Concatenation/escape obfuscation ('fe'+'tch', '\\u0074') is unreachable by any regex guard; dynamic URLs built from page data are out of reach of a static guard"
  candidate_causes:
    - "code: pattern shapes in frozen-contract.test.js L69-71, L95 (confirmed)"
    - "config/process: 07-01-PLAN spec explicitly asked for 'Match calls, not words, so prose comments do not trip the check' - the weakness is specified, not an implementation slip (confirmed)"
    - "data: shipped extension/ actually contains an evasion (ruled out - zero hits)"
  and_gate: "yes - the gap exists because (a) the spec chose call-shaped matching to avoid comment false positives AND (b) no comment-stripping step existed, so the only way to keep content.js:227 / background.js:438 prose green was to match syntax shape"

## Symptoms

expected: The frozen contract (07-01, COMPAT-03, D-01, D-26, D-27) permanently guards "no network, no remote code, no sync storage" for everything under extension/. Its header says later phases never edit it, so its patterns must be tight before Phase 7 closes.
actual: Code review WR-06 reports the patterns at frozen-contract.test.js L69-71 and L95 match call syntax only - `fetch.call(null,u)`, `Reflect.apply(fetch,...)`, `window['fetch'](u)`, `const f = fetch; f(u)` evade NETWORK_CALL; a scheme-relative `'//t.example/p.gif'` evades REMOTE_REFERENCE; `const { sync } = chrome.storage` and `const s = chrome.storage; s.sync` evade SYNC_AREA. User chose "A - fix both now" in UAT test 4.
errors: None reported. Shipped code contains none of these evasions today; latent guard weakness.
reproduction: UAT test 4 (07-UAT.md); WR-06 in 07-REVIEW.md
started: frozen file landed in 07-01; discovered in code review, confirmed for fixing during UAT 2026-10-01

## Eliminated

- hypothesis: shipped extension/ already contains one of the evasions (an active, not latent, violation)
  evidence: fp.mjs/sim.mjs/sim3.mjs over all 4 scripts, 2 pages, 1 stylesheet - zero non-comment hits for bare network identifiers, `\bsync\b`, quoted or unquoted protocol-relative `//host`; frozen suite 7/7 green on HEAD
  timestamp: 2026-10-01T17:50:00Z

## Evidence

- timestamp: 2026-10-01T17:35:00Z
  checked: test/extension/frozen-contract.test.js in full (173 lines, single commit 8e9373b, untouched since)
  found: Walker `discover()` (L25-31) recursively lists extension/; scripts = *.js, pages = *.html, stylesheets = *.css. NETWORK_CALL + REMOTE_CODE run on raw scripts+pages (L87-91); REMOTE_REFERENCE on raw scripts+pages+stylesheets (L92); SYNC_AREA on raw scripts+pages (L104); STYLE_LOAD on stylesheets and <style> blocks (L118-121); importScripts helper on scripts+pages. manifest.json is never pattern-scanned (it legitimately holds https://*.zendesk.com/agent/*). No comment stripping anywhere. L68 comment "Calls, not words" states the design choice. Existing controls: 10 NETWORK_CALL positives, 4 REMOTE_CODE, 4 REMOTE_REFERENCE, 6 SYNC_AREA, 1 prose negative for NETWORK_CALL/REMOTE_CODE, 1 local negative for SYNC_AREA.
  implication: Every guarded promise is enforced by shape regexes over raw text.

- timestamp: 2026-10-01T17:38:00Z
  checked: $TMPDIR/wr06/repro.mjs - verbatim copies of L69-71 and L95 against an evasion corpus
  found: NETWORK_CALL EVADES fetch.call, fetch.apply, Reflect.apply(fetch,...), window['fetch'](u), globalThis["fetch"](u), const f = fetch; f(u), { fetch: f } = globalThis, fetch.bind, navigator.sendBeacon.call, Reflect.construct(WebSocket), const X = XMLHttpRequest; new X(), new WebTransport, new RTCPeerConnection, fetch`u`, (0, fetch)(u), fetch?.(u). (Only `new globalThis.WebSocket(u)` is caught.) REMOTE_REFERENCE EVADES '//t.example/p.gif' in ', ", ` quoting, <img src="//...">, <img src=//...>, url(//...), @import '//...'. SYNC_AREA EVADES const { sync } = chrome.storage, const s = chrome.storage; s.sync, { ['sync']: a }, Reflect.get(chrome.storage,"sync"), { storage: st } = chrome; st.sync, chrome['storage'].sync, chrome.storage /* c */ .sync. Bonus: REMOTE_CODE EVADES window['eval'], (0, eval), Function("..") without new, eval?.(), setTimeout('code').
  implication: All WR-06 claims reproduce; root cause is the shape-based patterns.

- timestamp: 2026-10-01T17:42:00Z
  checked: reviewer's proposed patterns against RAW shipped files (fp.mjs)
  found: Bare `\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|WebTransport|RTCPeerConnection)\b` hits content.js:227 comment "the worker must fetch a fresh". Bare `\bsync\b` hits background.js:438 comment "sync, session or managed". `['"\`]\/\/[^/\s]` has zero hits in any js/html/css (manifest.json:18 only matches the unquoted-context `\/\/[^/\s]`, and manifest is not scanned). `\bsync\b` does not hit syncController/syncs/synchronously/async (word boundary).
  implication: Comment stripping is REQUIRED for the identifier rules (two real hits, both in comments); NOT required for the protocol-relative rule. content.js and background.js are shipped bytes (D-07 parity, release digests) so rewording those comments is not an option.

- timestamp: 2026-10-01T17:46:00Z
  checked: naive comment stripper `/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g` vs a string/template/regex-aware lexer ($TMPDIR/wr06/lex.mjs, round-trips all 4 scripts byte-exactly)
  found: On today's 4 scripts the two strippers give identical code text (no `//` or `/*` inside any string, template or regex literal; regex literals are only /_/g and /^[a-z][A-Za-z0-9]{0,31}$/; no template ${} contains a backtick; no regex contains a quote). BUT (a) the naive stripper deletes `'//t.example/p.gif'` (treats it as a line comment) so a protocol-relative check run on stripped text catches NOTHING (8/8 evade); (b) naive stripper lets `'/*'; fetch(u); '*/'` evade. A string-first alternation `('..'|"..")|(\`..\`)|/*..*/|//..` closes both; it differs from the lexer only on one JSDoc cast comment inside a template ${} (zhroma-settings.js:245, `/** @type {number} */`), which it leaves in place - fail-closed, harmless today.
  implication: The stripper must be string-aware, and the protocol-relative rule must run on raw source.

- timestamp: 2026-10-01T17:50:00Z
  checked: candidate design sim3.mjs - string-aware stripper that blanks ''/"" contents unless the whole literal is a banned name, keeps template literals whole; NET = bare identifiers (+fetchLater), SYNC = \bsync\b
  found: Catches fetch.call, Reflect.apply(fetch), window['fetch'], globalThis["fetch"], const f = fetch, '/*' trick, '//' trick, `${fetch(u)}`, fetchLater, const { sync } = chrome.storage, s.sync, { ['sync']: a }, Reflect.get(...,"sync"). Clean on: comment prose, 'Settings never sync to other devices', 'We do not fetch anything', syncController(), async. Zero hits on all 4 shipped scripts.
  implication: A false-positive-resistant design exists that needs no shipped-byte change. Residual fail-closed risk: prose inside template literals (zhroma-settings.js has 35 template tokens, e.g. refuse(`${name}: ...`) messages) is scanned whole - none contains a banned word today.

- timestamp: 2026-10-01T17:52:00Z
  checked: protocol-relative candidates (sim2.mjs) on evasions and raw shipped files
  found: Reviewer's `['"\`]\/\/[^/\s]` misses unquoted `src=//t.example`, `'url(//t.example/p.gif)'` (quote precedes url( not //), style="background:url(//...)", srcset "a.png 1x, //t/b.png". Context-anchored `[\`'"(=,]\s*\/\/[^\s/]` catches all 9 forms incl. @import '//...', passes `// a comment`, `/* block */`, `a / b / c`, `/\/\//u`, `'a//'`, and has zero hits on all 7 shipped js/html/css files. Context-free `\/\/[^\s/]` also has zero hits today but false-positives on regex literals like /\/\//.test(x) and `'a//'`.
  implication: `[\`'"(=,]\s*\/\/[^\s/]` on raw scripts+pages+stylesheets is the tighter, FP-safe choice.

- timestamp: 2026-10-01T17:55:00Z
  checked: CSS/HTML coverage (style.mjs)
  found: CSS url(//...) and @import '//...' already caught by STYLE_LOAD (bans all url( / @import in .css and <style> blocks). NOT covered: `image-set("p.png" 1x)` / `-webkit-image-set("//t/p.png" 1x)` (CSS image-set accepts bare strings as image URLs) evade STYLE_LOAD; page `style="...url(//...)"` attributes are not style blocks, so STYLE_LOAD never sees them and REMOTE_REFERENCE misses the scheme-less form. HTML src="//..." is caught only by a new protocol-relative rule. Pages: no inline <script> body, no on*= handler, no HTML comment today; popup.html <style> has one CSS comment.
  implication: Same-class gap beyond WR-06's list - STYLE_LOAD should also ban image-set( and page style attributes should be checked; flag to planner as optional same-commit tightening (frozen file is permanent).

- timestamp: 2026-10-01T17:58:00Z
  checked: constraints - 07-CONTEXT D-06/D-25/D-26/D-27/D-31; frozen header; 07-01-PLAN; runtime-contract.test.js; mutants; scripts; vitest/tsconfig
  found: D-06 contract-test changes in their own commit, never with feature code; D-25 an existing-test assertion changes only in its own commit with a written reason; D-26 lists the frozen invariants (no network APIs, no chrome.storage.sync, ...); D-27 literally says "Shipped code contains no fetch, XMLHttpRequest, WebSocket, EventSource or sendBeacon" (supports identifier-level ban); D-31 one repair round. Frozen header: widening needs a user decision; tightening approved in UAT test 4 (A). No code/test/script pins frozen-contract.test.js by hash or commit (grep of scripts/, test/, release/, package.json, vitest.config.js: only a prose mention in runtime-contract.test.js:63). No mutant suite includes frozen-contract.test.js (so its test names are not mutant-load-bearing). tsc does not check test files. runtime-contract.test.js holds CHROME_API_ALLOWLIST (would flag a bare `chrome.storage` alias, but is restatable) and content.js/zhroma-settings.js call-shaped bans at L298/L311 - none need to change. 07-VERIFICATION.md truth 3 and STATE.md say the frozen file "has not been touched since 8e9373b" - those records will need refreshing after the fix.
  implication: Fix = one test-only commit touching only test/extension/frozen-contract.test.js, separate from the WR-01 commit, with a Why body; extension/ and runtime-contract.test.js untouched.

## Resolution

root_cause: "test/extension/frozen-contract.test.js encodes its no-network / no-remote-reference / no-sync guarantees as syntax-shape regexes over raw text - NETWORK_CALL (L69) needs the API name directly followed by `(` or preceded by `new`; REMOTE_REFERENCE (L71) needs an explicit `http(s)://` or `ws(s)://` scheme; SYNC_AREA (L95) needs the literal token `storage` directly followed by `.sync`/`?.sync`/`['sync']`. This shape-matching was the 07-01 plan's deliberate choice ('Match calls, not words, so prose comments do not trip the check') because no comment-stripping step existed; with prose comments such as content.js:227 'must fetch a fresh' and background.js:438 'sync, session or managed', a name-level ban would have failed on day one. Any indirection (fetch.call/apply/bind, Reflect.apply/construct, bracket access, aliasing, optional/tagged call), any scheme-less //host URL, and any rebinding/destructuring of chrome.storage therefore passes, permanently, because the file is frozen."
fix:
verification:
files_changed: []
