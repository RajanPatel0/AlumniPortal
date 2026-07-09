# Database Schema & Data Models
## Complete Database Architecture

---

## 📊 Database Overview

**Type:** PostgreSQL (Relational Database)
**Hosted on:** Supabase (AWS ap-south-1 region)
**ORM:** Prisma 5.22.0
**Connection:** Pooled via PgBouncer for efficiency

**Key Statistics:**
- ~15 core models
- ~30 relationships
- Multiple indexes for query optimization
- Support for 500+ concurrent users

---

## 🏢 Campus Model

```prisma
model Campus {
  id        String   @id @default(cuid())
  name      String   @unique
  code      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  staff              Staff[]
  alumni             Alumni[]
  registrationRequests RegistrationRequest[]

  @@map("campuses")
}
```

**Purpose:** Multi-campus organization support

**Fields:**
- `id`: Unique identifier (CUID - collision-resistant unique ID)
- `name`: Full campus name (e.g., "Main Campus Jalandhar")
- `code`: Short code (e.g., "main", "mohali", "amritsar")
- `createdAt/updatedAt`: Audit timestamps

**Example Data:**
```
IKG PTU Kapurthala
- Main Campus Jalandhar (main)
- Mohali Campus (mohali)
- Amritsar Campus (amritsar)
- Hoshiarpur Center (hoshiarpur)
- Batala Center (batala)
```

---

## 👔 Staff Model (Admin/Sub-Admin)

```prisma
model Staff {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         StaffRole @default(ADMIN)
  createdAt    DateTime  @default(now())

  // OTP fields
  otpHash      String?
  otpExpiresAt DateTime?
  isVerified   Boolean   @default(false)

  // JWT token management
  refreshTokens String[]

  // Campus assignment
  campusId     String?
  campus       Campus?   @relation(fields: [campusId], references: [id])

  // Permissions
  modules      Json?     @default("[]")

  // Creator tracking
  createdById  String?
  createdBy    Staff?    @relation("StaffCreator", fields: [createdById], references: [id])
  createdStaff Staff[]   @relation("StaffCreator")

  // Relationships
  batches           InvitationBatch[]
  events            Event[]
  importedAlumni    Alumni[]
  reviewedRequests  RegistrationRequest[]
  jobs              Job[]
  posts             Post[]
  albums            Album[]

  @@map("staff")
}

enum StaffRole {
  ADMIN       // Full system access
  SUB_ADMIN   // Campus-specific access
  COORDINATOR // Helper role (future)
}
```

**Purpose:** Staff account management with role-based access

**Key Fields:**
- `role`: Controls what features staff can access
  - ADMIN: All features across all campuses
  - SUB_ADMIN: Only assigned campus
  - COORDINATOR: Limited features (future role)

- `campusId`: Links sub-admin to specific campus
  - ADMIN has null (no campus restriction)
  - SUB_ADMIN must have campusId

- `modules`: JSON array of accessible modules
  ```json
  ["dashboard", "alumni", "events", "jobs", "import", "yearbook", "posts"]
  ```

- `passwordHash`: bcryptjs hashed password
- `refreshTokens`: Array for JWT rotation and multiple sessions
- `otpHash`: Temporary OTP for email verification
- `isVerified`: Must be true before login allowed

---

## 👥 Alumni Model

```prisma
model Alumni {
  id                   String       @id @default(cuid())
  name                 String
  email                String       @unique
  originalInvitedEmail String?
  enrollmentNo         String?
  batchYear            Int
  branch               String
  college              String
  course               String?
  phone                String?
  inviteToken          String?      @unique
  inviteStatus         InviteStatus @default(PENDING)
  isRegistered         Boolean      @default(false)

  // OAuth
  googleId   String? @unique
  linkedinId String? @unique
  passwordHash String?

  // Tokens
  alumniRefreshTokens String[]

  // Profile
  currentRole    String?
  currentCompany String?
  city           String?
  linkedinUrl    String?
  avatarUrl      String?
  bio            String?

  // Extra
  isActive       Boolean      @default(true)
  dob            DateTime?
  gender         Gender?
  addressLine    String?
  pincode        String?

  // Campus
  campusId     String
  campus       Campus   @relation(fields: [campusId], references: [id])

  // Audit
  importedById String?
  importedBy   Staff?   @relation(fields: [importedById], references: [id])
  batchId      String?
  batch        InvitationBatch? @relation(fields: [batchId], references: [id])
  invitedAt    DateTime?
  registeredAt DateTime?
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())

  // Relationships
  rsvps               Rsvp[]
  emailLogs           EmailLog[]
  education           Education[]
  workExperience      WorkExperience[]
  posts               Post[]
  likes               Like[]
  comments            Comment[]
  startups            StartUp[]
  albums              Album[]
  jobs                Job[]
  events              Event[]
  sentConnections     Connection[]     @relation("SentConnections")
  receivedConnections Connection[]     @relation("ReceivedConnections")

  @@index([batchYear])
  @@index([branch])
  @@index([college])
  @@index([campusId])
  @@index([isActive])
  @@index([city])
  @@map("alumni")
}

enum InviteStatus {
  PENDING      // Imported from CSV, not invited yet
  INVITED      // Invitation email sent
  REGISTERED   // Completed registration
  BOUNCED      // Email delivery failed
}

enum Gender {
  MALE
  FEMALE
  OTHER
}
```

