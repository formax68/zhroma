// Dev-only declarations for the type check (D-20). Not packaged, never
// shipped, and never under extension/.
//
// The types named here are the top-level JSDoc typedefs in
// extension/zhroma-settings.js, which is checked in the same program.
//
// tsconfig.json sets skipLibCheck, which also skips this file: a name
// misspelt here would silently become `any` rather than fail. Keep this file
// to names that file defines, and re-run the probe recorded in 07-08-SUMMARY.md
// after changing it.

/**
 * The one global the shared settings module defines. It is absent in any
 * context that did not load the module, and `settings` is absent if the
 * module stopped early (an existing non-object `Zhroma`).
 */
declare var Zhroma: { readonly settings?: ZhromaSettingsApi } | undefined;

/**
 * The worker's classic-script loader. Declared here rather than by adding
 * the WebWorker lib, which conflicts with DOM in one program.
 */
declare function importScripts(...urls: string[]): void;
