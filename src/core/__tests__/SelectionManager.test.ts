import { describe, it, expect } from 'vitest'
import { SelectionManager } from '../SelectionManager.js'
import { UiState } from '../UiState.js'
import { RectShape } from '../shapes/RectShape.js'
import { TextShape } from '../shapes/TextShape.js'

describe('SelectionManager', () => {
  const createMockUiState = () => {
    return {
      primaryColor: { value: '' },
      strokeWidth: { value: '' },
      strokeWidthLabel: { textContent: '' },
      fillShapeInput: { checked: false },
      cornerRadiusInput: { value: '' },
      cornerRadiusLabel: { textContent: '' },
      shapeOpacity: { value: '' },
      shapeOpacityLabel: { textContent: '' },
      fontSize: { value: '' },
      fontSizeLabel: { textContent: '' },
      fontBold: { checked: false },
    } as unknown as UiState
  }

  it('should initialize with null selection', () => {
    const uiState = createMockUiState()
    const selection = new SelectionManager(uiState)
    expect(selection.selectedShapeId).toBeNull()
    expect(selection.resizeHandle).toBeNull()
  })

  it('should select shape and synchronize RectShape styles to UI', () => {
    const uiState = createMockUiState()
    const selection = new SelectionManager(uiState)

    const shape = new RectShape('rect-1', 10, 20, 100, 200, '#ff0000', true, 4, 0, 100)

    selection.selectShape(shape, 4)

    expect(selection.selectedShapeId).toBe('rect-1')
    expect(selection.resizeHandle).toBeNull()

    selection.resizeHandle = 'move'
    expect(selection.resizeHandle).toBe('move')

    expect(uiState.primaryColor.value).toBe('#ff0000')
    expect(uiState.strokeWidth.value).toBe('4')
    expect(uiState.strokeWidthLabel.textContent).toBe('4px')
    expect(uiState.fillShapeInput.checked).toBe(true)
    expect(uiState.shapeOpacity.value).toBe('100')
    expect(uiState.shapeOpacityLabel.textContent).toBe('100%')
  })

  it('should select shape and synchronize custom opacity to UI', () => {
    const uiState = createMockUiState()
    const selection = new SelectionManager(uiState)

    const shape = new RectShape('rect-1', 10, 20, 100, 200, '#00ff00', false, 4, 0, 60)

    selection.selectShape(shape, 2)

    expect(selection.selectedShapeId).toBe('rect-1')
    expect(uiState.primaryColor.value).toBe('#00ff00')
    expect(uiState.shapeOpacity.value).toBe('60')
    expect(uiState.shapeOpacityLabel.textContent).toBe('60%')
  })

  it('should select shape and synchronize TextShape styles to UI', () => {
    const uiState = createMockUiState()
    const selection = new SelectionManager(uiState)

    const shape = new TextShape('text-1', 10, 20, 100, 50, '#0000ff', 28, true, 'hello', 0, 100)

    selection.selectShape(shape, 2)

    expect(selection.selectedShapeId).toBe('text-1')
    expect(uiState.primaryColor.value).toBe('#0000ff')
    expect(uiState.fontSize.value).toBe('28')
    expect(uiState.fontSizeLabel.textContent).toBe('28px')
    expect(uiState.fontBold.checked).toBe(true)
  })

  it('should clear selection when selecting null', () => {
    const uiState = createMockUiState()
    const selection = new SelectionManager(uiState)
    const shape = new RectShape('rect-1', 10, 20, 100, 200, '#ff0000', true, 4, 0, 100)

    selection.selectShape(shape, 4)
    expect(selection.selectedShapeId).toBe('rect-1')

    selection.selectShape(null, 4)
    expect(selection.selectedShapeId).toBeNull()
    expect(selection.resizeHandle).toBeNull()
  })
})
