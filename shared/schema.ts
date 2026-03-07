import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, integer, boolean, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- AUTH TABLES ---
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: varchar("plan").default("free"), // free, pro, premium
  streak: integer("streak").default(0),
  targetScore: varchar("target_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// --- APP TABLES ---
export const practiceTests = pgTable("practice_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: varchar("category").notNull(), // IELTS, SAT, DGNL, THPTQG
  type: varchar("type").notNull(), // Reading, Listening, Math, etc.
  isPremium: boolean("is_premium").default(false),
  durationMinutes: integer("duration_minutes").default(60),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").references(() => practiceTests.id).notNull(),
  text: text("text").notNull(),
  options: jsonb("options").notNull(), // array of strings
  correctAnswer: varchar("correct_answer").notNull(),
  explanation: text("explanation"),
});

export const testResults = pgTable("test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testId: varchar("test_id").references(() => practiceTests.id).notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: jsonb("answers").notNull(), // user's answers { questionId: "answer" }
  completedAt: timestamp("completed_at").defaultNow(),
});

// --- SCHEMAS ---
export const insertPracticeTestSchema = createInsertSchema(practiceTests).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertTestResultSchema = createInsertSchema(testResults).omit({ id: true, completedAt: true, userId: true });

export type PracticeTest = typeof practiceTests.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type TestResult = typeof testResults.$inferSelect;

export type InsertPracticeTest = z.infer<typeof insertPracticeTestSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
