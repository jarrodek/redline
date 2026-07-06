import { AnnotationShape } from '../../types'
import { BaseShape } from './BaseShape'
import { Shape } from './Shape'

/**
 * Represents a circular/elliptical annotation shape.
 * Fits within the bounding box specified by starting (x, y) coordinates and width/height.
 * Can be drawn either as an outlined border or as a filled solid circle.
 */
export class CircleShape extends BaseShape {
  /**
   * Constructs a CircleShape.
   * @param id Unique identifier.
   * @param x Initial X coordinate.
   * @param y Initial Y coordinate.
   * @param w Width (used to compute the radius proportionally).
   * @param h Height (used to compute the radius proportionally).
   * @param color Shape outline/fill color.
   * @param fill True to render filled, false to render only border stroke.
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
    opacity = 100
  ) {
    super(id, 'circle', x, y, w, h, color, strokeWidth, opacity)
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

    ctx.beginPath()
    const radius = Math.min(Math.abs(this.w), Math.abs(this.h)) / 2
    const centerX = this.x + this.w / 2
    const centerY = this.y + this.h / 2
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    if (this.fill) {
      ctx.fill()
    } else {
      ctx.stroke()
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
    return new CircleShape(
      newId || this.id,
      this.x,
      this.y,
      this.w,
      this.h,
      this.color,
      this.fill,
      this.strokeWidth,
      this.opacity
    )
  }

  public toJSON(): AnnotationShape {
    return {
      ...this.getCommonJSON(),
      type: 'circle',
      fill: this.fill,
    }
  }
}
