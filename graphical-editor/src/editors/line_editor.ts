import { ShapeEditor } from './shape_editor.ts';
import { LineShape } from '../shapes/line_shape.ts';

export class LineEditor extends ShapeEditor {
  override onLBup(x: number, y: number): void {
    super.onLBup(x, y);
    this.onShapeCreated(
      new LineShape(this.xstart, this.ystart, this.xend, this.yend),
    );
    this.requestRepaint();
  }

  override onPaint(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    ctx.save();
    ctx.strokeStyle = this.rubberColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.xstart, this.ystart);
    ctx.lineTo(this.xend, this.yend);
    ctx.stroke();
    ctx.restore();
  }
}
