# Forge Studio

AI-Native 2D Creative OS

Figma-level canvas + cinematic lighting + structured AI execution

---

## Architecture

- **Next.js 16** (App Router, RSC)
- **TypeScript** + **Tailwind** + **shadcn**
- **Konva** (canvas rendering)
- **Zustand** (state management)
- **Neon** (PostgreSQL)
- **Drizzle ORM**
- **BullMQ** (queues)
- **Clerk** (auth)

---

## Core Features

### 1. Document Model (Figma-Style)
- Structured nodes with deterministic rendering
- Diff-based updates
- Versioned documents with undo/redo
- Workspace-scoped isolation

### 2. Canvas Engine
- Konva-based rendering
- Zoom, pan, selection
- Drag-and-drop
- Grid snapping

### 3. Lighting System
- 2D cinematic lighting
- Elevation, shadows, rim lighting
- Presets: Dramatic, Soft, Noir, Flat
- Shader-based overlay

### 4. AI Orchestration
- Structured agent core
- Tool registry (no direct document mutation)
- Workspace context injection
- Audit logging

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run db:migrate

# Start dev server
npm run dev
```

---

## Environment Variables

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
REDIS_URL=redis://...
```

---

## Project Structure

```
app/
  dashboard/        # Main canvas interface
  page.tsx          # Landing page
components/
  forge-canvas.tsx  # Konva canvas
  forge-toolbar.tsx # Tool palette
lib/
  document.ts       # Document model
  store.ts          # Zustand store
  db/               # Database schema
```

---

## Document Model

```typescript
interface Document {
  id: string
  workspaceId: string
  version: number
  nodes: Record<string, Node>
  rootIds: string[]
}

interface Node {
  id: string
  type: "frame" | "group" | "text" | "shape" | "image"
  position: { x, y }
  size: { width, height }
  lighting?: LightingProps
  // ... visual properties
}
```

---

## Lighting Props

```typescript
interface LightingProps {
  elevation: number           // Shadow depth
  ambientIntensity: number    // Base light level
  directionalAngle: number    // Light source angle
  shadowSoftness: number      // Blur amount
  rimLightIntensity: number   // Edge highlight
  gradientFalloff: number     // Light falloff
}
```

---

## License

MIT