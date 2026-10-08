# Phase 8: Themes That Follow Dark Mode - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning
**Authority:** The user declined a detailed discussion and delegated the four presented areas: “nothing, sensible defaults is fine”. The defaults below are agent-selected within that authorization, not individually answered questions.

<domain>
## Phase Boundary

Deliver DARK-01–05 and THEME-01–07: a persistent popup theme picker, shared colour slots, readable priority tints in Zendesk light and dark mode, and appearance switching without a reload. Presets are Classic, Catppuccin, Tokyo Night, Dracula, Nord, Gruvbox, Solarized and a colourblind-safe preset, subject to the required readability gate and source/licence review.

This phase does not build rules, stripes, an options-page editor, identity, settings files, a custom theme editor, or a public release. Themes affect only Zhroma's own paint.

The Recon 2 ledger verdict is `proceed`, with no blocked consumers and an admitted dark fixture. Phase 6 still has custody follow-up and human signoffs pending; this discussion does not close or waive them. Phase 7 is complete. Research and planning must preserve those separate evidence states.

</domain>

<decisions>
## Implementation Decisions

### Carried forward — not reopened
- **D-01:** Classic is the default. Its light-mode tints remain identical to 0.1.0. Classic dark keeps the same priority hues with strengths tuned for dark mode. A fresh install or unchanged upgrade stores nothing beyond the existing `enabled` preference.
- **D-02:** Every preset exposes red, orange, yellow, green, cyan, blue, purple and magenta in both light and dark variants, plus a four-priority mapping. Resolve colours in JavaScript and emit numeric CSS custom properties with 0.1.0 literal fallbacks. Theme and appearance changes update document-level properties without re-evaluating rows.
- **D-03:** Follow Zendesk's painted mode from the observed `html[data-theme]` marker. Recon found an in-place marker change on Light/Dark switches and stale-until-reload Match system behaviour after an OS toggle. The OS preference is never the source of truth. An absent or unrecognised Zendesk mode uses the light variant of the selected theme (DARK-05), not a different preset. Keep the host's native hover, selection, focus and sticky-header paint intact.
- **D-04:** Keep `storage` as the only permission, the existing Zendesk agent match pattern, Chrome minimum 106, no runtime dependencies, no build step, no telemetry and no runtime network calls. Settings remain device-local. The existing switch, toolbar diagnoses and English-only supported-view boundary remain intact.
- **D-05:** Extend the existing `theme` registry entry and worker settings queue. Preserve the stored `{ v: 1, id: 'zhroma-classic' }` shape and Classic ID; additional stable IDs are implementation discretion. Absent settings mean defaults. Unreadable values are never deleted, repaired or rewritten automatically. Writes occur only for a real user change; returning from another preset to Classic stores an explicit choice. Re-selecting the effective theme writes nothing, including an unreadable setting currently falling back to Classic.

### Picker layout and interaction
- **D-06:** Use one compact, vertically scrollable list of labelled theme choices in the popup. Keep the existing enable switch and view status above it. Put Classic first, then the named presets in requirement order, then the colourblind-safe preset. Show a clear selected indicator independent of colour. No search, categories or separate selection dialog are needed for eight choices.
- **D-07:** Each choice shows two labelled previews, Light and Dark, side by side. Each preview contains all four actual composited priority tints on the measured Zendesk surface, in Urgent/High/Normal/Low order. Use the same palette resolution and composition path as the runtime and validator; raw upstream swatches are insufficient. Explain the priority order once. Selection works by keyboard and has a visible focus indicator.
- **D-08:** Selecting a preset saves and applies it immediately; no Apply button, hover-to-apply or unsaved preview mode. A saved global theme reaches all open supported Zendesk views through the existing settings path. The picker remains usable while tinting is off or no readable view is connected; saving a theme never turns tinting on. Reopening the popup reflects the saved effective choice.

### Priority colour mapping
- **D-09:** Ordinary presets start from the familiar semantic mapping: Urgent red, High orange, Normal yellow, Low green. Preserve that association where readability allows it. Distinguishability, especially Urgent versus High, takes precedence over a rigid mapping: a failing pair may use different slots, with the deviation recorded beside the preset data. Do not silently lower acceptance thresholds to keep the mapping.
- **D-10:** The colourblind-safe preset is exempt from the red/orange/yellow/green convention. Choose its mapping from validation of the final blended colours under deuteranopia and protanopia in both modes, with lightness ordered consistently by priority. Its UI label is “Colourblind-safe”. Do not add a stripe or another treatment in this phase; stripes belong to Phase 9.

