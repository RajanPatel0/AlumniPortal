# Alumni Portal Workflow
## Comprehensive Alumni Features & User Guide

---

## 📋 Overview

The Alumni Portal is a community engagement platform where registered alumni can:
- Build professional profiles
- Network with fellow alumni
- Participate in events
- Explore job opportunities
- Contribute to startup ecosystem
- Share experiences and connect

---

## 🔐 Alumni Authentication

### Pathway 1: OAuth Registration (Google/LinkedIn)

**URL:** `/alumni/login`

**Step 1: Select Provider**
```
User sees:
☐ Continue with Google
☐ Continue with LinkedIn
☐ Manual Email/Password Registration
```

**Step 2: OAuth Flow**
```
If invitation link (/alumni/login?token=INVITE_TOKEN):
  1. Store invite token in cookie
  2. Redirect to provider (Google/LinkedIn)
  3. User authorizes app access

If open registration:
  1. Redirect to provider
  2. User authorizes
```

**Step 3: OAuth Callback**
```
Provider redirects: /alumni/oauth-success

System:
1. Receives OAuth provider ID (googleId/linkedinId)
2. Fetches email from provider
3. If with invite token:
   - Validates token against Alumni.inviteToken
   - Updates Alumni with:
     * googleId/linkedinId
     * isRegistered = true
     * inviteStatus = REGISTERED
     * registeredAt = now()
   - Creates alumni access token

4. If open registration:
   - Creates RegistrationRequest (status: PENDING)
   - Sends to admin for approval
   - Alumni waits for approval

5. Sets alumniAccessToken cookie (httpOnly)
6. Redirects to /alumni/(protected)/feed
```

**Database Records:**
```typescript
Alumni {
  id: string
  email: string (from provider)
  name: string
  googleId?: string (from Google OAuth)
  linkedinId?: string (from LinkedIn OAuth)
  passwordHash: null (no password for OAuth users)
  isRegistered: true
  inviteStatus: REGISTERED
  registeredAt: DateTime (now)
  campusId: string
  alumniRefreshTokens: string[]
}
```

**Code Reference:**
- `src/app/alumni/oauth-success/OAuthSuccessClient.tsx` - OAuth flow UI
- `src/app/api/alumni/oauth-callback` - Backend OAuth processing

---

### Pathway 2: Manual Registration (Email/Password)

**URL:** `/alumni/login?token=INVITE_TOKEN`

**Prerequisites:**
- Alumni must have valid invite token from CSV import
- Email must match originalInvitedEmail from import

**Step 1: Verify Invitation**
```
Frontend:
1. Extracts token from URL query param
2. Calls /api/alumni/verify-token?token=INVITE_TOKEN
3. System validates:
   - Token exists in Alumni.inviteToken
   - Token not expired
   - inviteStatus = PENDING
   - Alumni not already registered

4. Returns alumni data pre-filled:
   - Name
   - Email
   - Batch Year
   - Branch
   - College
```

**Step 2: Set Password**
```
User fills:
- Password (min 6 chars)
- Confirm Password

Frontend validation:
- Passwords match
- Password length >= 6
```

**Step 3: Account Creation**
```
Request to /api/alumni/register-manual (POST)

System:
1. Validates invite token again
2. Checks passwords match
3. Hashes password using bcryptjs
4. Updates Alumni record:
   - passwordHash = hashed password
   - isRegistered = true
   - inviteStatus = REGISTERED
   - registeredAt = now()
   - inviteToken = null (invalidate token)

5. Generates alumni tokens:
   - accessToken (15m expiry)
   - refreshToken (7d expiry)

6. Sets alumniAccessToken, alumniRefreshToken cookies
7. Returns success
8. Frontend redirects to /alumni/(protected)/feed
```

**Database Records:**
```typescript
Alumni {
  id: string
  email: string
  name: string
  passwordHash: string (bcryptjs hashed)
  googleId: null
  linkedinId: null
  isRegistered: true
  inviteStatus: REGISTERED
  registeredAt: DateTime
  inviteToken: null (cleared)
  campusId: string
  alumniRefreshTokens: [refreshToken]
}
```

