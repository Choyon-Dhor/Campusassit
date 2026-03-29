# 🎓 CampusAssist — Smart Academic Management & Collaboration Platform

Full-stack university platform: **React.js + Node.js + PostgreSQL**
Google Classroom-inspired UI with smart classroom detection, a scoring-based recommendation engine, JWT auth, and full collaboration features.

---

## 🏗️ Architecture

```
3-Tier Architecture
├── Presentation Layer  →  React.js + Material UI + Bootstrap
├── Application Layer   →  Node.js + Express.js  (REST API)
└── Data Layer          →  PostgreSQL  (via node-postgres / pg)
```

## 🎯 Design Patterns

| Pattern    | Where                                               |
|-----------|------------------------------------------------------|
| MVC       | controllers/ + repositories/ + React views           |
| Singleton | `backend/config/database.js`  — single pg Pool       |
| Repository| `backend/repositories/index.js`                      |
| Observer  | `backend/services/NotificationService.js`            |
| Factory   | `backend/services/UserFactory.js`                    |

---

## 📁 Folder Structure

```
campusassist/
├── backend/
│   ├── config/
│   │   └── database.js            # Singleton pg Pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── announcementController.js
│   │   ├── classroomController.js
│   │   └── featureControllers.js  # Resources · StudyGroups · Deadlines · Consultations
│   ├── middleware/
│   │   ├── auth.js                # JWT + RBAC
│   │   └── upload.js              # Multer
│   ├── repositories/
│   │   ├── BaseRepository.js      # Generic CRUD (pg $N params, RETURNING *)
│   │   └── index.js               # All domain repos
│   ├── routes/
│   │   └── index.js
│   ├── services/
│   │   ├── UserFactory.js         # Factory Pattern
│   │   ├── NotificationService.js # Observer Pattern
│   │   └── RecommendationService.js
│   ├── utils/
│   │   ├── classroomFinder.js     # Free-room algorithm
│   │   └── routineParser.js       # CSV parser
│   ├── database/
│   │   ├── schema.sql             # PostgreSQL DDL + triggers
│   │   └── seed.js                # Node.js seeder (bcrypt hashes)
│   ├── uploads/
│   │   ├── resources/
│   │   └── routines/
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── context/AuthContext.js
        ├── services/api.js
        └── components/
            ├── layout/Layout.js
            ├── auth/{Login,Register}.js
            ├── dashboard/Dashboard.js
            ├── announcements/Announcements.js
            ├── classrooms/FreeClassrooms.js
            ├── resources/Resources.js
            ├── studygroups/StudyGroups.js
            ├── deadlines/Deadlines.js
            └── consultations/Consultations.js
```

---

## 🚀 Local Setup

### Prerequisites
| Tool       | Version  |
|-----------|----------|
| Node.js   | v18+     |
| npm       | v9+      |
| PostgreSQL | v14+    |

---

### Step 1 — Create the PostgreSQL database

```bash
# Connect as superuser
psql -U postgres

# Inside psql:
CREATE DATABASE campusassist;
\q
```

---

### Step 2 — Apply the schema

```bash
psql -U postgres -d campusassist -f backend/database/schema.sql
```

Expected output: a series of `CREATE TABLE`, `CREATE INDEX`, `CREATE FUNCTION`, `CREATE TRIGGER` messages with no errors.

---

## 🧑‍🏫 Smart Classroom Feature Endpoints

- `POST /api/classrooms/create`  - create a new classroom (teacher/admin)
- `POST /api/classrooms/upload-students` - attach students by student_number or CSV text (teacher/admin)
- `GET /api/classrooms/list` - get student/teacher classrooms
- `GET /api/classrooms/:id` - classroom details
- `GET /api/classrooms/:id/students` - roster
- `POST /api/classrooms/:id/attendance/mark` - mark attendance (teacher/admin)
- `GET /api/classrooms/:id/attendance` - student attendance + analytics
- `POST /api/classrooms/:id/marks/add` - add class test marks (teacher/admin)
- `GET /api/classrooms/:id/marks` - student marks summary
- `POST /api/attendance/mark` - alias endpoint
- `GET /api/attendance/student` - alias endpoint
- `POST /api/marks/add` - alias endpoint
- `GET /api/marks/student` - alias endpoint

---

### Step 3 — Configure the backend

```bash
cd campusassist/backend
cp .env .env.local     # optional backup
```

Edit **`.env`**:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_NAME=campusassist

# Or use a single connection string (takes priority if set):
# DATABASE_URL=postgresql://postgres:password@localhost:5432/campusassist

JWT_SECRET=change_this_to_something_long_and_random
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

---

### Step 4 — Install dependencies & seed demo data

```bash
# Install
cd backend && npm install

# Seed (creates users, rooms, routine, announcements, etc.)
npm run seed
```

