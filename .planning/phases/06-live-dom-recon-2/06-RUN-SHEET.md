# Phase 6: Live DOM Recon 2 - Run Sheet

This is the script for the Plan 03 live session. It is sized for one sitting of about an hour (D-01).
The user drives Zendesk. Claude reads the page and writes the ledger.

Every fact recorded here goes into the `## Recon 2` block of `SELECTORS.md`, under the field names that
`node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json` checks. The phase
cannot close until that command prints `RECON 2 VERDICT: proceed` or `RECON 2 VERDICT: block`.

## Rules for the session

- **The user does every interaction.** That covers every click, menu opening, Zendesk Appearance change,
  OS appearance change, Zhroma switch, view creation and deletion, hover, checkbox selection and Tab press
  (D-03).
- **Claude only runs the probes listed below**, and only in the user's own logged-in tab. The only
  writes a probe makes are temporary `data-zhroma-probe` markers, one `data-zhroma-probe-stash`
  attribute and a temporary observer. Claude never clicks, types, sends keys, focuses an element,
  navigates, submits a form, reads storage or makes a network request (D-03, Phase 1 Execution Safety
  Note in `SELECTORS.md`).
- **Probes return only safe values:** structure, counts, booleans, computed style values, or Zendesk
  vocabulary from an explicit allowlist in the probe. A probe never returns a name, email, subject, tag
  value, group name, custom-field value, hostname, id or URL (D-04). Anything a probe compares, such as
  the identity string against the Assignee cell, is compared inside the page.
- **No screenshots pass through the tool.** If a visual fact truly needs an image, the user takes and
  crops it (D-04, Phase 1 D-14).
- **Raw DOM never passes through the transcript.** Captures go from the page into the user's clipboard
  and then into a private file (D-05). See "Capture projection" below.
- **OS appearance is always set explicitly to Light or Dark, never Auto** (D-16).
- **Zhroma stays off for the whole session.** The user switches it off in its popup at Step 0 and
  switches it back at Step 8 (D-15).
- **Focus is reached with Tab only, never Enter or Space.** Enter or Space on a focused row can open a
  ticket (D-18, Phase 1 Execution Safety Note).
- **The session runs from the main checkout** (`/Users/mike/code/zhroma`), never from a GSD worktree.
  The sanitiser decides "outside the worktree" from its own module location (RESEARCH Pitfall 3).
- **If Claude in Chrome is not connected**, or Step 0 shows that evaluations do not persist, the user
  pastes each probe into the DevTools console of the Zendesk tab. They paste back only the object the
  probe returns (D-03).
- **Nothing identifying is typed into the chat.** No names, no tenant subdomain, no ticket or view
  numbers. The private denylist stays in its file (D-05, D-12).

## Before you start

1. Choose a private directory **outside every git checkout**, for example `~/zhroma-recon-private/`.
   Do not put it under `/Users/mike/code/zhroma`, even though `.gitignore` lists `*.private.html`.
   The raw captures and the denylist live only there.
2. Create the private denylist in that directory, for example `capture.denylist.txt`, with one entry per
   line:
   - a `self:` line holding your display name in the form the identity region shows it, for example
     `self: <your name as the top bar shows it>`;
   - only if the Step 1 identity comparison (P2) is not `identical`, a `self-alt:` line holding the form
     the Assignee cell shows;
   - plain lines for colleague names, requester names, organisation names, group names you expect to
     see, the tenant subdomain and any email address that could appear.
3. **The early-failure rule, exactly as Plan 01 implements it.** Before any capture is parsed, the
   sanitiser checks every denylist entry, including the `self:` and `self-alt:` forms. An entry fails
   with `denylist-entry-collides` when its case-insensitive form lies inside any one word of the
   collision set. That set is the token names and allowlisted Zendesk vocabulary (`ruleVocabularyWords`)
   plus `RULE_STRUCTURAL_WORDS`: element names, attribute names, Garden identifiers, probe markers and
   the synthetic dates, for example `table`, `tbody`, `aria-label` or `tables.row`.
   There is no length rule: a short name that lies inside no such word is accepted.
4. **Short entries are the ones most likely to collide.** Entries of three characters or fewer are the
   usual cause (RESEARCH Pitfall 4). If a plain entry collides, leave it out. The rule-columns tokeniser
   still replaces that text in the capture; only the backstop scan loses it.
5. **A colliding `self:` or `self-alt:` form is never shortened, altered or dropped** to get past the
   check (D-12). The user reports only the code (`denylist-entry-collides`). Plan 03 Task 2 then records
   each affected admission as `rejected` with that code and its named fallback.
6. Nothing from this file is ever typed into the chat (D-05, D-12).

## Steps at a glance

| Step | Zendesk | OS | What happens | `session-state` after |
|------|---------|----|--------------|-----------------------|
| Step 0 | original | original | Record originals, Zhroma off, preconditions, create the recon view, persistence check | `step-0-complete` |
| Step 1 | Light | Light | Column shapes, header labels, identity, light table and identity captures, cell light/os-light | `step-1-complete` |
| Step 2 | Light to Dark | Light | Switch A recorded, cell dark/os-light | `step-2-complete` |
| Step 3 | Dark | Light to Dark | Cell dark/os-dark | `step-3-complete` |
| Step 4 | Dark to Light | Dark | Switch B recorded, cell light/os-dark | `step-4-complete` |
| Step 5 | Light to Match system | Dark | Cell match/os-dark | `step-5-complete` |
| Step 6 | Match system | Dark to Light | Switch C recorded, cell match/os-light | `step-6-complete` |
| Step 7 | Dark | Light or Dark | Dark native states, focus, topology, dark table capture | `step-7-complete` |
| Step 8 | restore | restore | Cleanup, restore originals, delete the recon view | `restored` |

This order needs only five appearance changes to cover all six cells and all three switches (RESEARCH
Pattern 4).

## Step 0: Setup and preconditions

**User actions**

1. Tell Claude the original Zendesk Appearance (`light`, `dark` or `match-system`), the original OS
   appearance (`light`, `dark` or `auto`) and the original Zhroma switch (`on` or `off`). Enum words
   only.
2. Switch Zhroma off in its popup.
3. Check the three D-02 preconditions and report yes or no for each:
   - (a) the Zendesk profile menu offers Appearance (Light, Dark, Match system) on this tenant;
   - (b) you can create a personal, unshared view;
   - (c) at least one existing ticket that is already assigned to you will show in that view.
4. Create one personal recon view (D-06, D-07). Keep it ungrouped. Add these columns, in any order:
   Priority, Assignee, Requester, Group, Status, Type, Subject, a date column that Zendesk renders as
   relative time (for example Updated), one custom dropdown field, and a checkbox field if the tenant
   has one.
5. **Tags (D-26):** look for Tags in the view's column picker. Add it only if it is offered, and tell
   Claude `tags-offered: yes` or `tags-offered: no`.
6. Choose view conditions so the rows include a ticket assigned to you, tickets assigned to others, an
   unassigned ticket and, where the tenant has one, an empty value in other columns. Open the view.

**Claude**

