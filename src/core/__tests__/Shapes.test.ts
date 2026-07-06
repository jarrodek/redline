import { describe, it, expect } from 'vitest'
import * as ShapeFactory from '../shapes/ShapeFactory'
import { RectShape } from '../shapes/RectShape'
import { CircleShape } from '../shapes/CircleShape'
import { TextShape } from '../shapes/TextShape'
import { AnnotationShape } from '../../types'

describe('Shape classes and polymorphism', () => {
  describe('ShapeFactory & JSON serialization', () => {
    it('should deserialize and serialize RectShape correctly', () => {
      const json: AnnotationShape = {
        id: '1',
        type: 'rect',
        x: 10,
        y: 20,
        w: 100,
        h: 200,
        color: '#ff0000',
        fill: true,
        opacity: 100,
        fontSize: 0,
        isBold: false,
        strokeWidth: 4,
        borderRadius: 0,
      }
      const shape = ShapeFactory.fromJSON(json)
      expect(shape).toBeInstanceOf(RectShape)
      expect(shape.toJSON()).toEqual(json)
    })

    it('should deserialize and serialize CircleShape correctly', () => {
      const json: AnnotationShape = {
        id: '3',
        type: 'circle',
        x: 30,
        y: 40,
        w: 50,
        h: 50,
        color: '#0000ff',
        fill: true,
        opacity: 100,
        fontSize: 0,
        isBold: false,
        strokeWidth: 4,
      }
      const shape = ShapeFactory.fromJSON(json)
      expect(shape).toBeInstanceOf(CircleShape)
      expect(shape.toJSON()).toEqual(json)
    })

    it('should deserialize and serialize TextShape correctly', () => {
      const json: AnnotationShape = {
        id: '5',
        type: 'text',
        x: 100,
        y: 100,
        w: 100,
        h: 30,
        color: '#ffffff',
        fill: false,
        opacity: 100,
        fontSize: 24,
        isBold: true,
        text: 'Hello\nWorld',
        strokeWidth: 0,
      }
      const shape = ShapeFactory.fromJSON(json)
      expect(shape).toBeInstanceOf(TextShape)
      expect(shape.toJSON()).toEqual(json)
    })
  })

  describe('Shape contains (hit testing)', () => {
    const dummyGetTextWidth = (text: string) => {
      const lines = text.split('\n')
      return Math.max(...lines.map((line) => line.length * 10))
    }

    it('should hit test RectShape correctly including negative dimensions', () => {
      // Positive width & height
      const rect1 = new RectShape('r1', 10, 10, 50, 50, '#000', false, 4)
      expect(rect1.contains(15, 15)).toBe(true)
      expect(rect1.contains(5, 5)).toBe(false)
      expect(rect1.contains(65, 65)).toBe(false)

      // Negative width & height
      const rect2 = new RectShape('r2', 50, 50, -30, -30, '#000', false, 4)
      expect(rect2.contains(35, 35)).toBe(true)
      expect(rect2.contains(55, 55)).toBe(false)
    })

    it('should hit test TextShape using line count and font size', () => {
      const textShape = new TextShape('t1', 10, 10, 0, 0, '#fff', 20, false, 'Hello\nWorld', 0)
      // Height should be 20 * 2 lines * 1.25 = 50px
      // Width should be mock-estimated as 5 * 10 = 50px
      expect(textShape.contains(30, 30, dummyGetTextWidth)).toBe(true) // inside (30,30)
      expect(textShape.contains(30, 65, dummyGetTextWidth)).toBe(false) // below bounds
      expect(textShape.contains(65, 30, dummyGetTextWidth)).toBe(false) // right of bounds
    })
  })

  describe('Shape resizing', () => {
    it('should resize RectShape correctly on handles and move', () => {
      const rect = new RectShape('r1', 10, 10, 50, 50, '#000', false, 4)

      // test move
      rect.resize('move', 100, 100, 20, 30, 10)
      expect(rect.x).toBe(80) // 100 - 20
      expect(rect.y).toBe(70) // 100 - 30

      // reset and test SE handle
      rect.x = 10
      rect.y = 10
      rect.w = 50
      rect.h = 50
      rect.resize('se', 70, 80, 0, 0, 10)
      expect(rect.w).toBe(60) // 70 - 10
      expect(rect.h).toBe(70) // 80 - 10
    })

    it('should resize TextShape by only changing x,y on nw handle', () => {
      const text = new TextShape('t1', 10, 10, 50, 20, '#fff', 20, false, 'Test', 0)
      text.resize('nw', 30, 40, 0, 0)
      expect(text.x).toBe(30)
      expect(text.y).toBe(40)
      // w and h should not change
      expect(text.w).toBe(50)
      expect(text.h).toBe(20)
    })
  })
})
