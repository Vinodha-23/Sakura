# Sakura — Clinical Intelligence Platform

AI-powered clinical intelligence for doctors: patient records, medication safety, insurance validation, and explainable AI.

## Module status

Real free stack — no paid services, no SMS/email messaging:

| Layer | Choice |
|--------|--------|
| Auth | Better Auth (email/password) |
| 2FA | TOTP authenticator app only |
| Database | PostgreSQL (local Docker or Neon free) |
| ORM | Drizzle |
| Hosting (public) | Vercel Hobby (free) |

**Live (DB-backed):** Auth, Dashboard, Patients (CRUD + CSV import + notes + vitals + per-patient clinical viz dashboard), Clinical Alerts, Insurance claims, Documents & OCR (upload + free NVIDIA PaddleOCR on images/txt), AI Assistant (free NVIDIA text + vision, patient-scoped + browser chat memory), Notifications inbox, Settings (org / roles / API keys / audit), Search (patients/alerts/claims/documents).

**Preview / mock UI:** Knowledge Graph (sample + patient-linked from conditions/meds), Analytics, Settings appearance & integration preferences (not persisted yet).

## Quick start (local, free)

### Prerequisites

- Node.js 18+ and npm
- One Postgres option: **Docker Desktop** (local) **or** a free **Neon** account

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` → `.env.local` and fill in your own values. `.env.local` is git-ignored and never committed.

```bash
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
```

Generate a strong `BETTER_AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
DATABASE_URL="postgresql://sakura:sakura@localhost:5432/sakura"
BETTER_AUTH_SECRET="long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEMO_MODE="true"
NVIDIA_API_KEY="nvapi-..."   # optional — free OCR on image uploads (build.nvidia.com)
```

### 3. Database

**Option A — Docker (recommended for local):**

```bash
# Start Docker Desktop first
npm run db:up
npm run db:setup
```

**Option B — Neon free cloud Postgres:**

1. Create a project at https://neon.tech (free)
2. Paste the connection string into `DATABASE_URL` in `.env.local`
3. Run:

```bash
npm run db:setup
```

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000

### Demo login

```
Email:    sarah.chen@memorial-hospital.org
Password: SakuraDemo2026!
```

- Uses **synthetic data only** — no real patient information.
- Override the seeded account by setting `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` before running `npm run db:seed`.
- 2FA is **off** by default so you can enter immediately.
- Enable TOTP later from **Profile → Security** (Google Authenticator / Authy / 1Password).
- Forgot password uses **on-screen temp password** when `DEMO_MODE=true` (no email).

## Auth screens

| Route | Behavior |
|--------|----------|
| `/login` | Real Better Auth sign-in |
| `/verify-2fa` | TOTP / backup code after password if 2FA enabled |
| `/forgot-password` | Demo reset (shows temp password) |
| `/reset-password` | UI (use forgot-password for demo reset) |
| `/session-timeout` | Expired session message |
| `/unauthorized` | Access denied |
| `/dashboard` | Live data from Postgres |

## Deploy publicly for free (Vercel + Neon)

1. Push this repo to GitHub
2. Create free Neon DB → copy `DATABASE_URL`
3. Import project on https://vercel.com (Hobby)
4. Set env vars:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` = your Vercel URL (`https://….vercel.app`)
   - `NEXT_PUBLIC_APP_URL` = same URL
   - `DEMO_MODE=true`
5. Deploy, then run seed once locally against Neon:

```bash
DATABASE_URL="postgresql://…neon…" npm run db:push
DATABASE_URL="postgresql://…neon…" npm run db:seed
```

(Or add a one-off Vercel deploy hook / run seed from your machine against Neon.)

## Scripts

```bash
npm run db:up      # docker compose up -d
npm run db:down    # docker compose down
npm run db:push    # apply schema
npm run db:seed    # demo user + dashboard data
npm run db:setup   # push + seed
npm run dev
```

## Patient CSV import (synthetic / free)

Sakura accepts a **Synthea-style CSV** — no real PHI.

1. Open **Patients → Import CSV**
2. Click **Import sample (15 patients)** or download `/samples/patients-sample.csv`
3. Sakura upserts by MRN and auto-creates medication safety alerts (e.g. Warfarin + Aspirin)

CLI:

```bash
npm run db:import-sample
```

Required columns: `mrn`, `name`, `date_of_birth`  
Optional: `medications`, `conditions`, `allergies`, `risk_level`, `last_visit`, vitals (`blood_pressure`, `heart_rate`, `temperature`, `weight`, `height`, `oxygen_saturation`), etc.

## Out of scope (Module 1)

- SMS / email OTPs (Twilio, Resend, etc.)
- Clerk / Auth0 / Firebase Auth paid plans
- Paid Redis or AI model APIs

## App map

| Area | Status |
|------|--------|
| Dashboard | Live aggregates from Postgres |
| Patients | Live list/create/edit/delete, notes, vitals, CSV import |
| Clinical Alerts | Live resolve/assign |
| Insurance | Live claim status updates |
| Documents | Live upload/list/detail; OCR via free NVIDIA PaddleOCR (images/txt) |
| AI Assistant | Free NVIDIA text + vision with live clinical context + citations |
| Knowledge Graph | Sample default; patient-linked via `?patientId=` |
| Notifications | Persisted inbox (read / archive) |
| Settings | Live org profile, roles, API keys, audit logs |
| Analytics | Mostly preview |
