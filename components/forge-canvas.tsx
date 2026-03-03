"use client"

import { useRef, useEffect, useCallback } from "react"
import { Stage, Layer, Rect, Text, Group, Shape, Image } from "react-konva"
import { useCanvasStore } from "@/lib/store"
import { Node, getNodesInRenderOrder, LightingProps, isTextNode, isShapeNode, isImageNode, isFrameNode } from "@/lib/document"
import { KonvaEventObject } from "konva/lib/Node"
import useImage from "use-image"

// Lighting overlay using Konva Shape (not DOM canvas)
function LightingOverlay({ 
  width, 
  height, 
  lighting 
}: { 
  width: number
  height: number
  lighting: LightingProps 
}) {
  const drawLighting = useCallback((context: any, shape: any) => {
    const ctx = context._context
    
    ctx.clearRect(0, 0, width, height)

    const angleRad = (lighting.directionalAngle * Math.PI) / 180
    const shadowX = Math.cos(angleRad) * lighting.elevation
    const shadowY = Math.sin(angleRad) * lighting.elevation

    // Ambient gradient
    const ambientGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    )
    ambientGradient.addColorStop(0, `rgba(255, 255, 255, ${lighting.ambientIntensity})`)
    ambientGradient.addColorStop(1, `rgba(0, 0, 0, ${1 - lighting.ambientIntensity})`)

    ctx.fillStyle = ambientGradient
    ctx.fillRect(0, 0, width, height)

    // Shadow layer
    ctx.save()
    ctx.globalCompositeOperation = "multiply"
    
    const shadowGradient = ctx.createLinearGradient(
      width / 2 - shadowX * 10,
      height / 2 - shadowY * 10,
      width / 2 + shadowX * 10,
      height / 2 + shadowY * 10
    )
    shadowGradient.addColorStop(0, `rgba(0, 0, 0, ${lighting.shadowSoftness})`)
    shadowGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)")
    shadowGradient.addColorStop(1, `rgba(255, 255, 255, ${lighting.rimLightIntensity * 0.3})`)

    ctx.fillStyle = shadowGradient
    ctx.fillRect(0, 0, width, height)
    ctx.restore()

    context.fillStrokeShape(shape)
  }, [width, height, lighting])

  return (
    <Shape
      width={width}
      height={height}
      sceneFunc={drawLighting}
      opacity={0.8}
    />
  )
}

// Render individual node with strict type handling
function CanvasNode({ 
  node, 
  isSelected,
  onSelect 
}: { 
  node: Node
  isSelected: boolean
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void
}) {
  const { updateNode } = useCanvasStore()

  const handleDragEnd = (e: KonvaEventObject<DragEvent | TouchEvent>) => {
    updateNode(node.id, {
      position: { x: e.target.x(), y: e.target.y() }
    })
  }

  const commonProps = {
    x: node.position.x,
    y: node.position.y,
    width: node.size.width,
    height: node.size.height,
    rotation: node.rotation,
    opacity: node.opacity,
    draggable: !node.locked,
    onDragEnd: handleDragEnd,
    onClick: onSelect,
    onTap: onSelect,
  }

  // Text node
  if (isTextNode(node)) {
    return (
      <Text
        key={node.id}
        {...commonProps}
        text={node.text}
        fontSize={node.fontSize}
        fontFamily={node.fontFamily}
        fontWeight={node.fontWeight}
        fill={node.color || "#000000"}
        width={node.size.width}
        height={node.size.height}
        align={node.textAlign || "left"}
      />
    )
  }

  // Shape node
  if (isShapeNode(node)) {
    if (node.shapeType === "circle") {
      return (
        <Group key={node.id}>
          <Shape
            {...commonProps}
            sceneFunc={(context, shape) => {
              context.beginPath()
              context.ellipse(
                node.size.width / 2,
                node.size.height / 2,
                node.size.width / 2,
                node.size.height / 2,
                0, 0, 2 * Math.PI
              )
              context.fillStrokeShape(shape)
            }}
            fill={node.fill}
            stroke={isSelected ? "#3b82f6" : node.stroke}
            strokeWidth={isSelected ? 2 : node.strokeWidth || 0}
          />
          {node.lighting && (
            <LightingOverlay
              width={node.size.width}
              height={node.size.height}
              lighting={node.lighting}
            />
          )}
        </Group>
      )
    }
    
    return (
      <Group key={node.id}>
        <Rect
          {...commonProps}
          fill={node.fill}
          stroke={isSelected ? "#3b82f6" : node.stroke}
          strokeWidth={isSelected ? 2 : node.strokeWidth || 0}
          cornerRadius={node.cornerRadius || 0}
        />
        {node.lighting && (
          <LightingOverlay
            width={node.size.width}
            height={node.size.height}
            lighting={node.lighting}
          />
        )}
      </Group>
    )
  }

  // Image node
  if (isImageNode(node)) {
    const [image] = useImage(node.src)
    return (
      <Image
        key={node.id}
        {...commonProps}
        image={image}
        alt={node.alt || ""}
      />
    )
  }

  // Frame node
  if (isFrameNode(node)) {
    return (
      <Group key={node.id}>
        <Rect
          {...commonProps}
          fill={node.fill || "transparent"}
          stroke={isSelected ? "#3b82f6" : node.stroke || "#e5e5e5"}
          strokeWidth={isSelected ? 2 : node.strokeWidth || 1}
          cornerRadius={node.cornerRadius || 0}
          dash={[5, 5]}
        />
        {node.lighting && (
          <LightingOverlay
            width={node.size.width}
            height={node.size.height}
            lighting={node.lighting}
          />
        )}
      </Group>
    )
  }

  return null
}

