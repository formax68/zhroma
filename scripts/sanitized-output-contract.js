import { Window } from 'happy-dom';

export const PRIORITY_LABELS = new Set(['Urgent', 'High', 'Normal', 'Low']);
export const FORBIDDEN_ELEMENT = /<\s*(?:script|iframe|frame|frameset|object|embed|base|form|style|link|meta)\b/iu;
export const INLINE_HANDLER = /\son[a-z][a-z0-9_-]*\s*=/iu;
export const RESOURCE_ATTRIBUTE = /\s(?:src|srcset|href|xlink:href|action|formaction|poster|srcdoc)\s*=/iu;
export const CSS_RESOURCE = /\sstyle\s*=\s*(?:"[^"]*\burl\s*\(|'[^']*\burl\s*\(|[^\s>]*\burl\s*\()/iu;
export const PRESERVED_ATTRIBUTES = new Set([
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
export const TEXTUAL_ARIA_ATTRIBUTES = new Set([
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
export const REFERENCE_ATTRIBUTES = new Set([
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
export const ARIA_ENUM_ATTRIBUTES = new Map([
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
export const ARIA_INTEGER_ATTRIBUTES = new Map([
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
export const ARIA_NUMBER_ATTRIBUTES = new Set([
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
]);
export const ARIA_RELEVANT_VALUES = new Set(['additions', 'removals', 'text', 'all']);
export const REMOVABLE_ATTRIBUTES = new Set([
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

export const PRIORITY_HEADER_LABEL = 'Priority';

export class SanitizedOutputError extends Error {
  constructor(code) {
    super('Sanitized output rejected');
    this.name = 'SanitizedOutputError';
    this.code = code;
  }
}

function reject(code) {
  throw new SanitizedOutputError(code);
}

export function assertSafeToParse(markup) {
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

export function parseBoundedCapture(markup) {
  let parsed;
  try {
    parsed = createInertParser().parseFromString(markup, 'text/html');
  } catch {
    reject('parse-failed');
  }

  const rootElements = [...parsed.body.children];
  if (rootElements.length !== 1 || parsed.head.childNodes.length > 0
    || [...parsed.body.childNodes].some((node) => node.nodeType === 3 && node.data.trim())) {
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
    .map((cell, index) => (cell.textContent.trim() === PRIORITY_HEADER_LABEL ? index : -1))
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

  return { root, priorityCells, priorityHeaderCell: headerCells[priorityIndexes[0]] ?? null,
    priorityIndex: priorityIndexes[0] ?? null, ticketRowCount: ticketRows.length };
}

export function normalizedAriaValue(name, value) {
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

/** Validate an already sanitized fragment without changing it or accessing files. */
export function validateSanitizedOutput(markup) {
  if (typeof markup !== 'string' || !markup.trim()) reject('table-boundary-required');
  assertSafeToParse(markup);
  // Comments outside the fragment root must also be rejected, before extraction.
  if (markup.includes('<!--')) reject('comment-must-be-absent');
  const capture = parseBoundedCapture(markup);
  const { root, priorityCells, priorityHeaderCell } = capture;
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const attribute of element.attributes) {
      const name = attribute.name.toLocaleLowerCase('en-US');
      if (TEXTUAL_ARIA_ATTRIBUTES.has(name)) {
        if (!/^ARIA-\d{3,}$/u.test(attribute.value)) reject('text-stand-in-required');
      } else if (REFERENCE_ATTRIBUTES.has(name) || REMOVABLE_ATTRIBUTES.has(name)) {
        reject('unsafe-attribute');
      } else if (name.startsWith('aria-')) {
        const normalized = normalizedAriaValue(name, attribute.value);
        if (normalized === undefined) reject('unsafe-aria-attribute');
        if (normalized === null || normalized !== attribute.value) reject('aria-attribute-invalid');
      } else if (!PRESERVED_ATTRIBUTES.has(name)) {
        reject('unsafe-attribute');
      }
    }
  }

  function visit(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === 8) reject('comment-must-be-absent');
      if (child.nodeType !== 3) {
        visit(child);
        continue;
      }
      const text = child.data.trim();
      if (!text || /^TEXT-\d{3,}$/u.test(text)) continue;
      if (text === PRIORITY_HEADER_LABEL && priorityHeaderCell?.contains(child)
        && priorityHeaderCell.textContent.trim() === text) continue;
      if (PRIORITY_LABELS.has(text) && [...priorityCells].some((cell) => (
        cell.contains(child) && cell.textContent.trim() === text
      ))) continue;
      reject('text-stand-in-required');
    }
  }
  visit(root);
  return { tableCount: 1, ticketRowCount: capture.ticketRowCount, priorityIndex: capture.priorityIndex };
}
