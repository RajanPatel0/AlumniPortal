# Admin Portal Workflow
## Comprehensive Admin & Sub-Admin Guide

---

## 📋 Overview

The Admin Portal is the management hub for:
- **Admin:** Full system control across all campuses
- **Sub-Admin:** Campus-specific management and operations

All admin endpoints are protected by middleware verification and JWT token validation.

---

## 🔐 Admin Authentication Flow

### Registration Process

**URL:** `/admin/auth/register`

**Step 1: Account Creation**
```
User fills:
- Full Name
- Email Address
- Password (secure)

Request to /api/admin/register (POST)
```

**Step 2: OTP Verification**
```
System:
1. Hashes password using bcryptjs
2. Creates Staff record in DB
3. Generates OTP token (10-minute expiry)
4. Sends OTP via Brevo email
5. Returns otpToken to frontend

Email includes: 6-digit OTP valid for 10 minutes
```

**Step 3: Verify & Activate**
```
User enters OTP from email

Request to /api/admin/verify-otp (POST)
- Validates OTP token
- Marks staff.isVerified = true
- Generates welcome message
- Admin can now login
```

**Code Reference:**
- `src/lib/admin-otp.ts` - OTP generation & email
- `src/lib/auth/jwt.ts` - Token generation
- `src/app/admin/auth/register/page.tsx` - UI

---

### Login Process

**URL:** `/admin/auth/login`

**Step 1: Credentials Submission**
```
User provides:
- Email
- Password

Request to /api/admin/login (POST)
```

**Step 2: Verification**
```
System:
1. Queries Staff by email
2. Compares password hash using bcryptjs
3. Checks isVerified status
4. Generates JWT tokens:
   - Access Token (15m expiry)
   - Refresh Token (7d expiry)
5. Sets cookies: accessToken, refreshToken (httpOnly)
6. Redirects to dashboard
```

**Step 3: Dashboard Access**
```
URL: /admin/dashboard

Middleware checks:
- accessToken validity
- If expired: silently refresh using refreshToken
- If missing: redirect to login
```

**Protected Routes:**
```
/admin/dashboard/*
/admin/alumni
/admin/events
/admin/jobs
/admin/import
/admin/requests
/admin/yearbook
/admin/startups
/admin/subadmins
/admin/posts
/admin/landing-page
```

**Code Reference:**
- `src/app/admin/auth/login/page.tsx` - Login UI
- `src/middlewares/adminMiddleware.ts` - Route protection
- `src/lib/auth/jwt.ts` - Token validation

---

## 📊 Admin Portal Sections

### 1. **Dashboard** (`/admin/dashboard`)

**Purpose:** Overview of portal activity

**Displays:**
- Total alumni count
- Recent registrations
- Event statistics
- Job postings count
- Notification summary

**Features:**
- Quick stats cards
- Recent activity log
- System health indicators

---

### 2. **Alumni Management** (`/admin/alumni`)

#### A. Alumni Bulk Import (`/admin/import`)

**Workflow:**
```
1. Admin navigates to Import section
2. Prepares CSV/XLSX file with columns:
   - name (required)
   - email (required)
   - batch_year (required)
   - branch (required)
   - college (required)
   - course (optional)
   - enrollment_no (optional)
   - phone (optional)

3. Selects campus
4. Uploads file via /api/admin/import-alumni (POST)
```

**Server-Side Processing:**
```
processImportBatch() function:

1. Creates InvitationBatch record
   - status: PROCESSING → UPLOADED
   - tracks totalCount, sentCount, failedCount

2. Validates each row:
   - Email format validation
   - Batch year range (1950 to current+5)
   - Required fields (name, email, branch, college)
   - Duplicate email detection (within batch)

3. For valid rows:
   - Normalizes data (trim, lowercase)
   - Generates unique inviteToken (nanoid)
   - Sets inviteStatus: PENDING
   - Records importedById, batchId, campusId

4. Bulk upserts in chunks (100 at a time):
   - email is unique key
   - Updates existing alumni if needed
   - Inserts new records

5. Returns ImportResult:
   - success count
   - failed count
   - detailed error list per row
```

