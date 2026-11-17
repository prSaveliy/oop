import type {
  SortDirection,
  TableData,
  TableStats,
} from '../shared/table_types.ts';
import { TableModel } from './table_model.ts';

export interface TableViewListener {
  onStatsChange?: (stats: TableStats) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onOpenRequested?: () => void;
  onNewRequested?: () => void;
}

export interface TableViewOptions {
  containerSelector: string;
  listener?: TableViewListener;
}

interface ActiveEditState {
  kind: 'cell' | 'header';
  viewIndex: number;
  dataColIndex: number;
  cellEl: HTMLTableCellElement;
  inputEl: HTMLInputElement;
  originalText: string;
  closing: boolean;
}

/**
 * Dedicated TableView module encapsulating TableViewClass:
 * handles table display, 2D scrolling, resize adaptation, 3-state right-click sorting,
 * row selection, and inline editing backed by TableModel.
 */
export class TableViewClass {
  private readonly model: TableModel = new TableModel();
  private readonly container: HTMLElement;
  private readonly listener: TableViewListener;

  private readonly viewportEl: HTMLDivElement;
  private readonly tableEl: HTMLTableElement;
  private readonly theadEl: HTMLTableSectionElement;
  private readonly tbodyEl: HTMLTableSectionElement;
  private readonly emptyStateEl: HTMLDivElement;
  private readonly resizeObserver: ResizeObserver;

  private activeEdit: ActiveEditState | null = null;
  private lastEmittedDirty = false;

  private readonly handleWindowResize = (): void => {
    this.handleResize();
  };

  constructor(options: TableViewOptions) {
    const container = document.querySelector<HTMLElement>(
      options.containerSelector,
    );
    if (!container) {
      throw new Error(
        `TableViewClass: контейнер "${options.containerSelector}" не знайдено`,
      );
    }

    this.container = container;
    this.listener = options.listener ?? {};

    this.viewportEl = document.createElement('div');
    this.viewportEl.className = 'table-viewport';
    this.viewportEl.tabIndex = 0;

    this.tableEl = document.createElement('table');
    this.tableEl.className = 'data-table';
    this.tableEl.setAttribute('aria-label', 'Таблиця даних');

    this.theadEl = document.createElement('thead');
    this.tbodyEl = document.createElement('tbody');
    this.tableEl.append(this.theadEl, this.tbodyEl);
    this.viewportEl.appendChild(this.tableEl);

    this.emptyStateEl = this.createEmptyStateElement();

    this.container.innerHTML = '';
    this.container.append(this.viewportEl, this.emptyStateEl);

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);