**Code Reference:**
- `src/app/alumni/login/AlumniLoginClient.tsx` - Manual registration UI
- `src/app/api/alumni/register-manual` - Registration API

---

### Pathway 3: Open Registration (Self-Signup)

**URL:** `/alumni/register`

**Note:** Only available if admin enables open registration

**Step 1: Fill Registration Form**
```
User provides:
- Full Name
- Email (unique)
- Batch Year
- Branch
- College
- Course (optional)
- Phone (optional)
- Current Role (optional)
- Current Company (optional)
- ID Proof (image upload to Cloudinary)
- Professional Details
- Address, DOB, Gender (optional)
```

**Step 2: Submit Registration**
```
Request to /api/alumni/open-registration (POST)

System:
1. Validates all required fields
2. Checks email uniqueness
3. Uploads ID proof to Cloudinary
4. Creates RegistrationRequest record:
   - status = PENDING
   - authProvider = MANUAL
   - All fields saved for admin review

5. Returns confirmation message
6. Frontend shows "Pending Approval" message
7. Alumni cannot login until approved
```

**Step 3: Admin Review & Approval**
```
Admin sees request in /admin/requests

Options:
1. APPROVE:
   - Converts RegistrationRequest to Alumni
   - Sets isRegistered = true
   - Sends welcome email
   - Alumni can now login

2. REJECT:
   - Sends rejection email with optional reason
   - RegistrationRequest marked REJECTED
   - Alumni can try again or contact admin
```

**Database Records:**
```typescript
RegistrationRequest {
  id: string
  name: string
  email: string (unique)
  batchYear: number
  branch: string
  college: string
  authProvider: "MANUAL"
  idProffUrl: string (Cloudinary)
  status: PENDING
  reviewedBy?: Staff
  reviewedAt?: DateTime
  rejectionReason?: string
  createdAt: DateTime
}

// When approved, converts to:
Alumni {
  id: string
  email: string
  name: string
  batchYear: number
  branch: string
  college: string
  isRegistered: true
  campusId: string
  // All other fields from request
}
```

---

### Alumni Session Management

**Token Management:**
```typescript
When alumni logs in:
1. Create access token (15m expiry)
2. Create refresh token (7d expiry)
3. Store both in httpOnly cookies:
   - alumniAccessToken
   - alumniRefreshToken

4. Store refresh token in DB:
   - Alumni.alumniRefreshTokens: string[]
   - Allows multiple active sessions
   - Can invalidate specific sessions

When access token expires:
1. Frontend detects 401 error
2. Calls /api/alumni/refresh (POST)
3. Sends alumniRefreshToken
4. System validates token against DB
5. Issues new access token
6. Frontend retries original request

Logout:
1. Frontend calls /api/alumni/logout
2. System removes refresh token from DB
3. Clears cookies on client
4. Redirects to /alumni/login
```

**Code Reference:**
- `src/lib/auth/alumni-jwt.ts` - Token generation & validation
- `src/lib/auth/getCurrentAlumni.ts` - Session checking

---

## 👥 Alumni Profile Management

### Profile Setup (First Login)

**URL:** `/alumni/(protected)/profile/[id]`

**Default Profile Fields:**
```
From registration:
- Name
- Email
- Batch Year
- Branch
- College
- Campus

Can add:
- Avatar Image (Cloudinary upload)
- Phone
- Current Role
- Current Company
- City
- LinkedIn URL
- Bio/About Me
- Date of Birth
- Gender
- Address Line
- Pincode
```

**Education History:**
```
Add multiple entries:
- School/College Name
- Degree
- Field of Study
- Start Date
- End Date (or current if still studying)
- Description
- Is Current? toggle
```

**Work Experience:**
```
Add multiple entries:
- Company Name
- Job Title
- Location
- Start Date
- End Date (or current if still employed)
- Description
- Is Current? toggle
```