Seed output should end with:
```
✅ Connected to PostgreSQL — database: "campusassist"
✅ Users seeded
✅ Rooms seeded
✅ Routine seeded
✅ Announcements seeded
✅ Deadlines seeded
✅ Consultation hours seeded
✅ Study groups seeded
🎉 Database seeded successfully!
```

---

### Step 5 — Start the backend

```bash
npm run dev        # nodemon (auto-reload)
# OR
npm start          # production
```

Verify: `GET http://localhost:5000/health` → `{ "status": "OK" }`

---

### Step 6 — Start the frontend

```bash
cd ../frontend
npm install
npm start
```

Open **http://localhost:3000**

---

## 🔑 Demo Accounts

All passwords are `password123`

| Role    | Email                  |
|---------|------------------------|
| Admin   | admin@campus.edu       |
| Teacher | sarah@campus.edu       |
| Teacher | rahman@campus.edu      |
| Student | alice@student.edu      |
| Student | bob@student.edu        |
| Student | carol@student.edu      |

The login page has quick-fill buttons for Admin / Teacher / Student.

---

## 🔌 REST API Reference

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me               [JWT]
PUT    /api/auth/profile          [JWT]
PUT    /api/auth/change-password  [JWT]
GET    /api/auth/users            [admin]
```

### Announcements
```
GET    /api/announcements
POST   /api/announcements         [teacher|admin]
PUT    /api/announcements/:id     [author|admin]
DELETE /api/announcements/:id     [author|admin]
```

### Classrooms
```
GET  /api/classrooms/free                  ← live free-room detection
GET  /api/classrooms/rooms
GET  /api/classrooms/routine
GET  /api/classrooms/timeslots
GET  /api/classrooms/room/:name/schedule
POST /api/classrooms/routine/upload        [admin] multipart CSV
GET  /api/classrooms/routine/template      [admin] download CSV template
```

### Resources
```
GET    /api/resources
GET    /api/resources/recommendations
GET    /api/resources/:id
POST   /api/resources               multipart/form-data
GET    /api/resources/:id/download
POST   /api/resources/:id/rate      { "rating": 1-5 }
DELETE /api/resources/:id
```

### Study Groups
```
GET    /api/study-groups
POST   /api/study-groups
POST   /api/study-groups/:id/join
POST   /api/study-groups/:id/leave
GET    /api/study-groups/:id/members
DELETE /api/study-groups/:id
```

### Deadlines
```
GET    /api/deadlines
GET    /api/deadlines/upcoming
POST   /api/deadlines
PUT    /api/deadlines/:id
DELETE /api/deadlines/:id
PATCH  /api/deadlines/:id/toggle
```

### Consultations
```
GET   /api/consultations/hours
POST  /api/consultations/hours                  [teacher|admin]
GET   /api/consultations/appointments
POST  /api/consultations/appointments
PATCH /api/consultations/appointments/:id/status
```

### Notifications
```
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

### Dashboard
```
GET /api/dashboard/stats
```

---

## 🧠 Key Algorithms

### Free Classroom Detection
```sql
-- occupiedRooms
SELECT DISTINCT room_name FROM routine
WHERE day = $1
  AND start_time <= $2::time
  AND end_time   >  $2::time;

-- freeRooms = allRooms − occupiedRooms  (computed in JS)
```

### Recommendation Score
```
score = (normalised_downloads × 0.5)
      + (avg_rating            × 0.3)
      + (recency_score         × 0.2)

Recency (0–5):  ≤7d→5  ≤14d→4  ≤30d→3  ≤60d→2  ≤90d→1  else→0.5
Downloads normalised to 0–5 relative to the current maximum.
Score is recalculated after every download or rating event.
```

---

## 🐘 PostgreSQL-Specific Features Used

| Feature                         | Where                              |
|--------------------------------|------------------------------------|
| `SERIAL` / `GENERATED`          | All primary keys                   |
| `TIMESTAMPTZ`                   | All timestamp columns              |
| `RETURNING *`                   | All INSERT/UPDATE in repositories  |
| `ON CONFLICT … DO NOTHING/UPDATE`| Upsert in ratings & group members |
| `CHECK` constraints             | ENUMs replaced by CHECK            |
| `$1, $2, …` positional params   | Every parameterised query          |
| `::int`, `::time`, `::numeric`  | Explicit casts where needed        |
| `INTERVAL '3 days'`             | Deadline upcoming window           |
| `set_updated_at()` trigger      | Auto-updates `updated_at` columns  |
| `ILIKE`                         | Case-insensitive search            |
| `COALESCE`                      | Null-safe aggregates               |
| Connection pool via `pg.Pool`   | Singleton in `config/database.js`  |

---

## 🛡️ Security
- JWT Bearer tokens, 7-day expiry
- bcrypt password hashing (10 rounds)
- Role-Based Access Control (student / teacher / admin)
- Helmet.js security headers
- CORS whitelist
- Express rate-limiting (500 req / 15 min)
- Multer file-type + size validation
