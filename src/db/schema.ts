import { integer, varchar, pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

// Users table
export const Users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').unique().notNull(),
  fullName: text('full_name').notNull(),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reports table
export const Reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => Users.clerkId).notNull(),
  location: text("location").notNull(),
  wasteType: varchar("waste_type", { length: 255 }).notNull(),
  amount: varchar("amount", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  collectorId: text("collector_id").references(() => Users.clerkId),
});


// Rewards table
export const Rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => Users.clerkId).notNull(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  description: text("description"),
  name: varchar("name", { length: 255 }).notNull(),
  collectionInfo: text("collection_info").notNull(),
});

// CollectedWastes table
export const CollectedWastes = pgTable("collected_wastes", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => Reports.id).notNull(),
  collectorId: text("collector_id").references(() => Users.clerkId).notNull(),
  collectionDate: timestamp("collection_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("collected"),
  comment: text("comment"),
});

// Notifications table
export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => Users.clerkId).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New Transactions table
export const Transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => Users.clerkId).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});