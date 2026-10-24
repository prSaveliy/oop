import { Shape } from './shape.ts';

export class EllipseShape extends Shape {
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
