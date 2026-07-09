# API Documentation
## Complete API Reference for PTUMNI Portal

---

## 📋 API Overview

**Base URL:** `https://ptumni.vercel.app/api` (or local: `http://localhost:3000/api`)

**Authentication:** JWT tokens in httpOnly cookies
- `accessToken` - Admin/Staff authentication
- `alumniAccessToken` - Alumni authentication

**Response Format:** JSON

---

## 🔐 Admin/Staff API Endpoints

### Authentication Endpoints

#### **POST** `/admin/register`
Register new admin/staff account

**Request:**
```json
{
  "name": "John Doe",
  "email": "admin@ptu.ac.in",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Check email for OTP.",
  "otpToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error (400):**
```json
{
  "error": "Email already exists"
}
```

---

#### **POST** `/admin/verify-otp`
Verify OTP and activate account

**Request:**
```json
{
  "otp": "123456",
  "otpToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified. You can now login."
}
```

---

#### **POST** `/admin/login`
Login to admin account

**Request:**
```json
{
  "email": "admin@ptu.ac.in",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "staff": {
    "id": "staff-123",
    "name": "John Doe",
    "email": "admin@ptu.ac.in",
    "role": "ADMIN",
    "campusId": null
  }
}
```

**Cookies Set:**
```
accessToken: eyJhbGciOiJIUzI1NiIs...
refreshToken: eyJhbGciOiJIUzI1NiIs...
```

---

#### **POST** `/admin/logout`
Logout and clear tokens

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### **POST** `/admin/refresh`
Refresh access token using refresh token

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed"
}
```

---

#### **GET** `/admin/me`
Get current logged-in staff details

**Response (200):**
```json
{
  "id": "staff-123",
  "name": "John Doe",
  "email": "admin@ptu.ac.in",
  "role": "ADMIN",
  "modules": ["dashboard", "alumni", "events"],
  "isVerified": true
}
```

---

### Alumni Management Endpoints

#### **POST** `/admin/import-alumni`
Import alumni from CSV/XLSX file

**Request (multipart/form-data):**
```
- file: <CSV or XLSX file>
- batchLabel: "CSE Batch 2019"
- campusId: "campus-123"
```

**CSV Format:**
```
name,email,batch_year,branch,college,course,enrollment_no,phone
John Doe,john@example.com,2019,CSE,IKGPTU,B.Tech,PT2019001,9876543210
```

**Response (200):**
```json
{
  "success": true,
  "batchId": "batch-456",
  "imported": {
    "totalCount": 100,
    "successCount": 95,
    "failedCount": 5
  },
  "errors": [
    {
      "row": 3,
      "email": "invalid-email",
      "reason": "Invalid email format"
    }
  ]
}
```

---

#### **GET** `/admin/alumni?campus={campusId}&page={page}&limit={limit}`
List alumni with pagination

**Query Parameters:**
```
campus=campus-123       # Filter by campus
page=1                  # Page number (1-indexed)
limit=20                # Results per page
search=john             # Search by name/email
status=REGISTERED       # Filter by invite status
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "alumni-123",
      "name": "John Doe",
      "email": "john@example.com",
      "batchYear": 2019,
      "branch": "CSE",
      "college": "IKGPTU",
      "inviteStatus": "REGISTERED",
      "isRegistered": true,
      "registeredAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245
  }
}
```

---

#### **POST** `/admin/send-invitations`
Send invitation emails to alumni batch

**Request:**
```json
{
  "batchId": "batch-456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Invitations sent",
  "sentCount": 95,
  "failedCount": 5
}
```

---

### Events Management Endpoints

#### **POST** `/admin/events`
Create event

**Request:**
```json
{
  "title": "Alumni Reunion 2024",
  "description": "Annual alumni reunion",
  "category": "Reunion",
  "eventDate": "2024-06-15T10:00:00Z",
  "venue": "Main Campus Auditorium",
  "rsvpDeadline": "2024-06-10T10:00:00Z",
  "isPublished": true,
  "campusId": "campus-123"
}
```

