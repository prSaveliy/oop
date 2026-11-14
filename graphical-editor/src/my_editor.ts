import { Shape, type ShapeRecord } from './shapes/shape.ts';
import { createShapeFromRecord } from './shapes/shape_factory.ts';
import { ShapeEditor } from './editors/shape_editor.ts';
import {
  type ShapeMode,
  createEditorForMode,
  getModeLabel,
} from './editors/editor_registry.ts';

export type { ShapeMode };

export interface MyEditorCallbacks {
  requestRepaint: () => void;
  onTitleChange: (title: string) => void;
  onModeChange?: (mode: ShapeMode) => void;
  onShapeAdded?: (record: ShapeRecord) => void;
  onShapesReplaced?: (records: ShapeRecord[]) => void;
}

export class MyEditor {
  private static readonly instance: MyEditor = new MyEditor();

  private readonly maxShapes: number = 126;
  private pcshape: (Shape | null)[] = Array.from({ length: 126 }, () => null);
  private shapeCount: number = 0;
  private selectedIndex: number | null = null;

  private currentEditor: ShapeEditor | null = null;
  private currentMode: ShapeMode = 'point';
  private currentModeName: string = getModeLabel('point');

  private callbacks: MyEditorCallbacks = {
    requestRepaint: () => {},
    onTitleChange: () => {},
  };

  private constructor() {
    this.currentEditor = createEditorForMode(
      this.currentMode,
      shape => this.addShape(shape),
      () => this.callbacks.requestRepaint(),
    );
  }

  public static getInstance(): MyEditor {
    return MyEditor.instance;
  }

  configure(callbacks: MyEditorCallbacks): void {
    this.callbacks = callbacks;
    this.updateTitle();
    this.callbacks.onModeChange?.(this.currentMode);
  }

  start(mode: ShapeMode): void {
    this.setMode(mode);
  }

  setMode(mode: ShapeMode): void {
    this.currentMode = mode;
    this.currentModeName = getModeLabel(mode);
    this.currentEditor = createEditorForMode(
      mode,
      shape => this.addShape(shape),
      () => this.callbacks.requestRepaint(),
    );
    this.updateTitle();
    this.callbacks.onModeChange?.(mode);
    this.callbacks.requestRepaint();
  }

  private updateTitle(): void {
    this.callbacks.onTitleChange(
      `Графічний редактор — ${this.currentModeName}`,
    );
  }

  private addShape(shape: Shape): void {
    if (this.shapeCount >= this.maxShapes) {
      return;
    }
    this.pcshape[this.shapeCount] = shape;
    this.shapeCount += 1;
    this.callbacks.onShapeAdded?.(shape.toRecord());
    this.callbacks.requestRepaint();
  }

  clear(): void {
    this.pcshape.fill(null);
    this.shapeCount = 0;
    this.selectedIndex = null;
    this.callbacks.onShapesReplaced?.([]);
    this.callbacks.requestRepaint();
  }

  setSelectedIndex(index: number | null): void {
    if (index === null || index < 0 || index >= this.shapeCount) {
      this.selectedIndex = null;
    } else {
      this.selectedIndex = index;
    }
    this.callbacks.requestRepaint();
  }

  getSelectedIndex(): number | null {
    return this.selectedIndex;
  }

  removeShapeAt(index: number): boolean {
    if (index < 0 || index >= this.shapeCount) {
      return false;
    }
    for (let i = index; i < this.shapeCount - 1; i += 1) {
      this.pcshape[i] = this.pcshape[i + 1] ?? null;
    }
    this.shapeCount -= 1;
    this.pcshape[this.shapeCount] = null;

    if (this.selectedIndex === index) {
      this.selectedIndex = null;
    } else if (this.selectedIndex !== null && this.selectedIndex > index) {
      this.selectedIndex -= 1;
    }

    this.callbacks.onShapesReplaced?.(this.getRecords());
    this.callbacks.requestRepaint();
    return true;
  }

  loadFromRecords(records: ShapeRecord[]): number {
    this.pcshape.fill(null);
    this.shapeCount = 0;
    this.selectedIndex = null;

    for (const record of records) {
      if (this.shapeCount >= this.maxShapes) {
        break;
      }
      const shape = createShapeFromRecord(record);
      if (shape) {
        this.pcshape[this.shapeCount] = shape;
        this.shapeCount += 1;
      }
    }

    this.callbacks.onShapesReplaced?.(this.getRecords());
    this.callbacks.requestRepaint();
    return this.shapeCount;
  }

  getRecords(): ShapeRecord[] {
    const records: ShapeRecord[] = [];
    for (let i = 0; i < this.shapeCount; i += 1) {
      const shape = this.pcshape[i];
      if (shape) {
        records.push(shape.toRecord());
      }
    }
    return records;
  }

  onLBdown(x: number, y: number): void {
    this.currentEditor?.onLBdown(x, y);
  }

  onMouseMove(x: number, y: number): void {
    this.currentEditor?.onMouseMove(x, y);
  }

  onLBup(x: number, y: number): void {
    this.currentEditor?.onLBup(x, y);
  }

  onPaint(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < this.shapeCount; i += 1) {
      this.pcshape[i]?.show(ctx);
    }

    if (this.selectedIndex !== null) {
      this.pcshape[this.selectedIndex]?.showHighlight(ctx);
    }

    this.currentEditor?.onPaint(ctx);
  }

  getCurrentMode(): ShapeMode {
    return this.currentMode;
  }

  getCurrentModeName(): string {
    return this.currentModeName;
  }

  getShapeCount(): number {
    return this.shapeCount;
  }

  getMaxShapes(): number {
    return this.maxShapes;
  }
}
