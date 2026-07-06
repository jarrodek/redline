import { Tool } from './Tool.js'
import { SelectTool } from './SelectTool.js'
import { TextTool } from './TextTool.js'
import { DrawShapeTool } from './DrawShapeTool.js'
import { Annotator } from '../Annotator.js'

/**
 * Manages active viewport tools and delegates input interactions.
 */
export class ToolManager {
  private readonly selectTool = new SelectTool()
  private readonly textTool = new TextTool()
  private readonly drawShapeTool = new DrawShapeTool()

  constructor(private readonly annotator: Annotator) {}

  /**
   * Returns the current tool instance based on the active tool name.
   */
  public get activeToolInstance(): Tool {
    const toolName = this.annotator.activeTool
    if (toolName === 'select') {
      return this.selectTool
    } else if (toolName === 'text') {
      return this.textTool
    } else {
      return this.drawShapeTool
    }
  }

  /**
   * Delegates mouse down events to the active tool.
   */
  public handleMouseDown(e: MouseEvent, x: number, y: number): void {
    this.activeToolInstance.onMouseDown(e, x, y, this.annotator)
  }

  /**
   * Delegates mouse move events to the active tool.
   */
  public handleMouseMove(e: MouseEvent, x: number, y: number): void {
    this.activeToolInstance.onMouseMove(e, x, y, this.annotator)
  }

  /**
   * Delegates mouse up events to the active tool.
   */
  public handleMouseUp(e: MouseEvent, x: number, y: number): void {
    this.activeToolInstance.onMouseUp(e, x, y, this.annotator)
  }
}