**Purpose:** Alumni profile and registration tracking

**Registration Workflows:**
1. **Bulk Import Route:**
   - CSV upload → Alumni record created with PENDING status
   - Admin sends invitations → INVITED status
   - Alumni registers → REGISTERED status
   - Email bounces → BOUNCED status

2. **OAuth Route:**
   - Alumni comes via Google/LinkedIn OAuth
   - If with invite token → immediate REGISTERED
   - If open registration → goes through approval

3. **Manual Route:**
   - Alumni with invite token sets password
   - Registered status updated

**Key Indexes:**
```sql
-- For fast filtering:
CREATE INDEX idx_alumni_batchYear ON alumni(batchYear)
CREATE INDEX idx_alumni_branch ON alumni(branch)
CREATE INDEX idx_alumni_college ON alumni(college)
CREATE INDEX idx_alumni_campusId ON alumni(campusId)
CREATE INDEX idx_alumni_isActive ON alumni(isActive)
```

---

## 📧 Invitation Batch Model

```prisma
model InvitationBatch {
  id          String      @id @default(cuid())
  label       String      // e.g., "CSE Batch 2019"
  csvFilename String?
  totalCount  Int         @default(0)
  sentCount   Int         @default(0)
  failedCount Int         @default(0)
  status      BatchStatus @default(PROCESSING)
  createdById String
  createdBy   Staff       @relation(fields: [createdById], references: [id])
  createdAt   DateTime    @default(now())
  completedAt DateTime?

  alumni Alumni[]

  @@map("invitation_batches")
}

enum BatchStatus {
  PROCESSING       // Currently importing
  UPLOADED         // Import complete
  INVITED          // Invitation emails sent
  COMPLETED        // All successful
  PARTIAL_FAILED   // Some emails bounced
}
```

**Purpose:** Track bulk alumni imports and email campaigns

**Workflow:**
```
1. PROCESSING: CSV validation and upsert in progress
2. UPLOADED: All valid records inserted into alumni table
3. INVITED: Admin clicked "Send Invitations"
4. COMPLETED: All invitations successfully sent
5. PARTIAL_FAILED: Some emails bounced (EmailLog tracks which)
```

---

## 📝 Registration Request Model

```prisma
model RegistrationRequest {
  id           String  @id @default(cuid())
  name         String
  email        String  @unique
  enrollmentNo String?
  idProffUrl   String?
  batchYear    Int
  branch       String
  college      String
  course       String?
  phone        String?
  campusId     String?
  campus       Campus? @relation(fields: [campusId], references: [id])

  currentRole    String?
  currentCompany String?
  dob            DateTime?
  gender         Gender?
  addressLine    String?
  pincode        String?
  city           String?

  authProvider String    // GOOGLE | LINKEDIN | MANUAL
  providerId   String?
  passwordHash String?

  status           RequestStatus @default(PENDING)
  rejectionReason  String?
  reviewedById     String?
  reviewedBy       Staff?        @relation(fields: [reviewedById], references: [id])
  reviewedAt       DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([status])
  @@map("registration_requests")
}

enum RequestStatus {
  PENDING   // Awaiting admin review
  APPROVED  // Converted to Alumni, can login
  REJECTED  // Rejected by admin
}
```

**Purpose:** Staging ground for alumni self-registration before admin approval

**Workflow:**
```
Alumni submits → RegistrationRequest created (PENDING)
  ↓
Admin reviews in /admin/requests
  ├─ APPROVE → Creates Alumni record, sends welcome email
  └─ REJECT → Sends rejection email with reason
```

