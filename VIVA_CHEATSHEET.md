# 🎓 CampusAssist - Viva Preparation Cheatsheet

**Quick Reference for Interviews & Viva Exams**

---

## ⚡ 60-Second Project Summary

**"CampusAssist is a full-stack **Smart Academic Management Platform** built with **React.js frontend, Node.js/Express backend, and PostgreSQL database**. It's a **Google Classroom-like system** for universities with features like announcements, smart classrooms, resource sharing, study groups, assignments, results management, and consultations. The system supports **3 user roles** (Student, Teacher, Admin) with **role-based access control** using JWT authentication. We used **3-tier MVC architecture**, deployed on **Vercel (backend) and Netlify (frontend)**, and implemented a **smart recommendation engine** along with an intelligent **free classroom detection algorithm**."**

---

## 🎯 Top 30 Expected Interview Questions & Answers

### ARCHITECTURE & DESIGN

**Q1: What is the architecture of CampusAssist?**
A: 3-Tier MVC architecture:
- **Presentation Tier:** React.js (18.2.0) frontend with Tailwind CSS + Material UI
- **Application Tier:** Node.js/Express.js (4.18.2) RESTful API with business logic
- **Data Tier:** PostgreSQL (14+) with connection pooling via pg library

Benefits: Separation of concerns, horizontal scalability, maintainability, security at each layer.

---

**Q2: Explain the database schema design.**
A: 9+ normalized (3NF) tables:
- **users** (id, email, password_hash, role, department, student_number)
- **announcements** (id, posted_by, title, content, department)
- **assignments** (id, teacher_id, title, deadline, total_marks)
- **classrooms** (id, name, building, capacity)
- **classroom_bookings** (id, classroom_id, booked_by, start_time, end_time)
- **resources** (id, uploaded_by, filename, category, download_count, rating)
- **results** (id, student_id, subject, marks_obtained, grade)
- **study_groups**, **consultations**, **deadlines**

Key: Foreign keys, indexes on frequently searched columns, JSONB for flexible fields.

---

**Q3: What design patterns are used?**
A: 
1. **MVC** - Controllers + Services + Views
2. **Singleton** - Database connection pool (single instance)
3. **Repository** - BaseRepository for generic CRUD queries
4. **Factory** - UserFactory for role-specific user objects
5. **Observer** - NotificationService for event broadcasting
6. **Middleware Chain** - Express middleware stack (security → parsing → routing)
7. **Context API** - React global auth state management

---

### AUTHENTICATION & SECURITY

**Q4: How is user authentication implemented?**
A: JWT (JSON Web Token) based:
1. User registers → password hashed with bcryptjs (10 salt rounds)
2. Login → email looked up → bcrypt.compare(pwd, hash)
3. JWT generated: `jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })`
4. Token stored in localStorage (frontend)
5. Every API request includes: `Authorization: Bearer <JWT_TOKEN>`
6. Backend middleware verifies JWT before processing request
7. Token expires after 7 days → user logs in again

---

**Q5: What is RBAC and how is it implemented?**
A: **Role-Based Access Control** with 3 roles:
- **Student:** View announcements, submit assignments, download resources, book consultations
- **Teacher:** Post announcements, create assignments, grade submissions, upload results
- **Admin:** Manage users, view analytics, manage classrooms, system configuration

Implementation:
```javascript
// Middleware
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Usage
router.post('/announcements', requireRole('teacher', 'admin'), controller.create);
```

---

**Q6: How are passwords protected?**
A:
- **bcryptjs** library with 10 salt rounds
- Password never stored plaintext in database
- Each registration: `hash = bcrypt.hashSync(password, 10)`
- Each login: `bcrypt.compare(inputPassword, storedHash)`
- Unique hash every time (same password = different hash)
- Cannot reverse hash → impossible to brute-force
- If DB compromised, passwords still safe

---

**Q7: What security headers are used?**
A: **Helmet.js** middleware adds HTTP headers:
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
- `X-Frame-Options: DENY` — clickjacking protection
- `Content-Security-Policy` — XSS prevention
- `Strict-Transport-Security` — force HTTPS
- `X-XSS-Protection` — legacy XSS protection

---

### CORE FEATURES

