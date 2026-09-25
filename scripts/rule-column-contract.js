import { Window } from 'happy-dom';

import {
  PRIORITY_LABELS, PRIORITY_HEADER_LABEL, PRESERVED_ATTRIBUTES,
  TEXTUAL_ARIA_ATTRIBUTES, REFERENCE_ATTRIBUTES, REMOVABLE_ATTRIBUTES,
  ARIA_ENUM_ATTRIBUTES, ARIA_INTEGER_ATTRIBUTES, ARIA_NUMBER_ATTRIBUTES,
  normalizedAriaValue, assertSafeToParse, resolveBoundedDocument,
  SanitizedOutputError,
} from './sanitized-output-contract.js';

/*
 * Rule-columns mode (Phase 6, D-10..D-14). This module is a separate grammar beside the v1
 * sanitised-output contract. It imports the v1 attribute classes and builds its own copies;
 * it never mutates an imported Set, so the v1 default path is unchanged by importing it.
 */

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export const DEFAULT_RULE_VOCABULARY = deepFreeze({
  headerKinds: {
    Priority: 'PRIORITY',
    Assignee: 'PERSON',
    Requester: 'PERSON',
    Group: 'GROUP',
    Status: 'STATUS',
    Type: 'TYPE',
    Subject: 'SUBJECT',
    Tags: 'TAG',
    Updated: 'DATE',
  },
  statusValues: ['New', 'Open', 'Pending', 'On-hold', 'Solved', 'Closed'],
  typeValues: ['Question', 'Incident', 'Problem', 'Task'],
  placeholders: [],
});

export const RULE_TOKEN_KINDS = Object.freeze([
  'PERSON', 'GROUP', 'SUBJECT', 'TAG', 'DATE', 'STATUS', 'TYPE', 'FIELD', 'LABEL', 'TEXT',
]);
export const RESERVED_SELF_TOKENS = Object.freeze([
  'PERSON-SELF', 'PERSON-SELF-ALT', 'PERSON-SELF-EMBEDDED',
]);

/* D-13: every kept `datetime` becomes one fixed literal of its format class. */
export const SYNTHETIC_DATETIME = Object.freeze({
  dateTime: '2000-01-01T00:00:00Z',
  date: '2000-01-01',
});
/* The in-page projection's shape markers, recording visual state that class removal loses. */
export const PROBE_MARKER_VALUES = Object.freeze(['visually-hidden', 'display-none', 'text-truncated']);

/* Attribute classes for rule-columns mode: copies of the v1 Sets, never the Sets themselves. */
export const RULE_PRESERVED_ATTRIBUTES = new Set([...PRESERVED_ATTRIBUTES]);
export const RULE_TEXT_ATTRIBUTES = new Set([...TEXTUAL_ARIA_ATTRIBUTES, 'title', 'alt']);
export const RULE_REMOVABLE_ATTRIBUTES = new Set(
  [...REMOVABLE_ATTRIBUTES].filter((name) => !['title', 'alt', 'datetime'].includes(name)),
);

const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
/* The generic scan only catches 7+ digit runs, so identifier values must carry no digit at all. */
const IDENTIFIER_VALUE = /^[a-z][a-z._-]*$/iu;
const IDENTIFIER_ATTRIBUTES = Object.freeze(['data-garden-id', 'data-test-id']);
const PROBE_ATTRIBUTE = 'data-zhroma-probe';

const RESOURCE_ATTRIBUTE_NAMES = Object.freeze([
  'src', 'srcset', 'href', 'xlink:href', 'action', 'formaction', 'poster', 'srcdoc',
]);
const RULE_BOUNDARIES = Object.freeze(['table', 'identity-region']);
const IDENTITY_ELEMENT_LIMIT = 40;
const IDENTITY_FORBIDDEN = [
  'table', 'tr', 'nav', 'header', 'main', 'aside',
  '[role="table"]', '[role="grid"]', '[role="row"]', '[role="navigation"]',
  '[role="banner"]', '[role="menubar"]', '[role="tablist"]',
].join(', ');
const TOKEN_PATTERN = new RegExp(`^(${RULE_TOKEN_KINDS.join('|')})-(\\d{3,})$`, 'u');
const RESERVED_TOKEN_SET = new Set(RESERVED_SELF_TOKENS);

function reject(code) {
  throw new SanitizedOutputError(code);
}

