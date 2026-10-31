# VinfoNette — Internal Placement Management Portal

An enterprise-grade, full-stack placement operations platform architected for corporate drive tracking, candidate vetting, multi-round interview orchestration, offers, and placement confirmations.

![VinfoNette Logo](/public/vinfonette-logo.png)

---

## 🚀 Key Features

- **10-Stage Placement Pipeline**:
  1. Registered
  2. Training in Progress
  3. Training Completed
  4. Resume Ready
  5. Placement Ready
  6. Applications Submitted
  7. Interview Scheduled
  8. Interview Completed
  9. Offer Received
  10. Placed Successfully (Strict validation: requires verified employer, role, joining date, CTC, and confirmation notes)
  - Secondary statuses: *On Hold*, *Not Interested*, *Rejected*, *Withdrawn*

- **Enterprise Role-Based Access Control (RBAC & RLS)**:
  - **`ADMIN`**: Universal oversight, staff provisioning, RLS management, reports, audits, and configuration.
  - **`PLACEMENT_COORDINATOR`**: Manages assigned candidates, company submissions, interview booking, and follow-ups.
  - **`MANAGEMENT`**: Read-only access to executive dashboards, placement trends, and board-level reports.
  - **`TRAINER`**: Conducts technical mock evaluations, scores curriculum progress, and assigns placement-readiness ratings.

- **Tamper-Evident System Audit Trail**:
  - Automatically captures actor email, operation, entity type, payload changes, and timestamps.
  - Restricted strictly to `ADMIN` and `MANAGEMENT` roles.

- **Protected Resume Storage Vault**:
  - Resumes are stored in a private Supabase bucket (`resumes`).
  - Access is governed by database-enforced Row Level Security with short-lived 60-second signed authorization tokens. Public URLs are permanently blocked.

- **Dual-Mode Architecture**:
  - **Live Supabase Mode**: Real PostgreSQL database with migrations, RLS policies, triggers, and Supabase Auth.
  - **Interactive Demonstration Mode**: Immediate out-of-the-box local testing with 20 synthetic candidates, 5 companies, 8 jobs, 10 interviews, 15 tasks, live charts, and a 1-click persona switcher.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend Framework** | React 18 with TypeScript |
| **Build & Dev Server** | Vite 5 |
| **Styling & Design System** | Tailwind CSS v3 with VinfoNette Brand Tokens |
| **Routing** | React Router v6 |
| **Database & Backend** | Supabase with PostgreSQL (UUID PKs, RLS, DB triggers) |
| **Authentication** | Supabase Auth (Email & Password, Password Recovery) |
| **Private File Storage** | Supabase Storage Private Buckets with Signed URLs |
| **Form Management** | React Hook Form with Zod Schema Validation |
| **Data Visualizations** | Recharts (Placement trends, funnel distribution, salary bands) |
| **Icons** | Lucide React |
| **Unit & Integration Testing** | Vitest with JSDOM |
| **Version Control** | Git |

---

## 📁 Project Directory Structure

```text
vinfonette-portal/
├── public/
│   └── vinfonette-logo.png        # Official VinfoNette logo asset
├── src/
│   ├── assets/                    # Static brand media
│   ├── components/
│   │   ├── candidates/            # Candidate forms, stage change modals, resume vaults
│   │   ├── common/                # Reusable design system (Button, Card, Input, Modal, Badge, DemoBanner)
│   │   ├── interviews/            # Scheduling modals, evaluator feedback forms
│   │   ├── layout/                # AppLayout, Navbar, Sidebar, NotificationCenter
│   │   ├── pipeline/              # 10-stage interactive Kanban board
│   │   └── tasks/                 # Action item modals, task lists
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Session management & persona switcher
│   │   ├── DataContext.tsx        # Unified data layer (Supabase PostgreSQL + local store fallback)
│   │   └── ToastContext.tsx       # Enterprise notification toasts
│   ├── lib/
│   │   ├── demo-data.ts           # 20 synthetic candidates, 5 companies, 8 jobs, 10 interviews, 15 tasks
│   │   ├── storage.ts             # Secure signed download token generator & validator
│   │   ├── supabase.ts            # Supabase client initializer
│   │   ├── types.ts               # Domain TypeScript contracts
│   │   └── utils.ts               # Currency formatting (LPA), date helpers, CSV exporter
│   ├── pages/                     # Complete connected routes
│   │   ├── DashboardPage.tsx
│   │   ├── CandidatesPage.tsx
│   │   ├── CandidateDetailPage.tsx # 9 Profile Tabs (Overview, Training, Apps, Interviews, Offers, Placement, Tasks, Documents, Activity)
│   │   ├── PipelinePage.tsx
│   │   ├── CompaniesPage.tsx
│   │   ├── JobsPage.tsx
│   │   ├── InterviewsPage.tsx
│   │   ├── TasksPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── TeamPage.tsx
│   │   ├── AuditLogsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── App.tsx                    # Route definitions and protected route wrappers
│   ├── index.css                  # Tailwind styles and scrollbar overrides
│   └── main.tsx
├── supabase/
│   └── migrations/
│       ├── 01_schema.sql          # 14 Tables, UUIDs, constraints, updated_at triggers, and indexes
│       ├── 02_rls.sql             # Granular Row Level Security policies and private storage rules
│       └── 03_seed.sql            # Production-grade synthetic development seed script
├── tests/
│   ├── auth.test.ts               # Role authorization test suite
│   ├── pipeline.test.ts           # Placement business validation tests
│   └── utils.test.ts              # Currency & format tests
├── .env.example                   # Environment configuration template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🏃 Local Quickstart & Development

### 1. Prerequisites
- Node.js (v18.0 or newer)
- npm or pnpm

### 2. Install Dependencies
```bash
cd vinfonette-portal
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The portal will launch immediately in **Interactive Demonstration Mode**.

