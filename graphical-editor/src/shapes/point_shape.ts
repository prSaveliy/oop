import { Shape } from './shape.ts';

export class PointShape extends Shape {
  show(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(this.xs1, this.ys1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
