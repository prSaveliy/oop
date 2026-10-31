import { ShapeEditor } from './shape_editor.ts';
import { CubeShape } from '../shapes/cube_shape.ts';

export class CubeEditor extends ShapeEditor {
  override onLBup(x: number, y: number): void {
    super.onLBup(x, y);
    this.onShapeCreated(
      new CubeShape(this.xstart, this.ystart, this.xend, this.yend),
    );
    this.requestRepaint();
  }

  override onPaint(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    const left = Math.min(this.xstart, this.xend);
    const top = Math.min(this.ystart, this.yend);
    const right = Math.max(this.xstart, this.xend);
    const bottom = Math.max(this.ystart, this.yend);

    const width = right - left;
    const height = bottom - top;
    const ox = Math.round(width * 0.35);
    const oy = Math.round(height * 0.35);

    ctx.save();
    ctx.strokeStyle = this.rubberColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);

    ctx.strokeRect(left, top, width, height);
    ctx.strokeRect(left + ox, top - oy, width, height);

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left + ox, top - oy);
    ctx.moveTo(right, top);
    ctx.lineTo(right + ox, top - oy);
    ctx.moveTo(left, bottom);
    ctx.lineTo(left + ox, bottom - oy);
    ctx.moveTo(right, bottom);
    ctx.lineTo(right + ox, bottom - oy);
    ctx.stroke();

    ctx.restore();
  }
}
