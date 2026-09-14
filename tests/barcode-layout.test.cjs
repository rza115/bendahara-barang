const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../features/barcode/barcode-layout.js'), 'utf8'), { window });
const layout = window.BarcodeLayout;
for (const [paperKey, columns, rows, capacity] of [['a4', 2, 5, 10], ['folio', 2, 6, 12], ['a3', 4, 5, 20]]) {
  test(`${paperKey}: fixed size, capacity, bounds and page transitions`, () => {
    const paper = layout.layout(paperKey);
    assert.equal(paper.columns, columns);
    assert.equal(paper.rows, rows);
    assert.equal(paper.capacity, capacity);
    assert.equal(layout.label.width, 90);
    assert.equal(layout.label.height, 45);
    for (let i = 0; i < capacity * 3 + 1; i++) {
      const pos = layout.position(i, paper);
      assert.equal(pos.page, Math.floor(i / capacity));
      assert.ok(pos.x >= layout.margin && pos.x + 90 <= paper.width - layout.margin);
      assert.ok(pos.y >= layout.margin && pos.y + 45 <= paper.height - layout.margin);
      if (i % capacity === 0) { assert.equal(pos.x, 10); assert.equal(pos.y, 10); }
    }
  });
}
test('invalid paper falls back to A4; physical constants cannot be mutated', () => {
  assert.equal(layout.layout('invalid').label, 'A4');
  assert.ok(Object.isFrozen(layout.label));
  assert.ok(Object.isFrozen(layout));
});
