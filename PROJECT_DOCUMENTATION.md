# 📚 CampusAssist - Complete Project Documentation

**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Production Ready  
**Type:** Full-Stack Web Application

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Time Constraints](#time-constraints)
5. [Hardware Requirements](#hardware-requirements)
6. [Team Management](#team-management)
7. [Features & Use Cases](#features--use-cases)
8. [Use Case Diagram](#use-case-diagram)
9. [Data Flow](#data-flow)
10. [Security Implementation](#security-implementation)
11. [Database Schema](#database-schema)
12. [API Endpoints](#api-endpoints)
13. [Design Patterns](#design-patterns)

---

## 1. PROJECT OVERVIEW

### What is CampusAssist?

**CampusAssist** is a comprehensive **Smart Academic Management & Collaboration Platform** designed for modern university ecosystems. It brings announcements, routine schedules, smart classrooms, resource sharing, study groups, deadlines, results, and consultations into one unified workspace.

**Inspiration:** Google Classroom meets Microsoft Teams for academic institutions

### Key Objectives

| Objective | Description |
|-----------|-------------|
| **Centralization** | Single platform for all academic activities |
| **Collaboration** | Enable students & teachers to work together efficiently |
| **Smart Routing** | Intelligent free classroom detection & recommendations |
| **Accessibility** | Role-based interfaces for students, teachers, admins |
| **Scalability** | Cloud-ready with PostgreSQL + Node.js backend |

### Project Scope

**Includes:**
- ✅ User Authentication & Authorization (JWT + Role-Based Access)
- ✅ Multi-role Support (Student, Teacher, Admin)
- ✅ Announcements Management
- ✅ Smart Classrooms with Attendance Tracking
- ✅ Resource Sharing & Downloads
- ✅ Study Groups & Collaborations
- ✅ Assignment Management
- ✅ Results Portal
- ✅ Consultation Booking
- ✅ Bus Schedule Tracking
- ✅ Routine Management & Parsing
- ✅ Smart Recommendation Engine
- ✅ File Upload & Management

**Excludes:**
- ❌ Video Conferencing (future feature)
- ❌ Live Chat (planned phase 2)
- ❌ Mobile Apps (web-responsive only)
- ❌ Third-party integrations (Google, MS)

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend Technologies

#### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React.js** | 18.2.0 | UI framework with hooks & functional components |
| **React Router DOM** | 6.20.1 | Client-side routing & navigation |
| **React Toastify** | 9.1.3 | Toast notifications & user feedback |

#### UI & Styling
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 3.4.19 | Utility-first CSS framework |
| **Material-UI (MUI)** | 5.14.20 | Pre-built React components & icons |
| **Framer Motion** | 12.38.0 | Animation library for smooth transitions |
| **Bootstrap** | 5.3.2 | Grid system & responsive utilities |
| **Emotion** | 11.11.1 | CSS-in-JS styling (MUI dependency) |

#### HTTP & State Management
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Axios** | 1.6.2 | HTTP client for API calls |
| **React Context API** | Built-in | Global state management (Auth) |

#### Data Visualization & Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Recharts** | 2.10.1 | Charts & graphs for analytics |
| **date-fns** | 2.30.0 | Date manipulation & formatting |

#### Build Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Scripts** | 5.0.1 | Create React App build tooling |
| **PostCSS** | 8.5.8 | CSS transformations |
| **Autoprefixer** | 10.4.27 | Vendor prefixes for CSS |

### 2.2 Backend Technologies

#### Server Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime environment |
| **Express.js** | 4.18.2 | Lightweight web application framework |
| **Nodemon** | 3.0.2 | Auto-restart development server |

#### Database & ORM
| Technology | Version | Purpose |
|-----------|---------|---------|
| **PostgreSQL** | 14+ | Relational database management system |
| **node-postgres (pg)** | 8.11.3 | PostgreSQL client for Node.js |
| **pg-format** | 1.0.4 | Safe SQL formatting & query building |

#### Authentication & Security
| Technology | Version | Purpose |
|-----------|---------|---------|
| **JWT (jsonwebtoken)** | 9.0.2 | Token-based authentication |
| **bcryptjs** | 2.4.3 | Password hashing & verification |
| **Helmet** | 7.1.0 | HTTP headers security middleware |
| **express-rate-limit** | 7.1.5 | Rate limiting & DDoS protection |
| **express-validator** | 7.0.1 | Input validation & sanitization |

#### File Handling
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Multer** | 1.4.5-lts.1 | File upload middleware |
| **csv-parser** | 3.0.0 | CSV file parsing |
| **pdf-parse** | 1.1.1 | PDF document parsing |

#### Middleware & Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing |
| **Morgan** | 1.10.0 | HTTP request logging |
| **Moment.js** | 2.29.4 | Date/time manipulation |
| **dotenv** | 16.3.1 | Environment variable management |

#### Deployment
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vercel** | Latest | Serverless backend deployment |
| **Netlify** | Latest | Frontend hosting & CI/CD |
| **serverless-http** | 4.0.0 | Serverless adapter for Express |

---

## 3. ARCHITECTURE

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Port 3000)                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React.js (18.2.0)                                         │ │
│  │  ├─ Components (Functional + Hooks)                        │ │
│  │  ├─ Auth Context (Global Auth State)                       │ │
│  │  ├─ Routing (React Router v6)                              │ │
│  │  ├─ Services (Axios + API Layer)                           │ │
│  │  └─ UI (Tailwind + MUI + Framer Motion)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│              API GATEWAY & MIDDLEWARE (Express.js)               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Security:                                                  │ │
│  │  ├─ Helmet (HTTP security headers)                          │ │
│  │  ├─ CORS (whitelist origin)                                 │ │
│  │  ├─ Rate Limiter (500 reqs/15min)                           │ │
│  │  └─ Body Parser (JSON, URL-encoded)                         │ │
│  │                                                             │ │
│  │  Authentication:                                            │ │
│  │  ├─ JWT Verification Middleware                             │ │
│  │  ├─ Role-Based Access Control (RBAC)                        │ │
│  │  └─ Token Expiry Check                                      │ │
│  │                                                             │ │
│  │  Utilities:                                                 │ │
│  │  ├─ Morgan (HTTP logging)                                   │ │
│  │  ├─ Error Handler (global)                                  │ │
│  │  └─ Request Logger                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    PORT 5000 (REST API)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ROUTE LAYER (/api/...)                                    │ │
│  │  ├─ /auth (register, login, profile)                       │ │
│  │  ├─ /announcements (CRUD)                                  │ │
│  │  ├─ /assignments (CRUD)                                    │ │
│  │  ├─ /classrooms (free room finder)                         │ │
│  │  ├─ /resources (upload, download, rating)                  │ │
│  │  ├─ /study-groups (collaborate)                            │ │
│  │  ├─ /deadlines (track)                                     │ │
│  │  ├─ /results (upload, view)                                │ │
│  │  ├─ /consultations (book, schedule)                        │ │
│  │  └─ /bus (schedule, route)                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CONTROLLER LAYER (Business Logic)                         │ │
│  │  ├─ authController (register, login, profile updates)      │ │
│  │  ├─ announcementController (post, update, delete)          │ │
│  │  ├─ assignmentController (issue, submit, grade)            │ │
│  │  ├─ classroomController (find free rooms, schedule)        │ │
│  │  ├─ smartClassroomController (attendance tracking)         │ │
│  │  ├─ resultsController (upload, calculate grades)           │ │
│  │  └─ featureControllers (resources, study groups, etc.)     │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  SERVICE LAYER (Reusable Logic)                            │ │
│  │  ├─ UserFactory (create user objects by role)              │ │
│  │  ├─ RecommendationService (scoring algorithm)              │ │
│  │  ├─ NotificationService (observer pattern)                 │ │
│  │  ├─ authStorage (JWT persistence)                          │ │
│  │  └─ classroomFinder (intelligent routing)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  REPOSITORY LAYER (Query Builder)                          │ │
│  │  ├─ BaseRepository (generic CRUD)                          │ │
│  │  │  ├─ create(), read(), update(), delete()                │ │
│  │  │  ├─ findOne(), findAll(), count()                       │ │
│  │  │  └─ query(sql, params) [parameterized]                  │ │
│  │  ├─ userRepo (users table + indexes)                       │ │
│  │  ├─ announcementRepo (announcements + search)              │ │
│  │  ├─ resourceRepo (resources + downloads)                   │ │
│  │  └─ [others: assignments, classrooms, results...]          │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                   DATABASE LAYER (PostgreSQL)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL (v14+, Port 5432)                              │ │
│  │  ├─ Connection Pooling (pg Pool, max 10)                   │ │
│  │  ├─ SSL Support (production/Supabase)                      │ │
│  │  ├─ Parameterized Queries ($1, $2... placeholders)         │ │
│  │  ├─ Transactions (BEGIN/COMMIT/ROLLBACK)                   │ │
│  │  └─ RETURNING * (fast row retrieval)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  TABLES:                                                          │
│  ├─ users (id, email, password, role, department, ...)          │
│  ├─ announcements (id, title, content, posted_by, created_at)   │
│  ├─ assignments (id, title, description, deadline, grade)       │
│  ├─ classrooms (id, name, capacity, building, floor)            │
│  ├─ resources (id, filename, category, downloads, rating)       │
│  ├─ study_groups (id, name, members, description)               │
│  ├─ results (id, student_number, subject, marks)                │
│  ├─ consultations (id, teacher_id, student_id, time)            │
│  ├─ bus_schedule (id, route, stop, arrival_time)                │
│  └─ [audit logs, attachments, etc.]                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Architectural Pattern: 3-Tier MVC

```
PRESENTATION TIER (Frontend)
    ↓
APPLICATION TIER (Backend Controllers + Services)
    ↓
DATA TIER (PostgreSQL via pg library)
```

**Why this architecture?**
- ✅ **Separation of Concerns** — each layer has distinct responsibility
- ✅ **Scalability** — horizontal scaling at each tier independent
- ✅ **Maintainability** — easier debugging and testing
- ✅ **Reusability** — services & repositories used across controllers
- ✅ **Security** — authentication at middleware, authorization at controller

---

## 4. TIME CONSTRAINTS

### 4.1 Project Timeline

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| **M1: Planning & Design** | 3 weeks | Week 1 | Week 3 | ✅ Complete |
| **M2: Backend Architecture** | 4 weeks | Week 4 | Week 7 | ✅ Complete |
| **M3: Frontend Build** | 5 weeks | Week 8 | Week 12 | ✅ Complete |
| **M4: Integration & Testing** | 3 weeks | Week 13 | Week 15 | ✅ Complete |
| **M5: Optimization & Deployment** | 2 weeks | Week 16 | Week 17 | ✅ Complete |
| **M6: Viva & Documentation** | 1 week | Week 18 | Week 18 | 🔄 In Progress |

**Total Project Duration:** 18 weeks (4.5 months)

### 4.2 Sprint Breakdown

#### Sprint 1: Database Design (Week 1-2)
- Schema design for 9+ entities
- Relationship mapping (foreign keys)
- Index optimization
- Trigger creation for audit trails
- **Deliverable:** schema.sql + seed.js

#### Sprint 2: Authentication & Security (Week 2-3)
- JWT implementation
- bcrypt password hashing
- RBAC middleware
- Rate limiting
- **Deliverable:** auth routes + middleware

#### Sprint 3: Core Features (Week 4-8)
- Announcements CRUD
- Classroom management
- Smart recommendation engine
- Resource upload/download
- **Deliverable:** 8+ feature controllers

#### Sprint 4: UI/UX Development (Week 9-12)
- Landing page with Framer Motion
- Dashboard layouts
- Form components
- Data tables & charts
- **Deliverable:** 15+ React components

#### Sprint 5: Testing & Integration (Week 13-15)
- Unit tests (Jest)
- API testing (Postman)
- E2E testing (sample flows)
- Performance testing
- **Deliverable:** test reports + optimization

#### Sprint 6: Deployment & Docs (Week 16-17)
- Deploy backend (Vercel serverless)
- Deploy frontend (Netlify)
- Environment configuration
- Monitoring setup
- **Deliverable:** live URLs + docs

### 4.3 Development Velocity

| Metric | Value |
|--------|-------|
| **Backend Controllers** | 8 controllers (avg 4 hrs each) |
| **Database Queries** | 50+ optimized queries |
| **React Components** | 15+ reusable components |
| **API Endpoints** | 30+ REST routes |
| **Lines of Code** | ~8,000 total |
| **Test Cases** | 24+ automated tests |
| **Average Daily Commits** | 3-5 per developer |

---

## 5. HARDWARE REQUIREMENTS

### 5.1 Development Environment

#### Machine Specifications (Recommended)

| Component | Minimum | Recommended | Optimal |
|-----------|---------|-------------|---------|
| **CPU** | Dual-core 2.0 GHz | Quad-core 2.4 GHz | Hexa-core 3.5+ GHz |
| **RAM** | 4 GB | 8 GB | 16 GB |
| **Storage** | 500 MB | 2 GB | 5 GB |
| **OS** | Windows 10/Linux | Windows 11/macOS 12+ | Latest LTS |
| **Network** | 1 Mbps | 5 Mbps | 10+ Mbps |

#### Why These Specs?
- **4GB RAM Minimum:** Node.js (~300MB) + React dev server (~400MB) + Chrome (~600MB) + others
- **8GB Recommended:** Smooth multitasking with PostgreSQL (~500MB) + multiple browser tabs
- **16GB Optimal:** For production builds, Docker containers, stress testing

### 5.2 Runtime Environment

#### Backend Server

| Resource | Allocation | Notes |
|----------|-----------|-------|
| **Memory** | 512 MB - 1 GB | Node.js heap allocation |
| **CPU** | 1-2 cores | Express processing |
| **Disk** | 100 MB | Logs + file uploads |
| **Network I/O** | Unlimited | REST API calls |
| **Processes** | Single node | Horizontal scaling via replicas |

#### Database Server

| Resource | Allocation | Notes |
|----------|-----------|-------|
| **Memory** | 1-2 GB | Buffer pool for 50K+ records |
| **CPU** | 2 cores | Query optimization |
| **Disk** | 2-5 GB | SSD recommended for 10K+ connections |
| **Backup** | Daily | Point-in-time recovery |
| **WAL Archiving** | Enabled | Write-ahead logs for durability |

#### Frontend Delivery

| Resource | Allocation | Notes |
|----------|-----------|-------|
| **CDN Bandwidth** | 10-50 GB/month | React bundle + assets |
| **Cache** | 24-48 hours | Gzip + Brotli compression |
| **Build Artifacts** | 300 KB | Minified + tree-shaken JS |
| **Images** | Optimized | WebP format, lazy loading |

### 5.3 Network Requirements

```
Internet Speed Test Requirements:

Upload:   3+ Mbps  (file uploads, API requests)
Download: 5+ Mbps  (asset loading, API responses)
Latency:  <100ms   (optimal UX response time)
Jitter:   <20ms    (network stability)
Packet Loss: <0.1% (reliability)
```

### 5.4 Production Deployment

#### Cloud Infrastructure (Vercel + Netlify + Supabase)

| Service | Resource | Cost | Purpose |
|---------|----------|------|---------|
| **Netlify** | 2 GB storage, 100 GB BW/mo | Free | Frontend hosting |
| **Vercel** | 12 serverless functions, 1 GB | Free | Backend API |
| **Supabase** | 500 MB DB, 2 GB BW/mo | Free | PostgreSQL hosting |
| **Custom Domain** | 1 domain | $10-15/yr | SSL + DNS |

#### Minimum Production Setup
```
Load Balancer → [API Server 1, API Server 2] → [PostgreSQL Primary + Replica]
                ↓
        Backup Server (daily snapshots)
```

---

## 6. TEAM MANAGEMENT

### 6.1 Organizational Structure

```
PROJECT LEAD
    ├── Backend Team (2 developers)
    │   ├─ Lead: API Architecture & Database Design
    │   └─ Member: Authentication & Controllers
    │
    ├── Frontend Team (2 developers)
    │   ├─ Lead: UI/UX & Component Architecture
    │   └─ Member: Pages & Integrations
    │
    ├── DevOps/QA (1 person)
    │   ├─ Deployment & Hosting Setup
    │   └─ Testing & Performance Optimization
    │
    └── Documentation (Part-time)
        └─ API docs, User guides, Technical specs
```

### 6.2 Team Roles & Responsibilities

#### Backend Team Lead
**Responsibilities:**
- Design PostgreSQL schema & relationships
- Architect REST API routes
- Implement authentication & security
- Code review & testing
- **Skills:** Node.js, PostgreSQL, security protocols
- **Deliverables:** server.js, controllers/, repositories/
- **Estimated Hours:** 150-200 hrs

#### Backend Developer
**Responsibilities:**
- Implement CRUD operations
- Build services & utilities
- Database migrations & seeds
- API documentation
- **Skills:** JavaScript, SQL, Express.js
- **Deliverables:** features, utils/, database scripts
- **Estimated Hours:** 120-150 hrs

#### Frontend Lead
**Responsibilities:**
- Component architecture & design system
- React Router setup
- Build tooling & optimization
- Performance monitoring
- **Skills:** React, Tailwind CSS, web standards
- **Deliverables:** App.js, component library, routing
- **Estimated Hours:** 160-200 hrs

#### Frontend Developer
**Responsibilities:**
- Build individual components & pages
- API integration with Axios
- Form handling & validation
- Mobile responsiveness
- **Skills:** React Hooks, CSS, Framer Motion
- **Deliverables:** pages/, components/, styling
- **Estimated Hours:** 140-180 hrs

#### QA/DevOps Engineer
**Responsibilities:**
- Write & execute test cases
- Performance testing & profiling
- Deploy to Vercel/Netlify/Supabase
- Monitor production
- **Skills:** Testing frameworks, CI/CD, cloud platforms
- **Deliverables:** test reports, deployment configs
- **Estimated Hours:** 80-120 hrs

### 6.3 Communication Plan

| Meeting | Frequency | Duration | Attendees | Purpose |
|---------|-----------|----------|-----------|---------|
| **Daily Standup** | 9:00 AM | 15 min | All | Progress, blockers, sync |
| **Sprint Planning** | Monday | 1 hour | All | Tasks, estimates, goals |
| **Code Review** | 2x/week | 30 min | Leads | Quality, best practices |
| **Demo** | Friday EOD | 45 min | All | Feature showcase, feedback |
| **Retrospective** | Friday EOD | 30 min | All | Process improvement |

### 6.4 Collaboration Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| **GitHub** | Version control & PR reviews | Daily commits, branches |
| **Discord/Slack** | Team chat & async communication | Quick questions, updates |
| **Trello/Jira** | Task management & sprint planning | Sprint boards, burndown |
| **Figma** | UI/UX design mockups | Designs, prototypes |
| **Postman** | API testing & documentation | Route testing, collections |
| **Google Docs** | Shared documentation | Design docs, meeting notes |

### 6.5 Development Workflow

```
1. Issue Created (GitHub)
   ↓
2. Developer Picks Task
   ↓
3. Create Feature Branch (feature/user-auth)
   ↓
4. Develop & Commit Often
   ↓
5. Push branch → Create Pull Request
   ↓
6. Code Review (lead checks)
   ↓
7. Pass Tests? → Merge to main
   ↓
8. Deploy to staging/production
   ↓
9. Verify & Close Issue
```

---

## 7. FEATURES & USE CASES

### 7.1 Core Features

#### 1. **Authentication & Authorization**
- User registration with role selection (Student, Teacher, Admin)
- Email & password-based login with JWT
- Password hashing with bcryptjs (10 salt rounds)
- Token expiration (7 days) with refresh capability
- Role-based access control (RBAC) middleware
- Account activation/deactivation

**User Journey:**
```
1. User → Visit /login or /register
2. Fill email, password, role, department
3. Submit form → API calls backend
4. Backend hashes password, inserts to DB
5. JWT token generated & sent back
6. Frontend stores token in localStorage
7. Axios intercepts all requests, adds token
8. Navigate to /dashboard
```

#### 2. **Announcements Management**
- Teachers post updates to classes/departments
- Students receive notifications
- Timeline view with filters
- Search & full-text search support
- Like/bookmark functionality

**Entity Relationships:**
```
teachers (1) ──→ (many) announcements ←── (many) students
                                    ↓
                            attachment_files
```

#### 3. **Smart Classrooms**
- Real-time classroom availability checker
- Attendance tracking with QR codes
- Intelligent routing algorithm (finds free rooms)
- Schedule management & timetable view
- Resource booking

**Algorithm:**
```
GET /classrooms/free?time=14:30&duration=1_hour
→ Query DB: SELECT * FROM classrooms WHERE NOT IN (booked_slots)
→ Filter capacity: capacity >= required_seats
→ Return sorted by proximity/capacity
→ User books room → locked for duration
```

#### 4. **Resource Sharing**
- File upload (PDFs, documents, images)
- Download tracking & analytics
- Star rating system (1-5 stars)
- Recommendation algorithm
- Search & categorization

**Recommendation Score Formula:**
```
Score = (downloads × 0.5) + (rating × 0.3) + (recency × 0.2)

Where:
  recency = 5.0 (if ≤7 days old)
           4.0 (if 7-14 days)
           3.0 (if 14-30 days)
           ... and so on

Top resources displayed based on highest score
```

#### 5. **Study Groups**
- Create/join collaborative groups
- Member management
- Group chat history
- Resource sharing within group
- Group announcements

#### 6. **Assignment Management**
- Teachers issue assignments with deadlines
- Students submit assignments
- Automatic grading (if multiple choice)
- Submission tracking

#### 7. **Results Portal**
- Upload marks via CSV
- Student views their marks
- Grade distribution analytics
- GPA calculation
- Transcript generation

#### 8. **Consultations**
- Book teacher consultations
- Calendar scheduling
- Reminder notifications
- Consultation history

#### 9. **Bus Schedule Tracking**
- Bus route information
- Real-time tracking (if available)
- Next bus countdown
- Route history

#### 10. **Deadlines & Routine**
- Aggregate all deadlines (assignments, exams, submissions)
- Calendar view
- Email reminders
- Routine schedule parser from CSV

---

## 8. USE CASE DIAGRAM

### 8.1 System Actors

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CampusAssist System                          │
│                                                                      │
│          ┌────────────────────────────────────────────┐             │
│          │          EXTERNAL ACTORS                   │             │
│          ├────────────────────────────────────────────┤             │
│          │ 1. Student                                 │             │
│          │    - Has: ID, Name, Email, Role, Batch    │             │
│          │    - Access: Student Dashboard             │             │
│          │                                            │             │
│          │ 2. Teacher                                 │             │
│          │    - Has: ID, Name, Email, Department     │             │
│          │    - Can: Post announcements, create...   │             │
│          │                                            │             │
│          │ 3. Admin                                   │             │
│          │    - Can: Manage users, reports            │             │
│          │    - Access: Admin Panel                   │             │
│          │                                            │             │
│          │ 4. Unauthenticated User                    │             │
│          │    - Can: View public pages                │             │
│          │    - Cannot: Access dashboard              │             │
│          └────────────────────────────────────────────┘             │
│                                                                      │
│          SYSTEM: CampusAssist Backend API (PostgreSQL)              │
│                                                                      │
│          DATABASE: PostgreSQL with 9+ tables                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Detailed Use Case Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             CampusAssist Platform                           │
│                                                                             │
│              ┌─────────────────────────────────────────────┐               │
│   Student    │                                             │       Teacher  │
│      ○       │          AUTHENTICATION LAYER               │       ○        │
│      │       │          ├── Register                       │       │        │
│      │───────┼──────────│├── Login                         │───────┤        │
│      │       │          ├── View Profile                   │       │        │
│      │       │          └─── Logout                        │       │        │
│      │       │                                             │       │        │
│      │       ├─────────────────────────────────────────────┤       │        │
│      │       │   STUDENT-ONLY USE CASES                    │       │        │
│      │───────├── View Dashboard                            ├───────┤ Admin  │
│      │       │├─ View My Announcements                     │       │ ○      │
│      │       │├─ View Assigned Assignments                 │       │ │      │
│      │───────├─ Submit Assignments                         │       │─────┤  │
│      │       │├─ View My Results                           │       │     │  │
│      │───────├─ Browse Resources                           │       │     │  │
│      │       │├─ Download & Rate Resources                 │       │     │  │
│      │───────├─ Join Study Groups                          │       │     │  │
│      │       │├─ Book Consultations with Teachers          │       │     │  │
│      │───────├─ Check Free Classrooms                      │       │     │  │
│      │       │├─ View Bus Schedules                        │       │     │  │
│      │───────├─ View Routine                               │       │     │  │
│      │       │└─ View Deadlines Calendar                   │       │     │  │
│      │       │                                             │       │     │  │
│      │       ├─────────────────────────────────────────────┤       │     │  │
│      │       │   TEACHER-ONLY USE CASES                    │       │     │  │
│      │───────├── View Teacher Dashboard        ────────────┼───────┤     │  │
│      │       │├─ Post Announcements            ────────────┼─────┐ │     │  │
│      │───────├─ View My Classes                ────────────┼───┐ │ │     │  │
│      │       │├─ Take Attendance               ────────────┼─┐ │ │ │     │  │
│      │───────├─ Create Assignments  ──────────────────────┼┐│ │ │ │     │  │
│      │       │├─ Grade Submissions             ────────────┼│ │ │ │     │  │
│      │───────├─ Upload Results (CSV)          ──┬──────────┼┤ │ │ │─┐   │  │
│      │       │├─ Join/Create Study Groups      ──┤──────────┼┤ │ │ │ │   │  │
│      │───────├─ Manage Consultations          ──┤──────────┼┤ │ │ │ │   │  │
│      │       │└─ Upload Resources             ──┤──────────┼┤ │ │ │ │   │  │
│      │       │         ↓                        ↓          ↓   │ │ │ │   │  │
│      │       │    ╔═══════════════════════════════════════╗ │ │ │ │   │  │
│      │       │    ║   SHARED USE CASES (All Roles)      ║ │ │ │ │   │  │
│      │       │    ║  ├─ Update Profile                  ║ │ │ │ │   │  │
│      │       │    ║  ├─ View Announcements              ║ │ │ │ │   │  │
│      │       │    ║  ├─ Search Resources                ║ │ │ │ │   │  │
│      │       │    ║  ├─ Join Study Groups               ║ │ │ │ │   │  │
│      │       │    ║  ├─ View Notifications              ║ │ │ │ │   │  │
│      │       │    ║  ├─ View Calendar/Deadlines         ║ │ │ │ │   │  │
│      │       │    ║  └─ Change Password                 ║ │ │ │ │   │  │
│      │       │    ╚═══════════════════════════════════════╝ │ │ │ │   │  │
│      │       │                   ↓                           │ │ │ │   │  │
│      │       │    ╔═════════════════════════════════════╗   │ │ │ │   │  │
│      │       │    ║ ADMIN-ONLY USE CASES               ║   │ │ │ │   │  │
│      │───────├───→║ ├─ Manage All Users                 ║──┐│ │ │ │   │  │
│      │       │    ║ ├─ View System Analytics            ║  │ │ │ │   │  │
│      │───────├───→║ ├─ Manage Classrooms                ║──┼─┐ │ │ │   │  │
│      │       │    ║ ├─ View Reports & Logs              ║  │ │ │ │ │   │  │
│      │───────├───→║ ├─ Suspend/Activate Users           ║  │ │ │ │ │   │  │
│      │       │    ║ ├─ Manage Departments               ║  │ │ │ │ │   │  │
│      │───────├───→║ └─ System Configuration             ║  │ │ │ │ │   │  │
│      │       │    ╚═════════════════════════════════════╝  │ │ │ │ │   │  │
│      │       │         ↓                                    │ │ │ │ │   │  │
│      │       ├──────────────────────────────────────────────┤ │ │ │ │   │  │
│      │       │   SYSTEM ENTITIES (Database)                │ │ │ │ │   │  │
│      │       │  ├─ Users Table ────────────────────────────┼─┴─┼─┼─┼───┤  │
│      │       │  ├─ Announcements ──────────────────────────┼───┴─┼─┼───┤  │
│      │       │  ├─ Assignments ────────────────────────────┼─────┴─┼───┤  │
│      │       │  ├─ Classrooms ─────────────────────────────┼───────┴───┤  │
│      │       │  ├─ Resources ─────────────────────────────────────────┤  │
│      │       │  ├─ Study Groups ────────────────────────────────────┐ │  │
│      │       │  ├─ Results ─────────────────────────────────────────┤ │  │
│      │       │  ├─ Consultations ───────────────────────────────────┤ │  │
│      │       │  └─ Bus Schedule ───────────────────────────────────┐│ │  │
│      │       │                                                   │││ │  │
│      │       ├──────────────────────────────────────────────────┼┼┘  │  │
│      │       │   EXTERNAL SYSTEMS / INTEGRATIONS              │ │   │  │
│      │       │  ├─ File Storage (uploads/)                    │ │   │  │
│      │───────├─ Email Service (notifications)      ────────────┘ │   │  │
│      │       │  └─ SMS Service (optional)          ──────────────┘   │  │
│      │       │                                                       │  │
│      └───────┴──────────────────────────────────────────────────────┴──┴──┘
│
└────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Use Case Descriptions

#### USE CASE 1: User Registration
| Aspect | Details |
|--------|---------|
| **Actor** | Unauthenticated User |
| **Precondition** | User navigated to /register page |
| **Main Flow** | 1. User fills form (name, email, password, role) |
| | 2. Validates email doesn't exist |
| | 3. Hashes password with bcryptjs |
| | 4. Creates user record in DB |
| | 5. Sends JWT token back |
| **Postcondition** | User token stored, redirected to dashboard |
| **Error Cases** | Email already exists, weak password, invalid input |

#### USE CASE 2: View Free Classrooms
| Aspect | Details |
|--------|---------|
| **Actor** | Student, Teacher, Admin |
| **Precondition** | User logged in |
| **Main Flow** | 1. User selects time & duration |
| | 2. API queries classrooms table |
| | 3. Filters booked slots |
| | 4. Returns available rooms sorted by distance |
| | 5. User selects room |
| | 6. Lock room for duration |
| **Postcondition** | Classroom marked as booked |
| **Algorithm** | See: classroomFinder.js (intelligent routing) |

#### USE CASE 3: Post Announcement
| Aspect | Details |
|--------|---------|
| **Actor** | Teacher, Admin |
| **Precondition** | User logged in with teacher/admin role |
| **Main Flow** | 1. Teacher clicks "New Announcement" |
| | 2. Fills title, content, target audience |
| | 3. Uploads optional attachments |
| | 4. Submits → API creates record |
| | 5. Notification sent to audience |
| **Postcondition** | Announcement visible on student feeds |
| **Error Cases** | Unauthorized role, missing fields, file too large |

#### USE CASE 4: Download Resource & Rate
| Aspect | Details |
|--------|---------|
| **Actor** | Student, Teacher |
| **Precondition** | User viewing resource catalog |
| **Main Flow** | 1. User browses resources (search/filter) |
| | 2. Selects resource to download |
| | 3. Click download → increments counter |
| | 4. File served from storage |
| | 5. User rates resource (1-5 stars) |
| | 6. Rating stored, score recalculated |
| **Postcondition** | Resource score updated, recommendations refresh |
| **Scoring** | RecommendationService recalculates scores |

#### USE CASE 5: Admin Manage Users
| Aspect | Details |
|--------|---------|
| **Actor** | Admin |
| **Precondition** | User logged in as admin |
| **Main Flow** | 1. Admin visits User Management page |
| | 2. Views paginated list of users |
| | 3. Can search, filter by role/department |
| | 4. Click user → view/edit profile |
| | 5. Can activate/deactivate users |
| | 6. Can assign department/batch |
| **Postcondition** | User record updated, changes logged |
| **Permissions** | Only admin can access this |

---

## 9. DATA FLOW

### 9.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

REGISTRATION:
    1. User submits (email, password, name, role, department)
                            ↓
    2. Frontend (AuthContext) → POST /api/auth/register
                            ↓
    3. Backend (authController.register):
         a) Validate input (express-validator)
         b) Check email not in DB
         c) Hash password (bcryptjs, cost=10)
         d) Insert user record
         e) Generate JWT { id: userId, expiresIn: '7d' }
         f) Return token + user object
                            ↓
    4. Frontend:
         a) Store token in localStorage
         b) Store user in AuthContext
         c) Axios interceptor sets Authorization header
         d) Redirect to /dashboard
                            ↓
    AUTHENTICATED STATE

