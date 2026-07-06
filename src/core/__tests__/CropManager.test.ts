import { describe, it, expect } from 'vitest'
import { CropManager } from '../CropManager.js'

describe('CropManager', () => {
  it('should initialize with crop mode disabled and null area', () => {
    const manager = new CropManager()
    expect(manager.isCropMode).toBe(false)
    expect(manager.cropRect).toBeNull()
    expect(manager.cropDragHandle).toBeNull()
  })

  it('should enter crop mode and center initial coordinates', () => {
    const manager = new CropManager()
    manager.enterCropMode(1000, 800)

    expect(manager.isCropMode).toBe(true)
    expect(manager.cropRect).toEqual({
      x: 100,
      y: 80,
      w: 800,
      h: 640,
    })
  })

  it('should cancel crop mode and clear coordinates', () => {
    const manager = new CropManager()
    manager.enterCropMode(1000, 800)
    manager.cropDragHandle = 'nw'

    manager.cancelCropMode()

    expect(manager.isCropMode).toBe(false)
    expect(manager.cropRect).toBeNull()
    expect(manager.cropDragHandle).toBeNull()
  })

  it('should update crop rect coordinates during northwest resize drag', () => {
    const manager = new CropManager()
    manager.enterCropMode(1000, 800) // x: 100, y: 80, w: 800, h: 640
    manager.cropDragHandle = 'nw'

    // Northwest handle dragging
    manager.updateCropRectCoords(120, 95, 0, 0, 1000, 800)

    expect(manager.cropRect).toEqual({
      x: 120,
      y: 95,
      w: 780,
      h: 625,
    })
  })

  it('should update crop rect coordinates during drag move', () => {
    const manager = new CropManager()
    manager.enterCropMode(1000, 800) // x: 100, y: 80, w: 800, h: 640
    manager.cropDragHandle = 'move'

    // Move drag: drawStartX=10, drawStartY=15, currentMouseX=150, currentMouseY=120
    manager.updateCropRectCoords(150, 120, 10, 15, 1000, 800)

    // Expected position: x = 150 - 10 = 140, y = 120 - 15 = 105
    // Clamped inside bounds (0 to 1000-w = 200, 0 to 800-h = 160)
    expect(manager.cropRect).toEqual({
      x: 140,
      y: 105,
      w: 800,
      h: 640,
    })
  })

  it('should update crop rect proportionally when cropRatio is set to a preset (e.g. Square 1:1)', () => {
    const manager = new CropManager()
    manager.enterCropMode(1000, 800) // x: 100, y: 80, w: 800, h: 640
    manager.cropRatio = 1.0 // Lock to Square
    manager.cropDragHandle = 'se'

    // Drag SE handle: projected scale is (dx * R + dy) / (R^2 + 1) = (400 * 1 + 370) / 2 = 385.
    manager.updateCropRectCoords(500, 450, 0, 0, 1000, 800)

    expect(manager.cropRect).toEqual({
      x: 100,
      y: 80,
      w: 385,
      h: 385,
    })
  })
})
