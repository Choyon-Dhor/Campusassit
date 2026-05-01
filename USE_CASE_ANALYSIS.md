# 📊 CampusAssist - Detailed Use Case Diagram & Analysis

## Use Case Diagram (Detailed Version)

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                           CAMPUSASSIST SYSTEM                                  ║
║                                                                                ║
║   ┌─── ACTORS ───────────────────────────────────────────────────────────┐   ║
║   │                                                                       │   ║
║   │  👤 Student      👥 Teacher       🛡️  Admin        🚫 Guest User     │   ║
║   │   (Primary)      (Primary)       (Primary)       (External)          │   ║
║   │                                                                       │   ║
║   └───────────────────────────────────────────────────────────────────────┘   ║
║                               ↓ ↓ ↓ ↓                                         ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                  SYSTEM BOUNDARY (CampusAssist)                     │    ║
║   │                                                                     │    ║
║   │  ╔══════════════════════════════════════════════════════════════╗ │    ║
║   │  ║           AUTHENTICATION & AUTHORIZATION LAYER              ║ │    ║
║   │  ╠══════════════════════════════════════════════════════════════╣ │    ║
║   │  ║                                                              ║ │    ║
║   │  ║  ┌─────────────────┐         ┌─────────────────┐           ║ │    ║
║   │  ║  │  ╔───────────╗  │         │  ╔───────────╗  │           ║ │    ║
║   │  ║  │  ║ Register  ║  │◄────────┤──║  Register ║  │           ║ │    ║
║   │  ║  │  ║ (Sign Up) ║  │         │  ║ Validates  ║  │           ║ │    ║
║   │  ║  │  ╚───────────╝  │         │  ╚───────────╝  │           ║ │    ║
║   │  ║  │        │         │         │                │           ║ │    ║
║   │  ║  │        │ (name,  │         │ (hash pwd,     │           ║ │    ║
║   │  ║  │        │ email,  │         │  check email   │           ║ │    ║
║   │  ║  │        │ pwd)    │         │  duplicate)    │           ║ │    ║
║   │  ║  │        ↓         │         │                │           ║ │    ║
║   │  ║  │  ┌─────────────┐ │         │ ┌────────────┐ │           ║ │    ║
║   │  ║  │  │ Store Token │ │         │ │Store User  │ │           ║ │    ║
║   │  ║  │  │ (JWT, 7 days)│ │         │ │Create JWT  │ │           ║ │    ║
║   │  ║  │  └─────────────┘ │         │ └────────────┘ │           ║ │    ║
║   │  ║  │        │          │         │        │       │           ║ │    ║
║   │  ║  │        └──────┬───┘         └────┬───┘       │           ║ │    ║
║   │  ║  │                │                 │           │           ║ │    ║
║   │  ║  │                ↓                 ↓           │           ║ │    ║
║   │  ║  │         ┌─────────────────────────────┐      │           ║ │    ║
║   │  ║  │         │ ╔────────────────────────╗ │      │           ║ │    ║
║   │  ║  │         │ ║ AUTHENTICATED STATE ║ │      │           ║ │    ║
║   │  ║  │         │ ║ (Access Dashboard)  ║ │      │           ║ │    ║
║   │  ║  │         │ ╚────────────────────╝ │      │           ║ │    ║
║   │  ║  │         └──────────┬──────────────┘      │           ║ │    ║
║   │  ║  │                    │                     │           ║ │    ║
║   │  ║  │    ┌───────────────┼───────────────┐    │           ║ │    ║
║   │  ║  │    │ Logout        │ View/Update   │    │           ║ │    ║
║   │  ║  │    │ Profile       │ Password       │    │           ║ │    ║
║   │  ║  │    └───────────────┴───────────────┘    │           ║ │    ║
║   │  ║  │                                         │           ║ │    ║
║   │  ║  └─────────────────────────────────────────┘           ║ │    ║
║   │  ║                                                         ║ │    ║
║   │  ╚═════════════════════════════════════════════════════════╝ │    ║
║   │                                                             │    ║
║   │  ╔══════════════════════════════════════════════════════════╗ │    ║
║   │  ║          CORE FEATURE USE CASES (Role-Based)            ║ │    ║
║   │  ╠══════════════════════════════════════════════════════════╣ │    ║
║   │  ║                                                          ║ │    ║
║   │  ║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║ │    ║
║   │  ║  ┃ STUDENT-SPECIFIC USE CASES                    ┃  ║ │    ║
║   │  ║  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S1: View Announcements                    ┃  ║ │    ║
║   │  ║  ┃  ├─ Precondition: User authenticated          ┃  ║ │    ║
║   │  ║  ┃  ├─ Main Flow:                                ┃  ║ │    ║
║   │  ║  ┃  │  1. Navigate to /announcements             ┃  ║ │    ║
║   │  ║  ┃  │  2. API GET /announcements?department=CSE  ┃  ║ │    ║
║   │  ║  ┃  │  3. Database returns 10 announcements      ┃  ║ │    ║
║   │  ║  ┃  │  4. Display with date sorting              ┃  ║ │    ║
║   │  ║  ┃  ├─ Alternate Flows: Search by keyword        ┃  ║ │    ║
║   │  ║  ┃  └─ Postcondition: Announcements rendered     ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S2: Submit Assignment                     ┃  ║ │    ║
║   │  ║  ┃  ├─ Precondition: Assignment available        ┃  ║ │    ║
║   │  ║  ┃  ├─ Main Flow:                                ┃  ║ │    ║
║   │  ║  ┃  │  1. Click assignment → view details        ┃  ║ │    ║
║   │  ║  ┃  │  2. Click "Submit" → upload file           ┃  ║ │    ║
║   │  ║  ┃  │  3. Multer validates: size, MIME type      ┃  ║ │    ║
║   │  ║  ┃  │  4. API POST /assignments/:id/submit       ┃  ║ │    ║
║   │  ║  ┃  │  5. Save file, record submission time      ┃  ║ │    ║
║   │  ║  ┃  ├─ Error Flows: File too large, late submit  ┃  ║ │    ║
║   │  ║  ┃  └─ Postcondition: Submission stored          ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S3: Download & Rate Resources             ┃  ║ │    ║
║   │  ║  ┃  ├─ Precondition: Resource exists             ┃  ║ │    ║
║   │  ║  ┃  ├─ Main Flow:                                ┃  ║ │    ║
║   │  ║  ┃  │  1. Browse resources by category           ┃  ║ │    ║
║   │  ║  ┃  │  2. View recommendation score              ┃  ║ │    ║
║   │  ║  ┃  │  3. Click download → file served           ┃  ║ │    ║
║   │  ║  ┃  │  4. Rate on 1-5 scale → update score       ┃  ║ │    ║
║   │  ║  ┃  ├─ Algorithm: Score = (DL×0.5) + (Rating×0.3) + (Recency×0.2) │    ║
║   │  ║  ┃  └─ Postcondition: Download count++, score updated        ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S4: Check Free Classrooms                 ┃  ║ │    ║
║   │  ║  ┃  ├─ Precondition: Need classroom space        ┃  ║ │    ║
║   │  ║  ┃  ├─ Main Flow:                                ┃  ║ │    ║
║   │  ║  ┃  │  1. Input: time (14:30) + duration (1 hr)  ┃  ║ │    ║
║   │  ║  ┃  │  2. API GET /classrooms/free?time=...      ┃  ║ │    ║
║   │  ║  ┃  │  3. Query DB: SELECT * WHERE NOT IN booked │  ║ │    ║
║   │  ║  ┃  │  4. Filter by capacity                     ┃  ║ │    ║
║   │  ║  ┃  │  5. Sort by proximity & return top 5       ┃  ║ │    ║
║   │  ║  ┃  │  6. Click room → book it (lock time slot)  ┃  ║ │    ║
║   │  ║  ┃  ├─ Constraints: No overlapping bookings      ┃  ║ │    ║
║   │  ║  ┃  └─ Postcondition: Classroom_booking created  ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S5: View Results & GPA                    ┃  ║ │    ║
║   │  ║  ┃  ├─ Precondition: Results published by admin   ┃  ║ │    ║
║   │  ║  ┃  ├─ Main Flow:                                ┃  ║ │    ║
║   │  ║  ┃  │  1. GET /results (uses student_id from JWT)               ┃  ║ │    ║
║   │  ║  ┃  │  2. Show marks by subject/semester         ┃  ║ │    ║
║   │  ║  ┃  │  3. Calculate GPA on frontend              ┃  ║ │    ║
║   │  ║  ┃  │  4. Display chart visualization            ┃  ║ │    ║
║   │  ║  ┃  └─ Postcondition: Results visible only to student         ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S6: Join Study Groups & Collaborate       ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Study group exists                   ┃  ║ │    ║
║   │  ║  ┃  ├─ Flow: Browse → Find → Click Join → Update │  ║ │    ║
║   │  ║  ┃  └─ Post: Member added to study_group_members │  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S7: Book Teacher Consultations            ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Teacher has available time slots     ┃  ║ │    ║
║   │  ║  ┃  ├─ Flow: Select teacher → Pick time → Confirm              ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Consultation record created (pending)            ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-S8: View Routine & Bus Schedule           ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Data seeded in database              ┃  ║ │    ║
║   │  ║  ├─ Flow: GET /routine, GET /bus-schedule        ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Calendar/schedule displayed         ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  └────────────────────────────────────────────────┘  ║ │    ║
║   │  ║                                                          ║ │    ║
║   │  ║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║ │    ║
║   │  ║  ┃ TEACHER-SPECIFIC USE CASES                     ┃  ║ │    ║
║   │  ║  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-T1: Post Announcements to Classes          ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Teacher authenticated                 ┃  ║ │    ║
║   │  ║  ┃  ├─ Flow:                                      ┃  ║ │    ║
║   │  ║  ┃  │  1. Click "New Announcement"                ┃  ║ │    ║
║   │  ║  ┃  │  2. Fill: title, content, target dept       ┃  ║ │    ║
║   │  ║  ┃  │  3. Optional: attach file (PDF, DOC)        ┃  ║ │    ║
║   │  ║  ┃  │  4. POST /announcements                     ┃  ║ │    ║
║   │  ║  ┃  │  5. Insert record, trigger notification     ┃  ║ │    ║
║   │  ║  ┃  ├─ Validation: title & content required       ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Students see announcement on feed    ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-T2: Create Assignments                     ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Class exists                          ┃  ║ │    ║
║   │  ║  ┃  ├─ Flow: Create → Set deadline → Post         ┃  ║ │    ║
║   │  ║  ┃  ├─ Data: title, description, due_date, marks  ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Assignment visible to students      ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-T3: Grade Submissions                      ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Student submitted assignment          ┃  ║ │    ║
║   │  ║  ┃  ├─ Flow: View submission → Enter marks → Save║  ║ │    ║
║   │  ║  ┃  ├─ Validation: marks ≤ total_marks            ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Grade visible on student dashboard   ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-T4: Upload Results (Bulk CSV)              ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Results CSV prepared                  ┃  ║ │    ║
║   │  ║  ┃  ├─ Flow:                                      ┃  ║ │    ║
║   │  ║  ┃  │  1. POST /results/upload (multipart)        ┃  ║ │    ║
║   │  ║  ┃  │  2. Multer validates file                   ┃  ║ │    ║
║   │  ║  ┃  │  3. csv-parser reads rows                   ┃  ║ │    ║
║   │  ║  ┃  │  4. For each row: validate & insert         ┃  ║ │    ║
║   │  ║  ┃  │  5. Return summary (inserted, errors)       ┃  ║ │    ║
║   │  ║  ┃  ├─ CSV Format: student_number, subject, marks │  ║ │    ║
║   │  ║  ┃  └─ Post: Results linked to student accounts   ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-T5: Manage Consultations                   ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Consultation requests received        ┃  ║ │    ║
║   │  ║  ├─ Flow: View requests → Confirm/Reject → Calendar              ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Status updated (pending→confirmed)   ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-T6: Upload Teaching Resources              ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: File prepared (PDF, DOC)              ┃  ║ │    ║
║   │  ║  ├─ Flow: Click Upload → Select category → Confirm              ┃  ║ │    ║
║   │  ║  ┃  ├─ Multer: max 10MB, allowed MIME types        ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Resource visible in catalog          ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  └────────────────────────────────────────────────┘  ║ │    ║
║   │  ║                                                          ║ │    ║
║   │  ║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║ │    ║
║   │  ║  ┃ ADMIN-SPECIFIC USE CASES                       ┃  ║ │    ║
║   │  ║  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-A1: User Management Dashboard              ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: Admin authenticated                   ┃  ║ │    ║
║   │  ║  ├─ Flow: Paginated user list → Search/Filter → View details     ┃  ║ │    ║
║   │  ║  ┃  ├─ Filters: role (student/teacher), department              ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Can activate/suspend user accounts   ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-A2: Activate/Deactivate User               ┃  ║ │    ║
║   │  ║  ├─ Pre: User exist, admin has permission         ┃  ║ │    ║
║   │  ║  ├─ Flow: Find user → PATCH /users/:id/toggle     ┃  ║ │    ║
║   │  ║  ┃  ├─ Effect: is_active = NOT is_active          ┃  ║ │    ║
║   │  ║  ┃  └─ Post: User can't login if deactivated      ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-A3: Manage Classrooms                      ┃  ║ │    ║
║   │  ║  ├─ Pre: Admin authenticated                      ┃  ║ │    ║
║   │  ║  ├─ Flow: Create/Edit/Delete classroom records    ┃  ║ │    ║
║   │  ║  ┃  ├─ Data: name, building, floor, capacity      ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Updated in DB, reflected in finder   ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-A4: View System Analytics & Reports        ┃  ║ │    ║
║   │  ║  ├─ Pre: Admin dashboard accessed                 ┃  ║ │    ║
║   │  ║  ├─ Metrics: Total users, announcements, resources              ┃  ║ │    ║
║   │  ║  ├─ Graphs: User growth, download trends, usage pie              ┃  ║ │    ║
║   │  ║  └─ Post: Dashboards render with live data        ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-A5: Manage Departments                     ┃  ║ │    ║
║   │  ║  ├─ Pre: Departments exist in system              ┃  ║ │    ║
║   │  ║  ├─ Flow: CRUD departments ← assigned to users    ┃  ║ │    ║
║   │  ║  └─ Post: Users can be filtered/grouped by dept   ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  └────────────────────────────────────────────────┘  ║ │    ║
║   │  ║                                                          ║ │    ║
║   │  ║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║ │    ║
║   │  ║  ┃ SHARED USE CASES (All Authenticated Users)      ┃  ║ │    ║
║   │  ║  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH1: View Personal Profile                 ┃  ║ │    ║
║   │  ║  ┃  ├─ Flow: GET /auth/me (from JWT)              ┃  ║ │    ║
║   │  ║  ┃  └─ Display: name, email, role, department, avatar           ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH2: Update Profile Info                   ┃  ║ │    ║
║   │  ║  ┃  ├─ Pre: User authenticated                    ┃  ║ │    ║
║   │  ║  ├─ Flow: Edit form → PUT /auth/profile → Update DB             ┃  ║ │    ║
║   │  ║  ┃  ├─ Editable: name, avatar_url, phone          ┃  ║ │    ║
║   │  ║  ┃  └─ Post: Profile updated, UI refreshes        ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH3: Change Password                       ┃  ║ │    ║
║   │  ║  ├─ Pre: User knows current password              ┃  ║ │    ║
║   │  ║  ├─ Flow: Input old + new password → Validate     ┃  ║ │    ║
║   │  ║  ┃  ├─ Verification: bcrypt.compare(old, hashed)  ┃  ║ │    ║
║   │  ║  ┃  ├─ Hash new password, update DB               ┃  ║ │    ║
║   │  ║  ┃  └─ Post: User logs in with new password       ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH4: View Announcements (Feed)             ┃  ║ │    ║
║   │  ║  ├─ Pre: User authenticated                       ┃  ║ │    ║
║   │  ║  ├─ Flow: Filter by department → Display timeline ┃  ║ │    ║
║   │  ║  ├─ UI: Most recent first, expandable details     ┃  ║ │    ║
║   │  ║  └─ Post: User sees relevant updates              ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH5: Search Resources                      ┃  ║ │    ║
║   │  ║  ├─ Pre: Resources exist in catalog               ┃  ║ │    ║
║   │  ║  ├─ Flow: Filter: category, recency, top-rated    ┃  ║ │    ║
║   │  ║  ├─ Sorting: By recommendation score (default)    ┃  ║ │    ║
║   │  ║  └─ Post: Relevant resources displayed            ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH6: View Calendar / Deadlines             ┃  ║ │    ║
║   │  ║  ├─ Pre: Deadlines exist in DB                    ┃  ║ │    ║
║   │  ║  ├─ Flow: GET /deadlines → render calendar        ┃  ║ │    ║
║   │  ║  ├─ Color-coded: assignments (blue), exams (red)  ┃  ║ │    ║
║   │  ║  └─ Post: User sees upcoming deadlines            ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH7: View Notifications                    ┃  ║ │    ║
║   │  ║  ├─ Pre: Events triggered (announcement, grade)   ┃  ║ │    ║
║   │  ║  ├─ Flow: NotificationService broadcasts event    ┃  ║ │    ║
║   │  ║  ├─ Delivery: Toast messages + notification bell  ┃  ║ │    ║
║   │  ║  └─ Post: User notified in real-time              ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  ┃  UC-SH8: Logout                                ┃  ║ │    ║
║   │  ║  ├─ Pre: User logged in                           ┃  ║ │    ║
║   │  ║  ├─ Flow: Click logout → Clear JWT → Redirect     ┃  ║ │    ║
║   │  ║  ├─ Backend: Token invalidated (optional)         ┃  ║ │    ║
║   │  ║  └─ Post: Returned to login page                  ┃  ║ │    ║
║   │  ║  ┃                                                ┃  ║ │    ║
║   │  ║  └────────────────────────────────────────────────┘  ║ │    ║
║   │  ║                                                          ║ │    ║
║   │  ╚══════════════════════════════════════════════════════════╝ │    ║
║   │                                                             │    ║
║   ├───────────────────────────────────────────────────────────────┤    ║
║   │                 DATABASE & BACKEND                           │    ║
║   │  ┌─────────────────────────────────────────────────────────┐ │    ║
║   │  │  PostgreSQL Tables:                                     │ │    ║
║   │  │  ├─ users (id, email, password_hash, role, dept)       │ │    ║
║   │  │  ├─ announcements (id, posted_by_id, title, content)  │ │    ║
║   │  │  ├─ assignments (id, teacher_id, title, deadline)     │ │    ║
║   │  │  ├─ classrooms (id, name, building, capacity)         │ │    ║
║   │  │  ├─ resources (id, uploaded_by_id, filename, rating)  │ │    ║
║   │  │  ├─ consultations (id, teacher_id, student_id, time)  │ │    ║
║   │  │  ├─ results (id, student_id, subject, marks)          │ │    ║
║   │  │  └─ [More tables: study_groups, deadlines, bus_...]   │ │    ║
║   │  │                                                        │ │    ║
║   │  │  Relationships:                                        │ │    ║
║   │  │  ├─ users 1 ──→ M announcements                        │ │    ║
║   │  │  ├─ users 1 ──→ M assignments                          │ │    ║
║   │  │  ├─ users 1 ──→ M resources (uploaded_by)             │ │    ║
║   │  │  ├─ assignments M ──→ M users (submissions)            │ │    ║
║   │  │  └─ consultations M ──→ M users (teacher + student)   │ │    ║
║   │  └─────────────────────────────────────────────────────────┘ │    ║
║   │                                                             │    ║
║   └─────────────────────────────────────────────────────────────┘    ║
│                                                                      │    ║
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8 Main Use Cases Summary Table

