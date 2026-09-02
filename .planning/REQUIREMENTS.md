# Requirements: Zhroma

**Defined:** 2026-09-02
**Core Value:** Open a Zendesk view and know within one second which tickets are urgent — without reading a word.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Reconnaissance

<!-- Zendesk publishes no DOM contract for the agent-view ticket table. These are gating deliverables, not user-facing features — everything downstream is built on assumptions until they are answered. -->

- [ ] **RECON-01**: A captured `outerHTML` fixture of a real Zendesk agent view is committed to the repo and usable as a test fixture
- [ ] **RECON-02**: Every DOM assumption in the research Verification Ledger is answered against a live instance, with answers recorded in the repo
- [ ] **RECON-03**: The two terminal risks are explicitly ruled in or out — a closed Shadow DOM around the ticket list, and the absence of `data-garden-id` attributes in a current agent view

### Detection

- [ ] **DETECT-01**: Extension locates the Priority column by its header rather than by column position, so it survives user-configured column order
- [ ] **DETECT-02**: Extension reads each ticket row's priority and resolves it to one of Urgent, High, Normal or Low
- [ ] **DETECT-03**: Extension resolves headers within the same table as the rows it tints, given that agent views render a sticky duplicate header table alongside the body table
- [ ] **DETECT-04**: Extension distinguishes grouped-view group rows from ticket rows and never tints a group row

### Tinting

- [ ] **TINT-01**: Each ticket row is tinted according to its priority, with a visually distinct tint for each of the four values
- [ ] **TINT-02**: Row text remains legible over every tint
- [ ] **TINT-03**: Zendesk's own row states — hover, selected, unread/bold — remain visible and are not suppressed by the tint
- [ ] **TINT-04**: The tint is applied as a translucent layer that composites over whatever Zendesk paints, rather than replacing the row's background colour
- [ ] **TINT-05**: All colour is declared in a stylesheet driven by a single data attribute, so the visual treatment can be changed without touching detection logic

### Liveness

- [ ] **LIVE-01**: Tints re-apply automatically after a view is sorted
- [ ] **LIVE-02**: Tints re-apply automatically after a view is refreshed
- [ ] **LIVE-03**: Tints re-apply automatically when the agent switches views, with no page load involved
- [ ] **LIVE-04**: Rows revealed by scrolling are tinted
- [ ] **LIVE-05**: Scrolling and interacting with a large view is no less responsive with the extension enabled than without it

### Failure Handling

- [ ] **FAIL-01**: Extension distinguishes three states — tinting normally, the view has no Priority column, and priority values are unreadable in this agent's locale
- [ ] **FAIL-02**: When a view genuinely has no Priority column, an unobtrusive hint tells the agent to add one — shown only when that diagnosis is certain
- [ ] **FAIL-03**: When priority values cannot be read because the agent's locale is not supported, no hint claiming a missing column is shown
- [ ] **FAIL-04**: When the extension cannot do its job for any reason, the Zendesk page is left visually untouched rather than partially or wrongly styled
- [ ] **FAIL-05**: The agent can see which of the three states applies from the toolbar icon, without opening anything

### Control

- [ ] **CTRL-01**: Extension works immediately on install with nothing to configure
- [ ] **CTRL-02**: Agent can turn tinting off and back on from the toolbar popup
- [ ] **CTRL-03**: The on/off setting persists across browser restarts
- [ ] **CTRL-04**: Turning tinting off clears tints from the current view without requiring a page refresh

### Distribution

- [ ] **STORE-01**: Extension is published as a public Chrome Web Store listing
- [ ] **STORE-02**: Extension declares no `host_permissions` block and requests `storage` as its only permission
- [ ] **STORE-03**: The content script matches only `https://*.zendesk.com/agent/*`, excluding the customer-facing Help Center on the same domain
- [ ] **STORE-04**: A privacy policy is published, linked from the listing, and discloses that no data is collected
- [ ] **STORE-05**: Shipped code is unminified and byte-identical to repo source
- [ ] **STORE-06**: A manual pre-submission smoke checklist lives in the repo and is run before each submission

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Appearance

- **APPR-01**: Agent can choose the visual treatment — full-row tint, left-edge stripe, or coloured priority pill
- **APPR-02**: Agent can customise the colour used for each priority
- **APPR-03**: Tints are readable in Zendesk's dark mode, including a theme switch mid-session
- **APPR-04**: Palette is colourblind-safe, with lightness varying monotonically across the four priorities

### Reach

- **REACH-01**: Priority values are recognised in the most common Zendesk agent locales beyond English
- **REACH-02**: Tinting extends to search results and org/user ticket lists
- **REACH-03**: Agent can report a breakage from the popup via a pre-filled GitHub issue

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Dark mode support | Deferred by explicit decision. The CTRL-02 toggle gives dark-mode agents an escape hatch instead of an uninstall. Combines with the palette work in v2 |
| Colourblind-safe palette / hue constraints | Deferred by explicit decision, including hue selection. Retrofit cost accepted; lands with dark mode as one combined palette job |
| Fetching priority from the Zendesk API | Needs auth handling and a much heavier permissions ask at review, to cover views the agent can fix themselves by adding a column |
| SPA route-change detection | An anti-requirement. History patching is broken by design from a content script's isolated world, and a route change is already just a large DOM mutation the observer handles |
| Colouring the open ticket page, tab strip, search results, org/user lists | v1 is agent views only — that is where list-scanning under time pressure happens |
| Any options page beyond the on/off toggle | Configuration is the friction the incumbent competitor imposes and Zhroma's wedge is not having it |
| Telemetry, analytics, or any network call | The zero-network promise is what makes the store listing and enterprise allowlisting simple |
| Cascade layers (`@layer`) for extension CSS | Verified harmful here: unlayered host declarations beat all layered ones, inverting the intended precedence |
| A build step or bundler | Shipped bytes must equal repo bytes — the cleanest story at store review, and adequate at this size |
| Firefox, Edge, Safari ports | Chrome first; other browsers only on demand |
| Colour-coding by status, SLA, assignee or tags | Priority is the single purpose, and single purpose is a store review policy |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RECON-01 | TBD | Pending |
| RECON-02 | TBD | Pending |
| RECON-03 | TBD | Pending |
| DETECT-01 | TBD | Pending |
| DETECT-02 | TBD | Pending |
| DETECT-03 | TBD | Pending |
| DETECT-04 | TBD | Pending |
| TINT-01 | TBD | Pending |
| TINT-02 | TBD | Pending |
| TINT-03 | TBD | Pending |
| TINT-04 | TBD | Pending |
| TINT-05 | TBD | Pending |
| LIVE-01 | TBD | Pending |
| LIVE-02 | TBD | Pending |
| LIVE-03 | TBD | Pending |
| LIVE-04 | TBD | Pending |
| LIVE-05 | TBD | Pending |
| FAIL-01 | TBD | Pending |
| FAIL-02 | TBD | Pending |
| FAIL-03 | TBD | Pending |
| FAIL-04 | TBD | Pending |
| FAIL-05 | TBD | Pending |
| CTRL-01 | TBD | Pending |
| CTRL-02 | TBD | Pending |
| CTRL-03 | TBD | Pending |
| CTRL-04 | TBD | Pending |
| STORE-01 | TBD | Pending |
| STORE-02 | TBD | Pending |
| STORE-03 | TBD | Pending |
| STORE-04 | TBD | Pending |
| STORE-05 | TBD | Pending |
| STORE-06 | TBD | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32 ⚠️ (filled during roadmap creation)

---
*Requirements defined: 2026-09-02*
*Last updated: 2026-09-02 after initial definition*