---

## 📚 Education & Work Experience Models

```prisma
model Education {
  id           String    @id @default(cuid())
  alumniId     String
  alumni       Alumni    @relation(fields: [alumniId], references: [id], onDelete: Cascade)
  school       String
  degree       String
  fieldOfStudy String?
  startDate    DateTime
  endDate      DateTime?
  isCurrent    Boolean   @default(false)
  description  String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([alumniId])
  @@map("education")
}

model WorkExperience {
  id          String    @id @default(cuid())
  alumniId    String
  alumni      Alumni    @relation(fields: [alumniId], references: [id], onDelete: Cascade)
  company     String
  title       String
  location    String?
  startDate   DateTime
  endDate     DateTime?
  isCurrent   Boolean   @default(false)
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([alumniId])
  @@map("work_experiences")
}
```

**Purpose:** Track alumni career progression

**Use Cases:**
- Alumni build professional profile
- Display career history in profile
- Match with suitable job postings
- Alumni achievement tracking

---

## 🎉 Event Model

```prisma
model Event {
  id            String    @id @default(cuid())
  title         String
  description   String
  category      String    @default("General")
  eventDate     DateTime
  venue         String
  coverImageUrl String?
  rsvpDeadline  DateTime?
  isPublished   Boolean   @default(false)
  showOnLanding Boolean   @default(false)

  postedByStaffId  String?
  postedByStaff    Staff?  @relation(fields: [postedByStaffId], references: [id])
  postedByAlumniId String?
  postedByAlumni   Alumni? @relation(fields: [postedByAlumniId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())

  rsvps     Rsvp[]
  emailLogs EmailLog[]

  @@index([postedByStaffId])
  @@index([postedByAlumniId])
  @@index([category])
  @@index([eventDate])
  @@map("events")
}

model Rsvp {
  id          String     @id @default(cuid())
  alumniId    String
  alumni      Alumni     @relation(fields: [alumniId], references: [id])
  eventId     String
  event       Event      @relation(fields: [eventId], references: [id])
  status      RsvpStatus
  message     String?
  respondedAt DateTime   @default(now())

  @@unique([alumniId, eventId])
  @@index([eventId])
  @@map("rsvps")
}

enum RsvpStatus {
  ATTENDING     // Confirmed attendance
  NOT_ATTENDING // Cannot make it
  MAYBE         // Interested but uncertain
}
```

**Purpose:** Event management and RSVP tracking

**Event Lifecycle:**
```
1. Created (draft, unpublished)
2. Published (visible to alumni)
3. RSVP opens (alumni can respond)
4. RSVP deadline passes
5. Event date arrives
6. Archive/delete event
```

**RSVP Statistics:**
```
Admin can see:
- Total RSVPs
- Count by status (Attending/Maybe/Not Attending)
- Attendee list with details
- Export for planning purposes
```

---

## 💼 Job Model

```prisma
model Job {
  id              String      @id @default(cuid())
  title           String
  description     String
  company         String
  location        String?
  category        JobCategory @default(VACANCY)
  salaryRange     String?
  applyUrl        String?
  isActive        Boolean     @default(true)
  expireAt        DateTime?
  postedByStaffId String?
  postedByStaff   Staff?      @relation(fields: [postedByStaffId], references: [id])
  postedByAlumniId String?
  postedByAlumni   Alumni?     @relation(fields: [postedByAlumniId], references: [id])

  metadata Json?  // Stores: {workplaceType, type, experienceRange, industry, skills}

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
  @@index([expireAt])
  @@map("jobs")
}

enum JobCategory {
  VACANCY      // Regular job opening
  ACTIVE_DRIVE // Campus placement drive
}
```

**Purpose:** Job postings and placement drive management

**Metadata JSON Structure:**
```json
{
  "workplaceType": "Remote|On-site|Hybrid",
  "type": "Full-time|Internship|Freelance|Contract",
  "experienceRange": "Fresher|0-2 years|2-5 years|5+ years",
  "industry": "IT|Finance|E-commerce|Manufacturing|Other",
  "skills": ["Python", "React", "AWS"]
}
```

**Job Expiry:**
- Jobs with `expireAt` in past are automatically hidden
- Alumni see only active jobs
- Admin can manually update job status

---

## 🚀 Startup Model

