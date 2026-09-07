import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const promptState = mysqlTable("prompt_state", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  promptId: varchar("promptId", { length: 96 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["Strategy", "Writing", "Campaigns", "Build", "Visual"]).notNull(),
  mode: mysqlEnum("mode", ["blog", "email", "code", "image", "chat", "video"]).notNull(),
  body: text("body").notNull(),
  isCustom: boolean("isCustom").default(false).notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  favoritePosition: int("favoritePosition").default(0).notNull(),
  recentPosition: int("recentPosition").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userPromptUnique: uniqueIndex("prompt_state_user_prompt_idx").on(table.userId, table.promptId),
  userFavorites: index("prompt_state_user_favorites_idx").on(table.userId, table.isFavorite, table.favoritePosition),
  userRecents: index("prompt_state_user_recents_idx").on(table.userId, table.recentPosition, table.lastUsedAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PromptState = typeof promptState.$inferSelect;
export type InsertPromptState = typeof promptState.$inferInsert;
