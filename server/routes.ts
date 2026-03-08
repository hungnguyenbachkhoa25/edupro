import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | undefined;

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
