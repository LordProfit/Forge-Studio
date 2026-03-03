"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Stage, Layer, Rect, Text, Group, Shape, Image } from "react-konva"
import { useCanvasStore } from "@/lib/store"
import { Node, getNodesInRenderOrder, LightingProps, isTextNode, isShapeNode, isImageNode, isFrameNode } from "@/lib/document"
import { KonvaEventObject } from "konva/lib/Node"
import useImage from "use-image"

// Lighting overlay using Konva Shape
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

    const ambientGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    )
    ambientGradient.addColorStop(0, `rgba(255, 255, 255, ${lighting.ambientIntensity})`)
    ambientGradient.addColorStop(1, `rgba(0, 0, 0, ${1 - lighting.ambientIntensity})`)

    ctx.fillStyle = ambientGradient
    ctx.fillRect(0, 0, width, height)

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

// Render individual node
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

// Main Canvas Component with Figma-style controls
export function ForgeCanvas() {
  const { 
    present, 
    selectedNodeIds, 
    zoom, 
    pan,
    selectNode,
    clearSelection,
    undo,
    redo,
    setZoom,
    setPan
  } = useCanvasStore()

  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 })
  const [isPanning, setIsPanning] = useState(false)
  const lastPointerPos = useRef({ x: 0, y: 0 })

  // Update stage size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const nodes = getNodesInRenderOrder(present)

  // Figma-style zoom with trackpad/mouse wheel
  // Cmd/Ctrl + scroll = zoom
  // Scroll = pan (if space held) or normal scroll
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const isCmdPressed = e.evt.metaKey || e.evt.ctrlKey
    const isSpacePressed = e.evt.shiftKey  // Using shift as space alternative for now
    
    if (isCmdPressed) {
      // Zoom mode (Figma style: Cmd + scroll)
      const oldScale = zoom
      const pointer = stage.getPointerPosition()
      
      if (!pointer) return
      
      // Calculate zoom direction and amount
      const delta = -e.evt.deltaY
      const scaleFactor = delta > 0 ? 1.1 : 0.9
      const newScale = Math.max(0.1, Math.min(5, oldScale * scaleFactor))
      
      // Zoom towards mouse pointer
      const mousePointTo = {
        x: (pointer.x - pan.x) / oldScale,
        y: (pointer.y - pan.y) / oldScale
      }
      
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
      }
      
      setZoom(newScale)
      setPan(newPos)
    } else {
      // Pan mode (normal scroll pans the canvas)
      const deltaX = e.evt.deltaX
      const deltaY = e.evt.deltaY
      
      setPan({
        x: pan.x - deltaX,
        y: pan.y - deltaY
      })
    }
  }

  // Mouse panning (space + drag or middle mouse)
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Middle mouse button (button 1) or space held
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey)) {
      setIsPanning(true)
      lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      e.evt.preventDefault()
    }
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isPanning) return
    
    const dx = e.evt.clientX - lastPointerPos.current.x
    const dy = e.evt.clientY - lastPointerPos.current.y
    
    setPan({
      x: pan.x + dx,
      y: pan.y + dy
    })
    
    lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleStageClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      clearSelection()
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      
      // Zoom shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        const newScale = Math.min(5, zoom * 1.2)
        setZoom(newScale)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault()
        const newScale = Math.max(0.1, zoom / 1.2)
        setZoom(newScale)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault()
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [undo, redo, zoom, pan, setZoom, setPan])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-zinc-50 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scale={{ x: zoom, y: zoom }}
        position={{ x: pan.x, y: pan.y }}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        draggable={false}
        className="bg-zinc-50"
      >
        <Layer>
          {/* Grid background */}
          <Shape
            sceneFunc={(context, shape) => {
              const width = stageSize.width / zoom + 2000
              const height = stageSize.height / zoom + 2000
              const gridSize = 20
              const offsetX = (-pan.x / zoom) % gridSize
              const offsetY = (-pan.y / zoom) % gridSize
              
              context.beginPath()
              for (let x = offsetX; x < width; x += gridSize) {
                context.moveTo(x, -1000)
                context.lineTo(x, height)
              }
              for (let y = offsetY; y < height; y += gridSize) {
                context.moveTo(-1000, y)
                context.lineTo(width, y)
              }
              context.strokeStyle = "#e4e4e7"
              context.lineWidth = 1 / zoom
              context.stroke()
              
              context.fillStrokeShape(shape)
            }}
          />

          {/* Render all nodes */}
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

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow text-xs text-zinc-500 space-y-1">
        <div>Cmd/Ctrl+Z: Undo | Cmd/Ctrl+Shift+Z: Redo</div>
        <div>Cmd/Ctrl+Scroll: Zoom | Scroll: Pan</div>
        <div>Cmd/Ctrl+0: Reset view</div>
      </div>
    </div>
  )
}