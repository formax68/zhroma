# Phase 08 multi-source audit

Planning covers the existing authoritative phase scope; covered means planned, not implemented/accepted. Five plans, four waves: 08-01 → (08-02 ∥ 08-04) → 08-03 → 08-05. Same-wave modified paths are disjoint. All sixteen D-IDs occur in relevant objective/task/truth bodies and all twelve requirement IDs occur in frontmatter. No later-phase rule, stripe, editor, identity, import/export or publication work is added.

| Source | ID | Required outcome/constraint | Plans | Status |
|---|---|---|---|---|
| GOAL | Phase 08 | Pick a persistent popup theme, readable light/dark tints and in-place appearance switch without reload | 01–05 | COVERED |
| REQ | DARK-01 | Zendesk appearance, including stale Match system, is authoritative | 01/04/05 | COVERED |
| REQ | DARK-02 | In-place light/dark switch without reload/wrong-mode flash | 01/04/05 | COVERED |
| REQ | DARK-03 | Final dark pairs/untinted separation and text >=4.5 | 01/02/05 | COVERED |
| REQ | DARK-04 | Native hover/selection/focus preserved | 02/04/05 | COVERED |
| REQ | DARK-05 | Undetermined mode selects selected-theme light | 01/04/05 | COVERED |
| REQ | THEME-01 | Popup save reaches all open supported views | 01/03/04/05 | COVERED |
| REQ | THEME-02 | All named presets evaluated; failing optional omitted, Classic/CVD required | 01/02/03/05 | COVERED |
| REQ | THEME-03 | Both variants have eight named slots and four mappings | 01/02/05 | COVERED |
| REQ | THEME-04 | Final CVD blends simulated and priority-lightness ordered | 02/05 | COVERED |
| REQ | THEME-05 | Actual rendered Light/Dark previews side by side | 01/03/05 | COVERED |
| REQ | THEME-06 | Choice survives reopened popup and browser restart | 01/03/04/05 | COVERED |
| REQ | THEME-07 | Exact bundled notices/derivations and Gruvbox decision | 01/02/05 | COVERED |
| CONTEXT | D-01 | Classic default, light parity, dark hue continuity and zero unchanged-upgrade writes | 01/02/05 | COVERED |
| CONTEXT | D-02 | Eight slots, JS numeric properties, literal fallbacks and no row reevaluation | 01/02/04 | COVERED |
| CONTEXT | D-03 | Exact root marker, current-theme light fallback and native state preservation | 01/04/05 | COVERED |
| CONTEXT | D-04 | Storage-only, Chrome106, no dependencies/build/network/telemetry, local-only support boundaries | 01/04/05 | COVERED |
| CONTEXT | D-05 | Existing registry/envelope/writer, effective-theme no-op including corrupt Classic | 01/03 | COVERED |
| CONTEXT | D-06 | Compact ordered scrollable labelled list and non-colour indicator | 01/03 | COVERED |
| CONTEXT | D-07 | Shared composited dual previews, fixed priority order and keyboard/focus | 01/03/05 | COVERED |
| CONTEXT | D-08 | Immediate save/apply, all views, off/no-view and reopen | 01/03/04/05 | COVERED |
| CONTEXT | D-09 | Semantic mappings with explicit validated deviations | 01/02 | COVERED |
| CONTEXT | D-10 | Validated CVD mapping/order/label and no stripe | 02 | COVERED |
| CONTEXT | D-11 | Restrained translucency, separate strengths and opacity-first documented tuning | 01/02/05 | COVERED |
| CONTEXT | D-12 | Actual blend/numeric/native gates, optional omit and mandatory pass | 01/02/05 | COVERED |
| CONTEXT | D-13 | Primary pinned credits/licences/derivations and Gruvbox source choice | 01/02/05 | COVERED |
| CONTEXT | D-14 | Corrupt fallback warning separate from Priority; missing key normal | 01/03 | COVERED |
| CONTEXT | D-15 | Confirmed/pending/failed/unknown readback, no overlapping saves or silent retries | 01/03/05 | COVERED |
| CONTEXT | D-16 | Saved/application facts separate, disconnected normal and no unproven applied | 01/03/05 | COVERED |
| RESEARCH | R01 | Pure shared classic modules/load order and exact packaged inventory | 01 | COVERED |
| RESEARCH | R02 | Root-only observer/dedup/startup/visibility/bfcache and no row work | 01/04 | COVERED |
| RESEARCH | R03 | Narrow corrupt-fallback queue no-op; retain physical writer and future CAS findings | 01/03 | COVERED |
| RESEARCH | R04 | Exact bounded sender/read schemas, pending owners and queue-aware uncertainty | 01/03 | COVERED |
| RESEARCH | R05 | Native radios, finite separate messages, shared previews and popup script loading | 01/03 | COVERED |
| RESEARCH | R06 | Encoded-sRGB two-layer composition, original Oklab/WCAG and fixed independent vectors | 01/02/05 | COVERED |
| RESEARCH | R07 | Per-pair/state/per-priority Classic light floors and project-only numerical policies | 01/02 | COVERED |
| RESEARCH | R08 | Settled linear-light Machado/W3C pipeline; independently tested implementation vectors before CVD acceptance | 02 tasks 1/2 | COVERED |
| RESEARCH | R09 | Settled project-original constrained generation, historical prototype excluded from seeds/shipped inputs; no feasibility-as-approval | 02 task 2 | COVERED |
| RESEARCH | R10 | Six primary pins/hashes/full notices, missing-slot derivations and exact Gruvbox decision | 01/02 | COVERED |
| RESEARCH | R11 | Final ID agreement, malformed numeric data, known-bad controls and complete pass/omit | 01/02 | COVERED |
| RESEARCH | R12 | Actual Chrome flattened paint versus model, previews and extra text styles | 05 | COVERED |
| RESEARCH | R13 | Every-preset dev native states, source identity and honest pending human evidence | 05 | COVERED |
| RESEARCH | R14 | Final regressions/mutants/noEmit/frozen contracts and distinct rationale/test-only pins | 01/05 | COVERED |
| RESEARCH | R15 | ASVS Level1/high-block sender/data/local-network/uncertain-ACK boundaries | 01–05 | COVERED |
| RESEARCH | R16 | Preserve Phase6 custody/human states, Phase7 open/skipped findings and review cap | 03/05 | COVERED |
| RESEARCH | R17 | No new dependency/external schema/migration/service, same local envelope | 01–05 | COVERED |

