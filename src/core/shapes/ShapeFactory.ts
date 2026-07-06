import { AnnotationShape } from '../../types'
import { Shape } from './Shape'
import { RectShape } from './RectShape'
import { CircleShape } from './CircleShape'
import { TextShape } from './TextShape'

export function fromJSON(json: AnnotationShape): Shape {
  const opacity = json.opacity !== undefined ? json.opacity : 100
  switch (json.type) {
    case 'rect':
      return new RectShape(
        json.id,
        json.x,
        json.y,
        json.w,
        json.h,
        json.color,
        json.fill,
        json.strokeWidth || 4,
        json.borderRadius || 0,
        opacity
      )
    case 'circle':
      return new CircleShape(
        json.id,
        json.x,
        json.y,
        json.w,
        json.h,
        json.color,
        json.fill,
        json.strokeWidth || 4,
        opacity
      )
    case 'text':
      return new TextShape(
        json.id,
        json.x,
        json.y,
        json.w,
        json.h,
        json.color,
        json.fontSize,
        json.isBold,
        json.text || '',
        json.strokeWidth || 0,
        opacity
      )
    default:
      throw new Error(`Unknown shape type: ${(json as { type: string }).type}`)
  }
}