| UC ID | Name | Actor | Triggers | Primary Flow | Key Data | Status |
|-------|------|-------|----------|-------------|----------|--------|
| UC-S1 | View Announcements | Student | Click Announcements | Fetch feed → Display | Title, Content, Date | ✅ Complete |
| UC-S3 | Download & Rate Resources | Student | Browse catalog | Download → Increment counter → Rate | File, Rating, Score | ✅ Complete |
| UC-S4 | Check Free Classrooms | Student | Need room | Input time → Query DB → Book | Classroom, Time Slot | ✅ Complete |
| UC-T2 | Create Assignment | Teacher | New assessment | Fill form → Validate → Create → Notify students | Title, Deadline, Marks | ✅ Complete |
| UC-T4 | Upload Results (CSV) | Teacher | Marking done | Upload file → Parse CSV → Batch insert → Link to students | CSV rows, student_number | ✅ Complete |
| UC-A1 | User Management | Admin | Need oversight | View list → Search/Filter → Edit user → Activate/Suspend | User records, Status | ✅ Complete |
| UC-SH3 | Change Password | All Roles | Security | Input old+new → Validate → Hash → Update DB | Hashed password | ✅ Complete |
| UC-SH6 | View Deadlines | All Roles | Planning | GET /deadlines → Render calendar → Color code by type | Deadline list, Type | ✅ Complete |

