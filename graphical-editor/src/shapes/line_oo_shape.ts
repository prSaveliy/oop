import { LineShape } from './line_shape.ts';
import { EllipseShape } from './ellipse_shape.ts';

export class LineOOShape extends LineShape {
  override show(ctx: CanvasRenderingContext2D): void {
    const startX = this.xs1;
    const startY = this.ys1;
    const endX = this.xs2;
    const endY = this.ys2;

    super.show(ctx);

    const radius = 8;

    this.xs1 = startX;
    this.ys1 = startY;
    this.xs2 = startX + radius;
    this.ys2 = startY + radius;
    EllipseShape.prototype.show.call(this, ctx);

    this.xs1 = endX;
    this.ys1 = endY;
    this.xs2 = endX + radius;
    this.ys2 = endY + radius;
    EllipseShape.prototype.show.call(this, ctx);

    this.xs1 = startX;
    this.ys1 = startY;
    this.xs2 = endX;
    this.ys2 = endY;
  }
}
