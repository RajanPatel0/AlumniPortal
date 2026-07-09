# PTUMNI - Alumni Portal
## Project Overview & Architecture

---

## 📋 Executive Summary

**PTUMNI** is a comprehensive **Alumni Management & Engagement Platform** built for **Punjabi University Patiala (Punjab Technical University - IKG PTU Kapurthala)** to:

- Manage alumni records across multiple campuses
- Facilitate alumni community engagement
- Post and manage events and job opportunities
- Enable alumni networking and professional growth
- Track alumni registrations and communications

**Current Status:** Production-ready application deployed on Vercel with PostgreSQL backend

---

## 🎯 Key Features

### 1. **Multi-Campus Alumni Management**
   - Support for multiple PTU campuses (Jalandhar, Mohali, Amritsar, Hoshiarpur, Batala)
   - Campus-specific admin access and data segmentation
   - Centralized and distributed management models

### 2. **Admin & Sub-Admin Portal**
   - **Admin:** Full system access, can create sub-admins, manage all campuses
   - **Sub-Admin:** Campus-specific access, manage alumni and events for assigned campus
   - Role-based permissions with module-level access control

### 3. **Alumni Registration & Onboarding**
   - CSV/XLSX bulk import of alumni records
   - Invitation email system via Brevo (formerly Sendinblue)
   - Two registration pathways:
     - OAuth (Google & LinkedIn)
     - Manual password-based registration
   - Email verification with OTP

### 4. **Alumni Community Features**
   - Social feed with posts, comments, and likes
   - Event RSVP system (Attending/Maybe/Not Attending)
   - Photo galleries and albums (admin-curated)
   - Networking/Connection requests between alumni
   - Alumni profiles with education & work experience

### 5. **Job Portal**
   - Job postings by admin and verified alumni
   - Job categories: Vacancies & Active Drives
   - Advanced filtering (experience, industry, workplace type, salary)
   - Integration for placement drives

### 6. **Startup Incubation**
   - Alumni startup registration
   - Startup profiles with founding information
   - Business ecosystem showcase

### 7. **Event Management**
   - Event creation by admin and alumni
   - Category-based organization
   - RSVP tracking with attendance insights
   - Email notifications for event announcements

---

## 🏗️ Technology Stack

### **Frontend**
- **Framework:** Next.js 16.2.4 (React 19.2.4)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + PostCSS
- **Forms:** React Hook Form + Zod validation
- **State Management:** Zustand + React Query
- **UI Components:** Lucide React icons
- **Notifications:** React Hot Toast

### **Backend**
- **Runtime:** Node.js (Next.js API Routes)
- **Authentication:** JWT (access + refresh tokens)
- **Email Service:** Brevo API
- **File Upload:** Cloudinary CDN
- **Form Parsing:** Formidable, Multer
- **Password Hashing:** bcryptjs
- **CSV/Excel Processing:** Papa Parse, XLSX

### **Database**
- **Primary:** PostgreSQL (via Supabase)
- **ORM:** Prisma 5.22.0
- **Connection Pooling:** PgBouncer (Supabase connection pooler)
- **Migrations:** Prisma migrate

### **Authentication**
- **OAuth Providers:** Google & LinkedIn (Next-Auth v4)
- **JWT Secrets:** Separate for Admin, Alumni, OTP
- **Token Expiry:** 15m (access), 7d (refresh), 10m (OTP)

### **Deployment**
- **Hosting:** Vercel (serverless)
- **Database:** Supabase PostgreSQL
- **File Storage:** Cloudinary
- **Email:** Brevo SMTP

---

## 📊 Database Overview

### Core Models
- **Staff:** Admin and Sub-admin users
- **Alumni:** Registered alumni with profiles
- **Campus:** Multi-campus organization
- **InvitationBatch:** Bulk CSV import batches
- **Event:** Event listings with RSVP
- **Job:** Job postings and drives
- **RegistrationRequest:** Staged registration approval workflow
- **Post, Like, Comment:** Social feed features
- **Album, AlbumImage:** Photo galleries
- **StartUp:** Startup ecosystem
- **Education, WorkExperience:** Alumni career history
- **Connection:** Alumni networking requests