---

## Key Algorithms & Formulas

### Use Case: UC-S4 - Free Classroom Detection

```javascript
ALGORITHM: FindFreeClassrooms(requestedTime, Duration)

INPUT:
  - requestedTime: string "HH:MM" (e.g., "14:30")
  - duration: integer (minutes, e.g., 60)
  
PROCESSING:
  1. Calculate endTime = requestedTime + duration
  2. Query classroom_bookings:
     SELECT * FROM classroom_bookings
     WHERE (start_time, end_time) OVERLAP (requestedTime, endTime)
  
  3. Get all classrooms NOT in result above:
     SELECT * FROM classrooms
     WHERE id NOT IN (booked_ids_above)
  
  4. Filter by business rules:
     - Remove classrooms with capacity < required
     - Remove if under maintenance
  
  5. Score remaining classrooms:
     score = (capacity_utilization * 0.6) + (distance_to_location * 0.4)
     - Prefer rooms best-fit for headcount
     - Prefer nearby locations
  
  6. Sort by score DESC, return top 5

OUTPUT:
  [{
    id: 1,
    name: "CS Lab 1",
    building: "Block A",
    capacity: 40,
    availableFrom: "14:30",
    availableUntil: "15:30",
    amenities: { projector: true, ac: true }
  }, ...]

COMPLEXITY: O(n log n) where n = number of classrooms
```