**Q8: Explain the free classroom detection algorithm.**
A: **Smart Intelligent Routing:**
```
User Input: time=14:30, duration=60_minutes

Steps:
1. Calculate end_time = 14:30 + 60 = 15:30
2. Query: SELECT * FROM classrooms WHERE NOT id IN (
     SELECT classroom_id FROM classroom_bookings
     WHERE start_time < 15:30 AND end_time > 14:30
   )
3. Filter by: capacity >= required_seats, not under maintenance
4. Score each room:
   score = (capacity_utilization × 0.6) + (distance × 0.4)
5. Sort DESC, return top 5

Result: Available classrooms ranked by best fit
```

**Complexity:** O(n log n) where n = classrooms
**Why Smart:** Optimizes for both size-fit and location proximity

---

**Q9: What is the recommendation score algorithm?**
A: **Weighted Scoring Formula:**
```
Score = (Downloads_Score × 0.5) + (Rating_Score × 0.3) + (Recency_Score × 0.2)

Downloads_Score = (resource.downloads / MAX_downloads) × 5
Rating_Score = average_rating (1-5)
Recency_Score = Time-based decay:
  ≤7 days: 5.0  |  7-14 days: 4.0  |  14-30 days: 3.0  |  ... |  >90 days: 0.5

Example:
  Downloads: 45/100 → 2.25
  Rating: 4.5 → 4.5
  Age: 8 days → 4.0
  Final = 2.25×0.5 + 4.5×0.3 + 4.0×0.2 = 3.275
```

**Purpose:** Surface most useful resources (popular + recent + rated)

---

**Q10: How does the assignment submission system work?**
A: **End-to-End Flow:**
1. Teacher creates assignment → sets deadline, total marks
2. Student views assignment → clicks "Submit"
3. File upload → Multer validates (size < 10MB, type check)
4. File saved to `/uploads/assignments/` with UUID name
5. Submission record created: `(student_id, assignment_id, file_path, submitted_at)`
6. Teacher views submissions → grades each one
7. Grade recorded in assignment_submissions table
8. Student sees grade on dashboard

**Late Submission:** System checks `submitted_at > deadline` → flags as late

---

### FRONTEND & BACKEND

**Q11: What is the React component structure?**
A: Functional components with hooks:
- **Page Components:** Dashboard, Announcements, Assignments, etc.
- **Feature Components:** AnnouncementCard, ResourceCard, AssignmentForm
- **Layout Components:** Header, Sidebar, Footer
- **Context Providers:** AuthContext (global auth state)
- **Custom Hooks:** useAuth() for accessing auth context

**Example:**
```javascript
// AuthContext.js
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const login = async (email, password) => { /* ... */ };
  return <AuthContext.Provider value={{ user, login }}>{children}</AuthContext.Provider>;
};

// Usage
function Dashboard() {
  const { user } = useAuth();
  return <h1>Welcome, {user.name}</h1>;
}
```

---

**Q12: How is API communication handled?**
A: **Axios + Request/Response Interceptors:**
```javascript
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear(); // Clear auth
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Benefits:** Automatic JWT injection, global error handling, centralized API config

---

**Q13: What CSS framework is used and why?**
A: **Tailwind CSS (3.4.19)**
- **Utility-First:** Classes like `px-4 py-2 bg-blue-600 rounded-lg`
- **No CSS Files:** All styling in JSX className
- **Consistency:** Predefined spacing, colors, sizes (design tokens)
- **Performance:** Unused styles purged in production
- **Responsive:** `lg:grid-cols-2 md:block` for responsive design

**Example:**
```jsx
<button className="px-4 py-2 bg-campus-600 text-white rounded-xl hover:bg-campus-700 transition">
  Submit
</button>
```

Instead of separate CSS file → all in component.

---

**Q14: How are animations implemented?**
A: **Framer Motion (12.38.0)**
```javascript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**Use Cases:**
- Page entrance animations (fade-in)
- Hover effects on cards (lift up)
- Scroll-triggered reveals (whileInView)
- Tab indicator smooth transitions (layoutId)

---

### DATABASE & QUERIES

**Q15: How are SQL injection attacks prevented?**
A: **Parameterized Queries**
```javascript
// ❌ UNSAFE
db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);
// Vulnerable: ' OR '1'='1

// ✅ SAFE
db.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
// PostgreSQL automatically escapes $1 parameter
```

