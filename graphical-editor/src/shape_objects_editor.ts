import { Shape } from './shapes/shape.ts';
import { ShapeEditor } from './editors/shape_editor.ts';
import { PointEditor } from './editors/point_editor.ts';
import { LineEditor } from './editors/line_editor.ts';
import { RectEditor } from './editors/rect_editor.ts';
import { EllipseEditor } from './editors/ellipse_editor.ts';

export type ShapeMode = 'point' | 'line' | 'rect' | 'ellipse';

export class ShapeObjectsEditor {
  private readonly maxShapes: number = 125;
  private pcshape: (Shape | null)[] = Array.from({ length: 125 }, () => null);
  private shapeCount: number = 0;

  private currentEditor: ShapeEditor | null = null;
  private currentModeName: string = 'Крапка';

  constructor(
    private readonly requestRepaint: () => void,
    private readonly onTitleChange: (title: string) => void,
  ) {
    this.startPointEditor();
  }

  addShape(shape: Shape): void {
    if (this.shapeCount < this.maxShapes) {
      this.pcshape[this.shapeCount++] = shape;
    }
  }

  startPointEditor(): void {
    this.currentEditor = new PointEditor(
      s => this.addShape(s),
      () => this.requestRepaint(),
    );
    this.currentModeName = 'Крапка';
    this.updateTitle();
  }

  startLineEditor(): void {
    this.currentEditor = new LineEditor(
      s => this.addShape(s),
      () => this.requestRepaint(),
    );
    this.currentModeName = 'Лінія';
    this.updateTitle();
  }

  startRectEditor(): void {
    this.currentEditor = new RectEditor(
      s => this.addShape(s),
      () => this.requestRepaint(),
    );
    this.currentModeName = 'Прямокутник';
    this.updateTitle();
  }

  startEllipseEditor(): void {
    this.currentEditor = new EllipseEditor(
      s => this.addShape(s),
      () => this.requestRepaint(),
    );
    this.currentModeName = 'Еліпс';
    this.updateTitle();
  }

  setMode(mode: ShapeMode): void {
    switch (mode) {
      case 'point':
        this.startPointEditor();
        break;
      case 'line':
        this.startLineEditor();
        break;
      case 'rect':
        this.startRectEditor();
        break;
      case 'ellipse':
        this.startEllipseEditor();
        break;
    }
  }

  private updateTitle(): void {
    this.onTitleChange(
      `Графічний редактор — [Режим: ${this.currentModeName}] (Об'єктів: ${this.shapeCount}/${this.maxShapes})`,
    );
  }

  clear(): void {
    this.pcshape.fill(null);
    this.shapeCount = 0;
    this.updateTitle();
    this.requestRepaint();
  }

  onLBdown(x: number, y: number): void {
    this.currentEditor?.onLBdown(x, y);
  }

  onMouseMove(x: number, y: number): void {
    this.currentEditor?.onMouseMove(x, y);
  }

  onLBup(x: number, y: number): void {
    this.currentEditor?.onLBup(x, y);
    this.updateTitle();
  }

  onPaint(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < this.shapeCount; i++) {
      this.pcshape[i]?.show(ctx);
    }

    this.currentEditor?.onPaint(ctx);
  }

  getShapeCount(): number {
    return this.shapeCount;
  }

  getMaxShapes(): number {
    return this.maxShapes;
  }

  getCurrentModeName(): string {
    return this.currentModeName;
  }
}
