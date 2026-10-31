import { ShapeEditor } from './shape_editor.ts';
import { LineOOShape } from '../shapes/line_oo_shape.ts';

export class LineOOEditor extends ShapeEditor {
  override onLBup(x: number, y: number): void {
    super.onLBup(x, y);
    this.onShapeCreated(
      new LineOOShape(this.xstart, this.ystart, this.xend, this.yend),
    );
    this.requestRepaint();
  }

  override onPaint(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    const radius = 8;

    ctx.save();
    ctx.strokeStyle = this.rubberColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(this.xstart, this.ystart);
    ctx.lineTo(this.xend, this.yend);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.xstart, this.ystart, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.xend, this.yend, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
