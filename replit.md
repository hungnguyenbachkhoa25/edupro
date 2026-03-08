# EduPro — Learning Portal

## Overview

EduPro is a Vietnamese exam preparation platform that helps students practice for major standardized tests including IELTS, SAT, ĐGNL (Đánh Giá Năng Lực), and THPTQG (Tú Tài Quốc Gia). The platform provides:

- Multi-level exam navigation with breadcrumb UX
- Timed test sessions with answer tracking and confetti on completion
- Dashboard with progress charts and streak tracking
- Test history and result review
- Real-time messaging (Socket.io)
- Notification system (bell + full page)
- User authentication via Replit OpenID Connect

The app targets Vietnamese high school and university entrance exam candidates.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side routing)
- **State / Data fetching**: TanStack React Query v5 — all server state goes through query/mutation hooks; no Redux
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives
- **Styling**: Tailwind CSS v3 with CSS variables for theming; dark mode via `next-themes`; custom fonts (`Plus Jakarta Sans` for body, `Outfit` for display)
- **Forms**: React Hook Form + Zod validation via `@hookform/resolvers`
- **Charts**: Recharts (bar/line charts on dashboard)
- **WebSockets**: socket.io-client — singleton socket in `client/src/lib/socket.ts`, consumed via `useSocket` hook
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

Key pages and their roles:
| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Public marketing page |
| `/dashboard` | Dashboard | Protected; shows stats + chart |
| `/practice` | Practice Library | Filter tests by category |
| `/practice/:id` | TestSession | Timed test with navigator |
| `/history` | History | Past results |
| `/exams` | ExamHub | Multi-level exam navigator |
| `/exams/dgnl` | DgnlNav | ĐGNL sub-navigator |
| `/exams/thptqg` | ThptqgNav | THPT sub-navigator |
| `/exams/ielts` | IeltsNav | IELTS sub-navigator |
| `/exams/sat` | SatNav | SAT sub-navigator |
| `/notifications` | Notifications | Full notifications page |
| `/settings` | SettingsIndex | Redirects to /settings/profile |
| `/settings/profile` | ProfileSettings | Edit personal info, avatar, bio |
| `/settings/appearance` | AppearanceSettings | Theme, font size, accent color, language |
| `/settings/notifications` | NotificationsSettings | In-app and email notification toggles |
| `/settings/goals` | GoalsSettings | Exam targets, score goals, daily hours slider |
| `/settings/billing` | BillingSettings | Plan info, tier comparison, upgrade/renew |
| `/settings/security` | SecuritySettings | Active sessions, security logs, 2FA (coming) |
| `/settings/account` | AccountSettings | Data export, account deletion |
| `/profile/:username` | ProfilePage | Public profile with stats, tabs, badges |

All routes under `/dashboard`, `/practice`, `/history`, `/exams`, `/notifications`, `/settings`, `/profile` are wrapped in `ProtectedRoute` — unauthenticated users are redirected to `/`.

### Backend

- **Runtime**: Node.js with Express (TypeScript via `tsx` in dev, esbuild bundle in prod)
- **HTTP Server**: `http.createServer(app)` — shared between Express and Socket.io
- **API pattern**: REST; routes registered in `server/routes.ts`; shared route schema in `shared/routes.ts` (Zod-typed)
- **Storage layer**: `server/storage.ts` exposes an `IStorage` interface backed by Drizzle ORM queries — easy to swap implementations
- **WebSockets**: Socket.io server on `/socket.io` path; rooms per user (`user:<id>`) and per conversation (`conversation:<id>`); typing indicators supported
- **Session management**: `express-session` with PostgreSQL store (`connect-pg-simple`); sessions stored in `sessions` table
- **Auth**: Replit OpenID Connect via `passport` + `openid-client`; isolated in `server/replit_integrations/auth/`
- **Build**: `script/build.ts` runs Vite for client then esbuild for server; selected server deps bundled (axios, drizzle-orm, express, pg, stripe, etc.) to reduce cold start syscalls

### Data Layer

- **ORM**: Drizzle ORM (PostgreSQL dialect)
- **Database**: PostgreSQL (connection via `DATABASE_URL` env var)
- **Schema location**: `shared/schema.ts` (main app tables) + `shared/models/auth.ts` (auth tables)
- **Migrations**: `drizzle-kit push` (schema push workflow, not migration files)