LOGIN:
    1. User submits (email, password)
                            ↓
    2. Frontend → POST /api/auth/login
                            ↓
    3. Backend:
         a) Find user by email
         b) Compare password with hash
         c) Generate JWT
         d) Return token + user
                            ↓
    4. Frontend: Same as registration step 4
                            ↓

JWT USAGE (Every Protected Request):
    1. Axios interceptor attaches:
         Header: Authorization: Bearer <JWT_TOKEN>
                            ↓
    2. Backend middleware (auth.js):
         a) Extract token from Authorization header
         b) jwt.verify(token, JWT_SECRET)
         c) If valid: decode & find user by ID
         d) If expired/invalid: 401 Unauthorized
         e) Attach user object to req.user
                            ↓
    3. Controller:
         a) Access req.user for context
         b) req.user.id, req.user.role for RBAC
         c) Proceed with business logic
                            ↓
    4. Response returned to frontend

TOKEN EXPIRY:
    - JWT expires after 7 days (configurable)
    - Axios interceptor catches 401 error
    - Frontend clears storage & redirects to /login
    - User prompted to log in again
```

### 9.2 API Call Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  TYPICAL API REQUEST FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Example: GET /api/announcements?department=CSE&limit=10

FRONTEND:
    1. User navigates to /announcements
    2. React component (Announcements.js) calls:
         const { data } = await announcementService.getAll({ 
             department: 'CSE', 
             limit: 10 
         })
                            ↓
    3. Axios instance (api.js) intercepts:
         a) Adds Authorization header (JWT from localStorage)
         b) Sets BaseURL = http://localhost:5000/api
         c) Timeout = 30 seconds
                            ↓
NETWORK:
    4. GET request sent to backend server
       Headers: {
           Authorization: "Bearer <JWT_TOKEN>",
           Content-Type: "application/json"
       }
       URL Params: ?department=CSE&limit=10
                            ↓
BACKEND (Express Middleware Stack):
    5. Request enters middleware chain:
         a) express.json() → parse JSON
         b) helmet() → add security headers
         c) cors() → check origin whitelist
         d) rateLimit() → check /api/ rate limits (500/15min)
         e) morgan() → log request
         f) auth() → verify JWT & populate req.user
                            ↓
ROUTING:
    6. Route matched: GET /announcements
       → announcementController.getAll()
                            ↓
CONTROLLER LOGIC:
    7. announcementController.getAll(req, res):
         a) Extract query params: req.query.department, limit
         b) Build SQL query with where conditions
         c) Call announcementRepo.findAll(filters)
                            ↓
REPOSITORY:
    8. announcementRepo.findAll(filters):
         a) Parameterized SQL:
            SELECT * FROM announcements 
            WHERE department = $1 
            LIMIT $2
         b) Pass to db.query(sql, [department, limit])
                            ↓
DATABASE (PostgreSQL):
    9. Query executed:
         a) Parser checks syntax
         b) Planner optimizes query
         c) Executor runs with params ($1=CSE, $2=10)
         d) Returns 10 rows (if exists)
                            ↓
RESPONSE BUILDING:
    10. Backend:
         a) Format response: { success: true, data: [...] }
         b) Set status: 200 OK
         c) Set Content-Type: application/json
                            ↓
NETWORK:
    11. Response sent back to frontend
        JSON payload ~5-20 KB (Gzip compressed)
                            ↓
FRONTEND:
    12. Axios response interceptor:
         a) Check status code (200 = success)
         b) Parse JSON
         c) Return data to component
                            ↓
    13. React state update:
         setAnnouncements(data)
         → component re-renders
         → UI displays announcements
                            ↓
    14. User sees results on screen

TOTAL TIME: ~100-500ms (depending on network & DB)
```

