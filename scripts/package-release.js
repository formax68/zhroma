// RED-phase skeleton (05-01). The packaging and validation contract exists as
// an API shape only; every behaviour is asserted by
// test/extension/release-package.test.js and implemented in the GREEN commit.

export class ReleasePackageError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleasePackageError';
    this.code = code;
  }
}

export function packageRelease() {
  return { code: '', version: '', candidate: null };
}

export function validateReleaseArchive() {
  return { sha256: '', entries: [], extractedPath: null };
}