function fold(value) {
  return normaliseRuleValue(value).toLocaleLowerCase('en-US');
}

/** NFC, every whitespace run (NBSP included) collapsed to one space, trimmed; case-sensitive. */
export function normaliseRuleValue(value) {
  return String(value).normalize('NFC').replace(/\s+/gu, ' ').trim();
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

function textNodesOf(element) {
  const nodes = [];
  function visit(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) nodes.push(child);
      else if (child.nodeType === 1) visit(child);
    }
  }
  visit(element);
  return nodes;
}

function isTicketRow(row, table) {
  const body = row.closest('tbody');
  const testId = row.getAttribute('data-test-id');
  const gardenId = row.getAttribute('data-garden-id');
  return body?.closest('table, [role="table"]') === table
    && (gardenId === 'tables.row' || testId === 'generic-table-row' || testId === 'ticket-row');
}

function headerColumn(cell, index, priorityIndex, vocabulary) {
  if (index === priorityIndex) {
    return { kind: 'PRIORITY', label: PRIORITY_HEADER_LABEL };
  }
  const { headerKinds } = vocabulary;
  const whole = normaliseRuleValue(cell.textContent);
  if (!whole) return { kind: 'TEXT', label: null };
  const known = (label) => Object.hasOwn(headerKinds, label) && headerKinds[label] !== 'PRIORITY';
  if (known(whole)) return { kind: headerKinds[whole], label: whole };
  const labels = new Set(textNodesOf(cell)
    .map((node) => normaliseRuleValue(node.data))
    .filter(known));
  if (labels.size === 1) {
    const [label] = labels;
    return { kind: headerKinds[label], label };
  }
  return { kind: 'FIELD', label: null };
}

function resolveTableCapture(parsed, vocabulary) {
  const bounded = resolveBoundedDocument(parsed);
  const { root, table, headerRow, priorityIndex } = bounded;
  const headerCells = [...headerRow.children];
  const columns = headerCells.map((cell, index) => (
    headerColumn(cell, index, priorityIndex, vocabulary)
  ));
  const ticketRows = [...table.querySelectorAll('tr, [role="row"]')]
    .filter((row) => row.closest('table, [role="table"]') === table && isTicketRow(row, table));

  const cellLocations = new Map();
  headerCells.forEach((cell, index) => {
    cellLocations.set(cell, { region: 'header', index, cell, column: columns[index] });
  });
  for (const row of ticketRows) {
    [...row.children].forEach((cell, index) => {
      cellLocations.set(cell, { region: 'ticket', index, cell, column: columns[index] });
    });
  }

  return {
    boundary: 'table',
    root,
    table,
    headerRow,
    headerCells,
    columns,
    ticketRows,
    priorityIndex,
    ticketRowCount: ticketRows.length,
    cellLocations,
  };
}

/*
 * D-14(b): the identity region is the smallest subtree holding the rendered name, never the top
 * bar or navigation. The v1 opening checks are copied, then page-structure landmarks and any
 * table or row reject, and the subtree is capped at IDENTITY_ELEMENT_LIMIT elements.
 */
function resolveIdentityCapture(parsed) {
  const rootElements = [...parsed.body.children];
  if (rootElements.length !== 1 || parsed.head.childNodes.length > 0
    || [...parsed.body.childNodes].some((node) => node.nodeType === 3 && node.data.trim())) {
    reject('identity-boundary-required');
  }
  const root = rootElements[0];
  const elements = [root, ...root.querySelectorAll('*')];
  if (elements.length > IDENTITY_ELEMENT_LIMIT
    || elements.some((element) => element.matches(IDENTITY_FORBIDDEN))) {
    reject('identity-boundary-required');
  }
  return {
    boundary: 'identity-region',
    root,
    ticketRowCount: 0,
    cellLocations: new Map(),
  };
}

/** Parse a capture inertly and resolve its rule-columns boundary without changing it. */
export function parseRuleColumnCapture(markup, options = {}) {
  const boundary = options.boundary ?? 'table';
  const vocabulary = options.vocabulary ?? DEFAULT_RULE_VOCABULARY;
  if (!RULE_BOUNDARIES.includes(boundary)) reject('boundary-invalid');
  let parsed;
  try {
    parsed = createInertParser().parseFromString(markup, 'text/html');
  } catch {
    reject('parse-failed');
  }
  return boundary === 'identity-region'
    ? resolveIdentityCapture(parsed)
    : resolveTableCapture(parsed, vocabulary);
}