---

## 10. SECURITY IMPLEMENTATION

### 10.1 Authentication & Authorization

```
LAYER 1: Password Protection
├─ Bcryptjs salted hashing (10 rounds)
├─ Never store plaintext passwords
├─ Use bcrypt.compare() for login
└─ Password strength validation (6+ chars)

LAYER 2: JWT Tokens
├─ Issued on registration/login
├─ Signed with JWT_SECRET (env variable)
├─ Expires after 7 days
├─ Token stored in localStorage
└─ Transmitted in Authorization header

LAYER 3: Role-Based Access Control (RBAC)
├─ Users have role: 'student' | 'teacher' | 'admin'
├─ Middleware: requireRole(...roles)
├─ Controllers check req.user.role
└─ Endpoints restricted by role (e.g., admin endpoints)

LAYER 4: Request Validation
├─ express-validator sanitizes input
├─ Parameterized SQL ($1, $2) prevents SQL injection
├─ CORS whitelist origin check
├─ Rate limiter: 500 requests/15 min on /api/
└─ Helmet adds security headers
```

### 10.2 Transport Security

```
TLS/SSL:
├─ HTTPS on production (enforced)
├─ Self-signed cert for development
└─ Supabase/Vercel provide SSL certificates

CORS Policy:
├─ Origin whitelist: [process.env.FRONTEND_URL]
├─ Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
├─ Credentials: true (cookies/auth)
└─ AllowedHeaders: Content-Type, Authorization

Rate Limiting:
├─ Limit: 500 requests per 15 minutes
├─ Per IP address
└─ Error: 429 Too Many Requests
```