**Error Handling:**
- Row-level errors with row number
- Partial success: valid rows imported, failed rows listed
- Admin can review errors and re-upload corrected batch

**Database Schema:**
```typescript
Alumni {
  id: string
  name: string
  email: string (unique)
  originalInvitedEmail: string
  enrollmentNo?: string
  batchYear: number
  branch: string
  college: string
  course?: string
  phone?: string
  inviteStatus: PENDING | INVITED | REGISTERED | BOUNCED
  isRegistered: boolean
  campusId: string (required - alumni must belong to campus)
  importedById: string (admin who imported)
  batchId: string (batch this was imported in)
  invitedAt?: DateTime
  registeredAt?: DateTime
  createdAt: DateTime
}

InvitationBatch {
  id: string
  label: string
  csvFilename?: string
  totalCount: number
  sentCount: number
  failedCount: number
  status: PROCESSING | UPLOADED | INVITED | COMPLETED | PARTIAL_FAILED
  createdById: string
  createdAt: DateTime
  completedAt?: DateTime
}
```

**Code Reference:**
- `src/lib/import-db-service.ts` - Bulk import logic
- `src/lib/import-utils.ts` - Validation helpers
- `src/app/api/admin/import-alumni/route.ts` - API endpoint
- `src/types/alumni-import.ts` - TypeScript types

---

#### B. Batch Management

**URL:** `/admin/import/batches`

**Features:**
- View all import batches
- Filter by status (PROCESSING, UPLOADED, INVITED, COMPLETED)
- Send invitation emails to batch
- View batch details and error logs
- Retry failed imports

**Status Workflow:**
```
PROCESSING → UPLOADED → INVITED → COMPLETED
                     ↓
                PARTIAL_FAILED (if some emails bounce)
```

**Send Invitations:**
```
1. Select batch
2. Click "Send Invitations"
3. System generates emails with invite links:
   /alumni/login?token=INVITE_TOKEN

4. Each email contains:
   - Personalized greeting
   - Alumni profile details
   - Unique invitation link
   - Registration deadline (optional)

5. Brevo API sends emails
6. Tracks delivery status per EmailLog record
7. Updates batch status and sentCount
```

**Tracking:**
```typescript
EmailLog {
  id: string
  recipientEmail: string
  alumniId?: string
  type: INVITATION | EVENT_ANNOUNCEMENT | EVENT_REMINDER
  status: QUEUED | SENT | FAILED | BOUNCED
  brevoMessageId?: string
  errorMessage?: string
  sentAt: DateTime
}
```

---

#### C. Alumni Listings & Search

**URL:** `/admin/alumni`

**Features:**
- List all alumni with pagination
- Search by name, email, enrollment number
- Filter by:
  - Batch year
  - Branch
  - College
  - Invite status (PENDING, INVITED, REGISTERED, BOUNCED)
  - Registration status
  - Campus (if Admin)

**Alumni Details View:**
```
Displays:
- Personal info (name, email, phone, DOB)
- Academic info (batch, branch, college, enrollment)
- Professional info (role, company, city)
- Account status (verified, last login)
- Invite status and dates
- Profile completion %
```

**Admin Actions:**
- Edit alumni details
- Resend invitation email
- Delete alumni (with confirmation)
- View registered alumni profiles
- Export alumni list

---

#### D. Registration Requests

**URL:** `/admin/requests`

**Purpose:** Approve/reject open alumni registrations

**Workflow:**
```
1. Alumni submits registration request (open registration)
2. Fills:
   - Name
   - Email
   - Batch year
   - Branch
   - College
   - Professional details
   - ID proof (document upload to Cloudinary)

3. Request stored as RegistrationRequest with status: PENDING

4. Admin reviews in /admin/requests
5. Sees request details + ID proof image
6. Can:
   - APPROVE: Creates Alumni record, sends welcome email
   - REJECT: Marks status REJECTED, optional rejection reason sent to email
```

