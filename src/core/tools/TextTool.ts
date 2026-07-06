import { Tool } from './Tool.js'
import { Annotator } from '../Annotator.js'

/**
 * Tool for placing text shape inputs on the canvas viewport.
 */
export class TextTool implements Tool {
  public onMouseDown(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    annotator.createTextEditorAt(x, y, e.clientX, e.clientY)
  }

  public onMouseMove(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    void x
    void y
    annotator.viewport.style.cursor = 'text'
  }

  public onMouseUp(e: MouseEvent, x: number, y: number, annotator: Annotator): void {
    void e
    void x
    void y
    void annotator
  }
}