**Response (201):**
```json
{
  "success": true,
  "event": {
    "id": "event-789",
    "title": "Alumni Reunion 2024",
    "eventDate": "2024-06-15T10:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### **GET** `/admin/events?campus={campusId}`
List events for campus

**Response (200):**
```json
{
  "success": true,
  "events": [
    {
      "id": "event-789",
      "title": "Alumni Reunion 2024",
      "description": "Annual alumni reunion",
      "eventDate": "2024-06-15T10:00:00Z",
      "venue": "Main Campus Auditorium",
      "category": "Reunion",
      "isPublished": true,
      "rsvpCount": 150,
      "attendingCount": 120,
      "maybeCount": 20,
      "notAttendingCount": 10
    }
  ]
}
```

---

#### **PUT** `/admin/events/{eventId}`
Update event

**Request:**
```json
{
  "title": "Updated Event Title",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "event": { /* updated event */ }
}
```

---

#### **DELETE** `/admin/events/{eventId}`
Delete event

**Response (200):**
```json
{
  "success": true,
  "message": "Event deleted"
}
```

---

### Jobs Management Endpoints

#### **POST** `/admin/jobs`
Post job opportunity

**Request:**
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "We are hiring...",
  "location": "Bangalore",
  "category": "VACANCY",
  "salaryRange": "10-15 LPA",
  "applyUrl": "https://careers.techcorp.com/...",
  "metadata": {
    "workplaceType": "On-site",
    "type": "Full-time",
    "experienceRange": "0-2 years",
    "industry": "IT",
    "skills": ["Python", "React", "AWS"]
  },
  "expireAt": "2024-06-30T23:59:59Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "job": {
    "id": "job-999",
    "title": "Software Engineer",
    "company": "Tech Corp",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### **GET** `/admin/jobs?campus={campusId}`
List jobs

**Query Parameters:**
```
campus=campus-123
active=true
category=VACANCY
```

**Response (200):**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job-999",
      "title": "Software Engineer",
      "company": "Tech Corp",
      "location": "Bangalore",
      "category": "VACANCY",
      "isActive": true,
      "salaryRange": "10-15 LPA",
      "metadata": {
        "industry": "IT",
        "type": "Full-time"
      }
    }
  ]
}
```

---

### Sub-Admin Management

#### **POST** `/admin/subadmins`
Create sub-admin (Admin only)

**Request:**
```json
{
  "name": "Campus Admin",
  "email": "campus@ptu.ac.in",
  "campusId": "campus-123",
  "modules": ["dashboard", "alumni", "events", "jobs"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Sub-admin created. Registration email sent.",
  "staff": {
    "id": "staff-456",
    "email": "campus@ptu.ac.in"
  }
}
```

---

#### **GET** `/admin/subadmins`
List sub-admins (Admin only)

**Response (200):**
```json
{
  "success": true,
  "subadmins": [
    {
      "id": "staff-456",
      "name": "Campus Admin",
      "email": "campus@ptu.ac.in",
      "campusId": "campus-123",
      "modules": ["dashboard", "alumni", "events", "jobs"],
      "isVerified": true
    }
  ]
}
```

---

## 👥 Alumni API Endpoints

### Alumni Authentication

#### **POST** `/alumni/verify-token`
Verify invitation token

**Query Parameters:**
```
token=eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "valid": true,
  "alumni": {
    "id": "alumni-123",
    "name": "John Doe",
    "email": "john@example.com",
    "batchYear": 2019,
    "branch": "CSE",
    "college": "IKGPTU"
  }
}
```

---

#### **POST** `/alumni/register-manual`
Manual registration with password

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Redirecting to dashboard.",
  "alumni": {
    "id": "alumni-123",
    "email": "john@example.com",
    "isRegistered": true
  }
}
```

**Cookies Set:**
```
alumniAccessToken: eyJhbGciOiJIUzI1NiIs...
alumniRefreshToken: eyJhbGciOiJIUzI1NiIs...
```

---

#### **POST** `/alumni/refresh`
Refresh alumni access token

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed"
}
```

---

#### **POST** `/alumni/logout`
Logout alumni

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Alumni Profile

#### **GET** `/alumni/profile`
Get current alumni profile

**Response (200):**
```json
{
  "success": true,
  "alumni": {
    "id": "alumni-123",
    "name": "John Doe",
    "email": "john@example.com",
    "currentRole": "Software Engineer",
    "currentCompany": "Tech Corp",
    "city": "Bangalore",
    "avatarUrl": "https://cloudinary.com/...",
    "bio": "Passionate developer",
    "linkedinUrl": "https://linkedin.com/in/johndoe"
  }
}
```

---

#### **PUT** `/alumni/profile`
Update alumni profile

**Request:**
```json
{
  "name": "John Doe",
  "currentRole": "Senior Engineer",
  "currentCompany": "Tech Corp",
  "city": "Mumbai",
  "bio": "Experienced developer"
}
```

**Response (200):**
```json
{
  "success": true,
  "alumni": { /* updated profile */ }
}
```

---

#### **POST** `/alumni/profile/avatar`
Upload profile avatar

**Request (multipart/form-data):**
```
- file: <image file>
```

**Response (200):**
```json
{
  "success": true,
  "avatarUrl": "https://cloudinary.com/..."
}
```

---

### Alumni Events

#### **GET** `/alumni/events?campus={campusId}`
Get events for alumni

**Query Parameters:**
```
campus=campus-123
category=Reunion
search=alumni
dateFrom=2024-01-01
dateTo=2024-12-31
page=1
limit=20
```

