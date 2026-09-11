// RED-phase skeleton (05-01). The release source inventory contract exists as
// an API shape only; every behaviour is asserted by
// test/extension/release-package.test.js and implemented in the GREEN commit.

export class ReleaseSourceError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleaseSourceError';
    this.code = code;
  }
}

export const RELEASE_FILES = Object.freeze([]);

export function readReleaseSource() {
  return { directory: '', assets: [], digest: '' };
}

export function compareReleaseSources() {
  return false;
}
