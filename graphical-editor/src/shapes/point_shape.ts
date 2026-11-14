import { Shape, type HighlightBounds } from './shape.ts';

export class PointShape extends Shape {
  override getName(): string {
    return 'Крапка';
  }

  override getHighlightBounds(): HighlightBounds {
    return {
      left: this.xs1 - 3,
      top: this.ys1 - 3,
      width: 6,
      height: 6,
    };
  }

  show(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(this.xs1, this.ys1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