**How it works:**
1. Query structure sent to database separately from data
2. Variables ($1, $2, etc.) replaced with escaped values
3. Database parser cannot interpret data as SQL code

---

**Q16: How is data consistency maintained?**
A: **Database Transactions**
```javascript
async transaction(callback) {
  const client = await this.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
```

**ACID Compliance:**
- **Atomicity:** All-or-nothing (no partial updates)
- **Consistency:** Database stays valid state
- **Isolation:** Concurrent transactions don't interfere
- **Durability:** Committed data survives crashes

**Example:** Uploading result CSV → if one student record fails, entire import rolls back.

---

**Q17: How is connection pooling implemented?**
A: **PostgreSQL Connection Pool**
```javascript
const pool = new Pool({
  host: 'localhost',
  database: 'campusassist',
  max: 10,                          // Max concurrent connections
  idleTimeoutMillis: 30000,         // Release after 30s idle
  connectionTimeoutMillis: 5000     // Timeout if no Connection available
});
```

**Benefits:**
- Reuse connections (expensive to create)
- Prevent connection exhaustion
- Automatic cleanup of idle connections
- Max 10 concurrent queries (prevents overload)

---

### API ENDPOINTS

**Q18: What HTTP status codes are used and when?**
A:
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | GET, PUT, PATCH successful |
| 201 | Created | POST successful (resource created) |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Invalid input (missing field, wrong type) |
| 401 | Unauthorized | No/invalid JWT token |
| 403 | Forbidden | Valid token but insufficient role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already exists, duplicate entry |
| 500 | Server Error | Unexpected error (log it!) |

---

**Q19: What are the main API endpoint categories?**
A: 
1. **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
2. **Announcements:** `GET/POST /announcements`, `PUT/DELETE /announcements/:id`
3. **Assignments:** `GET/POST /assignments`, `POST /assignments/:id/submit`
4. **Classrooms:** `GET /classrooms/free`, `POST /classrooms/:id/book`
5. **Resources:** `POST /resources/upload`, `GET /resources`, `GET /resources/:id/download`
6. **Results:** `GET /results`, `POST /results/upload`
7. **Admin:** `GET/PUT /admin/users`, `PATCH /admin/users/:id/toggle`

**Pattern:** RESTful (resource-based URLs, HTTP verbs for operations)

---

### DEPLOYMENT & INFRASTRUCTURE

**Q20: Where is the application deployed?**
A:
- **Frontend:** Netlify
  - Builds React app → optimized bundle
  - Serves on CDN (global distribution)
  - Automatic deploys on Git push
  
- **Backend:** Vercel Serverless
  - Node.js Express runs in serverless functions
  - Auto-scales based on traffic
  - serverless-http adapter wraps Express app
  
- **Database:** Supabase (PostgreSQL)
  - Managed Postgres in cloud
  - Automatic backups & replication
  - SSL support out-of-box
  
