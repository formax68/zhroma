# Roadmap: Zhroma

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-09-14, closed 2026-09-25 with known gaps) — [archive](milestones/v1.0-ROADMAP.md) · [requirements](milestones/v1.0-REQUIREMENTS.md)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-09-14</summary>

- [x] Phase 1: DOM Recon Spike (15/15 plans) — completed 2026-09-08
- [x] Phase 2: First Tint on a Real View (3/3 plans) — completed 2026-09-09
- [~] Phase 3: The Tint Survives Everything (3/4 plans; 03-04 halted) — verification `human_needed`, 11/20 live checks passed
- [~] Phase 4: Honest Failure and an Off Switch (20/20 plans) — verification `human_needed`, 14/17 live checks passed
- [~] Phase 5: Published (3/7 plans in GSD; 05-04 to 05-07 finished outside GSD) — 0.1.0 submitted 2026-09-14, reported live 2026-09-25

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. DOM Recon Spike | v1.0 | 15/15 | Complete | 2026-09-08 |
| 2. First Tint on a Real View | v1.0 | 3/3 | Complete | 2026-09-09 |
| 3. The Tint Survives Everything | v1.0 | 3/4 | Shipped; human_needed | 2026-09-14 |
| 4. Honest Failure and an Off Switch | v1.0 | 20/20 | Shipped; human_needed | 2026-09-14 |
| 5. Published | v1.0 | 3/7 | Shipped outside GSD | 2026-09-14 |

Known gaps carried out of v1.0 are listed in [MILESTONES.md](MILESTONES.md) and in the STATE.md Deferred Items section.

## Standing constraints

- **The permission set is frozen.** Any change to the manifest's permission surface triggers extended review on every later update. Currently: `storage` only, no `host_permissions`, matches `https://*.zendesk.com/agent/*` only.
- **Route detection is an anti-requirement.** A view switch is already a large DOM mutation that the observer handles. Do not plan history patching, `webNavigation` or a Navigation API path.
- **No build step, no bundler.** Hand-written files, zipped. Shipped bytes equal repo bytes.
- **Evidence binds to bytes.** Any shipped-byte change invalidates live observations taken on the old bytes. Tests read `.planning/phases/**` and `.planning/milestones/v1.0-REQUIREMENTS.md`, so do not move either without updating the tests.

---
*Roadmap created: 2026-09-02 · v1.0 archived: 2026-09-25*