**Database Schema:**
```typescript
Alumni {
  // Basic
  id: string
  name: string
  email: string
  batchYear: number
  branch: string
  college: string
  campusId: string

  // Optional profile
  currentRole?: string
  currentCompany?: string
  city?: string
  linkedinUrl?: string
  avatarUrl?: string (Cloudinary)
  bio?: string
  phone?: string

  // Personal
  dob?: DateTime
  gender?: MALE | FEMALE | OTHER
  addressLine?: string
  pincode?: string

  // Activity
  isActive: boolean
  lastLoginAt?: DateTime
  createdAt: DateTime
}

Education {
  id: string
  alumniId: string
  school: string
  degree: string
  fieldOfStudy?: string
  startDate: DateTime
  endDate?: DateTime
  isCurrent: boolean
  description?: string
}

WorkExperience {
  id: string
  alumniId: string
  company: string
  title: string
  location?: string
  startDate: DateTime
  endDate?: DateTime
  isCurrent: boolean
  description?: string
}
```

---

## 🌐 Alumni Community Features

### 1. **Social Feed** (`/alumni/(protected)/feed`)

**Features:**
```
- View posts from all campus alumni
- Create new posts
- Comment on posts
- Like posts
- Real-time updates
```

**Post Creation:**
```
User can post:
- Text content
- Multiple images (Cloudinary upload)
- Privacy: Campus-wide visible

Post appears for:
- Creator
- All alumni on same campus
- Staff on same campus
```

**Engagement:**
```
Like:
- Click like on any post
- Like counter increments
- Delete like by clicking again

Comment:
- Add text comment
- Comments show with commenter name + avatar
- Edit own comments
- Delete own comments

Database:
Post {
  id: string
  content?: string
  images: string[] (Cloudinary URLs)
  authorId: string (alumni)
  createdAt: DateTime
}

Like {
  postId: string
  alumniId: string
  unique([postId, alumniId])
}

Comment {
  content: string
  postId: string
  alumniId: string
  createdAt: DateTime
}
```

**Code Reference:**
- `src/actions/events.ts` - Post actions

---

### 2. **Events** (`/alumni/(protected)/events`)

**Features:**
```
- View all campus events
- Filter by category, date, search
- RSVP to events
- View RSVP status and attendee list
```

**Event Discovery:**
```
Display:
- Event title & description
- Date & venue
- Event image
- RSVP deadline
- Attendee count
- Categories (Workshop, Reunion, Networking, etc.)

Filters:
- Category
- Date range
- Search by title/venue
- Upcoming/Past events
```

**RSVP System:**
```
Alumni can RSVP as:
1. ATTENDING - Confirmed attendance
2. NOT_ATTENDING - Cannot make it
3. MAYBE - Interested but uncertain

Can add optional message:
"Looking forward to networking!"

View event details:
- Full description
- Full attendee list
- Other RSVPs (Attending/Maybe/Not Attending)
- Comments from attendees
```

**Event Notifications:**
```
When RSVP as ATTENDING:
- Receive EVENT_REMINDER email 24h before
- Contains event details + reminder
- Sent via Brevo

When event published:
- All campus alumni get announcement
- EVENT_ANNOUNCEMENT email with event link
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
  postedByStaffId?: string
  postedByAlumniId?: string
  createdAt: DateTime
}

Rsvp {
  alumniId: string
  eventId: string
  status: ATTENDING | NOT_ATTENDING | MAYBE
  message?: string
  respondedAt: DateTime
  unique([alumniId, eventId])
}
```

---

### 3. **Networking & Connections** (`/alumni/(protected)/networking`)

**Features:**
```
- Browse alumni directory
- Send connection requests
- Accept/reject connection requests
- View connected alumni profiles
```

**Connection Flow:**
```
1. Browse alumni directory
2. Click "Connect" on profile
3. Send connection request with optional message

Request shows as:
- PENDING in recipient's requests
- PENDING in sender's sent connections

Recipient can:
- ACCEPT → Become connected
- REJECT → Status changes to REJECTED

Connected alumni:
- Can view full profiles
- Can message (if messaging feature enabled)
- Show in network list
```

