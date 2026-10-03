export abstract class Editor {
  abstract onLBdown(x: number, y: number): void;
  abstract onLBup(x: number, y: number): void;
  abstract onMouseMove(x: number, y: number): void;
  abstract onPaint(ctx: CanvasRenderingContext2D): void;
}
