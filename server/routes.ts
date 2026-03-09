import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { Server as SocketIOServer } from "socket.io";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

let io: SocketIOServer | undefined;

const aiWritingScoreSchema = z.object({
  mode: z.enum(["IELTS_TASK_1", "IELTS_TASK_2", "THPTQG_VAN"]),
  essay: z.string().min(60, "Bài viết quá ngắn, cần ít nhất 60 ký tự"),
});

const aiStudyPlanSchema = z.object({
  examType: z.string().min(1),
  examDate: z.string(),
  currentScore: z.number().min(0),
  targetScore: z.number().min(0),
  dailyHours: z.number().min(0.5).max(12),
});

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

function scoreWritingEssay(essay: string) {
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  const sentenceCount = essay.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const avgSentenceLength = wordCount / sentenceCount;
  const grammarPatterns = [
    { regex: /\b(he|she|it)\s+are\b/gi, message: "Chủ ngữ số ít cần dùng 'is'" },
    { regex: /\bi\s+has\b/gi, message: "Với 'I' cần dùng 'have'" },
    { regex: /\bthere\s+is\s+\w+\s+and\s+\w+\b/gi, message: "Danh sách nhiều đối tượng nên dùng 'there are'" },
    { regex: /\b(did not|didn't)\s+\w+ed\b/gi, message: "Sau 'did not' dùng động từ nguyên mẫu" },
  ];

  const highlights: Array<{
    type: "grammar" | "vocab-repeat" | "improvement";
    snippet: string;
    message: string;
  }> = [];

  let grammarErrorCount = 0;
  for (const pattern of grammarPatterns) {
    const matches = essay.match(pattern.regex) || [];
    grammarErrorCount += matches.length;
    matches.slice(0, 4).forEach((snippet) => {
      highlights.push({
        type: "grammar",
        snippet,
        message: pattern.message,
      });
    });
  }

  const cleanedWords = essay
    .toLowerCase()
    .replace(/[^a-zA-Z\u00C0-\u024F\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  const stopWords = new Set(["that", "with", "this", "from", "have", "they", "which", "about", "there", "would", "could", "should"]);
  const frequencyMap: Record<string, number> = {};
  cleanedWords.forEach((word) => {
    if (stopWords.has(word)) return;
    frequencyMap[word] = (frequencyMap[word] || 0) + 1;
  });
  const repeatedWords = Object.entries(frequencyMap)
    .filter(([, count]) => count >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  repeatedWords.forEach(([word, count]) => {
    highlights.push({
      type: "vocab-repeat",
      snippet: word,
      message: `Từ '${word}' lặp ${count} lần, nên dùng từ đồng nghĩa`,
    });
  });

  const hasIntro = /in conclusion|to conclude|overall|in summary/i.test(essay);
  const hasLinkingWords = /however|moreover|therefore|for example|on the other hand|furthermore/i.test(essay);
  const hasComplexSentence = /which|although|while|whereas|because|despite/i.test(essay);

  const tr = clamp(4.5 + (wordCount / 250) * 2 + (hasIntro ? 0.3 : -0.2), 4.0, 8.5);
  const cc = clamp(4.8 + (hasLinkingWords ? 1.1 : 0.2) + (avgSentenceLength > 10 ? 0.4 : -0.1), 4.0, 8.5);
  const lr = clamp(4.8 + Math.min(repeatedWords.length, 3) * -0.35 + (wordCount > 220 ? 0.6 : 0.2), 4.0, 8.5);
  const gra = clamp(5.0 + (hasComplexSentence ? 0.8 : 0.2) - grammarErrorCount * 0.3, 4.0, 8.5);
  const overall = Math.round(((tr + cc + lr + gra) / 4) * 10) / 10;

  if (!hasLinkingWords) {
    highlights.push({
      type: "improvement",
      snippet: "Liên kết luận điểm",
      message: "Bổ sung từ nối như however, therefore, moreover để tăng Coherence & Cohesion.",
    });
  }
  if (wordCount < 220) {
    highlights.push({
      type: "improvement",
      snippet: "Độ dài bài viết",
      message: "Bài viết đang hơi ngắn, nên mở rộng ví dụ và giải thích để tăng Task Response.",
    });
  }

  return {
    scores: { tr, cc, lr, gra, overall },
    highlights,
    sampleComparison: {
      band7: "Lập luận rõ ràng, có ví dụ nhưng từ vựng còn lặp.",
      band8: "Lập luận sâu, dùng linh hoạt cấu trúc phức và từ vựng đa dạng.",
      currentGap: overall >= 7
        ? "Bạn đã gần band 7.5-8.0, tập trung giảm lỗi ngữ pháp nhỏ."
        : "Bạn đang dưới band 7.0, ưu tiên tăng mạch lạc và đa dạng từ vựng.",
    },
    meta: {
      wordCount,
      sentenceCount,
      grammarErrorCount,
      repeatedKeywordCount: repeatedWords.length,
    },
  };
}

function generateStudyPlan(input: z.infer<typeof aiStudyPlanSchema>) {
  const examDate = new Date(input.examDate);
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / msPerDay));
  const weeks = clamp(Math.ceil(daysLeft / 7), 1, 32);
  const scoreGap = Math.max(0, input.targetScore - input.currentScore);
  const examTopics: Record<string, string[]> = {
    IELTS: ["Reading", "Listening", "Writing Task 1", "Writing Task 2", "Speaking"],
    SAT: ["Math Algebra", "Advanced Math", "Problem Solving", "Reading & Writing"],
    THPTQG: ["Đại số", "Hình học", "Xác suất thống kê", "Đọc hiểu", "Nghị luận"],
    DGNL_HCM: ["Toán tư duy", "Ngôn ngữ", "Khoa học tự nhiên", "Khoa học xã hội"],
  };

  const topicPool = examTopics[input.examType] || ["Core Practice", "Mock Test", "Error Review"];
  const weeklyPlan = Array.from({ length: weeks }).map((_, index) => {
    const weekNo = index + 1;
    const intensity = weekNo <= Math.ceil(weeks * 0.6) ? "build" : weekNo < weeks ? "accelerate" : "final-review";
    const weeklyHours = Math.round(input.dailyHours * 7 * 10) / 10;
    const focusTopic = topicPool[index % topicPool.length];
    const mockFrequency = weekNo % 2 === 0 ? 2 : 1;
    const targetDelta = Math.round((scoreGap / weeks) * 100) / 100;

    return {
      week: weekNo,
      intensity,
      focusTopic,
      weeklyHours,
      objectives: [
        `Ôn trọng tâm: ${focusTopic}`,
        `Làm ${mockFrequency} đề mô phỏng có bấm giờ`,
        "Tổng hợp lỗi sai và tạo danh sách ôn tập cá nhân",
      ],
      expectedScoreDelta: targetDelta,
    };
  });

  return {
    examType: input.examType,
    examDate: input.examDate,
    daysLeft,
    weeks,
    adaptiveRule: "Nếu tuần gần nhất đạt <80% mục tiêu, tăng 20% thời gian ôn lỗi sai tuần kế tiếp.",
    weeklyPlan,
  };
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Socket.io
  io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: any) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} connected to socket ${socket.id}`);
    }

    socket.on("message:typing", ({ conversationId, userId, userName }: any) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("message:typing", {
          conversationId,
          userId,
          userName,
        });
      }
    });

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });

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
      const input = resultSubmitSchema.parse(req.body);
      const userId = req.user.claims.sub;

      const result = await persistTestResult(userId, input);
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
      res.setHeader("Cache-Control", "no-store");
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/results/beacon",
    isAuthenticated,
    express.text({ type: "*/*" }),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const raw = typeof req.body === "string" ? req.body : "";
        if (!raw) {
          return res.status(400).json({ message: "Empty payload" });
        }

        const parsed = JSON.parse(raw);
        const input = resultSubmitSchema.parse(parsed);
        await persistTestResult(userId, input);
        return res.status(204).end();
      } catch (error) {
        return res.status(400).json({ message: "Invalid beacon payload" });
      }
    },
  );

  // Notifications Routes
  app.get(api.notifications.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.notifications.unreadCount.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.notifications.read.path, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.notifications.readAll.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.notifications.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.notifications.create.path, isAuthenticated, async (req: any, res) => {
    try {
      // For demo, allow any authenticated user to create a notification
      const notification = await storage.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Settings & Sessions Routes
  app.get("/api/settings/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUser(userId, {});
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/settings/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = req.body;
      const updatedUser = await storage.updateUser(userId, data);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/upload", isAuthenticated, async (req: any, res) => {
    try {
      const dataUrl = typeof req.body?.dataUrl === "string" ? req.body.dataUrl : "";
      if (!dataUrl.startsWith("data:image/")) {
        return res.status(400).json({ message: "Invalid image payload" });
      }

      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ message: "Malformed image payload" });
      }

      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const base64 = match[2];
      const buffer = Buffer.from(base64, "base64");
      if (buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "Image must be <= 2MB" });
      }

      const uploadDir = path.resolve(process.cwd(), "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filename = `avatar-${req.user.claims.sub}-${Date.now()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);

      return res.status(201).json({ url: `/uploads/${filename}` });
    } catch (_error) {
      return res.status(500).json({ message: "Upload failed" });
    }
  });

  app.get("/api/settings/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/settings/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteUserSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/settings/security-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getSecurityLogs(userId, 10);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [results, goals, sessions] = await Promise.all([
        storage.getTestResults(userId),
        storage.getLearningGoals(userId),
        storage.getUserSessions(userId)
      ]);
      
      res.json({
        user: req.user.claims,
        testResults: results,
        learningGoals: goals,
        sessions: sessions
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Messaging Routes
  app.get(api.conversations.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.conversations.messages.path, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessages(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.conversations.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const { participantIds } = req.body;
      const conversation = await storage.createConversation(participantIds);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.conversations.sendMessage.path, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { content, messageType } = req.body;
      
      const message = await storage.createMessage({
        conversationId: id,
        senderId: userId,
        content,
        messageType: messageType || "text",
        isRead: false,
      });

      // Emit socket event
      if (io) {
        io.to(`conversation:${id}`).emit("message:new", message);
        // Also notify users in their rooms for unread counts etc
        const participants = await storage.getConversationParticipants(id);
        participants.forEach(p => {
          if (p.userId !== userId) {
            io?.to(`user:${p.userId}`).emit("message:received", message);
          }
        });
      }

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.conversations.read.path, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      await storage.markMessagesRead(id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.messages.unreadCount.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Settings Routes
  app.patch("/api/settings/appearance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { theme, fontSize, accentColor, language } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        theme,
        fontSize,
        accentColor,
        language,
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/settings/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/settings/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getLearningGoals(userId);
      res.json(goals || { examTypes: [], targetScores: {}, examDates: {}, dailyHours: 1.5 });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/settings/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.upsertLearningGoals(userId, req.body);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Routes (MVP)
  app.post("/api/ai/writing/score", isAuthenticated, async (req: any, res) => {
    try {
      const input = aiWritingScoreSchema.parse(req.body);
      const result = scoreWritingEssay(input.essay);
      res.json({
        mode: input.mode,
        ...result,
        scoredAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/ai/study-plan/generate", isAuthenticated, async (req: any, res) => {
    try {
      const input = aiStudyPlanSchema.parse(req.body);
      const plan = generateStudyPlan(input);
      res.json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ai/weakness", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const examType = String(req.query.examType || "IELTS");
      const [results, topics] = await Promise.all([
        storage.getTestResults(userId),
        storage.getTopicProgress(userId, examType),
      ]);

      const recent = results.slice(0, 5);
      const averageScore = recent.length
        ? Math.round(
            (recent.reduce((acc, r) => acc + (r.score / Math.max(1, r.totalQuestions)) * 100, 0) / recent.length) * 10,
          ) / 10
        : 0;

      const weakTopics = topics
        .map((t) => {
          const done = Math.max(1, t.questionsDone || 0);
          const accuracy = Math.round(((t.questionsCorrect || 0) / done) * 100);
          return {
            topic: t.topic,
            subject: t.subject,
            accuracy,
            needReview: accuracy < 70,
          };
        })
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

      const fallbackWeak = [
        { topic: "Xác suất thống kê", subject: "Toán", accuracy: 52, needReview: true },
        { topic: "Paraphrase", subject: "IELTS Writing", accuracy: 58, needReview: true },
        { topic: "Reading inference", subject: "IELTS Reading", accuracy: 61, needReview: true },
      ];

      const finalWeak = weakTopics.length > 0 ? weakTopics : fallbackWeak;

      const radar = finalWeak.map((item) => ({
        skill: `${item.subject}: ${item.topic}`,
        score: item.accuracy,
      }));

      const recommendedExercises = finalWeak.slice(0, 3).map((item) => ({
        title: `Bạn đang yếu phần ${item.topic}`,
        action: `Làm 10 câu ${item.topic} mức cơ bản trước, sau đó làm 1 mini test timed.`,
      }));

      res.json({
        examType,
        basedOnAttempts: recent.length,
        averageScore,
        weakTopics: finalWeak,
        recommendedExercises,
        radar,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Profile Routes
  app.get("/api/profile/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/profile/:username", isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserById(username);
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
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

    // Seed sample notifications for demo users
    const demoUserIds = ["user123", "demo-user"]; // Example IDs, in a real app we'd get actual users
    for (const userId of demoUserIds) {
      const existingNotifications = await storage.getNotifications(userId);
      if (existingNotifications.length === 0) {
        console.log(`Seeding notifications for user ${userId}...`);
        await storage.createNotification({
          userId: userId as string,
          type: "study",
          title: "Sẵn sàng cho bài học mới?",
          body: "Bạn đã không học trong 2 ngày rồi. Hãy quay lại ôn tập nhé!",
          actionLink: "/practice",
          isRead: false,
        });
        await storage.createNotification({
          userId,
          type: "achievement",
          title: "Thành tích mới!",
          body: "Chúc mừng! Bạn đã hoàn thành 5 bài thi thử IELTS.",
          actionLink: "/history",
          isRead: false,
        });
        await storage.createNotification({
          userId,
          type: "system",
          title: "Cập nhật hệ thống",
          body: "EduPro vừa cập nhật thêm 10 đề thi THPTQG mới nhất.",
          actionLink: "/exams/thptqg",
          isRead: false,
        });
        await storage.createNotification({
          userId,
          type: "account",
          title: "Nâng cấp Premium",
          body: "Gói Premium của bạn sắp hết hạn. Gia hạn ngay để nhận ưu đãi.",
          actionLink: "/profile",
          isRead: true,
        });
        await storage.createNotification({
          userId: userId as string,
          type: "study",
          title: "Lịch học hôm nay",
          body: "Hôm nay bạn có lịch ôn tập Reading 1 lúc 14:00.",
          isRead: false,
        });
        await storage.createNotification({
          userId,
          type: "achievement",
          title: "Cố gắng lên!",
          body: "Bạn chỉ còn 1 bài học nữa là đạt streak 7 ngày.",
          isRead: false,
        });
      }
    }

    // Seed sample conversation
    const supportUserId = "support-bot";
    for (const userId of demoUserIds) {
      const userConversations = await storage.getConversations(userId);
      if (userConversations.length === 0) {
        console.log(`Seeding conversation for user ${userId}...`);
        const conversation = await storage.createConversation([userId, supportUserId]);
        
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: supportUserId,
          content: "Chào mừng bạn đến với EduPro! Tôi có thể giúp gì cho bạn hôm nay?",
          messageType: "text",
          isRead: false,
        });

        await storage.createMessage({
          conversationId: conversation.id,
          senderId: userId,
          content: "Tôi muốn hỏi về lộ trình học IELTS.",
          messageType: "text",
          isRead: true,
        });

        await storage.createMessage({
          conversationId: conversation.id,
          senderId: supportUserId,
          content: "Tất nhiên rồi! Bạn đã thi thử để đánh giá trình độ hiện tại chưa?",
          messageType: "text",
          isRead: false,
        });
      }
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
  const resultSubmitSchema = api.results.submit.input.extend({
    timeSpentSeconds: z.number().int().nonnegative().optional(),
    startedAt: z.string().datetime().optional(),
  });

  const persistTestResult = async (userId: string, input: z.infer<typeof resultSubmitSchema>) => {
    const result = await storage.createTestResult({
      testId: input.testId,
      score: input.score,
      totalQuestions: input.totalQuestions,
      answers: input.answers,
      userId,
    });

    await storage.createExamAttempt({
      userId,
      examId: input.testId,
      totalQuestions: input.totalQuestions,
      correctAnswers: input.score,
      score: input.score,
      submittedAt: new Date(),
      timeSpentSeconds: input.timeSpentSeconds,
    });

    return result;
  };