```prisma
model StartUp {
  id          String   @id @default(cuid())
  name        String
  description String
  websiteUrl  String?
  logoUrl     String?
  industry    String?
  foundedYear Int?
  founderId   String
  founder     Alumni   @relation(fields: [founderId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([founderId])
  @@map("startups")
}
```

**Purpose:** Alumni startup ecosystem showcase

**Use Cases:**
- Alumni list their startups
- Showcase business ecosystem
- Network with other founders
- Attract investors/partners

---

## 📱 Social Feed Models

```prisma
model Post {
  id              String    @id @default(cuid())
  content         String?
  images          String[]  // Cloudinary URLs
  authorId        String?
  author          Alumni?   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  postedByStaffId String?
  postedByStaff   Staff?    @relation(fields: [postedByStaffId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  likes    Like[]
  comments Comment[]

  @@index([authorId])
  @@index([postedByStaffId])
  @@map("posts")
}

model Like {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  alumniId  String
  alumni    Alumni   @relation(fields: [alumniId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([postId, alumniId])
  @@index([postId])
  @@index([alumniId])
  @@map("likes")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  alumniId  String
  alumni    Alumni   @relation(fields: [alumniId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId])
  @@index([alumniId])
  @@map("comments")
}
```

**Purpose:** Alumni social networking and engagement

**Like Constraint:**
- One like per alumni per post (unique constraint)
- Prevents duplicate likes
- Soft delete via cascade when post deleted

---

## 📸 Album Models

```prisma
model Album {
  id              String       @id @default(cuid())
  title           String
  description     String?
  alumniId        String?
  alumni          Alumni?      @relation(fields: [alumniId], references: [id], onDelete: Cascade)
  postedByStaffId String?
  postedByStaff   Staff?       @relation(fields: [postedByStaffId], references: [id], onDelete: Cascade)
  images          AlbumImage[]
  isPublished     Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([alumniId])
  @@index([postedByStaffId])
  @@map("albums")
}

model AlbumImage {
  id            String   @id @default(cuid())
  albumId       String
  album         Album    @relation(fields: [albumId], references: [id], onDelete: Cascade)
  imageUrl      String   // Cloudinary URL
  caption       String?
  showOnLanding Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([albumId])
  @@map("album_images")
}
```

**Purpose:** Photo galleries and yearbook management

**Album Types:**
- Event albums (automatically created from events)
- Yearbook albums (batch/year-wise)
- Memories albums (alumni submissions)

**Landing Page Feature:**
- Images with `showOnLanding: true` appear in gallery
- Featured images rotated in carousel

---

## 🔗 Networking Model

```prisma
model Connection {
  id            String           @id @default(cuid())
  senderAlumniId String
  sender        Alumni           @relation("SentConnections", fields: [senderAlumniId], references: [id])
  receiverAlumniId String
  receiver      Alumni           @relation("ReceivedConnections", fields: [receiverAlumniId], references: [id])
  status        ConnectionStatus
  createdAt     DateTime         @default(now())
  respondedAt   DateTime?

  @@unique([senderAlumniId, receiverAlumniId])
  @@map("connections")
}

enum ConnectionStatus {
  PENDING   // Awaiting receiver response
  ACCEPTED  // Mutual connection established
  REJECTED  // Request rejected by receiver
}
```

**Purpose:** Alumni networking and connections

**Flow:**
```
1. Alumni A sends connection request → PENDING
2. Alumni B can:
   - ACCEPT → Mutual connection
   - REJECT → Not connected
3. Both can view each other's profiles
```

---

## 📧 Email Tracking Model

```prisma
model EmailLog {
  id             String      @id @default(cuid())
  recipientEmail String
  alumniId       String?
  alumni         Alumni?     @relation(fields: [alumniId], references: [id])
  eventId        String?
  event          Event?      @relation(fields: [eventId], references: [id])
  type           EmailType
  status         EmailStatus @default(QUEUED)
  brevoMessageId String?     // ID from Brevo API
  errorMessage   String?
  sentAt         DateTime    @default(now())

  @@index([recipientEmail])
  @@index([alumniId])
  @@map("email_logs")
}

enum EmailType {
  INVITATION              // Bulk import invite
  EVENT_ANNOUNCEMENT      // Event published
  EVENT_REMINDER          // 24h before event
  REGISTRATION_CONFIRMATION
}

enum EmailStatus {
  QUEUED   // Pending send
  SENT     // Sent successfully
  FAILED   // Send failed
  BOUNCED  // Email address invalid
}
```

