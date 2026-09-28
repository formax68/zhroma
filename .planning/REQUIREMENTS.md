# Requirements: Zhroma

**Defined:** 2026-09-25
**Milestone:** v1.1 Themes & Rules (ships to the Chrome Web Store as extension 1.0.0)
**Core Value:** Open a Zendesk view and know within one second which tickets are urgent — without reading a word.

v1.0 requirements (RECON-01…03, DETECT, TINT, LIVE, FAIL, CTRL, STORE-01…06) are archived in `.planning/milestones/v1.0-REQUIREMENTS.md`. New IDs continue existing prefixes where they fit (RECON-04+, STORE-07+). The former v2 placeholders map as follows: APPR-03 → DARK-01…05, APPR-04 → THEME-04, APPR-02 → covered by RULE-06 (custom hex).

Research inputs: `.planning/research/SUMMARY.md` (its "Conflicts to Resolve" section records the user decisions reflected below).

## v1.1 Requirements

Requirements for the 1.0.0 release. Each maps to exactly one roadmap phase.

### Upgrade safety

- [ ] **COMPAT-01**: In Zendesk's light interface, with the default theme and no rules, a fresh 1.0.0 install paints tints identical to 0.1.0
- [ ] **COMPAT-02**: An agent upgrading from 0.1.0 keeps their off/on setting, and Zhroma stores nothing new until they change a setting
- [ ] **COMPAT-03**: 1.0.0 requests no permission beyond `storage`, so the update shows no permission prompt and never disables the extension
- [ ] **COMPAT-04**: With default settings, every verified 0.1.0 behaviour — priority detection, liveness, the three-way diagnosis and the off/on switch — works unchanged

### Live DOM recon

- [x] **RECON-04**: How Zendesk signals light vs dark mode, and what changes on a mid-session switch, is recorded with evidence from a live account
- [x] **RECON-05**: Where the signed-in agent's name renders, and whether it matches the Assignee column text, is recorded from a live account
- [x] **RECON-06**: How rule-relevant columns render (Assignee, Requester, Group, Status, Type, Subject, Tags, a date column, a custom field), including empty placeholders, is recorded and captured as sanitised fixtures
  - Tags note (D-26, decided 2026-09-25): Zendesk views very likely cannot show Tags as a column; the live session checks the view's column picker, and a live-confirmed `tags-column: not-offered` in `referenced-cell-representation`, with its fallback (Tags rules resolve no header, so RULE-07 keeps them inactive, and RULE-F2 stays deferred), meets RECON-06 for Tags and does not block the phase.

### Dark mode

- [ ] **DARK-01**: Tints follow the agent's Zendesk appearance setting (Light, Dark, Match system), not the operating-system setting on its own
- [ ] **DARK-02**: When the agent switches Zendesk between light and dark mid-session, tints switch to the matching variant without a reload
- [ ] **DARK-03**: In dark mode, the four priority tints stay distinguishable from each other and from untinted rows, and ticket text stays readable (contrast ≥ 4.5:1)
- [ ] **DARK-04**: Zendesk's native hover, selection and focus states stay visible on tinted rows in dark mode
- [ ] **DARK-05**: When Zendesk's mode cannot be determined, Zhroma uses the light variant (0.1.0 behaviour)

### Themes

