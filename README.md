# EduPro - Educational Test Preparation Platform

  A full-stack web application for IELTS, SAT, DGNL, and THPTQG test preparation.

  ## Local Run (No Replit Required)
  Create `.env` with:

  ```env
  DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
  SESSION_SECRET=<any-long-random-string>
  PORT=5000
  ```

  Then run:
  ```bash
  npm run db:push
  npm run dev
  ```

  ## Tech Stack
  - **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
  - **Backend**: Node.js, Express, TypeScript
  - **Database**: PostgreSQL with Drizzle ORM
  - **Auth**: Replit Auth (OpenID Connect)

  ## Features
  - Practice tests for IELTS, SAT, DGNL, THPTQG
  - Timed test sessions
  - Dashboard analytics with progress tracking
  - Subscription tiers: Free, Pro (99k), Premium (199k)
  