**RegistrationRequest Schema:**
```typescript
{
  id: string
  name: string
  email: string (unique)
  enrollmentNo?: string
  idProffUrl?: string (Cloudinary image URL)
  batchYear: number
  branch: string
  college: string
  course?: string
  phone?: string
  campusId?: string
  currentRole?: string
  currentCompany?: string
  dob?: DateTime
  gender?: MALE | FEMALE | OTHER
  
  authProvider: GOOGLE | LINKEDIN | MANUAL
  providerId?: string
  passwordHash?: string (if manual)
  
  status: PENDING | APPROVED | REJECTED
  rejectionReason?: string
  reviewedById?: string (staff who reviewed)
  reviewedAt?: DateTime
  createdAt: DateTime
}
```

---

### 3. **Event Management** (`/admin/events`)

**Features:**
- Create/edit/delete events
- Categorize events (General, Workshop, Reunion, etc.)
- Set RSVP deadline
- Mark event as published
- Display on landing page
- Track RSVPs

**Event Creation Form:**
```
- Title (required)
- Description (required)
- Category (dropdown)
- Event Date & Time (required)
- Venue (required)
- Cover Image (optional, uploads to Cloudinary)
- RSVP Deadline (optional)
- Publish toggle
- Show on Landing toggle
```

**Event Publishing:**
```
- Draft events: hidden from alumni
- Published events: visible in alumni feed
- Show on Landing: featured on public landing page
- Only published events can receive RSVPs
```

**RSVP Tracking:**
```
Admin can view:
- Total RSVPs per event
- Breakdown: Attending / Maybe / Not Attending
- RSVP status per alumni
- Export RSVP list for headcount planning
```

**Event Email Notifications:**
```
Type 1: EVENT_ANNOUNCEMENT
- Sent when event published
- To all campus alumni

Type 2: EVENT_REMINDER
- Sent 24 hours before event
- To alumni who RSVPed ATTENDING
```

**Database Schema:**
```typescript
Event {
  id: string
  title: string
  description: string
  category: string
  eventDate: DateTime
  venue: string
  coverImageUrl?: string
  rsvpDeadline?: DateTime
  isPublished: boolean
  showOnLanding: boolean
  postedByStaffId?: string
  postedByAlumniId?: string
  createdAt: DateTime
}

Rsvp {
  id: string
  alumniId: string
  eventId: string
  status: ATTENDING | NOT_ATTENDING | MAYBE
  message?: string
  respondedAt: DateTime
  unique([alumniId, eventId])
}
```

**Code Reference:**
- `src/actions/events.ts` - Event server actions
- `src/schemas/event.ts` - Zod validation

---

### 4. **Job Portal** (`/admin/jobs`)

**Features:**
- Post job vacancies
- Post placement drives
- Manage job details
- Track job postings

**Job Types:**
- **VACANCY:** Regular job openings
- **ACTIVE_DRIVE:** Campus recruitment drives

**Job Posting Form:**
```
- Title (required)
- Company (required)
- Description (required)
- Location (optional)
- Job Category (VACANCY / ACTIVE_DRIVE)
- Salary Range (optional)
- Job Type: metadata
  - Industry (e.g., IT, Finance, E-commerce)
  - Type (Full-time, Internship, Freelance)
  - Workplace Type (Remote, On-site, Hybrid)
  - Experience Range (Fresher, 0-2 years, etc.)
  - Required Skills (array)

- Apply URL (external job link)
- Publication Date
- Expiry Date (optional)
- Active toggle
```

**Job Visibility:**
```
- Active jobs: Visible to alumni
- Expired jobs: Hidden automatically
- Admin can set expiry date
- Can feature specific jobs on landing page
```

**Advanced Filtering (Alumni View):**
- Search by title, company, description
- Filter by experience level
- Filter by industry
- Filter by job type (full-time, internship)
- Filter by workplace type (remote, on-site, hybrid)
- Filter by salary range

