import {
  AnyPgColumn,
  pgEnum,
  pgTable,
  text,
  integer,
  uuid,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

/**
 * ENUMS
 */
export const userRoleEnum = pgEnum("user_role", [
  "sales",
  "manager",
  "admin",
]);

/**
 * USERS TABLE
 */
export const usersTable = pgTable("users_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("sales"),
  managerId: uuid("manager_id").references((): AnyPgColumn => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

/**
 * RFPs TABLE
 */
export const rfpsTable = pgTable("rfps_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  description: text("description"),
  submissionDate: date("submission_date"),
  submittedBy: uuid("submitted_by")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertRFP = typeof rfpsTable.$inferInsert;
export type SelectRFP = typeof rfpsTable.$inferSelect;

/**
 * RFP FILES TABLE
 */
export const rfpFilesTable = pgTable("rfp_files_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  rfpId: uuid("rfp_id")
    .notNull()
    .references(() => rfpsTable.id),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export type InsertRfpFile = typeof rfpFilesTable.$inferInsert;
export type SelectRfpFile = typeof rfpFilesTable.$inferSelect;
