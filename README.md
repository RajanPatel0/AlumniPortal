<div align="center">

# I.K. Gujral Punjab Technical University — Alumni Connect Network

### High-Throughput, Multi-Tenant State University Alumni Management & Engagement Platform

[![Production Live](https://img.shields.io/badge/Production-Live-003D7A?style=for-the-badge&logo=google-chrome&logoColor=white)](https://alumni.ptu.ac.in)
[![Next.js](https://img.shields.io/badge/Next.js_14%2F15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL Enterprise](https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sentry Observability](https://img.shields.io/badge/Sentry-Error_Tracking-362D59?style=for-the-badge&logo=sentry&logoColor=white)](https://sentry.io/)
[![Vercel / Edge](https://img.shields.io/badge/Deployment-Vercel%20Edge-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 1. Executive Summary & Scale

**Alumni Connect** is the official enterprise alumni engagement and career network for **I.K. Gujral Punjab Technical University (IKGPTU)**. Built to replace legacy disconnected silos, the platform unifies administrative and student records across **6 constituent university campuses** (Jalandhar Main, Mohali I & II, Amritsar, Hoshiarpur, and Batala) and **250+ affiliated colleges** under a single multi-tenant data architecture.

### Core Problems Solved at State University Scale

- **Dirty Legacy Data Ingestion** — Cleaned, deduplicated, and normalized over 1,840+ historical alumni records spanning 40+ branch/degree naming variations down to 11 canonical academic branches and 9 degree programs.
- **Unverified Identity Mitigation** — Implemented a two-tier registration staging pipeline with document proof verification (`idProffUrl`), preventing unverified account creation.
- **Zero-Timeout Broadcast Scaling** — Re-engineered mass announcements from blocking synchronous database writes to an asynchronous **Keyset-Batched Campaign Worker** capable of delivering in-app alerts to **10,000+ accounts in 2.39 seconds** (~115ms per 500-batch).
- **Institutional Sovereignty** — Purposefully architected for university on-premise infrastructure, eliminating costly recurring SaaS dependencies through self-hosted asset streaming and connection-pooled Microsoft 365 SMTP relays.

---

## 2. Monorepo Architecture & Directory Structure

This repository is organized as a unified full-stack monorepo leveraging Next.js App Router, where API edge route handlers, long-running batch workers, client-side rendering engines, and schema contracts live in a single cohesive repository:

```
AlumniPortal/
├── prisma/
│   ├── schema.prisma              # 30+ relational models, compound indexes, enum definitions
│   ├── seed-academic-options.js   # Idempotent canonical branch/course normalization seed
│   └── seed-events.ts             # University calendar & placement drive mock data
├── public/
│   ├── india_boundary_corrections.pmtiles  # Vector tile boundaries for GIS map
│   └── sw.js                      # Web Push Service Worker (VAPID push handler)
├── scripts/
│   ├── campaign-worker.ts         # Asynchronous keyset cursor worker daemon (HTTP 9099 listener)
│   ├── load-test-campaign.ts      # 10,000-user notification fan-out benchmark harness
│   └── install-service.js         # PM2/Windows background daemon installer
├── src/
│   ├── actions/                   # Type-safe Next.js Server Actions (Mutations & Revalidations)
│   │   ├── events.ts              # Event creation, RSVP management, and landing page spotlighting
│   │   ├── jobs.ts                # Placement drive posting, application export pipelines
│   │   └── communities.ts         # Campus hub discussions, polls, and document distribution
│   ├── app/
│   │   ├── admin/                 # Protected Admin Portal (RBAC, Campus Scoping, Data Normalization)
│   │   │   ├── (dashboard)/       # Module-scoped administrative sub-views
│   │   │   └── auth/              # Admin OTP two-step verification & login
│   │   ├── alumni/                # Protected Alumni Social Portal
│   │   │   ├── (protected)/       # Directory, Geolocation Map, Yearbook, Hubs, Career Feeds
│   │   │   ├── forgot-password/   # Enumeration-safe SHA-256 token password recovery
│   │   │   └── register/          # Multi-step staging registration with college verification
│   │   ├── api/                   # RESTful Route Handlers (Edge & Serverless API routes)
│   │   │   ├── admin/             # Campus-isolated endpoints, batch normalization, batch CSV imports
│   │   │   ├── alumni/            # Fast-path queries: company autocomplete, map bounding box
│   │   │   └── uploads/           # Self-hosted file streaming route with MIME-type verification
│   │   └── layout.tsx             # Root layout with TanStack Query & Sentry telemetry
│   ├── components/                # Modular React 19 UI component system
│   │   ├── admin/                 # Master data management & normalization merge modals
│   │   ├── alumni/                # Infinite-scrolling notification bell, profile timeline modals
│   │   ├── map/                   # Leaflet + Supercluster geospatial clustering map
│   │   └── CompanyAutocomplete.tsx # Debounced 350ms corporate entity deduplication input
│   ├── lib/                       # Core Backend Services & Business Logic
│   │   ├── academic-options.ts    # Deterministic BCA/MCA branch auto-correction rules
│   │   ├── api.ts                 # Base-path agnostic client fetch wrapper (apiFetch)
│   │   ├── brevo.ts               # Single-socket pooled SMTP transporter (maxConnections: 1)
│   │   ├── company-utils.ts       # 38-variant unemployed/undisclosed company collapsing logic
│   │   ├── prisma.ts              # GlobalThis singleton Prisma client (connection pool protection)
│   │   └── rate-limit.ts          # Edge-compatible sliding-window in-memory rate limiter
│   └── middlewares/                # Dual JWT cookie verification & campus scoping routing
├── .env.example                   # Complete specification of required environment variables
├── next.config.ts                 # Subpath routing (basePath) & Sentry source-map tunnel
├── package.json                   # Dependencies, build scripts, worker runners
└── tsconfig.json                  # Strict TypeScript 5 compiler configuration
```

---

## 3. Deep-Dive Engineering Highlights

### A. Multi-Tenant Campus Isolation & Normalized Relational Schema

The database schema (`prisma/schema.prisma`) enforces strict tenant boundaries across disparate campuses while maintaining a single unified codebase:

- **Campus-Scoped ACLs** — Every record (Alumni, Staff, RegistrationRequest, Community) has an indexed foreign key referencing `Campus.id`.
- **Enforced Sub-Admin Boundaries** — When a campus coordinator (`StaffRole.SUB_ADMIN`) logs in, administrative route handlers execute `resolveCampusScope(staff)`, automatically appending `WHERE campusId = staff.campusId` to prevent cross-campus data leakage.
- **Master Lookup Normalization** — Solved decades of free-text typos via the `AcademicOption` master table. Raw variants (`"CSE"`, `"Comp Sci & Engg"`) are mapped to canonical strings (`"Computer Science and Engineering"`) using atomic batch transactions.

### B. Keyset Cursor Pagination vs. Traditional Offset/Limit

Standard SQL pagination (`OFFSET 10000 LIMIT 20`) causes linear disk scans — **O(N)** — degrading database I/O on large tables. We implemented **Keyset Cursor Pagination** across all high-throughput endpoints (Notifications, Feeds, Directory):

```sql
-- High-Performance Keyset Cursor Query (Executed via Prisma)
SELECT * FROM notifications
WHERE targetUserId = 'clx123...' AND id > 'cursor_clx999...'
ORDER BY id ASC LIMIT 20;
```

**Performance Impact:** Lookups leverage the Primary Key B-Tree index directly (**O(log N)** sequential seek), maintaining sub-15ms response times even when paginating past tens of thousands of records.

### C. Unified Asynchronous Notification Pipeline

Mass notifications avoid blocking HTTP request threads through an asynchronous, event-driven worker:

- **Admin Dispatch** — Creating an announcement writes a single row to `NotificationCampaign` and fires an internal non-blocking HTTP nudge (`POST http://127.0.0.1:9099/nudge`) returning in < 50ms.
- **Batch Cursor Worker** — The standalone worker daemon (`scripts/campaign-worker.ts`) wakes up, pulls targeted alumni in 500-record chunks using keyset cursor pagination (`id > campaign.cursor`), and bulk-inserts alerts.
- **Idempotency Guarantee** — Backed by a MySQL compound unique index `@@unique([userId, campaignId])`. If a worker dies mid-flight, a retry skips already-delivered alerts with zero duplicates.
- **VAPID Web Push** — Encrypts notifications via RFC 8292 (P-256 elliptic-curve) and dispatches to registered browser push subscriptions, automatically pruning HTTP 404/410 dead endpoints.

### D. Concurrency-Controlled, Rate-Throttled SMTP Engine

To prevent university domain blacklisting and SMTP connection rejections (`421 4.7.0 Rate limit exceeded`):

- **Single-Socket Connection Pooling** — Nodemailer is configured with `pool: true` and `maxConnections: 1`, keeping one persistent socket open to Microsoft 365 / Brevo SMTP rather than opening hundreds of concurrent handshakes.
- **Inter-Message Throttling** — Batch email invites enforce an explicit 2,100ms delay between dispatches (`await delay(2100)`), perfectly capping outbound mail at ~28 emails/minute to respect strict ISP rate ceilings.


---

## 4. Environment Variables Specification

Create a local `.env` file in the project root:

```env
# ==============================================================================
# DATABASE CONFIGURATION (MySQL 8.0)
# ==============================================================================
DATABASE_URL="mysql://root:password@127.0.0.1:3306/alumni_portal"

# ==============================================================================
# LOCAL ASSET STORAGE
# ==============================================================================
UPLOAD_DIR="./uploads"

# ==============================================================================
# AUTHENTICATION TOKENS (Generate using: openssl rand -base64 32)
# ==============================================================================
STAFF_ACCESS_TOKEN_SECRET="generate-a-secure-secret-key-32-chars-long"
ACCESS_TOKEN_EXPIRY="15m"
STAFF_REFRESH_TOKEN_SECRET="generate-a-secure-secret-key-32-chars-long"
REFRESH_TOKEN_EXPIRY="7d"
ALUMNI_ACCESS_TOKEN_SECRET="generate-a-secure-secret-key-32-chars-long"
ALUMNI_REFRESH_TOKEN_SECRET="generate-a-secure-secret-key-32-chars-long"
OTP_TOKEN_SECRET="generate-a-secure-secret-key-32-chars-long"
OTP_TOKEN_EXPIRY="10m"
NEXTAUTH_SECRET="generate-a-secure-secret-key-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_PATH=""

# ==============================================================================
# INSTITUTIONAL SMTP (Office 365 / Brevo / Gmail)
# ==============================================================================
MAIL_MAILER="smtp"
MAIL_HOST="smtp.office365.com"
MAIL_PORT="587"
MAIL_USERNAME="alumni@ptu.ac.in"
MAIL_PASSWORD="your-strong-app-password"
MAIL_ENCRYPTION="tls"
MAIL_FROM_ADDRESS="alumni@ptu.ac.in"
MAIL_FROM_NAME="Alumni Connect IKG PTU Kapurthala"

# ==============================================================================
# OAUTH 2.0 CREDENTIALS
# ==============================================================================
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# ==============================================================================
# WEB PUSH VAPID KEYS (Generate using: npx web-push generate-vapid-keys)
# ==============================================================================
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"

# ==============================================================================
# SENTRY OBSERVABILITY
# ==============================================================================
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
SENTRY_MONITOR_TOKEN="your-sentry-monitor-token"

# ==============================================================================
# RUNTIME SWITCHES
# ==============================================================================
DEV_MODE=false
```

---

## 5. Zero-to-One Local Development Setup

**1. Clone & Install Dependencies**

```bash
git clone https://github.com/RajanPatel0/AlumniPortal.git
cd AlumniPortal/Ptumni-main
npm install
```

**2. Configure Local Database & Run Migrations**

```bash
# Copy and update environment variables
cp .env.example .env

# Generate Prisma Client & deploy database schema
npx prisma generate
npx prisma migrate deploy

# Seed Canonical Academic Master Options (Idempotent seed)
npm run seed-academic
```

**3. Launch Development Server & Background Worker**

```bash
# Terminal 1: Start Next.js App Router server
npm run dev

# Terminal 2: Start Keyset Campaign Worker Daemon
npm run worker
```

- Access Portal: `http://localhost:3000`
- Access Admin Dashboard: `http://localhost:3000/admin`
