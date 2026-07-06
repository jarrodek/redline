import { HistoryState } from '../types.js'

export class HistoryManager {
  private undoStack: HistoryState[] = []
  private redoStack: HistoryState[] = []

  constructor(private readonly maxStates = 50) {}

  public pushState(state: HistoryState): void {
    // Save state
    this.undoStack.push(state)
    if (this.undoStack.length > this.maxStates) {
      this.undoStack.shift()
    }
    this.redoStack = [] // Clear redo stack on new action
  }

  public undo(): HistoryState | null {
    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop()
      if (currentState) {
        this.redoStack.push(currentState)
      }

      return this.undoStack[this.undoStack.length - 1]
    }
    return null
  }

  public redo(): HistoryState | null {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop()
      if (nextState) {
        this.undoStack.push(nextState)
      }
      return nextState || null
    }
    return null
  }

  public clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  public get canUndo(): boolean {
    return this.undoStack.length > 1
  }

  public get canRedo(): boolean {
    return this.redoStack.length > 0
  }
}
