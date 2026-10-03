import { ShapeObjectsEditor, type ShapeMode } from './shape_objects_editor.ts';

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private editor: ShapeObjectsEditor;
  private statusCoords: HTMLElement;
  private statusMode: HTMLElement;
  private statusCount: HTMLElement;

  constructor() {
    this.canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.statusCoords = document.querySelector<HTMLElement>('#status-coords')!;
    this.statusMode = document.querySelector<HTMLElement>('#status-mode')!;
    this.statusCount = document.querySelector<HTMLElement>('#status-count')!;

    this.editor = new ShapeObjectsEditor(
      () => this.repaint(),
      title => {
        window.electronAPI?.setWindowTitle(title);
        if (this.editor) {
          this.updateStatusBar();
        }
      },
    );

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
      this.editor.setMode(mode as ShapeMode);
      this.updateStatusBar();
    });

    window.electronAPI?.onClear(() => {
      this.editor.clear();
      this.updateStatusBar();
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
