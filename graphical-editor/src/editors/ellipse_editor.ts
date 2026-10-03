import { ShapeEditor } from './shape_editor.ts';
import { EllipseShape } from '../shapes/ellipse_shape.ts';

export class EllipseEditor extends ShapeEditor {
  override onLBup(x: number, y: number): void {
    super.onLBup(x, y);
    this.onShapeCreated(
      new EllipseShape(this.xstart, this.ystart, this.xend, this.yend),
    );
    this.requestRepaint();
  }

  override onPaint(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    const cx = (this.xstart + this.xend) / 2;
    const cy = (this.ystart + this.yend) / 2;
    const rx = Math.abs(this.xend - this.xstart) / 2;
    const ry = Math.abs(this.yend - this.ystart) / 2;

    if (rx === 0 && ry === 0) return;

    ctx.save();
    ctx.strokeStyle = this.rubberColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
