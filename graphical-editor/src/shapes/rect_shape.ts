import { Shape } from './shape.ts';

export class RectShape extends Shape {
  show(ctx: CanvasRenderingContext2D): void {
    const left = Math.min(this.xs1, this.xs2);
    const top = Math.min(this.ys1, this.ys2);
    const width = Math.abs(this.xs2 - this.xs1);
    const height = Math.abs(this.ys2 - this.ys1);

    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
