// Interface for shape annotations
export interface AnnotationShape {
  id: string
  type: 'rect' | 'circle' | 'text'
  x: number
  y: number
  w: number
  h: number
  color: string
  fill: boolean
  opacity: number // For marker highlight (10 to 90)
  fontSize: number // For text shapes
  isBold: boolean // For text shapes
  text?: string // For text shapes
  strokeWidth?: number // For outlined shapes
  borderRadius?: number // Border radius / roundness of rect shapes
}

// Interface for Undo/Redo stack history states
export interface HistoryState {
  baseImageSrc: string // Data URL of the cropped/resized base image
  annotations: string // JSON stringified AnnotationShape[] (deep copy)
  imageWidth: number
  imageHeight: number
}
