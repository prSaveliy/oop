import { Shape, type HighlightBounds } from './shape.ts';

export class EllipseShape extends Shape {
  override getName(): string {
    return 'Еліпс';
  }

  override getHighlightBounds(): HighlightBounds {
    const rx = Math.abs(this.xs2 - this.xs1);
    const ry = Math.abs(this.ys2 - this.ys1);
    return {
      left: this.xs1 - rx,
      top: this.ys1 - ry,
      width: rx * 2,
      height: ry * 2,
    };
  }

  show(ctx: CanvasRenderingContext2D): void {
    const rx = Math.abs(this.xs2 - this.xs1);
    const ry = Math.abs(this.ys2 - this.ys1);

    if (rx === 0 && ry === 0) return;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(this.xs1, this.ys1, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
