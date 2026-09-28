---
phase: 06-live-dom-recon-2
reviewed: 2026-09-28T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - SELECTORS.md
  - scripts/fixture-contract.js
  - scripts/rule-column-contract.js
  - scripts/sanitize-fixture.js
  - scripts/verify-recon-gate.js
  - test/fixtures/manifest.json
  - test/fixtures/zendesk-rules-dark-table.html
  - test/fixtures/zendesk-rules-identity-region.html
  - test/fixtures/zendesk-rules-light-table.html
  - test/recon/recon2-corpus.test.js
  - test/recon/recon2-gate.smoke.js
  - test/recon/rule-column-sanitizer.test.js
findings:
  critical: 1
  warning: 5
  info: 7
  total: 13
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-09-28T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the Phase 6 diff since `3ad571d^`: the rule-columns sanitiser grammar (`scripts/rule-column-contract.js`), its wiring into `scripts/sanitize-fixture.js`, the `recon2Fixtures` admission path in `scripts/fixture-contract.js`, the Recon 2 ledger gate and `recon2` CLI mode in `scripts/verify-recon-gate.js`, the Recon 2 ledger block in `SELECTORS.md`, the manifest entries, the three admitted fixtures, and the three new test files.

**Privacy check on the fixtures (done by parsing, contents not reproduced here).** Every text node and every textual attribute value in the three fixtures is one of these: a `KIND-NNN` token, a reserved `PERSON-SELF` token, a header label from the vocabulary, a standard Status or Type value, a Priority label, or the `Ticket` placeholder. Every `datetime` is the synthetic literal. Once tokens, the synthetic datetime and `tabindex` values are stripped out, no digits remain. There are no `zendesk`, `http(s):`, `@` or `.com` strings. Every `data-test-id` and `data-garden-id` value is a generic Garden or Zendesk component identifier. I found no real names, emails, hostnames, tenant strings, URLs or ids. The identity-region fixture holds only structural markup plus `alt="PERSON-SELF"`. `node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json` prints `RECON 2 VERDICT: proceed`.

**Key concern.** The committed fixtures are clean, but the grammar that is supposed to guarantee this for every future capture has a verified hole. The tokeniser and the validator both walk `childNodes`, which never enters `<template>` content, and `outerHTML` then writes that content out verbatim. A capture containing a `<template>` therefore gets through both sanitisation and admission with its tenant text and attributes untouched. Several lesser gaps also weaken the privacy guarantee. They are listed below.

## Critical Issues

### CR-01: `<template>` content bypasses tokenisation, attribute grammar and the validator

**File:** `scripts/rule-column-contract.js:389-404` (tokeniser `visit`), `scripts/rule-column-contract.js:482-492` (validator `visit`), `scripts/rule-column-contract.js:199-201` (identity element count and landmark check)
**Issue:** Both traversals go through `element.childNodes`. For an HTML `<template>`, the children sit in `template.content` (a DocumentFragment), so `childNodes` is empty. `capture.root.outerHTML` still writes the template content out. `root.querySelectorAll('*')` also skips template content, so neither the identity-region 40-element cap nor the `IDENTITY_FORBIDDEN` landmark check can see those elements. `assertSafeToParse` does not forbid `template` either.

