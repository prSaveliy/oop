import { MyTable } from './my_table.ts';

window.addEventListener('DOMContentLoaded', () => {
  const table = new MyTable({
    tbodySelector: '#table-body',
    scrollSelector: '#table-scroll',
    countSelector: '#table-count',
    selectionSelector: '#table-selection',
    deleteButtonSelector: '#btn-delete',
    closeButtonSelector: '#btn-close',
    listener: {
      onSelectRow: index => {
        window.electronAPI?.selectTableRow(index);
      },
      onDeleteRow: index => {
        window.electronAPI?.deleteTableRow(index);
      },
      onClose: () => {
        window.electronAPI?.closeTableWindow();
      },
    },
  });

  window.electronAPI?.onTableSyncRows((rows, selectedIndex) => {
    table.setRows(rows, selectedIndex ?? null);
  });

  window.electronAPI?.onTableAddRow(row => {
    table.add(row);
  });

  window.electronAPI?.requestTableSync();
});
