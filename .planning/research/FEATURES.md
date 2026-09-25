# Feature Research: v1.1 Themes & Rules

**Domain:** A browser extension that visually augments a third-party support-desk SPA (Zendesk Agent Workspace ticket views). This milestone adds dark-mode following, preset colour themes built on named slots, and user-written conditional colouring rules.
**Researched:** 2026-09-25
**Confidence:** MEDIUM overall. Comparable-product behaviour (Airtable, Notion, Jira, Google Sheets, Outlook, Zendesk's own views and triggers) was cross-checked across several sources and agrees. Theme and palette hex values come from each project's official spec pages. Anything about Zendesk's *rendered* DOM for the new work is LOW and needs live recon: the dark-mode signal, the signed-in agent's name, and how non-Priority cells are formatted. Confidence tiers come from the `classify-confidence` seam: single-source web findings are LOW, cross-verified web findings are MEDIUM.

**Scope:** This file covers only the v1.1 additions. Priority tinting, liveness, the three-way status, the missing-Priority hint and the off/on switch are already built (see `.planning/milestones/v1.0-research/FEATURES.md`). They appear here only as dependencies.

---

## Headline Findings (read these before the tables)

**1. Every comparable product uses the same precedence model: ordered rules, first match wins, drag to reorder.** Airtable record colouring ("the record will receive the color of the first condition it matches, starting from the top"), Notion conditional colour ("inherit the color of the highest rule that it matches"), Jira card colours ("each issue will be colored according to the first query that it matches"), Google Sheets conditional formatting (top-down, first true rule sets the format) and new Outlook conditional formatting ("the top rule prevails") all work this way. The user-confirmed "first matching replace-rule wins" is the industry norm, not a design risk. Google Sheets adds one refinement worth copying: a later rule can still set a property the first rule didn't touch. Mapped to Zhroma, that means **two independent channels, tint and mark, each resolved first-match-wins.** [MEDIUM]

**2. The left-edge stripe is an established "second signal", not an invention.** Jira draws its card colour as a left-edge stripe. Airtable grid views show a colour flag at the left of the primary field, and Kanban cards get a coloured line on their left side. The user-confirmed "add a mark" effect has direct precedent, and agents who use Jira will read it correctly without being told. [MEDIUM]

**3. Support staff already know one specific AND/OR model: Zendesk's own.** Zendesk views and triggers use two flat buckets, **"Meet ALL of the following conditions"** and **"Meet ANY of the following conditions"**, combined as *(every ALL condition) AND (at least one ANY condition)*. Team leads build views and triggers with this every week. General filter-UX research says the same from the other side: deep nested AND/OR trees intimidate casual users, who report "I have no clue where I am right now. Let me just clear everything and start over." **Recommendation:** meet the "full AND/OR groups" requirement with one level of grouping. That means a top-level ALL/ANY switch plus condition groups that each have their own ALL/ANY switch, the way Airtable does it. Do not offer arbitrary nesting depth. One level of groups expresses every realistic support rule. [MEDIUM]

**4. Zendesk exposes its colour scheme to apps but not to extensions.** Zendesk apps (ZAF) receive `colorScheme` (`"light"`/`"dark"`) and a `colorScheme.changed` event, because agents can switch modes mid-session and Zendesk says the change applies "immediately". A content script cannot use ZAF. No DOM attribute for the host scheme is documented. Agents choose from three settings: Light, Dark, or Match system appearance. So `prefers-color-scheme` covers only one of the three. **The dark-mode signal must be found by live recon.** The robust fallback is to measure the computed background luminance of the view table (dark surface is roughly `#151A1E`). [LOW for the DOM signal; MEDIUM for the behaviour]

**5. Editor themes are not uniform, so "named slots" needs a canonical Zhroma slot set with filled gaps.** Canonical ANSI-16 has **no orange**, yet the current palette and every priority mapping need one. Dracula has **no blue** (its spec maps AnsiBlue to purple). **Nord has no official light theme**, only community ones. Solarized uses the *same* eight accents in both modes. Gruvbox uses "bright" accents on dark and "faded" accents on light. Catppuccin (Latte, Frappé, Macchiato, Mocha) and Tokyo Night (Night, Storm, Moon, Day) ship official light flavours. Dracula now has the official light Alucard. So a preset is a hand-authored table of 8 slots × 2 modes. Where a theme lacks a value, Zhroma derives one and must label it as derived. [MEDIUM]

**6. Colourblind-safe palettes are validated as opaque swatches on white. Zhroma paints 8–14% translucent tints.** Okabe-Ito, Paul Tol and the IBM palette are qualitative (unordered) schemes whose distinctness guarantees hold at full opacity. Tol's guidance is written for white backgrounds, and his qualitative schemes are to be "used as given". At 0.1.0's alpha levels (`0.08`–`0.14`), four translucent hues on `#151A1E` converge sharply. **The colourblind preset needs its own alpha (and probably its own lightness ordering) and has to be checked by simulating colour-vision deficiency (CVD) on screenshots of real tinted rows, not on swatches.** [MEDIUM]

**7. "Exactly like 0.1.0" and "readable in dark mode" conflict for the default theme.** 0.1.0 painted the same `rgb(... / 0.08–0.14)` tints on both surfaces. If dark mode has to be readable, the default theme's dark variant has to differ from 0.1.0 on dark surfaces. **Record the decision:** the zero-setup guarantee means byte-identical tints in *light* mode and "same hues, readable" in dark mode. Otherwise a verifier will call the milestone's own dark-mode fix a regression. [HIGH that the conflict exists, since it follows from `extension/zhroma.css`]

---

## Feature Landscape

Categories: **A** Dark mode, **B** Themes and palettes, **C** Rules engine, **D** Rule editor UX, **E** Identity ("me"), **F** Storage, export and import. "Depends on (existing)" names the v1.0 feature or code the item builds on or changes.

### Table Stakes (Users Expect These)

| # | Feature | Why Expected | Complexity | Depends on (existing) / Notes |
|---|---------|--------------|------------|-------------------------------|
| A1 | **Detect Zendesk light/dark from the host page, not the OS** | Zendesk offers Light, Dark and Match-system. `prefers-color-scheme` is only correct for the third. | MEDIUM | Content-script reconcile loop. The signal needs live recon (Finding 4). Fallback: computed luminance of the table surface. |
| A2 | **React to a mid-session switch without reload** | Zendesk applies the switch "immediately"; Match-system flips when the OS does. | LOW–MEDIUM | Existing `MutationObserver`. Add attribute observation on `html`/`body` (or whichever node carries the signal) plus a `matchMedia` change listener. |
| A3 | **Tints and marks readable on the dark surface** | The core glance test must pass in both modes. A light-tuned alpha tint disappears on `#151A1E`. | MEDIUM | `zhroma.css` currently hard-codes one value per priority. Move to CSS custom properties with per-mode values. Dark mode needs higher alpha and/or lighter hues. |
| A4 | **Host states still win in dark mode** (hover, selected, status dot) | Already a v1 constraint. Dark-mode host states have different colours and must be rechecked. | LOW | v1 direct-cell tint approach. Recheck only. |
| A5 | **Zhroma never restyles Zendesk** | User-confirmed. The third-party "Zendesk Dark Mode" extension sits at 2.6/5. | — | Constraint, not a feature. Listed so it can't creep in. |
| B1 | **Theme picker in the popup, applied live** | Every theme picker (VS Code, Dark Reader, Catppuccin userstyles) applies on selection. Zest's "refresh your page to see changes" is its weakest point. | MEDIUM | Popup (currently one switch, 17rem wide), `chrome.storage.onChanged` → content script. No refresh, ever: the same differentiator as v1. |
| B2 | **Swatch strip per theme showing its four priority colours** | Users choose palettes by colour, not name. A name-only list is unusable. | LOW | Popup. Swatches must be the *rendered tint* for the current Zendesk mode (or split light/dark), not the raw accent hex, or the preview lies. |
| B3 | **Default theme = 0.1.0 palette; fresh install unchanged** | User-confirmed zero-setup promise. | LOW | `zhroma.css` values become the "Zhroma Classic" preset. See Finding 7 for the dark-mode caveat. |
| B4 | **Light and dark variants follow Zendesk automatically** | User-confirmed. VS Code's `preferredLight/DarkColorTheme` and Catppuccin's light-flavour/dark-flavour pairing set the norm: one choice, two renderings. | MEDIUM | A1 + A2. A preset is one entry with both variants, not two entries the agent pairs by hand. |
| B5 | **Canonical named slot set** (red, orange, yellow, green, cyan, blue, purple, magenta) filled for every preset in both modes | Rules reference slots. A slot missing in one theme would leave a rule colourless after a theme switch. | MEDIUM (data authoring) | New data module. Finding 5: fill Dracula-blue and Nord-light, and mark derived values in source comments. |
| B6 | **Colourblind-safe preset** | Carried from v1's deferred accessibility decision, now user-confirmed in scope. | MEDIUM | See the palette recommendation below. Needs CVD simulation on real tinted rows. |
| B7 | **The Priority column text stays visible** (colour is never the only cue) | WCAG 1.4.1: colour must not be the sole means of conveying information. Zhroma already complies because it tints and never hides the text. | — | Constraint on rules: a rule effect must never hide cell content. |
| C1 | **Conditions on any column shown in the view, keyed by header text** | User-confirmed. It's the same model as Priority: find the header, read the cell. | MEDIUM | Generalises the v1 header scan (`content.js` snapshot, which today finds only the Priority index). Header match is trimmed and case-insensitive. Duplicate headers make the column ambiguous, so the rule is inactive. |
| C2 | **Text operators: is, is not, contains, does not contain, is empty, is not empty** | This is Zendesk's own vocabulary ("Is", "Is not", "Contains at least one/none") and the Airtable/Notion baseline. | LOW | Case-insensitive, whitespace-normalised comparison. `contains` is a substring match. |
| C3 | **"Is me" operator on a people column (Assignee)** | User-confirmed. Jira has `currentUser()`; in Zendesk views "(current user) is the agent who is currently viewing". | LOW once E1 exists | Store it **symbolically** (`op: "is-me"`), never as the literal name. That keeps exported rules shareable (see F3). |
| C4 | **Ordered rules; first matching replace-rule wins over the priority tint** | User-confirmed. Matches every product surveyed (Finding 1). | LOW | Priority tint becomes the bottom layer ("rule zero"). A row with no priority can still be tinted by a replace-rule. |
| C5 | **Mark effect (left-edge stripe) that keeps the tint** | User-confirmed. Jira and Airtable precedent (Finding 2). | MEDIUM | Separate attribute/CSS channel. Must survive host hover/selected states and not shift layout, so an inset box-shadow is preferred to borders. |
| C6 | **Two channels, each first-match-wins** (one tint, one stripe per row) | Answers "what if two mark-rules match?" predictably. Mirrors Sheets' "a later rule only fills properties not already set". | LOW | Stacking stripes is an anti-feature (see below). |
| C7 | **Rule colour = theme slot or fixed hex** | User-confirmed. Slots re-colour on theme change; hex is the escape hatch. | LOW–MEDIUM | A fixed hex gets the same per-mode alpha treatment as slots so it stays readable in both modes. Show a contrast warning when it's poor on either surface. |
| C8 | **A rule whose column isn't in this view is inactive, not wrong** | The missing-Priority hint set this bar: never mis-colour, and tell the agent the one-click fix. | MEDIUM | **Three-valued evaluation**: a missing column is *unknown*, not *empty*. "Is empty" and "is not X" must not match on an absent column. ANY groups can still match on other branches (Kleene logic). |
| C9 | **Hint parity: popup names the inactive rules and the missing column** | Same self-service pattern as v1 ("Add a Priority column…"). Silently inactive rules read as "rules are broken". | MEDIUM | **Changes the existing status model.** Today a view without Priority is `missing` (hint shown, nothing tinted). With rules, such a view can legitimately be "working" (e.g. only Assignee rules apply). The three-way state and the popup copy need a redesign, not an addition. |
| C10 | **Rules re-evaluate through liveness** (sort, refresh, pagination, view switch, scroll) | v1 liveness is table stakes; rules colouring once and going stale would look broken within seconds. | MEDIUM | Same reconcile pass as priority. Rule evaluation is cheap (≤ ~100 rows × a few conditions), but it must not add a second observer. |
| C11 | **Group/section header rows and blank cells are never matched** | Grouped views contain spanning header rows (see the `grouped-long` fixture). | LOW | Existing row-shape guards. |
| C12 | **Rules edited on the options page apply to an open Zendesk tab live** | Zest's refresh requirement is the gap. Edit, glance, adjust is how people tune rules. | LOW | `storage.onChanged` in the content script. |
| D1 | **Options page listing rules in order, each as a readable sentence** | Outlook, Sheets and Airtable all show the rule list first and the editor second. A one-line summary ("Stripe **blue** when Assignee is me and Status is Open") lets agents audit rules without opening them. | MEDIUM | New `options_ui` page (no permission, no review impact). Opened from the popup via `chrome.runtime.openOptionsPage()`. |
| D2 | **Condition rows read as a sentence: [column] [operator] [value]** | The Zendesk trigger editor pattern agents already use. | MEDIUM | Column field: free text with suggestions (see D8). Operator: a short fixed list. Value: text, or nothing for "is empty"/"is me". |
| D3 | **Top-level Match ALL / ANY switch plus one level of groups** | Finding 3: expresses Zendesk's own ALL+ANY model and Airtable-style groups without a nesting maze. | MEDIUM | Keep "Add condition" and "Add group" visually separate (group is structure, not content). Groups cannot contain groups. |
| D4 | **Reorder with drag *and* move up/down buttons** | Order is semantics (C4). Outlook uses Move Up/Down, Airtable uses drag. Buttons are the keyboard-accessible path. | LOW–MEDIUM | v1 popup already invested in keyboard focus handling; hold that bar. |
| D5 | **Per-rule enable/disable toggle** | Standard in mail rule UIs. Lets agents test by elimination without deleting work. | LOW | — |
| D6 | **Delete with undo (or confirm)** | Rules are hand-built; losing one to a stray click is a one-star review. | LOW | — |
| D7 | **Colour picker = slot swatches from the current theme, plus a "Custom…" hex field** | Named slots are the primary path (Finding 5). Hex is the escape hatch, not the default. | LOW–MEDIUM | Swatches render in the current theme. Selecting a slot stores the slot name, never its hex. Native `<input type="color">` plus a hex text field. |
| D8 | **Column suggestions from headers seen in the agent's views** | The options page is not inside Zendesk and can't know the columns. Free text alone invites typos that make rules silently inactive. | MEDIUM | The content script records **header names only** (view configuration, not ticket data) in `storage.local`. Never record cell values. Privacy policy text must mention it (see F5). |
| E1 | **Auto-detect the signed-in agent's display name** | User-confirmed. Keeps "is me" zero-setup. | MEDIUM–HIGH | **Needs live recon.** No public documentation says where the name appears in the Agent Workspace DOM. `/api/v2/users/me` exists, but calling it is an API/network call, which the constraints rule out. Must match the name *as rendered in the Assignee column*, not the email. |
| E2 | **Identity editable; a manual value always beats detection** | User-confirmed. Detection can fail or Zendesk can change the DOM. | LOW | Detection must never overwrite a manual value. |
| E3 | **Identity stored per Zendesk subdomain** | Agents working several tenants (`acme.zendesk.com`, `acme-eu.zendesk.com`) can have different display names. One global "me" silently fails on the second tenant. | LOW | Key by `location.hostname`. |
| E4 | **Visible "is me" state when identity is unknown** | A rule using "is me" with no identity must be shown as inactive in the options page and popup, not silently never match. | LOW | Same inactive-rule surface as C9. |
| F1 | **All settings in `chrome.storage.local`, schema-versioned** | User-confirmed. Existing permission is `storage` only; the local quota (10 MB) is ample. | LOW | Add a `schemaVersion` and a migration from 0.1.0's single enabled key, which must be preserved on upgrade to 1.0.0. |
| F2 | **Export to a JSON file** | User-confirmed. Dark Reader, Stylus and uBlock all export JSON. | LOW | `Blob` + `<a download>` from the options page. **No `downloads` permission needed.** |
| F3 | **Import from a file with a summary before applying** ("5 rules, theme Nord") | Stylus shows added/updated counts with Undo. Dark Reader and uBlock both have bug trails about imports that silently drop part of the state. | MEDIUM | `<input type="file">`, no permission. Atomic: all or nothing. |
| F4 | **Import is strictly validated untrusted input** | A file from a teammate or the internet goes straight into the rules engine. | MEDIUM | Whitelist operators and effects, validate hex format and slot names, cap string lengths and rule count, reject unknown future `version` with a clear message, migrate older versions. Never `eval`. |
| F5 | **Privacy policy and store disclosures updated for stored names/values** | v1 established that reading page content counts as handling user data, even locally. v1.1 now *stores* an agent's own name, header names, and rule values (which may contain customer/agent names). | LOW (text) | STORE-04 policy page and the store Privacy tab need revision before 1.0.0 ships. |
| F6 | **Reset to defaults** | The zero-setup promise implies a one-click way back to exactly 0.1.0 behaviour. | LOW | Restores the Classic theme, no rules, and keeps (or asks about) identity. |

### Differentiators (Competitive Advantage)

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| A6 | **Theme preview on both surfaces at once** in the popup (a mini light row and a mini dark row) | Shows the agent the theme will work when they switch modes, without switching. No competitor does this. | LOW | Two tiny static mock rows. Pure CSS from the same custom properties. |
| B8 | **Well-known presets with official light *and* dark variants** (Catppuccin Latte/Mocha, Tokyo Night Day/Night, Dracula/Alucard, Solarized, Gruvbox) | Agents who live in these themes in their editor get the same colour language in Zendesk. Zest offers a colour picker and nothing more. | MEDIUM (data) | Nord needs a derived light variant. Label it "Nord (light variant by Zhroma)". |
| C13 | **"Is any of" operator** (comma-separated values) | "Group is any of Tier 2, Escalations" replaces a whole ANY-group, which is the most common reason a non-technical user needs OR at all. | LOW | Reduces reliance on D3 groups. |
| C14 | **"No colour" as a replace-rule colour** (mute) | "Status is Solved/Pending → no tint" de-emphasises rows so hot rows stand out more. Works with the glance test rather than against it. | LOW | It's just another replace value, so it respects first-match precedence. |
| C15 | **"Contains word" for tag-like columns** | Substring "vip" matches "vip_pending". Tag columns need whole-token matching. | LOW | Only worth it if recon shows a Tags column renders space-separated tokens. |
| D9 | **Live match counts per rule for the open view** ("matches 7 rows here" / "inactive here: needs Group column") | The preview pattern that makes rule builders learnable. It answers "did I write it right?" without switching tabs. | MEDIUM | The content script computes counts and publishes them through the background worker's existing tab-scoped state. No new permission, as long as the content script pushes the data rather than the options page querying tabs. |
| D10 | **Duplicate rule** | Airtable's "duplicate a color and all its conditions" makes families of similar rules fast. | LOW | — |
| D11 | **Starter rule templates** ("Assigned to me → stripe", "Unassigned → stripe", "Solved/Pending → mute") | Most agents will not write a rule from scratch. One click turns the feature from "configure" into "choose". It preserves the zero-config spirit. | LOW | Templates are inserted disabled or enabled at the agent's choice. They never ship pre-enabled on a fresh install (B3). |
| D12 | **Popup legend of active rules and colours** | Once rules exist, a colour no longer means only priority. A legend answers "why is this row purple?" without touching Zendesk's DOM. | LOW–MEDIUM | Replaces the v1.x "legend" idea from v1 research. Better in the popup than injected into the page. |
| F7 | **Import choice: Replace all / Add to my rules** | Supports the real team-lead workflow of handing a rule pack to the team without wiping each agent's personal rules. Stylus merges; Dark Reader replaces. Offering both covers both use cases. | LOW–MEDIUM | Add = append at the end, with new rule IDs. Identity is never exported by default, and "is me" stays symbolic, so a shared pack works for every importer. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Arbitrary-depth nested AND/OR groups** | "Full boolean power" | Usability research: users get lost and start over. Support staff know Zendesk's flat ALL+ANY. Deep trees also make the one-line rule summary (D1) unreadable. | One level of groups (D3) plus "is any of" (C13). |
| **Regex / formula conditions** (Sheets "custom formula") | Power users | Unusable for non-technical agents, and a pathological pattern can stall the reconcile pass on every mutation. Imported regexes are untrusted input. | The fixed operator list. Revisit only on repeated demand. |
| **Date/time arithmetic** ("Updated older than 4 h") in v1.1 | SLA-ish rules are the most-wanted rule type | Zendesk renders dates as display text. Current-year dates omit the year; formats depend on the profile locale; some cells may be relative ("2 hours ago"). Parsing rendered text is locale-fragile and needs recon Zhroma doesn't have (v1 fixtures sanitise every non-Priority cell). | v1.1: text operators only. Agents can add Zendesk's own "Next SLA breach" column, whose badge already carries the signal. Flag date operators for a later milestone after recon. |
| **Stacked multiple stripes / multiple marks per row** | "Show every rule that matched" | Five stripes stop being a glanceable signal, it eats cell space, and it breaks the one-sentence precedence story. | One tint plus one stripe per row, each first-match-wins (C6). Popup legend (D12) explains the rest. |
| **Custom theme editor** (edit all slots, save your own theme) | "Let me make my own" | 8 slots × 2 modes × contrast checking is a whole product. The fixed-hex escape hatch on rules already covers the "I need exactly this colour" case. | Presets plus per-rule hex. Revisit if reviews ask. |
| **Syncing via `chrome.storage.sync`** | Convenience across machines | Already rejected: rule values and names would route through the user's Google account. | Export/import (F2, F3). |
| **Rules on fields not shown as columns** | "Colour by a field I don't display" | Needs the API, auth and broader permissions. Already out of scope. | The inactive-rule hint (C9) tells the agent to add the column, the same as v1 Priority. |
| **Recording cell values to power value suggestions** | Autocomplete for the value field | Stores ticket and customer data off-page, even if locally. It breaks the "reads, acts, keeps nothing" model and complicates the privacy disclosures. | Suggest *column names* only (D8). Live match counts (D9) give feedback without storing values. |
| **Per-row tooltips or "why coloured" badges injected into Zendesk** | Explainability | New DOM writes inside Zendesk's rows, which is exactly where v1 worked hardest to stay minimal. Title attributes also collide with Zendesk's own. | Popup legend (D12) and match counts (D9). |
| **A Zhroma dark mode / restyling Zendesk** | Historically the most-requested Zendesk extension feature | Zendesk ships it natively and it is on by default. Explicitly out of scope. | Follow Zendesk's mode (A1–A3). |
| **Detecting identity by calling `/api/v2/users/me`** | Reliable, documented | An API call with session cookies is a network request, which contradicts the "no API, no network calls" constraint and the store story. | DOM detection plus manual override (E1, E2). |
| **Pre-enabled example rules on install** | "Show off the feature" | Violates "a fresh install behaves exactly like 0.1.0". | Opt-in templates (D11). |
| **Per-view or per-subdomain rule scoping in v1.1** | Custom fields differ per tenant | Adds a scope dimension to every rule and to import/export before anyone has asked. The inactive-rule handling already makes a rule harmless where its column doesn't exist. | Global rules. Identity alone is per-subdomain (E3). Revisit scoping later. |

---

## Palette Recommendations (for B5, B6, B8)

**Canonical slot set:** `red, orange, yellow, green, cyan, blue, purple, magenta`. Eight slots, the ANSI set plus orange, minus black and white. Each preset stores two maps, `light` and `dark`, and a `priorities` mapping that is normally `Urgent→red, High→orange, Normal→yellow, Low→green`.

| Preset | Light source | Dark source | Gaps Zhroma must fill |
|---|---|---|---|
| Zhroma Classic (default) | 0.1.0 values, byte-identical | Same hues, retuned for `#151A1E` | cyan/blue/purple/magenta slots are new |
| Catppuccin | Latte (official): red `#D20F39`, peach `#FE640B`, yellow `#DF8E1D`, green `#40A02B` | Mocha (official): `#F38BA8`, `#FAB387`, `#F9E2AF`, `#A6E3A1` | none (peach = orange, mauve = purple, pink = magenta) |
| Tokyo Night | Day (official) | Night/Storm/Moon (official): red `#f7768e`, green `#9ece6a`, yellow `#e0af68` | pick one dark flavour |
| Dracula | Alucard (official): `#CB3A2A`, `#A34D14`, `#846E15`, `#14710A` | Dracula: `#FF5555`, `#FFB86C`, `#F1FA8C`, `#50FA7B` | **blue** (spec maps AnsiBlue to purple) |
| Nord | **none official**, derive from Aurora on Snow Storm | Aurora: `#bf616a`, `#d08770`, `#ebcb8b`, `#a3be8c`, purple `#b48ead`, Frost blues | **light variant**, magenta |
| Gruvbox | "faded" accents (official light) | "bright" accents: red `#FB4934`, orange `#FE8019`, yellow `#FABD2F`, green `#B8BB26` | none |
| Solarized | same 8 accents in both modes (by design): yellow `#b58900`, orange `#cb4b16`, red `#dc322f`, green `#859900`, … | same | none. It's the easiest preset. |
| Colourblind-safe | see below | see below | — |

**Colourblind-safe preset.** Recommended: an **IBM-palette-based ordered mapping**, *Urgent → magenta `#DC267F`, High → orange `#FE6100`, Normal → gold `#FFB000`, Low → ultramarine `#648FFF`*. The reasoning: it puts Low on the blue side of the blue–orange axis, which survives deuteranopia and protanopia, and it steps lightness monotonically across the warm levels. Alternative: Okabe-Ito, *Urgent vermilion `#D55E00`, High orange `#E69F00`, Normal sky blue `#56B4E9`, Low bluish green `#009E73`*. Neither is a validated *ordered* scheme. Both are qualitative palettes being used for ordered data, so **treat the mapping as a hypothesis until checked with CVD simulation on screenshots of real translucent rows in both modes** (Finding 6). Expect this preset to need a higher alpha than the others. It is also the strongest argument for letting any theme use the stripe mark, since shape and position are a non-colour cue.

---

## Feature Dependencies

```
[A1 Host light/dark detection] ──requires──> [live recon of Zendesk DOM signal]
    └──required by──> [A2 live switch] ──required by──> [B4 auto light/dark variants]
    └──required by──> [A3 readable tints]  ──required by──> [B3 default theme = 0.1.0 (light) + retuned dark]

[CSS custom-property palette seam (replaces hard-coded zhroma.css values)]
    ├──required by──> [A3], [B1 live theme switch], [C7 slot/hex colours], [C5 stripe mark]
    └──required by──> [A6 dual-surface preview]

[B5 canonical slot set + preset data]
    ├──required by──> [B1/B2 picker + swatches]
    ├──required by──> [B6 colourblind preset], [B8 editor presets]
    └──required by──> [C7 rule colour = slot], [D7 slot swatch picker]

[Generalised header scan: all columns by name]   (extends v1 Priority-only scan)
    ├──required by──> [C1 conditions on any column]
    ├──required by──> [C8 three-valued missing-column handling] ──required by──> [C9 hint parity]
    └──required by──> [D8 column-name suggestions], [D9 live match counts]

[C1 + C2 + C4 + C6 rules engine] ──required by──> [C5 mark], [C13/C14/C15 extra operators/effects]
[E1 identity detection] ──required by──> [C3 "is me"] <──fallback── [E2 manual override]
[E3 per-subdomain identity] ──enhances──> [C3]

[F1 schema-versioned storage + 0.1.0 migration]
    ├──required by──> [every setting in v1.1]
    └──required by──> [F2 export] ──required by──> [F3/F4 validated import] ──enhances──> [F7 replace/add]

[Options page (options_ui)] ──required by──> [D1–D12], [E2], [F2–F7]
[Existing background tab-scoped state] ──required by──> [C9 popup hint], [D9 match counts], [D12 legend]

[C9 rules-aware status] ──CONFLICTS with──> [v1 "missing Priority column" state semantics]  (must be redesigned)
[B3 "exactly like 0.1.0"] ──CONFLICTS with──> [A3 dark readability]  (resolve by scoping exactness to light mode)
[Stacked marks] ──CONFLICTS with──> [glance test]  (hence one stripe channel)
```

### Dependency Notes

- **The palette seam comes first.** Today the colours live only in `zhroma.css` as `!important` literals keyed on `data-zhroma-priority`, and `popup.html` says "the product palette lives in zhroma.css and nowhere else". Themes, slots, hex rules, stripes and dark mode all need colours as *data* (JS preset tables for popup swatches and options-page pickers) driving *CSS custom properties* in the page. Without a build step, that means two encodings again (JS data and CSS rules), so reuse v1's agreement-test pattern (the `en`/`en-*` precedent).
- **Dark-mode detection blocks theme work.** Every theme swatch, preview and alpha value depends on knowing which surface is live. Without the recon, palettes get designed against one surface and redesigned later. That was exactly the warning in v1's research.
- **The rules engine changes the existing status model.** v1's `missing` state means "no Priority column, so nothing to do, show the hint". With rules, "no Priority column" can coexist with active rules. Redesign the three-way diagnosis and popup copy around this: *view readable* / *view unreadable*, plus a separate list of inactive rules and missing columns. Bolting a fourth state on will produce contradictory messages.
- **The generalised header scan touches the v1 safety guards.** Today a row with an unrecognised Priority value marks the whole view `unsafe`. Other columns hold arbitrary text by nature, so the "unknown value → unsafe" rule must stay Priority-specific. The structural guards (one table, one header row, cell counts) apply unchanged.
- **Fixtures can't support rule tests yet.** The v1 fixtures replace every header and cell except Priority with `TEXT-nnn`. Rule tests need fixtures that keep the *shape* of Assignee, Group, Status, Tags, date and custom-field cells (element structure, avatars, `<time>`, badges) while still sanitising names. That's a new recon and sanitiser policy, and it has to happen before the engine phase.
- **"Is me" depends on how names render.** Detection only helps if the detected string equals the Assignee cell text. The recon must capture both the identity source and the Assignee cell rendering. Watch for things like "Me" or avatar-only cells.
- **Export/import depends on the symbolic "is me".** If "me" were stored as the exporter's name, a team lead's shared rule pack would highlight the team lead's tickets for everyone.
- **No new permissions are needed for any table-stakes item:** options page, file export via `<a download>`, file import via `<input type=file>`, `openOptionsPage`, `storage.onChanged`. Keep it that way; the permission surface has been frozen at `storage` since Phase 2. D9 (match counts) must push from the content script through the existing background channel. It must not query tabs from the options page, because that may need `tabs` or host permissions. Verify this during planning.

---

## MVP Definition (v1.1 → extension 1.0.0)

### Launch With

- [ ] **A1–A4 dark mode following, live** — without it every theme is half-broken.
- [ ] **Palette seam** (custom properties + JS preset data + agreement test) — the foundation for everything else.
- [ ] **B1–B5 theme picker with swatches, live apply, Classic default** — user-confirmed.
- [ ] **B6 colourblind-safe preset, CVD-validated on real tinted rows** — carried-over accessibility commitment.
- [ ] **B8 a small preset set** (Classic, Catppuccin, Tokyo Night, Dracula, Nord, Gruvbox, Solarized, Colourblind-safe) — user-named. Keep it to about eight so the popup stays one screen.
- [ ] **C1–C12 rules engine** with text operators, symbolic "is me", ordered replace/mark in two channels, slot/hex colours, three-valued missing-column handling, liveness, live apply.
- [ ] **C9 rules-aware status and hint redesign** — required by C1, not optional.
- [ ] **D1–D8 options-page editor** with sentence rows, ALL/ANY plus one group level, reorder, enable/disable, undo, slot picker, column suggestions.
- [ ] **E1–E4 identity** with detection, override, per-subdomain storage, and a visible unknown state.
- [ ] **F1–F6 storage, migration, export, validated import, reset, updated privacy policy.**
- [ ] **C13 "is any of"** — LOW cost, and it removes most of the need for groups.
- [ ] **D9 live match counts** — the single feature that makes rules learnable. MEDIUM cost, but it reuses the existing tab-state channel.

### Add After Validation (v1.x)

- [ ] **D11 starter templates** — trigger: early reviews or support mail showing agents don't know what to write.
- [ ] **D12 popup legend of active rules** — trigger: "why is this row purple?"
- [ ] **C14 mute effect** and **D10 duplicate rule** — trigger: rule lists growing past ~5 per agent.
- [ ] **F7 Add-to-my-rules import mode** — trigger: team-lead sharing requests (ship Replace-only first if time is short).
- [ ] **A6 dual-surface preview** — polish.

### Future Consideration (v2+)

- [ ] **Date/relative-time operators** — needs locale-aware parsing of rendered dates and new recon.
- [ ] **C15 whole-word tag matching** — pending recon of how Tags render.
- [ ] **Per-subdomain or per-view rule scoping** — wait for demand.
- [ ] **Custom theme editor** — wait for demand. The hex escape hatch covers the urgent case.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| A1–A3 dark mode detect, live, readable | HIGH | MEDIUM | P1 |
| Palette seam (custom properties + preset data) | HIGH (enabler) | MEDIUM | P1 |
| B1–B5 theme picker, slots, Classic default | HIGH | MEDIUM | P1 |
| B6 colourblind-safe preset (validated) | MEDIUM | MEDIUM | P1 |
| C1–C8, C10–C12 rules engine | HIGH | MEDIUM–HIGH | P1 |
| C9 rules-aware status/hint redesign | HIGH | MEDIUM | P1 |
| D1–D8 rule editor | HIGH | MEDIUM–HIGH | P1 |
| E1–E4 identity | HIGH | MEDIUM–HIGH (recon-bound) | P1 |
| F1–F6 storage, export/import, reset, policy | MEDIUM | LOW–MEDIUM | P1 |
| C13 "is any of" | MEDIUM | LOW | P1 |
| D9 live match counts | HIGH | MEDIUM | P1 |
| D11 starter templates | MEDIUM | LOW | P2 |
| D12 popup legend | MEDIUM | LOW–MEDIUM | P2 |
| F7 add-vs-replace import | MEDIUM | LOW–MEDIUM | P2 |
| C14 mute effect | MEDIUM | LOW | P2 |
| D10 duplicate rule | LOW | LOW | P2 |
| A6 dual-surface preview | LOW | LOW | P2 |
| Date operators | HIGH | HIGH | P3 |
| C15 contains-word | LOW | LOW | P3 |
| Rule scoping per view/subdomain | LOW | MEDIUM | P3 |
| Custom theme editor | LOW | HIGH | P3 |

---

## Competitor Feature Analysis

| Feature | Zest (Zendesk colour coder) | Airtable record colour | Notion conditional colour | Jira card colours | Outlook / Sheets | **Zhroma v1.1** |
|---|---|---|---|---|---|---|
| Rule condition model | Type a value, pick a colour | Field/operator/value, AND/OR, nested groups | Per-property rules | Type / priority / assignee / JQL | Conditions list / formula | Column/operator/value, ALL/ANY + one group level |
| Precedence | Unclear | First match from top, drag reorder | Highest rule wins | First matching query | Top rule wins; Sheets fills untouched properties | First match per channel (tint, stripe) |
| Visual effect | Row background | Left flag (grid), card stripe | Row background | Left-edge card stripe | Font colour / cell fill | Row tint (replace) or left stripe (mark) |
| "Me" | No | Collaborator field | Person property | `currentUser()` | Outlook: sent to me / Cc | Symbolic "is me", auto-detected, editable |
| Palette | Free colour picker | Fixed palette | Fixed palette | Fixed palette | Free | Named theme slots + hex escape hatch |
| Dark mode | Not evident | App-managed | App-managed | App-managed | App-managed | Follows Zendesk's mode, per-slot variants |
| Apply without refresh | **No** | Yes | Yes | Yes | Yes | **Yes** |
| Export/import | No | N/A | N/A | N/A | N/A | JSON file, validated, replace (+ add later) |

**Positioning update:** *"Zest colours anything once you tell it what, then asks you to refresh. Zhroma still colours priority the moment you install it, and now lets you add your own rules, in the theme you already use in your editor, in light and dark, with nothing to refresh."*

---

## Open Questions for Recon / Phase Research

1. **Dark-mode DOM signal** (A1): which element and attribute (or class) changes when an agent switches mode, and is it the same for Match-system? Needs a live tenant. [LOW, blocking]
2. **Signed-in agent's display name location** (E1): top-bar avatar alt/aria-label, a profile menu, or bootstrapped page data readable from the isolated world? Does it equal the Assignee cell text? [LOW, blocking for E1]
3. **Rendered cell shapes** for Assignee, Requester, Group, Status, Tags, Updated/Requested, Next SLA breach and custom dropdown fields (text vs avatar+text, `<time>`, badges, truncation). Needs a new sanitiser policy that keeps shape but not names. [LOW, blocking for C1/C2 tests]
4. **Header text of custom fields**: exactly the field's display title? Truncated? Localised? [LOW]
5. **Whether content-script match patterns let an extension page find the Zendesk tab** without the `tabs` permission. If not, D9 must be push-only through the background worker. [LOW, verify in planning]
6. **CVD validation of the colourblind preset** at real alpha on both surfaces. Tooling choice is left to phase research. [MEDIUM]

---

## Sources

**Zendesk (official). Confidence: MEDIUM (cross-verified).**
- Using dark mode to increase agent display options: https://support.zendesk.com/hc/en-us/articles/9011095783322-Using-dark-mode-to-increase-agent-display-options
- Activating and deactivating dark mode: https://support.zendesk.com/hc/en-us/articles/9235063674138-Activating-and-deactivating-dark-mode-for-your-account
- Supporting dark mode (ZAF `colorScheme`, `colorScheme.changed`): https://developer.zendesk.com/documentation/apps/app-developer-guide/dark-mode/
- Ensuring dark mode compatibility for apps: https://support.zendesk.com/hc/en-us/articles/9257152764570-Ensuring-dark-mode-compatibility-for-your-Zendesk-Support-apps
- Creating views (columns up to 15, no multi-select columns, operators): https://support.zendesk.com/hc/en-us/articles/4408888828570-Creating-views-to-build-customized-lists-of-tickets
- Meet all vs meet any: https://support.zendesk.com/hc/en-us/articles/4408883552282-What-is-the-difference-between-meet-all-and-meet-any-conditions
- Zendesk glossary ("current user" in views): https://support.zendesk.com/hc/en-us/articles/4408883411354-Zendesk-glossary
- Garden theming / ColorSchemeProvider: https://garden.zendesk.com/components/theme-provider/ , https://www.npmjs.com/package/@zendeskgarden/react-theming
- Internal Note, Zendesk dark mode (2025-03-24; surface `#151A1E`, text `#D8DCDE`): https://internalnote.com/zendesk-dark-mode/

**Comparable rule-colouring products. Confidence: MEDIUM.**
- Airtable record colouring: https://support.airtable.com/docs/record-coloring-in-airtable
- Notion conditional colour: https://thomasjfrank.com/notion-conditional-color-formatting-everything-you-need-to-know/ , https://www.notion.com/help/views-filters-and-sorts
- Jira card colours: https://support.atlassian.com/jira-software-cloud/docs/customize-cards/ , https://support.atlassian.com/jira-service-management-cloud/docs/add-colors-to-cards-on-your-board/
- Google Sheets conditional formatting: https://support.google.com/docs/answer/78413
- Outlook conditional formatting: https://support.microsoft.com/en-us/outlook/mail/use-conditional-formatting-rules-to-change-incoming-messages-in-outlook
- Linear filters (nested groups): https://linear.app/docs/filters
- Zest, the Zendesk Colour Coder: https://chromewebstore.google.com/detail/zest-the-zendesk-colour-c/kohidmaedanhmmhkhkbeaonheneldfbi

**Filter / rule-builder UX. Confidence: LOW–MEDIUM (practitioner articles).**
- Smart Interface Design Patterns, complex filtering (2022-12-26): https://smart-interface-design-patterns.com/articles/complex-filtering/
- SaaS filtering UX patterns: https://www.saasui.design/blog/saas-filtering-sorting-ux-patterns
- Filter-builder UX rethink (group is structural, not content): https://github.com/KucharczykL/timetracker/issues/126
- Pencil & Paper, enterprise filtering: https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering

**Theme picker precedents. Confidence: MEDIUM.**
- VS Code themes (`autoDetectColorScheme`, preferred light/dark themes): https://code.visualstudio.com/docs/configure/themes
- Catppuccin userstyles (light flavour / dark flavour / accent): https://userstyles.catppuccin.com/getting-started/usage/

**Palettes (official specs). Confidence: MEDIUM.**
- Catppuccin palette: https://catppuccin.com/palette/
- Dracula / Alucard spec: https://draculatheme.com/spec
- Nord colours and palettes: https://www.nordtheme.com/docs/colors-and-palettes ; no official light theme: https://github.com/nordtheme/nord/issues/203
- Tokyo Night palette: https://tokyonight.org/palette/ , https://github.com/folke/tokyonight.nvim
- Gruvbox: https://github.com/morhetz/gruvbox , https://github.com/morhetz/gruvbox-contrib/blob/master/color.table
- Solarized: https://en.wikipedia.org/wiki/Solarized
- Paul Tol's colour schemes: https://sronpersonalpages.nl/~pault/
- Okabe-Ito: https://easystats.github.io/see/reference/scale_color_okabeito.html
- IBM colour-blind-safe palette: https://lospec.com/palette-list/ibm-color-blind-safe , https://davidmathlogic.com/colorblind/
- WCAG 1.4.1 Use of Color: https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-without-color.html

**Export/import precedents. Confidence: MEDIUM.**
- Stylus manager (import merges, shows counts, Undo): https://github.com/openstyles/stylus/wiki/Manager
- Dark Reader import issues: https://github.com/darkreader/darkreader/issues/7062
- uBlock Origin restore issues: https://github.com/uBlockOrigin/uBlock-issues/issues/3867

**Project code read directly. Confidence: HIGH.**
- `extension/zhroma.css` (hard-coded per-priority alpha tints), `extension/content.js` (Priority-only header scan, `missing`/`unsafe`/`blank` states), `extension/popup.html` / `popup.js` (single switch, status copy), `extension/manifest.json` (`storage` only), `test/fixtures/*.html` (all non-Priority text sanitised to `TEXT-nnn`).

---
*Feature research for: Zhroma v1.1 Themes & Rules (dark-mode-aware themes, named colour slots, conditional row-colouring rules)*
*Researched: 2026-09-25*