I confirmed this against the real module. A ticket cell `PERSON-001<template><span>Secret Tenant Name</span></template>` goes through `parseRuleColumnCapture`, then `tokeniseRuleColumns`, then `validateRuleColumnOutput`. The output still contains `Secret Tenant Name` verbatim and the validator accepts it (`tokenKinds.PERSON: 1`). The only remaining barrier is the denylist substring scan, which only catches values the operator listed by hand. `validateRecon2Fixtures` uses the same validator, so the manifest would admit such a file. Any attribute inside the template (`class`, `id`, arbitrary `data-*`) also skips the attribute allowlist. Zendesk markup is React-rendered and can include templates or declarative shadow roots (`<template shadowrootmode>`), and the in-page projection serialises the live DOM. So this is a real way for ticket data to reach a committed file. The v1 path (`sanitizeTextAndComments` and `validateSanitizedOutput`) has the same blind spot, but only rule-columns mode is in this diff's scope.
**Fix:** Reject template elements outright in both modes before any traversal. Add a guard in the validator too, so an admitted file can never contain one:
```js
// sanitized-output-contract.js
export const FORBIDDEN_ELEMENT = /<\s*(?:script|iframe|frame|frameset|object|embed|base|form|style|link|meta|template)\b/iu;

// rule-column-contract.js, in parseRuleColumnCapture after parsing (defence in depth):
if (parsed.querySelector('template')) reject('forbidden-element');
```
Add a rejection-table test for `<template>` and `<template shadowrootmode="open">` in `test/recon/rule-column-sanitizer.test.js`.

## Warnings

### WR-01: Preserved-attribute values admit tenant-defined strings verbatim

**File:** `scripts/rule-column-contract.js:66-68`, `scripts/rule-column-contract.js:238-245`, `scripts/rule-column-contract.js:381-383`
**Issue:** `IDENTIFIER_VALUE = /^[a-z][a-z._-]*$/iu` only bans digits. Any letters-only `data-test-id` or `data-garden-id` gets through, including tenant-derived slugs such as custom-field keys, status or group slugs, or a `jane-doe` style id. The other preserved attributes (`role`, `type`, `lang`, `dir`, `scope`, `tabindex`, `colspan`, ...) have no value grammar at all. I confirmed that `<span data-test-id="acme-corp-vip-escalations" role="acme-secret">` passes both the tokeniser and `validateRuleColumnOutput` unchanged. The denylist does not reliably catch these: the agent's self form is a multi-word display name, and a hyphenated slug will not contain it as a substring.
**Fix:** Replace the digit-free regex with a closed allowlist of observed identifier values. `RULE_STRUCTURAL_WORDS` already lists most of them; extend it with the values that appear in the three admitted fixtures (`ticket-table-cells-*`, `status-badge-*`, `forms.*`, `navigation.profile-menu-button`, `avatars.*`, and so on). Constrain `role` to the WAI-ARIA role set, `type` to known input and button types, `dir` to `ltr|rtl|auto`, `lang` to a BCP-47 shape, and `tabindex`, `colspan` and `rowspan` to small integers. Unknown values should reject with `identifier-value-invalid`, not be kept.

### WR-02: Renaming the `Status` header key to `Ticket status` drops the plain `Status` header

**File:** `scripts/rule-column-contract.js:31`
**Issue:** Commit 78acfd4 replaced `Status: 'STATUS'` with `'Ticket status': 'STATUS'` rather than adding the new key. Tenants without custom ticket statuses (and views where Zendesk renders the column as `Status`) now classify that column as `FIELD`. Standard values such as `Open` and `Pending` are then tokenised as `FIELD-NNN` rather than kept. Nothing fails, so the regression is silent. A future capture from such a tenant would produce a fixture with no status vocabulary, which is exactly what Phase 9 rule tests need. The ledger (`SELECTORS.md:415`) records this as a rename based on one tenant.
**Fix:** Keep both labels:
```js
Status: 'STATUS',
'Ticket status': 'STATUS',
```
Add a test showing both headers keep standard status values.

### WR-03: The denylist collision guard forces operators to drop short name entries, weakening the scan

