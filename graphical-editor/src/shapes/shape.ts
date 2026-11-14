export interface ShapeRecord {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface HighlightBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

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

  getCoords(): [number, number, number, number] {
    return [
      Math.round(this.xs1),
      Math.round(this.ys1),
      Math.round(this.xs2),
      Math.round(this.ys2),
    ];
  }

  toRecord(): ShapeRecord {
    const [x1, y1, x2, y2] = this.getCoords();
    return {
      name: this.getName(),
      x1,
      y1,
      x2,
      y2,
    };
  }

  getHighlightBounds(): HighlightBounds {
    const left = Math.min(this.xs1, this.xs2);
    const top = Math.min(this.ys1, this.ys2);
    const width = Math.abs(this.xs2 - this.xs1);
    const height = Math.abs(this.ys2 - this.ys1);
    return { left, top, width, height };
  }

  showHighlight(ctx: CanvasRenderingContext2D): void {
    const { left, top, width, height } = this.getHighlightBounds();
    const pad = 6;
    const bx = left - pad;
    const by = top - pad;
    const bw = width + pad * 2;
    const bh = height + pad * 2;

    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(bx, by, bw, bh);

    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    const handle = 5;
    const half = handle / 2;
    ctx.fillRect(bx - half, by - half, handle, handle);
    ctx.fillRect(bx + bw - half, by - half, handle, handle);
    ctx.fillRect(bx - half, by + bh - half, handle, handle);
    ctx.fillRect(bx + bw - half, by + bh - half, handle, handle);
    ctx.restore();
  }

  abstract getName(): string;

  abstract show(ctx: CanvasRenderingContext2D): void;
}
