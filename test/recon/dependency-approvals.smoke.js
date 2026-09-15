import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const [record, packageText, lockText] = await Promise.all([
  readFile(new URL('DEPENDENCY-APPROVALS.md', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8'),
  readFile(new URL('package-lock.json', root), 'utf8'),
]);
const dependencies = JSON.parse(packageText).devDependencies;
const lock = JSON.parse(lockText);
const rows = record.split('\n')
  .filter((line) => line.startsWith('| ') && !/^\| (package|---) \|/.test(line))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));

test('approval record covers exactly every devDependency with no duplicate rows', () => {
  assert.deepEqual(rows.map(([name]) => name).sort(), Object.keys(dependencies).sort());
});

for (const name of Object.keys(dependencies)) {
  test(`${name} approval agrees with package.json and the resolved lockfile version`, () => {
    const row = rows.find(([entryName]) => entryName === name);
    assert.ok(row, 'approval row required');
    assert.equal(row[1], dependencies[name]);
    assert.equal(row[1], lock.packages[`node_modules/${name}`]?.version);
  });
}

test('every approval row has a closed attestation state and a basis and date', () => {
  for (const row of rows) {
    assert.equal(row.length, 5);
    assert.ok(['attested', 'not-attested'].includes(row[3]));
    assert.ok(row[2].length > 0);
    assert.match(row[4], /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('independence is recorded separately as unconfirmed with the verbatim answer', () => {
  const section = record.split('## Independence — answered separately\n')[1];
  assert.ok(section);
  assert.match(section, /^> I don't remember, it should be fine$/m);
  assert.match(section, /Independence attestation state: `not-attested`\./);
});
