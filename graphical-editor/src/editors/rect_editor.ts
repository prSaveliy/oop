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
    const dx = Math.abs(this.xend - this.xstart);
    const dy = Math.abs(this.yend - this.ystart);

    ctx.save();
    ctx.strokeStyle = this.rubberColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.strokeRect(this.xstart - dx, this.ystart - dy, dx * 2, dy * 2);
    ctx.restore();
  }
}
