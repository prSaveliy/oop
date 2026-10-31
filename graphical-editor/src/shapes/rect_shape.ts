import { Shape } from './shape.ts';

export class RectShape extends Shape {
  protected fillStyle: string = '#38bdf8';

  show(ctx: CanvasRenderingContext2D): void {
    const left = Math.min(this.xs1, this.xs2);
    const top = Math.min(this.ys1, this.ys2);
    const width = Math.abs(this.xs2 - this.xs1);
    const height = Math.abs(this.ys2 - this.ys1);

    ctx.save();
    if (this.fillStyle && this.fillStyle !== 'transparent') {
      ctx.fillStyle = this.fillStyle;
      ctx.fillRect(left, top, width, height);
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, width, height);
    ctx.restore();
  }
}