### Key Enums
- **StaffRole:** ADMIN, SUB_ADMIN, COORDINATOR
- **InviteStatus:** PENDING, INVITED, REGISTERED, BOUNCED
- **BatchStatus:** PROCESSING, UPLOADED, INVITED, COMPLETED, PARTIAL_FAILED
- **RequestStatus:** PENDING, APPROVED, REJECTED
- **ConnectionStatus:** PENDING, ACCEPTED, REJECTED
- **JobCategory:** VACANCY, ACTIVE_DRIVE

---

## 🔐 Authentication Architecture

### **Admin/Staff Authentication**
```
1. Registration with OTP verification via email
2. Login with email + password
3. JWT tokens:
   - Access Token (15m expiry)
   - Refresh Token (7d expiry)
4. Tokens stored in httpOnly cookies
5. Automatic refresh on expiry
```

### **Alumni Authentication**
```
1. OAuth (Google/LinkedIn) OR Manual Registration
2. Invite token validation for manual registration
3. Alumni JWT tokens:
   - Access Token (15m expiry)
   - Refresh Token (7d expiry)
4. Separate token secrets from admin
5. Campus-based access control
```

---

## 📁 Project Structure

```
ptumni/
├── src/
│   ├── app/                    # Next.js pages & API routes
│   │   ├── admin/              # Admin portal pages
│   │   │   ├── (dashboard)/    # Protected dashboard routes
│   │   │   └── auth/           # Admin login/register
│   │   ├── alumni/             # Alumni portal pages
│   │   │   ├── (protected)/    # Protected alumni routes
│   │   │   └── login/          # Alumni login/registration
│   │   ├── api/                # Backend API routes
│   │   │   ├── admin/          # Admin endpoints
│   │   │   └── alumni/         # Alumni endpoints
│   │   └── test/               # Test pages
│   ├── components/             # React components
│   │   ├── landing/            # Public landing page
│   │   ├── jobs/               # Job components
│   │   └── startups/           # Startup components
│   ├── actions/                # Server actions
│   │   ├── events.ts
│   │   ├── jobs.ts
│   │   └── landing-page.ts
│   ├── lib/                    # Utility functions
│   │   ├── auth/               # JWT & auth helpers
│   │   ├── brevo.ts            # Email service
│   │   ├── cloudinary.ts       # File upload
│   │   ├── prisma.ts           # DB client
│   │   ├── import-*.ts         # CSV import logic
│   │   └── rate-limit.ts       # API rate limiting
│   ├── schemas/                # Zod validation schemas
│   ├── types/                  # TypeScript types
│   └── middlewares/            # Next.js middlewares
├── prisma/
│   └── schema.prisma           # Database schema
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🚀 Deployment Architecture

### **Vercel Deployment**
- **Build:** `npm run build` → Next.js compilation
- **Start:** `npm start` → Production server
- **Environment Variables:** Configured in Vercel dashboard

### **Environment Variables Required**

#### Database
```
DATABASE_URL=postgresql://...            # Pooler connection
DIRECT_URL=postgresql://...              # Direct migration connection
```

#### Authentication Secrets
```
STAFF_ACCESS_TOKEN_SECRET=...            # Admin/Staff JWT
STAFF_REFRESH_TOKEN_SECRET=...
ALUMNI_ACCESS_TOKEN_SECRET=...           # Alumni JWT
ALUMNI_REFRESH_TOKEN_SECRET=...
OTP_TOKEN_SECRET=...                     # OTP verification
NEXTAUTH_SECRET=...                      # Next-Auth
```

#### Third-Party Services
```
CLOUDINARY_CLOUD_NAME=...                # File uploads
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

