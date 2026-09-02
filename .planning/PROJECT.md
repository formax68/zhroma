# Zhroma

## What This Is

Zhroma is a Chrome extension that colour-codes ticket rows in Zendesk agent views by priority, so an agent can see what's urgent at a glance instead of reading a column of plain text. It installs from the Chrome Web Store, works on any `*.zendesk.com` agent interface with zero setup, and is aimed at support agents who live in Zendesk views all day.

## Core Value

Open a Zendesk view and know within one second which tickets are urgent — without reading a word.

## Business Context

- **Customer**: Zendesk support agents and their team leads — anyone who works out of Zendesk agent views daily
- **Revenue model**: None. Free public Chrome Web Store listing
- **Success metric**: The glance test — urgent tickets are identifiable in under a second, and agents keep the extension enabled
- **Strategy notes**: None

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ticket rows in Zendesk agent views are tinted by priority
- [ ] All four Zendesk priority values get a distinct tint (Urgent, High, Normal, Low)
- [ ] Priority is read from the Priority column rendered in the view
- [ ] When a view has no Priority column, show an unobtrusive hint prompting the agent to add it
- [ ] Works on any `*.zendesk.com` agent interface with no per-user configuration
- [ ] Tinting survives the things agents actually do: scrolling, sorting, refreshing a view, switching views and tabs
- [ ] Packaged and published as a public Chrome Web Store listing (icons, screenshots, privacy policy, minimal permissions)

### Out of Scope

- **User-configurable colours** — deferred to v2. v1 ships hard-coded defaults so there is no options page, no storage, and nothing to configure before it works
- **Alternative visual treatments (left-edge stripe, coloured priority pill)** — deferred to v2, where they become a configurable choice alongside custom colours. v1 commits to the full-row tint
- **Colouring the open ticket page, tab strip, search results, and org/user ticket lists** — v1 is scoped to agent views only, which is where the scanning pain actually lives
- **Fetching priority from the Zendesk API** — rejected for v1. It needs auth handling and a heavier permissions ask at store review, in exchange for covering views the agent can fix themselves by adding a column
- **Colourblind-safe / WCAG-audited palette** — acknowledged and deferred. v1 uses obvious, conventional colours; revisit if it becomes a real complaint
- **Firefox, Edge, Safari ports** — Chrome first; other browsers only if there's demand
- **Colour-coding by anything other than priority** (status, SLA breach, assignee, tags) — priority is the whole product for v1

## Context

- The problem is not that priority is missing from Zendesk — it's that priority is rendered as plain text with no visual weight, and is often scrolled off to the right in wide views. The information is present but invisible under time pressure.
- Zendesk agent views only render the columns a view is configured with. A view that omits Priority gives the extension nothing to read. This is a known, accepted gap in v1 — the hint turns a silent no-op into a one-click fix the agent performs themselves in Zendesk view settings.
- The Zendesk agent interface is a dynamic single-page app: rows are re-rendered on sort, refresh, view switch and scroll. Any implementation that tints once on page load will appear broken within seconds. Re-application on DOM change is a hard requirement, not a nicety.
- Publishing publicly means the extension must be defensible at Chrome Web Store review: narrow host permissions, no remote code, a clear justification for every permission requested, and a privacy policy — even though the extension collects nothing.
- Zendesk owns the DOM this extension reads. Selector fragility is the standing risk for the life of the project: a Zendesk front-end change can break tinting without warning, and the extension must fail quietly (page untouched) rather than loudly (page broken).
- Greenfield. Empty directory, fresh git repo, no prior spike or sketch work to carry in.

## Constraints

- **Tech stack**: Chrome Extension Manifest V3 — MV2 is no longer accepted by the Chrome Web Store
- **Platform**: Chrome only for v1
- **Permissions**: As narrow as possible — host access scoped to `*.zendesk.com`, no API tokens, no remote code, nothing that complicates store review
- **Setup**: Zero configuration. It must work correctly the moment a stranger installs it, with no options to set first
- **Dependency**: Reads Zendesk's own rendered DOM, which Zendesk can change at any time without notice
- **Privacy**: Ticket data never leaves the browser. No telemetry, no network calls, nothing stored off-device — this is both an ethical line and what makes the store listing simple

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full-row tint for v1, other treatments deferred | One treatment ships faster and proves the glance test; stripe and pill become v2 config options once the core is validated | — Pending |
| Hard-coded colours, no options page in v1 | Zero setup is the whole point of a public listing — an options page is a decision the user has to make before getting value | — Pending |
| Read the Priority column rather than call the Zendesk API | Keeps permissions narrow and store review simple; the coverage gap is fixable by the agent in Zendesk itself | — Pending |
| Show a hint when the Priority column is absent | Turns a silent failure into a self-service fix — the difference between "this extension is broken" and "add this column" | — Pending |
| Scope v1 to agent views only | That's where list-scanning under time pressure happens; the open ticket page already shows priority in context | — Pending |
| Tint all four priorities rather than High/Urgent only | Distinct tints make the whole list scannable, not just the hot rows | — Pending |
| Any `*.zendesk.com` rather than a single subdomain | Required for a public listing — a stranger's subdomain is unknowable at build time | — Pending |
| Accessibility deferred, recorded rather than dropped | Conventional colours ship now; the colourblind-safe palette is logged in Out of Scope so it can't be quietly forgotten | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Business Context check — customer, revenue model, success metric still accurate?
4. Audit Out of Scope — reasons still valid?
5. Update Context with current state

---
*Last updated: 2026-09-02 after initialization*
