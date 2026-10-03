import { ShapeEditor } from './shape_editor.ts';
import { PointShape } from '../shapes/point_shape.ts';

export class PointEditor extends ShapeEditor {
  override onLBdown(x: number, y: number): void {
    super.onLBdown(x, y);
    this.onShapeCreated(new PointShape(x, y, x, y));
    this.isDrawing = false;
    this.requestRepaint();
  }

  override onPaint(_ctx: CanvasRenderingContext2D): void {
  }
}
