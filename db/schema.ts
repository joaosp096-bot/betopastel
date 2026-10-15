import {
  sqliteTable,
  text,
  integer,
  index,
  blob,
} from "drizzle-orm/sqlite-core";
export const workspaces = sqliteTable("beto_workspaces", {
  owner: text("owner").primaryKey(),
  payload: text("payload").notNull(),
  version: integer("version").notNull().default(1),
  updated: text("updated").notNull(),
});
export const revisions = sqliteTable(
  "beto_revisions",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    version: integer("version").notNull(),
    action: text("action").notNull(),
    payload: text("payload").notNull(),
    created: text("created").notNull(),
    requestHash: text("request_hash"),
    receiptId: text("receipt_id"),
  },
  (t) => [index("idx_beto_revisions_owner_version").on(t.owner, t.version)],
);

export const users = sqliteTable("beto_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "operador"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  active: integer("active").notNull().default(1),
  created: text("created").notNull(),
});
export const sessions = sqliteTable(
  "beto_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [index("idx_beto_sessions_user").on(t.userId)],
);
export const attempts = sqliteTable("beto_auth_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

/** Private optional files are separate from versioned workspace JSON. */
export const receipts = sqliteTable("beto_receipts", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  expenseId: text("expense_id").notNull(),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  body: blob("body", { mode: "buffer" }).notNull(),
  created: text("created").notNull(),
  createdBy: text("created_by").notNull(),
});
