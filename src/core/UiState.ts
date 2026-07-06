/**
 * Central state accessor class that abstracts DOM queries for the UI.
 * Provides JSDoc-documented getters with runtime verification.
 */
export class UiState {
  /**
   * Undo action button.
   */
  get undoButton(): HTMLButtonElement {
    const result = document.getElementById('btn-undo') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Undo button not found. Was it removed?')
    }
    return result
  }

  /**
   * Redo action button.
   */
  get redoButton(): HTMLButtonElement {
    const result = document.getElementById('btn-redo') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Redo button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to apply/commit active crop.
   */
  get cropApplyButton(): HTMLButtonElement {
    const result = document.getElementById('btn-crop-apply') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Crop apply button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to cancel active crop mode.
   */
  get cropCancelButton(): HTMLButtonElement {
    const result = document.getElementById('btn-crop-cancel') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Crop cancel button not found. Was it removed?')
    }
    return result
  }

  /**
   * Input element for specifying new canvas width.
   */
  get resizeWidth(): HTMLInputElement {
    const result = document.getElementById('resize-width') as HTMLInputElement | null
    if (!result) {
      throw new Error('Resize width not found. Was it removed?')
    }
    return result
  }

  /**
   * Input element for specifying new canvas height.
   */
  get resizeHeight(): HTMLInputElement {
    const result = document.getElementById('resize-height') as HTMLInputElement | null
    if (!result) {
      throw new Error('Resize height not found. Was it removed?')
    }
    return result
  }

  /**
   * Cached list of tool button elements.
   */
  get toolButtons(): NodeListOf<HTMLButtonElement> {
    const result = document.querySelectorAll('.tool-btn') as NodeListOf<HTMLButtonElement>
    return result
  }

  /**
   * Stroke width slider input.
   */
  get strokeWidth(): HTMLInputElement {
    const result = document.getElementById('stroke-width') as HTMLInputElement | null
    if (!result) {
      throw new Error('Stroke width input not found. Was it removed?')
    }
    return result
  }

  /**
   * Label showing the current stroke width in pixels.
   */
  get strokeWidthLabel(): HTMLSpanElement {
    const result = document.getElementById('stroke-width-val') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Stroke width label not found. Was it removed?')
    }
    return result
  }

  /**
   * Checkbox to toggle filled shape drawing.
   */
  get fillShapeInput(): HTMLInputElement {
    const result = document.getElementById('fill-shape') as HTMLInputElement | null
    if (!result) {
      throw new Error('Fill shape checkbox not found. Was it removed?')
    }
    return result
  }

  /**
   * Corner radius slider input for rectangle roundness.
   */
  get cornerRadiusInput(): HTMLInputElement {
    const result = document.getElementById('corner-radius') as HTMLInputElement | null
    if (!result) {
      throw new Error('Corner radius input not found. Was it removed?')
    }
    return result
  }

  /**
   * Label showing the current rectangle corner radius in pixels.
   */
  get cornerRadiusLabel(): HTMLSpanElement {
    const result = document.getElementById('corner-radius-val') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Corner radius label not found. Was it removed?')
    }
    return result
  }

  /**
   * Opacity slider input for shapes.
   */
  get shapeOpacity(): HTMLInputElement {
    const result = document.getElementById('shape-opacity') as HTMLInputElement | null
    if (!result) {
      throw new Error('Shape opacity input not found. Was it removed?')
    }
    return result
  }

  /**
   * Label showing the current shape opacity percentage.
   */
  get shapeOpacityLabel(): HTMLSpanElement {
    const result = document.getElementById('shape-opacity-val') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Shape opacity label not found. Was it removed?')
    }
    return result
  }

  /**
   * Input for configuring text shape font size.
   */
  get fontSize(): HTMLInputElement {
    const result = document.getElementById('font-size') as HTMLInputElement | null
    if (!result) {
      throw new Error('Font size input not found. Was it removed?')
    }
    return result
  }

  /**
   * Label showing current font size in pixels.
   */
  get fontSizeLabel(): HTMLSpanElement {
    const result = document.getElementById('font-size-val') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Font size label not found. Was it removed?')
    }
    return result
  }

  /**
   * Checkbox to toggle bold text font weight.
   */
  get fontBold(): HTMLInputElement {
    const result = document.getElementById('font-bold') as HTMLInputElement | null
    if (!result) {
      throw new Error('Bold checkbox not found. Was it removed?')
    }
    return result
  }

  /**
   * Color picker input for primary outline/fill color.
   */
  get primaryColor(): HTMLInputElement {
    const result = document.getElementById('primary-color') as HTMLInputElement | null
    if (!result) {
      throw new Error('Primary color input not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to increase zoom level.
   */
  get zoomInButton(): HTMLButtonElement {
    const result = document.getElementById('btn-zoom-in') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Zoom in button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to decrease zoom level.
   */
  get zoomOutButton(): HTMLButtonElement {
    const result = document.getElementById('btn-zoom-out') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Zoom out button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to reset zoom to fit screen.
   */
  get zoomFitButton(): HTMLButtonElement {
    const result = document.getElementById('btn-zoom-fit') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Zoom fit button not found. Was it removed?')
    }
    return result
  }

  /**
   * Buttons to trigger tab switching in the sidebar.
   */
  get tabButtons(): NodeListOf<HTMLButtonElement> {
    return document.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>
  }

  /**
   * Tab panels corresponding to tool/setting sections.
   */
  get tabPanes(): NodeListOf<HTMLDivElement> {
    return document.querySelectorAll('.tab-pane') as NodeListOf<HTMLDivElement>
  }

  /**
   * Sidebar button for Draw tab.
   */
  get tabDraw(): HTMLButtonElement {
    const result = document.getElementById('tab-draw') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Tab draw button not found. Was it removed?')
    }
    return result
  }

  /**
   * Container group for stroke width styling inputs.
   */
  get groupStrokeWidth(): HTMLDivElement {
    const result = document.getElementById('group-stroke-width') as HTMLDivElement | null
    if (!result) {
      throw new Error('Group stroke width container not found. Was it removed?')
    }
    return result
  }

  /**
   * Container group for fill setting inputs.
   */
  get groupFill(): HTMLDivElement {
    const result = document.getElementById('group-fill') as HTMLDivElement | null
    if (!result) {
      throw new Error('Group fill container not found. Was it removed?')
    }
    return result
  }

  /**
   * Container group for corner radius settings.
   */
  get groupCornerRadius(): HTMLDivElement {
    const result = document.getElementById('group-corner-radius') as HTMLDivElement | null
    if (!result) {
      throw new Error('Group corner radius container not found. Was it removed?')
    }
    return result
  }

  /**
   * Container group for shape opacity setting inputs.
   */
  get groupShapeOpacity(): HTMLDivElement {
    const result = document.getElementById('group-shape-opacity') as HTMLDivElement | null
    if (!result) {
      throw new Error('Group shape opacity container not found. Was it removed?')
    }
    return result
  }

  /**
   * Container group for font size settings.
   */
  get groupFontSize(): HTMLDivElement {
    const result = document.getElementById('group-font-size') as HTMLDivElement | null
    if (!result) {
      throw new Error('Group font size container not found. Was it removed?')
    }
    return result
  }

  /**
   * Container group for bold text font style settings.
   */
  get groupFontBold(): HTMLDivElement {
    const result = document.getElementById('group-font-bold') as HTMLDivElement | null
    if (!result) {
      throw new Error('Group font bold container not found. Was it removed?')
    }
    return result
  }

  /**
   * Cached list of preset color buttons.
   */
  get colorSwatches(): NodeListOf<HTMLButtonElement> {
    return document.querySelectorAll('.preset-color-btn') as NodeListOf<HTMLButtonElement>
  }

  /**
   * Sidebar Drag & Drop dropzone container.
   */
  get sidebarDropzone(): HTMLDivElement {
    const result = document.getElementById('sidebar-dropzone') as HTMLDivElement | null
    if (!result) {
      throw new Error('Sidebar dropzone not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to open/import a new image.
   */
  get openFileButton(): HTMLButtonElement {
    const result = document.getElementById('btn-open-file') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Open file button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to open/import a new image when state is empty.
   */
  get emptyOpenButton(): HTMLButtonElement {
    const result = document.getElementById('btn-empty-open') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Empty open button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to save/export the image to file.
   */
  get saveFileButton(): HTMLButtonElement {
    const result = document.getElementById('btn-save-file') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Save file button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to copy the active cropped canvas to the clipboard.
   */
  get copyClipboardButton(): HTMLButtonElement {
    const result = document.getElementById('btn-copy-clipboard') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Copy clipboard button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to clear the canvas completely.
   */
  get clearCanvasButton(): HTMLButtonElement {
    const result = document.getElementById('btn-clear') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Clear canvas button not found. Was it removed?')
    }
    return result
  }

  /**
   * Hidden file input used for native file selection.
   */
  get fileInput(): HTMLInputElement {
    const result = document.getElementById('file-input') as HTMLInputElement | null
    if (!result) {
      throw new Error('File input element not found. Was it removed?')
    }
    return result
  }

  /**
   * Toggle button to lock aspect ratio on resize.
   */
  get lockAspectButton(): HTMLButtonElement {
    const result = document.getElementById('btn-lock-aspect') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Lock aspect ratio button not found. Was it removed?')
    }
    return result
  }

  /**
   * Button to apply canvas resizing.
   */
  get resizeApplyButton(): HTMLButtonElement {
    const result = document.getElementById('btn-resize-apply') as HTMLButtonElement | null
    if (!result) {
      throw new Error('Resize apply button not found. Was it removed?')
    }
    return result
  }

  /**
   * Base image canvas element.
   */
  get baseCanvas(): HTMLCanvasElement {
    const result = document.getElementById('base-canvas') as HTMLCanvasElement | null
    if (!result) {
      throw new Error('Base canvas element not found. Was it removed?')
    }
    return result
  }

  /**
   * Annotation overlays canvas element.
   */
  get annotationCanvas(): HTMLCanvasElement {
    const result = document.getElementById('annotation-canvas') as HTMLCanvasElement | null
    if (!result) {
      throw new Error('Annotation canvas element not found. Was it removed?')
    }
    return result
  }

  /**
   * Scrollable editor viewport wrapper.
   */
  get viewport(): HTMLDivElement {
    const result = document.getElementById('canvas-viewport') as HTMLDivElement | null
    if (!result) {
      throw new Error('Canvas viewport element not found. Was it removed?')
    }
    return result
  }

  /**
   * Aligned wrapper holding both base and annotation canvas layers.
   */
  get canvasWrapper(): HTMLDivElement {
    const result = document.getElementById('canvas-wrapper') as HTMLDivElement | null
    if (!result) {
      throw new Error('Canvas wrapper element not found. Was it removed?')
    }
    return result
  }

  /**
   * Card UI indicating no image is loaded.
   */
  get emptyState(): HTMLDivElement {
    const result = document.getElementById('empty-state') as HTMLDivElement | null
    if (!result) {
      throw new Error('Empty state element not found. Was it removed?')
    }
    return result
  }

  /**
   * Status bar text for canvas dimension display.
   */
  get statusSize(): HTMLSpanElement {
    const result = document.getElementById('status-size') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Status size element not found. Was it removed?')
    }
    return result
  }

  /**
   * Status bar text for mouse coordinate display.
   */
  get statusCoords(): HTMLSpanElement {
    const result = document.getElementById('status-coords') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Status coords element not found. Was it removed?')
    }
    return result
  }

  /**
   * Status bar text displaying shape selection count.
   */
  get statusSelection(): HTMLSpanElement {
    const result = document.getElementById('status-selection') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Status selection element not found. Was it removed?')
    }
    return result
  }

  /**
   * Status bar text displaying zoom percentage.
   */
  get zoomPercentText(): HTMLSpanElement {
    const result = document.getElementById('zoom-percent') as HTMLSpanElement | null
    if (!result) {
      throw new Error('Zoom percent element not found. Was it removed?')
    }
    return result
  }
}
