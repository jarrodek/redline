import { open, save, ask } from '@tauri-apps/plugin-dialog'
import { homeDir } from '@tauri-apps/api/path'
import { readFile, writeFile } from '@tauri-apps/plugin-fs'
import { writeImage, readImage } from '@tauri-apps/plugin-clipboard-manager'
import { Image as TauriImage } from '@tauri-apps/api/image'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import type { AnnotationShape, HistoryState } from '../types.js'
import { HistoryManager } from './HistoryManager.js'
import { Shape } from './shapes/Shape.js'
import * as ShapeFactory from './shapes/ShapeFactory.js'
import { RectShape } from './shapes/RectShape.js'
import { CircleShape } from './shapes/CircleShape.js'
import { TextShape } from './shapes/TextShape.js'
import { UiState } from './UiState.js'
import { getHandleAt } from './MathUtils.js'
import { SelectionManager } from './SelectionManager.js'
import { CropManager } from './CropManager.js'
import { ToolManager } from './tools/ToolManager.js'

/**
 * Core Controller class that manages all drawing, annotations, history states,
 * and user UI interactions.
 */
export class Annotator {
  /**
   * Canvas element used to render the background/base image.
   */
  public readonly baseCanvas: HTMLCanvasElement
  /**
   * Overlay canvas element where annotations, drawings, and UI handles are rendered.
   */
  public readonly annCanvas: HTMLCanvasElement
  /**
   * 2D rendering context for the base canvas.
   */
  public readonly baseCtx: CanvasRenderingContext2D
  /**
   * 2D rendering context for the annotation canvas.
   */
  public readonly annCtx: CanvasRenderingContext2D

  /**
   * Scrollable viewport container element that wraps the canvas wrapper.
   */
  public readonly viewport: HTMLDivElement
  /**
   * Container wrapper element that holds and aligns both the base and annotation canvases.
   */
  public readonly canvasWrapper: HTMLDivElement
  /**
   * UI element displayed when no image is loaded.
   */
  public readonly emptyState: HTMLDivElement

  /**
   * Status bar element displaying the image dimensions (width x height).
   */
  public readonly statusSize: HTMLSpanElement
  /**
   * Status bar element displaying current mouse coordinates relative to the image.
   */
  public readonly statusCoords: HTMLSpanElement
  /**
   * Status bar element displaying details about the selected annotation shape.
   */
  public readonly statusSelection: HTMLSpanElement
  /**
   * UI element displaying the current zoom percentage.
   */
  public readonly zoomPercentText: HTMLSpanElement

  // Image & Shape State
  /**
   * The base HTMLImageElement loaded into the annotator, which is drawn onto the base canvas.
   */
  public baseImage: HTMLImageElement = new Image()
  /**
   * Array of active annotation shapes currently added to the document.
   */
  public annotations: Shape[] = []
  /**
   * Manager for undo and redo history states.
   */
  public readonly historyManager = new HistoryManager(50)

  // Tools & Style Configurations
  /**
   * Current zoom scale factor (e.g., 1.0 for 100%).
   */
  public scale = 1.0
  /**
   * The currently active drawing or selection tool.
   */
  public activeTool: 'select' | 'rect' | 'circle' | 'text' = 'select'
  /**
   * Corner radius for rectangles in pixels.
   */
  public cornerRadius = 0
  /**
   * Hex color code used for rendering new annotations or updating existing ones.
   */
  public currentColor = '#ef4444'
  /**
   * Thickness in pixels for the outline of drawn annotation shapes.
   */
  public strokeWidth = 4
  /**
   * Flag indicating whether new shapes should be drawn as filled rather than outline-only.
   */
  public isFill = false
  /**
   * Opacity percentage (0-100) applied to drawn annotation shapes.
   */
  public shapeOpacity = 100
  /**
   * Font size in pixels for text annotations.
   */
  public fontSize = 24
  /**
   * Flag indicating whether text annotations should use a bold font weight.
   */
  public isBold = false
  /**
   * The directory path from which the last image file was loaded or saved.
   */
  private lastOpenedDir: string | null = localStorage.getItem('lastOpenedDir')

  // Drawing states
  /**
   * Flag indicating if the user is currently dragging to draw a new shape.
   */
  public isDrawing = false
  /**
   * The X coordinate relative to the canvas where drawing of the current shape started.
   */
  public drawStartX = 0
  /**
   * The Y coordinate relative to the canvas where drawing of the current shape started.
   */
  public drawStartY = 0
  /**
   * The temporary shape currently being drawn and previewed before being committed to annotations.
   */
  public activePreviewShape: Shape | null = null

  // Panning states
  /**
   * Flag indicating whether the spacebar is pressed, enabling canvas panning.
   */
  private isSpacePressed = false
  /**
   * Flag indicating if the user is currently panning (dragging) the viewport.
   */
  private isPanning = false
  /**
   * The initial mouse X coordinate when panning began.
   */
  private panStartX = 0
  /**
   * The initial mouse Y coordinate when panning began.
   */
  private panStartY = 0
  /**
   * The viewport scrollLeft position when panning began.
   */
  private panScrollLeft = 0
  /**
   * The viewport scrollTop position when panning began.
   */
  private panScrollTop = 0

  // Aspect Ratio lock
  /**
   * Flag indicating whether the original image's aspect ratio should be locked when resizing.
   */
  private isAspectRatioLocked = true
  /**
   * Aspect ratio (width / height) of the loaded base image.
   */
  private imageAspectRatio = 1.0
  /**
   * ID of the text shape currently being edited, if any.
   */
  public editingShapeId: string | null = null

  // Element Cache
  /**
   * Cached list of tool button elements in the DOM.
   */
  public toolButtons: NodeListOf<HTMLButtonElement> | null = null

  // UI State
  public readonly uiState: UiState
  public readonly selectionManager: SelectionManager
  public readonly cropManager: CropManager
  public readonly toolManager: ToolManager

  constructor() {
    this.uiState = new UiState()
    this.selectionManager = new SelectionManager(this.uiState)
    this.cropManager = new CropManager()
    this.toolManager = new ToolManager(this)

    this.baseCanvas = this.uiState.baseCanvas
    this.annCanvas = this.uiState.annotationCanvas
    this.baseCtx = this.baseCanvas.getContext('2d') as CanvasRenderingContext2D
    this.annCtx = this.annCanvas.getContext('2d') as CanvasRenderingContext2D

    this.viewport = this.uiState.viewport
    this.canvasWrapper = this.uiState.canvasWrapper
    this.emptyState = this.uiState.emptyState

    this.statusSize = this.uiState.statusSize
    this.statusCoords = this.uiState.statusCoords
    this.statusSelection = this.uiState.statusSelection
    this.zoomPercentText = this.uiState.zoomPercentText
  }

