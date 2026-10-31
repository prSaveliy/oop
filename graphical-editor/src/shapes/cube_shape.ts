import { RectShape } from './rect_shape.ts';
import { LineShape } from './line_shape.ts';

export class CubeShape extends RectShape {
  constructor(x1: number = 0, y1: number = 0, x2: number = 0, y2: number = 0) {
    super(x1, y1, x2, y2);
    this.fillStyle = 'rgba(56, 189, 248, 0.2)';
  }

  override show(ctx: CanvasRenderingContext2D): void {
    const origX1 = this.xs1;
    const origY1 = this.ys1;
    const origX2 = this.xs2;
    const origY2 = this.ys2;

    const left = Math.min(origX1, origX2);
    const top = Math.min(origY1, origY2);
    const right = Math.max(origX1, origX2);
    const bottom = Math.max(origY1, origY2);

    const width = right - left;
    const height = bottom - top;
    const ox = Math.round(width * 0.35);
    const oy = Math.round(height * 0.35);

    this.xs1 = left + ox;
    this.ys1 = top - oy;
    this.xs2 = right + ox;
    this.ys2 = bottom - oy;
    super.show(ctx);

    const drawEdge = (x1: number, y1: number, x2: number, y2: number): void => {
      this.xs1 = x1;
      this.ys1 = y1;
      this.xs2 = x2;
      this.ys2 = y2;
      LineShape.prototype.show.call(this, ctx);
    };

    drawEdge(left, top, left + ox, top - oy);
    drawEdge(right, top, right + ox, top - oy);
    drawEdge(left, bottom, left + ox, bottom - oy);
    drawEdge(right, bottom, right + ox, bottom - oy);

    this.xs1 = left;
    this.ys1 = top;
    this.xs2 = right;
    this.ys2 = bottom;
    super.show(ctx);

    this.xs1 = origX1;
    this.ys1 = origY1;
    this.xs2 = origX2;
    this.ys2 = origY2;
  }
}
