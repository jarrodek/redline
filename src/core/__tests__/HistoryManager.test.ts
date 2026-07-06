import { describe, it, expect } from 'vitest'
import { HistoryManager } from '../HistoryManager'
import { HistoryState } from '../../types'

const createState = (id: string): HistoryState => ({
  baseImageSrc: `src_${id}`,
  annotations: `annotations_${id}`,
  imageWidth: 100,
  imageHeight: 100,
})

describe('HistoryManager', () => {
  it('should initialize with empty stack and correct flags', () => {
    const manager = new HistoryManager()
    expect(manager.canUndo).toBe(false)
    expect(manager.canRedo).toBe(false)
  })

  it('should allow pushing states and updating flags', () => {
    const manager = new HistoryManager()
    const state1 = createState('1')
    const state2 = createState('2')

    manager.pushState(state1)
    // 1st state pushed is the initial state, cannot undo yet
    expect(manager.canUndo).toBe(false)

    manager.pushState(state2)
    expect(manager.canUndo).toBe(true)
    expect(manager.canRedo).toBe(false)
  })

  it('should undo to previous state and enable redo', () => {
    const manager = new HistoryManager()
    const state1 = createState('1')
    const state2 = createState('2')

    manager.pushState(state1)
    manager.pushState(state2)

    const prev = manager.undo()
    expect(prev).toEqual(state1)
    expect(manager.canUndo).toBe(false)
    expect(manager.canRedo).toBe(true)
  })

  it('should redo to next state and update flags', () => {
    const manager = new HistoryManager()
    const state1 = createState('1')
    const state2 = createState('2')

    manager.pushState(state1)
    manager.pushState(state2)
    manager.undo()

    const next = manager.redo()
    expect(next).toEqual(state2)
    expect(manager.canUndo).toBe(true)
    expect(manager.canRedo).toBe(false)
  })

  it('should clear redo stack when pushing a new state after undo', () => {
    const manager = new HistoryManager()
    const state1 = createState('1')
    const state2 = createState('2')
    const state3 = createState('3')

    manager.pushState(state1)
    manager.pushState(state2)
    manager.undo() // now can redo state2

    expect(manager.canRedo).toBe(true)
    manager.pushState(state3)
    expect(manager.canRedo).toBe(false)
  })

  it('should cap history at maxStates', () => {
    const manager = new HistoryManager(3)
    const s1 = createState('1')
    const s2 = createState('2')
    const s3 = createState('3')
    const s4 = createState('4')

    manager.pushState(s1)
    manager.pushState(s2)
    manager.pushState(s3)
    manager.pushState(s4) // s1 should be discarded

    // We can undo 2 times (to s3, then s2)
    const u1 = manager.undo()
    expect(u1).toEqual(s3)
    const u2 = manager.undo()
    expect(u2).toEqual(s2)

    // Attempting another undo should return null because s1 was discarded
    const u3 = manager.undo()
    expect(u3).toBeNull()
  })
})
