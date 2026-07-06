import { describe, it, expect } from 'vitest'
import { hexToRgba, getHandleAt, calculateUpdatedRect } from '../MathUtils'

describe('MathUtils', () => {
  describe('hexToRgba', () => {
    it('should convert full hex to rgba correctly', () => {
      expect(hexToRgba('#ff0000', 100)).toBe('rgba(255, 0, 0, 1)')
      expect(hexToRgba('#ef4444', 40)).toBe('rgba(239, 68, 68, 0.4)')
      expect(hexToRgba('#ffffff', 0)).toBe('rgba(255, 255, 255, 0)')
    })

    it('should handle shorthand hex values', () => {
      expect(hexToRgba('#f00', 100)).toBe('rgba(255, 0, 0, 1)')
      expect(hexToRgba('fff', 50)).toBe('rgba(255, 255, 255, 0.5)')
    })

    it('should fallback to black if hex is invalid', () => {
      expect(hexToRgba('invalid', 100)).toBe('rgba(0, 0, 0, 1)')
    })
  })

  describe('getHandleAt', () => {
    const rect = { x: 10, y: 20, w: 100, h: 50 }

    it('should detect corners without padding', () => {
      // northwest (10, 20)
      expect(getHandleAt(10, 20, rect)).toBe('nw')
      expect(getHandleAt(15, 25, rect)).toBe('nw')
      expect(getHandleAt(19, 29, rect)).toBeNull()

      // northeast (110, 20)
      expect(getHandleAt(110, 20, rect)).toBe('ne')

      // southeast (110, 70)
      expect(getHandleAt(110, 70, rect)).toBe('se')

      // southwest (10, 70)
      expect(getHandleAt(10, 70, rect)).toBe('sw')
    })

    it('should respect custom handle size (hSize)', () => {
      // northwest is at (10, 20). With hSize = 2, mouse must be within [8, 12] range.
      expect(getHandleAt(12, 22, rect, 2)).toBe('nw')
      expect(getHandleAt(15, 25, rect, 2)).toBeNull()
    })

    it('should respect padding offsets', () => {
      // With padding = 4, northwest target is at (6, 16)
      // northeast is at (114, 16)
      // southeast is at (114, 74)
      // southwest is at (6, 74)
      const padding = 4
      expect(getHandleAt(6, 16, rect, 8, padding)).toBe('nw')
      expect(getHandleAt(114, 16, rect, 8, padding)).toBe('ne')
      expect(getHandleAt(114, 74, rect, 8, padding)).toBe('se')
      expect(getHandleAt(6, 74, rect, 8, padding)).toBe('sw')

      // Standard coordinate should now be null/out of range
      expect(getHandleAt(10, 20, rect, 2, padding)).toBeNull()
    })
  })

  describe('calculateUpdatedRect', () => {
    const rect = { x: 50, y: 50, w: 100, h: 100 }

    it('should handle "move" operation and respect canvas boundary limits', () => {
      // Dragging from offset (10, 10) relative to rect start (50, 50)
      // Mouse is now at (70, 70)
      const updated = calculateUpdatedRect(70, 70, rect, 'move', 10, 10, 500, 500)
      expect(updated).toEqual({ x: 60, y: 60, w: 100, h: 100 })

      // Dragging beyond left boundary (negative X)
      const outLeft = calculateUpdatedRect(-50, 70, rect, 'move', 10, 10, 500, 500)
      expect(outLeft.x).toBe(0)

      // Dragging beyond right boundary
      const outRight = calculateUpdatedRect(600, 70, rect, 'move', 10, 10, 500, 500)
      expect(outRight.x).toBe(400) // 500 max width - 100 rect width
    })

    it('should handle resize northwest ("nw")', () => {
      const updated = calculateUpdatedRect(40, 30, rect, 'nw', 0, 0, 500, 500, 20)
      // Right boundary is 50 + 100 = 150. Bottom boundary is 50 + 100 = 150.
      // mx=40 -> x=40, w=110
      // my=30 -> y=30, h=120
      expect(updated).toEqual({ x: 40, y: 30, w: 110, h: 120 })

      // NW resize minSize constraint (minSize = 20)
      // Right is 150, bottom is 150.
      // Trying to drag NW coordinate to (140, 140) should limit X to 130 and Y to 130.
      const limited = calculateUpdatedRect(140, 140, rect, 'nw', 0, 0, 500, 500, 20)
      expect(limited).toEqual({ x: 130, y: 130, w: 20, h: 20 })
    })

    it('should handle resize northeast ("ne")', () => {
      const updated = calculateUpdatedRect(160, 30, rect, 'ne', 0, 0, 500, 500, 20)
      // Right is mx=160 -> w=110, y=30, h=120
      expect(updated).toEqual({ x: 50, y: 30, w: 110, h: 120 })
    })

    it('should handle resize southeast ("se")', () => {
      const updated = calculateUpdatedRect(160, 170, rect, 'se', 0, 0, 500, 500, 20)
      // Right is mx=160 -> w=110, h=120
      expect(updated).toEqual({ x: 50, y: 50, w: 110, h: 120 })
    })

    it('should handle resize southwest ("sw")', () => {
      const updated = calculateUpdatedRect(40, 170, rect, 'sw', 0, 0, 500, 500, 20)
      // Left is mx=40 -> x=40, w=110, h=120
      expect(updated).toEqual({ x: 40, y: 50, w: 110, h: 120 })
    })
  })
})