**Response (200):**
```json
{
  "success": true,
  "events": [
    {
      "id": "event-789",
      "title": "Alumni Reunion 2024",
      "description": "Annual alumni reunion",
      "eventDate": "2024-06-15T10:00:00Z",
      "venue": "Main Campus Auditorium",
      "category": "Reunion",
      "coverImageUrl": "https://cloudinary.com/...",
      "attendingCount": 120,
      "maybeCount": 20,
      "totalRsvps": 150,
      "myRsvp": {
        "status": "ATTENDING",
        "message": "Looking forward to it"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

---

#### **POST** `/alumni/events/{eventId}/rsvp`
RSVP to event

**Request:**
```json
{
  "status": "ATTENDING",
  "message": "Looking forward to it"
}
```

**Response (201):**
```json
{
  "success": true,
  "rsvp": {
    "id": "rsvp-111",
    "eventId": "event-789",
    "status": "ATTENDING",
    "respondedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### **PUT** `/alumni/events/{eventId}/rsvp`
Update RSVP status

**Request:**
```json
{
  "status": "MAYBE",
  "message": "Not sure yet"
}
```

**Response (200):**
```json
{
  "success": true,
  "rsvp": { /* updated RSVP */ }
}
```

---

### Alumni Jobs

#### **GET** `/alumni/jobs`
Get job listings

**Query Parameters:**
```
search=engineer
industry=IT
type=Full-time
workplace=Remote
experience=0-2 years
salary=10-15
page=1
limit=20
```

**Response (200):**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job-999",
      "title": "Software Engineer",
      "company": "Tech Corp",
      "location": "Bangalore",
      "description": "We are hiring...",
      "category": "VACANCY",
      "salaryRange": "10-15 LPA",
      "applyUrl": "https://careers.techcorp.com/...",
      "metadata": {
        "workplaceType": "On-site",
        "type": "Full-time",
        "industry": "IT",
        "skills": ["Python", "React"]
      }
    }
  ],
  "filters": {
    "industries": ["IT", "Finance", "E-commerce"],
    "types": ["Full-time", "Internship"],
    "workplaces": ["Remote", "On-site", "Hybrid"],
    "experiences": ["Fresher", "0-2 years", "2-5 years"]
  }
}
```

---

### Alumni Social Feed

#### **POST** `/alumni/posts`
Create post

**Request (multipart/form-data):**
```
- content: "This is my post"
- images: [<file1>, <file2>] (optional)
```

**Response (201):**
```json
{
  "success": true,
  "post": {
    "id": "post-222",
    "content": "This is my post",
    "images": ["https://cloudinary.com/..."],
    "author": {
      "id": "alumni-123",
      "name": "John Doe",
      "avatarUrl": "https://cloudinary.com/..."
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### **GET** `/alumni/feed`
Get social feed

**Query Parameters:**
```
page=1
limit=20
```

**Response (200):**
```json
{
  "success": true,
  "posts": [
    {
      "id": "post-222",
      "content": "This is my post",
      "images": ["https://cloudinary.com/..."],
      "author": {
        "id": "alumni-123",
        "name": "John Doe",
        "avatarUrl": "https://cloudinary.com/..."
      },
      "likes": 15,
      "comments": 3,
      "myLike": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### **POST** `/alumni/posts/{postId}/like`
Like post

**Response (201):**
```json
{
  "success": true,
  "message": "Post liked"
}
```

---

#### **POST** `/alumni/posts/{postId}/comment`
Add comment

**Request:**
```json
{
  "content": "Great post!"
}
```

**Response (201):**
```json
{
  "success": true,
  "comment": {
    "id": "comment-333",
    "content": "Great post!",
    "author": {
      "id": "alumni-123",
      "name": "John Doe"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Alumni Connections

#### **POST** `/alumni/connections`
Send connection request

**Request:**
```json
{
  "receiverAlumniId": "alumni-456",
  "message": "Let's connect!"
}
```

**Response (201):**
```json
{
  "success": true,
  "connection": {
    "id": "conn-444",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### **PUT** `/alumni/connections/{connectionId}`
Accept/Reject connection

**Request:**
```json
{
  "status": "ACCEPTED"
}
```

**Response (200):**
```json
{
  "success": true,
  "connection": {
    "id": "conn-444",
    "status": "ACCEPTED",
    "respondedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📊 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "details": { /* optional details */ }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "pages": 13
  }
}
```

---

## 🔐 Authentication Headers

All authenticated requests include:

```
Cookie: accessToken=eyJhbGciOiJIUzI1NiIs...
```

Or for custom implementations:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## ⚠️ Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Login required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Try again or contact support |

---

## 🚀 Rate Limiting

- **Default:** 100 requests per minute per IP
- **Auth endpoints:** 5 requests per minute (prevent brute force)
- **Upload endpoints:** 50 requests per hour

---

## 📚 Related Documentation

- See `1_PROJECT_OVERVIEW.md` for overall architecture
- See `2_ADMIN_PORTAL_WORKFLOW.md` for admin features
- See `3_ALUMNI_PORTAL_WORKFLOW.md` for alumni features
