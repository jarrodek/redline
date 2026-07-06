import { AnnotationShape } from '../../types'
import { BaseShape } from './BaseShape'
import { Shape } from './Shape'

/**
 * Represents a rectangular annotation shape.
 * Can be drawn either as an outlined border or as a filled solid rectangle.
 */
export class RectShape extends BaseShape {
  /**
   * Constructs a RectShape.
   * @param id Unique identifier.
   * @param x Initial X coordinate.
   * @param y Initial Y coordinate.
   * @param w Width.
   * @param h Height.
   * @param color Shape outline/fill color.
   * @param fill True to render filled, false to render only border stroke.
   * @param strokeWidth The stroke/border width.
   * @param borderRadius Corner radius for rounded corners. Defaults to 0.
   */
  constructor(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    public fill: boolean,
    strokeWidth: number,
    public borderRadius = 0,
    opacity = 100
  ) {
    super(id, 'rect', x, y, w, h, color, strokeWidth, opacity)
  }

  public draw(ctx: CanvasRenderingContext2D, _globalStrokeWidth: number): void {
    void _globalStrokeWidth
    ctx.save()
    ctx.globalAlpha = this.opacity / 100
    ctx.strokeStyle = this.color
    ctx.fillStyle = this.color
    ctx.lineWidth = this.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (this.borderRadius > 0) {
      ctx.beginPath()
      // Normalize width and height coordinates to avoid errors in roundRect
      const x = this.w < 0 ? this.x + this.w : this.x
      const y = this.h < 0 ? this.y + this.h : this.y
      const w = Math.abs(this.w)
      const h = Math.abs(this.h)
      const radius = Math.min(this.borderRadius, w / 2, h / 2)
      ctx.roundRect(x, y, w, h, radius)
      if (this.fill) {
        ctx.fill()
      } else {
        ctx.stroke()
      }
    } else {
      if (this.fill) {
        ctx.fillRect(this.x, this.y, this.w, this.h)
      } else {
        ctx.strokeRect(this.x, this.y, this.w, this.h)
      }
    }
    ctx.restore()
  }

  public contains(mx: number, my: number): boolean {
    const xStart = Math.min(this.x, this.x + this.w)
    const xEnd = Math.max(this.x, this.x + this.w)
    const yStart = Math.min(this.y, this.y + this.h)
    const yEnd = Math.max(this.y, this.y + this.h)
    return mx >= xStart && mx <= xEnd && my >= yStart && my <= yEnd
  }

  public clone(newId?: string): Shape {
    return new RectShape(
      newId || this.id,
      this.x,
      this.y,
      this.w,
      this.h,
      this.color,
      this.fill,
      this.strokeWidth,
      this.borderRadius,
      this.opacity
    )
  }

  public toJSON(): AnnotationShape {
    return {
      ...this.getCommonJSON(),
      type: 'rect',
      fill: this.fill,
      borderRadius: this.borderRadius,
    }
  }
}
