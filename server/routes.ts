import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Practice Tests Routes
  app.get(api.tests.list.path, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const tests = await storage.getPracticeTests(category);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.tests.get.path, async (req, res) => {
    try {
      const test = await storage.getPracticeTest(req.params.id);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      const testQuestions = await storage.getQuestionsForTest(test.id);
      res.json({
        ...test,
        questions: testQuestions
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test Results Routes
  app.post(api.results.submit.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.results.submit.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      const result = await storage.createTestResult({
        ...input,
        userId
      });
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.results.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getTestResults(userId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed Data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingTests = await storage.getPracticeTests();
    if (existingTests.length === 0) {
      console.log("Seeding database with practice tests...");
      
      // Seed IELTS Test
      const ieltsTest = await storage.createPracticeTest({
        title: "IELTS Mock Test - Reading 1",
        category: "IELTS",
        type: "Reading",
        isPremium: false,
        durationMinutes: 60
      });

      await storage.createQuestion({
        testId: ieltsTest.id,
        text: "What is the main topic of the first paragraph?",
        options: [
          "The history of agriculture",
          "Modern farming techniques",
          "Climate change effects on crops",
          "Economic impacts of farming"
        ],
        correctAnswer: "The history of agriculture",
        explanation: "The paragraph explicitly details the chronological development of early farming settlements."
      });

      await storage.createQuestion({
        testId: ieltsTest.id,
        text: "According to the text, which crop was domesticated first?",
        options: ["Wheat", "Corn", "Rice", "Barley"],
        correctAnswer: "Wheat",
        explanation: "Line 4 states 'Wheat was the very first crop to be successfully cultivated by early humans'."
      });

      // Seed SAT Test
      const satTest = await storage.createPracticeTest({
        title: "Digital SAT Math Practice",
        category: "SAT",
        type: "Math",
        isPremium: true,
        durationMinutes: 70
      });

      await storage.createQuestion({
        testId: satTest.id,
        text: "If 3x - y = 12 and y = 3, what is the value of x?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "5",
        explanation: "Substitute y=3 into the equation: 3x - 3 = 12. Add 3 to both sides: 3x = 15. Divide by 3: x = 5."
      });

      console.log("Database seeding completed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
