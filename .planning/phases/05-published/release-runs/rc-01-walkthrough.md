# RC-01 user walkthrough

Report received 2026-09-14 at 08:39:40 UTC (recording time).

The user reported `ready` after instructions to disable other Zhroma copies, load `/tmp/zhroma-release-rc-01/zhroma-0.1.0`, and open an English light-interface Zendesk view with a Priority column. They then reported `pass` to these five specific checks:

1. Rows already tinted by priority before touching the switch.
2. Popup shows the on/off switch and working status.
3. Switching off clears all tints without refreshing.
4. Switching on restores correct tints without refreshing.
5. Sorting once preserves correct tinting.

These are user-reported behavioral passes, not automated observations. The canonical JSON remains pending until environment and fresh-preference provenance can be recorded truthfully: not touching the switch during this walkthrough does not establish that no saved preference existed beforehand. Browser restart persistence and extension error/network inspection have not yet been reported. No previous phase acceptance is changed.

## User decision to stop UAT

On 14 September 2026 the user stated: "everything works, skip UAT and let's finish publishing this". Stop all further UAT prompts and proceed with publication preparation and submission work. This explicit instruction overrides the remaining local release-smoke gate for this publication attempt. Do not mark unperformed checks passed or alter predecessor acceptance. The five specific reported outcomes above are preserved; the general assurance is not evidence of each remaining scenario. Store-required assets and truthful policy declarations still need completion.