**Database Schema:**
```typescript
Job {
  id: string
  title: string
  description: string
  company: string
  location?: string
  category: VACANCY | ACTIVE_DRIVE
  salaryRange?: string
  applyUrl?: string
  isActive: boolean
  expireAt?: DateTime
  postedByStaffId?: string
  postedByAlumniId?: string
  metadata: {
    workplaceType: string
    type: string
    experienceRange: string
    industry: string
    skills: string[]
  }
  createdAt: DateTime
}
```

---

### 5. **Startup Ecosystem** (`/admin/startups`)

**Features:**
- View alumni startups
- Approve/feature startups
- Startup showcase on landing page

**Startup Information:**
```
- Startup Name
- Description
- Website URL
- Logo (Cloudinary image)
- Industry
- Founded Year
- Founder (alumni reference)
- Contact info
```

**Admin Actions:**
- Review startup submissions
- Feature startup on landing page
- Deactivate startup listing
- View startup details and founder profile

---

### 6. **Posts & Feed Moderation** (`/admin/posts`)

**Features:**
- View all alumni posts
- Moderate content
- Delete inappropriate posts
- View comments and likes

**Post Moderation:**
```
- View post content and images
- Delete posts
- Block/unblock alumni if needed
- View post analytics (likes, comments)
```

**Database Schema:**
```typescript
Post {
  id: string
  content?: string
  images: string[] (Cloudinary URLs)
  authorId?: string (alumni)
  postedByStaffId?: string (admin)
  createdAt: DateTime
}

Like {
  id: string
  postId: string
  alumniId: string
  createdAt: DateTime
  unique([postId, alumniId])
}

Comment {
  id: string
  content: string
  postId: string
  alumniId: string
  createdAt: DateTime
}
```

---

### 7. **Yearbook & Gallery** (`/admin/yearbook`)

**Features:**
- Create photo albums
- Manage album images
- Feature images on landing page
- Organize by event or year

**Album Management:**
```
- Create album with title and description
- Upload multiple images to Cloudinary
- Add captions per image
- Toggle: showOnLanding (featured in gallery)
- Publish/unpublish albums
- Delete albums
```

**Landing Page Gallery:**
- Selected images from albums
- Carousel display of featured images
- Event-based organization

---

### 8. **Sub-Admin Management** (`/admin/subadmins`)

**Features (Admin Only):**
- Create sub-admin accounts
- Assign campus to sub-admin
- Set module permissions
- View sub-admin activity
- Deactivate sub-admins

**Sub-Admin Creation:**
```
1. Admin fills:
   - Name
   - Email
   - Campus (dropdown)
   - Permissions (checkboxes):
     ☐ Dashboard
     ☐ Alumni Management
     ☐ Events
     ☐ Jobs
     ☐ Posts
     ☐ Yearbook
     ☐ Import

2. System generates initial password
3. Sends registration link via Brevo
4. Sub-admin completes OTP verification
5. Sub-admin can login
```

**Sub-Admin Permissions:**
```typescript
Staff {
  id: string
  name: string
  email: string (unique)
  role: ADMIN | SUB_ADMIN | COORDINATOR
  passwordHash: string
  isVerified: boolean
  campusId?: string (required for SUB_ADMIN)
  modules: string[] (JSON array of module names)
  createdById?: string (admin who created)
  otpHash?: string
  otpExpiresAt?: DateTime
  refreshTokens: string[] (for token rotation)
}
```

**Module-Level Access Control:**
```
Each sub-admin has modules array like:
["dashboard", "alumni", "events", "jobs"]

When sub-admin:
- Logs in: middleware checks role + modules
- Accesses page: checks if module in modules array
- Creates/edits data: only for assigned campus
- Views data: filtered by campusId
```

**Sub-Admin Dashboard:**
- Same as admin but campus-filtered
- Can only see/manage their campus alumni
- Can create events/jobs for their campus
- Cannot create other sub-admins

---

### 9. **Landing Page Management** (`/admin/landing-page`)

**Features:**
- Manage public landing page content
- Feature events
- Feature jobs
- Feature startup ecosystem
- Gallery showcase
- Newsletter signup

