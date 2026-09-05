import { createHash } from 'node:crypto';
import { access, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Window } from 'happy-dom';

import {
  scanSensitiveContent,
  SensitiveFixtureError,
} from './sensitive-patterns.js';

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MODULE_DIRECTORY = dirname(fileURLToPath(import.meta.url));
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
  'aria-braillelabel',
  'aria-brailleroledescription',
  'aria-colindextext',
  'aria-label',
  'aria-description',
  'aria-keyshortcuts',
  'aria-placeholder',
  'aria-roledescription',
  'aria-rowindextext',
  'aria-valuetext',
]);
const REFERENCE_ATTRIBUTES = new Set([
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
  'headers',
  'for',
]);
const ARIA_ENUM_ATTRIBUTES = new Map([
  ['aria-atomic', new Set(['true', 'false'])],
  ['aria-autocomplete', new Set(['none', 'inline', 'list', 'both'])],
  ['aria-busy', new Set(['true', 'false'])],
  ['aria-checked', new Set(['true', 'false', 'mixed'])],
  ['aria-current', new Set(['false', 'true', 'page', 'step', 'location', 'date', 'time'])],
  ['aria-disabled', new Set(['true', 'false'])],
  ['aria-expanded', new Set(['true', 'false'])],
  ['aria-haspopup', new Set(['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'])],
  ['aria-hidden', new Set(['true', 'false'])],
  ['aria-invalid', new Set(['false', 'true', 'grammar', 'spelling'])],
  ['aria-live', new Set(['off', 'polite', 'assertive'])],
  ['aria-modal', new Set(['true', 'false'])],
  ['aria-multiline', new Set(['true', 'false'])],
  ['aria-multiselectable', new Set(['true', 'false'])],
  ['aria-orientation', new Set(['horizontal', 'vertical', 'undefined'])],
  ['aria-pressed', new Set(['true', 'false', 'mixed'])],
  ['aria-readonly', new Set(['true', 'false'])],
  ['aria-required', new Set(['true', 'false'])],
  ['aria-selected', new Set(['true', 'false'])],
  ['aria-sort', new Set(['none', 'ascending', 'descending', 'other'])],
]);
const ARIA_INTEGER_ATTRIBUTES = new Map([
  ['aria-colcount', (value) => value === -1 || value >= 1],
  ['aria-colindex', (value) => value >= 1],
  ['aria-colspan', (value) => value >= 1],
  ['aria-level', (value) => value >= 1],
  ['aria-posinset', (value) => value >= 1],
  ['aria-rowcount', (value) => value === -1 || value >= 1],
  ['aria-rowindex', (value) => value >= 1],
  ['aria-rowspan', (value) => value >= 1],
  ['aria-setsize', (value) => value === -1 || value >= 1],
]);
const ARIA_NUMBER_ATTRIBUTES = new Set([
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
]);
const ARIA_RELEVANT_VALUES = new Set(['additions', 'removals', 'text', 'all']);
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
  const tables = [
    ...(root.matches('table, [role="table"]') ? [root] : []),
    ...root.querySelectorAll('table, [role="table"]'),
  ];
  if (tables.length !== 1) {
    reject('table-boundary-required');
  }

  const table = tables[0];
  let boundaryElement = table;
  while (boundaryElement !== root) {
    const parent = boundaryElement.parentElement;
    const hasSiblingElement = !parent
      || parent.children.length !== 1
      || parent.children[0] !== boundaryElement;
    const hasSiblingText = parent
      ? [...parent.childNodes].some((node) => node.nodeType === 3 && node.data.trim().length > 0)
      : true;
    if (hasSiblingElement || hasSiblingText) {
      reject('table-boundary-required');
    }
    boundaryElement = parent;
  }

  const ownedRows = [...table.querySelectorAll('tr, [role="row"]')]
    .filter((row) => row.closest('table, [role="table"]') === table);
  const ticketRows = ownedRows.filter((row) => {
    const body = row.closest('tbody');
    const testId = row.getAttribute('data-test-id');
    const gardenId = row.getAttribute('data-garden-id');
    return body?.closest('table, [role="table"]') === table
      && (gardenId === 'tables.row' || testId === 'generic-table-row' || testId === 'ticket-row');
  });
  if (ticketRows.length === 0) {
    reject('table-boundary-required');
  }

  const headerRows = ownedRows.filter((row) => (
    !ticketRows.includes(row)
    && [...row.children].some((cell) => cell.matches('th, [role="columnheader"]'))
  ));
  if (headerRows.length !== 1) {
    reject('table-boundary-required');
  }

  const headerCells = [...headerRows[0].children];
  if (headerCells.some((cell) => !cell.matches('th, [role="columnheader"]'))) {
    reject('row-children-must-be-cells');
  }
  const priorityIndexes = headerCells
    .map((cell, index) => (cell.textContent.trim() === 'Priority' ? index : -1))
    .filter((index) => index >= 0);
  if (headerCells.length === 0 || priorityIndexes.length > 1) {
    reject('table-boundary-required');
  }


  const priorityCells = new Set();
  for (const row of ticketRows) {
    const cells = [...row.children];
    if (cells.some((cell) => !cell.matches('td, [role="cell"]'))) {
      reject('row-children-must-be-cells');
    }
    if (cells.length !== headerCells.length) {
      reject('table-boundary-required');
    }
    if (priorityIndexes.length === 1) {
      priorityCells.add(cells[priorityIndexes[0]]);
    }
  }

  return { root, priorityCells };
}

