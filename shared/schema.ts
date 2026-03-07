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

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // 'study'|'achievement'|'account'|'system'
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  actionLink: varchar("action_link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // text|image|file|system
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const examAttempts = pgTable("exam_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  examId: varchar("exam_id").references(() => practiceTests.id).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers"),
  timeSpentSeconds: integer("time_spent_seconds"),
});

export const topicProgress = pgTable("topic_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  examType: varchar("exam_type").notNull(), // IELTS|SAT|DGNL|THPTQG
  subject: varchar("subject").notNull(),
  topic: varchar("topic").notNull(),
  questionsDone: integer("questions_done").default(0),
  questionsCorrect: integer("questions_correct").default(0),
  lastPracticedAt: timestamp("last_practiced_at").defaultNow(),
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({ id: true, joinedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, readAt: true });
export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({ id: true, startedAt: true });
export const insertTopicProgressSchema = createInsertSchema(topicProgress).omit({ id: true, lastPracticedAt: true });

export type PracticeTest = typeof practiceTests.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type TestResult = typeof testResults.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ExamAttempt = typeof examAttempts.$inferSelect;
export type TopicProgress = typeof topicProgress.$inferSelect;

export type InsertPracticeTest = z.infer<typeof insertPracticeTestSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;
export type InsertTopicProgress = z.infer<typeof insertTopicProgressSchema>;
