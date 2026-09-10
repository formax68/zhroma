// Re-runnable out-of-tree mutation gate.
//
// "The mutant is dead" is otherwise an assertion the reader has to take on
// trust. 04-REVIEW ran 43 single-clause mutants by hand and found seventeen
// survivors; this turns that one-off method into a command anyone can run.
//
// For each registered mutant the gate builds a throwaway copy of the
// repository, applies one literal single-clause edit inside it, runs the named
// suites there, and requires the run to FAIL. A mutant that passes is a guard
// nothing is protecting.
//
// Out of tree on purpose: the working tree is never modified, so a run that is
// interrupted cannot leave a mutated source behind.
//
// Privacy note (T-04G-08): the copy includes `.planning/`. It is removed in a
// `finally`, `.git` and `node_modules` are symlinked rather than copied, and
// nothing but mutant ids and exit statuses is ever printed.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REGISTRY_DIR = join(REPOSITORY_ROOT, 'test', 'mutants');
const REGISTRY_SUFFIX = '.mutants.json';
// Symlinked rather than copied: `node_modules` for cost, `.git` because the
// two history-bound acceptance suites read their pinned assets with
// `git show <revision>:extension/<name>` and fail at file level without it —
// which would report every mutant as killed for the wrong reason.
const LINKED = ['node_modules', '.git'];

class MutationGateError extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : `${code} ${detail}`);
    this.name = 'MutationGateError';
    this.code = code;
  }
}

const requireValue = (condition, code, detail) => {
  if (!condition) throw new MutationGateError(code, detail);
};

/** Every `*.mutants.json` in `test/mutants`, concatenated in filename order. */
function loadRegistry() {
  let names;
  try {
    names = readdirSync(REGISTRY_DIR).filter((name) => name.endsWith(REGISTRY_SUFFIX)).sort();
  } catch {
    throw new MutationGateError('registry-directory-required', REGISTRY_DIR);
  }
  requireValue(names.length > 0, 'registry-empty', REGISTRY_DIR);

  const entries = [];
  const seen = new Set();
  for (const name of names) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(join(REGISTRY_DIR, name), 'utf8'));
    } catch {
      throw new MutationGateError('registry-unparseable', name);
    }
    requireValue(Array.isArray(parsed), 'registry-not-an-array', name);
    for (const entry of parsed) {
      requireValue(entry !== null && typeof entry === 'object' && !Array.isArray(entry), 'entry-not-an-object', name);
      for (const field of ['id', 'file', 'find', 'replace', 'note']) {
        requireValue(typeof entry[field] === 'string', 'entry-field-required', `${name} ${entry.id ?? '?'} ${field}`);
      }
      requireValue(entry.id.length > 0, 'entry-id-required', name);
      requireValue(entry.find.length > 0, 'entry-find-required', entry.id);
      requireValue(Array.isArray(entry.suites) && entry.suites.length > 0, 'entry-suites-required', entry.id);
      requireValue(entry.suites.every((suite) => typeof suite === 'string' && suite.length > 0), 'entry-suite-invalid', entry.id);
      const count = entry.count === undefined ? 1 : entry.count;
      requireValue(Number.isInteger(count) && count >= 1, 'entry-count-invalid', entry.id);
      requireValue(!seen.has(entry.id), 'entry-id-duplicated', entry.id);
      seen.add(entry.id);
      entries.push({ ...entry, count, registry: name });
    }
  }
  return entries;
}

/**
 * A stale `find` literal is a silent no-op — the exact class of defect this
 * gate exists to catch — so a count mismatch is loud, and it is checked for
 * every selected mutant BEFORE any suite is run.
 */
function assertFindCounts(entries) {
  for (const entry of entries) {
    const path = join(REPOSITORY_ROOT, entry.file);
    let source;
    try {
      source = readFileSync(path, 'utf8');
    } catch {
      throw new MutationGateError('mutant-file-unreadable', `${entry.id} ${entry.file}`);
    }
    const found = source.split(entry.find).length - 1;
    requireValue(found === entry.count, 'mutant-find-count-mismatch',
      `${entry.id} expected ${entry.count} occurrence(s) in ${entry.file}, found ${found}`);
  }
}

/** A throwaway copy of the repository with the real `.git` and `node_modules` linked in. */
function buildCopy() {
  const dir = mkdtempSync(join(tmpdir(), 'zhroma-mutant-'));
  cpSync(REPOSITORY_ROOT, dir, {
    recursive: true,
    filter: (source) => !LINKED.includes(basename(source)),
  });
  for (const name of LINKED) symlinkSync(join(REPOSITORY_ROOT, name), join(dir, name), 'dir');
  return dir;
}

/** Apply the literal replacement, run the named suites there, and report the exit status. */
function runMutant(entry) {
  const dir = buildCopy();
  try {
    const path = join(dir, entry.file);
    const source = readFileSync(path, 'utf8');
    writeFileSync(path, source.split(entry.find).join(entry.replace));
    const result = spawnSync(
      process.execPath,
      ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.js', ...entry.suites],
      { cwd: dir, encoding: 'utf8', timeout: 600000 },
    );
    // A mutant is KILLED when the suite refuses it. Anything that is not a
    // clean exit 0 — a failed assertion, a crash, a timeout — is the suite
    // declining to accept the mutation.
    return { killed: result.status !== 0, status: result.status };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function parseArguments(argv) {
  let only = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--only') {
      only = argv[index + 1];
      requireValue(typeof only === 'string' && only.length > 0 && !only.startsWith('--'), 'only-value-required');
      index += 1;
      continue;
    }
    throw new MutationGateError('argument-unrecognized', argument);
  }
  return { only };
}

function runCli() {
  try {
    const { only } = parseArguments(process.argv.slice(2));
    const registry = loadRegistry();
    const selected = only === null ? registry : registry.filter((entry) => entry.id === only);
    requireValue(selected.length > 0, 'only-id-unknown', only);

    assertFindCounts(selected);

    let killed = 0;
    for (const entry of selected) {
      const result = runMutant(entry);
      if (result.killed) killed += 1;
      const verdict = result.killed ? 'killed' : 'SURVIVED';
      process.stdout.write(`${entry.id}: ${verdict} (exit ${result.status}) — ${entry.note}\n`);
    }

    process.stdout.write(`MUTATION KILLS: ${killed}/${selected.length} killed\n`);
    if (killed !== selected.length) process.exitCode = 1;
  } catch (error) {
    const code = error instanceof MutationGateError ? error.code : 'unexpected-error';
    process.stderr.write(`MUTATION_GATE_REJECTED ${code}: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