Missing source items: **0**. Research proposals are explicitly authored as new APIs/files; existing paths were grounded by `git ls-files`. Discovery uses the completed research/current pattern map; no new package investigation, web research or numerical experiment was repeated in planning. The leading cross-stack tracer requires more than five paths for inseparable load/wire correctness; its estimate is 48k, limited to Classic/one branded choice, and later expansions remain focused. Calibration factor 1, sample_count 0, derived confidence low applies to every estimate.

## Seams and evidence limits

Read all active plan:pre planner contribution fragments in order: API coverage, assumption delta, schema push, security. Primary identity is theme ID + mode resolved palette; promote the existing registry and Classic variant, no parallel preference. No ORM/external database schema exists in this scope. API detector is run on real roadmap+plan scope after writing; if it flags Chrome's existing internal host seam, COVERAGE.md records a reasoned no-external-integration declaration. UI plan gate permits manual planning without UI-SPEC; accepted D-06–08/actual popup define design. Nyquist is disabled and no separate artifact is required.

22 surfaced edges are disposition-complete in 08-EDGE-COVERAGE.md: 15 explicit predicates, 7 flagged unresolved assumptions, zero dismissed/backstop. Eight bespoke prohibitions remain descriptor-less flagged-unverified, projected with the shared schema; routine engineering and security canon were dropped/referral-recorded, never silently accepted. Research now resolves A1 source strategy (independent project-original generation excluding historical prototype inputs) and A2 simulation method (W3C sRGB decode → linear-light Machado severity-1 matrix → clamp → encode → Oklab), with corrected-paper equation evidence. The selected strategy has no dependency on historical prototype reuse terms. Independent implementation vectors, final-data acceptance, actual Chrome/native human observations and inherited gaps remain execution evidence, never presumed passes.

This delegated output intentionally does not modify STATE, ROADMAP, config, implementation, context/research/patterns or unrelated files and does not commit. The orchestrator owns final planning registration/commit.
