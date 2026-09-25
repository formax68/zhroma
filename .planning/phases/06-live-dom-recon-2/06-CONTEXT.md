# Phase 6: Live DOM Recon 2 - Context

**Gathered:** 2026-09-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 is a read-only live session on the user's Zendesk account, driven by the user. It records three things in `SELECTORS.md` and in sanitised fixtures:

1. How Zendesk signals Light, Dark and Match system, and what the page does when the agent switches mid-session (RECON-04).
2. Where the signed-in agent's name renders, and whether it equals the Assignee column text on their own tickets (RECON-05).
3. How the rule-relevant columns render: Assignee, Requester, Group, Status, Type, Subject, Tags, a date column and a custom field, including empty placeholders and hidden or `aria-label`-only text (RECON-06).

It also confirms that the v1 Garden table identifiers still hold in dark mode, and measures the dark surface, the text colours and the native hover, selection and focus states.

It builds no extension behaviour and changes nothing under `extension/`. Phases 8 (dark mode), 9 (rule semantics) and 10 (identity) consume its output. It is independent of Phase 7.

</domain>

<decisions>
## Implementation Decisions

The user asked for sensible defaults on every area ("sensible defaults are fine for the above"). The decisions below are Claude's recommended defaults, accepted by the user as a group. Phase 1's decisions D-01 to D-16 (`.planning/phases/01-dom-recon-spike/01-CONTEXT.md`) carry forward unless one below narrows them.

