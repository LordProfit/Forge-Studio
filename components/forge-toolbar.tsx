"use client"

import { useCanvasStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { 
  MousePointer2, 
  Square, 
  Type, 
  Image as ImageIcon, 
  Frame,
  Sun,
  ZoomIn,
  ZoomOut,
  Hand,
  Lock,
  Unlock,
  Undo2,
  Redo2
} from "lucide-react"
import { LightingPresets } from "@/lib/document"
import { useState } from "react"

type ToolMode = "select" | "frame" | "shape" | "text" | "image"

export function ForgeToolbar() {
  const [activeTool, setActiveTool] = useState<ToolMode>("select")
  const [isCreating, setIsCreating] = useState(false)
  
  const { 
    addTextNode,
    addShapeNode,
    addFrameNode,
    zoomIn, 
    zoomOut, 
    resetViewport,
    selectedNodeIds,
    updateNode,
    undo,
    redo,
    present,
    zoom,
    pan
  } = useCanvasStore()

  const selectedNodes = selectedNodeIds
    .map(id => present.nodes[id])
    .filter(Boolean)

  const hasSelection = selectedNodes.length > 0
  const canUndo = useCanvasStore(state => state.past.length > 0)
  const canRedo = useCanvasStore(state => state.future.length > 0)

  const applyLighting = (preset: keyof typeof LightingPresets) => {
    if (!hasSelection) return
    selectedNodes.forEach(node => {
      updateNode(node!.id, { lighting: LightingPresets[preset] })
    })
  }

  const toggleLock = () => {
    if (!hasSelection) return
    const firstNode = selectedNodes[0]
    if (!firstNode) return
    updateNode(firstNode.id, { locked: !firstNode.locked })
  }

  // Handle tool selection
  const selectTool = (tool: ToolMode) => {
    setActiveTool(tool)
    
    // Store tool mode in window for canvas to access
    if (typeof window !== "undefined") {
      ;(window as any).__forgeToolMode = tool
      ;(window as any).__forgeIsCreating = false
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200 w-16">
      {/* History */}
      <div className="flex flex-col items-center py-4 gap-2 border-b border-zinc-200">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tools */}
      <div className="flex flex-col items-center py-4 gap-2">
        <Button 
          variant={activeTool === "select" ? "default" : "ghost"} 
          size="icon" 
          className="h-10 w-10"
          onClick={() => selectTool("select")}
        >
          <MousePointer2 className="h-5 w-5" />
        </Button>
        
        <Button 
          variant={activeTool === "frame" ? "default" : "ghost"} 
          size="icon" 
          className="h-10 w-10" 
          onClick={() => selectTool("frame")}
          title="Frame (F) - Click and drag on canvas"
        >
          <Frame className="h-5 w-5" />
        </Button>
        
        <Button 
          variant={activeTool === "shape" ? "default" : "ghost"} 
          size="icon" 
          className="h-10 w-10" 
          onClick={() => selectTool("shape")}
          title="Rectangle (R) - Click and drag on canvas"
        >
          <Square className="h-5 w-5" />
        </Button>
        
        <Button 
          variant={activeTool === "text" ? "default" : "ghost"} 
          size="icon" 
          className="h-10 w-10" 
          onClick={() => selectTool("text")}
          title="Text (T) - Click on canvas"
        >
          <Type className="h-5 w-5" />
        </Button>
        
        <Button 
          variant={activeTool === "image" ? "default" : "ghost"} 
          size="icon" 
          className="h-10 w-10"
          onClick={() => selectTool("image")}
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* Active tool indicator */}
      {activeTool !== "select" && (
        <div className="px-2 py-2 text-xs text-center text-zinc-500 border-t border-zinc-200">
          {activeTool === "frame" && "Drag to create frame"}
          {activeTool === "shape" && "Drag to create shape"}
          {activeTool === "text" && "Click to add text"}
        </div>
      )}

      {/* Lighting Presets */}
      {hasSelection && (
        <div className="flex flex-col items-center py-4 gap-2 border-t border-zinc-200">
          <div className="text-xs text-zinc-500 font-medium mb-1">Light</div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyLighting("dramatic")}
            title="Dramatic"
          >
            <Sun className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyLighting("soft")}
            title="Soft"
          >
            <div className="w-4 h-4 rounded-full bg-zinc-300" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyLighting("noir")}
            title="Noir"
          >
            <div className="w-4 h-4 rounded-full bg-zinc-800" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyLighting("flat")}
            title="Flat"
          >
            <div className="w-4 h-4 rounded-full border border-zinc-300" />
          </Button>
        </div>
      )}

      {/* View controls */}
      <div className="flex flex-col items-center py-4 gap-2 border-t border-zinc-200">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetViewport}>
          <Hand className="h-4 w-4" />
        </Button>
      </div>

      {/* Lock toggle */}
      {hasSelection && (
        <div className="flex flex-col items-center py-4 gap-2 border-t border-zinc-200">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={toggleLock}
          >
            {selectedNodes[0]?.locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}