### 4. Test Suite Execution
```bash
# Run unit and authorization logic tests
npm run test

# Run strict TypeScript type verification
npm run lint

# Compile production bundle
npm run build
```

---

## 🔐 Controlled Initial Administrator Setup

To prevent unauthenticated public administrator registration, VinfoNette implements a secure, controlled bootstrapping sequence:

1. In your **Supabase Dashboard**, navigate to **Authentication > Users > Add User**.
2. Create the first user account (e.g. `admin@vinfonette.com` with a strong temporary password).
3. Open the **SQL Editor** in Supabase and execute:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role, status)
   SELECT id, email, 'Rajesh Sharma', 'ADMIN', 'ACTIVE'
   FROM auth.users
   WHERE email = 'admin@vinfonette.com'
   ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
   ```
4. Once created, the administrator can log in and securely invite placement coordinators, technical mentors, and executive management via the **/team** portal interface.

---

## 🗄️ Database Migrations & Supabase Deployment

To deploy the schema onto a live Supabase instance:

1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Apply the migrations in numerical order:
   - Run `supabase/migrations/01_schema.sql` (Creates all 14 core tables, constraints, updated_at triggers, and performance indexes).
   - Run `supabase/migrations/02_rls.sql` (Enables Row Level Security on all tables, creates access control helper functions, and provisions private bucket rules).
   - *(Optional for staging)*: Run `supabase/migrations/03_seed.sql` to populate test data.
4. Copy your project's **URL** and **anon public key** from **Project Settings > API**.
5. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
   ```
6. Re-launch the dev server (`npm run dev`). The portal will automatically detect your live credentials and sync directly with PostgreSQL!

---

## 🛡️ Database Row Level Security (RLS) Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Authenticated staff | Admins only | Self (cannot change own role) or Admin | Admins only |
| `candidates` | Admin/Management (all), Coordinator (assigned/unassigned), Trainer (assigned) | Admin & Coordinator | Admin, Coordinator (assigned), Trainer (assigned) | Admin only |
| `companies` | Authenticated staff | Admin & Coordinator | Admin & Coordinator | Admin only |
| `job_openings` | Authenticated staff | Admin & Coordinator | Admin & Coordinator | Admin only |
| `job_applications`| Authenticated staff | Admin & Coordinator | Admin & Coordinator | Admin only |
| `interviews` | Authenticated staff | Admin, Coordinator, Trainer | Admin, Coordinator, Trainer | Admin only |
| `offers` | Authenticated staff | Admin & Coordinator | Admin & Coordinator | Admin only |
| `placements` | Authenticated staff | Admin & Coordinator | Admin & Coordinator | Admin only |
| `tasks` | Authenticated staff | Authenticated staff | Owner or Admin | Owner or Admin |
| `audit_logs` | Admin & Management only | System / Authenticated | Forbidden | Forbidden |
| `storage.objects` (`resumes`)| Authenticated staff (Signed URLs only) | Coordinator & Admin | Admin only | Admin only |

---

## 🚢 Production Deployment Checklist

- [x] Configure production environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- [x] Apply database migrations `01_schema.sql` and `02_rls.sql` on remote PostgreSQL.
- [x] Verify private storage bucket `resumes` is created with public access turned OFF.
- [x] Run production build (`npm run build`) and confirm bundle compiles without errors.
- [x] Run automated test suite (`npm run test`) and confirm all 12 tests pass.
- [x] Verify responsive layout across mobile and desktop breakpoints.
- [x] Verify password recovery workflow via Supabase Auth email templates.
- [x] Confirm no privileged service-role credentials or database passwords exist in frontend code.