    this.bindEvents();
    this.render();
    this.emitStateChanges();
  }

  /** Replaces table contents with parsed TableData and resets scroll position. */
  loadData(data: TableData): void {
    this.cancelActiveEdit();
    this.model.load(data);
    this.viewportEl.scrollTop = 0;
    this.viewportEl.scrollLeft = 0;
    this.render();
    this.emitStateChanges();
  }

  /** Initializes a blank editable table with default columns. */
  createNewTable(columnCount = 3): void {
    this.cancelActiveEdit();
    this.model.createEmpty(columnCount);
    this.viewportEl.scrollTop = 0;
    this.viewportEl.scrollLeft = 0;
    this.render();
    this.emitStateChanges();
  }

  /** Commits any open inline edit and returns canonical TableData for persistence. */
  exportData(): TableData {
    this.commitActiveEdit();
    return this.model.toTableData();
  }

  hasTable(): boolean {
    return this.model.hasTable();
  }

  isDirty(): boolean {
    return this.model.isDirty();
  }

  markSaved(): void {
    this.model.markSaved();
    this.emitStateChanges();
  }

  getStats(): TableStats {
    return {
      rowCount: this.model.getRowCount(),
      columnCount: this.model.getColumnCount(),
      sortState: this.model.getSortState(),
      selectedRowNumber: this.model.getSelectedRowNumber(),
      isDirty: this.model.isDirty(),
    };
  }

  /** Renders header and body rows from TableModel into the DOM. */
  render(): void {
    const hasTable = this.model.hasTable();
    this.viewportEl.hidden = !hasTable;
    this.emptyStateEl.hidden = hasTable;

    if (!hasTable) {
      this.theadEl.innerHTML = '';
      this.tbodyEl.innerHTML = '';
      return;
    }

    this.renderHeader();
    this.renderBody();
  }

  /** Handles container/window resize while preserving readable layout and active cell visibility. */
  handleResize(): void {
    if (this.activeEdit) {
      this.activeEdit.cellEl.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }

  /** Cycles 3-state sorting on the specified column (0 = row numbers, 1..M = data columns). */
  sortByColumn(columnIndex: number): void {
    if (!this.model.hasTable()) {
      return;
    }
    this.commitActiveEdit();
    this.model.cycleSort(columnIndex);
    this.renderHeader();
    this.renderBody();
    this.emitStateChanges();
  }

  /** Selects or clears row selection by view index. */
  selectRow(viewIndex: number | null): void {
    this.model.selectRow(viewIndex);
    this.syncRowSelectionClasses();
    this.emitStateChanges();
  }

  /** Opens an inline text input inside the specified data cell. */
  startCellEdit(viewIndex: number, dataColIndex: number): void {
    if (
      !this.model.hasTable() ||
      viewIndex < 0 ||
      viewIndex >= this.model.getViewRows().length ||
      dataColIndex < 0 ||
      dataColIndex >= this.model.getColumnCount()
    ) {
      return;
    }

    if (
      this.activeEdit?.kind === 'cell' &&
      this.activeEdit.viewIndex === viewIndex &&
      this.activeEdit.dataColIndex === dataColIndex
    ) {
      return;
    }

    this.commitActiveEdit();
    this.model.selectRow(viewIndex);
    this.syncRowSelectionClasses();

    const tr = this.tbodyEl.querySelector<HTMLTableRowElement>(
      `tr[data-view-index="${viewIndex}"]`,
    );
    const td = tr?.querySelector<HTMLTableCellElement>(
      `td[data-col-index="${dataColIndex + 1}"]`,
    );
    const record = this.model.getViewRows()[viewIndex];
    if (!tr || !td || !record) {
      return;
    }

    const originalText = record.cells[dataColIndex] ?? '';
    this.mountInlineInput({
      kind: 'cell',
      viewIndex,
      dataColIndex,
      cellEl: td,
      originalText,
    });
    this.emitStateChanges();
  }

  /** Opens an inline text input inside a data column header for renaming. */
  startHeaderEdit(dataColIndex: number): void {
    const headers = this.model.getHeaders();
    if (dataColIndex < 0 || dataColIndex >= headers.length) {
      return;
    }

    this.commitActiveEdit();
    const th = this.theadEl.querySelector<HTMLTableCellElement>(
      `th[data-col-index="${dataColIndex + 1}"]`,
    );
    if (!th) {
      return;
    }

    const originalText = headers[dataColIndex] ?? '';
    this.mountInlineInput({
      kind: 'header',
      viewIndex: -1,
      dataColIndex,
      cellEl: th,
      originalText,
    });
  }

  /** Commits the currently open inline editor (cell or header) if one is active. */
  commitActiveEdit(): void {
    const edit = this.activeEdit;
    if (!edit || edit.closing) {
      return;
    }

    edit.closing = true;
    const nextValue = edit.inputEl.value;
    this.activeEdit = null;

    if (edit.kind === 'cell') {
      this.model.updateCell(edit.viewIndex, edit.dataColIndex, nextValue);
      const updated =
        this.model.getViewRows()[edit.viewIndex]?.cells[edit.dataColIndex] ??
        '';
      edit.cellEl.classList.remove('is-editing');
      edit.cellEl.textContent = updated;
    } else {
      this.model.renameColumn(edit.dataColIndex, nextValue);
      edit.cellEl.classList.remove('is-editing');
      this.renderHeader();
    }

    this.emitStateChanges();
  }

  /** Cancels the active inline edit and restores its original display text. */
  cancelActiveEdit(): void {
    const edit = this.activeEdit;
    if (!edit || edit.closing) {
      return;
    }

    edit.closing = true;
    this.activeEdit = null;
    edit.cellEl.classList.remove('is-editing');

    if (edit.kind === 'cell') {
      edit.cellEl.textContent = edit.originalText;
    } else {
      this.renderHeader();
    }
  }

  /** Appends a new empty row, scrolls to it, and starts inline editing on its first cell. */
  addEmptyRow(): void {
    this.commitActiveEdit();
    const hadTable = this.model.hasTable();
    const newViewIndex = this.model.addRow();

    if (!hadTable) {
      this.render();
    } else {
      this.renderBody();
    }

    this.viewportEl.scrollTop = this.viewportEl.scrollHeight;
    this.emitStateChanges();
    this.startCellEdit(newViewIndex, 0);
  }

  /** Deletes the currently selected row from the table. */
  deleteSelectedRow(): void {
    if (!this.model.hasTable()) {
      return;
    }
    this.commitActiveEdit();
    if (!this.model.deleteSelectedRow()) {
      return;
    }
    this.renderBody();
    this.emitStateChanges();
  }

  /** Appends a new column to the table and scrolls horizontally to reveal it. */
  addColumn(name?: string): void {
    this.commitActiveEdit();
    this.model.addColumn(name);
    this.render();
    this.viewportEl.scrollLeft = this.viewportEl.scrollWidth;
    this.emitStateChanges();
  }

  /** Cleans up observers and window listeners. */
  destroy(): void {
    this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.handleWindowResize);
  }

  private createEmptyStateElement(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-empty-state';

    const card = document.createElement('div');
    card.className = 'empty-card';

    const title = document.createElement('h2');
    title.textContent = 'Таблицю ще не відкрито';

    const subtitle = document.createElement('p');
    subtitle.textContent =
      'Відкрийте текстовий файл формату Delimited ASCII (з роздільником табуляції) або створіть нову таблицю.';

    const actions = document.createElement('div');
    actions.className = 'empty-actions';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'action-btn action-btn-primary';
    openBtn.textContent = 'Відкрити файл...';
    openBtn.addEventListener('click', () => {
      this.listener.onOpenRequested?.();
    });

    const newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.className = 'action-btn';
    newBtn.textContent = 'Створити нову таблицю';
    newBtn.addEventListener('click', () => {
      this.listener.onNewRequested?.();
    });

    actions.append(openBtn, newBtn);
    card.append(title, subtitle, actions);
    wrapper.appendChild(card);
    return wrapper;
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleWindowResize);

    // Right-click on any header cell cycles 3-state sorting without opening browser menu
    this.theadEl.addEventListener('contextmenu', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const th = target.closest<HTMLTableCellElement>('th[data-col-index]');
      if (!th) {
        return;
      }
      event.preventDefault();
      const colIndex = Number.parseInt(th.dataset.colIndex ?? '-1', 10);
      if (Number.isInteger(colIndex) && colIndex >= 0) {
        this.sortByColumn(colIndex);
      }
    });

    // Double-click on a data header renames the column
    this.theadEl.addEventListener('dblclick', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const th = target.closest<HTMLTableCellElement>('th[data-col-index]');
      if (!th) {
        return;
      }
      const colIndex = Number.parseInt(th.dataset.colIndex ?? '-1', 10);
      if (Number.isInteger(colIndex) && colIndex >= 1) {
        this.startHeaderEdit(colIndex - 1);
      }
    });

    this.tbodyEl.addEventListener('click', event => {
      if (this.activeEdit) {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const tr = target.closest<HTMLTableRowElement>('tr[data-view-index]');
      if (!tr) {
        return;
      }
      const viewIndex = Number.parseInt(tr.dataset.viewIndex ?? '-1', 10);
      if (!Number.isInteger(viewIndex) || viewIndex < 0) {
        return;
      }

      const currentSelected = this.model.getSelectedViewIndex();
      this.selectRow(currentSelected === viewIndex ? null : viewIndex);
      this.viewportEl.focus({ preventScroll: true });
    });

    this.tbodyEl.addEventListener('dblclick', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const td = target.closest<HTMLTableCellElement>('td[data-col-index]');
      const tr = target.closest<HTMLTableRowElement>('tr[data-view-index]');
      if (!td || !tr) {
        return;
      }
      const viewIndex = Number.parseInt(tr.dataset.viewIndex ?? '-1', 10);
      const colIndex = Number.parseInt(td.dataset.colIndex ?? '-1', 10);
      if (
        Number.isInteger(viewIndex) &&
        viewIndex >= 0 &&
        Number.isInteger(colIndex) &&
        colIndex >= 1
      ) {
        this.startCellEdit(viewIndex, colIndex - 1);
      }
    });

    this.viewportEl.addEventListener('keydown', event => {
      if (this.activeEdit || !this.model.hasTable()) {
        return;
      }

      const selectedIndex = this.model.getSelectedViewIndex();
      const rowCount = this.model.getViewRows().length;

      if (event.key === 'ArrowDown') {
        if (rowCount === 0) {
          return;
        }
        event.preventDefault();
        const next =
          selectedIndex === null
            ? 0
            : Math.min(rowCount - 1, selectedIndex + 1);
        this.selectRow(next);
        this.scrollRowIntoView(next);
      } else if (event.key === 'ArrowUp') {
        if (rowCount === 0) {
          return;
        }
        event.preventDefault();
        const prev =
          selectedIndex === null ? 0 : Math.max(0, selectedIndex - 1);
        this.selectRow(prev);
        this.scrollRowIntoView(prev);
      } else if (
        event.key === 'F2' ||
        (event.key === 'Enter' && !event.ctrlKey && !event.metaKey)
      ) {
        if (selectedIndex !== null && this.model.getColumnCount() > 0) {
          event.preventDefault();
          this.startCellEdit(selectedIndex, 0);
        }
      } else if (event.key === 'Delete') {
        if (selectedIndex !== null) {
          event.preventDefault();
          this.deleteSelectedRow();
        }
      }
    });
  }

  private mountInlineInput(params: {
    kind: 'cell' | 'header';
    viewIndex: number;
    dataColIndex: number;
    cellEl: HTMLTableCellElement;
    originalText: string;
  }): void {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = params.originalText;

    params.cellEl.classList.add('is-editing');
    params.cellEl.innerHTML = '';
    params.cellEl.appendChild(input);

    const editState: ActiveEditState = {
      kind: params.kind,
      viewIndex: params.viewIndex,
      dataColIndex: params.dataColIndex,
      cellEl: params.cellEl,
      inputEl: input,
      originalText: params.originalText,
      closing: false,
    };
    this.activeEdit = editState;

    input.addEventListener('keydown', event => {
      event.stopPropagation();

      if (event.key === 'Enter') {
        event.preventDefault();
        this.commitActiveEdit();
        this.viewportEl.focus({ preventScroll: true });
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelActiveEdit();
        this.viewportEl.focus({ preventScroll: true });
      } else if (event.key === 'Tab' && editState.kind === 'cell') {
        event.preventDefault();
        const { viewIndex, dataColIndex } = editState;
        this.commitActiveEdit();
        this.moveEditHorizontally(
          viewIndex,
          dataColIndex,
          event.shiftKey ? -1 : 1,
        );
      }
    });

    input.addEventListener('blur', () => {
      this.commitActiveEdit();
    });

    input.focus();
    input.select();
  }

  private moveEditHorizontally(
    viewIndex: number,
    dataColIndex: number,
    delta: -1 | 1,
  ): void {
    const colCount = this.model.getColumnCount();
    const rowCount = this.model.getViewRows().length;
    if (colCount === 0 || rowCount === 0) {
      return;
    }

    let nextCol = dataColIndex + delta;
    let nextRow = viewIndex;

    if (nextCol >= colCount) {
      nextCol = 0;
      nextRow += 1;
    } else if (nextCol < 0) {
      nextCol = colCount - 1;
      nextRow -= 1;
    }

    if (nextRow < 0 || nextRow >= rowCount) {
      this.viewportEl.focus({ preventScroll: true });
      return;
    }

    this.startCellEdit(nextRow, nextCol);
  }

  private renderHeader(): void {
    this.theadEl.innerHTML = '';
    const tr = document.createElement('tr');
    const sortState = this.model.getSortState();

    // Leftmost row-number column (colIndex = 0)
    const rowNumTh = document.createElement('th');
    rowNumTh.className = 'col-rownum sortable-header';
    rowNumTh.dataset.colIndex = '0';
    rowNumTh.title =
      'ПКМ: числове сортування за номерами рядків (зростання / спадання / без сортування)';
    rowNumTh.appendChild(
      this.createHeaderContent(
        '',
        sortState.columnIndex === 0 ? sortState.direction : 'none',
      ),
    );
    if (sortState.columnIndex === 0 && sortState.direction !== 'none') {
      rowNumTh.classList.add('is-sorted');
    }
    tr.appendChild(rowNumTh);

    // Data columns (colIndex = 1..M)
    const headers = this.model.getHeaders();
    headers.forEach((headerText, dataColIndex) => {
      const colIndex = dataColIndex + 1;
      const direction =
        sortState.columnIndex === colIndex ? sortState.direction : 'none';

      const th = document.createElement('th');
      th.className = 'sortable-header';
      th.dataset.colIndex = String(colIndex);
      th.title = 'ПКМ: сортування | Подвійний клік: перейменувати стовпчик';
      if (direction !== 'none') {
        th.classList.add('is-sorted');
      }
      th.appendChild(this.createHeaderContent(headerText, direction));
      tr.appendChild(th);
    });

    this.theadEl.appendChild(tr);
  }

  private createHeaderContent(
    label: string,
    direction: SortDirection,
  ): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'th-content';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'th-label';
    labelSpan.textContent = label;

    const indicatorSpan = document.createElement('span');
    indicatorSpan.className = 'sort-indicator';
    if (direction === 'asc') {
      indicatorSpan.textContent = '▲';
    } else if (direction === 'desc') {
      indicatorSpan.textContent = '▼';
    }

    wrapper.append(labelSpan, indicatorSpan);
    return wrapper;
  }

  private renderBody(): void {
    this.tbodyEl.innerHTML = '';
    const rows = this.model.getViewRows();
    const columnCount = this.model.getColumnCount();
    const selectedViewIndex = this.model.getSelectedViewIndex();

    if (rows.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.className = 'empty-rows-placeholder';
      const emptyTd = document.createElement('td');
      emptyTd.colSpan = columnCount + 1;
      emptyTd.textContent =
        'Таблиця не містить рядків. Натисніть «+ Рядок», щоб додати запис.';
      emptyTr.appendChild(emptyTd);
      this.tbodyEl.appendChild(emptyTr);
      return;
    }

    const fragment = document.createDocumentFragment();
    rows.forEach((record, viewIndex) => {
      const tr = document.createElement('tr');
      tr.dataset.viewIndex = String(viewIndex);
      if (viewIndex === selectedViewIndex) {
        tr.classList.add('is-selected');
      }

      const rowNumTd = document.createElement('td');
      rowNumTd.className = 'col-rownum';
      rowNumTd.dataset.colIndex = '0';
      rowNumTd.textContent = String(record.rowNumber);
      tr.appendChild(rowNumTd);

      for (let col = 0; col < columnCount; col += 1) {
        const td = document.createElement('td');
        td.dataset.colIndex = String(col + 1);
        td.textContent = record.cells[col] ?? '';
        tr.appendChild(td);
      }

      fragment.appendChild(tr);
    });

    this.tbodyEl.appendChild(fragment);
  }

  private syncRowSelectionClasses(): void {
    const selectedViewIndex = this.model.getSelectedViewIndex();
    const rows = this.tbodyEl.querySelectorAll<HTMLTableRowElement>(
      'tr[data-view-index]',
    );
    for (const tr of rows) {
      const idx = Number.parseInt(tr.dataset.viewIndex ?? '-1', 10);
      tr.classList.toggle('is-selected', idx === selectedViewIndex);
    }
  }

  private scrollRowIntoView(viewIndex: number): void {
    const tr = this.tbodyEl.querySelector<HTMLTableRowElement>(
      `tr[data-view-index="${viewIndex}"]`,
    );
    tr?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private emitStateChanges(): void {
    const stats = this.getStats();
    if (stats.isDirty !== this.lastEmittedDirty) {
      this.lastEmittedDirty = stats.isDirty;
      this.listener.onDirtyChange?.(stats.isDirty);
    }
    this.listener.onStatsChange?.(stats);
  }
}
