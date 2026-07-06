import { AnnotationShape } from '../../types'
import { Shape } from './Shape'
import { HandleType } from '../MathUtils.js'

/**
 * Abstract base class that implements the Shape interface.
 * Provides the shared coordinate state and standard rectangular resizing logic.
 */
export abstract class BaseShape implements Shape {
  /**
   * Constructs a new BaseShape.
   * @param id Unique identifier.
   * @param type The shape annotation type.
   * @param x Initial X coordinate.
   * @param y Initial Y coordinate.
   * @param w Initial width.
   * @param h Initial height.
   * @param color CSS hex color value.
   */
  constructor(
    public readonly id: string,
    public readonly type: AnnotationShape['type'],
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public color: string,
    public strokeWidth: number,
    public opacity = 100
  ) {}

  public abstract draw(ctx: CanvasRenderingContext2D, strokeWidth: number): void

  public abstract contains(
    mx: number,
    my: number,
    getTextWidthFn: (text: string, size: number, bold: boolean) => number
  ): boolean

  public abstract clone(newId?: string): Shape
  public abstract toJSON(): AnnotationShape

  /**
   * Resizes or repositions the shape based on the dragging handle.
   * Concrete subclasses can override this method if they require custom resize logic (e.g. text shape).
   */
  public resize(
    handle: HandleType | 'move',
    mx: number,
    my: number,
    drawStartX: number,
    drawStartY: number,
    minSize: number
  ): void {
    if (handle === 'move') {
      this.x = mx - drawStartX
      this.y = my - drawStartY
      return
    }

    const right = this.x + this.w
    const bottom = this.y + this.h

    switch (handle) {
      case 'nw':
        this.x = Math.min(mx, right - minSize)
        this.y = Math.min(my, bottom - minSize)
        this.w = right - this.x
        this.h = bottom - this.y
        break
      case 'ne':
        this.w = Math.max(minSize, mx - this.x)
        this.y = Math.min(my, bottom - minSize)
        this.h = bottom - this.y
        break
      case 'se':
        this.w = Math.max(minSize, mx - this.x)
        this.h = Math.max(minSize, my - this.y)
        break
      case 'sw':
        this.x = Math.min(mx, right - minSize)
        this.w = right - this.x
        this.h = Math.max(minSize, my - this.y)
        break
      case 'n':
        this.y = Math.min(my, bottom - minSize)
        this.h = bottom - this.y
        break
      case 's':
        this.h = Math.max(minSize, my - this.y)
        break
      case 'e':
        this.w = Math.max(minSize, mx - this.x)
        break
      case 'w':
        this.x = Math.min(mx, right - minSize)
        this.w = right - this.x
        break
    }
  }

  protected getCommonJSON(): Omit<AnnotationShape, 'type'> {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      color: this.color,
      fill: false,
      opacity: this.opacity,
      fontSize: 0,
      isBold: false,
      strokeWidth: this.strokeWidth,
    }
  }
}
