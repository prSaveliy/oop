import { type HighlightBounds } from './shape.ts';
import { LineShape } from './line_shape.ts';
import { EllipseShape } from './ellipse_shape.ts';

export class LineOOShape extends LineShape {
  override getName(): string {
    return 'Лінія з кружечками';
  }

  override getHighlightBounds(): HighlightBounds {
    const radius = 8;
    const left = Math.min(this.xs1, this.xs2) - radius;
    const top = Math.min(this.ys1, this.ys2) - radius;
    const right = Math.max(this.xs1, this.xs2) + radius;
    const bottom = Math.max(this.ys1, this.ys2) + radius;
    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
    };
  }

  override show(ctx: CanvasRenderingContext2D): void {
    const startX = this.xs1;
    const startY = this.ys1;
    const endX = this.xs2;
    const endY = this.ys2;
    const radius = 8;

    try {
      super.show(ctx);

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
    } finally {
      this.xs1 = startX;
      this.ys1 = startY;
      this.xs2 = endX;
      this.ys2 = endY;
    }
  }
}
