import { Shape } from './shape.ts';

export class RectShape extends Shape {
  show(ctx: CanvasRenderingContext2D): void {
    const dx = Math.abs(this.xs2 - this.xs1);
    const dy = Math.abs(this.ys2 - this.ys1);
    const left = this.xs1 - dx;
    const top = this.ys1 - dy;
    const width = dx * 2;
    const height = dy * 2;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
