# Phase 8: Themes That Follow Dark Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents. Decisions are captured in 08-CONTEXT.md.

**Date:** 2026-10-08
**Phase:** 08-Themes That Follow Dark Mode
**Areas presented:** Picker layout and interaction; priority colour mapping; theme character and tint strength; fallback and save failures.

## Interaction and authority

The agent presented the Phase 8 scope, carried-forward decisions and the four areas below, inviting numbered selections or “all”. The user replied verbatim: **“nothing, sensible defaults is fine”**.

The user delegated choices across those areas. No individual multiple-choice selections or four-question deep dives occurred. The agent used the authorized defaults path and captured concrete defaults; no additional interview was required.

## Picker layout and interaction

| Alternative presented | Description | Outcome |
|---|---|---|
| Scrollable preview list | Each preset shows Light/Dark previews together | Agent-selected default |
| Compact selector and preview panel | Show previews for the selected preset | Not selected |
| Immediate application | Apply a choice when selected | Agent-selected default |

**Notes:** Keep the existing switch and status first, support keyboard selection, and save through the worker. No extra Apply step or hover preview. Show confirmation truth separately from view application.

## Priority colour mapping

| Alternative presented | Description | Outcome |
|---|---|---|
| Familiar associations across themes | Prefer red/orange/yellow/green for Urgent/High/Normal/Low | Agent-selected starting default |
| Theme-specific mapping | Allow each theme to choose its mapping | Allowed only where readability requires it; record deviations |

**Notes:** The colourblind-safe preset uses its validated mapping and ordered lightness. Classic light remains unchanged. Avoid locking a mapping that fails the blend validator.

## Theme character and tint strength

| Alternative presented | Description | Outcome |
|---|---|---|
| Subtle backgrounds | Restrained translucent tints | Agent-selected starting default |
| Stronger separation | More prominent paint where needed | Allowed to meet readability and the glance test |
| Strict source fidelity | Minimise changes to upstream colours | Secondary to readability |
| Adapted colours | Adjust strength, mapping or derived values | Agent-selected policy, with derivations documented |

**Notes:** Light/dark opacity values, source variants and numerical thresholds are research/implementation discretion within the requirements. Primary-source licence verification remains research work; this discussion does not settle uncertain licences or approve new dependencies.

## Fallback and save failures

The initial prompt asked how to explain an unreadable saved theme, Classic fallback or a choice that could not be saved. No fixed alternatives were offered for this area.

**Agent-selected default:** A separate concise theme message, Classic fallback without automatic stored-value repair, confirmed-state rendering, visible save/confirmation errors and no unsupported claim that a view updated. Saving remains available with tinting off or without a readable view.

## Agent's Discretion

All four areas were delegated. Exact UI geometry, copy refinements, palette values, source variants, detector wiring and test thresholds remain discretionary within 08-CONTEXT.md. No acceptance waiver, release permission or dependency-version approval was inferred.

## Deferred Ideas

None proposed. Phase 6 cleanup/signoffs remain separate pending evidence; this discussion did not close them. The prior dirty STATE.md and unrelated untracked files are not included in the context commit.
