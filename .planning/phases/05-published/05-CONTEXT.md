# Phase 5: Published - Context

**Gathered:** 2026-09-11
**Status:** Ready for planning
**Authority:** User discussed all four areas and authorized writing context with “go”. Publication itself remains subject to final review and authorization.

<domain>
## Phase Boundary

Deliver STORE-01, STORE-04 and STORE-06: a public Chrome Web Store release, an accessible privacy policy with accurate disclosures, and a recorded pre-submission smoke run bound to the packaged source. Prepare the listing, icons, screenshots, package and account/submission guidance. Keep the public footprint to what publication requires.

Preparation is authorized despite predecessor acceptance limitations. This context does not mark Phase 3 or Phase 4 complete, restart skipped UAT, or authorize public submission.
</domain>

<decisions>
## Implementation Decisions

### Publisher and Contact
- **D-01:** Publish personally as **Michalis Efstratiadis**. The user has no Chrome Web Store developer account; include account setup in the execution plan and guide the user through required account actions.
- **D-02:** Use **zhroma@efstratiadis.me** where publication requires contact information. The later instruction “just what is required to publish” supersedes optional support-email placement and an optional homepage. Mailbox existence and verification are not established by this discussion.

### Listing and Branding
- **D-03:** Store title: **Zhroma — Priority Colours for Zendesk**.
- **D-04:** Lead with **“See ticket priorities at a glance.”** Use practical, direct copy describing the benefit, requirements and privacy. Do not invent broader compatibility or imply Zendesk endorsement.
- **D-05:** Put a short **“Works with”** section immediately after the opening benefit: English current Agent Workspace views, a visible Priority column, and light-interface use; dark-mode support is outside v1. Preserve the verified scope rather than promising every locale, shell, domain or account configuration.
- **D-06:** Icon and promotional direction: a simple **Z with a restrained priority-colour accent**, readable at small sizes. Exact artwork is implementation discretion within that direction and remains reviewable. Preserve meaningful toolbar status distinctions when adapting assets.

### Screenshots
- **D-07:** Use the user's real working Zendesk view; no sandbox or demo account is available. Replace sensitive details with neutral fictional text in the screenshot presentation, retaining real layout, actual priority values and genuine extension tinting. This does not authorize editing operational tickets or saved views.
- **D-08:** Main image: the same view side by side with tinting off and on. Include one supporting screenshot of the popup showing its on/off switch.
- **D-09:** Do **not** add the proposed “Ticket details replaced for privacy” caption. Remove identifying subjects, names, emails, IDs, account details and other confidential content. Only sanitised images belong in repository/public assets; review the complete image before publication. Keep internal provenance honest about replacement text and do not fabricate runtime evidence.

### Minimal Hosting and Guided Release
- **D-10:** Host only the required privacy-policy page using **GitHub Pages**, in a separate public repository owned by the user's personal **formax68** account, using its default `github.io` address. No personal website, custom domain, homepage or optional marketing site. Repository name is routine implementation discretion; account access and actual URL remain to be verified.
- **D-11:** The user requested omission of a policy if unnecessary. Chrome's current FAQ explicitly includes website content and local processing in user-data handling and requires a policy for such products. Zhroma's local priority reading therefore warrants retaining STORE-04. Keep the policy concise and accurate: actual local processing, one stored on/off preference, no ticket-data transmission or analytics. Distinguish local handling from collection by the publisher; do not claim the extension never accesses data. Align the dashboard declarations with source and current official guidance.
- **D-12:** Guide the user through eventual submission step by step after they review the release package. Prepare concrete copy, policy, sanitised images, assets, package and smoke evidence first. Preserve final authorization for public submission and user control over login, verification and account actions.

### Carried-Forward Constraints and Release Evidence
- **D-13:** No new permissions, dependencies, bundler, remote code, telemetry or runtime network calls. Preserve `storage` as the only permission, no `host_permissions`, and content-script matches of `https://*.zendesk.com/agent/*`. Persist exactly one boolean; no ticket persistence, transmission or logging. Runtime source remains unminified and packaged bytes equal repository source.
- **D-14:** Bind release checks to the exact packaged source. Changes to shipped assets, including manifest or icons, require appropriate revalidation; do not silently reuse stale source-bound acceptance. Research current official requirements for assets, disclosures, account setup and submission before prescribing them.
- **D-15:** Preserve the Phase 5 handoff: Phase 3 remains `human_needed` with eleven live passes and nine skipped-by-user checks; Phase 4 remains `human_needed` with fourteen of seventeen current-source live checks passed. `language-icon-copy` and `structure-copy` remain pending under AR-04-01; `english-regional-locale` is explicitly deferred as non-blocking. Do not turn these into passes or promote pending requirements. Document release-readiness implications and resolve any actual submission blocker before requesting final submission approval.