- Record the originals in `## Recon 2 Session Handoff` as `appearance-original`,
  `os-appearance-original` and `zhroma-switch-original`, and the date as `capture-date`.
- Run `P0-preconditions`. Expect `topFrame: true`, `englishLang: true`, `agentFilterPath: true`,
  `ticketTables: 1`, `zhromaStamps: 0` and `probeMarkers: 0`. A non-zero `zhromaStamps` means Zhroma is
  still painting: ask the user to switch it off and reload the view.
- Run `P0-persistence-set`, then `P0-persistence-read` as a separate call. If both `windowPersists`
  and `attributePersists` are true, set `probe-path: claude-in-chrome`. Otherwise set
  `probe-path: devtools`, and the user pastes P4, P4-baseline and P5 into DevTools from now on
  (RESEARCH Pitfall 5).

**Branches**

- **(a) fails (no Appearance):** skip Steps 2 to 7. Record the four dark entries as not observed with
  Phase 8 blocked (see the recording map), and continue with Step 1 and Step 8. No one changes an admin
  setting to enable Appearance (D-02).
- **(b) or (c) fails:** stop and ask the user. A ticket is never created, edited or reassigned to meet
  (c) (D-02).

**Ledger fields:** `dark-mode-offered`, `dark-mode-signal.zhroma-off`, `tags-column`, handoff fields.
**After:** `session-state: step-0-complete`, `next-step: 1`.

## Step 1: Zendesk Light, OS Light

**User actions:** set Zendesk Appearance to Light and the OS to Light. Do not open any menu yet. Select
the checkbox of one ticket that is assigned to you, and only that one.

**Claude, in this order**

1. `P1-cell-shapes`: column shapes, header labels and duplicate labels.
2. `P2-identity`: the first run, with no menu opened. A candidate found here is present at load.
3. The user opens the profile menu. Claude runs `P2-identity` again.
4. If the name appears only inside the open menu: while the menu is still open, run `P2-mark-identity`
   and then the `stash` projection. Do not focus DevTools before `stash` has returned, because that can
   close the menu.
5. The user closes the menu. Claude runs `P2-identity` a third time. A candidate that appears now but
   not in the first run is lazy.
6. If the name is in the top bar: run `P2-mark-identity` now. The user checks in DevTools that the
   element with `data-zhroma-probe="capture"` is their avatar or profile control. Claude then runs
   `stash`.
7. The user runs `copy` in DevTools and writes the clipboard to `identity-region.private.html` in the
   private directory. On macOS: `pbpaste > ~/zhroma-recon-private/identity-region.private.html`.
8. `mark-table`, then `stash`. The user runs `copy` and writes `light-table.private.html` the same way.
9. **Allowlist confirmation (D-11):** from the P1 result, Claude notes each observed placeholder and any
   standard label or value whose spelling differs from `DEFAULT_RULE_VOCABULARY` (see the recording
   map). The ledger records each note.
10. `P3-appearance-cell` gives the cell light/os-light.

The user may clear the checkbox afterwards.

**Ledger fields:** `referenced-cell-representation.*`, `header-label-uniqueness.*`,
`identity-location.*`, `identity-vs-assignee.*`, `cell-light-os-light`.
**After:** `session-state: step-1-complete`, `next-step: 2`.

## Step 2: Zendesk Light to Dark, OS Light (switch A)

1. Claude runs `P4-install`.
2. Wait about 20 seconds without touching the page. Claude runs `P4-baseline`, which records the quiet
   baseline (RESEARCH Pitfall 6).
3. The user switches Zendesk Appearance to Dark and waits about 5 seconds.
4. Claude runs `P5-readback` (switch A), then `P3-appearance-cell`, which gives the cell
   dark/os-light.

**Ledger fields:** `switch-light-to-dark`, `cell-dark-os-light`.
**After:** `session-state: step-2-complete`, `next-step: 3`.

## Step 3: Zendesk Dark, OS Light to Dark

1. The user sets the OS explicitly to Dark, never Auto.
2. Claude runs `P3-appearance-cell`, which gives the cell dark/os-dark.

**Ledger fields:** `cell-dark-os-dark`.
**After:** `session-state: step-3-complete`, `next-step: 4`.

## Step 4: Zendesk Dark to Light, OS Dark (switch B)

1. `P4-install`, then about 20 quiet seconds, then `P4-baseline`.
2. The user switches Zendesk Appearance to Light and waits about 5 seconds.
3. `P5-readback` (switch B), then `P3-appearance-cell`, which gives the cell light/os-dark.

**Ledger fields:** `switch-dark-to-light`, `cell-light-os-dark`.
**After:** `session-state: step-4-complete`, `next-step: 5`.

## Step 5: Zendesk Light to Match system, OS Dark

1. The user sets Zendesk Appearance to Match system.
2. `P3-appearance-cell` gives the cell match/os-dark.

**Ledger fields:** `cell-match-os-dark`.
**After:** `session-state: step-5-complete`, `next-step: 6`.

## Step 6: Zendesk Match system, OS Dark to Light (switch C)

1. `P4-install`, then about 20 quiet seconds, then `P4-baseline`.
2. The user sets the OS explicitly to Light and waits about 5 seconds.
3. `P5-readback` (switch C), then `P3-appearance-cell`, which gives the cell match/os-light.

**Ledger fields:** `switch-os-under-match`, `cell-match-os-light`.
**After:** `session-state: step-6-complete`, `next-step: 7`.

## Step 7: Zendesk Dark (native states, topology and dark table)

1. The user sets Zendesk Appearance to Dark. The OS stays on an explicit Light or Dark.
2. The user selects one ticket's checkbox. Then they rest the pointer over a different, unselected row
   and keep it there. Claude runs `dark-interaction`.
3. Claude runs `dark-sticky`.
4. The user presses **Tab only**, never Enter or Space, until focus lands inside the ticket table. If
   focus cannot reach the table safely, stop pressing keys. Claude runs `P6-focus`.
5. Claude runs `dark-stable-identifiers` and `dark-root-chain`.
6. `mark-table`, then `stash`. The user runs `copy` and writes `dark-table.private.html` in the private
   directory.

**Ledger fields:** `dark-native-states.*`, `dark-table-topology.*`.
**After:** `session-state: step-7-complete`, `next-step: 8`.

## Step 8: Restore

