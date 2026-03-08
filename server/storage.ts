import { db } from "./db";
import {
  practiceTests,
  questions,
  testResults,
  users,
  notifications,
  conversations,
  conversationParticipants,
  messages,
  examAttempts,
  topicProgress,
  userSessions,
  securityLogs,
  learningGoals,
  type User,
  type PracticeTest,
  type Question,
  type TestResult,
  type Notification,
  type Conversation,
  type ConversationParticipant,
  type Message,
  type ExamAttempt,
  type TopicProgress,
  type UserSession,
  type SecurityLog,
  type LearningGoal,
  type InsertPracticeTest,
  type InsertQuestion,
  type InsertTestResult,
  type InsertNotification,
  type InsertMessage,
  type InsertExamAttempt,
  type InsertTopicProgress,
  type InsertUserSession,
  type InsertSecurityLog,
  type InsertLearningGoal,
} from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";

export interface IStorage {
  // Practice Tests
  getPracticeTests(category?: string): Promise<PracticeTest[]>;
  getPracticeTest(id: string): Promise<PracticeTest | undefined>;
  createPracticeTest(test: InsertPracticeTest): Promise<PracticeTest>;
  
  // Questions
  getQuestionsForTest(testId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Test Results
  getTestResults(userId: string): Promise<TestResult[]>;
  createTestResult(result: InsertTestResult & { userId: string }): Promise<TestResult>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Conversations
  getConversations(userId: string): Promise<(Conversation & { lastMessage?: Message; unreadCount: number })[]>;
  createConversation(participantIds: string[]): Promise<Conversation>;
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  markMessagesRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  getConversationParticipants(conversationId: string): Promise<ConversationParticipant[]>;

  // Exam Attempts
  createExamAttempt(data: InsertExamAttempt): Promise<ExamAttempt>;
  updateExamAttempt(id: string, data: Partial<ExamAttempt>): Promise<ExamAttempt>;
  getExamAttempts(userId: string): Promise<ExamAttempt[]>;

  // Topic Progress
  getTopicProgress(userId: string, examType: string): Promise<TopicProgress[]>;
  upsertTopicProgress(data: InsertTopicProgress): Promise<TopicProgress>;

  // Users
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;

  // Sessions
  getOrCreateUserSession(userId: string, data: InsertUserSession): Promise<UserSession>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  deleteUserSession(id: string): Promise<void>;

  // Security Logs
  createSecurityLog(data: InsertSecurityLog): Promise<SecurityLog>;
  getSecurityLogs(userId: string, limit: number): Promise<SecurityLog[]>;

  // Learning Goals
  getLearningGoals(userId: string): Promise<LearningGoal | undefined>;
  upsertLearningGoals(userId: string, data: Partial<InsertLearningGoal>): Promise<LearningGoal>;
}

export class DatabaseStorage implements IStorage {
  async getPracticeTests(category?: string): Promise<PracticeTest[]> {
    if (category) {
      return await db.select().from(practiceTests).where(eq(practiceTests.category, category));
    }
    return await db.select().from(practiceTests);
  }

  async getPracticeTest(id: string): Promise<PracticeTest | undefined> {
    const [test] = await db.select().from(practiceTests).where(eq(practiceTests.id, id));
    return test;
  }

  async createPracticeTest(test: InsertPracticeTest): Promise<PracticeTest> {
    const [newTest] = await db.insert(practiceTests).values(test).returning();
    return newTest;
  }

  async getQuestionsForTest(testId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.testId, testId));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async getTestResults(userId: string): Promise<TestResult[]> {
    return await db.select().from(testResults).where(eq(testResults.userId, userId)).orderBy(desc(testResults.completedAt));
  }

