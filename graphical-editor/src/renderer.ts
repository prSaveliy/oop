import { MyEditor } from './my_editor.ts';
import { isShapeMode } from './editors/editor_registry.ts';
import { ToolBar } from './toolbar.ts';

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private editor: MyEditor;
  private toolbar: ToolBar;
  private statusCoords: HTMLElement;
  private statusMode: HTMLElement;
  private statusCount: HTMLElement;

  constructor() {
    this.canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.statusCoords = document.querySelector<HTMLElement>('#status-coords')!;
    this.statusMode = document.querySelector<HTMLElement>('#status-mode')!;
    this.statusCount = document.querySelector<HTMLElement>('#status-count')!;

    this.editor = MyEditor.getInstance();

    this.toolbar = new ToolBar('#toolbar', '#tooltip', {
      onSelectMode: mode => {
        this.editor.setMode(mode);
        this.updateStatusBar();
        window.electronAPI?.notifyModeChanged(mode);
      },
      onToggleTable: () => {
        window.electronAPI?.toggleTable();
      },
      onClear: () => {
        this.editor.clear();
        this.updateStatusBar();
      },
    });

    this.editor.configure({
      requestRepaint: () => this.repaint(),
      onTitleChange: title => {
        window.electronAPI?.setWindowTitle(title);
        if (this.editor) {
          this.updateStatusBar();
        }
      },
      onModeChange: mode => {
        this.toolbar?.setActive(mode);
        window.electronAPI?.notifyModeChanged(mode);
      },
      onShapeAdded: record => {
        window.electronAPI?.notifyShapeAdded(record);
        this.updateStatusBar();
      },
      onShapesReplaced: records => {
        window.electronAPI?.notifyShapesReplaced(
          records,
          this.editor.getSelectedIndex(),
        );
        this.updateStatusBar();
      },
    });

    this.initCanvasSize();
    this.bindEvents();
    this.updateStatusBar();
    this.repaint();
  }

  private initCanvasSize(): void {
    const resize = () => {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.repaint();
    };

    window.addEventListener('resize', resize);
    resize();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      this.editor.onLBdown(e.offsetX, e.offsetY);
    });

    this.canvas.addEventListener('mousemove', e => {
      this.statusCoords.textContent = `X: ${Math.round(e.offsetX)}, Y: ${Math.round(e.offsetY)}`;
      this.editor.onMouseMove(e.offsetX, e.offsetY);
    });

    this.canvas.addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      this.editor.onLBup(e.offsetX, e.offsetY);
      this.updateStatusBar();
    });

    window.electronAPI?.onSelectMode(mode => {
      if (!isShapeMode(mode)) {
        return;
      }
      this.editor.setMode(mode);
      this.toolbar.setActive(mode);
      this.updateStatusBar();
    });

    window.electronAPI?.onClear(() => {
      this.editor.clear();
      this.updateStatusBar();
    });

    window.electronAPI?.onTableStateChanged(isOpen => {
      this.toolbar.setTableOpen(isOpen);
    });

    window.electronAPI?.onTableSelectRow(index => {
      this.editor.setSelectedIndex(index);
    });

    window.electronAPI?.onTableDeleteRow(index => {
      this.editor.removeShapeAt(index);
      this.updateStatusBar();
    });

    window.electronAPI?.onLoadShapes(rows => {
      this.editor.loadFromRecords(rows);
      this.updateStatusBar();
    });

    window.electronAPI?.onSaveShapesRequest(() => {
      window.electronAPI?.sendShapesForSave(this.editor.getRecords());
    });
  }

  private updateStatusBar(): void {
    if (!this.editor) return;
    this.statusMode.textContent = `Режим: ${this.editor.getCurrentModeName()}`;
    this.statusCount.textContent = `Об'єктів: ${this.editor.getShapeCount()}/${this.editor.getMaxShapes()}`;
  }

  private repaint(): void {
    this.editor.onPaint(this.ctx, this.canvas.width, this.canvas.height);
  }
}

new App();