1. Claude runs `cleanup` and confirms `remaining: 0`.
2. The user restores the original Zendesk Appearance, the original OS appearance (Auto is allowed here,
   because it is the user's own setting) and the original Zhroma switch.
3. The user deletes the recon view or views.
4. Claude records `restore: done` and `recon-views-deleted: yes` in the handoff. It records
   `private-inputs: awaiting-admission`: the private files stay in the private directory until Plan 03
   admits them (D-20, D-05).

**After:** `session-state: restored`, `next-step: admission`, `next-action-owner: claude`.

## Probe catalogue

Each probe is one line and a single JavaScript expression. It can be pasted verbatim into a ledger
`- probe:` field. The shared selectors are the v1 ones from `SELECTORS.md`:
`table[data-garden-id="tables.table"][data-test-id="generic-table"]`, ticket rows
`tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]`, header cells
`[data-garden-id="tables.header_cell"]`, cells `[data-garden-id="tables.cell"]` and pane
`[data-garden-id="pane"]`. `[data-zhroma-priority]` is Zhroma's own stamp, whose count must be 0.

### P0-preconditions

Checks the top frame, English `html[lang]`, the agent filter path (as a boolean only), exactly one ticket
table, zero Zhroma stamps and zero leftover probe markers.

~~~js probe P0-preconditions
(() => ({ topFrame: window === window.top, englishLang: /^en(?:-|$)/i.test(document.documentElement.lang), agentFilterPath: /^\/agent\/filters\/[^/]+$/.test(location.pathname), ticketTables: document.querySelectorAll('table[data-garden-id="tables.table"][data-test-id="generic-table"]').length, zhromaStamps: document.querySelectorAll('[data-zhroma-priority]').length, probeMarkers: document.querySelectorAll('[data-zhroma-probe], [data-zhroma-probe-stash]').length }))()
~~~

### P0-persistence-set and P0-persistence-read

These run as two separate calls. They show whether a window property and a documentElement attribute
survive between evaluations, which decides the `probe-path`.

~~~js probe P0-persistence-set
(() => { window.zhromaReconTwoPersist = true; document.documentElement.setAttribute('data-zhroma-probe', 'persist'); return { windowSet: window.zhromaReconTwoPersist === true, attributeSet: document.documentElement.getAttribute('data-zhroma-probe') === 'persist' }; })()
~~~

~~~js probe P0-persistence-read
(() => { const html = document.documentElement; const result = { windowPersists: window.zhromaReconTwoPersist === true, attributePersists: html.getAttribute('data-zhroma-probe') === 'persist' }; delete window.zhromaReconTwoPersist; if (result.attributePersists) html.removeAttribute('data-zhroma-probe'); return result; })()
~~~

### P1-cell-shapes

For each column it returns:

- the header label, only if it is in the probe's list of standard Zendesk labels (otherwise
  `non-standard` or `empty`), and how often that label repeats;
- the child element tag counts and the attribute names;
- identifier values only when they are digit-free lowercase, with counts of the rest;
- how many `title`, `alt` and `aria-label` attributes there are, and how many equal the cell text,
  computed in the page;
- visually-hidden, `display: none` and truncated counts, and empty and label-only cell counts;
- `time` elements and the class of their `datetime` values;
- which standard Priority, Status and Type values and candidate placeholders occur, with a count of
  non-standard values;
- a relative, absolute or other text-shape count.

~~~js probe P1-cell-shapes
(() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; const N = (value) => (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim(); const LABELS = ['Priority', 'Assignee', 'Requester', 'Group', 'Status', 'Type', 'Subject', 'Tags', 'Updated', 'Requester updated', 'Assignee updated', 'Last updated', 'Created', 'Requested', 'Due date', 'Organization', 'ID', 'Satisfaction', 'Channel', 'Brand', 'Ticket form', 'Solved', 'Latest update', 'Requester name', 'Assignee name', 'Group name']; const STATUS = ['New', 'Open', 'Pending', 'On-hold', 'On hold', 'Solved', 'Closed']; const TYPES = ['Question', 'Incident', 'Problem', 'Task']; const PRIORITY = ['Urgent', 'High', 'Normal', 'Low']; const HOLDERS = ['-', '--', '\u2013', '\u2014', 'Unassigned', 'None', '(none)', 'n/a', 'N/A', 'No group']; const VOCABULARY = [...PRIORITY, ...STATUS, ...TYPES, ...HOLDERS]; const RELATIVE = /\b(?:ago|just now|yesterday|today|tomorrow|minutes?|hours?|days?|weeks?|months?|years?)\b/i; const ABSOLUTE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|\d{1,2}:\d{2}|\b\d{4}\b|\d{1,2}\/\d{1,2}/; const plainIdentifier = (value) => /^[a-z][a-z._-]*$/.test(value); const bump = (map, key) => { map[key] = (map[key] ?? 0) + 1; }; const shapeOf = (element) => { const style = getComputedStyle(element); if (style.display === 'none') return 'displayNone'; if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)' || (style.position === 'absolute' && parseFloat(style.width) <= 1 && parseFloat(style.height) <= 1)) return 'visuallyHidden'; if (style.textOverflow === 'ellipsis' && element.scrollWidth > element.clientWidth) return 'truncated'; return null; }; const headers = [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')]; const headerTexts = headers.map((cell) => N(cell.textContent)); const labelCounts = {}; headerTexts.filter(Boolean).forEach((text) => bump(labelCounts, text)); const rows = [...table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const columns = headers.map((header, index) => { const text = headerTexts[index]; const facts = { index, label: !text ? 'empty' : LABELS.includes(text) ? text : 'non-standard', labelRepeats: text ? labelCounts[text] : 0, cells: 0, empty: 0, labelOnly: 0, tags: {}, attributeNames: [], identifiers: {}, digitIdentifiers: 0, otherIdentifiers: 0, title: 0, titleEqualsText: 0, alt: 0, altEqualsText: 0, ariaLabel: 0, ariaLabelEqualsText: 0, visuallyHidden: 0, displayNone: 0, truncated: 0, timeElements: 0, datetimeClass: {}, vocabulary: {}, nonStandardValues: 0, textShape: {} }; const names = new Set(); for (const row of rows) { const cell = row.children[index]; if (!cell) continue; facts.cells += 1; const cellText = N(cell.textContent); if (!cellText) facts.empty += 1; let labelled = false; for (const element of [cell, ...cell.querySelectorAll('*')]) { if (element !== cell) bump(facts.tags, element.tagName); element.getAttributeNames().forEach((name) => names.add(name)); for (const name of ['data-garden-id', 'data-test-id']) { const value = element.getAttribute(name); if (value === null) continue; if (/\d/.test(value)) facts.digitIdentifiers += 1; else if (plainIdentifier(value)) bump(facts.identifiers, value); else facts.otherIdentifiers += 1; } for (const [name, key] of [['title', 'title'], ['alt', 'alt'], ['aria-label', 'ariaLabel']]) { const value = element.getAttribute(name); if (value === null) continue; facts[key] += 1; if (N(value) === cellText) facts[key + 'EqualsText'] += 1; if (N(value)) labelled = true; } const shape = shapeOf(element); if (shape) facts[shape] += 1; if (element.tagName === 'TIME') { facts.timeElements += 1; const stamp = element.getAttribute('datetime'); bump(facts.datetimeClass, stamp === null ? 'absent' : /^\d{4}-\d{2}-\d{2}T/.test(stamp) ? 'iso-datetime' : /^\d{4}-\d{2}-\d{2}$/.test(stamp) ? 'iso-date' : 'other'); } } if (!cellText && labelled) facts.labelOnly += 1; if (VOCABULARY.includes(cellText)) bump(facts.vocabulary, cellText); else if (cellText) facts.nonStandardValues += 1; if (cellText) bump(facts.textShape, RELATIVE.test(cellText) ? 'relative' : ABSOLUTE.test(cellText) ? 'absolute' : 'other'); } facts.attributeNames = [...names].sort(); return facts; }); return { table: true, headerCount: headers.length, ticketRows: rows.length, groupRows: table.querySelectorAll('[data-garden-id="tables.group_row"]').length, duplicateLabelGroups: Object.values(labelCounts).filter((count) => count > 1).length, duplicateStandardLabels: Object.keys(labelCounts).filter((text) => labelCounts[text] > 1 && LABELS.includes(text)), columns }; })()
~~~

