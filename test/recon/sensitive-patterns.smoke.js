import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  scanSensitiveContent,
  SensitiveFixtureError,
} from './sensitive-patterns.js';

const denylist = ['Private Person', 'Internal Organization'];

function rejectionFor(content, ...optionArguments) {
  try {
    scanSensitiveContent(
      content,
      ...(optionArguments.length > 0 ? optionArguments : [{ denylist }]),
    );
  } catch (error) {
    assert.ok(error instanceof SensitiveFixtureError);
    return error;
  }

  assert.fail('expected sensitive fixture admission to be rejected');
}

test('admits structurally useful deterministic sanitized markup', () => {
  const clean = `
    <div data-test-id="table_container">
      <table data-garden-id="tables.table">
        <tbody><tr data-garden-id="tables.row">
          <td>TICKET-SUBJECT-001</td><td>Urgent</td>
        </tr></tbody>
      </table>
    </div>
  `;

  assert.deepEqual(scanSensitiveContent(clean, { denylist }), {
    accepted: true,
    findings: [],
  });
});

test('rejects missing or empty capture-specific denylists', () => {
  for (const options of [undefined, {}, { denylist: [] }, { denylist: ['  '] }]) {
    const error = rejectionFor('<div>clean</div>', options);
    assert.deepEqual(error.findings, [
      { category: 'policy', code: 'capture-denylist-required' },
    ]);
  }
});

test('rejects every generic forbidden class with stable structured findings', () => {
  const cases = [
    ['active-markup', '<script>run()</script>'],
    ['resource-url', '<img src="https://assets.example.invalid/ticket.png">'],
    ['email', '<span>requester@example.invalid</span>'],
    ['tenant-host', '<span>private-subdomain.zendesk.com</span>'],
    ['long-identifier', '<span>987654321012345</span>'],
    ['opaque-value', '<span>QWxwaGEyM0JldGExOURlbHRhNDU2R2FtbWE=</span>'],
    ['embedded-state', '<div data-state="{&quot;ticket&quot;:true}"></div>'],
  ];

  for (const [category, content] of cases) {
    const error = rejectionFor(content);
    assert.ok(
      error.findings.some((finding) => finding.category === category),
      `expected ${category} finding, got ${JSON.stringify(error.findings)}`,
    );
  }
});

test('rejects inline handlers, frames, style resources, and JSON state', () => {
  const cases = [
    ['active-markup', '<button onclick="run()">Open</button>'],
    ['active-markup', '<iframe title="foreign"></iframe>'],
    ['resource-url', '<div style="background:url(//cdn.example.invalid/a.png)"></div>'],
    ['embedded-state', '<script type="application/json">{"ticket":true}</script>'],
  ];

  for (const [category, content] of cases) {
    const error = rejectionFor(content);
    assert.ok(error.findings.some((finding) => finding.category === category));
  }
});

test('rejects every capture-specific denylist token without echoing values', () => {
  const content = '<td>Private Person at Internal Organization</td>';
  const error = rejectionFor(content);
  const denylistFindings = error.findings.filter(
    ({ category }) => category === 'capture-denylist',
  );

  assert.equal(denylistFindings.length, 2);
  assert.ok(
    denylistFindings.every(({ code }) => code === 'capture-denylist-token'),
  );

  const serialized = JSON.stringify({
    message: error.message,
    findings: error.findings,
  });
  assert.doesNotMatch(serialized, /Private Person|Internal Organization/);
  assert.doesNotMatch(serialized, /requester@example|zendesk\.com/);
});

test('deduplicates overlapping matches and returns findings in stable order', () => {
  const content = '<script src="https://private-subdomain.zendesk.com/9876543210.js"></script>';
  const first = rejectionFor(content).findings;
  const second = rejectionFor(content).findings;

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.map(({ category }) => category),
    [...first.map(({ category }) => category)].sort(),
  );
  assert.equal(
    new Set(first.map(({ category, code }) => `${category}:${code}`)).size,
    first.length,
  );
});

test('rejects non-string content without inspecting or logging it', () => {
  const error = rejectionFor(null);
  assert.deepEqual(error.findings, [
    { category: 'policy', code: 'content-string-required' },
  ]);
});