Core tables:
| Table | Purpose |
|---|---|
| `sessions` | Express session store (required by Replit Auth) |
| `users` | User accounts (plan, streak, targetScore) |
| `practice_tests` | Test metadata (category, type, duration, isPremium) |
| `questions` | Questions belonging to a test |
| `test_results` | Submitted attempt results per user |
| `notifications` | Per-user notification records |
| `conversations` | Chat conversation records |
| `conversation_participants` | Many-to-many users ↔ conversations |
| `messages` | Chat messages |
| `exam_attempts` | Exam-specific attempt tracking |
| `topic_progress` | Per-user topic progress for "study by topic" mode |
| `user_sessions` | Active login sessions per user (device, browser, IP, last active) |
| `security_logs` | Security events per user (logins, etc.) |
| `learning_goals` | Per-user exam goals (exam types, target scores, dates, daily hours) |

### Auth & Authorization

- **Provider**: Replit OIDC (`https://replit.com/oidc`)
- **Strategy**: `openid-client/passport` Strategy; tokens stored in session
- **Session**: PostgreSQL-backed, 1-week TTL, `httpOnly + secure` cookies
- **Guard**: `isAuthenticated` middleware (exported from `server/replit_integrations/auth/`) applied to protected API routes
- **Frontend guard**: `ProtectedRoute` component checks `useAuth()` (queries `/api/auth/user`); redirects to `/` on 401
- **User upsert**: On login callback, user record is upserted into `users` table via `authStorage.upsertUser()`

### Exam Navigation System

The exam hub (`/exams`) uses a multi-level navigation pattern:
- Level 1: Choose exam type (ĐGNL, THPTQG, IELTS, SAT)
- Level 2+: Exam-specific sub-navigation (by year, by topic, by subject, etc.)
- Breadcrumb component (`BreadcrumbNav`) shows the user's path at every level
- Routes follow the pattern `/exams/<exam-type>/[...sub-levels]`

---

## External Dependencies

### Infrastructure / Hosting
- **Replit** — hosting platform; provides `REPL_ID`, `ISSUER_URL` env vars used for OIDC auth
- **PostgreSQL** — provisioned database; connection string in `DATABASE_URL`

### Authentication
- **Replit OpenID Connect** (`https://replit.com/oidc`) — identity provider; no other OAuth providers configured
- `openid-client`, `passport`, `passport-local`, `express-session`, `connect-pg-simple` — auth/session stack

### Frontend Libraries
| Library | Purpose |
|---|---|
| `@tanstack/react-query` | Server state management and caching |
| `wouter` | Client-side routing |
| `recharts` | Dashboard charts |
| `canvas-confetti` | Celebration effect on test completion |
| `socket.io-client` | Real-time messaging |
| `next-themes` | Dark/light mode |
| `date-fns` | Date formatting (Vietnamese locale used) |
| `react-hook-form` + `zod` | Form handling and validation |
| Radix UI (all primitives) | Accessible headless UI components |
| shadcn/ui | Pre-built component layer on top of Radix |
| `embla-carousel-react` | Carousel component |
| `vaul` | Drawer component |
| `cmdk` | Command palette |
| `input-otp` | OTP input |

### Backend Libraries
| Library | Purpose |
|---|---|
| `drizzle-orm` + `drizzle-kit` | ORM and schema management |
| `pg` | PostgreSQL driver |
| `socket.io` | WebSocket server |
| `express` | HTTP server framework |
| `express-session` | Session middleware |
| `connect-pg-simple` | PostgreSQL session store |
| `passport` + `openid-client` | OIDC authentication |
| `memoizee` | Memoize OIDC config discovery |
| `nanoid` | ID generation |
| `zod` | Schema validation |
| `multer` | File uploads (present in build allowlist) |
| `nodemailer` | Email sending (present in build allowlist) |
| `stripe` | Payments (present in build allowlist) |
| `openai` / `@google/generative-ai` | AI features (present in build allowlist) |
| `xlsx` | Excel file processing (present in build allowlist) |
| `ws` | WebSocket support (present in build allowlist) |

### Replit Dev Plugins (dev only)
- `@replit/vite-plugin-runtime-error-modal` — overlay for runtime errors
- `@replit/vite-plugin-cartographer` — file map
- `@replit/vite-plugin-dev-banner` — dev info banner
- `@replit/connectors-sdk` — Replit connectors integration