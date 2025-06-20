import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const indexes = pgTable("indexes", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  totalValue: real("total_value").default(0).notNull(),
  performance1d: real("performance_1d").default(0).notNull(),
  performance7d: real("performance_7d").default(0).notNull(),
  performance30d: real("performance_30d").default(0).notNull(),
  performance1y: real("performance_1y").default(0).notNull(),
  benchmarkSp500: real("benchmark_sp500").default(0).notNull(),
  benchmarkNasdaq: real("benchmark_nasdaq").default(0).notNull(),
});

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  indexId: integer("index_id").references(() => indexes.id).notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  sector: text("sector"),
  marketCap: real("market_cap"),
  weight: real("weight").default(1).notNull(),
  change1d: real("change_1d").default(0).notNull(),
  changePercent1d: real("change_percent_1d").default(0).notNull(),
});

export const historicalData = pgTable("historical_data", {
  id: serial("id").primaryKey(),
  indexId: integer("index_id").references(() => indexes.id).notNull(),
  date: timestamp("date").notNull(),
  value: real("value").notNull(),
  sp500Value: real("sp500_value").notNull(),
  nasdaqValue: real("nasdaq_value").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertIndexSchema = createInsertSchema(indexes).pick({
  prompt: true,
  name: true,
  description: true,
  isPublic: true,
}).extend({
  totalValue: z.number().optional(),
  performance1d: z.number().optional(),
  performance7d: z.number().optional(),
  performance30d: z.number().optional(),
  performance1y: z.number().optional(),
  benchmarkSp500: z.number().optional(),
  benchmarkNasdaq: z.number().optional(),
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  id: true,
});

export const insertHistoricalDataSchema = createInsertSchema(historicalData).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Index = typeof indexes.$inferSelect;
export type InsertIndex = z.infer<typeof insertIndexSchema>;

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;

export type HistoricalData = typeof historicalData.$inferSelect;
export type InsertHistoricalData = z.infer<typeof insertHistoricalDataSchema>;
