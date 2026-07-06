import { Tool } from './Tool.js'
import { Annotator } from '../Annotator.js'
import * as ShapeFactory from '../shapes/ShapeFactory.js'
import { AnnotationShape } from '../../types.js'

/**
 * Tool for drawing vector annotation shapes (rect, circle, marker) on the canvas.
 */
export class DrawShapeTool implements Tool {
  public onMouseDown(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    annotator.isDrawing = true
    annotator.drawStartX = x
    annotator.drawStartY = y
  }

  public onMouseMove(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    annotator.viewport.style.cursor = 'crosshair'
    if (annotator.isDrawing) {
      const dx = x - annotator.drawStartX
      const dy = y - annotator.drawStartY

      annotator.activePreviewShape = ShapeFactory.fromJSON({
        id: 'preview',
        type: annotator.activeTool as AnnotationShape['type'],
        x: Math.min(annotator.drawStartX, x),
        y: Math.min(annotator.drawStartY, y),
        w: dx,
        h: dy,
        color: annotator.currentColor,
        fill: annotator.isFill,
        opacity: annotator.shapeOpacity,
        fontSize: annotator.fontSize,
        isBold: annotator.isBold,
        strokeWidth: annotator.strokeWidth,
        borderRadius: annotator.activeTool === 'rect' ? annotator.cornerRadius : 0,
      })

      annotator.draw()
    }
  }

  public onMouseUp(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    void x
    void y
    if (annotator.isDrawing && annotator.activePreviewShape) {
      annotator.isDrawing = false

      // Filter out clicking empty spots accidentally
      if (Math.abs(annotator.activePreviewShape.w) > 4 && Math.abs(annotator.activePreviewShape.h) > 4) {
        const shape = annotator.activePreviewShape.clone(crypto.randomUUID())
        shape.w = Math.abs(shape.w)
        shape.h = Math.abs(shape.h)
        annotator.annotations.push(shape)
        annotator.saveHistoryState()

        // Automatically enter selection mode and select the shape
        annotator.activeTool = 'select'
        annotator.selectionManager.selectShape(shape, annotator.strokeWidth)

        // Highlight selection button in UI
        annotator.toolButtons?.forEach((b) => {
          if (b.getAttribute('data-tool') === 'select') {
            b.classList.add('active')
          } else {
            b.classList.remove('active')
          }
        })

        annotator.updateControlVisibility()
      }

      annotator.activePreviewShape = null
      annotator.draw()
    }
  }
}
