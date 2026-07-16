# Sakura — Clinical Intelligence Platform

Sakura helps clinicians work faster with patient context in one place: records, medication safety alerts, insurance claims, document OCR, and an AI assistant that answers with citations from the chart.

Everything in this demo uses **synthetic patient data** (no real PHI). The stack is free-tier friendly: Next.js, Postgres, Better Auth, and optional NVIDIA NIM for OCR and chat.

---

## What you can try

| Area | What it does |
|------|----------------|
| **Dashboard** | Today’s patients, open alerts, claim summary |
| **Patients** | Create / edit charts, notes, vitals, CSV import, per-patient clinical charts |
| **Clinical Alerts** | Medication safety flags — assign and resolve |
| **Insurance** | Claims lifecycle (pending → review → approved / rejected) with missing-doc reasons |
| **Documents** | Upload images or text; free NVIDIA OCR extracts text and clinical entities |
| **AI Assistant** | Ask questions with live chart context; open from a patient to stay scoped to that chart |
| **Knowledge Graph** | Explore relationships between conditions, meds, and patients (preview) |
| **Notifications** | Persisted inbox — mark read / archive |
| **Settings** | Org profile, roles, API keys, audit log |

**Still preview UI (not fully wired):** Analytics charts, Settings appearance & integrations preferences.

---
<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/c371df46-8a4d-441b-a2b2-06ec60498155" />


## Quick start

### You need

- [Node.js](https://nodejs.org/) 18+
- Postgres via [Docker Desktop](https://www.docker.com/products/docker-desktop/) **or** a free [Neon](https://neon.tech) database
- (Optional) a free [NVIDIA Build](https://build.nvidia.com) API key for OCR and the AI assistant

### 1. Clone and install

```bash
git clone https://github.com/Vinodha-23/Sakura.git
cd Sakura
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Windows PowerShell: Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://sakura:sakura@localhost:5432/sakura"
BETTER_AUTH_SECRET="paste-a-long-random-secret-here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEMO_MODE="true"
NVIDIA_API_KEY=""   # optional — get free at https://build.nvidia.com
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Without `NVIDIA_API_KEY`, the rest of the app still works — OCR and AI will ask you to add a key when you use them.

### 3. Start the database and seed demo data

**Local Docker (recommended):**

```bash
# Start Docker Desktop first
npm run db:up
npm run db:setup
```

**Or Neon cloud Postgres:** put your Neon connection string in `DATABASE_URL`, then run `npm run db:setup`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in:

| | |
|--|--|
| **Email** | `sarah.chen@memorial-hospital.org` |
| **Password** | `SakuraDemo2026!` |

2FA is off by default. You can enable an authenticator app later under **Profile → Security**.

---

## Suggested walkthrough

1. **Dashboard** — see seeded patients and alerts at a glance.
2. **Patients** — open a chart → **Dashboard** tab for vitals/alerts/claims visualizations → try **AI Assistant** (stays scoped to that patient).
3. **Clinical Alerts** — open a drug-interaction alert and resolve it.
4. **Insurance** — open a rejected claim to see why (missing documents / corrections).
5. **Documents** — upload a PNG/JPG clinical note or receipt; with an NVIDIA key, OCR fills in text and entities.
6. **Patients → Import CSV** — load more synthetic patients from the sample file.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| App | Next.js 15 (App Router) + React 19 |
| Auth | Better Auth (email/password + optional TOTP) |
| Database | PostgreSQL + Drizzle ORM |
| AI / OCR | NVIDIA NIM (free preview endpoints) |
| Charts | Recharts |

---

## Useful commands

```bash
npm run dev              # start the app
npm run db:up            # start local Postgres (Docker)
npm run db:down          # stop local Postgres
npm run db:setup         # apply schema + seed demo data
npm run db:import-sample # import sample Synthea-style CSV
```

---

## Deploy (optional)

A common free setup is **Vercel + Neon**:

1. Create a Neon database and copy `DATABASE_URL`.
2. Import this repo on [vercel.com](https://vercel.com).
3. Set env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` (your `https://….vercel.app` URL), `DEMO_MODE=true`, and optionally `NVIDIA_API_KEY`.
4. From your machine, seed once against Neon:

```bash
# with DATABASE_URL pointing at Neon in .env.local
npm run db:setup
```

---

## Notes

- Demo patients and claims are **synthetic** — safe for demos and screenshots.
- Document OCR works best with **images** (PNG/JPG) or plain **.txt**. PDFs are stored but not OCR’d on the free path yet.
- The AI assistant remembers chat in the browser (per patient scope) so switching tabs does not wipe the conversation.
