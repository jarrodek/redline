import { Rect, calculateUpdatedRect, HandleType } from './MathUtils.js'

/**
 * Manages the cropping configuration and state updates.
 */
export class CropManager {
  private isCropModeActive = false
  private cropRectArea: Rect | null = null
  private dragHandle: HandleType | 'move' | null = null
  public cropRatio: 'free' | 'original' | number = 'free'

  /**
   * Flag indicating whether crop mode is active.
   */
  public get isCropMode(): boolean {
    return this.isCropModeActive
  }

  public set isCropMode(active: boolean) {
    this.isCropModeActive = active
  }

  /**
   * The coordinates and size of the current crop selection area.
   */
  public get cropRect(): Rect | null {
    return this.cropRectArea
  }

  public set cropRect(rect: Rect | null) {
    this.cropRectArea = rect
  }

  /**
   * The active handle type being dragged to resize or move the crop selection area.
   */
  public get cropDragHandle(): HandleType | 'move' | null {
    return this.dragHandle
  }

  public set cropDragHandle(handle: HandleType | 'move' | null) {
    this.dragHandle = handle
  }

  /**
   * Enters crop mode and centers the initial crop coordinates.
   */
  public enterCropMode(w: number, h: number): void {
    this.isCropModeActive = true
    this.cropRectArea = {
      x: Math.round(w * 0.1),
      y: Math.round(h * 0.1),
      w: Math.round(w * 0.8),
      h: Math.round(h * 0.8),
    }
  }

  /**
   * Cancels crop mode and clears crop states.
   */
  public cancelCropMode(): void {
    this.isCropModeActive = false
    this.cropRectArea = null
    this.dragHandle = null
  }

  /**
   * Updates crop coordinates based on drag handle and constraints.
   */
  public updateCropRectCoords(
    mx: number,
    my: number,
    drawStartX: number,
    drawStartY: number,
    boundsWidth: number,
    boundsHeight: number
  ): void {
    if (!this.cropRectArea || !this.dragHandle) return

    let ratio: number | undefined = undefined
    if (this.cropRatio === 'original') {
      ratio = boundsWidth / boundsHeight
    } else if (typeof this.cropRatio === 'number') {
      ratio = this.cropRatio
    }

    this.cropRectArea = calculateUpdatedRect(
      mx,
      my,
      this.cropRectArea,
      this.dragHandle,
      drawStartX,
      drawStartY,
      boundsWidth,
      boundsHeight,
      20,
      ratio
    )
  }
}