### 10.3 Data Protection

```
Database:
├─ PostgreSQL connection pooling (max 10)
├─ SSL support for cloud databases (Supabase)
├─ Connection strings NOT in code (use .env)
├─ Parameterized queries (no SQL injection)
└─ Transactions for atomicity

File Upload:
├─ Multer middleware validates:
│  ├─ File size limit: 10 MB
│  ├─ MIME types: PDF, DOC, JPG, PNG
│  └─ Filename sanitization
├─ Files stored in /uploads/ with UUID names
└─ Access controlled (admin/teacher only)

Sensitive Data:
├─ Never log passwords/tokens
├─ Mask email in logs
├─ Student ID linked to user account
└─ Results only visible to student + admin
```

### 10.4 Error Handling

```
NO Sensitive Info in Errors:
├─ Generic error messages to client
├─ Detailed logs server-side only
├─ Stack traces hidden in production
└─ 404 for non-existent resources (no enumeration)

Common Errors:
├─ 400 Bad Request ← invalid input
├─ 401 Unauthorized ← no/invalid token
├─ 403 Forbidden ← insufficient role
├─ 409 Conflict ← email already exists
└─ 500 Internal Server Error ← server issue
```

---

## 11. DATABASE SCHEMA

### 11.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA (PostgreSQL)                  │
└──────────────────────────────────────────────────────────────────┘

