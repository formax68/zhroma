# Phase 7: Upgrade-Safe Foundation - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 gives the 1.0.0 codebase somewhere to keep new settings. It also proves that an agent who upgrades from 0.1.0, or installs fresh, sees and keeps exactly what 0.1.0 gave them. Nothing visible changes in this phase.

It delivers:

- the 0.1.0 parity harness;
- the contract-test split into frozen and versioned parts;
- the shared classic-script namespace and the settings module (key registry, validators, per-key schema versions, absence means default);
- the worker settings queue (single writer, serial, optional revision compare-and-swap) and tightened sender checks;
- the content-script settings reader, its change listener and the `settingsReady` gate;
- the `options_ui` stub, with `RELEASE_FILES` and inventory updates;
- `tsc --noEmit --checkJs`, dev-only.

Requirements: COMPAT-01, COMPAT-02, COMPAT-03, COMPAT-04, DATA-01.

Not in this phase: any theme other than Classic, any colour change, popup or toolbar changes, rules, identity, export/import, dark mode, the 1.0.0 version bump, and policy, listing or disclosure changes.

</domain>

<decisions>
## Implementation Decisions

The user was offered four areas: unreadable settings, how much lands now, type checking, and how much proof. They answered "nothing, sensible defaults for the above". The decisions below are Claude's recommended defaults, which the user accepted as a group. Phase 6 set the same precedent.

### Carried forward — not reopened

- **D-01:** The permission surface is frozen:
  - `permissions` is exactly `["storage"]`;
  - there is no `host_permissions`, `optional_permissions` or `optional_host_permissions`;
  - `matches` is exactly `https://*.zendesk.com/agent/*`, with `all_frames: false` and `world: "ISOLATED"`;
  - `minimum_chrome_version` stays `"106"`.

  Sources: Phase 4 D-05, ROADMAP standing constraints, REQUIREMENTS Out of Scope.
- **D-02:** `enabled` keeps exactly the behaviour it has today:
  - the same key name, the same boolean and the same read default of `true`;
  - the same worker single-writer path, epochs and apply handshake;
  - the same Phase 4 presentation for a non-boolean value ("Zhroma could not confirm that setting", `04-DECISIONS.json` `unknown_preference`).

  It is not folded into a settings object (ARCHITECTURE Anti-pattern 7). The persistent off state stays separate from the hidden/`pagehide` pause (Phase 4 D-10).
- **D-03:**
  - There is no build step, no bundler and no TypeScript emit. Shipped bytes equal repo bytes, unminified.
  - There are no network calls, no telemetry and no remote code.
  - Settings live only in `chrome.storage.local`. Shipped code never references `chrome.storage.sync` (DATA-01).
- **D-04:** There are no `onInstalled` writes. An absent key means its default, applied on read (COMPAT-02).
- **D-05:** Every settings write goes through the worker:
  - the content script never writes storage;
  - the popup never touches storage (v1 invariant);
  - extension pages may read storage directly (the options page, from Phase 10).
- **D-06:** Contract-test changes always go in their own commit, never mixed with feature code (ROADMAP Phase 7 note).
- **D-07:** The parity baseline is the rc-01 source revision `6d3ab0b10e9419a5c1077e59e468977c00d59d4a`, which `release/candidate.json` records as the bytes submitted as 0.1.0.
  - Today's `extension/` is byte-identical to it.
  - The harness reads it from pinned Git blobs, never from the working tree, and cross-checks each file against the sha256 values in `candidate.json`.

### Settings that can't be read

- **D-08:** A new settings key can be present but unreadable: it fails validation, it has an unknown or newer schema version, or the read itself fails. In each case it is treated as its default for everything Zhroma does, so the agent sees 0.1.0 behaviour.
  - Zhroma never deletes, rewrites or "repairs" that stored value on its own.
  - The value changes only when the agent saves that setting, or (from Phase 10) uses Reset.

  **Why:** a rollback build (STORE-10) or a later downgrade must not destroy settings a newer version wrote. Going forward again should find them intact.