  async createTestResult(result: InsertTestResult & { userId: string }): Promise<TestResult> {
    const [newResult] = await db.insert(testResults).values(result).returning();
    return newResult;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result.count);
  }

  // Conversations
  async getConversations(userId: string): Promise<(Conversation & { lastMessage?: Message; unreadCount: number })[]> {
    const participants = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, userId));
    const conversationIds = participants.map(p => p.conversationId);
    
    if (conversationIds.length === 0) return [];

    const results = await Promise.all(conversationIds.map(async (id) => {
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
      const [lastMessage] = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(desc(messages.createdAt)).limit(1);
      const [unreadResult] = await db.select({ count: count() }).from(messages).where(and(eq(messages.conversationId, id), eq(messages.isRead, false), eq(messages.senderId, userId === 'admin' ? 'user' : 'admin'))); // Simplification for demo
      
      return {
        ...conversation,
        lastMessage,
        unreadCount: Number(unreadResult.count)
      };
    }));

    return results;
  }

  async createConversation(participantIds: string[]): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({}).returning();
    await db.insert(conversationParticipants).values(participantIds.map(userId => ({
      conversationId: conversation.id,
      userId
    })));
    return conversation;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages).set({ isRead: true, readAt: new Date() }).where(and(eq(messages.conversationId, conversationId), eq(messages.isRead, false)));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const participants = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, userId));
    const conversationIds = participants.map(p => p.conversationId);
    if (conversationIds.length === 0) return 0;

    let totalUnread = 0;
    for (const id of conversationIds) {
       const [result] = await db.select({ count: count() }).from(messages).where(and(eq(messages.conversationId, id), eq(messages.isRead, false), eq(messages.senderId, userId === 'admin' ? 'user' : 'admin'))); // Consistent logic
       totalUnread += Number(result.count);
    }
    return totalUnread;
  }

  async getConversationParticipants(conversationId: string): Promise<ConversationParticipant[]> {
    return await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId, conversationId));
  }

  // Exam Attempts
  async createExamAttempt(data: InsertExamAttempt): Promise<ExamAttempt> {
    const [attempt] = await db.insert(examAttempts).values(data).returning();
    return attempt;
  }

  async updateExamAttempt(id: string, data: Partial<ExamAttempt>): Promise<ExamAttempt> {
    const [attempt] = await db.update(examAttempts).set(data).where(eq(examAttempts.id, id)).returning();
    return attempt;
  }

  async getExamAttempts(userId: string): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.userId, userId)).orderBy(desc(examAttempts.startedAt));
  }

  // Topic Progress
  async getTopicProgress(userId: string, examType: string): Promise<TopicProgress[]> {
    return await db.select().from(topicProgress).where(and(eq(topicProgress.userId, userId), eq(topicProgress.examType, examType)));
  }

  async upsertTopicProgress(data: InsertTopicProgress): Promise<TopicProgress> {
    const [existing] = await db.select().from(topicProgress).where(and(
      eq(topicProgress.userId, data.userId),
      eq(topicProgress.examType, data.examType),
      eq(topicProgress.subject, data.subject),
      eq(topicProgress.topic, data.topic)
    ));

    if (existing) {
      const [updated] = await db.update(topicProgress).set({
        questionsDone: (existing.questionsDone || 0) + (data.questionsDone || 0),
        questionsCorrect: (existing.questionsCorrect || 0) + (data.questionsCorrect || 0),
        lastPracticedAt: new Date()
      }).where(eq(topicProgress.id, existing.id)).returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(topicProgress).values(data).returning();
      return newProgress;
    }
  }

  // Users
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // Sessions
  async getOrCreateUserSession(userId: string, data: InsertUserSession): Promise<UserSession> {
    const [existing] = await db.select().from(userSessions).where(and(
      eq(userSessions.userId, userId),
      eq(userSessions.deviceName, data.deviceName),
      eq(userSessions.browser, data.browser)
    ));

    if (existing) {
      const [updated] = await db.update(userSessions)
        .set({ lastActiveAt: new Date(), ipAddress: data.ipAddress, location: data.location })
        .where(eq(userSessions.id, existing.id))
        .returning();
      return updated;
    }

    const [session] = await db.insert(userSessions).values({ ...data, userId }).returning();
    return session;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return await db.select().from(userSessions).where(eq(userSessions.userId, userId)).orderBy(desc(userSessions.lastActiveAt));
  }

  async deleteUserSession(id: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.id, id));
  }

  // Security Logs
  async createSecurityLog(data: InsertSecurityLog): Promise<SecurityLog> {
    const [log] = await db.insert(securityLogs).values(data).returning();
    return log;
  }

  async getSecurityLogs(userId: string, limit: number): Promise<SecurityLog[]> {
    return await db.select().from(securityLogs).where(eq(securityLogs.userId, userId)).orderBy(desc(securityLogs.createdAt)).limit(limit);
  }

  // Learning Goals
  async getLearningGoals(userId: string): Promise<LearningGoal | undefined> {
    const [goals] = await db.select().from(learningGoals).where(eq(learningGoals.userId, userId));
    return goals;
  }

  async upsertLearningGoals(userId: string, data: Partial<InsertLearningGoal>): Promise<LearningGoal> {
    const [existing] = await db.select().from(learningGoals).where(eq(learningGoals.userId, userId));

    if (existing) {
      const [updated] = await db.update(learningGoals)
        .set({
          ...data,
          updatedAt: new Date(),
          examTypes: data.examTypes as string[] | undefined,
          targetScores: data.targetScores as Record<string, string> | undefined,
          examDates: data.examDates as Record<string, string> | undefined,
        })
        .where(eq(learningGoals.userId, userId))
        .returning();
      return updated;
    }

    const [newGoals] = await db.insert(learningGoals).values({
      userId,
      examTypes: (data.examTypes || []) as string[],
      targetScores: (data.targetScores || {}) as Record<string, string>,
      examDates: (data.examDates || {}) as Record<string, string>,
      dailyHours: data.dailyHours ?? 1.5,
    }).returning();
    return newGoals;
  }
}

export const storage = new DatabaseStorage();
