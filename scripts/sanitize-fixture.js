import { createHash } from 'node:crypto';
import { access, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  PRIORITY_LABELS, PRIORITY_HEADER_LABEL, PRESERVED_ATTRIBUTES,
  TEXTUAL_ARIA_ATTRIBUTES, REFERENCE_ATTRIBUTES, REMOVABLE_ATTRIBUTES,
  normalizedAriaValue, assertSafeToParse, parseBoundedCapture,
  validateSanitizedOutput, SanitizedOutputError,
} from './sanitized-output-contract.js';

import {
  scanSensitiveContent,
  SensitiveFixtureError,
} from './sensitive-patterns.js';

import {
  DEFAULT_RULE_VOCABULARY,
  RULE_STRUCTURAL_WORDS,
  normaliseRuleValue,
  parseRuleColumnCapture,
  ruleVocabularyWords,
  tokeniseRuleColumns,
  validateRuleColumnOutput,
} from './rule-column-contract.js';

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MODULE_DIRECTORY = dirname(fileURLToPath(import.meta.url));

export class SanitizationError extends Error {
  constructor(code) {
    super('Fixture sanitization rejected');
    this.name = 'SanitizationError';
    this.code = code;
  }
}

function reject(code) {
  throw new SanitizationError(code);
}

export function sha256(bytes) {
  if (!(typeof bytes === 'string' || ArrayBuffer.isView(bytes))) {
    reject('hashable-bytes-required');
  }
  return createHash('sha256').update(bytes).digest('hex');
}

function requiredPath(value, code) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    reject(code);
  }
  return resolve(value);
}

function isWithin(parent, child) {
  const fromParent = relative(parent, child);
  return fromParent === '' || (!fromParent.startsWith('..') && !isAbsolute(fromParent));
}

async function resolvedExistingPath(path, code) {
  try {
    return await realpath(path);
  } catch {
    reject(code);
  }
}

async function resolvedOutputPath(path) {
  try {
    await access(path);
    return await realpath(path);
  } catch {
    return path;
  }
}

async function findGitWorktreeRoot(startPath) {
  let candidate = resolve(startPath);
  while (true) {
    try {
      await access(resolve(candidate, '.git'));
      return await realpath(candidate);
    } catch {
      const parent = dirname(candidate);
      if (parent === candidate) {
        reject('worktree-unavailable');
      }
      candidate = parent;
    }
  }
}

async function readRequiredBytes(path, code) {
  try {
    return await readFile(path);
  } catch {
    reject(code);
  }
}

async function assertFileSize(path, { minimum, maximum, code }) {
  let details;
  try {
    details = await stat(path);
  } catch {
    reject(code);
  }
  if (!details.isFile() || details.size < minimum || details.size > maximum) {
    reject(code);
  }
}

function decodeUtf8(bytes, code) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    reject(code);
  }
}

function parseDenylist(bytes) {
  const values = decodeUtf8(bytes, 'denylist-required')
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length === 0) {
    reject('denylist-required');
  }
  return values;
}

const RULE_COLUMNS_MODE = 'rule-columns';
const RULE_BOUNDARY_VALUES = Object.freeze(['table', 'identity-region']);
const SELF_DIRECTIVE = 'self:';
const SELF_ALT_DIRECTIVE = 'self-alt:';

/** Resolve the opt-in rule-columns options; `null` keeps the unchanged v1 default path. */
function ruleModeOptions(options) {
  if (options.mode === undefined) {
    if (options.boundary !== undefined) {
      reject('boundary-invalid');
    }
    return null;
  }
  if (options.mode !== RULE_COLUMNS_MODE) {
    reject('mode-invalid');
  }
  const boundary = options.boundary ?? 'table';
  if (!RULE_BOUNDARY_VALUES.includes(boundary)) {
    reject('boundary-invalid');
  }
  return { boundary };
}

/*
 * A denylist entry that lies inside a word every admitted output carries (kept vocabulary, token
 * stems, element and attribute names, Garden identifiers) would make every admission fail as
 * `sensitive-residual`. Report it before the capture is parsed; the scan itself stays unchanged.
 */
function assertNoDenylistCollision(scanList) {
  const collisionWords = [...ruleVocabularyWords(DEFAULT_RULE_VOCABULARY), ...RULE_STRUCTURAL_WORDS];
  for (const entry of scanList) {
    const folded = normaliseRuleValue(entry).toLocaleLowerCase('en-US');
    if (collisionWords.some((word) => word.includes(folded))) {
      reject('denylist-entry-collides');
    }
  }
}

/**
 * Rule-columns denylist: plain lines keep v1 semantics; exactly one `self:` line names the
 * agent's own display-name form. The bare form joins the scan list, because the scan is a
 * case-folded substring test and a literal prefix would never match content.
 */