**Alumni Directory:**
```
Search & filter by:
- Name
- Batch year
- Branch
- College
- Current company
- Current role
- City

Display:
- Profile picture
- Name
- Batch year, branch, college
- Current role & company
- Mutual connections count
- Connection status
```

**Database Schema:**
```typescript
Connection {
  id: string
  senderAlumniId: string
  receiverAlumniId: string
  status: PENDING | ACCEPTED | REJECTED
  createdAt: DateTime
  respondedAt?: DateTime
  
  sender: Alumni
  receiver: Alumni
  
  unique([senderAlumniId, receiverAlumniId])
}
```

---

### 4. **Job Portal** (`/alumni/(protected)/jobs`)

**Features:**
```
- Browse job postings
- Advanced filtering
- View job details
- Apply to jobs
- Track applications
```

**Job Browsing:**
```
View all active jobs with:
- Job title
- Company name
- Location
- Brief description
- Industry tag
- Job type tag (Full-time, Internship)
- Apply button

Filters:
- Search by keyword
- Filter by industry
- Filter by job type
- Filter by workplace (Remote, On-site, Hybrid)
- Filter by experience level
- Filter by salary range

Sorting:
- Recently posted
- Expiring soon
- Most relevant
```

**Job Details:**
```
Full job page shows:
- Complete description
- Required skills
- Qualifications
- Salary range
- Apply URL (external link)
- Posted date
- Expiry date
- Similar jobs
```

**Job Application:**
```
Alumni click "Apply" → directed to:
- Company website (external apply URL)
- OR resume upload (if internal application)

Tracking:
- Alumni can mark job as "Interested"
- Save to job lists
- Get notifications when similar jobs posted
```

**Job Types:**
```
VACANCY:
- Regular job opening
- Usually with specific company
- Fixed deadline

ACTIVE_DRIVE:
- Campus placement drive
- Company posts opening dates/schedule
- Higher priority/visibility
- May have campus visit dates
```

**Database Schema:**
```typescript
Job {
  id: string
  title: string
  company: string
  description: string
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

### 5. **Startup Ecosystem** (`/alumni/(protected)/startups`)

**Features:**
```
- Browse alumni startups
- View startup details
- Connect with founders
- Showcase startup
```

**Startup Directory:**
```
Display startup cards:
- Startup name
- Logo
- Brief description
- Industry
- Founded year
- Founder name & profile
- Website link
- Contact button
```

**Startup Details:**
```
Click startup to see:
- Full description
- Business model
- Team members
- Website & social links
- Recent updates
- Founder profile with:
  * Professional background
  * LinkedIn profile
  * Contact information
```

**Startup Submission:**
```
Alumni can register startup:
- Fill startup details
- Upload logo (Cloudinary)
- Add description
- Provide contact info

Admin reviews and approves:
- Can feature on landing page
- Can hide if spam/inappropriate
```

**Database Schema:**
```typescript
StartUp {
  id: string
  name: string
  description: string
  websiteUrl?: string
  logoUrl?: string (Cloudinary)
  industry?: string
  foundedYear?: number
  founderId: string (Alumni)
  founder: Alumni
  createdAt: DateTime
}
```

---

### 6. **Photo Gallery & Yearbook** (`/alumni/(protected)/gallery`)

**Features:**
```
- View photo albums
- Browse event photos
- View yearbook memories
- Photo timeline
```

**Album Browsing:**
```
View albums organized by:
- Event name
- Year
- Category

Click album to see:
- All images in masonry layout
- Image captions
- Upload date
- Likes/comments on photos
```

**Album Types:**
```
Event Albums:
- Auto-created from events
- Contains event photos

Yearbook Albums:
- Batch-wise (Batch 2019, Batch 2020, etc.)
- Class photos
- Year highlights

Memories Albums:
- Alumni submissions
- Reunions
- Campus visits
```

**Database Schema:**
```typescript
Album {
  id: string
  title: string
  description?: string
  alumniId?: string (if alumni-submitted)
  postedByStaffId?: string (if admin-created)
  images: AlbumImage[]
  isPublished: boolean
  createdAt: DateTime
}