  /**
   * Initializes the Annotator instance by setting up DOM event bindings.
   */
  public init(): void {
    this.setupTabs()
    this.setupTools()
    this.setupSettings()
    this.setupFileOperations()
    this.setupResizePanel()
    this.setupCanvasInteractions()
    this.setupKeyboardShortcuts()
    this.setupDragAndDrop()
    this.setupAspectButtons()
    this.setupMenuActions()
    void this.checkForUpdates()
  }

  /**
   * Subscribes to native application menu actions emitted by the Tauri backend.
   */
  private setupMenuActions(): void {
    void listen('menu-action', (event) => {
      const action = event.payload as string
      const isEditingText = document.querySelector('.text-editor-overlay') !== null

      if (action === 'open') {
        const openFileBtn = this.uiState.openFileButton
        if (openFileBtn) openFileBtn.click()
      } else if (action === 'export') {
        const saveFileBtn = this.uiState.saveFileButton
        if (saveFileBtn) saveFileBtn.click()
      } else if (action === 'copy') {
        const copyBtn = this.uiState.copyClipboardButton
        if (copyBtn) copyBtn.click()
      } else if (action === 'undo') {
        if (!isEditingText) {
          this.undo()
        }
      } else if (action === 'redo') {
        if (!isEditingText) {
          this.redo()
        }
      } else if (action === 'clear_edits') {
        if (this.baseCanvas.width > 0) {
          this.annotations = []
          this.selectionManager.selectShape(null, this.strokeWidth)
          this.saveHistoryState()
          this.draw()
          this.showToast('Cleared all edits', 'info')
        }
      } else if (action === 'clear_canvas') {
        if (this.baseCanvas.width > 0) {
          this.clearAll()
          this.showToast('Canvas cleared', 'info')
        }
      }
    })
  }

