import { AnnotationShape } from '../../types'
import { HandleType } from '../MathUtils.js'

/**
 * Represents a polymorphic graphical annotation shape on a 2D canvas.
 * Encapsulates rendering, hit-testing, coordinate transformations, and serialization.
 */
export interface Shape {
  /** Unique identifier for the shape. */
  readonly id: string

  /** The type of shape annotation. */
  readonly type: AnnotationShape['type']

  /** X-coordinate of the shape's starting point (top-left or draw start). */
  x: number

  /** Y-coordinate of the shape's starting point (top-left or draw start). */
  y: number

  /** Width of the shape (can be negative during active drawing/drag). */
  w: number

  /** Height of the shape (can be negative during active drawing/drag). */
  h: number

  /** Primary stroke or fill color in CSS hex format (e.g. '#ef4444'). */
  color: string

  /** Stroke/Border thickness in pixels. */
  strokeWidth: number

  /** Opacity percentage (0-100) applied to the shape. */
  opacity: number

  /**
   * Renders the shape onto the provided Canvas 2D Context.
   * @param ctx The canvas rendering context to draw on.
   * @param strokeWidth The stroke width (border thickness) in pixels.
   */
  draw(ctx: CanvasRenderingContext2D, strokeWidth: number): void

  /**
   * Performs hit-testing to check if mouse coordinates fall within the boundaries of the shape.
   * @param mx Mouse X coordinate.
   * @param my Mouse Y coordinate.
   * @param getTextWidthFn Callback to calculate text width in pixels (required for text shape bounds estimation).
   * @returns true if the coordinates are inside the shape, false otherwise.
   */
  contains(mx: number, my: number, getTextWidthFn: (text: string, size: number, bold: boolean) => number): boolean

  /**
   * Updates the coordinates and sizes of the shape during resizing or moving operations.
   * @param handle Resizing handle ('nw', 'ne', 'se', 'sw') or 'move' for repositioning.
   * @param mx Current mouse X coordinate.
   * @param my Current mouse Y coordinate.
   * @param drawStartX Relative start offset X of the mouse drag relative to the shape.
   * @param drawStartY Relative start offset Y of the mouse drag relative to the shape.
   * @param minSize Minimum size constraint for width/height when resizing.
   */
  resize(
    handle: HandleType | 'move',
    mx: number,
    my: number,
    drawStartX: number,
    drawStartY: number,
    minSize: number
  ): void

  /**
   * Creates a duplicate of the shape instance.
   * @param newId Optional new unique ID for the cloned shape. Defaults to the same ID.
   */
  clone(newId?: string): Shape

  /**
   * Serializes the shape instance into a plain AnnotationShape data object.
   */
  toJSON(): AnnotationShape
}