### Session and tenant setup
- **D-01:** Run one live session from a written run sheet the user can get through in one sitting (aim for about an hour). The order is:
  1. Preconditions.
  2. Light-mode column and identity capture.
  3. Dark-mode matrix and switch observation.
  4. Dark native states and the dark table capture.
  5. Restore the original settings.

  If the session is interrupted, a handoff record in `SELECTORS.md` (like Phase 1's "Authenticated Interaction Handoff") states exactly where to resume. This follows retrospective lesson 1: UAT that isn't sized for one sitting gets skipped.
- **D-02:** The session starts with three user-checked preconditions:
  - (a) Zendesk offers them Appearance (Light / Dark / Match system) on this tenant.
  - (b) They can create a personal, unshared view.
  - (c) At least one existing ticket already assigned to them will show in that view.

  If (a) fails, the dark-mode entries end as blocked and Phase 8 cannot start. No one changes admin settings on the operational tenant without a separate, explicit decision from the user. Recon never uses the OS `prefers-color-scheme` as a stand-in for a Zendesk signal. If (c) fails, stop and ask the user. A ticket is never reassigned, created or edited to make one.
- **D-03:** The user performs every click, menu opening, settings change (Zendesk appearance, OS appearance, Zhroma's switch), view creation and deletion, hover, row selection and Tab press. Claude only runs read-only JavaScript evaluations in the user's own logged-in Chrome tab, through Claude in Chrome. If that isn't connected, Claude hands the user probes to paste into DevTools. Claude never clicks, types, sends keys or navigates in the Zendesk tab (see Phase 1's Execution Safety Note in `SELECTORS.md`). Temporary page-local markers (`data-zhroma-probe`) and temporary observers are allowed. They are removed at the end or vanish on reload.
- **D-04:** Probe return values enter the conversation transcript, so a probe may return only:
  - structure: tag names, `data-garden-id` / `data-test-id` values, attribute *names*, counts and booleans;
  - computed colours and style values, and difference kinds;
  - Zendesk's own UI vocabulary from an explicit allowlist (see D-09).

  A probe never returns names, emails, subjects, tag values, group names, custom-field values, hostnames, ticket or view ids, or URLs. No screenshots of the live page go through the tool, because they carry ticket content. If a visual fact truly needs an image, the user takes and crops it (Phase 1 D-14).
- **D-05:** Raw DOM for fixtures never passes through the transcript:
  - Claude marks the target element.
  - The user copies its outerHTML in DevTools into a file at a private path outside the repository, and writes the private denylist next to it. The denylist includes their display name.
  - Claude runs `scripts/sanitize-fixture.js` on those paths without printing or persisting them.
  - Raw captures and the denylist are deleted after admission, unless the user keeps them encrypted (Phase 1 D-03).
- **D-06:** A dedicated personal recon view holds Priority plus the nine rule columns. If Zendesk's column limit rules out a single view, split it into two views that both keep Priority and Assignee. Choose view conditions so the rows include:
  - a ticket assigned to the user;
  - tickets assigned to others;
  - an unassigned ticket;
  - an empty value in other columns, where the tenant has one.

  The user creates and later deletes the view. No operational view is touched (Phase 1 D-08).
- **D-07:** Pick columns from what the tenant has:
  - **Date column:** if possible, one that Zendesk renders as relative time (for example "Updated"). The ledger records whether an absolute timestamp is also present in a `title` or `<time datetime>`.
  - **Custom field:** a dropdown. If the tenant also has a checkbox field, capture that too, because checkbox cells are the most likely to be icon-only or `aria-label`-only.

### Identity
- **D-08:** The identity probe looks first at the top-bar avatar (`img alt`, button `aria-label` / `title`), then inside the profile menu once the user opens it. It records:
  - which element and which attribute or text node carries the name;
  - whether the name is present at page load without opening anything, or appears only later or lazily;
  - whether it is a full name or a short form, recorded as a category and never as the value.

  How the Assignee cell renders a name is recorded too: text, avatar with `aria-label` / `title`, or both.
- **D-09 (identity comparison):** The comparison happens inside the page. The probe normalises both strings (NFC, collapse whitespace, trim). It returns only `equal: true/false` plus one difference kind from a fixed set: identical, case-only, whitespace-only, one is a prefix of the other, different, not comparable. The raw strings never leave the page (SC 2).

### What the sanitiser keeps
- **D-10:** The v1 sanitiser policy stays exactly as it is. The three admitted fixtures, their checksums and their byte-identical round-trip tests do not change. The rule-column policy is a separate, explicitly selected mode of the same sanitiser. It uses the same sensitive scan and the same fail-closed rejection. It is not a change to the default. — **Reversibility:** costly — changing the default instead would force re-admission of the v1 corpus and touch the Phase 1 gate, the manifest checksums and every round-trip test.
- **D-11:** In rule-column mode, the following text is kept verbatim. Matching uses exact trimmed text, only in the header or cell where the text belongs:
  - standard Zendesk header labels as rendered: Priority, Assignee, Requester, Group, Status, Type, Subject, Tags, and the chosen date column's label;
  - standard Status values (New, Open, Pending, On-hold, Solved, Closed);
  - standard Type values (Question, Incident, Problem, Task);
  - Priority values, as in v1;
  - empty placeholders.

  Placeholders such as "-" or "Unassigned" join the allowlist only after the session shows them, with a ledger note. The exact spelling and casing come from what the session shows, not from this list.

  Everything else is tokenised, including custom ticket-status names and the custom field's header label, because tenants define both.
- **D-12:** Tenant-specific text is tokenised by kind and by value. That covers people, groups, subjects, tags, custom-field values and dates. The same original string gets the same token everywhere in one capture set, so equal cells stay equal and equality and "is any of" tests stay meaningful.

  The agent's own name maps to one reserved token everywhere it appears: the identity region, the Assignee cells, and any `aria-label`, `title` or `alt` that repeats it. The name-to-token mapping lives only in the private denylist (SC 3).
- **D-13:** Element shape is kept and values are not. The sanitiser keeps avatars, `<time>` elements, badges, tag chips, hidden spans, truncation wrappers and `aria-label`-only cells.

  The v1 policy drops `title`, `alt` and `datetime`. When they carry rule-relevant text, this mode keeps them with a tokenised value instead, so a test can see where the text lives. Dates become fixed synthetic values of the same format class (relative or absolute), and the ledger records that class. URL and resource attributes are still removed.
- **D-14:** Three new fixtures are admitted, each with a manifest entry in `test/fixtures/manifest.json` (Phase 1 D-12). An entry holds the scenario, capture date, non-identifying shell metadata, boundary, sanitiser mode and checksum:
  - (a) The light-mode multi-column table, using the v1 boundary: the nearest complete table container.
  - (b) The identity region: the smallest subtree that contains the rendered name, such as the avatar button with its label. Never the whole top bar or navigation. If the name renders only in the opened profile menu, the capture comes from there.
  - (c) The dark-mode table, using the v1 table boundary.

### Dark-mode matrix and switch
- **D-15:** Zhroma 0.1.0 is switched off with its popup switch for the whole session, and the ledger records that it was off. Its `!important` cell tints would otherwise contaminate colour readings.
- **D-16:** The session observes all six cells: Zendesk Light, Dark and Match system, each with the OS set explicitly to light and to dark, never "auto". The cells where Zendesk and the OS disagree, plus the Match-system cells, are the ones DARK-01 depends on. The other two cost one toggle each.

  Each cell records:
  - `color-scheme` on `html`, both computed and from any `meta[name=color-scheme]`;
  - attribute names and mode-like class tokens on `html` and `body`;
  - the `matchMedia('(prefers-color-scheme: dark)')` result;
  - computed colours of the pane background, the header-cell background and text, and a ticket cell's text.

  It never reads a colour Zhroma could paint. The `dark-mode-signal` entry names which branch of ARCHITECTURE §4's decision tree holds: a document marker, surface luminance only, or neither.
- **D-17:** Before each switch, a temporary page-local recorder is installed. It has:
  - a `MutationObserver` on `html`, `head`, `body` and the table (attributes and childList);
  - a window sentinel to detect a reload;
  - a marker on the table to detect a re-mount;
  - a before/after count of stylesheet rules, because styled-components inserts rules through the CSSOM and that produces no mutation records.

  Three switches are observed: Light→Dark and Dark→Light in Zendesk's settings, and an OS toggle while Match system is set. Only counts and element kinds are recorded.
- **D-18:** Dark native states re-run Phase 1's `interaction-and-sticky-states` probe in dark mode, on a hovered row, a selected row (selected with its checkbox), a normal row and the sticky header. For keyboard focus, the user presses Tab only, never Enter or Space, which can open a ticket, until focus lands in the table. Claude then reads the focused element's computed outline and box-shadow. If focus can't be observed safely, the entry ends as not observed, with a named fallback for Phase 8, and does not block the phase.
- **D-19:** `dark-table-topology` re-runs the v1 `stable-identifiers` and `root-chain` checks in dark mode. If the Garden identifiers differ in dark, that blocks Phase 8. It is reported, not worked around.
- **D-20:** At the end of the session, the user restores their original Zendesk appearance, OS appearance and Zhroma switch state, then deletes the recon view(s). The handoff records the restore.

### How heavy the evidence is
- **D-21:** Evidence stays light and proportionate. The phase reuses what already exists: the Phase 1 D-13 ledger entry shape, the sanitiser and its sensitive scan, the manifest with checksums, and the round-trip tests. It adds only:
  - the rule-column sanitiser mode, with its own tests;
  - manifest entries for the three new fixtures;
  - the new ledger ids, registered so the phase cannot close while any of them is missing or unresolved.

  The new ids are `dark-mode-signal`, `dark-mode-switch-mutation`, `dark-native-states`, `dark-table-topology`, `identity-location`, `identity-vs-assignee`, `referenced-cell-representation` and `header-label-uniqueness`. Recon 2 gets its own verdict section in `SELECTORS.md`. The Phase 1 Final Verdict is left untouched.

  The phase adds no new mutant registries, no pinned-blob acceptance binding (fixtures are not shipped bytes) and no re-admission ceremony. This follows retrospective lesson 5: the evidence apparatus outgrew the product.
- **D-22:** Phase 6 changes no shipped bytes. Nothing under `extension/` changes, so no v1 human check reopens and Phase 7's parity harness is unaffected. Phase 6 stays within `scripts/`, `test/recon/`, `test/fixtures/` and `SELECTORS.md`.
- **D-23:** Review and repair is capped at one round (retrospective lesson 2). Leftover findings that don't block go to the backlog or `.planning/WINDOWS.md`, not to a second gap-closure plan.
- **D-24:** Every new entry ends with a terminal status. Where a fact could not be observed, the entry names a fallback for the consuming phase. Only two outcomes block downstream work:
  - dark mode is not offered on the tenant;
  - the v1 Garden identifiers do not hold in dark mode.

  Everything else ends with a fallback. For example, if no name is found anywhere, Phase 10 relies on a typed name (IDENT-03). If there is no marker and no readable surface, the page falls back to light (DARK-05).
- **D-25:** `header-label-uniqueness` records whether any two headers in the recon view share a label, and whether the tenant has two custom fields with the same title. No admin change is made to create such a case.

### Claude's Discretion
- Exact probe scripts, run-sheet wording and order within D-01.
- Token formats and names (for example `PERSON-nnn` or the reserved identity token), and how the sanitised-output grammar is extended to admit them.
- How the rule-column mode is selected (a flag or a separate entry point) and the new fixture file names.
- Whether `referenced-cell-representation` is one ledger entry or one per column.
- The status value for "could not be observed". This may be a minimal extension of Phase 1's D-13 vocabulary (`verified`, `disproved`, `outside English-only scope`).
- Which date column and which custom field, within D-07.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` § Phase 6: goal, the four success criteria, and "Research: Needed. This phase *is* the research"
- `.planning/REQUIREMENTS.md`: RECON-04, RECON-05, RECON-06. The consumers whose needs shape the recon are DARK-01…05, RULE-02, RULE-07, RULE-08, RULE-09, IDENT-01…06 and EDIT-06. RULE-F1 and RULE-F2 are the deferred date and tag operators
- `.planning/PROJECT.md`: privacy constraint (ticket data never leaves the browser), permission freeze and English-only boundary

### Recon design inputs
- `.planning/research/SUMMARY.md` § "Phase 6: Recon 2" (deliverables, fixture policy) and § "Conflicts to Resolve", the "Dark-mode probe target" row
- `.planning/research/ARCHITECTURE.md` §4 "Dark-mode detection and the recon it needs" (the three-branch decision tree and the proposed ledger-id table), §5 "Identity detection and the editable override", Anti-Pattern 3 (`prefers-color-scheme` / page `localStorage` as the signal) and Anti-Pattern 9 (harvesting header labels or cell values)
- `.planning/research/PITFALLS.md` Pitfall 5 (wrong dark signal, CSSOM swaps invisible to observers, measuring a Zhroma-painted cell), Pitfall 7 (identity picks the wrong "me") and Pitfall 8 (rule semantics that don't match the cell)

### Prior recon, carried forward
- `.planning/phases/01-dom-recon-spike/01-CONTEXT.md`: Phase 1 decisions D-01…D-16 (hybrid session, sanitised-only fixtures, encrypted raw captures, the D-13 ledger entry shape, text-first evidence, disposable views)
- `SELECTORS.md`: the existing ledger. Its `stable-identifiers`, `root-chain`, `painting-element`, `sticky-header-state` and `interaction-and-sticky-states` probes are re-run in dark mode. Also read the Execution Safety Note and the Authenticated Interaction Handoff format
- `test/fixtures/manifest.json`: manifest entry shape for the new fixtures

### Tooling to reuse
- `scripts/sanitize-fixture.js`: sanitiser CLI. It requires a private denylist outside the worktree, fails closed, and tokenises text as `TEXT-nnn` per text node
- `scripts/sanitized-output-contract.js`: `PRESERVED_ATTRIBUTES` (currently no `title`, `alt`, `datetime` or `class`), `TEXTUAL_ARIA_ATTRIBUTES` and the output grammar
- `scripts/sensitive-patterns.js`: NFC-normalised sensitive scan
- `scripts/verify-recon-gate.js` and `scripts/fixture-contract.js`: ledger field contract, required entries, verdict and corpus gate
- `test/recon/*.js`: existing sanitiser, gate and fixture-contract tests, which must stay green

### Process lessons
- `.planning/RETROSPECTIVE.md` § Key Lessons 1, 2 and 5: size live sessions for one sitting, cap review and repair rounds, keep evidence proportionate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/sanitize-fixture.js`: already enforces a private denylist outside the worktree, rejects when the denylist equals the input or output, runs the sensitive scan before accepting output, and resolves paths from the module URL. The rule-column mode and the reserved identity token build on its denylist.
- `scripts/sanitized-output-contract.js`: classifies every attribute as preserved, textual ARIA (tokenised), reference, or removable, and rejects unknown ones. The new mode extends these sets rather than bypassing them.
- `SELECTORS.md` probes: `interaction-and-sticky-states` already returns normal, hover and selected paint for rows, cells and the pane in exactly the shape `dark-native-states` needs.
- `test/recon/sanitize-fixture.test.js` and `corpus-provenance.test.js`: templates for the new mode's tests and the manifest entries.

### Established Patterns
- CLI details stay hidden unless `ZHROMA_RECON_DEBUG=1`. Private paths are never printed or persisted.
- Priority text survives only in positively resolved Priority cells. The new allowlist follows the same rule: only in the header or cell where the text belongs.
- The v1 sanitiser admits exactly one table through a wrapper chain with no siblings. The identity-region fixture is a new boundary kind and needs its own boundary check.
- Deterministic token numbering. The v1 mode numbers per text node. The new mode numbers per distinct value.

### Integration Points
- New ledger entries go into `SELECTORS.md` under a Recon 2 section with its own verdict. New fixtures go into `test/fixtures/` with manifest entries.
- Consumers: Phase 8 takes the dark branch, the measured surfaces and the native states. Phase 9 takes the cell shapes and placeholders for the operator truth table. Phase 10 takes the identity location and difference kind. EDIT-06 takes the exact header labels.
- Phase 7 runs in parallel and owns `extension/` and `test/extension/`. Phase 6 must not touch either.

</code_context>

<specifics>
## Specific Ideas

- Record the exact rendered header text of each standard column, for example whether it reads "Requester" or "Requester name", or "Updated" or "Last updated". EDIT-06's static column-name list is built from it.
- Set the OS to explicit light or dark, never "auto". PITFALLS cites a report that Match system with an "auto" OS stays dark in daytime.
- Never read a colour from an element Zhroma could paint. A transparent `rgba(0, 0, 0, 0)` must not be read as black.
- Zendesk also has a separate dark/light override in the ticket conversation pane. It is on the ticket page, which is outside Zhroma's agent-view scope. Don't chase it beyond a one-line note if it shows up.

</specifics>

<deferred>
## Deferred Ideas

- Date and relative-time operators (RULE-F1). This recon records only the date format class and where timestamps live.
- Whole-word tag matching (RULE-F2). This recon records the tag rendering shape, which RULE-F2 will need later.
- Non-English recon and localised values (REACH-01).
- The ticket conversation pane's own dark/light override. It is out of scope because it is on the ticket page, not an agent view.

</deferred>

---

*Phase: 06-live-dom-recon-2*
*Context gathered: 2026-09-25*