- **D-09:** A settings failure never blocks priority tinting. This differs from `enabled`, which fails closed (D-02).
  - A failed or unreadable settings read falls back to defaults, and priority tinting goes ahead under the `enabled` state alone.
  - The `settingsReady` gate waits until the settings read settles, whether it succeeds or fails.
  - The gate has a time bound, so a hung read cannot keep rows untinted indefinitely.

  This records the research SUMMARY instruction (component 6: "Record this.").
- **D-10:** Each new key's value carries its own schema version.
  - **Older version:** migrated in memory on every read. The migrated form is written only when the agent next saves that key. There are no background upgrade writes, so COMPAT-02's "stores nothing new" holds.
  - **Newer version:** unreadable under D-08, never migrated down.

  **Reversibility:** costly after 1.0.0 ships. Once users have stored values, changing the per-key envelope needs a migration for data already on their devices. Before Phase 11 it stays reversible.
- **D-11:** Writes happen only on a real change.
  - Choosing the value already in effect writes nothing. On a fresh install, re-selecting Classic stores nothing.
  - Switching back to the default from another value stores the default explicitly, because it records a choice the agent made.
  - Only Reset (Phase 10, DATA-07) returns a key to absent.
- **D-12:** How an unreadable setting is shown to the agent is not decided here.
  - Phase 7 exposes it internally as a finite fact, for example a per-key status, with no user-visible text.
  - The wording is decided in the phase that first shows that setting: Phase 8 for theme, Phases 9 and 10 for rules and identity.

### What the settings layer holds at the end of Phase 7

- **D-13:** Phase 7 builds the machinery, not the feature schemas:
  - the shared settings module: key registry, defaults, per-key validators, the schema-version and `migrate` hook, and the size-cap framework;
  - the worker settings queue;
  - the content-script reader, the change listener and the gate.
- **D-14:** One real key is wired end to end: `theme`, whose only valid value in Phase 7 is Classic. Phase 8 extends the enum.
  - This exercises the full path: worker validates, `storage.local.set`, `storage.onChanged`, content re-read, and no row re-evaluation.
  - Nothing visible can change, so parity holds by construction.
  - No UI writes the key in Phase 7. Tests drive it through worker messages.

  **Reversibility:** costly after 1.0.0 ships. The key name and shape become stored user data; renaming either needs a migration.
- **D-15:** The `rules` and `identity` keys, their formats and their limits are defined in the phases that give them meaning: rules in Phase 9, alongside the tested semantics, and identity in Phase 10. The limits include rule count, condition count, string length and import size.
  - Adding a key must mean one registry entry, one validator and its tests, with no change to the queue or the reader.

  **Why:** fixing the rule format before Phase 9 has tested its semantics would invite a schema migration before 1.0.0 even ships.
- **D-16:** The worker queue supports revision compare-and-swap as a per-key option. Rules need it, because they can be edited from two windows (Phase 10).
  - In Phase 7, compare-and-swap is proven with keys injected by tests, which are not in the shipped registry.
  - Classic `theme` is last-writer-wins, because only the popup writes it.
- **D-17:** Sender checks are tightened in Phase 7.
  - **Why now:** the options stub (D-18) lets an extension page open in a tab, and v1's `fromContent` check also passes for an extension page in a tab.
  - Content-originated handlers must also check that the sender is a `https://*.zendesk.com/agent/` document.
  - Handlers for extension pages check `sender.url` against the packaged page URL.
  - v1's accepted popup and content message shapes and outcomes stay the same.
- **D-18:** The `options_ui` entry lands now, with `open_in_tab: true` and a static stub page.
  - The page has no script that writes storage, no `innerHTML`, no network use and one line of neutral text.
  - Only dev builds see it, because nothing publishes before Phase 11, and Phase 10 replaces it.
  - Doing it now means the manifest shape, file inventory, `RELEASE_FILES` and frozen contract change once, here, not again in Phase 10.
- **D-19:** The manifest `version` stays `0.1.0` in Phase 7. The bump to 1.0.0 belongs to the Phase 11 release plan.

### Type checking

