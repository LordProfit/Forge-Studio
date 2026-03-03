// Document Model - Figma-style structured nodes with strict typing
// Core types for Forge Studio canvas

export type NodeType = "frame" | "text" | "shape" | "image"

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface LightingProps {
  elevation: number
  ambientIntensity: number
  directionalAngle: number
  shadowSoftness: number
  rimLightIntensity: number
  gradientFalloff: number
}

// Base node - only common fields
interface BaseNode {
  id: string
  type: NodeType
  parentId: string | null
  position: Position
  size: Size
  rotation: number
  opacity: number
  blendMode: string
  zIndex: number
  locked?: boolean
  visible?: boolean
  name?: string
  lighting?: LightingProps
}

// Strict node types - no overlapping fields
export interface TextNode extends BaseNode {
  type: "text"
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: "left" | "center" | "right"
  color?: string
}

export interface ShapeNode extends BaseNode {
  type: "shape"
  shapeType: "rect" | "circle" | "polygon"
  fill: string
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
}

export interface ImageNode extends BaseNode {
  type: "image"
  src: string
  alt?: string
  objectFit?: "cover" | "contain" | "fill"
}

export interface FrameNode extends BaseNode {
  type: "frame"
  fill?: string
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
  clipContent?: boolean
}

// Discriminated union
export type Node = TextNode | ShapeNode | ImageNode | FrameNode

// Type guards
export function isTextNode(node: Node): node is TextNode {
  return node.type === "text"
}

export function isShapeNode(node: Node): node is ShapeNode {
  return node.type === "shape"
}

export function isImageNode(node: Node): node is ImageNode {
  return node.type === "image"
}

export function isFrameNode(node: Node): node is FrameNode {
  return node.type === "frame"
}

export interface Document {
  id: string
  workspaceId: string
  version: number
  nodes: Record<string, Node>
  rootIds: string[]
  createdAt: string
  updatedAt: string
}

// Lighting presets for cinematic effects
export const LightingPresets = {
  dramatic: {
    elevation: 12,
    ambientIntensity: 0.3,
    directionalAngle: 45,
    shadowSoftness: 0.6,
    rimLightIntensity: 0.8,
    gradientFalloff: 0.4
  },
  soft: {
    elevation: 4,
    ambientIntensity: 0.7,
    directionalAngle: 90,
    shadowSoftness: 0.9,
    rimLightIntensity: 0.2,
    gradientFalloff: 0.8
  },
  noir: {
    elevation: 20,
    ambientIntensity: 0.15,
    directionalAngle: 30,
    shadowSoftness: 0.3,
    rimLightIntensity: 0.9,
    gradientFalloff: 0.2
  },
  flat: {
    elevation: 0,
    ambientIntensity: 1,
    directionalAngle: 0,
    shadowSoftness: 1,
    rimLightIntensity: 0,
    gradientFalloff: 1
  }
} as const

// Factory functions for each node type
export function createTextNode(
  position: Position,
  size: Size,
  text: string,
  parentId: string | null = null
): TextNode {
  return {
    id: crypto.randomUUID(),
    type: "text",
    parentId,
    position,
    size,
    rotation: 0,
    opacity: 1,
    blendMode: "normal",
    zIndex: 0,
    visible: true,
    locked: false,
    text,
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "normal"
  }
}

export function createShapeNode(
  position: Position,
  size: Size,
  shapeType: ShapeNode["shapeType"] = "rect",
  parentId: string | null = null
): ShapeNode {
  return {
    id: crypto.randomUUID(),
    type: "shape",
    parentId,
    position,
    size,
    rotation: 0,
    opacity: 1,
    blendMode: "normal",
    zIndex: 0,
    visible: true,
    locked: false,
    shapeType,
    fill: "#ffffff"
  }
}

export function createImageNode(
  position: Position,
  size: Size,
  src: string,
  parentId: string | null = null
): ImageNode {
  return {
    id: crypto.randomUUID(),
    type: "image",
    parentId,
    position,
    size,
    rotation: 0,
    opacity: 1,
    blendMode: "normal",
    zIndex: 0,
    visible: true,
    locked: false,
    src
  }
}

export function createFrameNode(
  position: Position,
  size: Size,
  parentId: string | null = null
): FrameNode {
  return {
    id: crypto.randomUUID(),
    type: "frame",
    parentId,
    position,
    size,
    rotation: 0,
    opacity: 1,
    blendMode: "normal",
    zIndex: 0,
    visible: true,
    locked: false,
    clipContent: false
  }
}

export function createDocument(workspaceId: string): Document {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    workspaceId,
    version: 1,
    nodes: {},
    rootIds: [],
    createdAt: now,
    updatedAt: now
  }
}

// Pure mutation functions
export function addNode(doc: Document, node: Node): Document {
  return {
    ...doc,
    version: doc.version + 1,
    nodes: { ...doc.nodes, [node.id]: node },
    rootIds: node.parentId === null 
      ? [...doc.rootIds, node.id]
      : doc.rootIds,
    updatedAt: new Date().toISOString()
  }
}

export function updateNode(
  doc: Document, 
  nodeId: string, 
  updates: Partial<Node>
): Document {
  const node = doc.nodes[nodeId]
  if (!node) return doc
  
  return {
    ...doc,
    version: doc.version + 1,
    nodes: {
      ...doc.nodes,
      [nodeId]: { ...node, ...updates } as Node
    },
    updatedAt: new Date().toISOString()
  }
}

// Get all descendant IDs recursively
function getDescendantIds(doc: Document, parentId: string): string[] {
  const children = Object.values(doc.nodes).filter(n => n.parentId === parentId)
  let ids = children.map(c => c.id)
  
  for (const child of children) {
    ids = [...ids, ...getDescendantIds(doc, child.id)]
  }
  
  return ids
}

// Delete node and all its children recursively
export function deleteNode(doc: Document, nodeId: string): Document {
  // Get all descendants to delete
  const descendantIds = getDescendantIds(doc, nodeId)
  const allIdsToDelete = new Set([nodeId, ...descendantIds])
  
  // Filter out all deleted nodes
  const remainingNodes: Record<string, Node> = {}
  for (const [id, node] of Object.entries(doc.nodes)) {
    if (!allIdsToDelete.has(id)) {
      remainingNodes[id] = node
    }
  }
  
  return {
    ...doc,
    version: doc.version + 1,
    nodes: remainingNodes,
    rootIds: doc.rootIds.filter(id => !allIdsToDelete.has(id)),
    updatedAt: new Date().toISOString()
  }
}

// Hierarchical render ordering
export function renderNodeTree(
  doc: Document, 
  parentId: string | null = null
): Node[] {
  const children = Object.values(doc.nodes)
    .filter(n => n.parentId === parentId)
    .sort((a, b) => a.zIndex - b.zIndex)
  
  const result: Node[] = []
  
  for (const child of children) {
    result.push(child)
    const grandchildren = renderNodeTree(doc, child.id)
    result.push(...grandchildren)
  }
  
  return result
}

export function getNodesInRenderOrder(doc: Document): Node[] {
  return renderNodeTree(doc, null)
}

export function getChildren(doc: Document, parentId: string): Node[] {
  return Object.values(doc.nodes)
    .filter(node => node.parentId === parentId)
    .sort((a, b) => a.zIndex - b.zIndex)
}

// Apply lighting preset
export function applyLightingPreset<N extends Node>(
  node: N, 
  preset: keyof typeof LightingPresets
): N {
  return {
    ...node,
    lighting: { ...LightingPresets[preset] }
  }
}