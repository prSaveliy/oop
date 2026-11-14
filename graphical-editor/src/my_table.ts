export interface TableRowData {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MyTableListener {
  onSelectRow?: (index: number | null) => void;
  onDeleteRow?: (index: number) => void;
  onClose?: () => void;
}

export interface MyTableOptions {
  tbodySelector: string;
  scrollSelector: string;
  countSelector: string;
  selectionSelector: string;
  deleteButtonSelector: string;
  closeButtonSelector: string;
  listener?: MyTableListener;
}

export class MyTable {
  private readonly tbody: HTMLTableSectionElement;
  private readonly scrollContainer: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly selectionEl: HTMLElement;
  private readonly deleteButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly listener: MyTableListener;

  private rows: TableRowData[] = [];
  private selectedIndex: number | null = null;

  constructor(options: MyTableOptions) {
    const tbody = document.querySelector<HTMLTableSectionElement>(
      options.tbodySelector,
    );
    const scrollContainer = document.querySelector<HTMLElement>(
      options.scrollSelector,
    );
    const countEl = document.querySelector<HTMLElement>(options.countSelector);
    const selectionEl = document.querySelector<HTMLElement>(
      options.selectionSelector,
    );
    const deleteButton = document.querySelector<HTMLButtonElement>(
      options.deleteButtonSelector,
    );
    const closeButton = document.querySelector<HTMLButtonElement>(
      options.closeButtonSelector,
    );

    if (
      !tbody ||
      !scrollContainer ||
      !countEl ||
      !selectionEl ||
      !deleteButton ||
      !closeButton
    ) {
      throw new Error('MyTable: необхідні DOM-елементи не знайдено');
    }

    this.tbody = tbody;
    this.scrollContainer = scrollContainer;
    this.countEl = countEl;
    this.selectionEl = selectionEl;
    this.deleteButton = deleteButton;
    this.closeButton = closeButton;
    this.listener = options.listener ?? {};

    this.bindEvents();
    this.render();
  }

  private bindEvents(): void {
    this.tbody.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const tr = target.closest('tr[data-index]');
      if (!(tr instanceof HTMLTableRowElement)) {
        return;
      }
      const rawIndex = tr.dataset.index;
      if (rawIndex === undefined) {
        return;
      }
      const index = Number.parseInt(rawIndex, 10);
      if (!Number.isInteger(index) || index < 0 || index >= this.rows.length) {
        return;
      }

      const nextSelection = this.selectedIndex === index ? null : index;
      this.selectRow(nextSelection);
      this.listener.onSelectRow?.(nextSelection);
    });

    this.deleteButton.addEventListener('click', () => {
      this.triggerDeleteSelected();
    });

    this.closeButton.addEventListener('click', () => {
      this.listener.onClose?.();
    });

    window.addEventListener('keydown', event => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (this.selectedIndex !== null) {
          event.preventDefault();
          this.triggerDeleteSelected();
        }
      } else if (event.key === 'Escape') {
        this.listener.onClose?.();
      }
    });
  }

  private triggerDeleteSelected(): void {
    if (this.selectedIndex === null) {
      return;
    }
    this.listener.onDeleteRow?.(this.selectedIndex);
  }

  add(row: TableRowData): void {
    const normalized: TableRowData = {
      name: row.name,
      x1: Math.round(row.x1),
      y1: Math.round(row.y1),
      x2: Math.round(row.x2),
      y2: Math.round(row.y2),
    };

    if (this.rows.length === 0) {
      this.tbody.innerHTML = '';
    }

    const newIndex = this.rows.length;
    this.rows.push(normalized);
    this.tbody.appendChild(this.createRowElement(normalized, newIndex));
    this.updateFooter();
    this.scrollToBottom();
  }

  setRows(rows: TableRowData[], selectedIndex: number | null = null): void {
    this.rows = rows.map(row => ({
      name: row.name,
      x1: Math.round(row.x1),
      y1: Math.round(row.y1),
      x2: Math.round(row.x2),
      y2: Math.round(row.y2),
    }));

    if (
      selectedIndex !== null &&
      selectedIndex >= 0 &&
      selectedIndex < this.rows.length
    ) {
      this.selectedIndex = selectedIndex;
    } else {
      this.selectedIndex = null;
    }

    this.render();
  }

  clear(): void {
    this.rows = [];
    this.selectedIndex = null;
    this.render();
  }

  selectRow(index: number | null): void {
    if (index === null || index < 0 || index >= this.rows.length) {
      this.selectedIndex = null;
    } else {
      this.selectedIndex = index;
    }

    const rowElements =
      this.tbody.querySelectorAll<HTMLTableRowElement>('tr[data-index]');
    for (const tr of rowElements) {
      const idx = Number.parseInt(tr.dataset.index ?? '-1', 10);
      tr.classList.toggle('is-selected', idx === this.selectedIndex);
    }

    this.updateFooter();
  }

  getRowCount(): number {
    return this.rows.length;
  }

  getSelectedIndex(): number | null {
    return this.selectedIndex;
  }

  private render(): void {
    this.tbody.innerHTML = '';

    if (this.rows.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.className = 'empty-row';
      const emptyTd = document.createElement('td');
      emptyTd.colSpan = 5;
      emptyTd.textContent = 'Немає створених об’єктів';
      emptyTr.appendChild(emptyTd);
      this.tbody.appendChild(emptyTr);
      this.updateFooter();
      return;
    }

    const fragment = document.createDocumentFragment();
    this.rows.forEach((row, index) => {
      fragment.appendChild(this.createRowElement(row, index));
    });
    this.tbody.appendChild(fragment);
    this.updateFooter();
  }

  private createRowElement(
    row: TableRowData,
    index: number,
  ): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.dataset.index = String(index);
    if (index === this.selectedIndex) {
      tr.className = 'is-selected';
    }

    const cells: string[] = [
      row.name,
      String(row.x1),
      String(row.y1),
      String(row.x2),
      String(row.y2),
    ];

    for (const value of cells) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    }

    return tr;
  }

  private updateFooter(): void {
    this.countEl.textContent = `Об'єктів: ${this.rows.length}`;
    if (this.selectedIndex !== null) {
      const selected = this.rows[this.selectedIndex];
      this.selectionEl.textContent = selected
        ? `Вибрано: #${this.selectedIndex + 1} (${selected.name})`
        : 'Вибрано: —';
      this.deleteButton.disabled = false;
    } else {
      this.selectionEl.textContent = 'Вибрано: —';
      this.deleteButton.disabled = true;
    }
  }

  private scrollToBottom(): void {
    this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight;
  }
}
