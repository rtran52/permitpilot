# PermitPilot

**Permit tracking and document management for residential roofing contractors.**

PermitPilot replaces the spreadsheet, the sticky-note pile, and the "did you get that doc yet?" phone call. One place to open a permit case, collect documents from the homeowner by SMS, track what's been received, and move the job through the permit office — from intake to approved permit.

---

## Who It's For

Residential roofing contractors (1–25 office staff) who pull permits in high-volume markets and currently manage their permit pipeline in spreadsheets, whiteboards, or CRM workarounds.

---

## The Problem It Solves

Pulling a roofing permit means collecting 5–8 documents from the homeowner, submitting a packet to the permit office, and managing any corrections that come back — often over weeks, across multiple people. Most small contractors have no system for this. Documents get lost in email. Corrections fall through the cracks. Jobs sit stale because no one knew what was blocking them.

PermitPilot makes the whole process visible, trackable, and actionable.

---

## Core Workflow

```
New Case
  └─ Request documents from homeowner via SMS (magic upload link)
       └─ Homeowner uploads from their phone — no account needed
  └─ Or: office staff uploads documents directly
  └─ Docs Complete → Submit to permit office (record permit number)
       └─ Corrections Required → Log each one, resolve, Resubmit
       └─ Approved → Ready to Start
  └─ On Hold at any stage → Restore with prior-status hint
```

---

## Key Features

- **Case management** — property, homeowner, jurisdiction, job number, notes
- **Document checklist** — auto-populated per county; required vs. optional; live progress bar
- **SMS document requests** — one-time magic link sent to homeowner; no app or account required
- **Batch request** — request all missing required docs in a single SMS
- **Office upload** — staff can upload documents directly on any case
- **Guided status workflow** — step-by-step transitions with validation warnings (e.g. advancing before all docs are in)
- **Corrections tracking** — log permit-office corrections verbatim, resolve individually, auto-advance status on first entry
- **On hold + restore** — pause any case with a required reason; restore hint shows the prior status by name
- **Activity timeline** — unified history of status changes, doc requests, and uploads on every case
- **Case search + filter** — search by address, homeowner name, or city; filter by status
- **Dashboard** — pipeline overview with stale-case alerts (5+ days, excluding cases waiting on the permit office)
- **Settings** — company name, notification rules, supported jurisdictions

---

## MVP Scope and Limitations

**Built:**
- Single company, multiple users (Owner + Office Manager roles)
- Florida jurisdictions — Tampa Bay and major FL counties seeded
- Roofing trade only
- SMS via Twilio; file storage via Cloudflare R2
- Public homeowner upload flow — no Clerk session required

**Not built yet:**
- Email notifications (rules visible in Settings; sends not wired)
- Multi-trade support (HVAC, electrical, etc.)
- Additional states/counties — data-driven, no code change required to add
- Homeowner-facing status portal
- Per-user notification preferences
- Audit log and document export
- Billing and multi-tenant SaaS infrastructure

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Auth | Clerk |
| Database | PostgreSQL + Prisma |
| File storage | Cloudflare R2 (S3-compatible) |
| SMS | Twilio |
| UI | Tailwind CSS + shadcn/ui |
| Hosting | Vercel (recommended) |

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL (local or hosted — [Supabase](https://supabase.com) or [Neon](https://neon.tech) both work)
- [Clerk](https://clerk.com) account
- [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket with public access enabled
- [Twilio](https://twilio.com) account — optional; SMS fails gracefully in local dev

### 1. Clone and install

```bash
git clone https://github.com/your-org/permitpilot.git
cd permitpilot
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root. See **Environment Variables** below for all required values.

### 3. Set up the database

```bash
npm run db:migrate    # apply Prisma migrations
npm run db:seed       # seed Florida jurisdictions and document checklists
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in via Clerk. The first user to sign in is automatically provisioned as **Owner**. No manual company setup required.

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/permitpilot

# Clerk — https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Cloudflare R2 — https://dash.cloudflare.com
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=permitpilot-docs
R2_PUBLIC_URL=https://pub-XXXX.r2.dev

# Twilio — https://console.twilio.com (optional for local dev)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1XXXXXXXXXX

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Clerk Webhook

For multi-user production setups, add a webhook in the Clerk dashboard pointing to:

```
https://your-domain.com/api/webhooks/clerk
```

Subscribe to `user.created`. In local dev, users are auto-provisioned on first sign-in without the webhook.

---

## Scripts

```bash
npm run dev           # start development server
npm run build         # production build
npm run start         # start production server
npm run db:migrate    # run database migrations
npm run db:seed       # seed jurisdictions and document checklists
npm run db:studio     # open Prisma Studio (visual database browser)
```

---

## Demo Notes

- After `db:seed`, county document checklists are available immediately (Hillsborough, Pinellas, Pasco, and others).
- To test the homeowner upload flow: request a document on a case, copy the upload link from the browser network tab or Twilio logs, and open it in an incognito window. No Clerk account required.
- SMS does not send in local dev unless Twilio is configured. Document requests are still recorded and upload links still work.
