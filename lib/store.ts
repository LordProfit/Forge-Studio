"use client"

import { create } from "zustand"
import { 
  Document, 
  Node, 
  createDocument, 
  addNode, 
  updateNode, 
  deleteNode,
  createTextNode,
  createShapeNode,
  createImageNode,
  createFrameNode,
  Position, 
  Size 
} from "./document"

interface CanvasState {
  // Undo/Redo stacks
  past: Document[]
  present: Document
  future: Document[]
  
  // Selection
  selectedNodeIds: string[]
  
  // Viewport
  zoom: number
  pan: Position
  
  // Actions
  setDocument: (doc: Document) => void
  
  // History management
  pushHistory: (doc: Document) => void
  undo: () => void
  redo: () => void
  // AI mutation application - integrates with undo stack
  applyAIMutation: (mutation: { type: string; [key: string]: any }) => void
  
  // Node operations (with history)
  addTextNode: (position: Position, size: Size, text: string, parentId?: string | null) => void
  addShapeNode: (position: Position, size: Size, shapeType?: "rect" | "circle" | "polygon", parentId?: string | null) => void
  addImageNode: (position: Position, size: Size, src: string, parentId?: string | null) => void
  addFrameNode: (position: Position, size: Size, parentId?: string | null) => void
  updateNode: (nodeId: string, updates: Partial<Node>) => void
  deleteNode: (nodeId: string) => void
  
  // Selection
  selectNode: (nodeId: string, multi?: boolean) => void
  deselectNode: (nodeId: string) => void
  clearSelection: () => void
  
  // Viewport
  setZoom: (zoom: number) => void
  setPan: (pan: Position) => void
  zoomIn: () => void
  zoomOut: () => void
  resetViewport: () => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state with undo/redo stacks
  past: [],
  present: createDocument("default-workspace"),
  future: [],
  selectedNodeIds: [],
  zoom: 1,
  pan: { x: 0, y: 0 },

  setDocument: (doc) => set({ present: doc }),
  
  // History management
  pushHistory: (newDoc) => {
    const { past, present } = get()
    set({
      past: [...past, present],
      present: newDoc,
      future: []
    })
  },
  
  undo: () => {
    const { past, present, future } = get()
    if (past.length === 0) return
    
    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)
    
    set({
      past: newPast,
      present: previous,
      future: [present, ...future]
    })
  },
  
  redo: () => {
    const { past, present, future } = get()
    if (future.length === 0) return
    
    const next = future[0]
    const newFuture = future.slice(1)
    
    set({
      past: [...past, present],
      present: next,
      future: newFuture
    })
  },

  // AI mutation application - integrates with undo stack
  applyAIMutation: (mutation) => {
    const { present, pushHistory } = get()
    let newDoc = present

    switch (mutation.type) {
      case "addNode":
        newDoc = addNode(present, mutation.node)
        break
      case "updateNode":
        newDoc = updateNode(present, mutation.nodeId, mutation.updates)
        break
      case "deleteNode":
        newDoc = deleteNode(present, mutation.nodeId)
        break
      default:
        console.warn("Unknown mutation type:", mutation.type)
        return
    }

    pushHistory(newDoc)
  },

  // Node operations with history
  addTextNode: (position, size, text, parentId = null) => {
    const { present, pushHistory } = get()
    const node = createTextNode(position, size, text, parentId)
    const newDoc = addNode(present, node)
    pushHistory(newDoc)
  },
  
  addShapeNode: (position, size, shapeType = "rect", parentId = null) => {
    const { present, pushHistory } = get()
    const node = createShapeNode(position, size, shapeType, parentId)
    const newDoc = addNode(present, node)
    pushHistory(newDoc)
  },
  
  addImageNode: (position, size, src, parentId = null) => {
    const { present, pushHistory } = get()
    const node = createImageNode(position, size, src, parentId)
    const newDoc = addNode(present, node)
    pushHistory(newDoc)
  },
  
  addFrameNode: (position, size, parentId = null) => {
    const { present, pushHistory } = get()
    const node = createFrameNode(position, size, parentId)
    const newDoc = addNode(present, node)
    pushHistory(newDoc)
  },

  updateNode: (nodeId, updates) => {
    const { present, pushHistory } = get()
    const newDoc = updateNode(present, nodeId, updates)
    pushHistory(newDoc)
  },

  deleteNode: (nodeId) => {
    const { present, selectedNodeIds, pushHistory } = get()
    const newDoc = deleteNode(present, nodeId)
    pushHistory(newDoc)
    set({ selectedNodeIds: selectedNodeIds.filter(id => id !== nodeId) })
  },

  // Selection
  selectNode: (nodeId, multi = false) => {
    const { selectedNodeIds } = get()
    if (multi) {
      set({ 
        selectedNodeIds: selectedNodeIds.includes(nodeId)
          ? selectedNodeIds.filter(id => id !== nodeId)
          : [...selectedNodeIds, nodeId]
      })
    } else {
      set({ selectedNodeIds: [nodeId] })
    }
  },

  deselectNode: (nodeId) => {
    const { selectedNodeIds } = get()
    set({ selectedNodeIds: selectedNodeIds.filter(id => id !== nodeId) })
  },

  clearSelection: () => set({ selectedNodeIds: [] }),

  // Viewport
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  
  setPan: (pan) => set({ pan }),
  
  zoomIn: () => {
    const { zoom } = get()
    set({ zoom: Math.min(5, zoom * 1.2) })
  },
  
  zoomOut: () => {
    const { zoom } = get()
    set({ zoom: Math.max(0.1, zoom / 1.2) })
  },
  
  resetViewport: () => set({ zoom: 1, pan: { x: 0, y: 0 } })
}))