**File:** `scripts/sanitize-fixture.js:163-171`, `scripts/rule-column-contract.js:519-538`
**Issue:** `assertNoDenylistCollision` rejects any denylist entry that is a substring of a fixed list of vocabulary and structural words, whether or not the capture's output contains that word. Common short names and name fragments collide: `Tim` (time), `Pat` (path), `Ed` (hidden, selected, disabled), `Al` (label, tables.*), `Ria` or `Ari` (aria-*), `Bo` (tbody), `Tex` (text), `Rue` (true, via the aria enum values). The only way forward for the operator is to delete the entry, and then the post-sanitisation scan can no longer catch that name's residue. An agent whose display name is a short form (`identity-form: short` is an allowed ledger outcome) with `self-alt: Tim` cannot be admitted at all. The root cause is that the denylist scan runs over the full serialised markup (element names, attribute names, tokens), not over the tenant-derived values.
**Fix:** Scan the denylist against the values that could carry tenant data: every text node and every kept textual attribute value, after tokenisation. Keep the generic-pattern scan on the full markup. The collision guard can then be removed, or reduced to checking against `ruleVocabularyWords` only (the kept vocabulary really is emitted as values).

### WR-04: The Recon 2 ledger scan cannot detect names or tenant strings

**File:** `scripts/verify-recon-gate.js:709-710`, `scripts/verify-recon-gate.js:947-957`
**Issue:** The block scan uses only a synthetic denylist, so it catches emails, `*.zendesk.com` hosts, URLs, long numbers and opaque tokens, and nothing else. The Recon 2 block is hand-written prose about the agent's identity (`identity-location`, `identity-vs-assignee`) and about tenant custom statuses and custom field titles. If the agent's name, a requester name, a custom status name or a bare tenant subdomain were pasted into `evidence`, the gate would still print `RECON 2 VERDICT: proceed`. The committed text is currently clean, but only because of manual discipline, and the gate's success message implies more assurance than it gives.
**Fix:** Let `recon2` mode take an optional private denylist from outside the worktree, reusing `parseRuleDenylist` and the worktree-custody checks from `sanitize-fixture.js`, for example through `ZHROMA_RECON_DENYLIST=/private/path`. Pass it to `scanSensitiveContent`. Document that the pre-commit run must supply it.

### WR-05: No test runs the committed ledger through the Recon 2 gate, and one test now passes vacuously

**File:** `test/recon/recon2-gate.smoke.js:724-735`, `test/recon/recon2-gate.smoke.js:737-753`
**Issue:** The test "the real ledger rejects with recon-two-status-unresolved while any Recon 2 status is pending" returns early when no status is pending, which is the case now, so it asserts nothing. The "Phase 1 non-regression" test calls `insertBeforeAssumptions`, which first strips the real Recon 2 block (`withoutRecon2Block`) and replaces it with a synthetic one. So nothing in `npm test` checks that the committed `SELECTORS.md` Recon 2 block, together with the real `test/fixtures/manifest.json`, still returns `proceed`. An edit that breaks a structured field, or a manifest change that drops an admitted scenario, would pass CI and only surface when someone runs the CLI by hand.
**Fix:** Replace the vacuous test with a positive lock:
```js
test('the committed Recon 2 ledger and corpus pass the recon2 gate', async () => {
  const result = runGate(['recon2', REPOSITORY_LEDGER, join(REPOSITORY_ROOT, 'test', 'fixtures', 'manifest.json')]);
  assert.equal(result.stderr, '');
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'RECON 2 VERDICT: proceed\n');
});
```

## Info

### IN-01: The `Ticket` placeholder is kept verbatim in every ticket column, not only in Type

**File:** `scripts/rule-column-contract.js:299`
**Issue:** `if (sets.placeholders.has(value)) return { keep: value };` applies to every ticket column, so a Subject, Requester or custom-field value that is exactly `Ticket` is kept instead of tokenised. The recon only observed `Ticket` as the unset-Type rendering (`SELECTORS.md:409`). This makes the verbatim-kept surface wider than the evidence supports.
**Fix:** Scope placeholders per column kind, for example `placeholders: { TYPE: ['Ticket'] }`, and check `sets.placeholders.get(kind)?.has(value)`.

### IN-02: A duplicate or empty `self:` line reports `self-directive-required`

**File:** `scripts/sanitize-fixture.js:199-203`
**Issue:** A second `self:` line, or an empty `self:` value, rejects with `self-directive-required`. The matching `self-alt:` cases use `self-directive-invalid`. The code sends the operator in the wrong direction.
**Fix:** Use `reject('self-directive-invalid')` in the `self:` branch.

