import { createHash } from 'node:crypto';
import { access, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

import { Window } from 'happy-dom';

import {
  scanSensitiveContent,
  SensitiveFixtureError,
} from '../test/recon/sensitive-patterns.js';

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const PRIORITY_LABELS = new Set(['Urgent', 'High', 'Normal', 'Low']);
const FORBIDDEN_ELEMENT = /<\s*(?:script|iframe|frame|frameset|object|embed|base|form|style|link|meta)\b/iu;
const INLINE_HANDLER = /\son[a-z][a-z0-9_-]*\s*=/iu;
const RESOURCE_ATTRIBUTE = /\s(?:src|srcset|href|xlink:href|action|formaction|poster|srcdoc)\s*=/iu;
const CSS_RESOURCE = /\sstyle\s*=\s*(?:"[^"]*\burl\s*\(|'[^']*\burl\s*\(|[^\s>]*\burl\s*\()/iu;
const PRESERVED_ATTRIBUTES = new Set([
  'role',
  'scope',
  'colspan',
  'rowspan',
  'tabindex',
  'lang',
  'dir',
  'type',
  'disabled',
  'hidden',
  'checked',
  'selected',
  'multiple',
  'readonly',
  'data-garden-id',
  'data-test-id',
  'data-zhroma-probe',
]);
const TEXTUAL_ARIA_ATTRIBUTES = new Set([
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'aria-valuetext',
]);
const REFERENCE_ATTRIBUTES = new Set([
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-activedescendant',
  'headers',
  'for',
]);
const REMOVABLE_ATTRIBUTES = new Set([
  'id',
  'class',
  'style',
  'title',
  'name',
  'value',
  'placeholder',
  'alt',
  'datetime',
  'xmlns',
  'viewbox',
  'd',
  'fill',
  'stroke',
  'width',
  'height',
  'cx',
  'cy',
  'r',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'points',
  'transform',
  'focusable',
]);

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

function assertSafeToParse(markup) {
  if (FORBIDDEN_ELEMENT.test(markup)) {
    reject('forbidden-element');
  }
  if (INLINE_HANDLER.test(markup)) {
    reject('inline-event-handler');
  }
  if (RESOURCE_ATTRIBUTE.test(markup) || CSS_RESOURCE.test(markup)) {
    reject('resource-bearing-attribute');
  }
}

function createInertParser() {
  const isolatedWindow = new Window({
    settings: {
      enableJavaScriptEvaluation: false,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      enableImageFileLoading: false,
      navigation: {
        disableMainFrameNavigation: true,
        disableChildFrameNavigation: true,
        disableChildPageNavigation: true,
      },
    },
  });
  return new isolatedWindow.DOMParser();
}

function parseBoundedCapture(markup) {
  let parsed;
  try {
    parsed = createInertParser().parseFromString(markup, 'text/html');
  } catch {
    reject('parse-failed');
  }

  const rootElements = [...parsed.body.children];
  if (rootElements.length !== 1) {
    reject('table-boundary-required');
  }

  const root = rootElements[0];
  const table = root.matches('table, [role="table"]')
    ? root
    : root.querySelector('table, [role="table"]');
  const header = root.querySelector('thead tr, [role="columnheader"], th');
  const bodyRow = root.querySelector('tbody tr, [role="row"]');
  if (!table || !header || !bodyRow) {
    reject('table-boundary-required');
  }
  return root;
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
      if (name.startsWith('aria-') || PRESERVED_ATTRIBUTES.has(name)) {
        continue;
      }

      reject('unsafe-attribute');
    }
  }
}

function sanitizeTextAndComments(root) {
  let textCounter = 0;

  function visit(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 8) {
        child.remove();
        continue;
      }
      if (child.nodeType === 3) {
        const trimmed = child.data.trim();
        if (trimmed.length > 0 && !PRIORITY_LABELS.has(trimmed)) {
          textCounter += 1;
          child.data = `TEXT-${String(textCounter).padStart(3, '0')}`;
        } else if (PRIORITY_LABELS.has(trimmed)) {
          child.data = trimmed;
        }
        continue;
      }
      visit(child);
    }
  }

  visit(root);
}

function finalMarkup(root, denylist) {
  sanitizeAttributes(root);
  sanitizeTextAndComments(root);
  const output = `${root.outerHTML}\n`;

  try {
    scanSensitiveContent(output, { denylist });
  } catch (error) {
    if (error instanceof SensitiveFixtureError) {
      reject('sensitive-residual');
    }
    throw error;
  }
  return output;
}

export async function sanitizeFixture(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    reject('options-required');
  }

  const inputPath = requiredPath(options.inputPath, 'input-required');
  const outputPath = requiredPath(options.outputPath, 'output-required');
  const denylistPath = requiredPath(options.denylistPath, 'denylist-required');
  const inputRealPath = await resolvedExistingPath(inputPath, 'input-readable-required');
  const outputRealPath = await resolvedOutputPath(outputPath);
  const projectRealPath = await findGitWorktreeRoot(process.cwd());

  if (inputRealPath === outputRealPath) {
    reject('input-output-must-differ');
  }
  if (isWithin(projectRealPath, inputRealPath)) {
    reject('input-inside-worktree');
  }

  await assertFileSize(denylistPath, {
    minimum: 1,
    maximum: 64 * 1024,
    code: 'denylist-required',
  });
  const denylistBytes = await readRequiredBytes(denylistPath, 'denylist-required');
  const denylist = parseDenylist(denylistBytes);
  await assertFileSize(inputRealPath, {
    minimum: 1,
    maximum: MAX_INPUT_BYTES,
    code: 'input-size-out-of-bounds',
  });
  const inputBytes = await readRequiredBytes(inputRealPath, 'input-readable-required');

  const source = decodeUtf8(inputBytes, 'input-utf8-required');
  assertSafeToParse(source);
  const root = parseBoundedCapture(source);
  const output = finalMarkup(root, denylist);
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

function parseCliArguments(argumentsList) {
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
  && resolve(process.argv[1]) === resolve(process.cwd(), 'scripts', 'sanitize-fixture.js')
) {
  await runCli();
}
