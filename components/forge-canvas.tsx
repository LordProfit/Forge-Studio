"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Stage, Layer, Rect, Text, Group, Shape, Image } from "react-konva"
import { useCanvasStore } from "@/lib/store"
import { Node, getNodesInRenderOrder, LightingProps, isTextNode, isShapeNode, isImageNode, isFrameNode, createFrameNode, createShapeNode, createTextNode } from "@/lib/document"
import { KonvaEventObject } from "konva/lib/Node"
import useImage from "use-image"

// Tool mode type
type ToolMode = "select" | "frame" | "shape" | "text" | "image"

// Lighting overlay using Konva Shape
function LightingOverlay({ width, height, lighting }: { width: number; height: number; lighting: LightingProps }) {
  const drawLighting = useCallback((context: any) => {
    const ctx = context._context
    ctx.clearRect(0, 0, width, height)
    const angleRad = (lighting.directionalAngle * Math.PI) / 180
    const shadowX = Math.cos(angleRad) * lighting.elevation
    const shadowY = Math.sin(angleRad) * lighting.elevation
    const ambientGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2)
    ambientGradient.addColorStop(0, `rgba(255, 255, 255, ${lighting.ambientIntensity})`)
    ambientGradient.addColorStop(1, `rgba(0, 0, 0, ${1 - lighting.ambientIntensity})`)
    ctx.fillStyle = ambientGradient
    ctx.fillRect(0, 0, width, height)
    ctx.save()
    ctx.globalCompositeOperation = "multiply"
    const shadowGradient = ctx.createLinearGradient(width / 2 - shadowX * 10, height / 2 - shadowY * 10, width / 2 + shadowX * 10, height / 2 + shadowY * 10)
    shadowGradient.addColorStop(0, `rgba(0, 0, 0, ${lighting.shadowSoftness})`)
    shadowGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)")
    shadowGradient.addColorStop(1, `rgba(255, 255, 255, ${lighting.rimLightIntensity * 0.3})`)
    ctx.fillStyle = shadowGradient
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }, [width, height, lighting])

  return <Shape width={width} height={height} sceneFunc={drawLighting} opacity={0.8} />
}

// Individual node renderer
function CanvasNode({ node, isSelected, onSelect }: { node: Node; isSelected: boolean; onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void }) {
  const { updateNode } = useCanvasStore()
  const handleDragEnd = (e: KonvaEventObject<DragEvent | TouchEvent>) => {
    updateNode(node.id, { position: { x: e.target.x(), y: e.target.y() } })
  }
  const commonProps = { x: node.position.x, y: node.position.y, width: node.size.width, height: node.size.height, rotation: node.rotation, opacity: node.opacity, draggable: !node.locked, onDragEnd: handleDragEnd, onClick: onSelect, onTap: onSelect }

  if (isTextNode(node)) {
    return <Text key={node.id} {...commonProps} text={node.text} fontSize={node.fontSize} fontFamily={node.fontFamily} fontWeight={node.fontWeight} fill={node.color || "#000000"} width={node.size.width} height={node.size.height} align={node.textAlign || "left"} />
  }

  if (isShapeNode(node)) {
    if (node.shapeType === "circle") {
      return (
        <Group key={node.id}>
          <Shape {...commonProps} sceneFunc={(context, shape) => { context.beginPath(); context.ellipse(node.size.width / 2, node.size.height / 2, node.size.width / 2, node.size.height / 2, 0, 0, 2 * Math.PI); context.fillStrokeShape(shape) }} fill={node.fill} stroke={isSelected ? "#3b82f6" : node.stroke} strokeWidth={isSelected ? 2 : node.strokeWidth || 0} />
          {node.lighting && <LightingOverlay width={node.size.width} height={node.size.height} lighting={node.lighting} />}
        </Group>
      )
    }
    return (
      <Group key={node.id}>
        <Rect {...commonProps} fill={node.fill} stroke={isSelected ? "#3b82f6" : node.stroke} strokeWidth={isSelected ? 2 : node.strokeWidth || 0} cornerRadius={node.cornerRadius || 0} />
        {node.lighting && <LightingOverlay width={node.size.width} height={node.size.height} lighting={node.lighting} />}
      </Group>
    )
  }

  if (isImageNode(node)) {
    const [image] = useImage(node.src)
    return <Image key={node.id} {...commonProps} image={image} alt={node.alt || ""} />
  }

  if (isFrameNode(node)) {
    return (
      <Group key={node.id}>
        <Rect {...commonProps} fill={node.fill || "transparent"} stroke={isSelected ? "#3b82f6" : node.stroke || "#e5e5e5"} strokeWidth={isSelected ? 2 : node.strokeWidth || 1} cornerRadius={node.cornerRadius || 0} dash={[5, 5]} />
        {node.lighting && <LightingOverlay width={node.size.width} height={node.size.height} lighting={node.lighting} />}
      </Group>
    )
  }
  return null
}