### IN-03: Helpers duplicated across three modules

**File:** `scripts/rule-column-contract.js:97-112` (`createInertParser`), `scripts/rule-column-contract.js:126-132` (`isTicketRow`), `scripts/rule-column-contract.js:71-73` (`RESOURCE_ATTRIBUTE_NAMES`)
**Issue:** The inert-parser settings, the ticket-row predicate and the resource-attribute list are copied from `sanitized-output-contract.js`, where they also exist as an inline array in `sanitize-fixture.js:257-258` and as a regex. A future hardening such as CR-01, or a new resource attribute, has to be made in every copy, and the copies can drift.
**Fix:** Export `createInertParser`, `isTicketRow` and a `RESOURCE_ATTRIBUTE_NAMES` constant from `sanitized-output-contract.js` and import them.

### IN-04: Several Recon 2 consistency checks only work in one direction

**File:** `scripts/verify-recon-gate.js:860`, `scripts/verify-recon-gate.js:875`, `scripts/verify-recon-gate.js:883-884`
**Issue:** A `not-observed` cell forces `status: not observed`, but `status: not observed` with every cell observed is accepted. `hover === 'no'` forces `not observed`, but not the reverse. `garden` in `hold` or `differ` combined with `root-terminus: not-observed` is accepted. None of these affects the current verdict, but the gate accepts contradictory ledgers.
**Fix:** Make these checks two-way where the facts decide the status, for example `recon2Consistent(cells.includes('not-observed') === (signal.status === 'not observed'))`, and require `terminus !== 'not-observed'` whenever `garden !== 'not-observed'`.

### IN-05: The identity-region landmark list omits menus, dialogs and sectioning roles

**File:** `scripts/rule-column-contract.js:76-80`
**Issue:** `IDENTITY_FORBIDDEN` does not include `[role="menu"]`, `[role="dialog"]`, `[role="main"]`, `[role="complementary"]`, `footer` or `section`. An open profile menu (name, plan or organisation text, links) of up to 40 elements would be accepted as an "identity region". Text is still tokenised, but the D-14(b) "smallest subtree" claim is not enforced.
**Fix:** Add `[role="menu"], [role="menuitem"], [role="dialog"], [role="main"], [role="complementary"], [role="contentinfo"], footer, section` to the forbidden list.

### IN-06: The Session Handoff fields are scanned but never validated

**File:** `scripts/verify-recon-gate.js:926-1008`, `SELECTORS.md:289-290`
**Issue:** The committed handoff records `recon-views-deleted: pending` and `private-inputs: awaiting-user-deletion`. The raw captures, which hold real ticket data and the agent's name, still exist outside the repo, yet the gate prints `proceed`. The gate never reads `session-state`, `restore`, `recon-views-deleted` or `private-inputs`, so it cannot tell a closed session apart from one where private inputs were left behind.
**Fix:** Either require terminal handoff values (`restore: complete`, `private-inputs: deleted|encrypted`) before `proceed`, or note explicitly in the verdict output that deletion of private inputs is outside the gate. In either case, finish the manual deletion before closing the phase.

### IN-07: A generic-pattern hit on an admitted recon2 fixture surfaces as `unexpected-error`

**File:** `scripts/fixture-contract.js:553`, `scripts/verify-recon-gate.js:1052-1055`
**Issue:** `validateRecon2Fixtures` lets `SensitiveFixtureError` propagate unwrapped. The CLI only maps `ReconGateError` and `FixtureContractError` codes, so a residue hit prints `RECON_GATE_REJECTED unexpected-error` instead of a stable code. This mirrors the v1 behaviour, but it hides the most important failure class behind a generic code.
**Fix:** Wrap the scan: `catch (error) { if (error instanceof SensitiveFixtureError) throw contractError('admitted-bytes-sensitive'); throw error; }`.

---

_Reviewed: 2026-09-28T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