const OTHER_LOCATION = Object.freeze({ region: 'other' });

function syntheticDatetime(value) {
  const trimmed = String(value).trim();
  if (DATE_TIME_PATTERN.test(trimmed)) return SYNTHETIC_DATETIME.dateTime;
  if (DATE_PATTERN.test(trimmed)) return SYNTHETIC_DATETIME.date;
  return reject('datetime-format-unrecognised');
}

/* Shared by the tokeniser and the validator: preserved names whose values carry a grammar. */
function assertPreservedValue(name, value) {
  if (IDENTIFIER_ATTRIBUTES.includes(name) && !IDENTIFIER_VALUE.test(value)) {
    reject('identifier-value-invalid');
  }
  if (name === PROBE_ATTRIBUTE && !PROBE_MARKER_VALUES.includes(value)) {
    reject('probe-marker-invalid');
  }
}

function locationOf(node, capture) {
  let current = node.nodeType === 1 ? node : node.parentElement;
  while (current) {
    const location = capture.cellLocations.get(current);
    if (location) return location;
    if (current === capture.root) break;
    current = current.parentElement;
  }
  return OTHER_LOCATION;
}

function tokenKindFor(location) {
  if (location.region === 'header') return 'LABEL';
  if (location.region === 'ticket') {
    const { kind } = location.column;
    return kind === 'PRIORITY' ? 'TEXT' : kind;
  }
  return 'TEXT';
}

function vocabularySets(vocabulary) {
  return {
    status: new Set(vocabulary.statusValues),
    type: new Set(vocabulary.typeValues),
    placeholders: new Set(vocabulary.placeholders),
  };
}

/*
 * Decide how a text node or textual attribute value at a location is written. Returns
 * { keep: normalised } for allowlisted or reserved values, or { kind } for a token of that kind.
 */
function classifyValue(raw, location, { isText, sets, selfForms }) {
  const value = normaliseRuleValue(raw);
  if (location.region === 'header') {
    if (location.column.label !== null && value === location.column.label) return { keep: value };
    return { kind: 'LABEL', value };
  }
  if (location.region === 'ticket') {
    const { kind } = location.column;
    if (kind === 'PRIORITY') {
      const trimmed = String(raw).trim();
      if (isText) {
        if (PRIORITY_LABELS.has(trimmed) && location.cell.textContent.trim() === trimmed) {
          return { keep: trimmed };
        }
      } else if (PRIORITY_LABELS.has(value)) {
        return { keep: value };
      }
    }
    if (kind === 'STATUS' && sets.status.has(value)) return { keep: value };
    if (kind === 'TYPE' && sets.type.has(value)) return { keep: value };
    if (sets.placeholders.has(value)) return { keep: value };
  }
  if (selfForms?.self && value === selfForms.self) return { keep: 'PERSON-SELF', reserved: true };
  if (selfForms?.selfAlt && value === selfForms.selfAlt) {
    return { keep: 'PERSON-SELF-ALT', reserved: true };
  }
  if (RESERVED_TOKEN_SET.has(value)) return { keep: value, reserved: true };
  const folded = selfForms ? fold(value) : '';
  if ((selfForms?.self && folded.includes(fold(selfForms.self)))
    || (selfForms?.selfAlt && folded.includes(fold(selfForms.selfAlt)))) {
    return { keep: 'PERSON-SELF-EMBEDDED', reserved: true };
  }
  return { kind: tokenKindFor(location), value };
}

function createTokenMap() {
  const tokens = new Map();
  const counters = new Map();
  return function tokenFor(kind, value) {
    const key = `${kind}\u0000${value}`;
    let token = tokens.get(key);
    if (!token) {
      const next = (counters.get(kind) ?? 0) + 1;
      counters.set(kind, next);
      token = `${kind}-${String(next).padStart(3, '0')}`;
      tokens.set(key, token);
    }
    return token;
  };
}

function normalisedSelfForms(selfForms) {
  const self = typeof selfForms?.self === 'string' ? normaliseRuleValue(selfForms.self) : '';
  const selfAlt = typeof selfForms?.selfAlt === 'string' ? normaliseRuleValue(selfForms.selfAlt) : '';
  return { self: self || null, selfAlt: selfAlt || null };
}

/**
 * Rewrite a parsed capture in place: one pre-order traversal, each element's attributes
 * before its children, one (kind, normalised value) token map numbered per kind from 001.
 */
