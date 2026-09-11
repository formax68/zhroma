// Phase 4 historical source adapter (05-03). Developer tooling only: nothing
// here ships inside the extension, and nothing here is imported by extension
// runtime code.
//
// SKELETON — the contract is declared here so the failing acceptance tests fail
// on an assertion about behaviour rather than on module resolution. The real
// Git-backed implementation lands in the GREEN commit.
export class Phase04SourceError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'Phase04SourceError';
    this.code = code;
  }
}

export const BASELINE_PATH = '.planning/phases/05-published/05-BASELINE.json';

export function readBaseline() {
  return null;
}

export function readPhase04Source() {
  return {
    observation_revision: null,
    runtime_revision: null,
    names: [],
    assets: {},
    digest: null,
    files: {},
    manifest: null,
    contentSource: null,
    timingHarnessHash: null,
    evidenceHashes: {},
  };
}
