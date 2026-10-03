import { Editor } from './editor.ts';
import { Shape } from '../shapes/shape.ts';

export abstract class ShapeEditor extends Editor {
  protected isDrawing: boolean = false;
  protected xstart: number = 0;
  protected ystart: number = 0;
  protected xend: number = 0;
  protected yend: number = 0;

  protected readonly rubberColor: string = '#ef4444';

  constructor(
    protected readonly onShapeCreated: (shape: Shape) => void,
    protected readonly requestRepaint: () => void,
  ) {
    super();
  }

  onLBdown(x: number, y: number): void {
    this.xstart = this.xend = x;
    this.ystart = this.yend = y;
    this.isDrawing = true;
    this.requestRepaint();
  }

  onMouseMove(x: number, y: number): void {
    if (!this.isDrawing) return;
    this.xend = x;
    this.yend = y;
    this.requestRepaint();
  }

  onLBup(x: number, y: number): void {
    if (!this.isDrawing) return;
    this.xend = x;
    this.yend = y;
    this.isDrawing = false;
  }
}
