import { Tool } from './Tool.js'
import { Annotator } from '../Annotator.js'
import { TextShape } from '../shapes/TextShape.js'
import { getHandleAt } from '../MathUtils.js'

/**
 * Tool for selecting, moving, and resizing annotation shapes on the canvas.
 */
export class SelectTool implements Tool {
  public onMouseDown(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    const selection = annotator.selectionManager

    // 1. Check handles click first on the currently selected shape
    if (selection.selectedShapeId) {
      const s = annotator.annotations.find((sh) => sh.id === selection.selectedShapeId)
      if (s) {
        let sw = s.w
        let sh = s.h
        if (s instanceof TextShape) {
          sw = annotator.getTextWidth(s.text || '', s.fontSize, s.isBold)
          sh = s.fontSize * (s.text || '').split('\n').length * 1.25
        }

        const handle = getHandleAt(x, y, { x: s.x, y: s.y, w: sw, h: sh }, 8, 4)
        if (handle) {
          if (s instanceof TextShape && handle !== 'nw') {
            // Text shapes only support nw handle or moving
          } else {
            selection.resizeHandle = handle
            annotator.drawStartX = x
            annotator.drawStartY = y
            this.updateCursor(annotator, handle)
            return
          }
        }
      }
    }

    // 2. Check shape selection click
    const shape = annotator.findShapeAt(x, y)
    if (shape) {
      selection.selectShape(shape, annotator.strokeWidth)
      selection.resizeHandle = 'move'
      annotator.drawStartX = x - shape.x
      annotator.drawStartY = y - shape.y
      this.updateCursor(annotator, 'move')
    } else {
      selection.selectShape(null, annotator.strokeWidth)
      annotator.viewport.style.cursor = 'default'
    }

    annotator.updateControlVisibility()
    annotator.draw()
  }

  public onMouseMove(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    const selection = annotator.selectionManager
    if (selection.selectedShapeId && selection.resizeHandle) {
      selection.updateSelectedShapeCoords(x, y, annotator.annotations, annotator.drawStartX, annotator.drawStartY)
      annotator.draw()
      this.updateCursor(annotator, selection.resizeHandle)
    } else {
      this.updateHoverCursor(x, y, annotator)
    }
  }

  public onMouseUp(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    const selection = annotator.selectionManager
    if (selection.selectedShapeId && selection.resizeHandle) {
      selection.resizeHandle = null
      annotator.saveHistoryState()
      this.updateHoverCursor(x, y, annotator)
    }
  }

  /**
   * Sets the viewport cursor style depending on the active resize handle.
   * @param annotator The annotator controller instance.
   * @param handle The handle type ('nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w') or 'move'.
   */
  private updateCursor(annotator: Annotator, handle: string | null): void {
    let cursor = 'default'
    if (handle === 'nw' || handle === 'se') {
      cursor = 'nwse-resize'
    } else if (handle === 'ne' || handle === 'sw') {
      cursor = 'nesw-resize'
    } else if (handle === 'n' || handle === 's') {
      cursor = 'ns-resize'
    } else if (handle === 'e' || handle === 'w') {
      cursor = 'ew-resize'
    } else if (handle === 'move') {
      cursor = 'move'
    }
    annotator.viewport.style.cursor = cursor
  }

  /**
   * Updates the hover cursor depending on whether the mouse is hovering over a handle, shape body, or empty space.
   * @param x Coordinate X.
   * @param y Coordinate Y.
   * @param annotator The annotator instance.
   */
  private updateHoverCursor(x: number, y: number, annotator: Annotator): void {
    const selection = annotator.selectionManager
    if (selection.selectedShapeId) {
      const s = annotator.annotations.find((sh) => sh.id === selection.selectedShapeId)
      if (s) {
        let sw = s.w
        let sh = s.h
        if (s instanceof TextShape) {
          sw = annotator.getTextWidth(s.text || '', s.fontSize, s.isBold)
          sh = s.fontSize * (s.text || '').split('\n').length * 1.25
        }

        const handle = getHandleAt(x, y, { x: s.x, y: s.y, w: sw, h: sh }, 8, 4)
        if (handle) {
          if (s instanceof TextShape && handle !== 'nw') {
            // Text shapes only support nw handle
          } else {
            this.updateCursor(annotator, handle)
            return
          }
        }

        if (s.contains(x, y, (text: string, size: number, bold: boolean) => annotator.getTextWidth(text, size, bold))) {
          annotator.viewport.style.cursor = 'move'
          return
        }
      }
    }

    const shape = annotator.findShapeAt(x, y)
    if (shape) {
      annotator.viewport.style.cursor = 'pointer'
    } else {
      annotator.viewport.style.cursor = 'default'
    }
  }
}