- **Domains:** Custom domain with SSL certificate (Let's Encrypt)

---

**Q21: How is the application tested?**
A: **Test Types**
- **Unit Tests:** Individual functions (Jest)
- **Integration Tests:** Multiple components together
- **API Tests:** Postman/Insomnia for endpoint testing
- **E2E Tests:** Full user flows (login → submit → view results)

**Sample Test Cases:**
```javascript
// Unit test example
test('bcrypt hashes password correctly', () => {
  const pwd = 'test123';
  const hash = bcrypt.hashSync(pwd, 10);
  expect(bcrypt.compareSync(pwd, hash)).toBe(true);
});

// API test
test('POST /auth/register should create user', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password, role: 'student' });
  expect(res.status).toBe(201);
  expect(res.body.token).toBeDefined();
});
```

---

### TIME, RESOURCES & TEAM

**Q22: What was the project timeline?**
A: **18 weeks (4.5 months)**
- Sprint 1-2 (3 weeks): Planning & Database Design
- Sprint 3-4 (4 weeks): Backend Architecture & Authentication
- Sprint 5-7 (5 weeks): Frontend Build
- Sprint 8 (3 weeks): Integration & Testing
- Sprint 9 (2 weeks): Optimization & Deployment
- Sprint 10 (1 week): Documentation & Viva Prep

**Deliverables per Sprint:**
- Week 3: Database schema + seed scripts
- Week 7: Authentication + API routes
- Week 12: 15+ React components + UI
- Week 15: Test reports + optimization
- Week 17: Live deployment

---

**Q23: What are the hardware requirements?**
A: **Development:** 
- CPU: Quad-core 2.4 GHz (recommended)
- RAM: 8 GB
- Disk: 2 GB
- OS: Windows 11, macOS 12+, or Linux

**Why:**
- React dev server: ~400 MB RAM
- Express backend: ~300 MB RAM
- PostgreSQL: ~500 MB RAM
- Browser: ~600 MB RAM
- Total: ~2 GB for development

**Production (per server):**
- Backend: 512 MB – 1 GB memory, 1-2 CPU cores
- Database: 1-2 GB memory, 2 CPU cores
- Storage: 2-5 GB for DB, 100 MB for logs

---

**Q24: Who were the team members and roles?**
A: **5-6 Person Team**
1. **Backend Lead (150-200 hrs):** Database design, API architecture, auth
2. **Backend Developer (120-150 hrs):** Features, controllers, testing
3. **Frontend Lead (160-200 hrs):** UI/UX, component architecture, tooling
4. **Frontend Developer (140-180 hrs):** Pages, integration, styling
5. **QA/DevOps (80-120 hrs):** Testing, deployment, monitoring
6. **Documentation (part-time):** API docs, technical specs

**Communication:**
- Daily standup (15 min) → blockers, progress
- Sprint planning (1 hr) → weekly tasks
- Code review (2x/week) → quality
- Demo Friday → showcase features

---

### CHALLENGES & SOLUTIONS

**Q25: What were the main challenges faced?**
A:
1. **Scheduling Conflicts (Classroom Booking)**
   - Challenge: Race condition if 2 users book simultaneously
   - Solution: Database transaction + row-level locking, or pessimistic lock

2. **CSV Upload Delays**
   - Challenge: 1000+ row CSV takes time to parse & insert
   - Solution: Batch insert (100 rows at a time), async processing

3. **Database Performance with Large Dataset**
   - Challenge: 50,000+ students, slow queries
   - Solution: Proper indexes on foreign keys, pagination (limit 20 results)

4. **Responsive UI on Mobile**
   - Challenge: Tailwind grid breaks on small screens
   - Solution: Mobile-first design, `md:` and `lg:` responsive breakpoints

5. **JWT Token Expiry**
   - Challenge: User logged out suddenly after 7 days
   - Solution: Show expiry warning, refresh token option

---

**Q26: How is error handling implemented?**
A: **Global Error Handler**
```javascript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

// Specific error handling
try {
  const user = await userRepo.findByEmail(email);
  if (!user) return res.status(401).json({ success: false });
} catch (err) {
  return res.status(500).json({ success: false });
}
```

**Best Practices:**
- Log errors server-side (never expose stack trace to client)
- Generic messages to user ("Server error, try again")
- Return appropriate HTTP status codes
- Never expose sensitive info (passwords, IDs)

---

### THEORETICAL CONCEPTS

**Q27: What is REST API and why is it used?**
A: **Representational State Transfer**
- **Resource-Based:** URLs represent entities (users, announcements, etc.)
- **HTTP Verbs:** GET (read), POST (create), PUT (update), DELETE (remove)
- **Stateless:** Each request independent, no session stored server-side (JWT handles state)
- **Client-Server:** Clear separation between frontend & backend

**Example:**
```
GET    /api/announcements       → Fetch all announcements
POST   /api/announcements       → Create new announcement
PUT    /api/announcements/:id   → Update specific announcement
DELETE /api/announcements/:id   → Delete announcement
```

**Why Used:** Scalable, cacheable, standard across industry

---

**Q28: Explain the difference between SQL and NoSQL.**
A:
| Aspect | SQL (PostgreSQL) | NoSQL (MongoDB) |
|--------|------------------|-----------------|
| **Structure** | Rigid schema, tables | Flexible, documents |
| **Relationships** | Foreign keys, joins | Nested objects |
| **Consistency** | ACID guaranteed | Eventually consistent |
| **Scalability** | Vertical (bigger server) | Horizontal (more servers) |
| **Query Language** | SQL SELECT/WHERE | JSON queries |
| **Best For** | Structured data, relations | Unstructured, rapid iteration |

**Why CampusAssist uses SQL:**
- Structured academic data (students, courses, grades)
- Heavy relational queries (student → results → grades)
- ACID compliance important (grades must be accurate)
- SQL joins efficient for multi-table queries

---

**Q29: What is a microservice vs monolith architecture?**
A:
- **Monolith (Current CampusAssist):**
  - Single codebase, single database
  - All features in one Express app
  - Easy to develop & deploy (small team)
  - Risk: One failure → whole app down
  
- **Microservices (Future):**
  - Separate services: Auth, Announcements, Resources, etc.
  - Each has own database
  - Independent deployment
  - Complex setup, but scalable for large teams

**For CampusAssist:** Monolith sufficient (clear boundaries, but one app)

---

**Q30: How would you scale CampusAssist to 100,000 users?**
A: **Scaling Strategy**
1. **Database:** Add read replicas, shard by department
2. **Backend:** Load balancer → multiple API servers
3. **Frontend:** CDN caches static assets globally
4. **Caching:** Redis for frequently accessed data (announcements, resources)
5. **Async Tasks:** Queue system (Bull.js) for CSV processing
6. **Monitoring:** DataDog logs, alerts for errors & performance
7. **Microservices:** Split into separate services if bottlenecks appear

---

## 📋 Quick Reference: Key Technologies

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.2.0 | UI framework |
| | Tailwind CSS | 3.4.19 | Styling |
| | Framer Motion | 12.38.0 | Animations |
| | Axios | 1.6.2 | HTTP client |
| **Backend** | Node.js | 18+ | Runtime |
| | Express | 4.18.2 | Web framework |
| | JWT | 9.0.2 | Authentication |
| | bcryptjs | 2.4.3 | Password hashing |
| **Database** | PostgreSQL | 14+ | RDBMS |
| | pg | 8.11.3 | DB client |
| **Deployment** | Netlify | Latest | Frontend hosting |
| | Vercel | Latest | Backend hosting |
| | Supabase | Latest | Database |

---

## 🎤 How to Answer Viva Questions Effectively

**Formula:**
1. **Define** the concept clearly
2. **Example** — provide specific example from CampusAssist
3. **Explain** why it was chosen/how it works
4. **Benefits** — advantages of the approach

**Example Answer:**
```
Q: "Explain JWT authentication"

A: JWT (JSON Web Tokens) is a stateless authentication mechanism.

Define: A token-based system where the server signs a token containing 
user ID, and the client sends this token with every request.

Example: When a student logs in, we generate:
jwt.sign({ id: student_id }, JWT_SECRET, { expiresIn: '7d' })

How it works: Token stored in localStorage → sent in Authorization header → 
backend verifies signature → if valid, user authenticated.

Benefits: 
- Stateless (no session storage needed)
- Scalable (works with load balancers)
- Secure (cannot be forged without secret)
- Mobile-friendly (can work with any client)
```

---

## 📝 Cheatsheet Commands

```bash
# Frontend
npm start                 # Start React dev server
npm run build             # Production build
npm test                  # Run tests

# Backend
npm run dev               # Start with nodemon (auto-reload)
node server.js            # Production start
npm run test              # Run backend tests

# Database
psql -U postgres          # Login to PostgreSQL
psql -d campusassist -f database/schema.sql  # Create schema
npm run seed              # Seed initial data

# Deployment
npm run build             # Build frontend
git push heroku main      # Deploy to Heroku
```

---

## ✅ Pre-Viva Checklist

- [ ] Memorize 60-second summary
- [ ] Practice 5-minute deep dive on architecture
- [ ] Know JWT flow by heart
- [ ] Explain free classroom algorithm on whiteboard
- [ ] Describe recommendation scoring formula
- [ ] List 5 design patterns used
- [ ] Know deployment infrastructure
- [ ] Prepare for "What would you change?" question
- [ ] Know team roles & responsibilities
- [ ] Have diagram of database schema ready

---

**Status:** ✅ Ready for Viva  
**Last Updated:** April 13, 2026  
**Confidence Level:** 🟢 High (with preparation)

