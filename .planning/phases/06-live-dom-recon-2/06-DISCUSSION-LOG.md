# Phase 6: Live DOM Recon 2 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-25
**Phase:** 06-live-dom-recon-2
**Areas discussed:** None individually. The user accepted sensible defaults for all four areas presented.

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Session & tenant setup | One sitting or split by topic? Probes through Claude in Chrome, or pasted into DevTools? Is dark mode allowed on the tenant? Can we build a disposable view with all nine columns? Where does the "ticket assigned to me" come from? Phase 1 forbade ticket changes. | defaults |
| What the sanitiser keeps | Today every non-Priority string becomes `TEXT-nnn`. Should header labels and Zendesk's own vocabulary survive, such as Status/Type values, "Unassigned", "-" placeholders and date formats? How is the agent's name tokenised consistently across the top bar and Assignee cells without being written anywhere? | defaults |
| Dark-mode matrix & switch | All six Light/Dark/Match × OS-light/OS-dark cells, or the four that tell the Zendesk setting apart from the OS setting? How is a mid-session switch watched? How is keyboard focus observed safely, given Phase 1's accidental navigation? | defaults |
| How heavy the evidence is | Extend the fail-closed recon gate to enforce the new entries, or keep it lighter: ledger entries plus the existing sanitiser, scan and manifest checksums? | defaults |

**User's choice:** "sensible defaults are fine for the above"
**Notes:** No per-area questions were asked. Claude recorded its recommended default for each area in CONTEXT.md D-01…D-25. The main defaults:
- **Session:** one sitting from a written run sheet. The user performs every action. Claude only runs read-only probes. Nothing is changed to manufacture test data.
- **Sanitiser:** a separate, opt-in rule-column mode. The v1 policy and corpus are untouched. Zendesk vocabulary comes from an allowlist and is kept verbatim. Tenant text is tokenised per value, and the agent's name gets one reserved token.
- **Dark mode:** all six matrix cells, with Zhroma switched off. The switch recorder also counts CSSOM rules. Focus is reached by Tab only.
- **Evidence:** proportionate, reusing existing tooling. The new ledger ids are registered. Review and repair is capped at one round. No shipped bytes change.

---

## Claude's Discretion

- Probe scripts, run-sheet wording and order
- Token formats and the grammar extension
- How the rule-column mode is selected, and the fixture file names
- Whether `referenced-cell-representation` is one entry or one per column
- The status value for a fact that could not be observed
- Which date column and custom field, within D-07

## Deferred Ideas

- RULE-F1 date and relative-time operators
- RULE-F2 whole-word tag matching
- REACH-01 non-English recon
- The ticket conversation pane's own dark/light override, which is out of agent-view scope