### P2-identity

This probe never returns a name. It finds the one checkbox-selected row and reads that row's Assignee
cell inside the page. It then searches only candidate scopes outside the ticket table (landmarks, menus,
avatars, and buttons and images with a label). It normalises both strings (NFC, whitespace collapse,
trim) and returns a descriptor for each candidate: tag, digit-free identifiers, the carrying attribute,
the difference kind, one-word or multi-word, whether the candidate is inside a menu or the top bar, and
whether an earlier run already saw it. The probe also marks hits with `data-zhroma-probe="identity-hit"`
so that a later run can tell which candidates it has seen before.

~~~js probe P2-identity
(() => { const N = (value) => (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim(); const kindOf = (a, b) => (!a || !b ? 'not-comparable' : a === b ? 'identical' : a.toLowerCase() === b.toLowerCase() ? 'case-only' : a.replace(/\s/gu, '') === b.replace(/\s/gu, '') ? 'whitespace-only' : a.startsWith(b) || b.startsWith(a) ? 'prefix' : 'different'); const plainIdentifier = (value) => (value === null ? null : /^[a-z][a-z._-]*$/.test(value) ? value : 'other'); const words = (value) => (value.split(' ').length > 1 ? 'multi-word' : 'one-word'); const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; const headers = [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')]; const assigneeIndex = headers.findIndex((cell) => N(cell.textContent) === 'Assignee'); const rows = [...table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected = rows.filter((row) => row.getAttribute('aria-selected') === 'true' || row.querySelector('input[type="checkbox"]')?.checked === true); const menuOpen = Boolean(document.querySelector('[role="menu"]')); if (assigneeIndex < 0 || selected.length !== 1) return { table: true, assigneeIndex, selectedRows: selected.length, menuOpen }; const cell = selected[0].children[assigneeIndex]; const cellText = N(cell?.textContent); const labelText = [cell, ...(cell ? cell.querySelectorAll('*') : [])].filter(Boolean).map((element) => N(element.getAttribute('aria-label') ?? element.getAttribute('title') ?? element.getAttribute('alt'))).find(Boolean) ?? ''; const assigneeRenders = cellText && labelText ? 'both' : labelText ? 'avatar-label' : cellText ? 'text' : 'empty'; const assignee = cellText || labelText; const RANK = ['identical', 'case-only', 'whitespace-only', 'prefix']; const scope = 'header, nav, aside, [role="banner"], [role="navigation"], [role="menu"], [role="menuitem"], [role="dialog"], [data-garden-id^="avatars"], [data-test-id*="profile"], [data-test-id*="avatar"], [data-test-id*="user"], button[aria-label], button[title], img[alt]'; const visited = new Set(); const hits = []; let differentCount = 0; for (const root of document.querySelectorAll(scope)) { for (const element of [root, ...root.querySelectorAll('*')]) { if (visited.has(element) || table.contains(element)) continue; visited.add(element); const carriers = [['alt', element.getAttribute('alt')], ['aria-label', element.getAttribute('aria-label')], ['title', element.getAttribute('title')], ['text', element.children.length === 0 ? element.textContent : null]]; for (const [carrier, raw] of carriers) { const value = N(raw); if (!value) continue; const difference = kindOf(value, assignee); if (difference === 'different') { differentCount += 1; continue; } if (!RANK.includes(difference)) continue; hits.push({ element, carrier, difference, wordClass: words(value) }); } } } const describe = (hit) => ({ tag: hit.element.tagName, garden: plainIdentifier(hit.element.getAttribute('data-garden-id')), test: plainIdentifier(hit.element.getAttribute('data-test-id')), role: hit.element.getAttribute('role'), carrier: hit.carrier, difference: hit.difference, wordClass: hit.wordClass, insideMenu: Boolean(hit.element.closest('[role="menu"], [role="dialog"]')), inTopBar: Boolean(hit.element.closest('header, [role="banner"]')), seenInEarlierRun: hit.element.getAttribute('data-zhroma-probe') === 'identity-hit' }); const candidates = hits.map(describe); hits.forEach((hit) => { if (!hit.element.hasAttribute('data-zhroma-probe')) hit.element.setAttribute('data-zhroma-probe', 'identity-hit'); }); return { table: true, assigneeIndex, selectedRows: 1, assigneeRenders, assigneeWordClass: assignee ? words(assignee) : null, menuOpen, candidateCount: candidates.length, candidates: candidates.slice(0, 20), differentCount }; })()
~~~

### P2-mark-identity

Picks the best candidate (identical first, then case-only, whitespace-only, prefix; the top bar before
other regions). It then marks the nearest button or menu item around that candidate, or the candidate
itself, with `data-zhroma-probe="capture"`, and returns the descriptor.

~~~js probe P2-mark-identity
(() => { const N = (value) => (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim(); const kindOf = (a, b) => (!a || !b ? 'not-comparable' : a === b ? 'identical' : a.toLowerCase() === b.toLowerCase() ? 'case-only' : a.replace(/\s/gu, '') === b.replace(/\s/gu, '') ? 'whitespace-only' : a.startsWith(b) || b.startsWith(a) ? 'prefix' : 'different'); const plainIdentifier = (value) => (value === null ? null : /^[a-z][a-z._-]*$/.test(value) ? value : 'other'); const words = (value) => (value.split(' ').length > 1 ? 'multi-word' : 'one-word'); const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; const headers = [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')]; const assigneeIndex = headers.findIndex((cell) => N(cell.textContent) === 'Assignee'); const rows = [...table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected = rows.filter((row) => row.getAttribute('aria-selected') === 'true' || row.querySelector('input[type="checkbox"]')?.checked === true); const menuOpen = Boolean(document.querySelector('[role="menu"]')); if (assigneeIndex < 0 || selected.length !== 1) return { table: true, assigneeIndex, selectedRows: selected.length, menuOpen }; const cell = selected[0].children[assigneeIndex]; const cellText = N(cell?.textContent); const labelText = [cell, ...(cell ? cell.querySelectorAll('*') : [])].filter(Boolean).map((element) => N(element.getAttribute('aria-label') ?? element.getAttribute('title') ?? element.getAttribute('alt'))).find(Boolean) ?? ''; const assigneeRenders = cellText && labelText ? 'both' : labelText ? 'avatar-label' : cellText ? 'text' : 'empty'; const assignee = cellText || labelText; const RANK = ['identical', 'case-only', 'whitespace-only', 'prefix']; const scope = 'header, nav, aside, [role="banner"], [role="navigation"], [role="menu"], [role="menuitem"], [role="dialog"], [data-garden-id^="avatars"], [data-test-id*="profile"], [data-test-id*="avatar"], [data-test-id*="user"], button[aria-label], button[title], img[alt]'; const visited = new Set(); const hits = []; let differentCount = 0; for (const root of document.querySelectorAll(scope)) { for (const element of [root, ...root.querySelectorAll('*')]) { if (visited.has(element) || table.contains(element)) continue; visited.add(element); const carriers = [['alt', element.getAttribute('alt')], ['aria-label', element.getAttribute('aria-label')], ['title', element.getAttribute('title')], ['text', element.children.length === 0 ? element.textContent : null]]; for (const [carrier, raw] of carriers) { const value = N(raw); if (!value) continue; const difference = kindOf(value, assignee); if (difference === 'different') { differentCount += 1; continue; } if (!RANK.includes(difference)) continue; hits.push({ element, carrier, difference, wordClass: words(value) }); } } } const describe = (hit) => ({ tag: hit.element.tagName, garden: plainIdentifier(hit.element.getAttribute('data-garden-id')), test: plainIdentifier(hit.element.getAttribute('data-test-id')), role: hit.element.getAttribute('role'), carrier: hit.carrier, difference: hit.difference, wordClass: hit.wordClass, insideMenu: Boolean(hit.element.closest('[role="menu"], [role="dialog"]')), inTopBar: Boolean(hit.element.closest('header, [role="banner"]')), seenInEarlierRun: hit.element.getAttribute('data-zhroma-probe') === 'identity-hit' }); const ordered = hits.slice().sort((a, b) => RANK.indexOf(a.difference) - RANK.indexOf(b.difference) || Number(Boolean(b.element.closest('header, [role="banner"]'))) - Number(Boolean(a.element.closest('header, [role="banner"]')))); if (ordered.length === 0) return { marked: false, candidateCount: 0, menuOpen }; const chosen = ordered[0]; const control = chosen.element.closest('button, [role="menuitem"]'); const root = control && !control.querySelector('table, nav, header, main, aside') ? control : chosen.element; document.querySelectorAll('[data-zhroma-probe="capture"]').forEach((element) => element.removeAttribute('data-zhroma-probe')); root.setAttribute('data-zhroma-probe', 'capture'); return { marked: true, ...describe(chosen), rootTag: root.tagName, rootGarden: plainIdentifier(root.getAttribute('data-garden-id')), rootTest: plainIdentifier(root.getAttribute('data-test-id')), rootRole: root.getAttribute('role'), rootElements: root.querySelectorAll('*').length + 1, rootContainsLandmark: Boolean(root.querySelector('table, tr, nav, header, main, aside')), menuOpen }; })()
~~~

### P3-appearance-cell

Reads one appearance cell (D-16):

- `color-scheme` on `html` and `body`, and `meta[name=color-scheme]`;
- the attribute names on `html` and `body`, their mode-like class tokens, and any attribute whose value
  is light, dark, system or auto;
- `prefersDark`;
- the pane background, the header-cell background and text colours, and a ticket cell's **text** colour.

It never reads a background that Zhroma could paint.

~~~js probe P3-appearance-cell
(() => { const html = document.documentElement; const body = document.body; const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const pane = table?.closest('[data-garden-id="pane"]'); const header = table?.querySelector('thead [data-garden-id="tables.header_cell"]'); const cell = table?.querySelector('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"] > [data-garden-id="tables.cell"]'); const style = (element) => (element ? getComputedStyle(element) : null); const MODE = /dark|light|theme|scheme|mode/i; const modeTokens = (element) => [...element.classList].filter((token) => MODE.test(token)); const modeValues = (element) => element.getAttributeNames().filter((name) => /^(light|dark|system|auto)$/i.test(element.getAttribute(name) ?? '')).map((name) => name + '=' + element.getAttribute(name).toLowerCase()); return { htmlColorScheme: style(html).colorScheme, bodyColorScheme: style(body).colorScheme, metaColorScheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') ?? null, htmlAttributeNames: html.getAttributeNames(), bodyAttributeNames: body.getAttributeNames(), htmlModeClassTokens: modeTokens(html), bodyModeClassTokens: modeTokens(body), modeAttributeValues: [...modeValues(html), ...modeValues(body)], prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, paneBackground: style(pane)?.backgroundColor ?? null, headerCellBackground: style(header)?.backgroundColor ?? null, headerCellText: style(header)?.color ?? null, ticketCellText: style(cell)?.color ?? null, zhromaStamps: document.querySelectorAll('[data-zhroma-priority]').length }; })()
~~~

### P4-install, P4-baseline and P5-readback

`P4-install` marks the table (`recon-two-table`) and documentElement (`recon-two-sentinel`). It then
starts a MutationObserver on `html`, `head`, `body` and the table, and stores a plain
`window.zhromaReconTwo` recorder that holds the stylesheet rule count. `P4-baseline` saves the quiet
counts and starts the switch window. `P5-readback` returns the switch-window counts per target, with
attribute names only, together with the baseline, the stylesheet rule and sheet deltas, and the
`reloaded` and `tableRemounted` booleans. It then disconnects the observer and removes its markers.

~~~js probe P4-install
(() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { installed: false, table: false }; window.zhromaReconTwo?.observer?.disconnect(); const ruleCount = () => [...document.styleSheets].reduce((total, sheet) => { try { return total + sheet.cssRules.length; } catch { return total; } }, 0); const counts = { html: {}, head: {}, body: {}, table: {} }; const bump = (key, type, name) => { const bucket = counts[key]; bucket[type] = (bucket[type] ?? 0) + 1; if (name) bucket.attributeNames = [...new Set([...(bucket.attributeNames ?? []), name])]; }; const where = (target) => (target === document.documentElement ? 'html' : target === document.body ? 'body' : document.head.contains(target) ? 'head' : 'table'); table.setAttribute('data-zhroma-probe', 'recon-two-table'); document.documentElement.setAttribute('data-zhroma-probe', 'recon-two-sentinel'); const observer = new MutationObserver((records) => records.forEach((record) => bump(where(record.target), record.type, record.attributeName))); observer.observe(document.documentElement, { attributes: true }); observer.observe(document.head, { childList: true, subtree: true, attributes: true }); observer.observe(document.body, { attributes: true, childList: true }); observer.observe(table, { attributes: true, childList: true, subtree: true }); window.zhromaReconTwo = { observer, counts, ruleCount, rules: ruleCount(), sheets: document.styleSheets.length, installedAt: Date.now() }; return { installed: true, rules: window.zhromaReconTwo.rules, sheets: window.zhromaReconTwo.sheets }; })()
~~~

~~~js probe P4-baseline
(() => { const recorder = window.zhromaReconTwo; if (!recorder || document.documentElement.getAttribute('data-zhroma-probe') !== 'recon-two-sentinel') return { baseline: false, recorderVisible: Boolean(recorder) }; const noise = JSON.parse(JSON.stringify(recorder.counts)); Object.keys(recorder.counts).forEach((key) => { recorder.counts[key] = {}; }); recorder.baseline = { counts: noise, seconds: Math.round((Date.now() - recorder.installedAt) / 1000), ruleDelta: recorder.ruleCount() - recorder.rules, sheetDelta: document.styleSheets.length - recorder.sheets }; recorder.rules = recorder.ruleCount(); recorder.sheets = document.styleSheets.length; recorder.switchStartedAt = Date.now(); return { baseline: true, ...recorder.baseline }; })()
~~~

~~~js probe P5-readback
(() => { const recorder = window.zhromaReconTwo; const sentinel = document.documentElement.getAttribute('data-zhroma-probe') === 'recon-two-sentinel'; if (!sentinel) return { reloaded: true, recorderVisible: Boolean(recorder) }; if (!recorder) return { reloaded: false, recorderVisible: false }; recorder.observer.disconnect(); const marked = document.querySelector('[data-zhroma-probe="recon-two-table"]'); const current = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const result = { reloaded: false, recorderVisible: true, tableRemounted: !marked || marked !== current, seconds: Math.round((Date.now() - (recorder.switchStartedAt ?? recorder.installedAt)) / 1000), ruleDelta: recorder.ruleCount() - recorder.rules, sheetDelta: document.styleSheets.length - recorder.sheets, counts: recorder.counts, baseline: recorder.baseline ?? null }; marked?.removeAttribute('data-zhroma-probe'); document.documentElement.removeAttribute('data-zhroma-probe'); delete window.zhromaReconTwo; return JSON.parse(JSON.stringify(result)); })()
~~~

### P6-focus

Reads the focused element after the user's Tab presses: whether it is in the table, its tag and
identifiers, `:focus-visible`, and the outline and box-shadow of the element and its row.

~~~js probe P6-focus
(() => { const active = document.activeElement ?? document.body; const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const style = getComputedStyle(active); const row = active.closest('tr'); return { inTable: Boolean(table?.contains(active)), tag: active.tagName, garden: active.getAttribute('data-garden-id'), test: active.getAttribute('data-test-id'), focusVisible: active.matches(':focus-visible'), outline: style.outlineStyle + ' ' + style.outlineWidth + ' ' + style.outlineColor + ' offset ' + style.outlineOffset, boxShadow: style.boxShadow, rowBoxShadow: row ? getComputedStyle(row).boxShadow : null, rowBackground: row ? getComputedStyle(row).backgroundColor : null }; })()
~~~

### dark-interaction

The Phase 1 `interaction-and-sticky-states` probe from `SELECTORS.md`, verbatim.

~~~js probe dark-interaction
(() => { const table=document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const rows=[...table.querySelectorAll('tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected=rows.filter(row=>row.getAttribute('aria-selected')==='true'); const hovered=rows.filter(row=>row.matches(':hover')); const normal=rows.find(row=>!selected.includes(row)&&!hovered.includes(row)); const pane=table.closest('[data-garden-id="pane"]'); const css=node=>{ if(!node)return null; const style=getComputedStyle(node); return { backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage, borderBottomColor:style.borderBottomColor, boxShadow:style.boxShadow }; }; const cells=row=>row ? [...row.children].map(css) : []; return { englishShell:document.documentElement.lang==='en', ticketRows:rows.length, selectedRows:selected.length, hoveredRows:hovered.length, selectedAndHoveredDistinct:Boolean(selected[0]&&hovered[0]&&selected[0]!==hovered[0]), normalRowExists:Boolean(normal), selectedAriaSelected:selected[0]?.getAttribute('aria-selected')??null, hoveredAriaSelected:hovered[0]?.getAttribute('aria-selected')??null, normal:{ row:css(normal), directCells:cells(normal) }, hover:{ row:css(hovered[0]), directCells:cells(hovered[0]) }, selected:{ row:css(selected[0]), directCells:cells(selected[0]), firstSelectableCell:css(selected[0]?.querySelector(':scope > [data-garden-id="tables.cell"]')) }, pane:css(pane) }; })()
~~~

### dark-sticky

A self-contained version of the Phase 1 `sticky-header-state` probe. It also returns the header text
colour.

~~~js probe dark-sticky
(() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; return [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')].map((cell) => { const style = getComputedStyle(cell); return { position: style.position, top: style.top, zIndex: style.zIndex, backgroundColor: style.backgroundColor, color: style.color }; }); })()
~~~

### dark-stable-identifiers

A self-contained version of the Phase 1 `stable-identifiers` probe. It finds the table without assuming
the identifiers hold. It counts digit-free identifier values within the table's wrapper and returns a
`holds` object for the v1 table, head, body, row, header-cell and cell identifiers.

~~~js probe dark-stable-identifiers
(() => { const table = document.querySelector('table[data-garden-id="tables.table"]') ?? document.querySelector('table'); if (!table) return { table: false, tables: 0 }; const boundary = table.parentElement ?? table; const result = { tables: document.querySelectorAll('table').length, 'data-garden-id': {}, 'data-test-id': {}, digitBearing: 0 }; for (const element of boundary.querySelectorAll('[data-garden-id], [data-test-id]')) { for (const name of ['data-garden-id', 'data-test-id']) { const value = element.getAttribute(name); if (!value) continue; if (/\d/.test(value)) { result.digitBearing += 1; continue; } result[name][value] = (result[name][value] ?? 0) + 1; } } const has = (selector) => table.matches(selector) || Boolean(table.querySelector(selector)); result.holds = { table: table.matches('[data-garden-id="tables.table"][data-test-id="generic-table"]'), head: has('[data-garden-id="tables.head"][data-test-id="generic-table-head"]'), body: has('[data-garden-id="tables.body"][data-test-id="generic-table-body"]'), row: has('[data-garden-id="tables.row"][data-test-id="generic-table-row"]'), groupRowSelector: 'tables.group_row', headerCell: has('[data-garden-id="tables.header_cell"]'), cell: has('[data-garden-id="tables.cell"]') }; return result; })()
~~~

### dark-root-chain

A self-contained version of the Phase 1 `root-chain` probe on a sampled ticket row.

~~~js probe dark-root-chain
(() => { const table = document.querySelector('table[data-garden-id="tables.table"]') ?? document.querySelector('table'); const row = table?.querySelector('tbody tr'); if (!row) return { row: false }; const roots = []; let node = row; while (node) { const root = node.getRootNode(); if (root === node.ownerDocument) { roots.push({ type: 'Document' }); break; } roots.push({ type: 'ShadowRoot', mode: root.mode ?? null, hostTag: root.host?.tagName ?? null }); node = root.host; } return { roots, ownerIsDocument: row.ownerDocument === document, reachable: document.contains(row), ownerFrameTag: row.ownerDocument.defaultView?.frameElement?.tagName ?? null }; })()
~~~

### mark-table

Clears any earlier capture marker and marks the ticket table's immediate overflow wrapper with
`data-zhroma-probe="capture"`.

~~~js probe mark-table
(() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table?.parentElement) return { marked: false }; const previous = [...document.querySelectorAll('[data-zhroma-probe="capture"]')]; previous.forEach((element) => element.removeAttribute('data-zhroma-probe')); const wrapper = table.parentElement; wrapper.setAttribute('data-zhroma-probe', 'capture'); return { marked: true, clearedPrevious: previous.length, wrapperTag: wrapper.tagName, wrapperElementChildren: wrapper.children.length, ticketRows: table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]').length, groupRows: table.querySelectorAll('[data-garden-id="tables.group_row"]').length }; })()
~~~

### cleanup

Counts, then removes, every `data-zhroma-probe` marker and the stash attribute. It also disconnects any
recorder, and returns the counts and the number of markers that remain.

~~~js probe cleanup
(() => { const html = document.documentElement; const marked = [...document.querySelectorAll('[data-zhroma-probe]')]; const stash = html.hasAttribute('data-zhroma-probe-stash'); const recorder = Boolean(window.zhromaReconTwo); window.zhromaReconTwo?.observer?.disconnect(); delete window.zhromaReconTwo; delete window.zhromaReconTwoPersist; marked.forEach((element) => element.removeAttribute('data-zhroma-probe')); html.removeAttribute('data-zhroma-probe-stash'); return { markersRemoved: marked.length, stashRemoved: stash, recorderDisconnected: recorder, remaining: document.querySelectorAll('[data-zhroma-probe], [data-zhroma-probe-stash]').length }; })()
~~~

## Capture projection

Raw DOM for fixtures crosses from the page to a private file without ever entering the transcript (D-05,
RESEARCH Pitfall 2).

- **`stash`** can be run by Claude or pasted into DevTools. It works on the single element marked
  `data-zhroma-probe="capture"`:
  - It makes a detached copy of that element. For a table, the copy is a shallow copy of the wrapper
    around a deep copy of the table.
  - It walks the live element and the copy in parallel. On the copy it sets `data-zhroma-probe` to
    `visually-hidden`, `display-none` or `text-truncated` from the live computed style.
  - It removes script, style, link, meta, iframe, frame, object, embed, base, form, template and
    noscript elements, SVG `use` elements and every comment.
  - It keeps only the attribute names that rule-columns mode accepts: `RULE_PRESERVED_ATTRIBUTES`, the
    `title` and `alt` text attributes of `RULE_TEXT_ATTRIBUTES`, `datetime` and `aria-*`. It drops any
    identifier value that contains a digit, and removes the capture marker.
  - It checks the serialised string in the page for zero resource attributes, zero comments and zero
    `style` attributes, and stores it in `data-zhroma-probe-stash` on documentElement.
  - It returns only counts.
- **`copy`** runs in DevTools only, because `copy()` is a DevTools console helper. It copies the
  stashed value to the clipboard and removes the attribute. The user then writes the clipboard into the
  private directory from a terminal, for example
  `pbpaste > ~/zhroma-recon-private/light-table.private.html`. The three file names are
  `light-table.private.html`, `identity-region.private.html` and `dark-table.private.html`.

Claude can run `stash` while the profile menu is open, so the menu-only identity case works even if
focusing DevTools afterwards closes the menu.

~~~js projection stash
(() => {
  const html = document.documentElement;
  const marked = [...document.querySelectorAll('[data-zhroma-probe="capture"]')];
  if (marked.length !== 1) return { stashed: false, markedElements: marked.length };
  const live = marked[0];
  const liveTable = live.querySelector(':scope > table');
  const clone = liveTable ? live.cloneNode(false) : live.cloneNode(true);
  if (liveTable) clone.append(liveTable.cloneNode(true));
  const KEEP = new Set(['role', 'scope', 'colspan', 'rowspan', 'tabindex', 'lang', 'dir', 'type', 'disabled', 'hidden', 'checked', 'selected', 'multiple', 'readonly', 'data-garden-id', 'data-test-id', 'data-zhroma-probe', 'title', 'alt', 'datetime']);
  const DROP = 'script, style, link, meta, iframe, frame, object, embed, base, form, template, noscript, use';
  const counts = { shapeMarkers: 0, removedElements: 0, removedComments: 0, removedAttributes: 0, droppedIdentifiers: 0 };
  function shapeOf(element) {
    const style = getComputedStyle(element);
    if (style.display === 'none') return 'display-none';
    const tiny = style.position === 'absolute' && parseFloat(style.width) <= 1 && parseFloat(style.height) <= 1;
    if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)' || tiny) return 'visually-hidden';
    if (style.textOverflow === 'ellipsis' && element.scrollWidth > element.clientWidth) return 'text-truncated';
    return null;
  }
  function mark(source, copy) {
    copy.removeAttribute('data-zhroma-probe');
    const shape = shapeOf(source);
    if (shape) { copy.setAttribute('data-zhroma-probe', shape); counts.shapeMarkers += 1; }
  }
  function walk(source, copy) {
    mark(source, copy);
    [...source.children].forEach((child, index) => walk(child, copy.children[index]));
  }
  mark(live, clone);
  if (liveTable) walk(liveTable, clone.firstElementChild);
  else [...live.children].forEach((child, index) => walk(child, clone.children[index]));
  clone.querySelectorAll(DROP).forEach((element) => { element.remove(); counts.removedElements += 1; });
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((node) => { node.remove(); counts.removedComments += 1; });
  for (const element of [clone, ...clone.querySelectorAll('*')]) {
    for (const name of element.getAttributeNames()) {
      const kept = KEEP.has(name) || name.startsWith('aria-');
      const identifier = name === 'data-garden-id' || name === 'data-test-id';
      if (!kept) { element.removeAttribute(name); counts.removedAttributes += 1; }
      else if (identifier && /\d/.test(element.getAttribute(name))) { element.removeAttribute(name); counts.droppedIdentifiers += 1; }
    }
  }
  const serialised = clone.outerHTML;
  const checks = {
    resourceAttributes: (serialised.match(/\s(?:src|srcset|href|xlink:href|action|formaction|poster|srcdoc)\s*=/giu) ?? []).length,
    comments: serialised.split('<!--').length - 1,
    styleAttributes: (serialised.match(/\sstyle\s*=/giu) ?? []).length
  };
  if (checks.resourceAttributes || checks.comments || checks.styleAttributes) return { stashed: false, ...counts, ...checks };
  html.setAttribute('data-zhroma-probe-stash', serialised);
  live.removeAttribute('data-zhroma-probe');
  return { stashed: true, elements: clone.querySelectorAll('*').length + 1, characters: serialised.length, ...counts, ...checks };
})()
~~~

~~~js projection copy
(() => {
  const html = document.documentElement;
  const value = html.getAttribute('data-zhroma-probe-stash');
  if (value === null) return { copied: false };
  copy(value);
  html.removeAttribute('data-zhroma-probe-stash');
  return { copied: true, characters: value.length };
})()
~~~

## Recording map

Each Recon 2 ledger field, the probe that fills it and the rule for its value. The entry's `probe` field
holds the exact probe line used. `evidence` holds the returned counts and computed strings.
`interpretation` holds what they mean for the consuming phase.

**Effective mode per cell:** Light or Dark when Zendesk is set to that, or the OS mode when Zendesk is on
Match system. Cells are named `cell-<zendesk>-os-<os>`, for example `cell-match-os-dark`.

### dark-mode-signal (Steps 0 to 6)

- `dark-mode-offered`: `yes` or `no` from precondition (a).
- `dark-branch`:
  - `document-marker` when an `html` or `body` attribute, class token or computed `color-scheme` follows
    the effective mode in all six cells;
  - otherwise `surface-luminance` when the pane background luminance separates the light cells from the
    dark cells;
  - otherwise `neither`;
  - `not-offered` when Appearance is not offered.
- `prefers-color-scheme` (`prefersDark`) is recorded only as a per-cell fact, never as the signal
  (ARCHITECTURE Anti-Pattern 3).
- `os-auto-used`: always `no`, because the OS was set explicitly each time.
- `zhroma-off`: `yes` when every P0 and P3 result shows `zhromaStamps: 0`.
- Each `cell-*` field is one line, for example
  `effective dark; html color-scheme dark; marker html class dark-token; prefersDark false; pane rgb(...); header rgb(...) on rgb(...); cell text rgb(...)`.
  Record colours as the computed strings, verbatim. A transparent value such as `rgba(0, 0, 0, 0)` is
  never read as black. Write a hashed class name as `hashed-class`, not verbatim. Ignore
  `data-zhroma-probe*` names. A cell that could not be observed is `not-observed`, which forces status
  `not observed`.

### dark-mode-switch-mutation (Steps 2, 4 and 6)

`switch-light-to-dark`, `switch-dark-to-light` and `switch-os-under-match` each take the most disruptive
observed class, in this order:

1. `reload` when P5 returns `reloaded: true`;
2. `remount` when `tableRemounted: true`;
3. `attribute-or-class-swap` when `html` or `body` attribute records exceed the baseline;
4. `cssom-only` when only `ruleDelta`, `sheetDelta` or `head` childList records change beyond the
   baseline;
5. `no-mutation` otherwise.

A switch that could not be observed is `not-observed`. The evidence records the counts and the baseline.

### dark-native-states (Step 7)

- `zhroma-off`: `yes`.
- `hover-selection-observed`: `yes` when `dark-interaction` returns at least one selected and one
  hovered row, the two are distinct, and a normal row exists. Otherwise `no`, which forces status
  `not observed`.
- `focus-observed`: `yes` when `P6-focus` returns `inTable: true` with a visible outline or box-shadow.
  Otherwise `no`, with a `focus-fallback` that names Phase 8 (D-18).
- The evidence records the normal, hover, selected, sticky-header, pane and focus paints as computed
  strings, verbatim. `dark-native-states` is not routed through the Phase 1 paint grammar (RESEARCH
  Pitfall 7).

### dark-table-topology (Step 7)

- `garden-identifiers`: `hold` when every value in the `dark-stable-identifiers` `holds` object is true.
  Otherwise `differ`, which blocks Phase 8. It is `not-observed` only when Step 7 did not run, which
  forces status `not observed`.
- `root-terminus`: `Document` when `dark-root-chain` returns only `{ type: 'Document' }`, `ShadowRoot`
  when a shadow root appears, or `not-observed`.

### identity-location (Step 1)

- `identity-source`:
  - `top-bar-at-load` when the chosen candidate appeared in the first P2 run, with no menu open;
  - `top-bar-lazy` when it first appeared in the third run, with the menu closed again;
  - `profile-menu-only` when it appeared only while the menu was open;
  - `not-found` when no run found one.
- `identity-carrier`: the chosen candidate's `carrier` (`text`, `aria-label`, `title` or `alt`), or
  `not-found`.
- `identity-form`: `full` for a multi-word name, `short` otherwise, or `not-found`. The three identity
  fields are `not-found` together, which forces status `not observed` and a Phase 10 fallback (IDENT-03).
- `assignee-cell-renders`: P2's `assigneeRenders` (`text`, `avatar-label` or `both`).

### identity-vs-assignee (Step 1)

- `difference-kind`: the chosen candidate's `difference`, or `not-comparable` when no identity was
  found.
- `equal`: `true` exactly when `difference-kind` is `identical`.
- `not-comparable` goes with status `not observed` and a Phase 10 fallback.
- If the kind is not `identical`, the user adds a `self-alt:` line to the private denylist before
  admission (see "Before you start").

### referenced-cell-representation (Steps 0 and 1)

- `assignee-cell`, `requester-cell`, `group-cell`, `status-cell`, `type-cell`, `subject-cell`,
  `date-cell` and `custom-field-cell`: a one-line shape summary from the P1 column facts. For example:
  `span text; aria-label on avatar equals text; 1 empty of 30; no hidden text`.
- `empty-placeholders`: the placeholders P1 saw, or `none observed`.
- `tags-column`: `observed` when the column picker offered Tags, and then `tags-cell` holds its shape
  summary. Otherwise `not-offered`, and then `tags-fallback` reads:
  `Tags rules resolve no header, so RULE-07 keeps them inactive, and RULE-F2 stays deferred (D-26).`
- `date-text-class`: `relative` when the date column's text shapes are all relative, `absolute` when
  they are all absolute, and `mixed` otherwise.
- `date-machine-value`:
  - `datetime-attribute` when the `time` elements carry `datetime`;
  - `title` when a `title` carries the absolute date;
  - `both` when both do;
  - `none` when neither does.
- `vocabulary`: `confirmed-from-session` after the allowlist confirmation below.
- **Allowlist confirmation (D-11):** after Step 1, the only edits allowed to `DEFAULT_RULE_VOCABULARY`
  in `scripts/rule-column-contract.js` are two:
  - a spelling of a standard header label or a standard Status or Type value that the session shows
    differently;
  - an observed empty placeholder.

  Each edit gets a ledger note in this entry's evidence. Custom status names and the custom field's
  label stay tokenised.

### header-label-uniqueness (Step 1)

- `duplicate-in-view`: `yes` when P1 returns `duplicateLabelGroups` greater than 0.
- `duplicate-custom-titles`: the user's answer, `yes`, `no` or `unknown`. No admin change is made to
  create such a case (D-25).
- `standard-header-labels`: the standard labels P1 returned, in column order.

### When Appearance is not offered

Record the dark entries like this:

- `dark-mode-signal`: `dark-mode-offered: no`, `dark-branch: not-offered`, status `not observed`, and a
  fallback naming Phase 8 as blocked.
- `dark-mode-switch-mutation`: all three switches `not-observed`, status `not observed`.
- `dark-native-states`: `hover-selection-observed: no`, `focus-observed: no`, a `focus-fallback` naming
  Phase 8, and status `not observed`.
- `dark-table-topology`: `garden-identifiers: not-observed`, `root-terminus: not-observed`, and status
  `not observed`.

The verdict is then `block` with `blocked-consumers: phase-8`.

### Recon 2 Verdict

- `recon2-verdict` and `blocked-consumers` follow D-24. They are `block` and `phase-8` exactly when
  Appearance is not offered or the Garden identifiers differ in dark mode; otherwise `proceed` and
  `none`.
- `fixture-light-table`, `fixture-identity-region` and `fixture-dark-table`, and any `-code` and
  `-fallback` fields beside them, are filled only at admission in Plan 03 Task 2, never during the
  session.

## Interruption and resume

After every step, Claude updates `session-state` and `next-step` in `## Recon 2 Session Handoff`
(D-01). An interrupted session resumes at the recorded `next-step`. Before resuming, repeat
`P0-preconditions` and the persistence check. A reload clears every page-local marker, observer and
stash. If the interruption came during Step 2, 4 or 6, start that step again from `P4-install`.