**Editable Sections:**
```
1. Hero Section
   - Title, subtitle, CTA button
   - Hero image/video

2. Events Section
   - Show upcoming events
   - Featured events filter

3. Gallery Section
   - Featured album images
   - Masonry layout

4. Testimonials Section
   - Alumni success stories
   - User submissions

5. Newsletter Signup
   - Email collection
   - Integration with Brevo
   - Confirmation emails

6. Latest News/Blog
   - Featured posts from feed
   - Article links
```

---

## 🔄 Common Admin Workflows

### Workflow 1: Bulk Onboarding Alumni
```
1. Receive alumni list from registrar
2. Prepare CSV with required columns
3. Go to /admin/import
4. Upload CSV file
5. Review validation results
6. Send invitations to valid records
7. Monitor email delivery (EmailLog)
8. Handle bounced emails
9. Track registration completion
```

### Workflow 2: Organize Campus Event
```
1. Go to /admin/events
2. Click "Create Event"
3. Fill event details
4. Upload cover image
5. Set RSVP deadline
6. Publish event
7. Optionally show on landing page
8. Monitor RSVPs as alumni respond
9. Export RSVP list for headcount
10. Send reminder 24h before event
```

### Workflow 3: Post Job Opportunity
```
1. Go to /admin/jobs
2. Click "Post Job"
3. Fill job details and requirements
4. Set expiry date
5. Publish job
6. Optionally feature on landing page
7. Monitor job views and clicks
8. Update or close job when filled
```

### Workflow 4: Manage Sub-Admin
```
1. Go to /admin/subadmins
2. Click "Create Sub-Admin"
3. Assign campus and permissions
4. System sends registration email
5. Sub-admin registers and verifies
6. Sub-admin can start managing assigned campus
7. Admin can monitor their activity
8. Deactivate when no longer needed
```

---

## 🔐 Role-Based Access Control

### **Admin (ADMIN Role)**
```
✅ All dashboard sections
✅ Create/manage all campuses content
✅ Create/manage sub-admins
✅ System settings
✅ View all analytics
✅ Manage staff accounts
```

### **Sub-Admin (SUB_ADMIN Role)**
```
✅ Dashboard (campus-filtered)
✅ Alumni management (own campus)
✅ Event management (own campus)
✅ Job management (own campus)
✅ Post moderation (own campus)
✅ Yearbook (own campus)
❌ Cannot create other sub-admins
❌ Cannot view other campus data
❌ Cannot manage system settings
❌ Cannot manage landing page
```

### **Permission Checking**
```typescript
// In middleware/API routes:
1. Extract staff ID from JWT
2. Query Staff record
3. Check role === ADMIN or SUB_ADMIN
4. Check modules array contains required module
5. If campus-specific: check campusId matches
6. Grant/deny access
```

---

## 📊 Analytics & Reporting

### Available Reports:
- Alumni registration trends
- Email delivery statistics
- Event attendance rates
- Job posting performance
- Startup ecosystem growth
- User engagement metrics

### Export Options:
- Alumni list (CSV)
- RSVP list per event (CSV)
- Email logs (CSV)
- Import batch reports

---

## 🔧 Troubleshooting

### Common Issues:

**1. Alumni Email Not Received**
- Check EmailLog for delivery status
- Verify Brevo API key is valid
- Check spam folder
- Resend invitation manually

**2. Import Batch Validation Fails**
- Review error log in UI
- Check column headers match expected format
- Verify email format and batch year
- Fix CSV and re-upload

**3. Sub-Admin Can't Access Dashboard**
- Verify email is verified (isVerified = true)
- Check refresh tokens in storage
- Verify modules array includes "dashboard"
- Check campus assignment

---

## 📚 Related Documentation

- See `1_PROJECT_OVERVIEW.md` for tech stack
- See `3_ALUMNI_PORTAL_WORKFLOW.md` for alumni features
- See `4_DATABASE_SCHEMA.md` for data models
- See `5_API_DOCUMENTATION.md` for API endpoints