BREVO_API_KEY=...                        # Email service
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=...

GOOGLE_CLIENT_ID=...                     # OAuth
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

#### Configuration
```
NEXTAUTH_URL=http://localhost:3000       # OAuth callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
OTP_TOKEN_EXPIRY=10m
DEV_MODE=false
```

---

## 📊 Data Flow & User Journeys

### **Admin Onboarding**
```
1. Admin clicks Register → /admin/auth/register
2. Fills name, email, password
3. Receives OTP email
4. Verifies OTP
5. Email verified, can now login
6. Login → /admin/auth/login
7. Redirected to /admin/dashboard
```

### **Alumni Bulk Import**
```
1. Admin prepares CSV with alumni data
2. Upload via /admin/import
3. System validates rows (name, email, batch year, branch, college)
4. Creates InvitationBatch record
5. Bulk upserts alumni records
6. Admin can trigger email invitations
7. Alumni receive invite link via Brevo
8. Click link → /alumni/login?token=INVITE_TOKEN
```

### **Alumni Self-Registration (Invited)**
```
1. Alumni receives invite email
2. Clicks link → /alumni/login?token=INVITE_TOKEN
3. Verify token → checks InviteStatus
4. Choose: OAuth OR Manual password registration
5. If OAuth: redirects to Google/LinkedIn
6. If Manual: fill password + password confirmation
7. Creates alumni account with REGISTERED status
8. Auto-login and redirect to /alumni/(protected)/feed
```

### **Alumni Self-Registration (Open)**
```
1. Alumni visits /alumni/register (if open registration enabled)
2. Provides email, name, batch info, credentials
3. Submission creates RegistrationRequest (PENDING)
4. Admin reviews in /admin/requests
5. Admin approves/rejects with optional reason
6. On approval: creates Alumni record + sends welcome email
7. Alumni can login with credentials
```

---

## 🔄 Integration Points

### **Email Service (Brevo)**
- OTP emails for admin/staff verification
- Invitation emails for alumni bulk import
- Event announcement emails
- Transactional notifications

### **File Storage (Cloudinary)**
- Album images
- Event cover images
- Startup logos
- User avatars

### **OAuth Providers**
- Google Sign-in for alumni
- LinkedIn Sign-in for alumni
- Email verification and profile data retrieval

---

## 📈 Key Metrics & Tracking

- **Alumni Tracking:** Last login, registration date, invite status
- **Email Tracking:** Delivery status, bounce tracking via Brevo
- **Event Analytics:** RSVP counts (Attending/Maybe/Not Attending)
- **Job Analytics:** Posted jobs, job categories
- **Batch Tracking:** Import success/failure rates by batch

---

## ⚙️ Configuration & Setup

### **Local Development**
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### **Production Build**
```bash
npm run build
npm start
```

### **Database Migrations**
```bash
npx prisma migrate deploy
npx prisma db push
```

---

## 🔐 Security Considerations

1. **Password Security:** bcryptjs hashing with salt rounds
2. **Token Management:** JWT with expiration + refresh rotation
3. **Rate Limiting:** API rate limiting to prevent abuse
4. **SQL Injection:** Prisma ORM prevents SQL injection
5. **CSRF Protection:** Next.js built-in CSRF tokens
6. **Email Verification:** OTP-based verification before admin access
7. **httpOnly Cookies:** Tokens stored in httpOnly, secure cookies
8. **Environment Variables:** Secrets not exposed in source code

---

## 📝 Next Steps for Documentation

See related documentation files:
- `2_ADMIN_PORTAL_WORKFLOW.md` - Admin panel detailed guide
- `3_ALUMNI_PORTAL_WORKFLOW.md` - Alumni portal features
- `4_DATABASE_SCHEMA.md` - Complete database models
- `5_API_DOCUMENTATION.md` - API endpoints reference
- `6_DEPLOYMENT_GUIDE.md` - Vercel deployment steps
