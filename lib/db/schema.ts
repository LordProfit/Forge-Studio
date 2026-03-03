import { pgTable, uuid, varchar, jsonb, integer, timestamp } from "drizzle-orm/pg-core"

// Workspaces table
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
})

// Documents table - Figma-style document model
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: varchar("name", { length: 255 }).notNull(),
  version: integer("version").notNull().default(1),
  nodes: jsonb("nodes").notNull().default({}),
  rootIds: jsonb("root_ids").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
})

// Document versions for undo/redo
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  diff: jsonb("diff"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
})

// AI agent executions
export const agentExecutions = pgTable("agent_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  documentId: uuid("document_id").references(() => documents.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  intent: varchar("intent", { length: 1000 }),
  plan: jsonb("plan"),
  results: jsonb("results"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
})

// Automation rules
export const automations = pgTable("automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: varchar("trigger", { length: 50 }).notNull(), // cron, event, etc
  schedule: varchar("schedule", { length: 255 }), // cron expression
  action: varchar("action", { length: 255 }).notNull(),
  config: jsonb("config").default({}),
  enabled: integer("enabled").notNull().default(1),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow()
})

// Research cache
export const researchCache = pgTable("research_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  query: varchar("query", { length: 1000 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  result: jsonb("result").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow()
})