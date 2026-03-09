import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

type AuthUserClaims = {
  sub: string;
};

type AuthUser = {
  claims: AuthUserClaims;
  expires_at: number;
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

async function upsertLocalUser(
  id: string,
  payload: {
    email?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  },
) {
  const now = new Date();
  const [user] = await db
    .insert(users)
    .values({
      id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      username: payload.username,
      profileImageUrl: payload.profileImageUrl,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        username: payload.username,
        profileImageUrl: payload.profileImageUrl,
        updatedAt: now,
      },
    })
    .returning();

  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.get("/api/login", async (req, res) => {
    try {
      const redirectTo =
        typeof req.query.redirect === "string" && req.query.redirect.startsWith("/")
          ? req.query.redirect
          : "/dashboard";

      const existingUserId = req.session.userId;
      if (existingUserId) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, existingUserId))
          .limit(1);
        if (existingUser) {
          return res.redirect(redirectTo);
        }
      }

      const userId = `user_${nanoid(12)}`;
      const email = `demo_${userId}@edupro.local`;
      const username = `student_${userId.slice(-6)}`;

      const user = await upsertLocalUser(userId, {
        email,
        firstName: "EduPro",
        lastName: "Student",
        username,
      });

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Failed to persist session:", err);
          return res.status(500).json({ message: "Failed to login" });
        }
        return res.redirect(redirectTo);
      });
    } catch (error) {
      console.error("Login failed:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const firstName =
        typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "EduPro";
      const lastName =
        typeof req.body?.lastName === "string" ? req.body.lastName.trim() : "Student";

      if (!email) {
        return res.status(400).json({ message: "email is required" });
      }

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const userId = existing?.id || `user_${nanoid(12)}`;
      const username =
        typeof req.body?.username === "string" && req.body.username.trim()
          ? req.body.username.trim()
          : existing?.username || `student_${userId.slice(-6)}`;

      const user = await upsertLocalUser(userId, {
        email,
        firstName,
        lastName,
        username,
        profileImageUrl:
          typeof req.body?.profileImageUrl === "string"
            ? req.body.profileImageUrl
            : existing?.profileImageUrl || undefined,
      });

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Failed to persist session:", err);
          return res.status(500).json({ message: "Failed to login" });
        }
        return res.json(user);
      });
    } catch (error) {
      console.error("Credential login failed:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/callback", (_req, res) => {
    // Keep this endpoint for backward compatibility with old links.
    res.redirect("/api/login");
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout failed:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    req.session.destroy(() => undefined);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const authUser: AuthUser = {
    claims: { sub: user.id },
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  (req as any).user = authUser;
  return next();
};