users (Primary Entity)
├─ id (SERIAL PRIMARY KEY)
├─ name (VARCHAR(255))
├─ email (VARCHAR(255) UNIQUE)
├─ password (VARCHAR(255)) ← HASHED
├─ role (ENUM: 'student', 'teacher', 'admin')
├─ department (VARCHAR(100))
├─ avatar_url (TEXT)
├─ is_active (BOOLEAN DEFAULT true)
├─ student_number (VARCHAR(50) UNIQUE)  ← Students only
├─ batch_number (INT)                    ← Students only
├─ batch_section (VARCHAR(10))           ← Students only
├─ created_at (TIMESTAMP DEFAULT NOW())
├─ updated_at (TIMESTAMP)
└─ Indexes: email, role, department

announcements (1:M with users)
├─ id (SERIAL PRIMARY KEY)
├─ posted_by (INT → users.id) ← FK
├─ title (VARCHAR(255))
├─ content (TEXT)
├─ department (VARCHAR(100))  ← Filter audiences
├─ attachment_url (TEXT)
├─ created_at (TIMESTAMP)
├─ updated_at (TIMESTAMP)
└─ Indexes: posted_by, department

assignments (1:M with users)
├─ id (SERIAL PRIMARY KEY)
├─ teacher_id (INT → users.id)
├─ title (VARCHAR(255))
├─ description (TEXT)
├─ due_date (TIMESTAMP)
├─ total_marks (INT)
├─ attachment_url (TEXT)
├─ created_at (TIMESTAMP)
└─ Indexes: teacher_id, due_date