// Main Canvas
export function ForgeCanvas() {
  const { present, selectedNodeIds, zoom, pan, selectNode, clearSelection, undo, redo, setZoom, setPan, addFrameNode, addShapeNode, addTextNode } = useCanvasStore()
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 })
  const [isPanning, setIsPanning] = useState(false)
  const [toolMode, setToolMode] = useState<ToolMode>("select")
  const [isCreating, setIsCreating] = useState(false)
  const [creationStart, setCreationStart] = useState({ x: 0, y: 0 })
  const [creationCurrent, setCreationCurrent] = useState({ x: 0, y: 0 })
  const lastPointerPos = useRef({ x: 0, y: 0 })

  // Sync tool mode from toolbar
  useEffect(() => {
    const checkToolMode = () => {
      const mode = (window as any).__forgeToolMode || "select"
      setToolMode(mode)
    }
    const interval = setInterval(checkToolMode, 100)
    return () => clearInterval(interval)
  }, [])

  // Update stage size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const nodes = getNodesInRenderOrder(present)

  // Convert screen to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    }
  }

  // Handle mouse down
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return
    
    const pos = stage.getPointerPosition()
    if (!pos) return

    // Middle mouse or space+click = pan
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey)) {
      setIsPanning(true)
      lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      e.evt.preventDefault()
      return
    }

    // Left click with tool = start creating
    if (e.evt.button === 0 && toolMode !== "select") {
      const canvasPos = screenToCanvas(pos.x, pos.y)
      setIsCreating(true)
      setCreationStart(canvasPos)
      setCreationCurrent(canvasPos)
      e.evt.preventDefault()
      return
    }
  }

  // Handle mouse move
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      const dx = e.evt.clientX - lastPointerPos.current.x
      const dy = e.evt.clientY - lastPointerPos.current.y
      setPan({ x: pan.x + dx, y: pan.y + dy })
      lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      return
    }

    if (isCreating) {
      const stage = stageRef.current
      if (!stage) return
      const pos = stage.getPointerPosition()
      if (!pos) return
      setCreationCurrent(screenToCanvas(pos.x, pos.y))
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    if (isCreating) {
      // Create the node based on tool mode
      const x = Math.min(creationStart.x, creationCurrent.x)
      const y = Math.min(creationStart.y, creationCurrent.y)
      const width = Math.abs(creationCurrent.x - creationStart.x)
      const height = Math.abs(creationCurrent.y - creationStart.y)

      // Minimum size check
      if (width > 10 && height > 10) {
        switch (toolMode) {
          case "frame":
            addFrameNode({ x, y }, { width, height })
            break
          case "shape":
            addShapeNode({ x, y }, { width, height }, "rect")
            break
          case "text":
            addTextNode({ x, y }, { width: Math.max(width, 100), height: Math.max(height, 30) }, "Text")
            break
        }
      }

      setIsCreating(false)
      // Reset tool mode to select after creation (like Figma)
      setToolMode("select")
      ;(window as any).__forgeToolMode = "select"
    }
    setIsPanning(false)
  }

  // Handle wheel for zoom/pan
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const isCmdPressed = e.evt.metaKey || e.evt.ctrlKey
    
    if (isCmdPressed) {
      // Zoom towards pointer
      const oldScale = zoom
      const delta = -e.evt.deltaY
      const scaleFactor = delta > 0 ? 1.1 : 0.9
      const newScale = Math.max(0.1, Math.min(5, oldScale * scaleFactor))
      const mousePointTo = { x: (pointer.x - pan.x) / oldScale, y: (pointer.y - pan.y) / oldScale }
      setZoom(newScale)
      setPan({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale })
    } else {
      // Pan
      setPan({ x: pan.x - e.evt.deltaX, y: pan.y - e.evt.deltaY })
    }
  }

  // Handle stage click for selection
  const handleStageClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage() && toolMode === "select") {
      clearSelection()
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        setZoom(Math.min(5, zoom * 1.2))
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault()
        setZoom(Math.max(0.1, zoom / 1.2))
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault()
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
      // Tool shortcuts
      if (!e.metaKey && !e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "v": setToolMode("select"); (window as any).__forgeToolMode = "select"; break
          case "f": setToolMode("frame"); (window as any).__forgeToolMode = "frame"; break
          case "r": setToolMode("shape"); (window as any).__forgeToolMode = "shape"; break
          case "t": setToolMode("text"); (window as any).__forgeToolMode = "text"; break
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [undo, redo, zoom, pan, toolMode])

  // Calculate creation preview
  const creationPreview = isCreating ? {
    x: Math.min(creationStart.x, creationCurrent.x),
    y: Math.min(creationStart.y, creationCurrent.y),
    width: Math.abs(creationCurrent.x - creationStart.x),
    height: Math.abs(creationCurrent.y - creationStart.y)
  } : null

  return (
    <div ref={containerRef} className="relative w-full h-full bg-zinc-50 overflow-hidden" style={{ cursor: isPanning ? 'grabbing' : isCreating ? 'crosshair' : toolMode !== 'select' ? 'crosshair' : 'default' }}>
      <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} scale={{ x: zoom, y: zoom }} position={{ x: pan.x, y: pan.y }} onClick={handleStageClick} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} draggable={false}>
        <Layer>
          {/* Grid */}
          <Shape sceneFunc={(context) => { const w = stageSize.width / zoom + 2000, h = stageSize.height / zoom + 2000, gs = 20, ox = (-pan.x / zoom) % gs, oy = (-pan.y / zoom) % gs; context.beginPath(); for (let x = ox; x < w; x += gs) { context.moveTo(x, -1000); context.lineTo(x, h) } for (let y = oy; y < h; y += gs) { context.moveTo(-1000, y); context.lineTo(w, y) } context.strokeStyle = "#e4e4e7"; context.lineWidth = 1 / zoom; context.stroke(); }} />
          
          {/* Nodes */}
          {nodes.map(node => (
            <CanvasNode key={node.id} node={node} isSelected={selectedNodeIds.includes(node.id)} onSelect={(e) => { e.cancelBubble = true; selectNode(node.id, (e.evt as MouseEvent).shiftKey) }} />
          ))}
          
          {/* Creation preview */}
          {creationPreview && toolMode !== "text" && (
            <Rect x={creationPreview.x} y={creationPreview.y} width={creationPreview.width} height={creationPreview.height} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth={2 / zoom} dash={[5 / zoom, 5 / zoom]} />
          )}
        </Layer>
      </Stage>

      {/* UI */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded shadow text-sm text-zinc-600">{Math.round(zoom * 100)}% | ({Math.round(pan.x)}, {Math.round(pan.y)})</div>
      <div className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded shadow text-sm text-zinc-600">{nodes.length} nodes | {selectedNodeIds.length} selected</div>
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow text-xs text-zinc-500 space-y-1">
        <div>Tool: {toolMode} | V: Select, F: Frame, R: Rect, T: Text</div>
        <div>Cmd+Scroll: Zoom | Scroll: Pan | Drag: Create</div>
      </div>
    </div>
  )
}