AlbumImage {
  id: string
  albumId: string
  imageUrl: string (Cloudinary)
  caption?: string
  showOnLanding: boolean
  createdAt: DateTime
}
```

---

## 📰 Alumni News & Updates

### 1. **News Corner** (`/alumni/(protected)/newscorner`)

**Features:**
```
- Read alumni success stories
- View campus announcements
- Subscribe to newsletter
- News categorization
```

**News Types:**
```
- Alumni achievements
- Campus updates
- Event announcements
- Placement statistics
- Success stories
```

---

### 2. **Notice Board** (`/alumni/(protected)/noticeboard`)

**Features:**
```
- Important announcements
- Official notices
- Event schedules
- Deadlines & dates
```

---

## 📊 Alumni Profile Analytics

**Tracked Metrics:**
```
- Last login date
- Profile completion percentage
- Number of connections
- Events attended
- Posts created
- Profile views
```

**Privacy Settings:**
```
Alumni can control:
- Profile visibility (Full, Limited, Private)
- Who can see email
- Who can send connections
- Which profile fields are public
```

---

## 🔄 Alumni Account Management

### Settings (`/alumni/(protected)/settings`)

**Password Change:**
```
Old password → New password → Confirm
- Validates old password matches
- Updates passwordHash
- Logs out all sessions
```

**Email Preferences:**
```
Subscribe/Unsubscribe from:
- Event announcements
- Job postings
- Newsletter
- Platform notifications
```

**Privacy Settings:**
```
- Profile visibility
- Data sharing preferences
- Activity visibility
```

**Account Deletion:**
```
- Requires password confirmation
- Anonymizes profile data
- Keeps email to prevent re-registration
- Archives posts/comments
```

---

## 📲 Notifications & Email

**Email Types Alumni Receive:**

| Type | Trigger | Content |
|------|---------|---------|
| Invitation | Batch import + send | Unique invite link |
| Welcome | Registration approved | Account setup guide |
| Event Announcement | Event published | Event details + RSVP link |
| Event Reminder | 24h before RSVP attending | Event details + venue |
| Job Posted | New job in filters | Job title + company |
| Connection Request | Alumni sends request | Sender details + message |
| Post Comment | Someone comments on post | Comment preview + link |
| Newsletter | Weekly/Monthly (if subscribed) | Latest news + events |

**Email Tracking:**
```
System logs each email:
EmailLog {
  recipientEmail: string
  alumniId: string
  type: EmailType
  status: QUEUED | SENT | FAILED | BOUNCED
  brevoMessageId: string (from API)
  sentAt: DateTime
}

Admin can:
- View delivery rates
- Track bounced emails
- Resend failed emails
```

---

## 🔐 Alumni Access Control

**Protected Routes (Require Authentication):**
```
/alumni/(protected)/*
├── /feed (social feed)
├── /events (event listing)
├── /jobs (job portal)
├── /profile/[id] (view/edit profile)
├── /networking (connections)
├── /startups (startup ecosystem)
├── /gallery (photo albums)
├── /newscorner (news)
├── /noticeboard (notices)
├── /settings (account settings)
└── /yearbook (yearbook & memories)
```

**Campus-Based Data Visibility:**
```
Alumni can only see:
- Posts from same campus alumni
- Events from same campus
- Jobs from same campus
- Connections from same campus
- Alumni directory from same campus
```

**Middleware Protection:**
```typescript
// In next.js middleware:
1. Check alumniAccessToken cookie
2. Verify token validity
3. If expired: use refreshToken to get new token
4. If missing/invalid: redirect to login
5. Allow access only to own campus data
```

---

## 📊 Usage Statistics (Alumni Perspective)

**Profile Dashboard:**
```
Alumni see their own stats:
- Profile views (if feature enabled)
- Connections count
- Posts created
- Events attended
- Group memberships
- Engagement score
```

---

## 📚 Related Documentation

- See `1_PROJECT_OVERVIEW.md` for tech stack
- See `2_ADMIN_PORTAL_WORKFLOW.md` for admin features
- See `4_DATABASE_SCHEMA.md` for data models
- See `5_API_DOCUMENTATION.md` for API endpoints
