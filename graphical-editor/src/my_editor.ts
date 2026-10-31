import { Shape } from './shapes/shape.ts';
import { ShapeEditor } from './editors/shape_editor.ts';
import { PointEditor } from './editors/point_editor.ts';
import { LineEditor } from './editors/line_editor.ts';
import { RectEditor } from './editors/rect_editor.ts';
import { EllipseEditor } from './editors/ellipse_editor.ts';
import { LineOOEditor } from './editors/line_oo_editor.ts';
import { CubeEditor } from './editors/cube_editor.ts';

export type ShapeMode =
  'point' | 'line' | 'rect' | 'ellipse' | 'lineOO' | 'cube';

export class MyEditor {
  private static instance: MyEditor | null = null;

  private readonly maxShapes: number = 126;
  private pcshape: (Shape | null)[] = Array.from({ length: 126 }, () => null);
  private shapeCount: number = 0;

  private currentEditor: ShapeEditor | null = null;
  private currentMode: ShapeMode = 'point';
  private currentModeName: string = 'Крапка';

  constructor(
    private readonly requestRepaint: () => void,
    private readonly onTitleChange: (title: string) => void,
    private readonly onModeChange?: (mode: ShapeMode) => void,
  ) {
    this.setMode('point');
  }

  public static getInstance(
    requestRepaint?: () => void,
    onTitleChange?: (title: string) => void,
    onModeChange?: (mode: ShapeMode) => void,
  ): MyEditor {
    if (!MyEditor.instance) {
      if (!requestRepaint || !onTitleChange) {
        throw new Error('MyEditor must be initialized with callbacks');
      }
      MyEditor.instance = new MyEditor(
        requestRepaint,
        onTitleChange,
        onModeChange,
      );
    }
    return MyEditor.instance;
  }

  addShape(shape: Shape): void {
    if (this.shapeCount < this.maxShapes) {
      this.pcshape[this.shapeCount++] = shape;
    }
  }

  start(editor: ShapeEditor, mode: ShapeMode, modeName: string): void {
    this.currentEditor = editor;
    this.currentMode = mode;
    this.currentModeName = modeName;
    this.updateTitle();
    this.onModeChange?.(this.currentMode);
  }

  setMode(mode: ShapeMode): void {
    const notifyShape = (s: Shape): void => this.addShape(s);
    const repaint = (): void => this.requestRepaint();

    switch (mode) {
      case 'point':
        this.start(new PointEditor(notifyShape, repaint), 'point', 'Крапка');
        break;
      case 'line':
        this.start(new LineEditor(notifyShape, repaint), 'line', 'Лінія');
        break;
      case 'rect':
        this.start(new RectEditor(notifyShape, repaint), 'rect', 'Прямокутник');
        break;
      case 'ellipse':
        this.start(new EllipseEditor(notifyShape, repaint), 'ellipse', 'Еліпс');
        break;
      case 'lineOO':
        this.start(
          new LineOOEditor(notifyShape, repaint),
          'lineOO',
          'Лінія з кружечками',
        );
        break;
      case 'cube':
        this.start(new CubeEditor(notifyShape, repaint), 'cube', 'Каркас куба');
        break;
    }
  }

  private updateTitle(): void {
    this.onTitleChange(
      `Графічний редактор - Лабораторна робота №4 (${this.shapeCount}/${this.maxShapes})`,
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

  getCurrentMode(): ShapeMode {
    return this.currentMode;
  }

  getCurrentModeName(): string {
    return this.currentModeName;
  }
}