- **D-20:** Adopt `tsc --noEmit --checkJs` in Phase 7, dev-only. Types never ship, nothing is emitted, and no config file goes under `extension/`.
- **D-21:** New shared files use `// @ts-check` and JSDoc types from the start. The accepted v1 files (`content.js`, `background.js`, `popup.js`) are handled like this:
  - They join the check only if they pass under non-strict settings with no edits made just for the checker.
  - A file that would need annotation-only byte changes is excluded, and the exclusion is listed in the config with a reason, until a later phase is already rewriting that file.
  - A genuine bug the checker finds in an accepted file is fixed as its own change, with a test, like any other bug.
- **D-22:** The check is blocking. It runs inside `npm test`, so a type error fails the suite like any test.
- **D-23:** There are two new dev dependencies, `typescript` and `@types/chrome`, pinned to exact versions.
  - The current versions are checked on the registry at install time. Research named `typescript@7.0.2`, with 6.0.x as the fallback if the Go-native compiler misbehaves, and `@types/chrome@0.3.0`.
  - The user approves each exact version in a separate question before installation. The verbatim answers go into `DEPENDENCY-APPROVALS.md`. Separate questions close the independence gap recorded for the v1.0 approvals.
  - The user's "sensible defaults" answer in this discussion is **not** that approval.
  - No other dependency is added in Phase 7. `fast-check` and `colorjs.io` are left for Phase 8 to decide.

### How much proof

- **D-24:** The differential parity harness (SC 1) runs the `6d3ab0b` blobs and the working tree side by side in the existing happy-dom harness.
  - It covers the three v1 fixtures plus the Phase 3/4 mutation sequences, with default settings in the light interface.
  - It compares row attributes, diagnoses and computed cell backgrounds.
  - It runs with storage in each of three upgrade states: empty (fresh install), only `enabled: false`, and only `enabled: true`.
  - It stays green in every later phase (ROADMAP standing constraint).
- **D-25:** The parity harness covers the page only, as SC 1 states. There is no new differential harness for the worker.
  - The worker, popup and toolbar are guarded by the existing v1 suites and the 39 v1 mutants. The suites must pass, and the mutants must still be killed, against the new bytes.
  - An assertion in an existing v1 test may change only in its own commit, with a written reason (the same rule as D-06).

  **Why:** keep the evidence proportionate (retrospective lesson 5).
- **D-26:** The contract test splits into two parts.
  - **Frozen invariants**, in a file later phases never edit:
    - D-01's permission surface;
    - no network APIs;
    - no `chrome.storage.sync`;
    - no `url(` in any shipped CSS;
    - no `importScripts` of anything but packaged relative paths;
    - no `web_accessible_resources` or `externally_connectable`.
  - **Versioned v1.0 pins:** the four hues, the file inventory, the `box-shadow` ban, "no colour literals in `content.js`", the manifest deep-equal and the Chrome API allowlist. Each is retired or restated only with a written reason, in the commit that changes it.

  Phase 7 itself updates the versioned inventory and manifest pins for the new files and the `options_ui` entry.
