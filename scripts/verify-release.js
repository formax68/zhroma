// Release verification CLI (05-04). Developer tooling only.
//
// RED SKELETON — the entry point and flag surface exist so the CLI tests fail
// on their own assertions. Verification behaviour lands in the GREEN commit.
import { pathToFileURL } from 'node:url';

export class ReleaseVerifyError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleaseVerifyError';
    this.code = code;
  }
}

export function parseArgs(argv) {
  const options = { requireSmoke: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--require-smoke') options.requireSmoke = true;
    else if (argument === '--candidate') options.candidate = argv[index += 1];
    else if (argument === '--run') options.run = argv[index += 1];
    else throw new ReleaseVerifyError('unknown-argument');
  }
  if (typeof options.candidate !== 'string' || options.candidate.trim() === '') {
    throw new ReleaseVerifyError('candidate-path-required');
  }
  return options;
}

export function verifyRelease(options) {
  return { status: 'human_needed', options };
}

export async function runCli(argv = process.argv.slice(2)) {
  try {
    const result = verifyRelease(parseArgs(argv));
    process.stdout.write(`RELEASE_EVIDENCE_OK ${result.status}\n`);
  } catch (error) {
    process.stderr.write(`RELEASE_EVIDENCE_REJECTED ${error?.code ?? 'unexpected-error'}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