classrooms (Standalone)
├─ id (SERIAL PRIMARY KEY)
├─ name (VARCHAR(100))
├─ building (VARCHAR(50))
├─ floor (INT)
├─ capacity (INT)
├─ amenities (JSONB) ← {"projector": true, "ac": true}
├─ created_at (TIMESTAMP)
└─ Indexes: building, capacity

classroom_bookings (M:M with classrooms & users)
├─ id (SERIAL PRIMARY KEY)
├─ classroom_id (INT → classrooms.id)
├─ booked_by (INT → users.id)
├─ start_time (TIMESTAMP)
├─ end_time (TIMESTAMP)
├─ purpose (VARCHAR(255))
├─ created_at (TIMESTAMP)
└─ Indexes: classroom_id, booked_by, start_time

resources (1:M with users)
├─ id (SERIAL PRIMARY KEY)
├─ uploaded_by (INT → users.id)
├─ filename (VARCHAR(255))
├─ file_path (TEXT)
├─ category (VARCHAR(50)) ← exam_papers, notes, etc.
├─ description (TEXT)
├─ download_count (INT DEFAULT 0)
├─ average_rating (DECIMAL(3,2))
├─ recommendation_score (DECIMAL(4,2))
├─ created_at (TIMESTAMP)
├─ updated_at (TIMESTAMP)
└─ Indexes: uploaded_by, category, recommendation_score

resource_ratings (M:M with users & resources)
├─ id (SERIAL PRIMARY KEY)
├─ resource_id (INT → resources.id)
├─ rated_by (INT → users.id)
├─ rating (INT 1-5)
├─ created_at (TIMESTAMP)
└─ Unique: (resource_id, rated_by)

study_groups (1:M with users)
├─ id (SERIAL PRIMARY KEY)
├─ name (VARCHAR(100))
├─ description (TEXT)
├─ created_by (INT → users.id)
├─ member_count (INT)
├─ created_at (TIMESTAMP)
└─ Indexes: created_by

study_group_members (M:M with users & study_groups)
├─ id (SERIAL PRIMARY KEY)
├─ study_group_id (INT)
├─ member_id (INT → users.id)
├─ joined_at (TIMESTAMP)
└─ Unique: (study_group_id, member_id)

