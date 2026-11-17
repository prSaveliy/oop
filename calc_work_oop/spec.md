# Specification: Table Viewer & Editor (`calc_work_oop`)

> **Course:** Object-Oriented Programming (OOP) — Calculation-Graphic Work (РГР, Task 3)  
> **Reference Sources:** `Загальні вимоги до усіх завдань.doc`, `Zavd_3_.doc`, and architecture conventions from `../graphical-editor`

---

## 1. Intent

The goal of this project is to design and implement a cross-platform desktop application for **viewing, sorting, editing, and persisting tabular data** stored in Delimited ASCII (TSV) format.

While the original assignment specification uses Win32 / C++ / MS Visual Studio terminology (`GetOpenFileName`, `TableView.h`, `TableView.cpp`), the general course requirements explicitly permit implementation in any object-oriented programming language. This project adapts the assignment to a modern **TypeScript + Electron** desktop stack (consistent with `../graphical-editor`) while strictly preserving:

- All functional requirements of **Task 3** ("Розробити програму показу таблиць").
- Clear **object-oriented encapsulation** around a dedicated `TableViewClass` module and clean module dependency hierarchy.
- Academic clarity so the codebase, class diagram, and module dependency diagram map cleanly to the required 20–30 page RGR report.

---

## 2. Tech Stack

| Layer                 | Choice                                                                   | Notes                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Desktop Framework** | Electron                                                                 | Multi-process desktop shell, native menus, native Open/Save file dialogs (`dialog.showOpenDialog` / `dialog.showSaveDialog`). |
| **Language**          | TypeScript (`strict: true`)                                              | Object-oriented classes, interfaces, strict type checking across Main, Preload, and Renderer.                                 |
| **Package Manager**   | `npm`                                                                    | Standard Node/npm workflow (`package.json`, `package-lock.json`, npm scripts).                                                |
| **UI Layer**          | Vanilla HTML5 + CSS3 + DOM                                               | Lightweight, dependency-free table UI (following `../graphical-editor` style and CSS variables).                              |
| **Build / Tooling**   | `tsc` + lightweight bundler (e.g., `esbuild`, TBD in architecture phase) | Compile TypeScript for Electron Main, Preload (CJS), and Renderer (browser bundle).                                           |
| **Code Quality**      | `oxlint`, `prettier`                                                     | Matching linting and formatting rules from `../graphical-editor`.                                                             |
| **Testing**           | Node built-in test runner (`node --test`) or Vitest (TBD)                | Unit tests for TSV parsing/serialization, sorting logic, and `TableViewClass` / model operations.                             |

---

## 3. High-Level Project Architecture (Baseline)

The application follows Electron's process-isolated architecture combined with the task's required OOP module hierarchy. _(Exact class APIs, IPC contracts, and folder layout will be finalized in the Architecture Planning phase.)_

### 3.1 Process Boundaries

1. **Main Process (`src/main.ts` / `src/index.ts`)**
   - Manages `BrowserWindow` lifecycle and window title (`Таблиця` / `Таблиця - <filepath>` with unsaved-change indicator).
   - Builds the native application menu (`Файл`, optional `Правка`/`Таблиця`, `Довідка`).
   - Executes all filesystem I/O (`fs.promises`) and native file dialogs (`showOpenDialog`, `showSaveDialog`, `showMessageBox`).
2. **Preload Script (`src/preload.ts`)**
   - Enforces `contextIsolation: true` and `nodeIntegration: false`.
   - Exposes a minimal, strongly typed `window.electronAPI` bridge via `contextBridge`.
3. **Renderer Process (`src/renderer.ts` + `TableView` module)**
   - Bootstraps the UI and instantiates `TableViewClass`.
   - Delegates table rendering, scrolling, selection, editing, and sorting behavior to `TableViewClass`.

### 3.2 OOP Module Hierarchy (Task 3 Mapping)

Mapping the assignment's C++ module diagram (`main.cpp` $\rightarrow$ `TableView.h / TableView.cpp` $\rightarrow$ auxiliary modules) into TypeScript:

```text
src/renderer.ts  (entry point, equivalent to main.cpp)
  └── imports TableView module (src/table_view.ts, equivalent to TableView.h / TableView.cpp)
        ├── exports TableViewClass (+ TableViewListener / options interfaces)
        └── uses auxiliary modules (justified per Task Req #5):
              ├── TableModel / TableSorter (in-memory rows, original indices, 3-state sorting, editing mutations)
              └── TsvCodec (Delimited ASCII / TSV parser and serializer — shared or used via Main/Renderer)
```

---

## 4. Requirements

### 4.1 Functional Requirements

1. **Main Window Display, 2D Scrolling & Resizing**
   - The table must be rendered inside the main application window.
   - Both **horizontal and vertical scrolling** must be supported when the table width or height exceeds the window's client area.
   - Column headers (and ideally the left row-number column) should remain usable while scrolling; resizing the main window must fluidly adjust the table viewport without clipping or layout breakage.

2. **Open File (`Файл → Відкрити...`)**
   - Selecting `Файл → Відкрити...` (or `Ctrl/Cmd+O`) opens the native OS open-file dialog filtered for text/TSV files (`*.txt`, `*.tsv`, `*.*`).
   - File contents are read into memory, parsed, and displayed in the table.
   - Window title updates to reflect the active file path (e.g., `Таблиця - <filePath>`).

3. **Save & Save As (`Файл → Записати`, `Файл → Записати як...`)**
   - `Файл → Записати` (`Ctrl/Cmd+S`) writes the current table back to the currently open file path. If no file path is associated yet (e.g., newly created table), it falls back to `Записати як...`.
   - `Файл → Записати як...` (`Ctrl/Cmd+Shift+S`) opens the native OS save-file dialog to choose a destination file path and writes the table there, updating the active file path.
   - Warn the user on closing or opening another file if there are unsaved modifications.

4. **Delimited ASCII (TSV) Format**
   - Each line represents one row of cells separated by the tab character (`'\t'`).
   - **Line 1:** Column header names.
   - **Lines 2..N:** Table data rows.
   - Must gracefully handle:
     - Empty cells (consecutive `\t\t`, leading `\t`, trailing `\t`).
     - Both `\r\n` (CRLF) and `\n` (LF) line endings.
     - Rows shorter or longer than the header row (pad missing cells with `""`, or expand/handle extra cells consistently).
     - Empty files or malformed input (show informative message without crashing).

5. **3-State Column Sorting via Right-Click**
   - Right-clicking (`contextmenu` / secondary mouse button, with default browser context menu suppressed) on any column header cycles through **3 states**:
     1. **1st right-click:** Sort **Ascending** (alphabetical order for data columns; numeric ascending for row-number column).
     2. **2nd right-click:** Sort **Descending** (reverse alphabetical order for data columns; numeric descending for row-number column).
     3. **3rd right-click:** **Unsorted** (restore original row order).
   - Clicking a different column header starts that column's sort cycle at Ascending.
   - Visual indicator (e.g., `▲` / `▼`) in the active sorted header cell.

6. **Row Number Column (Leftmost Column)**
   - The leftmost column has an empty header cell (or `#` — matching the reference screenshot, empty corner cell) and displays 1-based row numbers (`1, 2, 3, ...`).
   - Sorting by the leftmost column sorts **numerically** (by integer row number, ascending or descending), rather than lexicographically (`"10"` must come after `"2"`, not before `"2"`).

