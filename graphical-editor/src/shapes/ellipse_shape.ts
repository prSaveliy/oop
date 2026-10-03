import { Shape } from './shape.ts';

export class EllipseShape extends Shape {
  show(ctx: CanvasRenderingContext2D): void {
    const cx = (this.xs1 + this.xs2) / 2;
    const cy = (this.ys1 + this.ys2) / 2;
    const rx = Math.abs(this.xs2 - this.xs1) / 2;
    const ry = Math.abs(this.ys2 - this.ys1) / 2;

    if (rx === 0 && ry === 0) return;

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