### Theme character and tint strength
- **D-11:** Aim for restrained translucent row backgrounds that make priority apparent at a glance. Use source palette hues as the starting point and tune light/dark strengths separately. Prefer an opacity adjustment before altering hues; if that cannot meet readability, use a documented slot remapping or derived colour. Recognisable theme character matters, but readable tickets and distinguishable priorities take precedence over exact upstream colour reproduction. Classic light remains frozen under D-01.
- **D-12:** Ship only presets that pass the required checks on actual blended surfaces in both modes: text contrast at least 4.5:1, priority separation, distinction from untinted rows, and preservation of native states. Research selects and justifies the numerical distinguishability thresholds, baseline treatment and simulation tooling; no invented thresholds or swatch-only evidence. A failed optional branded preset is omitted with a recorded reason. Classic and the required colourblind-safe capability must be made to pass rather than silently dropped.
- **D-13:** Credit every bundled preset's source, licence and any derivations in the shipped source/package. Use descriptive theme names without logos or implied endorsement. Research must verify current primary source and licence evidence and record the Gruvbox decision. Prefer a clearly licensed source; do not treat ambiguous permission as settled by this delegation. Exact attribution presentation and suitable source variants are implementation discretion.

### Fallback and save failures
- **D-14:** A saved theme that cannot be read or validated falls back to Classic, with a separate theme message: “Your saved theme could not be read. Using Classic.” Keep tinting available under the existing enable setting. Do not replace the Priority diagnosis or turn an unreadable theme into a view error. A missing key is normal and shows no warning.
- **D-15:** Show the last confirmed effective choice while a save is pending; prevent overlapping saves. A confirmed failure shows “Theme could not be saved. Try again.” and retains the confirmed choice. If the outcome is unknown, re-read the setting and report “Theme could not be confirmed” until resolved; never assert that no write occurred when it might have landed. No silent background retries or automatic repair.
- **D-16:** A saved choice and a view application are different facts. Do not display “applied” unless the implementation has evidence for it. No connected view is a normal configuration case: retain the existing connection status and allow saving. If an actual application failure is detected, report it separately without presenting the setting as unsaved.

### Agent's Discretion
- Exact popup dimensions, preview geometry, selection controls, copy refinements and attribution placement within D-06–08 and D-13–16.
- Source variants, derived slots and light/dark opacity values within D-09–13; record the rationale and validator results.
- Detector observer scope, module layout, bounded message protocol, readback details and stale-reply handling. These are research/planning choices, not questions for the user.
- Test tooling selection and numerical validator thresholds need research. This discussion does not approve installation of any new dependency or an exact version; follow the existing approval process if one is needed.
- Keep verification proportionate: automated palette/parity checks and Phase 8 dev-byte dark row-state checks; the full regression and release-candidate UAT remains in Phase 11. Preserve the existing one-round review/repair cap and separately report any remaining blockers.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.** No separate Phase 8 SPEC.md or external specification was supplied during this discussion.

### Scope and prior decisions
- `.planning/ROADMAP.md` — Phase 8 goal, twelve requirements, success criteria and standing constraints; authoritative phase assignment.
- `.planning/REQUIREMENTS.md` — DARK-01–05, THEME-01–07, scoping decisions and exclusions.
- `.planning/PROJECT.md` — zero-setup core value, privacy and permission boundaries.
- `.planning/phases/07-upgrade-safe-foundation/07-CONTEXT.md` — settings fallback, no-op writes, worker-only persistence, schema and proportionate verification contracts.
- `.planning/phases/07-upgrade-safe-foundation/07-VERIFICATION.md` — foundation outcome and final source-bound checks.
- `.planning/phases/07-upgrade-safe-foundation/07-REVIEW-DISPOSITION.md` — open findings; do not misrepresent them as repaired. Review applicability when extending theme handling; rule/CAS fixes remain due before Phase 9/10 keys land.
- `.planning/RETROSPECTIVE.md` — review cap and proportionate evidence.
- `DEPENDENCY-APPROVALS.md` — dependency approval boundaries.