- [ ] **THEME-01**: Agent can choose a theme in the popup, and the open view re-colours immediately without a reload
- [ ] **THEME-02**: Presets are Classic (default; 0.1.0's colours in light mode), Catppuccin, Tokyo Night, Dracula, Nord, Gruvbox, Solarized and a colourblind-safe preset; a preset that fails the readability check does not ship
- [ ] **THEME-03**: Every theme provides the same eight named colour slots (red, orange, yellow, green, cyan, blue, purple, magenta) in light and dark variants, and maps the four priorities onto slots
- [ ] **THEME-04**: The colourblind-safe preset keeps the four priorities distinguishable under simulated deuteranopia and protanopia in both modes, with lightness ordered by priority
- [ ] **THEME-05**: The theme picker shows each theme's actual rendered tints, with the light and dark versions side by side
- [ ] **THEME-06**: The chosen theme persists across browser restarts
- [ ] **THEME-07**: Every bundled theme credits its source and licence, and the Gruvbox licence decision is recorded

### Rules

- [ ] **RULE-01**: Agent's rules colour rows based on any column shown in the view, identified by its header name
- [ ] **RULE-02**: A condition can use: is, is not, contains, does not contain, is empty, is not empty, is any of (comma-separated list)
- [ ] **RULE-03**: A rule combines conditions with Match ALL or Match ANY, plus one level of groups, each with its own ALL/ANY
- [ ] **RULE-04**: A rule's effect is one of: replace the tint with a colour, remove the tint ("no colour"), or add a left-edge stripe
- [ ] **RULE-05**: Rules apply in order; the first matching tint rule sets the row's tint (falling back to the priority tint), and independently the first matching stripe rule sets the stripe
- [ ] **RULE-06**: A rule's colour is either a named theme slot, which re-colours when the theme changes, or a fixed custom hex colour
- [ ] **RULE-07**: A condition on a column that is not in the view never matches and is never treated as empty; a present but empty cell counts as empty
- [ ] **RULE-08**: If a header appears more than once in a view, conditions on that column are inactive in that view
- [ ] **RULE-09**: Rules never colour group rows
- [ ] **RULE-10**: Rule colours and stripes re-apply through sorting, refreshing, view switching, pagination and scrolling, just like priority tints
- [ ] **RULE-11**: The stripe never hides Zendesk's selection indicator and never shifts layout
- [ ] **RULE-12**: Rules apply only on views 0.1.0 supports (English current Agent Workspace), and switching Zhroma off removes rule colours and stripes too
- [ ] **RULE-13**: With rules active, a large view stays as responsive as it is with 0.1.0, within a stated worst-case budget
- [ ] **RULE-14**: The toolbar keeps the three v1 states; when rules are colouring a view that has no Priority column, the popup says so (e.g. "Your rules are still colouring this view")
- [ ] **RULE-15**: The popup lists the rules active on the current view, with their colours

### Rule editor

- [ ] **EDIT-01**: Agent can open an options page from the popup ("Edit rules…")
- [ ] **EDIT-02**: Agent can create, edit and delete rules, and can undo a delete
- [ ] **EDIT-03**: Each rule reads as a one-line sentence, and the list explains that the first matching rule wins
- [ ] **EDIT-04**: Agent can reorder rules with up/down buttons and by drag-and-drop
- [ ] **EDIT-05**: Agent can turn an individual rule on or off without deleting it
- [ ] **EDIT-06**: The column field offers standard Zendesk column names and accepts free text
- [ ] **EDIT-07**: The colour picker shows the current theme's eight slots plus a "Custom…" hex field, and warns when a custom colour is hard to read on either surface
- [ ] **EDIT-08**: Each rule shows its live match count in the open Zendesk view, or why it is inactive there (e.g. "needs a Group column")
- [ ] **EDIT-09**: Agent can add starter rules (e.g. "Assigned to me") in one click; none are enabled on install
- [ ] **EDIT-10**: Saved changes take effect in open Zendesk tabs without a reload; conflicting edits from two windows fail visibly instead of silently losing one

### Identity

- [ ] **IDENT-01**: A condition can test "is me" as a symbolic value, so shared rules work for whoever imports them
- [ ] **IDENT-02**: When the agent adds their first "is me" condition, the options page shows a notice and offers the detected name ("Zendesk shows you as X. Use this name?"); confirming stores it
- [ ] **IDENT-03**: Agent can type or correct their name at any time, and a typed name always wins
- [ ] **IDENT-04**: Zhroma stores only a name the agent confirmed or typed; a detected name is never saved without confirmation
- [ ] **IDENT-05**: When no name is known, "is me" never matches, and the editor and popup show that identity is unknown
- [ ] **IDENT-06**: Detection runs only while an enabled rule uses "is me", and "is me" matches only the exact name, never part of a name

### Settings data

- [ ] **DATA-01**: Theme, rules and identity are stored only on this device (`chrome.storage.local`); they are never synced or sent anywhere
- [ ] **DATA-02**: Agent can export their rules and theme to a JSON file, which never includes their name
- [ ] **DATA-03**: Agent can import a settings file and preview what will change before applying it
- [ ] **DATA-04**: On import, the agent chooses to replace their rules or add the imported rules to them; import never changes their stored name
- [ ] **DATA-05**: An invalid, oversized or malicious file is rejected with a clear message and changes nothing
- [ ] **DATA-06**: Agent can undo the most recent import in one step
- [ ] **DATA-07**: Agent can reset all settings to defaults

### Release

- [ ] **STORE-07**: Before 1.0.0 is published, the privacy policy, store listing and dashboard privacy disclosures describe the settings it stores locally, including the agent's name
- [ ] **STORE-08**: 1.0.0 is published as an update to the existing listing with deferred publishing, only after the updated policy is live and verified
- [ ] **STORE-09**: Listing screenshots show a real rule-coloured view and a dark-mode view
- [ ] **STORE-10**: A rollback build (0.1.0 behaviour with a bumped version) is ready before 1.0.0 publishes
- [ ] **STORE-11**: The smoke checklist, extended with dark-mode and rule checks, plus a full v1 regression pass, runs on the release-candidate bytes before submission

## Decisions recorded during scoping

These user decisions (2026-09-25) constrain the requirements above:

- **Colour delivery:** colours are resolved in JavaScript and written as CSS custom properties with 0.1.0-literal fallbacks; `minimum_chrome_version` stays at 106 (research Conflict 1, option A)
- **Identity:** detect, then confirm once; only a confirmed or typed name is persisted; one global identity (Conflict 2)
- **Default behaviour wording:** "identical to 0.1.0" applies to the light interface with default settings; dark mode uses the same hues with dark-tuned strengths (Conflict 3)
- **Rule logic:** Match ALL / Match ANY with one level of groups, plus "is any of"; negation stays inside single conditions (Conflict 4)
- **Status:** toolbar and the three v1 diagnoses stay Priority-only; rule state appears as a separate popup line (Conflict 5)
- **Urgent:** no guard; the first matching tint rule wins even over an Urgent row
- **Rules follow the English-only gate** of 0.1.0 in 1.0.0

## Future Requirements

Deferred; tracked but not in the v1.1 roadmap.

- **RULE-F1**: Date and relative-time operators (e.g. "Updated more than 2 days ago") — needs locale-aware parsing and further recon
- **RULE-F2**: Whole-word tag matching — pending recon of how Tags render
- **RULE-F3**: Rules scoped to specific views or Zendesk subdomains
- **RULE-F4**: Regex operator — ReDoS risk and untrusted patterns
- **EDIT-F1**: Duplicate a rule
- **THEME-F1**: Custom theme editor
- **REACH-01**: Priority values recognised in the most common non-English Zendesk agent locales
- **REACH-02**: Tinting extends to search results and org/user ticket lists
- **REACH-03**: Agent can report a breakage from the popup via a pre-filled GitHub issue
- **APPR-01**: Coloured priority pill as an alternative treatment

## Out of Scope

| Feature | Reason |
|---------|--------|
| Zhroma restyling Zendesk (its own dark mode or whole-UI theme) | Themes recolour only Zhroma's tints and marks; restyling the host means fighting Zendesk's entire stylesheet |
| Rules on fields not shown as view columns / Zendesk API data | Needs auth and broader permissions; the permission set stays `storage` only |
| `chrome.storage.sync` | Rules can hold names and field values; sync routes them through the user's Google account. File export/import covers moving machines |
| Nesting deeper than one group level; NOT-groups | Deep nesting loses users; one level plus DNF expresses any rule; atomic negation keeps missing-column semantics simple |
| Stacked stripes | One stripe channel, first match wins — multiple stripes become unreadable |
| Recording page values or column names for suggestions | Privacy: page data stays in the content script; a static list of standard column names is used instead |
| Per-row tooltips injected into Zendesk | Adds DOM surface Zendesk may clobber; the popup legend and match counts cover explanation |
| Pre-enabled example rules | A fresh install must behave like 0.1.0; starter rules are opt-in only |
| Rule-aware toolbar states | Keeps the accepted three v1 states untouched; rule state lives in the popup |
| Per-subdomain identity | Keying by host stores a list of tenants visited; one global identity with an override is enough |
| Guard preventing rules from recolouring Urgent | User decision: the first matching tint rule wins |
| A bundler (WXT/Vite) or TypeScript emit | Would put generated output between reviewed source and the shipped zip, breaking the "shipped bytes = repo bytes" evidence model |
| Raising `minimum_chrome_version` | Not needed with JS-resolved colours; a raise would strand users below the floor on 0.1.0 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMPAT-01 | Phase 7 | Pending |
| COMPAT-02 | Phase 7 | Pending |
| COMPAT-03 | Phase 7 | Pending |
| COMPAT-04 | Phase 7 | Pending |
| RECON-04 | Phase 6 | Complete |
| RECON-05 | Phase 6 | Complete |
| RECON-06 | Phase 6 | Complete |
| DARK-01 | Phase 8 | Pending |
| DARK-02 | Phase 8 | Pending |
| DARK-03 | Phase 8 | Pending |
| DARK-04 | Phase 8 | Pending |
| DARK-05 | Phase 8 | Pending |
| THEME-01 | Phase 8 | Pending |
| THEME-02 | Phase 8 | Pending |
| THEME-03 | Phase 8 | Pending |
| THEME-04 | Phase 8 | Pending |
| THEME-05 | Phase 8 | Pending |
| THEME-06 | Phase 8 | Pending |
| THEME-07 | Phase 8 | Pending |
| RULE-01 | Phase 9 | Pending |
| RULE-02 | Phase 9 | Pending |
| RULE-03 | Phase 9 | Pending |
| RULE-04 | Phase 9 | Pending |
| RULE-05 | Phase 9 | Pending |
| RULE-06 | Phase 9 | Pending |
| RULE-07 | Phase 9 | Pending |
| RULE-08 | Phase 9 | Pending |
| RULE-09 | Phase 9 | Pending |
| RULE-10 | Phase 9 | Pending |
| RULE-11 | Phase 9 | Pending |
| RULE-12 | Phase 9 | Pending |
| RULE-13 | Phase 9 | Pending |
| RULE-14 | Phase 9 | Pending |
| RULE-15 | Phase 9 | Pending |
| EDIT-01 | Phase 10 | Pending |
| EDIT-02 | Phase 10 | Pending |
| EDIT-03 | Phase 10 | Pending |
| EDIT-04 | Phase 10 | Pending |
| EDIT-05 | Phase 10 | Pending |
| EDIT-06 | Phase 10 | Pending |
| EDIT-07 | Phase 10 | Pending |
| EDIT-08 | Phase 10 | Pending |
| EDIT-09 | Phase 10 | Pending |
| EDIT-10 | Phase 10 | Pending |
| IDENT-01 | Phase 10 | Pending |
| IDENT-02 | Phase 10 | Pending |
| IDENT-03 | Phase 10 | Pending |
| IDENT-04 | Phase 10 | Pending |
| IDENT-05 | Phase 10 | Pending |
| IDENT-06 | Phase 10 | Pending |
| DATA-01 | Phase 7 | Pending |
| DATA-02 | Phase 10 | Pending |
| DATA-03 | Phase 10 | Pending |
| DATA-04 | Phase 10 | Pending |
| DATA-05 | Phase 10 | Pending |
| DATA-06 | Phase 10 | Pending |
| DATA-07 | Phase 10 | Pending |
| STORE-07 | Phase 11 | Pending |
| STORE-08 | Phase 11 | Pending |
| STORE-09 | Phase 11 | Pending |
| STORE-10 | Phase 11 | Pending |
| STORE-11 | Phase 11 | Pending |

**Coverage:**

- v1.1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0 ✓

Per phase: Phase 6: 3 · Phase 7: 5 · Phase 8: 12 · Phase 9: 15 · Phase 10: 22 · Phase 11: 5

---
*Requirements defined: 2026-09-25*
*Last updated: 2026-09-25 after v1.1 roadmap creation (traceability mapped)*
