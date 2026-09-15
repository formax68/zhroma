import { describe, expect, test } from 'vitest';
import {
  validateSanitizedOutput,
  SanitizedOutputError,
  PRIORITY_HEADER_LABEL,
  PRIORITY_LABELS,
} from '../../scripts/sanitized-output-contract.js';

function validOutput() {
  return '<div aria-label="ARIA-001"><table><thead><tr><th>TEXT-001</th><th>Priority</th></tr></thead><tbody><tr data-test-id="ticket-row"><td>TEXT-002</td><td>Urgent</td></tr></tbody></table></div>\n';
}

describe('shared sanitized output grammar', () => {
  test('accepts bounded output with the Priority header and labels only in their cells', () => {
    expect(PRIORITY_HEADER_LABEL).toBe('Priority');
    expect([...PRIORITY_LABELS]).toEqual(['Urgent', 'High', 'Normal', 'Low']);
    expect(validateSanitizedOutput(validOutput())).toMatchObject({ tableCount: 1, ticketRowCount: 1, priorityIndex: 1 });
  });

  test.each([
    ['two tables', (s) => s.replace('</div>', '<table></table></div>'), 'table-boundary-required'],
    ['wrapper sibling', (s) => s.replace('</div>', '<span></span></div>'), 'table-boundary-required'],
    ['wrapper text', (s) => s.replace('</div>', 'TEXT-003</div>'), 'table-boundary-required'],
    ['text outside root', (s) => `TEXT-003${s}`, 'table-boundary-required'],
    ['unknown attribute', (s) => s.replace('<table>', '<table data-private="x">'), 'unsafe-attribute'],
    ['removed attribute', (s) => s.replace('<table>', '<table class="private">'), 'unsafe-attribute'],
    ['unknown ARIA', (s) => s.replace('<table>', '<table aria-private="x">'), 'unsafe-aria-attribute'],
    ['invalid ARIA enum', (s) => s.replace('<table>', '<table aria-selected="ARIA-STATE-001">'), 'aria-attribute-invalid'],
    ['invalid numeric ARIA', (s) => s.replace('<table>', '<table aria-rowcount="zero">'), 'aria-attribute-invalid'],
    ['textual ARIA residual', (s) => s.replace('ARIA-001', 'Private Person'), 'text-stand-in-required'],
    ['residual text', (s) => s.replace('TEXT-002', 'Private Person'), 'text-stand-in-required'],
    ['wrong-column label', (s) => s.replace('TEXT-002', 'Urgent'), 'text-stand-in-required'],
    ['wrong header token', (s) => s.replace('TEXT-001', 'Urgent'), 'text-stand-in-required'],
    ['comment', (s) => s.replace('<table>', '<!-- private --><table>'), 'comment-must-be-absent'],
    ['comment outside root', (s) => `<!-- private -->${s}`, 'comment-must-be-absent'],
    ['active markup', (s) => s.replace('<table>', '<script>run()</script><table>'), 'forbidden-element'],
    ['resource URL', (s) => s.replace('<table>', '<table href="https://example.invalid">'), 'resource-bearing-attribute'],
  ])('rejects %s with a stable code', (_label, mutate, code) => {
    expect(() => validateSanitizedOutput(mutate(validOutput()))).toThrow(SanitizedOutputError);
    expect(() => validateSanitizedOutput(mutate(validOutput()))).toThrow(expect.objectContaining({ code }));
  });
});
