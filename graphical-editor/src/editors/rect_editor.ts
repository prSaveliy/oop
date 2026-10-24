import { ShapeEditor } from './shape_editor.ts';
import { RectShape } from '../shapes/rect_shape.ts';

export class RectEditor extends ShapeEditor {
  override onLBup(x: number, y: number): void {
    super.onLBup(x, y);
    this.onShapeCreated(
      new RectShape(this.xstart, this.ystart, this.xend, this.yend),
    );
    this.requestRepaint();
  }

  override onPaint(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    const left = Math.min(this.xstart, this.xend);
    const top = Math.min(this.ystart, this.yend);
    const width = Math.abs(this.xend - this.xstart);
    const height = Math.abs(this.yend - this.ystart);

    ctx.save();
    ctx.strokeStyle = this.rubberColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.strokeRect(left, top, width, height);
    ctx.restore();
  }
}