export function tokeniseRuleColumns(capture, options = {}) {
  const vocabulary = options.vocabulary ?? DEFAULT_RULE_VOCABULARY;
  const sets = vocabularySets(vocabulary);
  const selfForms = normalisedSelfForms(options.selfForms);
  const tokenFor = createTokenMap();
  let reservedCount = 0;

  function rewrite(raw, location, isText) {
    const decision = classifyValue(raw, location, { isText, sets, selfForms });
    if (decision.reserved) reservedCount += 1;
    if ('keep' in decision) return decision.keep;
    return tokenFor(decision.kind, decision.value);
  }

  function visitAttributes(element) {
    const location = locationOf(element, capture);
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLocaleLowerCase('en-US');
      if (name.startsWith('on')) reject('inline-event-handler');
      if (RESOURCE_ATTRIBUTE_NAMES.includes(name)) reject('resource-bearing-attribute');
      if (RULE_TEXT_ATTRIBUTES.has(name)) {
        if (normaliseRuleValue(attribute.value)) {
          element.setAttribute(attribute.name, rewrite(attribute.value, location, false));
        }
        continue;
      }
      if (name === 'datetime') {
        element.setAttribute(attribute.name, syntheticDatetime(attribute.value));
        continue;
      }
      if (REFERENCE_ATTRIBUTES.has(name) || RULE_REMOVABLE_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (name.startsWith('aria-')) {
        const normalized = normalizedAriaValue(name, attribute.value);
        if (normalized === undefined) reject('unsafe-aria-attribute');
        if (normalized === null) reject('aria-attribute-invalid');
        element.setAttribute(attribute.name, normalized);
        continue;
      }
      if (RULE_PRESERVED_ATTRIBUTES.has(name)) {
        assertPreservedValue(name, attribute.value);
        continue;
      }
      reject('unsafe-attribute');
    }
  }

  function visit(element) {
    visitAttributes(element);
    for (const child of [...element.childNodes]) {
      if (child.nodeType === 8) {
        child.remove();
        continue;
      }
      if (child.nodeType === 3) {
        if (normaliseRuleValue(child.data)) {
          child.data = rewrite(child.data, locationOf(child, capture), true);
        }
        continue;
      }
      if (child.nodeType === 1) visit(child);
    }
  }

  visit(capture.root);
  if (capture.boundary === 'identity-region' && reservedCount === 0) {
    reject('identity-boundary-required');
  }
  return capture;
}

function tokenParts(value) {
  const match = TOKEN_PATTERN.exec(value);
  return match ? { kind: match[1], number: Number(match[2]) } : null;
}