// Main Canvas Component
export function ForgeCanvas() {
  const { 
    present, 
    selectedNodeIds, 
    zoom, 
    pan,
    selectNode,
    clearSelection,
    undo,
    redo
  } = useCanvasStore()

  const stageRef = useRef<any>(null)

  const nodes = getNodesInRenderOrder(present)

  const handleStageClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      clearSelection()
    }
  }

  const handleWheel = (e: KonvaEventObject<WheelEvent | TouchEvent>) => {
    e.evt.preventDefault()
  }

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  return (
    <div className="relative w-full h-full bg-zinc-50 overflow-hidden">
      <Stage
        ref={stageRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1200}
        height={typeof window !== "undefined" ? window.innerHeight : 800}
        scale={{ x: zoom, y: zoom }}
        position={{ x: pan.x, y: pan.y }}
        onClick={handleStageClick}
        onWheel={handleWheel}
        className="bg-zinc-50"
      >
        <Layer>
          {/* Grid background */}
          <Shape
            sceneFunc={(context, shape) => {
              const width = window.innerWidth
              const height = window.innerHeight
              const gridSize = 20
              
              context.beginPath()
              for (let x = 0; x < width; x += gridSize) {
                context.moveTo(x, 0)
                context.lineTo(x, height)
              }
              for (let y = 0; y < height; y += gridSize) {
                context.moveTo(0, y)
                context.lineTo(width, y)
              }
              context.strokeStyle = "#e4e4e7"
              context.lineWidth = 1
              context.stroke()
              
              context.fillStrokeShape(shape)
            }}
          />

          {/* Render all nodes in hierarchical order */}
          {nodes.map(node => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.includes(node.id)}
              onSelect={(e) => {
                e.cancelBubble = true
                selectNode(node.id, (e.evt as MouseEvent).shiftKey)
              }}
            />
          ))}
        </Layer>
      </Stage>

      {/* Zoom/Pan indicator */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded shadow text-sm text-zinc-600">
        {Math.round(zoom * 100)}% | ({Math.round(pan.x)}, {Math.round(pan.y)})
      </div>

      {/* Node count */}
      <div className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded shadow text-sm text-zinc-600">
        {nodes.length} nodes | {selectedNodeIds.length} selected
      </div>

      {/* Undo/Redo hint */}
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow text-xs text-zinc-500">
        Cmd/Ctrl+Z: Undo | Cmd/Ctrl+Shift+Z: Redo
      </div>
    </div>
  )
}