### UC-S3 - Recommendation Score Formula

```
Recommendation Score = (Downloads_Score × 0.5) + (Rating_Score × 0.3) + (Recency_Score × 0.2)

Where:

Downloads_Score = Normalized(resource.download_count)
                = (resource.download_count / MAX(download_count)) × 5
                
Rating_Score    = resource.average_rating (1-5 scale)

Recency_Score   = Time-based decay:
                  if (days_since_upload ≤ 7)    → 5.0
                  if (days_since_upload ≤ 14)   → 4.0
                  if (days_since_upload ≤ 30)   → 3.0
                  if (days_since_upload ≤ 60)   → 2.0
                  if (days_since_upload ≤ 90)   → 1.0
                  else                          → 0.5

Example:
  Resource: lecture_notes.pdf
  ├─ Downloads: 45 (max across all: 100)
    └─ Downloads_Score = (45/100) × 5 = 2.25
  ├─ Rating: 4.5 (out of 5)
    └─ Rating_Score = 4.5
  ├─ Uploaded: 8 days ago
    └─ Recency_Score = 4.0
  
  Final Score = (2.25 × 0.5) + (4.5 × 0.3) + (4.0 × 0.2)
              = 1.125 + 1.35 + 0.8
              = 3.275
              
Top Resources are those with the highest Final Score.
```