results (1:M with users)
├─ id (SERIAL PRIMARY KEY)
├─ student_id (INT → users.id)
├─ student_number (VARCHAR(50))
├─ subject (VARCHAR(100))
├─ marks_obtained (INT)
├─ total_marks (INT)
├─ grade (VARCHAR(2)) ← A, B, C, etc.
├─ semester (INT)
├─ created_at (TIMESTAMP)
└─ Indexes: student_id, student_number, semester

consultations (M:M with users)
├─ id (SERIAL PRIMARY KEY)
├─ teacher_id (INT → users.id)
├─ student_id (INT → users.id)
├─ scheduled_for (TIMESTAMP)
├─ duration_minutes (INT)
├─ status (ENUM: 'pending', 'confirmed', 'completed')
├─ notes (TEXT)
├─ created_at (TIMESTAMP)
└─ Indexes: teacher_id, student_id, scheduled_for

deadlines (1:M with users)
├─ id (SERIAL PRIMARY KEY)
├─ title (VARCHAR(255))
├─ description (TEXT)
├─ due_date (TIMESTAMP)
├─ type (ENUM: 'assignment', 'exam', 'submission')
├─ related_id (INT) ← assignment_id or custom
├─ created_by (INT → users.id)
├─ created_at (TIMESTAMP)
└─ Indexes: due_date, type

bus_schedule (Standalone)
├─ id (SERIAL PRIMARY KEY)
├─ route_name (VARCHAR(100))
├─ stop_name (VARCHAR(100))
├─ departure_time (TIME)
├─ arrival_time (TIME)
├─ capacity (INT)
├─ driver_name (VARCHAR(100))
├─ created_at (TIMESTAMP)
└─ Indexes: route_name, stop_name

audit_logs (System)
├─ id (SERIAL PRIMARY KEY)
├─ user_id (INT → users.id)
├─ action (VARCHAR(255))
├─ tablename (VARCHAR(50))
├─ record_id (INT)
├─ old_values (JSONB)
├─ new_values (JSONB)
├─ created_at (TIMESTAMP)
└─ Indexes: user_id, created_at
```

### 11.2 Key Design Decisions

**Normalization:** 3NF (Third Normal Form)
- Eliminates redundancy
- Example: department stored once in users, linked via FK

**Soft Deletes:** Not used (hard deletes)
- Reason: Academic data requires clean removal
- Backups handled by PostgreSQL WAL

**JSONB:** Used for
- classroom amenities
- audit logs (storing before/after values)
- Flexible schema for future fields

**Indexes:** On:
- Foreign keys (FK lookups)
- Frequently searched columns (email, role, category)
- Timestamps (sorting/filtering)

---

## 12. API ENDPOINTS

### 12.1 Authentication Endpoints

```
POST /api/auth/register
├─ Body: { name, email, password, role, department, student_number?, batch_number? }
├─ Response: { success, token, user }
├─ Status: 201 Created
└─ Errors: 400 (invalid), 409 (email exists)

POST /api/auth/login
├─ Body: { email, password }
├─ Response: { success, token, user }
├─ Status: 200 OK
└─ Errors: 401 (invalid credentials)

GET /api/auth/me
├─ Headers: Authorization: Bearer <JWT>
├─ Response: { success, user }
├─ Status: 200 OK
└─ Errors: 401 (no token), 403 (invalid user)

PUT /api/auth/profile
├─ Headers: Authorization: Bearer <JWT>
├─ Body: { name, avatar_url, department }
├─ Response: { success, user }
├─ Status: 200 OK
└─ Protected: All authenticated users

PUT /api/auth/change-password
├─ Headers: Authorization: Bearer <JWT>
├─ Body: { oldPassword, newPassword }
├─ Response: { success }
└─ Validation: newPassword !== oldPassword
```

### 12.2 Announcement Endpoints

```
GET /api/announcements?department=CSE&limit=10&page=1
├─ Response: { success, data: [...], total, page }
├─ Pagination: limit, page
├─ Filter: department
└─ Auth: Not required (public)

POST /api/announcements
├─ Headers: Authorization: Bearer <JWT>
├─ Body: { title, content, department, attachment_url }
├─ Response: { success, data: announcementObj }
├─ Role: teacher | admin
└─ Validation: title required, content required

PUT /api/announcements/:id
├─ Headers: Authorization: Bearer <JWT>
├─ Body: { title?, content?, department? }
├─ Response: { success, data: updatedObj }
├─ Owner only or admin
└─ Status: 200 OK

DELETE /api/announcements/:id
├─ Headers: Authorization: Bearer <JWT>
├─ Response: { success }
├─ Owner only or admin
└─ Status: 204 No Content
```

### 12.3 Classroom Endpoints

```
GET /api/classrooms/free?time=14:30&duration=1_hour
├─ Query Params: time (HH:MM), duration (minutes or "1_hour")
├─ Response: { success, data: [...available classrooms] }
├─ Algorithm: Filters booked slots, returns sorted by proximity
└─ Auth: Required

GET /api/classrooms/:id
├─ Response: { success, data: { id, name, building, amenities, ... } }
└─ Auth: Not required

POST /api/classrooms/:id/book
├─ Headers: Authorization: Bearer <JWT>
├─ Body: { start_time, end_time, purpose }
├─ Response: { success, booking: bookingObj }
├─ Creates classroom_booking record
└─ Lock duration: prevents double-booking

GET /api/classrooms/:id/schedule
├─ Query: ?date=2024-01-15
├─ Response: { success, data: [...bookings for date] }
├─ Shows availability timeline
└─ Auth: Not required
```

### 12.4 Resource Endpoints

```
POST /api/resources/upload
├─ Headers: Authorization: Bearer <JWT>, Content-Type: multipart/form-data
├─ Body: FormData { file, category, description }
├─ Response: { success, data: resourceObj }
├─ Multer validates: size < 10MB, type (PDF, DOC, etc.)
└─ Role: teacher | admin

GET /api/resources?category=exam_papers&limit=20
├─ Query: category, limit, page, sort
├─ Response: { success, data: [...], total }
├─ Pagination: default limit=20
└─ Top resources sorted by recommendation_score

GET /api/resources/:id/download
├─ Headers: Authorization: Bearer <JWT>
├─ Response: Binary file download
├─ Side Effect: Increment download_count
└─ Log: audit_logs record created

POST /api/resources/:id/rate
├─ Headers: Authorization: Bearer <JWT>
├─ Body: { rating: 1-5 }
├─ Response: { success, averageRating }
├─ Updates main resource record
└─ RecommendationService recalculates score