  /**
   * Queries the updater endpoint for new releases on startup.
   * If a new version is found, prompts the user to download and install.
   */
  private async checkForUpdates(): Promise<void> {
    try {
      const update = await check()
      if (update) {
        const confirmed = await ask(
          `Version ${update.version} is available! Would you like to download and install it now?\n\nRelease notes:\n${update.body || 'No release notes.'}`,
          { title: 'Update Available', kind: 'info' }
        )
        if (confirmed) {
          this.showToast('Downloading update...', 'info')
          await update.downloadAndInstall()
          this.showToast('Installing and restarting...', 'success')
          await relaunch()
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Update check failed:', err)
    }
  }

  // Save state to Undo history
  public saveHistoryState(): void {
    const state: HistoryState = {
      baseImageSrc: this.baseCanvas.toDataURL('image/png'),
      annotations: JSON.stringify(this.annotations.map((s) => s.toJSON())),
      imageWidth: this.baseCanvas.width,
      imageHeight: this.baseCanvas.height,
    }

    this.historyManager.pushState(state)
    this.updateHistoryButtons()
  }

  private updateHistoryButtons(): void {
    this.uiState.undoButton.disabled = !this.historyManager.canUndo
    this.uiState.redoButton.disabled = !this.historyManager.canRedo
  }

  // Load state from history
  private async loadHistoryState(state: HistoryState): Promise<void> {
    this.selectionManager.selectShape(null, this.strokeWidth)

    // Load base image
    await new Promise<void>((resolve) => {
      this.baseImage = new Image()
      this.baseImage.onload = () => {
        this.baseCanvas.width = state.imageWidth
        this.baseCanvas.height = state.imageHeight
        this.annCanvas.width = state.imageWidth
        this.annCanvas.height = state.imageHeight
        resolve()
      }
      this.baseImage.src = state.baseImageSrc
    })

    const rawAnnotations: AnnotationShape[] = JSON.parse(state.annotations)
    this.annotations = rawAnnotations.map((json) => ShapeFactory.fromJSON(json))

    // Update resize input values
    this.uiState.resizeWidth.value = String(state.imageWidth)
    this.uiState.resizeHeight.value = String(state.imageHeight)
    this.imageAspectRatio = state.imageWidth / state.imageHeight

    this.updateCanvasStyles()
    this.draw()
    this.updateHistoryButtons()
  }

  // Sidebar Tabs Navigation
  private setupTabs(): void {
    const tabs = this.uiState.tabButtons
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab')
        if (targetTab === 'crop') {
          this.enterCropMode()
        } else {
          if (this.cropManager.isCropMode) {
            this.cropManager.cancelCropMode()
            this.draw()
          }
        }

        tabs.forEach((t) => t.classList.remove('active'))
        this.uiState.tabPanes.forEach((p) => p.classList.remove('active'))

        tab.classList.add('active')
        document.getElementById(`tab-${targetTab}`)?.classList.add('active')
      })
    })
  }

  private switchToTab(tabName: string): void {
    const tabs = this.uiState.tabButtons
    tabs.forEach((tab) => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.click()
      }
    })
  }

  // Tool Grid Activation
  private setupTools(): void {
    this.toolButtons = this.uiState.toolButtons
    this.toolButtons.forEach((btn) => {
      btn.addEventListener('click', this.#handleToolClick)
    })
  }

  #handleToolClick: (e: Event) => void = (e) => {
    if (this.cropManager.isCropMode) return // Ignore tool changes in crop mode
    const btn = e.currentTarget as HTMLButtonElement

    this.toolButtons?.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')

    this.activeTool = btn.getAttribute('data-tool') as typeof this.activeTool
    this.selectionManager.selectShape(null, this.strokeWidth)
    this.updateControlVisibility()
    this.draw()
  }

  public updateControlVisibility(): void {
    // Helper to show/hide setting sliders depending on tool
    const groupStrokeWidth = this.uiState.groupStrokeWidth
    const groupFill = this.uiState.groupFill
    const groupCornerRadius = this.uiState.groupCornerRadius
    const groupShapeOpacity = this.uiState.groupShapeOpacity
    const groupFontSize = this.uiState.groupFontSize
    const groupFontBold = this.uiState.groupFontBold

    // Hide all
    groupStrokeWidth?.classList.add('hidden')
    groupFill?.classList.add('hidden')
    groupCornerRadius?.classList.add('hidden')
    groupShapeOpacity?.classList.add('hidden')
    groupFontSize?.classList.add('hidden')
    groupFontBold?.classList.add('hidden')

    // Determine target tool/shape type
    let targetType: string | null = this.activeTool

    if (this.activeTool === 'select' && this.selectionManager.selectedShapeId) {
      const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
      if (shape) {
        targetType = shape.type
      }
    }

    if (targetType === 'rect' || targetType === 'circle' || targetType === 'text') {
      groupShapeOpacity?.classList.remove('hidden')

      if (targetType === 'rect' || targetType === 'circle') {
        groupStrokeWidth?.classList.remove('hidden')
        groupFill?.classList.remove('hidden')
        if (targetType === 'rect') {
          groupCornerRadius?.classList.remove('hidden')
        }
      } else if (targetType === 'text') {
        groupFontSize?.classList.remove('hidden')
        groupFontBold?.classList.remove('hidden')
      }
    }
  }

  private setupSettings(): void {
    // Stroke Width Slider
    const swInput = this.uiState.strokeWidth
    const swVal = this.uiState.strokeWidthLabel
    swInput.addEventListener('input', () => {
      this.strokeWidth = parseInt(swInput.value)
      swVal.textContent = this.strokeWidth + 'px'
      if (this.selectionManager.selectedShapeId) {
        const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
        if (shape && (shape instanceof RectShape || shape instanceof CircleShape)) {
          shape.strokeWidth = this.strokeWidth
          this.draw()
        }
      }
    })
    swInput.addEventListener('change', () => {
      if (this.selectionManager.selectedShapeId) {
        this.saveHistoryState()
      }
    })

    // Fill Shape Toggle
    const fillInput = this.uiState.fillShapeInput
    fillInput.addEventListener('change', () => {
      this.isFill = fillInput.checked
      if (this.selectionManager.selectedShapeId) {
        const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
        if (shape && (shape instanceof RectShape || shape instanceof CircleShape)) {
          shape.fill = this.isFill
          this.draw()
          this.saveHistoryState()
        }
      }
    })

    // Corner Radius Slider
    const crInput = this.uiState.cornerRadiusInput
    const crVal = this.uiState.cornerRadiusLabel
    crInput.addEventListener('input', () => {
      this.cornerRadius = parseInt(crInput.value)
      crVal.textContent = this.cornerRadius + 'px'
      if (this.selectionManager.selectedShapeId) {
        const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
        if (shape && shape instanceof RectShape) {
          shape.borderRadius = this.cornerRadius
          this.draw()
        }
      }
    })
    crInput.addEventListener('change', () => {
      if (this.selectionManager.selectedShapeId) {
        this.saveHistoryState()
      }
    })

    // Shape Opacity Slider
    const opInput = this.uiState.shapeOpacity
    const opVal = this.uiState.shapeOpacityLabel
    opInput.addEventListener('input', () => {
      this.shapeOpacity = parseInt(opInput.value)
      opVal.textContent = this.shapeOpacity + '%'
      if (this.selectionManager.selectedShapeId) {
        const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
        if (shape) {
          shape.opacity = this.shapeOpacity
          this.draw()
        }
      }
    })
    opInput.addEventListener('change', () => {
      if (this.selectionManager.selectedShapeId) {
        this.saveHistoryState()
      }
    })

    // Font Size Slider
    const fsInput = this.uiState.fontSize
    const fsVal = this.uiState.fontSizeLabel
    fsInput.addEventListener('input', () => {
      this.fontSize = parseInt(fsInput.value)
      fsVal.textContent = this.fontSize + 'px'
      if (this.selectionManager.selectedShapeId) {
        const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
        if (shape && shape instanceof TextShape) {
          shape.fontSize = this.fontSize
          this.draw()
        }
      }
    })
    fsInput.addEventListener('change', () => {
      if (this.selectionManager.selectedShapeId) {
        this.saveHistoryState()
      }
    })

    // Bold Font Toggle
    const boldInput = this.uiState.fontBold
    boldInput.addEventListener('change', () => {
      this.isBold = boldInput.checked
      if (this.selectionManager.selectedShapeId) {
        const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
        if (shape && shape instanceof TextShape) {
          shape.isBold = this.isBold
          this.draw()
          this.saveHistoryState()
        }
      }
    })

    // Color Pickers
    const primaryColor = this.uiState.primaryColor
    primaryColor.addEventListener('input', () => {
      this.currentColor = primaryColor.value
      this.updatePresetColorSelection(this.currentColor)
      this.updateSelectedShapeColor(this.currentColor)
    })
    primaryColor.addEventListener('change', () => {
      if (this.selectionManager.selectedShapeId) {
        this.saveHistoryState()
      }
    })

    // Preset Swatches
    const colorSwatches = this.uiState.colorSwatches
    colorSwatches.forEach((btn) => {
      btn.addEventListener('click', () => {
        colorSwatches.forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        const color = btn.getAttribute('data-color')
        if (!color) return
        this.currentColor = color
        primaryColor.value = color
        this.updateSelectedShapeColor(this.currentColor)
        if (this.selectionManager.selectedShapeId) {
          this.saveHistoryState()
        }
      })
    })
  }

  private updatePresetColorSelection(color: string): void {
    const colorSwatches = this.uiState.colorSwatches
    colorSwatches.forEach((b) => b.classList.remove('active'))
    const match = Array.from(colorSwatches).find(
      (b) => b.getAttribute('data-color')?.toLowerCase() === color.toLowerCase()
    )
    if (match) match.classList.add('active')
  }

  public updateSelectedShapeColor(color: string): void {
    if (this.selectionManager.selectedShapeId) {
      const shape = this.annotations.find((s) => s.id === this.selectionManager.selectedShapeId)
      if (shape) {
        shape.color = color
        this.draw()
      }
    }
  }

  // Keyboard shortcuts (Undo/Redo, Delete selected, Panning spacer)
  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Delete Selected Annotation
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectionManager.selectedShapeId !== null) {
        // Make sure we aren't editing text in an input box
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA' &&
          !document.querySelector('.text-editor-overlay')
        ) {
          this.annotations = this.annotations.filter((s) => s.id !== this.selectionManager.selectedShapeId)
          this.selectionManager.selectShape(null, this.strokeWidth)
          this.saveHistoryState()
          this.draw()
        }
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        this.undo()
      }

      // Redo: Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        this.redo()
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA' &&
          !document.querySelector('.text-editor-overlay')
        ) {
          e.preventDefault()
          void this.pasteImageFromTauri()
        }
      }

      // Space key for panning viewport
      if (e.key === ' ' && !this.isSpacePressed) {
        // Ignore if typing in text inputs
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA' &&
          !document.querySelector('.text-editor-overlay')
        ) {
          e.preventDefault()
          this.isSpacePressed = true
          this.viewport.classList.add('panning')
        }
      }

      // Escape to cancel actions
      if (e.key === 'Escape') {
        if (this.cropManager.isCropMode) {
          this.cancelCropMode()
        } else {
          this.selectionManager.selectShape(null, this.strokeWidth)
          this.draw()
        }
      }
    })

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === ' ') {
        this.isSpacePressed = false
        this.isPanning = false
        this.viewport.classList.remove('panning', 'panning-active')
      }
    })

    // Global Clipboard Paste Listener
    window.addEventListener('paste', (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      let foundImage = false
      if (items) {
        for (const item of items) {
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile()
            if (file) {
              this.loadImageFromFile(file)
              foundImage = true
              break
            }
          }
        }
      }
      if (!foundImage) {
        void this.pasteImageFromTauri()
      }
    })
  }

  // Drag & Drop Files Ingestion
  private setupDragAndDrop(): void {
    const webview = getCurrentWebview()

    void webview.onDragDropEvent(async (event) => {
      const sz = this.uiState.sidebarDropzone
      const dropzones = [this.viewport, sz]

      if (event.payload.type === 'enter' || event.payload.type === 'over') {
        dropzones.forEach((zone) => {
          if (zone) zone.classList.add('dragover')
        })
      } else if (event.payload.type === 'leave') {
        dropzones.forEach((zone) => {
          if (zone) zone.classList.remove('dragover')
        })
      } else if (event.payload.type === 'drop') {
        dropzones.forEach((zone) => {
          if (zone) zone.classList.remove('dragover')
        })

        const paths = event.payload.paths
        if (paths && paths.length > 0) {
          const filePath = paths[0]
          const ext = filePath.split('.').pop()?.toLowerCase()
          const allowed = ['png', 'jpg', 'jpeg', 'webp', 'bmp']

          if (ext && allowed.includes(ext)) {
            try {
              const data = await readFile(filePath)
              const blob = new Blob([data])
              this.loadImageFromFile(blob)

              const lastIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
              if (lastIndex !== -1) {
                const dir = filePath.substring(0, lastIndex)
                this.lastOpenedDir = dir
                localStorage.setItem('lastOpenedDir', dir)
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('Failed to load dropped file:', err)
              this.showToast('Failed to load dropped file.', 'error')
            }
          } else {
            this.showToast('Unsupported file type. Please drop a PNG, JPG, JPEG, WEBP, or BMP image.', 'error')
          }
        }
      }
    })
  }

  // Native File System Operations (Open & Save)
  private setupFileOperations(): void {
    const openFileBtn = this.uiState.openFileButton
    const emptyOpenBtn = this.uiState.emptyOpenButton
    const saveFileBtn = this.uiState.saveFileButton
    const copyBtn = this.uiState.copyClipboardButton
    const clearBtn = this.uiState.clearCanvasButton
    const fileInput = this.uiState.fileInput

    const undoBtn = this.uiState.undoButton
    const redoBtn = this.uiState.redoButton

    undoBtn.addEventListener('click', () => this.undo())
    redoBtn.addEventListener('click', () => this.redo())

    const openAction = async () => {
      try {
        const selected = await open({
          multiple: false,
          filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
          defaultPath: this.lastOpenedDir || (await homeDir()),
        })

        if (selected && typeof selected === 'string') {
          const data = await readFile(selected)
          const blob = new Blob([data])
          this.loadImageFromFile(blob)

          const lastIndex = Math.max(selected.lastIndexOf('/'), selected.lastIndexOf('\\'))
          if (lastIndex !== -1) {
            const dir = selected.substring(0, lastIndex)
            this.lastOpenedDir = dir
            localStorage.setItem('lastOpenedDir', dir)
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Native file picker failed, falling back to standard input:', err)
        fileInput.click()
      }
    }

    openFileBtn.addEventListener('click', openAction)
    emptyOpenBtn.addEventListener('click', openAction)

    fileInput.addEventListener('change', () => {
      const files = fileInput.files
      if (files && files.length > 0) {
        this.loadImageFromFile(files[0])
      }
    })

    saveFileBtn.addEventListener('click', async () => {
      if (!this.baseImage.src) return

      // Create final flattened canvas
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = this.baseCanvas.width
      finalCanvas.height = this.baseCanvas.height
      const finalCtx = finalCanvas.getContext('2d') as CanvasRenderingContext2D

      // Draw base
      finalCtx.drawImage(this.baseCanvas, 0, 0)
      // Draw vector annotations on top
      this.drawAnnotationsOnCtx(finalCtx)

      // Convert to Data URL
      const dataUrl = finalCanvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      try {
        const path = await save({
          filters: [{ name: 'PNG Image', extensions: ['png'] }],
          defaultPath: this.lastOpenedDir || (await homeDir()),
        })

        if (path) {
          await writeFile(path, bytes)

          const lastIndex = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
          if (lastIndex !== -1) {
            const dir = path.substring(0, lastIndex)
            this.lastOpenedDir = dir
            localStorage.setItem('lastOpenedDir', dir)
          }

          this.showToast('Image saved successfully to ' + path, 'success')
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Save file failed:', err)
        // Web browser save fallback
        const link = document.createElement('a')
        link.download = 'annotated-image.png'
        link.href = dataUrl
        link.click()
      }
    })

    // Copy Flattened Canvas Image to System Clipboard
    copyBtn.addEventListener('click', async () => {
      if (!this.baseImage.src) return

      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = this.baseCanvas.width
      finalCanvas.height = this.baseCanvas.height
      const finalCtx = finalCanvas.getContext('2d') as CanvasRenderingContext2D

      finalCtx.drawImage(this.baseCanvas, 0, 0)
      this.drawAnnotationsOnCtx(finalCtx)

      // Convert canvas to binary bytes
      const dataUrl = finalCanvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      try {
        const tauriImage = await TauriImage.fromBytes(bytes)
        await writeImage(tauriImage)
        this.showToast('Image copied to clipboard!', 'success')
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Tauri clipboard write failed, trying fallback:', err)
        // Fallback to standard web browser Clipboard API
        finalCanvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
              this.showToast('Image copied to clipboard!', 'success')
            } catch (browserErr) {
              // eslint-disable-next-line no-console
              console.error('Clipboard fallback copy failed:', browserErr)
              this.showToast('Failed to copy image to clipboard.', 'error')
            }
          }
        }, 'image/png')
      }
    })

    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the canvas? All annotations and base image will be reset.')) {
        this.clearAll()
      }
    })
  }

  private undo(): void {
    const prevState = this.historyManager.undo()
    if (prevState) {
      this.loadHistoryState(prevState)
    }
  }

  private redo(): void {
    const nextState = this.historyManager.redo()
    if (nextState) {
      this.loadHistoryState(nextState)
    }
  }

  private clearAll(): void {
    this.baseImage = new Image()
    this.annotations = []
    this.historyManager.clear()
    this.selectionManager.selectShape(null, this.strokeWidth)
    this.cropManager.cancelCropMode()

    this.baseCanvas.width = 0
    this.baseCanvas.height = 0
    this.annCanvas.width = 0
    this.annCanvas.height = 0

    this.canvasWrapper.classList.add('hidden')
    this.emptyState.classList.remove('hidden')
    this.switchToTab('draw')

    this.statusSize.textContent = '0 x 0 px'
    this.updateHistoryButtons()
    void invoke('set_menu_enabled', { enabled: false })
  }

  // Resize Inputs Setup
  private setupResizePanel(): void {
    const rWidth = this.uiState.resizeWidth
    const rHeight = this.uiState.resizeHeight
    const lockBtn = this.uiState.lockAspectButton
    const applyBtn = this.uiState.resizeApplyButton

    lockBtn.addEventListener('click', () => {
      this.isAspectRatioLocked = !this.isAspectRatioLocked
      lockBtn.classList.toggle('active', this.isAspectRatioLocked)
    })

    rWidth.addEventListener('input', () => {
      if (this.isAspectRatioLocked && this.imageAspectRatio) {
        const val = parseInt(rWidth.value)
        if (!isNaN(val)) {
          rHeight.value = String(Math.round(val / this.imageAspectRatio))
        }
      }
    })

    rHeight.addEventListener('input', () => {
      if (this.isAspectRatioLocked && this.imageAspectRatio) {
        const val = parseInt(rHeight.value)
        if (!isNaN(val)) {
          rWidth.value = String(Math.round(val * this.imageAspectRatio))
        }
      }
    })

    applyBtn.addEventListener('click', () => {
      const newW = parseInt(rWidth.value)
      const newH = parseInt(rHeight.value)

      if (isNaN(newW) || isNaN(newH) || newW <= 0 || newH <= 0) {
        this.showToast('Please enter valid width and height values.', 'error')
        return
      }

      this.resizeImageCanvas(newW, newH)
    })
  }

  private resizeImageCanvas(newW: number, newH: number): void {
    const oldW = this.baseCanvas.width
    const oldH = this.baseCanvas.height
    if (oldW === 0 || oldH === 0) return

    // Scale annotations vector coordinates
    const scaleX = newW / oldW
    const scaleY = newH / oldH

    this.annotations.forEach((s) => {
      s.x = Math.round(s.x * scaleX)
      s.y = Math.round(s.y * scaleY)
      s.w = Math.round(s.w * scaleX)
      s.h = Math.round(s.h * scaleY)
      if (s instanceof TextShape) {
        s.fontSize = Math.round(s.fontSize * scaleX) // Adjust text font size
      }
    })

    // Redraw base image resized on a temporary canvas
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = newW
    tempCanvas.height = newH
    const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D
    tempCtx.drawImage(this.baseCanvas, 0, 0, newW, newH)

    // Set new canvas sizes
    this.baseCanvas.width = newW
    this.baseCanvas.height = newH
    this.annCanvas.width = newW
    this.annCanvas.height = newH

    // Paint base image back
    this.baseCtx.drawImage(tempCanvas, 0, 0)
    this.imageAspectRatio = newW / newH

    this.saveHistoryState()
    this.updateCanvasStyles()
    this.draw()
  }

  // Load image from File / Blob URL
  private loadImageFromFile(file: File | Blob): void {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string

      this.baseImage = new Image()
      this.baseImage.onload = () => {
        this.baseCanvas.width = this.baseImage.width
        this.baseCanvas.height = this.baseImage.height
        this.annCanvas.width = this.baseImage.width
        this.annCanvas.height = this.baseImage.height

        // Clear annotations
        this.annotations = []
        this.selectionManager.selectShape(null, this.strokeWidth)
        this.cropManager.cancelCropMode()

        // Update resize values
        const rWidth = this.uiState.resizeWidth
        const rHeight = this.uiState.resizeHeight
        rWidth.value = String(this.baseImage.width)
        rHeight.value = String(this.baseImage.height)
        this.imageAspectRatio = this.baseImage.width / this.baseImage.height

        // Show canvas elements
        this.emptyState.classList.add('hidden')
        this.canvasWrapper.classList.remove('hidden')

        // Initial fit to screen zoom
        this.fitToScreen()

        // Base canvas draw
        this.baseCtx.drawImage(this.baseImage, 0, 0)

        // Initialize first state in history
        this.historyManager.clear()
        this.saveHistoryState()

        this.draw()
        void invoke('set_menu_enabled', { enabled: true })
      }
      this.baseImage.src = src
    }
    reader.readAsDataURL(file)
  }

  // Set zoom factor, update canvas layout styles
  private setZoom(newScale: number): void {
    this.scale = Math.max(0.1, Math.min(newScale, 5.0)) // Cap between 10% and 500%
    this.zoomPercentText.textContent = Math.round(this.scale * 100) + '%'
    this.updateCanvasStyles()
  }

  private updateCanvasStyles(): void {
    if (this.baseCanvas.width === 0) return

    const w = this.baseCanvas.width * this.scale
    const h = this.baseCanvas.height * this.scale

    this.canvasWrapper.style.width = w + 'px'
    this.canvasWrapper.style.height = h + 'px'

    this.baseCanvas.style.width = w + 'px'
    this.baseCanvas.style.height = h + 'px'

    this.annCanvas.style.width = w + 'px'
    this.annCanvas.style.height = h + 'px'

    this.statusSize.textContent = `${this.baseCanvas.width} x ${this.baseCanvas.height} px`
  }

  private fitToScreen(): void {
    if (this.baseCanvas.width === 0) return

    const viewportW = this.viewport.clientWidth - 48 // padding margin
    const viewportH = this.viewport.clientHeight - 48

    const scaleX = viewportW / this.baseCanvas.width
    const scaleY = viewportH / this.baseCanvas.height

    // Fit scales down proportionally, but doesn't upscale small screenshots by default (keep at 100%)
    const newScale = Math.min(1.0, Math.min(scaleX, scaleY))
    this.setZoom(newScale)
  }

  // Helper: draw static vector shapes on any canvas context
  private drawAnnotationsOnCtx(ctx: CanvasRenderingContext2D): void {
    this.annotations.forEach((shape) => {
      if (shape.id === this.editingShapeId) return
      shape.draw(ctx, this.strokeWidth)
    })
  }

  // Master Draw Canvas Function
  public draw(): void {
    if (this.baseCanvas.width === 0) return

    // Base canvas holds base image
    this.baseCtx.clearRect(0, 0, this.baseCanvas.width, this.baseCanvas.height)
    this.baseCtx.drawImage(this.baseImage, 0, 0)

    // Clear Annotation context
    this.annCtx.clearRect(0, 0, this.annCanvas.width, this.annCanvas.height)

    // Draw static annotations
    this.drawAnnotationsOnCtx(this.annCtx)

    // Draw actively drawing preview shape
    if (this.isDrawing && this.activePreviewShape) {
      this.activePreviewShape.draw(this.annCtx, this.strokeWidth)
    }

    // Draw selection outline if in SELECT mode or editing a shape
    const activeSelectedId = this.selectionManager.selectedShapeId || this.editingShapeId
    if (activeSelectedId !== null) {
      const s = this.annotations.find((shape) => shape.id === activeSelectedId)
      if (s) {
        // Estimate bounds for text
        const x = s.x
        const y = s.y
        let w = s.w
        let h = s.h

        if (s instanceof TextShape) {
          w = this.getTextWidth(s.text || '', s.fontSize, s.isBold)
          h = s.fontSize * (s.text || '').split('\n').length * 1.25
        }

        this.annCtx.save()
        this.annCtx.strokeStyle = 'var(--accent-color)'
        this.annCtx.lineWidth = 1.5
        this.annCtx.setLineDash([5, 4])

        // Draw selection box outline
        this.annCtx.strokeRect(x - 4, y - 4, w + 8, h + 8)

        // Draw handles
        this.annCtx.fillStyle = 'var(--text-main)'
        this.annCtx.strokeStyle = 'var(--accent-color)'
        this.annCtx.setLineDash([])
        this.annCtx.lineWidth = 1.5

        const handles = [
          { x: x - 4, y: y - 4 }, // NW
          { x: x + w + 4, y: y - 4 }, // NE
          { x: x + w + 4, y: y + h + 4 }, // SE
          { x: x - 4, y: y + h + 4 }, // SW
        ]

        handles.forEach((pt) => {
          this.annCtx.fillRect(pt.x - 4, pt.y - 4, 8, 8)
          this.annCtx.strokeRect(pt.x - 4, pt.y - 4, 8, 8)
        })

        this.annCtx.restore()

        this.statusSelection.classList.remove('hidden')
      }
    } else {
      this.statusSelection.classList.add('hidden')
    }

    // Draw Crop Overlay inside Crop Mode
    if (this.cropManager.isCropMode && this.cropManager.cropRect) {
      const cropRect = this.cropManager.cropRect
      this.annCtx.save()
      // Dim the background area outside of the crop frame
      this.annCtx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      this.annCtx.beginPath()
      // Clockwise rectangle outer bounds
      this.annCtx.rect(0, 0, this.annCanvas.width, this.annCanvas.height)
      // Counter-clockwise cutout inner crop rectangle
      this.annCtx.rect(cropRect.x, cropRect.y + cropRect.h, cropRect.w, -cropRect.h)
      this.annCtx.fill()

      // Draw crop border
      this.annCtx.strokeStyle = 'var(--accent-color)'
      this.annCtx.lineWidth = 2
      this.annCtx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h)

      // Draw circular larger crop handles
      this.annCtx.fillStyle = '#3b82f6'
      this.annCtx.strokeStyle = '#ffffff'
      this.annCtx.lineWidth = 2

      const handles = [
        { x: cropRect.x, y: cropRect.y }, // NW
        { x: cropRect.x + cropRect.w, y: cropRect.y }, // NE
        { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h }, // SE
        { x: cropRect.x, y: cropRect.y + cropRect.h }, // SW
      ]

      handles.forEach((pt) => {
        this.annCtx.beginPath()
        this.annCtx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI)
        this.annCtx.fill()
        this.annCtx.stroke()
      })

      this.annCtx.restore()
    }
  }

  // Estimate text width in pixels
  public getTextWidth(text: string, size: number, bold: boolean): number {
    this.annCtx.save()
    this.annCtx.font = `${bold ? 'bold ' : ''}${size}px 'Plus Jakarta Sans', sans-serif`
    const lines = text.split('\n')
    let maxW = 0
    lines.forEach((line) => {
      const metrics = this.annCtx.measureText(line)
      if (metrics.width > maxW) maxW = metrics.width
    })
    this.annCtx.restore()
    return maxW || 30
  }

  // Get canvas pixel coordinates from screen mouse event
  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.annCanvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (this.annCanvas.width / rect.width)
    const y = (e.clientY - rect.top) * (this.annCanvas.height / rect.height)
    return { x: Math.round(x), y: Math.round(y) }
  }

  // Search shape clicked at coordinates
  public findShapeAt(x: number, y: number): Shape | null {
    for (let i = this.annotations.length - 1; i >= 0; i--) {
      const s = this.annotations[i]
      if (s.contains(x, y, (t, s, b) => this.getTextWidth(t, s, b))) {
        return s
      }
    }
    return null
  }

  // Mouse Canvas interaction loop
  private setupCanvasInteractions(): void {
    this.viewport.addEventListener('mousedown', (e: MouseEvent) => {
      // 1. Panning Space+Drag
      if (this.isSpacePressed) {
        this.isPanning = true
        this.viewport.classList.add('panning-active')
        this.panStartX = e.clientX
        this.panStartY = e.clientY
        this.panScrollLeft = this.viewport.scrollLeft
        this.panScrollTop = this.viewport.scrollTop
        return
      }

      if (this.baseCanvas.width === 0) return

      const { x, y } = this.getCanvasCoords(e)

      // 2. Crop Mode Interaction
      if (this.cropManager.isCropMode && this.cropManager.cropRect) {
        const cropRect = this.cropManager.cropRect
        const handle = getHandleAt(x, y, cropRect, 12)
        if (handle) {
          this.cropManager.cropDragHandle = handle
        } else {
          this.cropManager.cropDragHandle = 'move'
          this.drawStartX = x - cropRect.x
          this.drawStartY = y - cropRect.y
        }
        this.updateCropCursor(this.cropManager.cropDragHandle, true)
        return
      }

      if (this.activeTool === 'text') {
        e.preventDefault()
      }

      // 3. Delegate to Tool Manager
      const openEditor = document.querySelector('.text-editor-overlay')
      if (openEditor && e.target !== openEditor) {
        ;(openEditor as HTMLElement).blur()
      }

      this.toolManager.handleMouseDown(e, x, y)
    })

    this.viewport.addEventListener('mousemove', (e: MouseEvent) => {
      // 1. Pan viewport scroll delta
      if (this.isPanning) {
        const dx = e.clientX - this.panStartX
        const dy = e.clientY - this.panStartY
        this.viewport.scrollLeft = this.panScrollLeft - dx
        this.viewport.scrollTop = this.panScrollTop - dy
        return
      }

      if (this.baseCanvas.width === 0) return

      const { x, y } = this.getCanvasCoords(e)
      this.statusCoords.textContent = `x: ${x}, y: ${y}`

      // 2. Crop drag movement or hover cursor update
      if (this.cropManager.isCropMode && this.cropManager.cropRect) {
        const isOverCanvas = x >= 0 && x <= this.baseCanvas.width && y >= 0 && y <= this.baseCanvas.height
        if (this.cropManager.cropDragHandle) {
          this.updateCropCursor(this.cropManager.cropDragHandle, isOverCanvas)
          this.cropManager.updateCropRectCoords(
            x,
            y,
            this.drawStartX,
            this.drawStartY,
            this.baseCanvas.width,
            this.baseCanvas.height
          )
          this.draw()
          return
        } else {
          const handle = getHandleAt(x, y, this.cropManager.cropRect, 12)
          this.updateCropCursor(handle, isOverCanvas)
        }
      }

      // 3. Delegate to Tool Manager
      this.toolManager.handleMouseMove(e, x, y)
    })

    this.viewport.addEventListener('mouseup', (e: MouseEvent) => {
      if (this.isPanning) {
        this.isPanning = false
        this.viewport.classList.remove('panning-active')
        return
      }

      // 2. Commit crop action mouse release
      if (this.cropManager.isCropMode) {
        this.cropManager.cropDragHandle = null
        const { x, y } = this.getCanvasCoords(e)
        const isOverCanvas = x >= 0 && x <= this.baseCanvas.width && y >= 0 && y <= this.baseCanvas.height
        const handle = this.cropManager.cropRect ? getHandleAt(x, y, this.cropManager.cropRect, 12) : null
        this.updateCropCursor(handle, isOverCanvas)
        return
      }

      // 3. Delegate to Tool Manager
      const { x, y } = this.getCanvasCoords(e)
      this.toolManager.handleMouseUp(e, x, y)
    })

    this.viewport.addEventListener('mouseleave', () => {
      this.viewport.style.cursor = 'default'
    })

    this.viewport.addEventListener('dblclick', (e: MouseEvent) => {
      if (this.baseCanvas.width === 0) return
      const { x, y } = this.getCanvasCoords(e)
      const shape = this.findShapeAt(x, y)
      if (shape && shape instanceof TextShape) {
        this.editTextShape(shape)
      }
    })

    this.viewport.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        if (e.ctrlKey || e.altKey) {
          e.preventDefault()
          if (this.baseCanvas.width === 0) return

          const rect = this.viewport.getBoundingClientRect()
          const mouseX = e.clientX - rect.left
          const mouseY = e.clientY - rect.top

          const { x: canvasX, y: canvasY } = this.getCanvasCoords(e)

          const zoomFactor = 1.1
          let newScale = this.scale
          if (e.deltaY < 0) {
            newScale *= zoomFactor
          } else {
            newScale /= zoomFactor
          }

          this.setZoom(newScale)

          this.viewport.scrollLeft = canvasX * this.scale - mouseX
          this.viewport.scrollTop = canvasY * this.scale - mouseY
        }
      },
      { passive: false }
    )

    // Zoom Controls Events
    this.uiState.zoomInButton.addEventListener('click', () => {
      this.setZoom(this.scale + 0.1)
    })

    this.uiState.zoomOutButton.addEventListener('click', () => {
      this.setZoom(this.scale - 0.1)
    })

    this.uiState.zoomFitButton.addEventListener('click', () => {
      this.fitToScreen()
    })

    // Crop Panel Buttons
    this.uiState.cropApplyButton.addEventListener('click', () => this.applyCrop())
    this.uiState.cropCancelButton.addEventListener('click', () => this.cancelCropMode())
  }

  // ContentEditable Floating Text Box Editor
  public createTextEditorAt(x: number, y: number, clientX: number, clientY: number): void {
    void clientX
    void clientY

    // If editing already, blur
    const existing = document.querySelector('.text-editor-overlay')
    if (existing) return

    const textShape = ShapeFactory.fromJSON({
      id: crypto.randomUUID(),
      type: 'text',
      x: x,
      y: y,
      w: 120, // text is sized dynamically by getTextWidth
      h: this.fontSize,
      color: this.currentColor,
      fill: false,
      opacity: 100,
      fontSize: this.fontSize,
      isBold: this.isBold,
      text: '',
    }) as TextShape

    this.annotations.push(textShape)
    this.editTextShape(textShape)
  }

  /**
   * Starts on-canvas editing mode for a specific TextShape.
   * Creates a transparent contenteditable DOM overlay positioned precisely over the shape on screen.
   */
  public editTextShape(shape: TextShape): void {
    // If editing already, blur
    const existing = document.querySelector('.text-editor-overlay')
    if (existing) return

    this.editingShapeId = shape.id
    this.selectionManager.selectShape(shape, this.strokeWidth)
    this.draw()

    const editorDiv = document.createElement('div')
    editorDiv.className = 'text-editor-overlay'
    editorDiv.contentEditable = 'true'

    // Style match properties
    const rect = this.annCanvas.getBoundingClientRect()
    const screenX = rect.left + shape.x * this.scale
    const screenY = rect.top + shape.y * this.scale

    editorDiv.style.left = screenX + 'px'
    editorDiv.style.top = screenY + 'px'
    editorDiv.style.fontSize = shape.fontSize * this.scale + 'px'
    editorDiv.style.color = shape.color
    editorDiv.style.fontFamily = `'Plus Jakarta Sans', sans-serif`
    editorDiv.style.fontWeight = shape.isBold ? 'bold' : 'normal'
    editorDiv.innerText = shape.text || ''

    document.body.appendChild(editorDiv)
    editorDiv.focus()

    // Place cursor at the end of the text
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(editorDiv)
    range.collapse(false)
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }

    // Prevent space trigger panning in text input and handle custom commit/cancel keys
    editorDiv.addEventListener('keydown', (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        editorDiv.blur()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        editorDiv.innerText = ''
        editorDiv.blur()
      }
    })

    editorDiv.addEventListener('input', () => {
      const txt = editorDiv.innerText
      shape.text = txt
      shape.w = this.getTextWidth(txt || ' ', shape.fontSize, shape.isBold)
      shape.h = shape.fontSize * (txt || ' ').split('\n').length * 1.25
      this.draw()
    })

    const commitText = () => {
      const txtValue = editorDiv.innerText.trim()
      if (!txtValue) {
        // If empty, remove the shape
        this.annotations = this.annotations.filter((s) => s.id !== shape.id)
        this.selectionManager.selectShape(null, this.strokeWidth)
      } else {
        this.saveHistoryState()
      }

      this.editingShapeId = null
      editorDiv.remove()
      this.draw()
    }

    editorDiv.addEventListener('blur', commitText)
  }

  // Crop Actions
  public enterCropMode(): void {
    if (this.baseCanvas.width === 0) return

    this.cropManager.enterCropMode(this.baseCanvas.width, this.baseCanvas.height)
    this.selectionManager.selectShape(null, this.strokeWidth)

    // Highlight the aspect ratio buttons default selection (Free)
    const freeBtn = document.querySelector('.aspect-btn[data-ratio="free"]') as HTMLButtonElement | null
    if (freeBtn) {
      this.setCropRatio('free', freeBtn)
    }

    this.draw()
  }

  public cancelCropMode(): void {
    this.cropManager.cancelCropMode()
    this.draw()
    this.switchToTab('draw')
  }

  public applyCrop(): void {
    const cropRect = this.cropManager.cropRect
    if (!cropRect) return

    const cx = cropRect.x
    const cy = cropRect.y
    const cw = cropRect.w
    const ch = cropRect.h

    if (cw <= 10 || ch <= 10) {
      this.showToast('Crop area is too small!', 'error')
      return
    }

    // Adjust existing annotations coordinates relative to new top-left corner
    this.annotations.forEach((s) => {
      s.x -= cx
      s.y -= cy
    })

    // Copy cropped image content
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = cw
    tempCanvas.height = ch
    const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D

    tempCtx.drawImage(this.baseCanvas, cx, cy, cw, ch, 0, 0, cw, ch)

    // Resize base image
    this.baseCanvas.width = cw
    this.baseCanvas.height = ch
    this.annCanvas.width = cw
    this.annCanvas.height = ch

    // Update state base image source
    this.baseImage = new Image()
    this.baseImage.onload = () => {
      this.baseCtx.drawImage(this.baseImage, 0, 0)

      // Clear crop settings
      this.cropManager.cancelCropMode()

      // Update aspect ratios and form input values
      this.imageAspectRatio = cw / ch
      const rWidth = this.uiState.resizeWidth
      const rHeight = this.uiState.resizeHeight
      rWidth.value = String(cw)
      rHeight.value = String(ch)

      // Resize view layout and update history
      this.updateCanvasStyles()
      this.saveHistoryState()
      this.draw()

      this.switchToTab('draw')
    }
    this.baseImage.src = tempCanvas.toDataURL('image/png')
  }

  public setCropRatio(ratioType: string, btn: HTMLButtonElement): void {
    // 1. Remove active class from all aspect ratio buttons
    document.querySelectorAll('.aspect-btn').forEach((b) => b.classList.remove('active'))
    // 2. Add active class to clicked button
    btn.classList.add('active')

    // 3. Determine numerical ratio
    let ratio: 'free' | 'original' | number = 'free'
    if (ratioType === 'free') {
      ratio = 'free'
    } else if (ratioType === 'original') {
      ratio = 'original'
    } else if (ratioType === 'square') {
      ratio = 1.0
    } else {
      const parts = ratioType.split('-')
      if (parts.length === 2) {
        const rw = parseFloat(parts[0])
        const rh = parseFloat(parts[1])
        if (!isNaN(rw) && !isNaN(rh) && rh > 0) {
          ratio = rw / rh
        }
      }
    }

    // 4. Update CropManager ratio
    this.cropManager.cropRatio = ratio

    // 5. Update CropManager's cropRect to match the new ratio centered on image
    const boundsW = this.baseCanvas.width
    const boundsH = this.baseCanvas.height

    let targetRatio: number
    if (ratio === 'free') {
      if (!this.cropManager.cropRect) {
        this.cropManager.cropRect = {
          x: Math.round(boundsW * 0.1),
          y: Math.round(boundsH * 0.1),
          w: Math.round(boundsW * 0.8),
          h: Math.round(boundsH * 0.8),
        }
      }
      this.draw()
      return
    } else if (ratio === 'original') {
      targetRatio = boundsW / boundsH
    } else {
      targetRatio = ratio
    }

    // Centered crop box calculation
    let cropW: number
    let cropH: number
    if (boundsW / boundsH > targetRatio) {
      cropH = Math.round(boundsH * 0.8)
      cropW = Math.round(cropH * targetRatio)
    } else {
      cropW = Math.round(boundsW * 0.8)
      cropH = Math.round(cropW / targetRatio)
    }

    const cropX = Math.round((boundsW - cropW) / 2)
    const cropY = Math.round((boundsH - cropH) / 2)

    this.cropManager.cropRect = {
      x: cropX,
      y: cropY,
      w: cropW,
      h: cropH,
    }

    this.draw()
  }

  private updateCropCursor(handle: string | null, isOverCanvas: boolean): void {
    if (!isOverCanvas) {
      this.viewport.style.cursor = 'default'
      return
    }

    let cursor: string
    if (handle === 'nw' || handle === 'se') {
      cursor = 'nwse-resize'
    } else if (handle === 'ne' || handle === 'sw') {
      cursor = 'nesw-resize'
    } else if (handle === 'n' || handle === 's') {
      cursor = 'ns-resize'
    } else if (handle === 'e' || handle === 'w') {
      cursor = 'ew-resize'
    } else if (handle === 'move') {
      cursor = 'move'
    } else {
      cursor = 'move'
    }
    this.viewport.style.cursor = cursor
  }

  private setupAspectButtons(): void {
    const buttons = document.querySelectorAll('.aspect-btn')
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const currentBtn = e.currentTarget as HTMLButtonElement
        const ratioType = currentBtn.getAttribute('data-ratio')
        if (ratioType) {
          this.setCropRatio(ratioType, currentBtn)
        }
      })
    })
  }

  /**
   * Attempts to read and load image data from the Tauri clipboard plugin.
   * Converts the raw RGBA buffer into a Blob to load.
   */
  private async pasteImageFromTauri(): Promise<void> {
    try {
      const clipboardImage = await readImage()
      if (clipboardImage) {
        const size = await clipboardImage.size()
        const rgba = await clipboardImage.rgba()

        const canvas = document.createElement('canvas')
        canvas.width = size.width
        canvas.height = size.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const imgData = ctx.createImageData(size.width, size.height)
          imgData.data.set(rgba)
          ctx.putImageData(imgData, 0, 0)

          canvas.toBlob((blob) => {
            if (blob) {
              this.loadImageFromFile(blob)
            }
          }, 'image/png')
        }
        await clipboardImage.close()
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to paste image from Tauri clipboard:', err)
    }
  }

  /**
   * Shows a temporary toast message on the screen.
   * @param message The text message to display.
   * @param type The type of toast: 'success', 'info', or 'error'. Defaults to 'info'.
   */
  private showToast(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
    let container = document.querySelector('.toast-container')
    if (!container) {
      container = document.createElement('div')
      container.className = 'toast-container'
      document.body.appendChild(container)
    }

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    container.appendChild(toast)

    // Trigger transition
    requestAnimationFrame(() => {
      toast.classList.add('show')
    })

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show')
      toast.addEventListener('transitionend', () => {
        toast.remove()
        if (container && container.childNodes.length === 0) {
          container.remove()
        }
      })
    }, 3000)
  }
}
