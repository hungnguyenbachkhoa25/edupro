import { db } from "./db";
import {
  practiceTests,
  questions,
  testResults,
  type PracticeTest,
  type Question,
  type TestResult,
  type InsertPracticeTest,
  type InsertQuestion,
  type InsertTestResult,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
