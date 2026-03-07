import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { storage } from "../../storage";

async function seedWelcomeNotifications(userId: string) {
  try {
    const existing = await storage.getNotifications(userId);
    if (existing.length > 0) return;

    const notifications = [
      {
        userId,
        type: "system" as const,
        title: "Chào mừng đến với EduPro! 🎉",
        body: "Bắt đầu hành trình ôn luyện của bạn. Hãy chọn kỳ thi và thử ngay bài thi đầu tiên!",
        actionLink: "/exams",
        isRead: false,
      },
      {
        userId,
        type: "study" as const,
        title: "Bài thi mới được thêm",
        body: "EduPro vừa cập nhật thêm 10 đề thi THPTQG và ĐGNL mới nhất năm 2024.",
        actionLink: "/exams",
        isRead: false,
      },
      {
        userId,
        type: "achievement" as const,
        title: "Mục tiêu đầu tiên",
        body: "Hoàn thành bài thi đầu tiên để nhận huy hiệu 'Khởi đầu'. Cố lên nào!",
        actionLink: "/practice",
        isRead: false,
      },
      {
        userId,
        type: "account" as const,
        title: "Nâng cấp Pro để mở khoá toàn bộ đề thi",
        body: "Gói Pro chỉ 99.000đ/tháng — mở khoá tất cả đề thi premium và theo dõi tiến trình chi tiết.",
        actionLink: "/profile",
        isRead: true,
      },
    ];

    for (const notif of notifications) {
      await storage.createNotification(notif);
    }
  } catch (err) {
    console.error("Failed to seed welcome notifications:", err);
  }
}

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);

      // Seed welcome notifications for new users (async, non-blocking)
      seedWelcomeNotifications(userId);

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