function normalizedAriaValue(name, value) {
  const normalized = value.trim().toLocaleLowerCase('en-US');

  const allowedValues = ARIA_ENUM_ATTRIBUTES.get(name);
  if (allowedValues) {
    return allowedValues.has(normalized) ? normalized : null;
  }

  const integerRule = ARIA_INTEGER_ATTRIBUTES.get(name);
  if (integerRule) {
    if (!/^-?(?:0|[1-9][0-9]*)$/u.test(normalized)) {
      return null;
    }
    const integer = Number(normalized);
    return Number.isSafeInteger(integer) && integerRule(integer) ? String(integer) : null;
  }

  if (ARIA_NUMBER_ATTRIBUTES.has(name)) {
    if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(normalized)) {
      return null;
    }
    const number = Number(normalized);
    return Number.isFinite(number) ? String(number) : null;
  }

  if (name === 'aria-relevant') {
    const tokens = normalized.split(/\s+/u).filter(Boolean);
    if (tokens.length === 0 || tokens.some((token) => !ARIA_RELEVANT_VALUES.has(token))) {
      return null;
    }
    return [...new Set(tokens)].sort().join(' ');
  }

  return undefined;
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

function sanitizeTextAndComments(root, priorityCells) {
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
        if (trimmed.length > 0 && !preservePriority) {
          textCounter += 1;
          child.data = `TEXT-${String(textCounter).padStart(3, '0')}`;
        } else if (preservePriority) {
          child.data = trimmed;
        }
        continue;
      }
      visit(child);
    }
  }

  visit(root);
}

function finalMarkup(root, priorityCells, denylist) {
  sanitizeAttributes(root);
  sanitizeTextAndComments(root, priorityCells);
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
  const denylist = parseDenylist(denylistBytes);
  await assertFileSize(inputRealPath, {
    minimum: 1,
    maximum: MAX_INPUT_BYTES,
    code: 'input-size-out-of-bounds',
  });
  const inputBytes = await readRequiredBytes(inputRealPath, 'input-readable-required');

  const source = decodeUtf8(inputBytes, 'input-utf8-required');
  assertSafeToParse(source);
  const { root, priorityCells } = parseBoundedCapture(source);
  const output = finalMarkup(root, priorityCells, denylist);
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
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await runCli();
}
