import { AnnotationShape } from '../../types'
import { BaseShape } from './BaseShape'
import { Shape } from './Shape'
import { HandleType } from '../MathUtils.js'

/**
 * Represents a text box annotation shape.
 * Supports multi-line strings, custom font sizes, bold face toggle, and dynamic bounds evaluation.
 */
export class TextShape extends BaseShape {
  /**
   * Constructs a TextShape.
   * @param id Unique identifier.
   * @param x Initial X coordinate of the text box.
   * @param y Initial Y coordinate of the text box.
   * @param w Text bounding box width (normally dynamically derived).
   * @param h Text bounding box height (normally dynamically derived).
   * @param color Text fill color.
   * @param fontSize Font size in pixels.
   * @param isBold True for bold font face.
   * @param text The actual text string content.
   */
  constructor(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    public fontSize: number,
    public isBold: boolean,
    public text: string,
    strokeWidth = 0,
    opacity = 100
  ) {
    super(id, 'text', x, y, w, h, color, strokeWidth, opacity)
  }

  public draw(ctx: CanvasRenderingContext2D, _globalStrokeWidth: number): void {
    void _globalStrokeWidth
    if (!this.text) return

    ctx.save()
    ctx.globalAlpha = this.opacity / 100
    ctx.font = `${this.isBold ? 'bold ' : ''}${this.fontSize}px 'Plus Jakarta Sans', sans-serif`
    ctx.fillStyle = this.color
    ctx.textBaseline = 'top'

    const lines = this.text.split('\n')
    let currentY = this.y
    lines.forEach((line) => {
      ctx.fillText(line, this.x, currentY)
      currentY += this.fontSize * 1.25 // Line height
    })
    ctx.restore()
  }

  public contains(
    mx: number,
    my: number,
    getTextWidthFn: (text: string, size: number, bold: boolean) => number
  ): boolean {
    const width = getTextWidthFn(this.text, this.fontSize, this.isBold)
    const height = this.fontSize * this.text.split('\n').length * 1.25
    const xStart = Math.min(this.x, this.x + width)
    const xEnd = Math.max(this.x, this.x + width)
    const yStart = Math.min(this.y, this.y + height)
    const yEnd = Math.max(this.y, this.y + height)
    return mx >= xStart && mx <= xEnd && my >= yStart && my <= yEnd
  }

  public override resize(
    handle: HandleType | 'move',
    mx: number,
    my: number,
    drawStartX: number,
    drawStartY: number
  ): void {
    if (handle === 'move') {
      this.x = mx - drawStartX
      this.y = my - drawStartY
      return
    }
    if (handle === 'nw') {
      this.x = mx
      this.y = my
    }
  }

  public clone(newId?: string): Shape {
    return new TextShape(
      newId || this.id,
      this.x,
      this.y,
      this.w,
      this.h,
      this.color,
      this.fontSize,
      this.isBold,
      this.text,
      this.strokeWidth,
      this.opacity
    )
  }

  public toJSON(): AnnotationShape {
    return {
      ...this.getCommonJSON(),
      type: 'text',
      fontSize: this.fontSize,
      isBold: this.isBold,
      text: this.text,
    }
  }
}
