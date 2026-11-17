import type { FileEncoding, TableStats } from '../shared/table_types.ts';
import { TableViewClass } from './table_view.ts';

/**
 * Application controller in the Renderer process (equivalent to main.cpp entry point):
 * mounts TableViewClass, wires toolbar/status bar controls, and handles Electron IPC events.
 */
class TableApp {
  private readonly tableView: TableViewClass;
  private readonly btnNew: HTMLButtonElement;
  private readonly btnOpen: HTMLButtonElement;
  private readonly btnSave: HTMLButtonElement;
  private readonly btnAddRow: HTMLButtonElement;
  private readonly btnDeleteRow: HTMLButtonElement;
  private readonly btnAddColumn: HTMLButtonElement;

  private readonly statusRows: HTMLElement;
  private readonly statusCols: HTMLElement;
  private readonly statusSort: HTMLElement;
  private readonly statusEncoding: HTMLElement;

  private activeEncoding: FileEncoding | null = null;

  constructor() {
    this.btnNew = this.requireElement<HTMLButtonElement>('#btn-new');
    this.btnOpen = this.requireElement<HTMLButtonElement>('#btn-open');
    this.btnSave = this.requireElement<HTMLButtonElement>('#btn-save');
    this.btnAddRow = this.requireElement<HTMLButtonElement>('#btn-add-row');
    this.btnDeleteRow =
      this.requireElement<HTMLButtonElement>('#btn-delete-row');
    this.btnAddColumn = this.requireElement<HTMLButtonElement>('#btn-add-col');

    this.statusRows = this.requireElement<HTMLElement>('#status-rows');
    this.statusCols = this.requireElement<HTMLElement>('#status-cols');
    this.statusSort = this.requireElement<HTMLElement>('#status-sort');
    this.statusEncoding = this.requireElement<HTMLElement>('#status-encoding');

    this.tableView = new TableViewClass({
      containerSelector: '#table-container',
      listener: {
        onStatsChange: stats => this.updateChrome(stats),
        onDirtyChange: isDirty => {
          window.electronAPI?.notifyDirtyChanged(isDirty);
        },
        onOpenRequested: () => {
          window.electronAPI?.triggerAction('open');
        },
        onNewRequested: () => {
          window.electronAPI?.triggerAction('new');
        },
      },
    });

    this.bindToolbarEvents();
    this.bindIpcEvents();
    this.updateChrome(this.tableView.getStats());
  }

  private requireElement<T extends HTMLElement>(selector: string): T {
    const el = document.querySelector<T>(selector);
    if (!el) {
      throw new Error(`TableApp: елемент "${selector}" не знайдено`);
    }
    return el;
  }

  private bindToolbarEvents(): void {
    this.btnNew.addEventListener('click', () => {
      window.electronAPI?.triggerAction('new');
    });

    this.btnOpen.addEventListener('click', () => {
      window.electronAPI?.triggerAction('open');
    });

    this.btnSave.addEventListener('click', () => {
      window.electronAPI?.triggerAction('save');
    });

    this.btnAddRow.addEventListener('click', () => {
      this.tableView.addEmptyRow();
    });

    this.btnDeleteRow.addEventListener('click', () => {
      this.tableView.deleteSelectedRow();
    });

    this.btnAddColumn.addEventListener('click', () => {
      this.tableView.addColumn();
    });
  }

  private bindIpcEvents(): void {
    window.electronAPI?.onFileOpened(payload => {
      this.activeEncoding = payload.encoding;
      this.tableView.loadData(payload.data);
    });

    window.electronAPI?.onNewTable(() => {
      this.activeEncoding = 'utf-8';
      this.tableView.createNewTable();
    });

    window.electronAPI?.onAddRow(() => {
      this.tableView.addEmptyRow();
    });

    window.electronAPI?.onDeleteRow(() => {
      this.tableView.deleteSelectedRow();
    });

    window.electronAPI?.onAddColumn(() => {
      this.tableView.addColumn();
    });

    window.electronAPI?.onRequestSave(request => {
      if (!this.tableView.hasTable()) {
        window.electronAPI?.cancelSaveRequest(request.requestId);
        return;
      }
      const data = this.tableView.exportData();
      window.electronAPI?.sendSaveData({
        requestId: request.requestId,
        data,
        saveAs: request.saveAs,
      });
    });

    window.electronAPI?.onFileSaved(() => {
      this.activeEncoding = 'utf-8';
      this.tableView.markSaved();
    });
  }

  private updateChrome(stats: TableStats): void {
    const hasTable = stats.columnCount > 0;
    this.btnSave.disabled = !hasTable;
    this.btnAddRow.disabled = !hasTable;
    this.btnAddColumn.disabled = !hasTable;
    this.btnDeleteRow.disabled = !hasTable || stats.selectedRowNumber === null;

    this.statusRows.textContent = `Рядків: ${stats.rowCount}`;
    this.statusCols.textContent = `Стовпців: ${stats.columnCount}`;
    this.statusSort.textContent = this.formatSortLabel(stats);
    this.statusEncoding.textContent = this.activeEncoding
      ? `Кодування: ${this.activeEncoding.toUpperCase()}`
      : 'Кодування: —';
  }

  private formatSortLabel(stats: TableStats): string {
    const { columnIndex, direction } = stats.sortState;
    if (direction === 'none' || columnIndex < 0) {
      return 'Сортування: без сортування';
    }
    const arrow = direction === 'asc' ? '▲' : '▼';
    if (columnIndex === 0) {
      return `Сортування: № рядка (${arrow})`;
    }
    return `Сортування: стовпчик ${columnIndex} (${arrow})`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TableApp();
});