- **D-27:** COMPAT-02, COMPAT-03 and DATA-01 are proven by automated tests:
  - Simulated install and update events cause zero storage writes.
  - After any sequence of settings operations, only `chrome.storage.local` has been written and `sync` has not been touched.
  - After an upgrade with only `enabled` stored, storage still holds only `enabled` until a setting changes.
  - Shipped code contains no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` or `sendBeacon`.

  "No permission prompt" is proven here by the frozen manifest test. The real store-update prompt is observed in Phase 11.
- **D-28:** Phase 7 has no live smoke check.
  - **Why:** the phase changes nothing visible, the parity harness covers the default path, and the user's Chrome runs on a separate machine, so any live check needs a manual folder copy.
  - The upgrade-in-place scenario moves to the Phase 11 release-candidate checklist:
    1. Load 0.1.0 unpacked and switch it off.
    2. Replace the folder with the candidate bytes and reload.
    3. Confirm it is still off, the toolbar and popup look the same, and storage holds only `enabled`.
- **D-29:** Performance is checked in one session, on one machine.
  - The existing Chrome timing harness runs on the Phase 7 bytes and on the `6d3ab0b` bytes.
  - **Pass:** the working tree's zero-rule 30-row median is within 10% or 0.2 ms (whichever is larger) of the 0.1.0 run, and the existing budgets still pass.
  - Both absolute medians are recorded next to the v1 figures: 1.3 ms in Phase 3 and 1.4 ms after the Phase 3 repair.

  **Why the same session:** absolute timings drift across machines and Chrome versions.
- **D-30:** New mutants are added only for the new safety guards: sender checks, queue ordering, compare-and-swap, absence means default with no install writes, and local-only writes. Each is registered only after it is measured killed (the v1 pattern).
- **D-31:** Review and repair is capped at one round (retrospective lesson 2; Phase 6 D-23). Leftover non-blocking findings go to the backlog or `.planning/WINDOWS.md`.

### Claude's Discretion

- **File layout** for the shared files: flat `extension/zhroma-*.js` or `extension/lib/*.js`. Pick one, and add every new file deliberately to `RELEASE_FILES` and the inventory tests.
- **Namespace:** global names and how they are frozen. Each shared file is a classic IIFE on one frozen global, loaded first in `content_scripts.js[]`, by `importScripts` as the worker's first statement, and by `<script>` in pages.
- **Queue messages:** the message type names, the per-key status vocabulary (D-12), the `settingsReady` time bound (D-09), and the exact shape of the `theme` value.
- **Settings reader:** how it sits alongside the `enabled` read. They are separate reads, and the `enabled` path keeps its current behaviour.
- **Contract lists:** the exact frozen list beyond D-26's minimum, and the contents of the Chrome API allowlist.
- **Type-check config:** strictness for new files, and which v1 files pass unmodified (D-21).
- **Stub page:** its wording, and whether it links an existing stylesheet.
- **Commit order:** keep every commit green where possible, within D-06 and D-25.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and locked decisions
- `.planning/ROADMAP.md` — the Phase 7 section (goal, the five success criteria, notes) and "Standing constraints"
- `.planning/REQUIREMENTS.md` — COMPAT-01 to COMPAT-04, DATA-01, "Decisions recorded during scoping", Out of Scope
- `.planning/PROJECT.md` — the Key Decisions table (settings stay local, JS-resolved colours, no bundler)

### Research for this phase
- `.planning/research/SUMMARY.md` — the "Phase 7: Foundation" section, "Architecture Approach" (component 6, the settings-failure rule), Critical Pitfalls 2 and 3, and the file-layout conflict row
- `.planning/research/ARCHITECTURE.md` §7 — data flow, single writer, revision CAS; Anti-patterns 7 and 10; "Recommended Project Structure"; "Suggested build order" row 2
- `.planning/research/STACK.md` §1 (manifest delta), §2 (permission impact), §4 (storage schema, versioning, migration), §10 (tooling verdict, classic IIFE sharing)
- `.planning/research/PITFALLS.md` — Pitfall 2 (priority-path regression), Pitfall 3 (storage races, `enabled` folding), Pitfall 9 (permission creep)

### Carried-forward contracts
- `.planning/phases/04-honest-failure-and-an-off-switch/04-CONTEXT.md` — D-05, D-06, D-10, D-11
- `.planning/phases/04-honest-failure-and-an-off-switch/04-PREFERENCE-CONTRACT.md` — the accepted `enabled` preference contract
- `.planning/phases/04-honest-failure-and-an-off-switch/04-DECISIONS.json` — `unknown_preference` (confirm-unknown presentation)
- `.planning/phases/03-the-tint-survives-everything/03-PERFORMANCE.md` and `.planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE.md` — the timing baselines for D-29
- `.planning/RETROSPECTIVE.md` — Key Lessons 2, 4 and 5 (review cap, tests that read planning paths, proportionate evidence)
- `.planning/phases/06-live-dom-recon-2/06-CONTEXT.md` — D-22 (Phase 6 changed no shipped bytes, so the parity harness is unaffected)

### Baseline and release records
- `release/candidate.json` — the rc-01 `source_git_revision` `6d3ab0b…` and per-file sha256 values (parity baseline, D-07)
- `release/submission.json` — the 0.1.0 submission record (zip sha256)
- `DEPENDENCY-APPROVALS.md` — the approval-record format and the v1.0 independence gap (D-23)

### Code to extend
- `extension/manifest.json`, `extension/background.js`, `extension/content.js`, `extension/popup.js`, `extension/popup.html`, `extension/zhroma.css`
- `test/extension/runtime-contract.test.js` — the file to split (D-26)
- `scripts/release-source.js` — `RELEASE_FILES` and the inventory check
- `test/extension/chrome-harness.js`, `test/extension/tracer-world.js` — Chrome doubles and the strict seam
- `scripts/phase-04-source.js`, `test/extension/phase-04-live-acceptance.test.js` — existing pinned-Git-tree readers (`git ls-tree`)
- `scripts/verify-mutation-kills.js`, `test/mutants/*.json` — the mutant registry (D-25, D-30)
- `scripts/run-tint-workload.js`, `test/performance/` — the Chrome timing harness (D-29)
- `test/fixtures/manifest.json` and `test/fixtures/zendesk-view-{priority-present,priority-absent,grouped-long}.html` — the three v1 fixtures

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`background.js` preference path:**
  - `PREFERENCE_KEY = 'enabled'` and `readPreference` / `writePreference`, which handle `chrome.runtime.lastError`;
  - per-tab generation counters (`invalidate`, `generationOf`, `owns`);
  - bounded waits (`bounded`, `WORKER_REQUEST_TIMEOUT_MS`);
  - sender predicates `fromContent` and `fromPopup` (around lines 405-415).

  The settings queue and the D-17 checks extend these without changing the `enabled` path.
- **`content.js` preference path:** `preferenceGeneration` with `applyPreference`, the `chrome.storage.onChanged` listener (`onPreferenceChanged`), and the runtime message handler with its sender check (around line 482). The settings reader and its change listener copy this pattern with their own generation counter.
- **Chrome doubles:** `test/extension/chrome-harness.js` and `tracer-world.js` provide the storage, runtime and action doubles. The strict harness admits exactly the shipped Chrome seam, so each new seam (new `onChanged` keys, `importScripts`, an options-page sender) must be admitted deliberately.
- **Pinned-tree readers:** `scripts/phase-04-source.js` already reads a pinned revision's tree with `git ls-tree`. It is the model for loading the `6d3ab0b` blobs.

### Established Patterns
- Every duplicated constant has one agreement test that parses every copy, with a minimum match count.
- A mutant is registered only after it is measured killed.
- Evidence binds to bytes, and historical bytes come from pinned blobs.
- Tests read `.planning/phases/**` and `.planning/milestones/v1.0-REQUIREMENTS.md`, so those paths must not move.
- The runtime contract says shipped JS only reads the DOM and writes markers and lifecycle state. The new shared file must add no DOM writes.

### Integration Points
- **`manifest.json`:** `content_scripts.js[]` gains the shared settings file ahead of `content.js`, and `options_ui` is added. `permissions` is unchanged.
- **`background.js`:** `importScripts` as its first statement, plus settings handlers in the `onMessage` dispatch.
- **`content.js`:** `runnable()` gains the `settingsReady` gate, and a separate settings `onChanged` handler compares old and new values.
- **`scripts/release-source.js`:** `RELEASE_FILES` gains the shared file(s), `options.html` and any stub script.
- **`runtime-contract.test.js`:** split into the frozen and versioned files.

</code_context>

<specifics>
## Specific Ideas

- The user prefers few manual steps and batched confirmations. The only human steps planned for Phase 7 are the two separate dependency-version approvals (D-23).
- The user accepted defaults as a group in both Phase 6 and Phase 7. Plans should need no further decisions from them unless a locked constraint cannot be met.

</specifics>

<deferred>
## Deferred Ideas

- **Upgrade-in-place live check** → add it to the Phase 11 release-candidate checklist (D-28).
- **Wording for an unreadable setting** → Phase 8 for theme, Phases 9 and 10 for rules and identity (D-12).
- **Rules and identity key formats and limits** → Phase 9 (rules) and Phase 10 (identity) (D-15).
- **`fast-check` and `colorjs.io` dev dependencies** → decide in Phase 8.
- **Manifest version bump to 1.0.0** → Phase 11 (D-19).

</deferred>

---

*Phase: 07-upgrade-safe-foundation*
*Context gathered: 2026-09-28*
