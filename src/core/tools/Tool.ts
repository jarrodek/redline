import { Annotator } from '../Annotator.js'

/**
 * Interface that all viewport interaction tools must implement.
 */
export interface Tool {
  /**
   * Invoked when a mouse down event occurs on the canvas viewport.
   *
   * @param e The browser mouse event.
   * @param x The canvas X coordinate.
   * @param y The canvas Y coordinate.
   * @param annotator The parent Annotator instance context.
   */
  onMouseDown(e: MouseEvent, x: number, y: number, annotator: Annotator): void

  /**
   * Invoked when a mouse move event occurs on the canvas viewport.
   *
   * @param e The browser mouse event.
   * @param x The canvas X coordinate.
   * @param y The canvas Y coordinate.
   * @param annotator The parent Annotator instance context.
   */
  onMouseMove(e: MouseEvent, x: number, y: number, annotator: Annotator): void

  /**
   * Invoked when a mouse up event occurs on the canvas viewport.
   *
   * @param e The browser mouse event.
   * @param x The canvas X coordinate.
   * @param y The canvas Y coordinate.
   * @param annotator The parent Annotator instance context.
   */
  onMouseUp(e: MouseEvent, x: number, y: number, annotator: Annotator): void
}