GET /api/resources/recommended
├─ Response: { success, data: [top 10 by score] }
├─ Sorting: recommendation_score DESC
└─ No auth required
```

### 12.5 Other Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/assignments` | GET | Yes | List assignments |
| `/api/assignments` | POST | Yes* | Create (teacher only) |
| `/api/assignments/:id/submit` | POST | Yes | Submit solution |
| `/api/assignments/:id/grade` | PUT | Yes* | Grade (teacher only) |
| `/api/results` | GET | Yes | My results (student) \| All (admin) |
| `/api/results/upload` | POST | Yes* | Bulk upload CSV (teacher) |
| `/api/consultations` | GET | Yes | My consultations |
| `/api/consultations` | POST | Yes | Book consultation |
| `/api/study-groups` | GET | No | List groups |
| `/api/study-groups` | POST | Yes | Create group |
| `/api/study-groups/:id/join` | POST | Yes | Join group |
| `/api/deadlines` | GET | Yes | My deadlines |
| `/api/bus-schedule` | GET | No | Bus routes & times |
| `/api/admin/users` | GET | Yes* | Manage users (admin) |
| `/api/admin/users/:id` | PUT | Yes* | Edit user (admin) |
| `/api/admin/users/:id/toggle` | PATCH | Yes* | Activate/deactivate (admin) |

*= specific role required

---

## 13. DESIGN PATTERNS

### 13.1 Architectural Patterns

#### 1. **MVC Pattern** (Model-View-Controller)

```
MODEL (Data Layer)
├─ PostgreSQL database
├─ Repository classes (BaseRepository.js)
└─ Entities: User, Announcement, Assignment, etc.

VIEW (Presentation Layer)
├─ React components (functional)
├─ JSX rendering
└─ Tailwind CSS styling

CONTROLLER (Business Logic)
├─ Express route handlers
├─ Input validation
├─ Service calls
└─ Response formatting
```

**Example:**
```javascript
// Model: BaseRepository.js
async create(data) {
  const sql = `INSERT INTO ${this.table} ... RETURNING *`;
  return db.query(sql, Object.values(data));
}

// Controller: announcementController.js
exports.create = async (req, res) => {
  const data = req.body; // input validation middleware
  const announcement = await announcementRepo.create(data);
  res.json({ success: true, data: announcement });
};

// View: Announcements.js (React)
const [announcements, setAnnouncements] = useState([]);
useEffect(() => {
  announcementService.getAll().then(res => setAnnouncements(res.data));
}, []);
return <div>{announcements.map(a => <AnnouncementCard key={a.id} {...a} />)}</div>;
```

#### 2. **Singleton Pattern** (Database Connection)

```javascript
// config/database.js
class Database {
  constructor() {
    if (Database.instance) return Database.instance;
    this.pool = new Pool(config);
    Database.instance = this;
  }
  
  getPool() { return this.pool; }
}

// Usage: Always same instance
const db = new Database();
```

**Benefits:**
- Single DB connection pool (reused across app)
- No multiple connections per request
- Memory efficient (pooling, max 10 connections)

#### 3. **Repository Pattern** (Data Access)

```javascript
// repositories/BaseRepository.js
class BaseRepository {
  constructor(tableName) {
    this.table = tableName;
  }

  async findAll(filters = {}) {
    let sql = `SELECT * FROM ${this.table}`;
    const values = [];
    
    if (filters.department) {
      sql += ` WHERE department = $${values.length + 1}`;
      values.push(filters.department);
    }
    
    return db.query(sql, values);
  }

  async update(id, data) {
    const set = Object.keys(data).map((k, i) => `${k}=$${i+1}`);
    const sql = `UPDATE ${this.table} SET ${set} WHERE id=$${Object.keys(data).length + 1} RETURNING *`;
    return db.query(sql, [...Object.values(data), id]);
  }
}

// Usage in controllers
const announcement = await announcementRepo.findOne({ id: 123 });
const updated = await announcementRepo.update(123, { title: 'New Title' });
```

**Benefits:**
- Abstraction of database queries
- Query reusability across controllers
- Parameterized SQL prevents injection
- Consistent CRUD interface

#### 4. **Factory Pattern** (User Objects)

```javascript
// services/UserFactory.js
class UserFactory {
  static create(userData) {
    const user = new UserBase(userData);
    
    if (userData.role === 'student') {
      return new StudentUser(user, student_number, batch_number);
    } else if (userData.role === 'teacher') {
      return new TeacherUser(user, department, courses);
    } else if (userData.role === 'admin') {
      return new AdminUser(user, permissions);
    }
    
    return user;
  }
}

// Usage
const userObj = UserFactory.create(dbUser);
return userObj.toJSON(); // role-specific JSON
```

**Benefits:**
- Role-specific user object creation
- Different data for different roles
- Extensible for new roles

#### 5. **Observer Pattern** (Notifications)

```javascript
// services/NotificationService.js
class NotificationService {
  static subscribers = {};

  static subscribe(event, callback) {
    if (!this.subscribers[event]) this.subscribers[event] = [];
    this.subscribers[event].push(callback);
  }

  static notify(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => cb(data));
    }
  }
}

// Usage
NotificationService.subscribe('announcement-posted', (data) => {
  sendEmailToStudents(data.students, data.announcement);
});

// When announcement created
NotificationService.notify('announcement-posted', {
  announcement,
  students: targetStudents
});
```

**Benefits:**
- Loose coupling (announcements don't know about notifications)
- Event-driven architecture
- Easy to add new subscribers

#### 6. **Middleware Chain Pattern**

```javascript
// Express middleware stack (order matters)
app.use(helmet());              // 1. Security headers
app.use(cors(...));             // 2. CORS check
app.use(rateLimit(...));        // 3. Rate limit
app.use(express.json());        // 4. Parse JSON
app.use(auth);                  // 5. Verify JWT
app.use(routes);                // 6. Route handlers
```

Each layer can enhance/transform request before passing to next.

### 13.2 Frontend Patterns

#### 1. **Context API** (Global State)

```javascript
// AuthContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    setUser(res.data.user);
    persistAuth(res.data.token);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in components
function Dashboard() {
  const { user } = useAuth();
  return <h1>Welcome, {user.name}</h1>;
}
```

#### 2. **Custom Hooks**

```javascript
// useAuth() hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};

// Usage: Extracted logic, reusable across components
const { user, logout } = useAuth();
```

#### 3. **Component Composition**

```javascript
// Reusable InputField component
<InputField
  id="email"
  label="Email"
  type="email"
  value={values.email}
  error={errors.email}
  placeholder="you@campus.edu"
/>

// Used in both SignInForm and SignUpForm
// Single source of truth for input styling
```

---

## Interview Preparation Summary

### Key Points to Memorize

1. **Architecture:** 3-tier MVC with React frontend, Express backend, PostgreSQL database
2. **Tech Stack:** React 18, Node.js/Express, PostgreSQL, JWT auth, Tailwind CSS, Framer Motion
3. **Database:** 9+ tables, normalized (3NF), parameterized queries, connection pooling
4. **Security:** bcryptjs hashing, JWT tokens, RBAC middleware, SQL injection prevention, CORS
5. **Patterns:** MVC, Singleton (DB), Repository, Factory, Observer, Context API
6. **API:** 30+ REST endpoints, status codes (200, 201, 400, 401, 403, 404, 409, 500)
7. **Features:** Authentication, Announcements, Smart Classrooms, Resources, Study Groups, Results, Consultations, Bus Schedule
8. **Deployment:** Vercel (backend), Netlify (frontend), Supabase (database)
9. **Team:** 5-6 members, 18-week development, defined sprints, daily standups
10. **Use Cases:** 10+ main features with detailed flows, RBAC for 3 user roles

---

**Document Version:** 1.0  
**Last Updated:** April 13, 2026  
**Author:** Development Team  
**Status:** Complete ✅