### Recon and research
- `SELECTORS.md` — Recon 2 `dark-mode-signal`, `dark-mode-switch-mutation`, `dark-native-states`, `dark-table-topology`, verdict and handoff. Measured light surface/text: rgb(255,255,255)/rgb(41,50,57); dark: rgb(21,26,30)/rgb(216,220,222).
- `.planning/phases/06-live-dom-recon-2/06-CONTEXT.md` — safe live-session and private-data boundaries.
- `.planning/phases/06-live-dom-recon-2/06-VERIFICATION.md` — outstanding human evidence.
- `.planning/phases/06-live-dom-recon-2/06-CUSTODY-CLOSEOUT.md` — user-reported cleanup and pending private-input existence check; currently uncommitted, do not absorb it into this phase's commit.
- `.planning/research/SUMMARY.md` — palette seam, outstanding thresholds, CVD choices and licensing research. Its proposed phase outline assigns dark detection to Phase 9; that outline is superseded by ROADMAP.md, which puts detection and switching in Phase 8.
- `.planning/research/ARCHITECTURE.md` — document-marker detector branch, shared palette and custom-property seam.
- `.planning/research/STACK.md` — source palette candidates and colour tooling hypotheses; reverify time-sensitive versions and licences.
- `.planning/research/PITFALLS.md` — blended-palette failures, native-state composition and wrong-mode startup. Its calculations are research guidance, not acceptance evidence.
- `test/fixtures/manifest.json` — admitted v1 and Recon 2 fixtures and checksums.

### Source and verification seams
- `extension/popup.html`, `extension/popup.js` — current enable switch, fixed status copy, bounded worker messages and confirmed-state rendering.
- `extension/zhroma-settings.js`, `extension/background.js` — theme registry, single writer, validation and sender restrictions.
- `extension/content.js`, `extension/zhroma.css`, `extension/manifest.json` — settings listener, current literal palette, narrow selectors and packaged script order.
- `test/extension/parity.test.js`, `scripts/baseline-source.js` — frozen 0.1.0 comparison path; Classic light must stay green.
- `test/extension/frozen-contract.test.js` — permission, local-only and network invariants; do not weaken these for feature work.
- `test/extension/chrome-harness.js`, `test/extension/tracer-world.js` — existing messaging/storage doubles and admitted runtime seam.
- `scripts/release-source.js` — shipped-file inventory for any new palette/shared files.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Zhroma.settings` already registers `theme` with Classic as its only ID, version 1, a 128-byte cap and last-writer-wins semantics. Extend the enum and reuse the queue; do not invent a second preference store.
- `content.js` has a bounded settings-ready gate, per-key generations and one guarded storage listener. Theme propagation is already resolved without touching row detection; connect document-level palette updates here.
- The popup has bounded messages, stale-request ownership, an enable control and a finite status live region. Reuse confirmed-state behaviour for the theme control, with a separate theme message.
- `zhroma.css` contains the four authoritative Classic light tints as direct ticket-cell backgrounds. Keep them as literal custom-property fallbacks.

### Established Patterns
- Classic scripts share one `Zhroma` namespace; no emit/build step. Ship reviewed source directly.
- Popup persistence goes through the worker; page-derived ticket content is not rendered in the popup.
- Inspect and tint only admitted English current Agent Workspace ticket rows. Native selection and hover belong to the row; Zhroma paints its direct cells.
- Tests compare against pinned baseline bytes. An intentional versioned contract change needs its own commit and rationale; frozen invariants remain intact.

### Integration Points
- Popup choices -> worker settings queue -> local change event -> content palette properties. The same palette data and composition serve previews and validation.
- The observed root marker supplies appearance changes independently of settings changes. Do not feed Zhroma's own property writes back into an observer loop.
- Eight-slot data and the numeric colour emitter are consumed by Phase 9 rules; build that seam here without adding rule UI or runtime semantics.

</code_context>

<specifics>
## Specific Ideas

- User wording: “nothing, sensible defaults is fine”. Treat this as delegation within the four presented areas, not blanket permission to add capabilities or waive checks.
- Prioritise the glance test and distinguishable Urgent/High over strict theme fidelity.

</specifics>

<deferred>
## Deferred Ideas

None added by the user. Preserve existing later-phase work: rules and stripes (Phase 9), editor/identity/settings files (Phase 10), public release and final regression UAT (Phase 11). Custom theme editing remains THEME-F1.

</deferred>

---

*Phase: 08-themes-that-follow-dark-mode*
*Context gathered: 2026-10-08*
