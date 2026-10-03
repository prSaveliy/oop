export abstract class Shape {
  protected xs1: number = 0;
  protected ys1: number = 0;
  protected xs2: number = 0;
  protected ys2: number = 0;

  constructor(x1: number = 0, y1: number = 0, x2: number = 0, y2: number = 0) {
    this.set(x1, y1, x2, y2);
  }

  set(x1: number, y1: number, x2: number, y2: number): void {
    this.xs1 = x1;
    this.ys1 = y1;
    this.xs2 = x2;
    this.ys2 = y2;
  }

  abstract show(ctx: CanvasRenderingContext2D): void;
}