### Agent's Discretion
- Choose routine file organisation, minimal policy presentation, repository name, exact artwork within D-06, screenshot composition and release-check implementation.
- Accepted recommendations above are specific decisions, not unrestricted delegation. No new feature scope or public submission is authorized here.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and Acceptance
- `.planning/ROADMAP.md` — Phase 5 goal, requirements and success criteria.
- `.planning/REQUIREMENTS.md` — STORE-01/04/06, runtime constraints and v2 exclusions.
- `.planning/PROJECT.md` — Core value and zero-network product boundary; reconcile older status wording with current handoff.
- `.planning/phases/05-published/05-HANDOFF.md` — Preparation authorization and predecessor evidence limits.
- `.planning/phases/03-the-tint-survives-everything/03-VERIFICATION.md` — Separate incomplete Phase 3 acceptance.
- `.planning/phases/04-honest-failure-and-an-off-switch/04-VERIFICATION.md` — Canonical Phase 4 verdict.
- `.planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md` — Exact live passes and pending cases.
- `.planning/phases/02-first-tint-on-a-real-view/02-CONTEXT.md` — Tint, privacy and source-byte contracts.
- `.planning/phases/03-the-tint-survives-everything/03-CONTEXT.md` — Lifecycle and recovery boundaries.
- `.planning/phases/04-honest-failure-and-an-off-switch/04-CONTEXT.md` — Diagnosis and popup scope; use current implementation and acceptance to resolve historically open items.
- `DEPENDENCY-APPROVALS.md` — Existing exact-version approval boundary.

### Current Source
- `extension/manifest.json` — Current version, permission, match and icon declarations.
- `extension/popup.html` — Existing status panel and switch screenshot surface.
- `extension/zhroma.css` — Authoritative product palette.
- `package.json` — Existing tests and pinned tools.

### Official Publication Guidance Consulted During Discussion
- https://developer.chrome.com/docs/webstore/set-up-account — Public publisher name and required verified contact email.
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq — Local processing, website content, privacy policy and truthful disclosures, especially questions 2–6 and 14.
- https://developer.chrome.com/docs/webstore/program-policies/policies — Current publication and user-data rules.
- https://docs.github.com/en/pages/quickstart — Public-repository GitHub Pages hosting.

External URLs are official references, not repository paths. Recheck time-sensitive rules during research and submission.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extension/` already contains content logic, declarative CSS, background worker, popup and five status icon assets.
- `extension/popup.html` supplies the supporting screenshot surface without adding new UI.
- Existing test scripts in `package.json` provide the starting regression checks.

### Established Patterns
- No production build step; package the exact approved extension source without development evidence or tooling.
- The inspected manifest is version `0.1.0`, with only a 32-pixel icon entry. Publication asset requirements require current research; do not assume this asset set is sufficient.
- Preserve the native view and real runtime tinting while sanitising screenshot content. Sanitised marketing images are not proof of previously unobserved acceptance cases.

### Integration Points
- Store title and release icon work may change manifest/assets and therefore the source identity used for acceptance.
- The separate policy repository is the public hosting surface. Its creation and deployment belong to execution, not this context-gathering task.
- Release-readiness documentation must connect packaged bytes, smoke evidence, public disclosures and outstanding predecessor acceptance.
</code_context>

<specifics>
## Specific Ideas
- “Zhroma — Priority Colours for Zendesk” and “See ticket priorities at a glance.” are user-approved wording.
- “Just what is required to publish” is the governing public-site scope preference.
- User explicitly rejected the privacy caption but accepted fictional replacement text and a genuine side-by-side comparison.
</specifics>

<deferred>
## Deferred Ideas

No new capabilities were proposed for later phases. An optional homepage and extra public contact placement were rejected, not deferred deliverables. Preserve existing v2 exclusions, including dark mode, configurable palettes, additional locales and alternative tint treatments.
</deferred>
