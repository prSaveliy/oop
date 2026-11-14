import { Shape } from '../shapes/shape.ts';
import { ShapeEditor } from './shape_editor.ts';
import { PointEditor } from './point_editor.ts';
import { LineEditor } from './line_editor.ts';
import { RectEditor } from './rect_editor.ts';
import { EllipseEditor } from './ellipse_editor.ts';
import { LineOOEditor } from './line_oo_editor.ts';
import { CubeEditor } from './cube_editor.ts';

export type ShapeMode =
  'point' | 'line' | 'rect' | 'ellipse' | 'lineOO' | 'cube';

export type EditorFactory = (
  onShapeCreated: (shape: Shape) => void,
  requestRepaint: () => void,
) => ShapeEditor;

interface EditorEntry {
  label: string;
  create: EditorFactory;
}

const EDITOR_REGISTRY: Record<ShapeMode, EditorEntry> = {
  point: {
    label: 'Крапка',
    create: (onShapeCreated, requestRepaint) =>
      new PointEditor(onShapeCreated, requestRepaint),
  },
  line: {
    label: 'Лінія',
    create: (onShapeCreated, requestRepaint) =>
      new LineEditor(onShapeCreated, requestRepaint),
  },
  rect: {
    label: 'Прямокутник',
    create: (onShapeCreated, requestRepaint) =>
      new RectEditor(onShapeCreated, requestRepaint),
  },
  ellipse: {
    label: 'Еліпс',
    create: (onShapeCreated, requestRepaint) =>
      new EllipseEditor(onShapeCreated, requestRepaint),
  },
  lineOO: {
    label: 'Лінія з кружечками',
    create: (onShapeCreated, requestRepaint) =>
      new LineOOEditor(onShapeCreated, requestRepaint),
  },
  cube: {
    label: 'Каркас куба',
    create: (onShapeCreated, requestRepaint) =>
      new CubeEditor(onShapeCreated, requestRepaint),
  },
};

export function isShapeMode(mode: string): mode is ShapeMode {
  return Object.prototype.hasOwnProperty.call(EDITOR_REGISTRY, mode);
}

export function getModeLabel(mode: ShapeMode): string {
  return EDITOR_REGISTRY[mode].label;
}

export function createEditorForMode(
  mode: ShapeMode,
  onShapeCreated: (shape: Shape) => void,
  requestRepaint: () => void,
): ShapeEditor {
  return EDITOR_REGISTRY[mode].create(onShapeCreated, requestRepaint);
}