/** Validate an admitted rule-columns fragment without changing it or accessing files. */
export function validateRuleColumnOutput(markup, options = {}) {
  const boundary = options.boundary ?? 'table';
  const vocabulary = options.vocabulary ?? DEFAULT_RULE_VOCABULARY;
  if (!RULE_BOUNDARIES.includes(boundary)) reject('boundary-invalid');
  if (typeof markup !== 'string' || !markup.trim()) {
    reject(boundary === 'identity-region' ? 'identity-boundary-required' : 'table-boundary-required');
  }
  assertSafeToParse(markup);
  if (markup.includes('<!--')) reject('comment-must-be-absent');
  const capture = parseRuleColumnCapture(markup, { boundary, vocabulary });
  const sets = vocabularySets(vocabulary);
  const seen = new Map(RULE_TOKEN_KINDS.map((kind) => [kind, new Set()]));
  let reservedCount = 0;

  function checkValue(raw, location, isText) {
    const value = normaliseRuleValue(raw);
    if (!value) return;
    const decision = classifyValue(raw, location, { isText, sets, selfForms: null });
    if ('keep' in decision) {
      if (decision.reserved) reservedCount += 1;
      return;
    }
    const parts = tokenParts(value);
    if (!parts) {
      if (RESERVED_TOKEN_SET.has(value)) reject('token-kind-mismatch');
      reject('text-stand-in-required');
    }
    if (parts.kind !== decision.kind) reject('token-kind-mismatch');
    const canonical = `${parts.kind}-${String(parts.number).padStart(3, '0')}`;
    const kindTokens = seen.get(parts.kind);
    if (canonical !== value) reject('token-numbering-invalid');
    if (!kindTokens.has(value)) {
      if (parts.number !== kindTokens.size + 1) reject('token-numbering-invalid');
      kindTokens.add(value);
    }
  }

  function checkAttributes(element) {
    const location = locationOf(element, capture);
    for (const attribute of element.attributes) {
      const name = attribute.name.toLocaleLowerCase('en-US');
      if (name.startsWith('on')) reject('inline-event-handler');
      if (RESOURCE_ATTRIBUTE_NAMES.includes(name)) reject('resource-bearing-attribute');
      if (RULE_TEXT_ATTRIBUTES.has(name)) {
        checkValue(attribute.value, location, false);
      } else if (name === 'datetime') {
        if (![SYNTHETIC_DATETIME.dateTime, SYNTHETIC_DATETIME.date].includes(attribute.value)) {
          reject('datetime-format-unrecognised');
        }
      } else if (REFERENCE_ATTRIBUTES.has(name) || RULE_REMOVABLE_ATTRIBUTES.has(name)) {
        reject('unsafe-attribute');
      } else if (name.startsWith('aria-')) {
        const normalized = normalizedAriaValue(name, attribute.value);
        if (normalized === undefined) reject('unsafe-aria-attribute');
        if (normalized === null || normalized !== attribute.value) reject('aria-attribute-invalid');
      } else if (RULE_PRESERVED_ATTRIBUTES.has(name)) {
        assertPreservedValue(name, attribute.value);
      } else {
        reject('unsafe-attribute');
      }
    }
  }

  function visit(element) {
    checkAttributes(element);
    for (const child of element.childNodes) {
      if (child.nodeType === 8) reject('comment-must-be-absent');
      if (child.nodeType === 3) {
        checkValue(child.data, locationOf(child, capture), true);
        continue;
      }
      if (child.nodeType === 1) visit(child);
    }
  }

  visit(capture.root);
  if (boundary === 'identity-region' && reservedCount === 0) reject('identity-boundary-required');
  const tokenKinds = Object.fromEntries(RULE_TOKEN_KINDS.map((kind) => [kind, seen.get(kind).size]));
  return { boundary, ticketRowCount: capture.ticketRowCount, tokenKinds };
}

/** Case-folded vocabulary words every admitted output may carry as kept text or token stems. */
export function ruleVocabularyWords(vocabulary = DEFAULT_RULE_VOCABULARY) {
  const words = [
    ...RULE_TOKEN_KINDS,
    ...RESERVED_SELF_TOKENS,
    ...Object.keys(vocabulary.headerKinds),
    ...vocabulary.statusValues,
    ...vocabulary.typeValues,
    ...PRIORITY_LABELS,
    ...vocabulary.placeholders,
  ].map(fold).filter(Boolean);
  return Object.freeze([...new Set(words)]);
}

/*
 * The structural half of the denylist collision set: case-folded words that admitted output
 * carries as markup rather than tenant text. Element names and identifier values were collected
 * once from the three v1 fixtures; attribute names are read (never mutated) from the v1 classes.
 */
export const RULE_STRUCTURAL_WORDS = Object.freeze([...new Set([
  // Element names in the v1 fixtures, plus the rule-mode shapes (avatars, time, chips).
  'a', 'button', 'div', 'input', 'label', 'path', 'span', 'svg', 'table', 'tbody', 'td', 'th',
  'thead', 'time', 'tr', 'tfoot', 'img',
  // Attribute names.
  ...PRESERVED_ATTRIBUTES,
  ...TEXTUAL_ARIA_ATTRIBUTES,
  ...ARIA_ENUM_ATTRIBUTES.keys(),
  ...ARIA_INTEGER_ATTRIBUTES.keys(),
  ...ARIA_NUMBER_ATTRIBUTES,
  'aria-relevant', 'title', 'alt', 'datetime',
  // data-garden-id and data-test-id values in the v1 fixtures, plus the ticket-row predicate.
  'generic-table', 'generic-table-body', 'generic-table-head', 'generic-table-row',
  'generic-table-rows-group-by', 'tables.body', 'tables.cell', 'tables.group_row', 'tables.head',
  'tables.header_cell', 'tables.header_row', 'tables.row', 'tables.table', 'ticket-row',
  // Probe marker values and the synthetic datetime literals every carrying output holds.
  ...PROBE_MARKER_VALUES,
  SYNTHETIC_DATETIME.dateTime,
  SYNTHETIC_DATETIME.date,
].map((word) => word.toLocaleLowerCase('en-US')))]);