function parseRuleDenylist(bytes) {
  const lines = decodeUtf8(bytes, 'denylist-required')
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    reject('denylist-required');
  }

  const scanList = [];
  let self = null;
  let selfAlt = null;
  for (const line of lines) {
    if (line.startsWith(SELF_ALT_DIRECTIVE)) {
      const value = line.slice(SELF_ALT_DIRECTIVE.length).trim();
      if (selfAlt !== null || value.length === 0) {
        reject('self-directive-invalid');
      }
      selfAlt = value;
      scanList.push(value);
      continue;
    }
    if (line.startsWith(SELF_DIRECTIVE)) {
      const value = line.slice(SELF_DIRECTIVE.length).trim();
      if (self !== null || value.length === 0) {
        reject('self-directive-required');
      }
      self = value;
      scanList.push(value);
      continue;
    }
    scanList.push(line);
  }
  if (self === null) {
    reject('self-directive-required');
  }
  assertNoDenylistCollision(scanList);
  return { scanList, selfForms: { self, selfAlt } };
}

function ruleColumnMarkup(source, ruleDenylist, ruleOptions) {
  let capture;
  try {
    assertSafeToParse(source);
    capture = parseRuleColumnCapture(source, { boundary: ruleOptions.boundary });
    tokeniseRuleColumns(capture, { selfForms: ruleDenylist.selfForms });
  } catch (error) {
    if (error instanceof SanitizedOutputError) reject(error.code);
    throw error;
  }
  const output = `${capture.root.outerHTML}\n`;

  try {
    scanSensitiveContent(output, { denylist: ruleDenylist.scanList });
  } catch (error) {
    if (error instanceof SensitiveFixtureError) {
      reject('sensitive-residual');
    }
    throw error;
  }
  try {
    validateRuleColumnOutput(output, { boundary: ruleOptions.boundary });
  } catch {
    reject('output-contract-violated');
  }
  return output;
}


function sanitizeAttributes(root) {
  let ariaCounter = 0;
  const elements = [root, ...root.querySelectorAll('*')];

  for (const element of elements) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLocaleLowerCase('en-US');

      if (name.startsWith('on')) {
        reject('inline-event-handler');
      }
      if (
        ['src', 'srcset', 'href', 'xlink:href', 'action', 'formaction', 'poster', 'srcdoc']
          .includes(name)
      ) {
        reject('resource-bearing-attribute');
      }
      if (REFERENCE_ATTRIBUTES.has(name) || REMOVABLE_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (TEXTUAL_ARIA_ATTRIBUTES.has(name)) {
        ariaCounter += 1;
        element.setAttribute(attribute.name, `ARIA-${String(ariaCounter).padStart(3, '0')}`);
        continue;
      }
      if (name.startsWith('aria-')) {
        const normalized = normalizedAriaValue(name, attribute.value);
        if (normalized === undefined) {
          reject('unsafe-aria-attribute');
        }
        if (normalized === null) {
          reject('aria-attribute-invalid');
        }
        element.setAttribute(attribute.name, normalized);
        continue;
      }
      if (PRESERVED_ATTRIBUTES.has(name)) {
        continue;
      }

      reject('unsafe-attribute');
    }
  }
}

function sanitizeTextAndComments(root, priorityCells, priorityHeaderCell) {
  let textCounter = 0;

  function visit(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 8) {
        child.remove();
        continue;
      }
      if (child.nodeType === 3) {
        const trimmed = child.data.trim();
        const allowedPriorityCell = [...priorityCells].find((cell) => cell.contains(child));
        const preservePriority = PRIORITY_LABELS.has(trimmed)
          && allowedPriorityCell?.textContent.trim() === trimmed;
        const preserveHeader = trimmed === PRIORITY_HEADER_LABEL
          && priorityHeaderCell?.contains(child)
          && priorityHeaderCell.textContent.trim() === PRIORITY_HEADER_LABEL;
        if (trimmed.length > 0 && !preservePriority && !preserveHeader) {
          textCounter += 1;
          child.data = `TEXT-${String(textCounter).padStart(3, '0')}`;
        } else if (preservePriority || preserveHeader) {
          child.data = trimmed;
        }
        continue;
      }
      visit(child);
    }
  }

  visit(root);
}

function finalMarkup(root, priorityCells, priorityHeaderCell, denylist) {
  sanitizeAttributes(root);
  sanitizeTextAndComments(root, priorityCells, priorityHeaderCell);
  const output = `${root.outerHTML}\n`;

  try {
    scanSensitiveContent(output, { denylist });
  } catch (error) {
    if (error instanceof SensitiveFixtureError) {
      reject('sensitive-residual');
    }
    throw error;
  }
  try {
    validateSanitizedOutput(output);
  } catch {
    reject('output-contract-violated');
  }
  return output;
}

