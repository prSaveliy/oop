import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TableModel } from '../src/renderer/table_model.ts';

describe('TableModel', () => {
  const sampleData = {
    headers: ['Кафедра', 'Годин'],
    rows: [
      ['Обчислювальної техніки', '135'],
      ['Англійської мови', '30'],
      ['', '45'],
      ['Автоматизованих систем', '210'],
      ['Інформатики', '9'],
      ['Біології', '12'],
      ['Вищої математики', '18'],
      ['Геометрії', '24'],
      ['Економіки', '36'],
      ['Історії', '54'],
    ],
  };

  it('cycles 3-state natural alphabetical sorting with empty cells pinned last', () => {
    const model = new TableModel();
    model.load(sampleData);

    // 1st click on column 1 ('Кафедра'): ascending
    let state = model.cycleSort(1);
    assert.deepEqual(state, { columnIndex: 1, direction: 'asc' });
    const ascNames = model.getViewRows().map(r => r.cells[0]);
    assert.equal(ascNames[0], 'Автоматизованих систем');
    assert.equal(ascNames[ascNames.length - 1], '');

    // 2nd click on column 1: descending (empty still last)
    state = model.cycleSort(1);
    assert.deepEqual(state, { columnIndex: 1, direction: 'desc' });
    const descNames = model.getViewRows().map(r => r.cells[0]);
    assert.equal(descNames[0], 'Обчислювальної техніки');
    assert.equal(descNames[descNames.length - 1], '');

    // 3rd click on column 1: unsorted (original order restored)
    state = model.cycleSort(1);
    assert.deepEqual(state, { columnIndex: -1, direction: 'none' });
    assert.deepEqual(
      model.getViewRows().map(r => r.rowNumber),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );
    assert.equal(model.isDirty(), false);
  });

  it('sorts numeric strings naturally in data columns (9 before 12 before 30 before 135)', () => {
    const model = new TableModel();
    model.load(sampleData);

    model.cycleSort(2); // 'Годин' asc
    const hoursAsc = model.getViewRows().map(r => r.cells[1]);
    assert.deepEqual(hoursAsc, [
      '9',
      '12',
      '18',
      '24',
      '30',
      '36',
      '45',
      '54',
      '135',
      '210',
    ]);
  });

  it('sorts leftmost row-number column strictly numerically', () => {
    const model = new TableModel();
    model.load(sampleData);

    // First scramble view by sorting column 2
    model.cycleSort(2);
    assert.notDeepEqual(
      model.getViewRows().map(r => r.rowNumber),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );

    // Clicking column 0 sorts 1..10 numerically (10 comes after 9, not after 1)
    let state = model.cycleSort(0);
    assert.deepEqual(state, { columnIndex: 0, direction: 'asc' });
    assert.deepEqual(
      model.getViewRows().map(r => r.rowNumber),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );

    // Second click on column 0 sorts 10..1 numerically
    state = model.cycleSort(0);
    assert.deepEqual(state, { columnIndex: 0, direction: 'desc' });
    assert.deepEqual(
      model.getViewRows().map(r => r.rowNumber),
      [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    );
  });

  it('tracks selection across sorts and persists originalRows order on export', () => {
    const model = new TableModel();
    model.load(sampleData);

    model.selectRow(3); // rowNumber 4 ('Автоматизованих систем')
    assert.equal(model.getSelectedRowNumber(), 4);

    model.cycleSort(1); // 'Автоматизованих систем' moves to view index 0
    assert.equal(model.getSelectedViewIndex(), 0);
    assert.equal(model.getSelectedRowNumber(), 4);

    // Edit while sorted, verify dirty and original order export
    assert.equal(model.updateCell(0, 1, '999'), true);
    assert.equal(model.isDirty(), true);

    const exported = model.toTableData();
    assert.equal(exported.rows[3]?.[1], '999');
    assert.equal(exported.rows[0]?.[0], 'Обчислювальної техніки');
  });

  it('supports adding rows, deleting selected row with re-sequencing, adding/renaming columns, and markSaved', () => {
    const model = new TableModel();
    model.createEmpty(2);
    assert.equal(model.isDirty(), false);
    assert.equal(model.getRowCount(), 1);

    const addedIdx = model.addRow();
    assert.equal(addedIdx, 1);
    assert.equal(model.getRowCount(), 2);
    assert.equal(model.isDirty(), true);

    model.selectRow(0);
    assert.equal(model.deleteSelectedRow(), true);
    assert.equal(model.getRowCount(), 1);
    assert.deepEqual(
      model.getViewRows().map(r => r.rowNumber),
      [1],
    );

    const colIdx = model.addColumn('Примітка');
    assert.equal(colIdx, 2);
    assert.equal(model.getHeaders()[2], 'Примітка');
    assert.equal(model.renameColumn(0, 'Назва'), true);
    assert.equal(model.getHeaders()[0], 'Назва');

    model.markSaved();
    assert.equal(model.isDirty(), false);
  });
});
