import { Shape, type ShapeRecord } from './shape.ts';
import { PointShape } from './point_shape.ts';
import { LineShape } from './line_shape.ts';
import { RectShape } from './rect_shape.ts';
import { EllipseShape } from './ellipse_shape.ts';
import { LineOOShape } from './line_oo_shape.ts';
import { CubeShape } from './cube_shape.ts';

type ShapeConstructor = new (
  x1?: number,
  y1?: number,
  x2?: number,
  y2?: number,
) => Shape;

const SHAPE_CONSTRUCTORS: Record<string, ShapeConstructor> = {
  Крапка: PointShape,
  PointShape,
  Лінія: LineShape,
  LineShape,
  Прямокутник: RectShape,
  RectShape,
  Еліпс: EllipseShape,
  EllipseShape,
  'Лінія з кружечками': LineOOShape,
  LineOOShape,
  'Каркас куба': CubeShape,
  CubeShape,
};

export function createShapeFromRecord(record: ShapeRecord): Shape | null {
  const ShapeCtor = SHAPE_CONSTRUCTORS[record.name.trim()];
  if (!ShapeCtor) {
    return null;
  }

  const { x1, y1, x2, y2 } = record;
  if (
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(x2) ||
    !Number.isFinite(y2)
  ) {
    return null;
  }

  return new ShapeCtor(x1, y1, x2, y2);
}