export async function sanitizeFixture(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    reject('options-required');
  }
  const ruleOptions = ruleModeOptions(options);

  const inputPath = requiredPath(options.inputPath, 'input-required');
  const outputPath = requiredPath(options.outputPath, 'output-required');
  const denylistPath = requiredPath(options.denylistPath, 'denylist-required');
  const projectRealPath = await findGitWorktreeRoot(MODULE_DIRECTORY);
  const denylistRealPath = await resolvedExistingPath(denylistPath, 'denylist-required');
  if (isWithin(projectRealPath, denylistRealPath)) {
    reject('denylist-inside-worktree');
  }
  const inputRealPath = await resolvedExistingPath(inputPath, 'input-readable-required');
  const outputRealPath = await resolvedOutputPath(outputPath);
  if (denylistRealPath === inputRealPath || denylistRealPath === outputRealPath) {
    reject('denylist-inside-worktree');
  }

  if (inputRealPath === outputRealPath) {
    reject('input-output-must-differ');
  }
  if (isWithin(projectRealPath, inputRealPath)) {
    reject('input-inside-worktree');
  }

  await assertFileSize(denylistRealPath, {
    minimum: 1,
    maximum: 64 * 1024,
    code: 'denylist-required',
  });
  const denylistBytes = await readRequiredBytes(denylistRealPath, 'denylist-required');
  const ruleDenylist = ruleOptions ? parseRuleDenylist(denylistBytes) : null;
  const denylist = ruleDenylist ? ruleDenylist.scanList : parseDenylist(denylistBytes);
  await assertFileSize(inputRealPath, {
    minimum: 1,
    maximum: MAX_INPUT_BYTES,
    code: 'input-size-out-of-bounds',
  });
  const inputBytes = await readRequiredBytes(inputRealPath, 'input-readable-required');

  const source = decodeUtf8(inputBytes, 'input-utf8-required');
  let output;
  if (ruleOptions) {
    output = ruleColumnMarkup(source, ruleDenylist, ruleOptions);
  } else {
    let capture;
    try {
      assertSafeToParse(source);
      capture = parseBoundedCapture(source);
    } catch (error) {
      if (error instanceof SanitizedOutputError) reject(error.code);
      throw error;
    }
    const { root, priorityCells, priorityHeaderCell } = capture;
    output = finalMarkup(root, priorityCells, priorityHeaderCell, denylist);
  }
  const outputBytes = Buffer.from(output, 'utf8');

  try {
    await writeFile(outputPath, outputBytes, { flag: 'wx' });
  } catch {
    reject('output-write-failed');
  }

  return {
    sha256: sha256(outputBytes),
    bytes: outputBytes.byteLength,
  };
}

/**
 * The opt-in rule-columns CLI forms: the three v1 flags plus `--mode rule-columns` (8 arguments),
 * optionally with `--boundary <table|identity-region>` (10 arguments).
 */
function parseRuleCliArguments(argumentsList) {
  const allowedFlags = argumentsList.length === 10
    ? ['--input', '--output', '--denylist', '--mode', '--boundary']
    : ['--input', '--output', '--denylist', '--mode'];
  if (argumentsList.length !== allowedFlags.length * 2) {
    reject('cli-arguments-invalid');
  }

  const values = {};
  for (let index = 0; index < argumentsList.length; index += 2) {
    const flag = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!allowedFlags.includes(flag) || values[flag]) {
      reject('cli-arguments-invalid');
    }
    if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
      reject('cli-arguments-invalid');
    }
    values[flag] = value;
  }

  if (allowedFlags.some((flag) => !values[flag]) || values['--mode'] !== RULE_COLUMNS_MODE) {
    reject('cli-arguments-invalid');
  }
  if (values['--boundary'] !== undefined && !RULE_BOUNDARY_VALUES.includes(values['--boundary'])) {
    reject('cli-arguments-invalid');
  }

  return {
    inputPath: values['--input'],
    outputPath: values['--output'],
    denylistPath: values['--denylist'],
    mode: RULE_COLUMNS_MODE,
    ...(values['--boundary'] === undefined ? {} : { boundary: values['--boundary'] }),
  };
}

function parseCliArguments(argumentsList) {
  if (argumentsList.length === 8 || argumentsList.length === 10) {
    return parseRuleCliArguments(argumentsList);
  }
  if (argumentsList.length !== 6) {
    reject('cli-arguments-invalid');
  }

  const values = {};
  for (let index = 0; index < argumentsList.length; index += 2) {
    const flag = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!['--input', '--output', '--denylist'].includes(flag) || values[flag]) {
      reject('cli-arguments-invalid');
    }
    if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
      reject('cli-arguments-invalid');
    }
    values[flag] = value;
  }

  if (!values['--input'] || !values['--output'] || !values['--denylist']) {
    reject('cli-arguments-invalid');
  }

  return {
    inputPath: values['--input'],
    outputPath: values['--output'],
    denylistPath: values['--denylist'],
  };
}

async function runCli() {
  try {
    const result = await sanitizeFixture(parseCliArguments(process.argv.slice(2)));
    process.stdout.write(`SANITIZE_FIXTURE_OK ${result.sha256}\n`);
  } catch (error) {
    const code = error instanceof SanitizationError
      ? error.code
      : 'unexpected-error';
    process.stderr.write(`SANITIZE_FIXTURE_REJECTED ${code}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await runCli();
}
