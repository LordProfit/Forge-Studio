import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

// Initialize database connection
// In production, use environment variable
const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/forge_studio"

const sql = neon(connectionString)
export const db = drizzle(sql, { schema })

// Types
export type Workspace = typeof schema.workspaces.$inferSelect
export type NewWorkspace = typeof schema.workspaces.$inferInsert
export type Document = typeof schema.documents.$inferSelect
export type NewDocument = typeof schema.documents.$inferInsert
export type AgentExecution = typeof schema.agentExecutions.$inferSelect
export type NewAgentExecution = typeof schema.agentExecutions.$inferInsert