7. **Table Editing (`TableViewClass` Requirement #4)**
   - `TableViewClass` must expose methods for both **displaying and editing** tables, including:
     - Inline cell editing (e.g., double-click or `F2`/`Enter` to edit cell value, `Enter` to commit, `Escape` to cancel).
     - Adding a new row / deleting selected row(s).
     - Optional column management / creating a new empty table (`Файл → Нова таблиця`, to be finalized in architecture design).
     - Tracking modified (`dirty`) state when edits occur.

8. **Application Menu & Help (`Довідка → Про програму`)**
   - `Файл`: `Новий` (optional/recommended), `Відкрити...`, `Записати`, `Записати як...`, separator, `Вихід`.
   - `Довідка`: `Про програму` showing author, group, course/task metadata, and brief usage instructions (including right-click sorting hint).

---

### 4.2 OOP & Engineering Requirements

1. **Dedicated `TableViewClass` Module**
   - All table UI rendering, interaction, and editing coordination must live inside `TableViewClass` in a dedicated module (`TableView`), mirroring `TableView.h` / `TableView.cpp`.
2. **Justified Supporting Classes**
   - Any additional classes (e.g., `TableModel` for data/sort state, `TsvSerializer` for file codec) must have clear single responsibilities and explicit rationale for the report.
3. **Strict TypeScript & Static Checks**
   - Zero TypeScript compiler errors (`npm run typecheck`), clean `oxlint`, and consistent `prettier` formatting.
4. **Electron Security & Reliability**
   - `contextIsolation: true`, `nodeIntegration: false`, input validation on IPC payloads, safe error dialogs for I/O failures.

---

## 5. Open Decisions for Architecture Planning

The following details will be resolved in the next step (Architecture Planning):

1. **Module & File Layout:** Exact directory structure (`src/main/`, `src/preload/`, `src/renderer/`, `src/shared/`) and how `TableViewClass` interacts with `TableModel` and `TsvCodec`.
2. **Build Pipeline with `npm`:** Choice between pure `tsc` (with ES modules or simple script bundling) vs `esbuild` + `tsc --noEmit` for fast Electron builds.
3. **Editing & Row-Number Semantics:**
   - Whether each row keeps its original file row number during sorting (so sorting by another column preserves the original row ID in the left column, and sorting by the left column sorts those numbers `1..N` / `N..1`).
   - Exact inline editing, row insertion/deletion, and column-editing UX.
4. **Character Encoding Support:** Whether to support UTF-8 only or also detect/import Windows-1251 (`cp1251`) legacy `.txt` tables from the original Ukrainian Windows examples.

---

## 6. Acceptance Criteria

The implementation will be considered complete when all criteria below are verified:

- [ ] **Build & Launch:** `npm install`, `npm run typecheck`, `npm run lint`, and `npm start` succeed cleanly without errors.
- [ ] **File Open:** `Файл → Відкрити...` opens a native file picker, loads a `\t`-delimited ASCII file (including files with 10+ columns, 50+ rows, and empty cells), uses line 1 as column headers, and renders lines 2..N as rows.
- [ ] **2D Scrolling & Resize:** Large tables show both vertical and horizontal scrollbars when exceeding the viewport; resizing the window updates scrollbars and layout cleanly.
- [ ] **3-State Right-Click Sorting (Data Columns):** Right-clicking a data column header cycles `Ascending (alphabetical)` $\rightarrow$ `Descending (reverse alphabetical)` $\rightarrow$ `Unsorted (original order)` without opening the browser context menu.
- [ ] **Numeric Sorting (Row-Number Column):** Right-clicking the leftmost row-number header sorts numerically (`1, 2, ..., 10` rather than `1, 10, 2, ...`), descending (`N..1`), and back to unsorted.
- [ ] **Editing & Persistence Roundtrip:** User can edit cells and add/delete rows via `TableViewClass`, save via `Файл → Записати` and `Файл → Записати як...`, reopen the saved `.txt`/`.tsv` file, and observe identical headers, rows, and empty cells preserved with `\t` delimiters.
- [ ] **OOP Structure:** `TableViewClass` resides in its own dedicated module with documented public methods for display and editing, and clean separation from Main process / IPC / persistence helpers.
- [ ] **Automated Tests:** Unit tests pass for TSV parsing/serialization (including empty cells, CRLF/LF, ragged rows) and 3-state alphabetical/numeric sorting.
