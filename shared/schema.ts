import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS
// ============================================================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============================================================================
// INDIAN STATES (with CGHS pricing tier)
// ============================================================================
export const states = pgTable("states", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  code: varchar("code", { length: 5 }).notNull().unique(),
  tier: integer("tier").notNull(), // 1, 2, or 3 (CGHS pricing tiers)
});

export type State = typeof states.$inferSelect;

// ============================================================================
// MEDICAL ITEM CATEGORIES
// ============================================================================
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull(), // e.g., 5.00, 12.00, 18.00
  description: text("description"),
});

export type Category = typeof categories.$inferSelect;

// ============================================================================
// GOVERNMENT PRICE DATABASE
// ============================================================================
export const govtPrices = pgTable("govt_prices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  stateId: integer("state_id").references(() => states.id), // null = all states
  itemName: text("item_name").notNull(),
  itemCode: varchar("item_code", { length: 50 }), // NPPA/CGHS code
  ceilingPrice: decimal("ceiling_price", { precision: 12, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 12, scale: 2 }), // MRP if applicable
  unit: text("unit"), // "per tablet", "per test", "per day"
  source: text("source").notNull(), // "NPPA" | "CGHS" | "DPCO"
  publishedDate: timestamp("published_date").notNull(),
  effectiveFrom: timestamp("effective_from"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("govt_prices_item_name_idx").on(table.itemName),
  index("govt_prices_category_idx").on(table.categoryId),
]);

export type GovtPrice = typeof govtPrices.$inferSelect;
export type InsertGovtPrice = typeof govtPrices.$inferInsert;

// ============================================================================
// JARGON BUSTER CACHE
// ============================================================================
export const jargonTerms = pgTable("jargon_terms", {
  term: varchar("term").primaryKey(), // Normalized term (lowercase, trimmed)
  explanation: text("explanation").notNull(),
  estimatedCost: varchar("estimated_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type JargonTerm = typeof jargonTerms.$inferSelect;
export type InsertJargonTerm = typeof jargonTerms.$inferInsert;

// ============================================================================
// BILL ANALYSES (User's analyzed bills)
// ============================================================================
export const billAnalyses = pgTable("bill_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  hospitalName: text("hospital_name"),
  billDate: timestamp("bill_date"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  stateId: integer("state_id").references(() => states.id),
  totalBilled: decimal("total_billed", { precision: 12, scale: 2 }),
  totalFairPrice: decimal("total_fair_price", { precision: 12, scale: 2 }),
  overchargeAmount: decimal("overcharge_amount", { precision: 12, scale: 2 }),
  totalDiscount: decimal("total_discount", { precision: 12, scale: 2 }),
  totalTax: decimal("total_tax", { precision: 12, scale: 2 }),
  itemCount: integer("item_count").default(0),
  overchargedItemCount: integer("overcharged_item_count").default(0),
  imageUrl: text("image_url"),
  rawOcrText: text("raw_ocr_text"),
  status: text("status").default("processing"), // "processing" | "completed" | "error"
}, (table) => [
  index("bill_analyses_user_idx").on(table.userId),
]);

export const insertBillAnalysisSchema = createInsertSchema(billAnalyses).pick({
  userId: true,
  stateId: true,
});

export type BillAnalysis = typeof billAnalyses.$inferSelect;
export type InsertBillAnalysis = z.infer<typeof insertBillAnalysisSchema>;

// ============================================================================
// BILL ITEMS (Individual line items from each bill)
// ============================================================================
export const billItems = pgTable("bill_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  billAnalysisId: varchar("bill_analysis_id").references(() => billAnalyses.id).notNull(),
  rawText: text("raw_text"), // Original text from OCR
  itemName: text("item_name").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unit: text("unit"),
  mrp: decimal("mrp", { precision: 12, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  totalBilled: decimal("total_billed", { precision: 12, scale: 2 }).notNull(),
  govtCeilingPrice: decimal("govt_ceiling_price", { precision: 12, scale: 2 }),
  overchargeAmount: decimal("overcharge_amount", { precision: 12, scale: 2 }),
  status: text("status").default("not_found"), // "fair" | "overcharged" | "suspicious" | "not_found"
  priceSource: text("price_source"), // "NPPA 2024" etc
  sourceDate: timestamp("source_date"), // Published date of reference
  notes: text("notes"),
}, (table) => [
  index("bill_items_analysis_idx").on(table.billAnalysisId),
]);

export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = typeof billItems.$inferInsert;

// ============================================================================
// SESSIONS (for express-session)
// ============================================================================
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