**Purpose:** Email delivery tracking and analytics

**Use Cases:**
- Track which emails were delivered
- Identify bounced addresses
- Retry failed sends
- Analytics for email campaigns

---

## 🔐 Authentication & Token Storage

**Tokens Storage:**
```typescript
// In Staff/Alumni records:
refreshTokens: string[]  // Array for multiple sessions
otpHash: string?         // For OTP verification
otpExpiresAt: DateTime?  // OTP expiration
```

**Token Rotation:**
```
1. Alumni logs in → receive access + refresh tokens
2. Access token expires (15m)
3. Frontend sends refresh token
4. Backend validates and issues new access token
5. Both tokens stored in httpOnly cookies
6. Each refresh token stored in DB
7. Can invalidate specific sessions by removing from array
```

---

## 📊 Query Performance Optimization

**Indexes Created:**
```sql
-- Alumni frequent queries
CREATE INDEX idx_alumni_campusId ON alumni(campusId)
CREATE INDEX idx_alumni_batchYear ON alumni(batchYear)
CREATE INDEX idx_alumni_branch ON alumni(branch)
CREATE INDEX idx_alumni_college ON alumni(college)
CREATE INDEX idx_alumni_email ON alumni(email)
CREATE INDEX idx_alumni_isActive ON alumni(isActive)

-- Event queries
CREATE INDEX idx_event_eventDate ON event(eventDate)
CREATE INDEX idx_event_postedByStaffId ON event(postedByStaffId)
CREATE UNIQUE INDEX idx_rsvp_alumni_event ON rsvp(alumniId, eventId)

-- Job queries
CREATE INDEX idx_job_isActive ON job(isActive)
CREATE INDEX idx_job_expireAt ON job(expireAt)

-- Email tracking
CREATE INDEX idx_emailLog_recipientEmail ON email_log(recipientEmail)
CREATE INDEX idx_emailLog_alumniId ON email_log(alumniId)
```

**Query Patterns:**
```sql
-- Fast filtering by campus
SELECT * FROM alumni WHERE campusId = ? AND isActive = true

-- Alumni by batch year
SELECT * FROM alumni WHERE batchYear = ? AND campusId = ?

-- Recent events
SELECT * FROM events WHERE campusId = ? AND eventDate > NOW() ORDER BY eventDate ASC

-- Active jobs
SELECT * FROM jobs WHERE isActive = true AND (expireAt IS NULL OR expireAt > NOW())

-- Email tracking
SELECT * FROM email_logs WHERE recipientEmail = ? ORDER BY sentAt DESC
```

---

## 🔄 Data Relationships

**One-to-Many:**
- Campus → Staff, Alumni, RegistrationRequests
- Staff → InvitationBatches, Events, Jobs, Posts, Albums
- Alumni → Education, WorkExperience, Posts, Comments, Likes, Startups, Connections
- Album → AlbumImages
- Event → RSVPs, EmailLogs
- Post → Comments, Likes

**Many-to-Many (through junction tables):**
- Alumni ↔ Events (via RSVP)
- Alumni ↔ Posts (via Comment/Like)
- Alumni ↔ Alumni (via Connection)

**Self-Referential:**
- Staff → Staff (creator → created staff)
- Alumni → Alumni (sender/receiver connections)

---

## 📈 Data Growth Considerations

**Scalability:**
- Supports 10,000+ alumni records
- 100+ events per year
- 1000+ job postings
- Millions of social interactions

**Database Size:**
- Current estimate: 100-500 MB for mid-sized university
- Grows ~10-50 MB per year with typical usage
- Can scale to 10+ GB with proper indexing

**Backup Strategy:**
- Supabase automatic daily backups
- 30-day backup retention
- Point-in-time recovery available

---

## 🛡️ Data Privacy & Compliance

**Personal Data Stored:**
- Name, email, phone
- Educational history
- Professional history
- Optional: DOB, gender, address

**Privacy Controls:**
- Alumni can control profile visibility
- Email preferences for opt-out
- Data anonymization on deletion
- No sensitive financial data

**GDPR Compliance:**
- Right to deletion supported
- Data portability available
- Consent tracking for emails
- Audit logs for access

---

## 📚 Related Documentation

- See `1_PROJECT_OVERVIEW.md` for tech stack
- See `5_API_DOCUMENTATION.md` for API endpoints
- See `6_DEPLOYMENT_GUIDE.md` for database setup
