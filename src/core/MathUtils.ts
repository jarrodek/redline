export function hexToRgba(hex: string, opacityPercent: number): string {
  const opacity = opacityPercent / 100
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`
    : `rgba(0, 0, 0, ${opacity})`
}

/**
 * Bounding box rectangle coordinates and size interface.
 */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Supported resize handle corners.
 */
export type HandleType = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'

/**
 * Returns the handle name ('nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w') if the pointer coordinates are within a handle/edge's bounds.
 * Returns null if the pointer is not within any handle's bounds.
 *
 * @param mx The pointer X coordinate.
 * @param my The pointer Y coordinate.
 * @param rect The bounding box rectangle of the shape or crop area.
 * @param hSize The half-size/radius of the target area for each handle.
 * @param padding Optional offset padding around the rectangle edges.
 */
export function getHandleAt(mx: number, my: number, rect: Rect, hSize = 8, padding = 0): HandleType | null {
  const corners = [
    { name: 'nw' as const, x: rect.x - padding, y: rect.y - padding },
    { name: 'ne' as const, x: rect.x + rect.w + padding, y: rect.y - padding },
    { name: 'se' as const, x: rect.x + rect.w + padding, y: rect.y + rect.h + padding },
    { name: 'sw' as const, x: rect.x - padding, y: rect.y + rect.h + padding },
  ]

  for (const pt of corners) {
    if (mx >= pt.x - hSize && mx <= pt.x + hSize && my >= pt.y - hSize && my <= pt.y + hSize) {
      return pt.name
    }
  }

  // Check edges (n, s, e, w)
  const rx = rect.x - padding
  const ry = rect.y - padding
  const rw = rect.w + 2 * padding
  const rh = rect.h + 2 * padding

  // Top edge
  if (my >= ry - hSize && my <= ry + hSize && mx >= rx && mx <= rx + rw) {
    return 'n'
  }
  // Bottom edge
  if (my >= ry + rh - hSize && my <= ry + rh + hSize && mx >= rx && mx <= rx + rw) {
    return 's'
  }
  // Left edge
  if (mx >= rx - hSize && mx <= rx + hSize && my >= ry && my <= ry + rh) {
    return 'w'
  }
  // Right edge
  if (mx >= rx + rw - hSize && mx <= rx + rw + hSize && my >= ry && my <= ry + rh) {
    return 'e'
  }

  return null
}

/**
 * Calculates and returns a new updated rectangle based on the dragging handle, boundary constraints,
 * mouse coordinates, and minimum size constraints.
 *
 * @param mx The current mouse X coordinate.
 * @param my The current mouse Y coordinate.
 * @param rect The starting bounding box rectangle.
 * @param dragHandle The active handle being dragged ('nw', 'ne', 'se', 'sw', or 'move').
 * @param startX The initial drawing start X coordinate relative to the box when moving.
 * @param startY The initial drawing start Y coordinate relative to the box when moving.
 * @param boundsWidth The maximum allowed width boundary.
 * @param boundsHeight The maximum allowed height boundary.
 * @param minSize The minimum width/height constraint.
 */
export function calculateUpdatedRect(
  mx: number,
  my: number,
  rect: Rect,
  dragHandle: HandleType | 'move',
  startX: number,
  startY: number,
  boundsWidth: number,
  boundsHeight: number,
  minSize = 20,
  targetRatio?: number
): Rect {
  const updated = { ...rect }

  if (dragHandle === 'move') {
    const newX = mx - startX
    const newY = my - startY
    updated.x = Math.max(0, Math.min(newX, boundsWidth - rect.w))
    updated.y = Math.max(0, Math.min(newY, boundsHeight - rect.h))
    return updated
  }

  const right = rect.x + rect.w
  const bottom = rect.y + rect.h

  if (targetRatio !== undefined && targetRatio > 0) {
    const R = targetRatio
    switch (dragHandle) {
      case 'se': {
        const maxW = boundsWidth - rect.x
        const maxH = boundsHeight - rect.y
        const dx = mx - rect.x
        const dy = my - rect.y
        const scale = (dx * R + dy) / (R * R + 1)
        let w = scale * R
        let h = scale

        // Clamp to minSize
        if (w < minSize) {
          w = minSize
          h = w / R
        }
        if (h < minSize) {
          h = minSize
          w = h * R
        }

        // Clamp to boundaries
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        if (h > maxH) {
          h = maxH
          w = h * R
        }

        updated.w = Math.round(w)
        updated.h = Math.round(h)
        break
      }

      case 'ne': {
        const maxW = boundsWidth - rect.x
        const maxH = bottom
        const dx = mx - rect.x
        const dy = bottom - my
        const scale = (dx * R + dy) / (R * R + 1)
        let w = scale * R
        let h = scale

        // Clamp to minSize
        if (w < minSize) {
          w = minSize
          h = w / R
        }
        if (h < minSize) {
          h = minSize
          w = h * R
        }

        // Clamp to boundaries
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        if (h > maxH) {
          h = maxH
          w = h * R
        }

        updated.w = Math.round(w)
        updated.h = Math.round(h)
        updated.y = Math.round(bottom - h)
        break
      }

      case 'sw': {
        const maxW = right
        const maxH = boundsHeight - rect.y
        const dx = right - mx
        const dy = my - rect.y
        const scale = (dx * R + dy) / (R * R + 1)
        let w = scale * R
        let h = scale

        // Clamp to minSize
        if (w < minSize) {
          w = minSize
          h = w / R
        }
        if (h < minSize) {
          h = minSize
          w = h * R
        }

        // Clamp to boundaries
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        if (h > maxH) {
          h = maxH
          w = h * R
        }

        updated.w = Math.round(w)
        updated.x = Math.round(right - w)
        updated.h = Math.round(h)
        break
      }

      case 'nw': {
        const maxW = right
        const maxH = bottom
        const dx = right - mx
        const dy = bottom - my
        const scale = (dx * R + dy) / (R * R + 1)
        let w = scale * R
        let h = scale

        // Clamp to minSize
        if (w < minSize) {
          w = minSize
          h = w / R
        }
        if (h < minSize) {
          h = minSize
          w = h * R
        }

        // Clamp to boundaries
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        if (h > maxH) {
          h = maxH
          w = h * R
        }

        updated.w = Math.round(w)
        updated.x = Math.round(right - w)
        updated.h = Math.round(h)
        updated.y = Math.round(bottom - h)
        break
      }

      case 'e': {
        const maxW = boundsWidth - rect.x
        const maxH = boundsHeight - rect.y
        let w = Math.max(minSize, mx - rect.x)
        let h = w / R
        if (h > maxH) {
          h = maxH
          w = h * R
        }
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        updated.w = Math.round(w)
        updated.h = Math.round(h)
        break
      }

      case 'w': {
        const maxW = right
        const maxH = boundsHeight - rect.y
        let w = Math.max(minSize, right - mx)
        let h = w / R
        if (h > maxH) {
          h = maxH
          w = h * R
        }
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        updated.w = Math.round(w)
        updated.x = Math.round(right - w)
        updated.h = Math.round(h)
        break
      }

      case 's': {
        const maxW = boundsWidth - rect.x
        const maxH = boundsHeight - rect.y
        let h = Math.max(minSize, my - rect.y)
        let w = h * R
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        if (h > maxH) {
          h = maxH
          w = h * R
        }
        updated.w = Math.round(w)
        updated.h = Math.round(h)
        break
      }

      case 'n': {
        const maxW = boundsWidth - rect.x
        const maxH = bottom
        let h = Math.max(minSize, bottom - my)
        let w = h * R
        if (w > maxW) {
          w = maxW
          h = w / R
        }
        if (h > maxH) {
          h = maxH
          w = h * R
        }
        updated.w = Math.round(w)
        updated.h = Math.round(h)
        updated.y = Math.round(bottom - h)
        break
      }
    }
    return updated
  }

  switch (dragHandle) {
    case 'nw':
      updated.x = Math.max(0, Math.min(mx, right - minSize))
      updated.y = Math.max(0, Math.min(my, bottom - minSize))
      updated.w = right - updated.x
      updated.h = bottom - updated.y
      break
    case 'ne':
      updated.w = Math.max(minSize, Math.min(mx - rect.x, boundsWidth - rect.x))
      updated.y = Math.max(0, Math.min(my, bottom - minSize))
      updated.h = bottom - updated.y
      break
    case 'se':
      updated.w = Math.max(minSize, Math.min(mx - rect.x, boundsWidth - rect.x))
      updated.h = Math.max(minSize, Math.min(my - rect.y, boundsHeight - rect.y))
      break
    case 'sw':
      updated.x = Math.max(0, Math.min(mx, right - minSize))
      updated.w = right - updated.x
      updated.h = Math.max(minSize, Math.min(my - rect.y, boundsHeight - rect.y))
      break
    case 'n':
      updated.y = Math.max(0, Math.min(my, bottom - minSize))
      updated.h = bottom - updated.y
      break
    case 's':
      updated.h = Math.max(minSize, Math.min(my - rect.y, boundsHeight - rect.y))
      break
    case 'e':
      updated.w = Math.max(minSize, Math.min(mx - rect.x, boundsWidth - rect.x))
      break
    case 'w':
      updated.x = Math.max(0, Math.min(mx, right - minSize))
      updated.w = right - updated.x
      break
  }

  return updated
}
