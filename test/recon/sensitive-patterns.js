const GENERIC_RULES = Object.freeze([
  {
    category: 'active-markup',
    code: 'active-element',
    pattern: /<\s*(?:script|iframe|frame|frameset|object|embed|base|form|style|link|meta)\b/i,
  },
  {
    category: 'active-markup',
    code: 'inline-event-handler',
    pattern: /\son[a-z][a-z0-9_-]*\s*=/i,
  },
  {
    category: 'email',
    code: 'email-address',
    pattern: /\b[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+\b/i,
  },
  {
    category: 'embedded-state',
    code: 'embedded-json-script',
    pattern: /<\s*script\b[^>]*\btype\s*=\s*["']application\/(?:json|ld\+json)["']/i,
  },
  {
    category: 'embedded-state',
    code: 'state-bearing-attribute',
    pattern: /\bdata-(?:state|props|payload|serialized|initial-state|context)\s*=/i,
  },
  {
    category: 'embedded-state',
    code: 'window-state-assignment',
    pattern: /\bwindow\.__[a-z0-9_$]+\s*=/i,
  },
  {
    category: 'long-identifier',
    code: 'long-numeric-identifier',
    pattern: /\b\d{7,}\b/,
  },
  {
    category: 'opaque-value',
    code: 'opaque-token',
    pattern: /(?:\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b|\b(?=[a-z0-9+/_=-]{28,}\b)(?=[a-z0-9+/_=-]*[a-z])(?=[a-z0-9+/_=-]*\d)[a-z0-9+/_=-]{28,}\b)/i,
  },
  {
    category: 'resource-url',
    code: 'absolute-or-network-url',
    pattern: /(?:https?:|blob:|data:|file:|\/\/)[^\s"'<>)]*/i,
  },
  {
    category: 'resource-url',
    code: 'resource-bearing-attribute',
    pattern: /\s(?:src|srcset|href|xlink:href|action|formaction|poster|srcdoc)\s*=/i,
  },
  {
    category: 'resource-url',
    code: 'css-resource',
    pattern: /\burl\(\s*["']?\s*(?:https?:|blob:|data:|file:|\/\/)/i,
  },
  {
    category: 'tenant-host',
    code: 'zendesk-tenant-host',
    pattern: /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zendesk\.com\b/i,
  },
]);

function freezeFindings(findings) {
  return Object.freeze(
    findings.map((finding) => Object.freeze({ ...finding })),
  );
}

export class SensitiveFixtureError extends Error {
  constructor(findings) {
    super('Sensitive fixture admission rejected');
    this.name = 'SensitiveFixtureError';
    this.findings = freezeFindings(findings);
  }
}

function rejectPolicy(code) {
  throw new SensitiveFixtureError([{ category: 'policy', code }]);
}

function normalizedDenylist(denylist) {
  if (!Array.isArray(denylist) || denylist.length === 0) {
    rejectPolicy('capture-denylist-required');
  }

  const normalized = denylist.map((token) => (
    typeof token === 'string' ? token.trim().toLocaleLowerCase('en-US') : ''
  ));
  if (normalized.some((token) => token.length === 0)) {
    rejectPolicy('capture-denylist-required');
  }

  return normalized;
}

/**
 * Apply the fail-closed fixture admission predicate without retaining values or
 * input locations in diagnostics. Sensitive input is never logged or returned.
 */
export function scanSensitiveContent(content, options = {}) {
  const denylist = normalizedDenylist(options?.denylist);
  if (typeof content !== 'string') {
    rejectPolicy('content-string-required');
  }

  const genericFindings = new Map();
  for (const { category, code, pattern } of GENERIC_RULES) {
    if (pattern.test(content)) {
      genericFindings.set(`${category}:${code}`, { category, code });
    }
  }

  const foldedContent = content.toLocaleLowerCase('en-US');
  const denylistFindings = denylist
    .filter((token) => foldedContent.includes(token))
    .map(() => ({
      category: 'capture-denylist',
      code: 'capture-denylist-token',
    }));

  const findings = [
    ...genericFindings.values(),
    ...denylistFindings,
  ].sort((left, right) => (
    left.category.localeCompare(right.category)
    || left.code.localeCompare(right.code)
  ));

  if (findings.length > 0) {
    throw new SensitiveFixtureError(findings);
  }

  return { accepted: true, findings: [] };
}
