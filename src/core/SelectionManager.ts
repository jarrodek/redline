import { Shape } from './shapes/Shape.js'
import { RectShape } from './shapes/RectShape.js'
import { CircleShape } from './shapes/CircleShape.js'
import { TextShape } from './shapes/TextShape.js'
import { UiState } from './UiState.js'
import { HandleType } from './MathUtils.js'

/**
 * Manages the current selection state of annotation shapes and synchronizes UI settings.
 */
export class SelectionManager {
  private selectedId: string | null = null
  private selectedResizeHandle: HandleType | 'move' | null = null

  constructor(private readonly uiState: UiState) {}

  /**
   * The unique ID of the currently selected shape.
   */
  public get selectedShapeId(): string | null {
    return this.selectedId
  }

  public set selectedShapeId(id: string | null) {
    this.selectedId = id
  }

  /**
   * The active resize handle being dragged.
   */
  public get resizeHandle(): HandleType | 'move' | null {
    return this.selectedResizeHandle
  }

  public set resizeHandle(handle: HandleType | 'move' | null) {
    this.selectedResizeHandle = handle
  }

  /**
   * Selects a shape and synchronizes the editor toolbar/settings controls.
   */
  public selectShape(shape: Shape | null, currentStrokeWidth: number): void {
    if (shape) {
      this.selectedId = shape.id

      // Synchronize color swatches
      this.uiState.primaryColor.value = shape.color

      this.uiState.shapeOpacity.value = String(shape.opacity)
      this.uiState.shapeOpacityLabel.textContent = shape.opacity + '%'

      if (shape instanceof RectShape || shape instanceof CircleShape) {
        this.uiState.strokeWidth.value = String(currentStrokeWidth)
        this.uiState.strokeWidthLabel.textContent = currentStrokeWidth + 'px'
        this.uiState.fillShapeInput.checked = shape.fill
        if (shape instanceof RectShape) {
          this.uiState.cornerRadiusInput.value = String(shape.borderRadius)
          this.uiState.cornerRadiusLabel.textContent = shape.borderRadius + 'px'
        }
      } else if (shape instanceof TextShape) {
        this.uiState.fontSize.value = String(shape.fontSize)
        this.uiState.fontSizeLabel.textContent = shape.fontSize + 'px'
        this.uiState.fontBold.checked = shape.isBold
      }
    } else {
      this.selectedId = null
      this.selectedResizeHandle = null
    }
  }

  /**
   * Resizes the currently selected shape.
   */
  public updateSelectedShapeCoords(
    mx: number,
    my: number,
    annotations: Shape[],
    drawStartX: number,
    drawStartY: number
  ): void {
    if (!this.selectedId || !this.selectedResizeHandle) return
    const s = annotations.find((sh) => sh.id === this.selectedId)
    if (!s) return

    s.resize(this.selectedResizeHandle, mx, my, drawStartX, drawStartY, 10)
  }
}