---

## Use Case Include/Extend Relationships

```
UC-S1: View Announcements
├─ <<include>> Search Announcements
├─ <<include>> Filter By Department
└─ <<extend>> View Announcement Details (optional)

UC-S4: Check Free Classrooms
├─ <<include>> Query Available Rooms
├─ <<include>> validate Time Slot
└─ <<extend>> Book Classroom (if user confirms)

UC-T4: Upload Results (CSV)
├─ <<include>> Parse CSV File
├─ <<include>> Validate Entries
├─ <<include>> Link to Students
└─ <<extend>> Generate Summary Report (optional)

UC-A1: User Management
└─ <<include>> UC-A2: Activate/Deactivate User
```

---

## Exceptional Flows

### UC-S4 Exception: Classroom Booking Conflict

```
Main Flow: Student books classroom for 14:30-15:30
         
Exception Path:
  1. API concurrent request: Teacher also books SAME room same time
  2. First request wins → Records booking
  3. Second request → 409 Conflict returned
  4. UI shows: "This room was just booked. Checking other options..."
  5. Auto-refresh classroom list with new availability
  6. User can rebook different room or retry

Root Cause: Race condition (pessimistic locking can mitigate)
Solution: Use database transactions + row-level locking
```

### UC-T4 Exception: CSV Format Error

```
Main Flow: Teacher uploads results.csv
         
Exception: Malformed CSV (missing columns or wrong data types)
  1. Parser detects issue on line 15
  2. Return 400 Bad Request with detailed error:
     {
       "success": false,
       "message": "CSV parse error on line 15",
       "error": "Column 'marks_obtained' contains non-integer value: 'NA'",
       "suggestedFix": "Replace 'NA' with numeric value or leave blank"
     }
  3. User downloads error report
  4. Corrects CSV locally
  5. Retries upload

Root Cause: Data validation before insertion
Solution: Validate schema first, report errors upfront
```

---

**Document Version:** 1.0  
**Use Case Complexity:** Intermediate  
**Recommended Study Time:** 2-3 hours  

