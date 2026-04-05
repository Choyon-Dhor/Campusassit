-- ============================================================
-- CampusAssist — Schema Additions (MU Features)
-- Run: psql -U postgres -d campusassist -f database/schema_additions.sql
-- ============================================================

-- ── Batches ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  id             SERIAL PRIMARY KEY,
  batch_number   INTEGER      NOT NULL,           -- e.g. 58
  section        VARCHAR(5)   NOT NULL,           -- e.g. 'C'
  department     VARCHAR(100) DEFAULT 'CSE',
  current_semester VARCHAR(15),                  -- e.g. '4:1'
  total_students INTEGER DEFAULT 50,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_batch_section UNIQUE (batch_number, section)
);

-- ── Results ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
  id              SERIAL PRIMARY KEY,
  student_id      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  student_number  VARCHAR(30)  NOT NULL,          -- e.g. '231-115-094'
  semester_code   VARCHAR(10)  NOT NULL,          -- e.g. '3:3'
  semester_name   VARCHAR(50)  NOT NULL,          -- e.g. 'Autumn 2025'
  course_code     VARCHAR(20)  NOT NULL,          -- e.g. 'CSE-421'
  course_title    VARCHAR(255) NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'Regular',
  credit_hours    NUMERIC(3,1) NOT NULL,          -- e.g. 3.0, 1.5
  batch_section   VARCHAR(20),                   -- e.g. '58th[C]'
  letter_grade    VARCHAR(5),                    -- e.g. 'A+', 'A', 'B+'
  grade_point     NUMERIC(3,2),                  -- e.g. 4.00, 3.75
  is_published    BOOLEAN      NOT NULL DEFAULT FALSE,
  publish_date    DATE,
  uploaded_by     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_student  ON results(student_number);
CREATE INDEX IF NOT EXISTS idx_results_semester ON results(semester_code);
CREATE INDEX IF NOT EXISTS idx_results_published ON results(is_published, publish_date);

-- ── Bus Routes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bus_routes (
  id               SERIAL PRIMARY KEY,
  route_name       TEXT         NOT NULL,
  short_name       VARCHAR(100),
  direction        VARCHAR(20)  NOT NULL DEFAULT 'to_campus'
                     CHECK (direction IN ('to_campus','from_campus','shuttle')),
  departure_time   TIME,
  arrival_time     TIME,
  bus_number       VARCHAR(20),
  driver_name      VARCHAR(100),
  passenger_type   VARCHAR(20)  NOT NULL DEFAULT 'student'
                     CHECK (passenger_type IN ('student','teacher','both')),
  route_type       VARCHAR(30)  DEFAULT 'regular',
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  schedule_note    TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Bus Stops (ordered pickup points per route) ────────────────
CREATE TABLE IF NOT EXISTS bus_stops (
  id          SERIAL PRIMARY KEY,
  route_id    INTEGER      NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  stop_name   VARCHAR(255) NOT NULL,
  stop_order  INTEGER      NOT NULL,
  pickup_time TIME
);

CREATE INDEX IF NOT EXISTS idx_bus_stops_route ON bus_stops(route_id, stop_order);

-- ── Extend routine table with batch-specific columns ──────────
ALTER TABLE routine ADD COLUMN IF NOT EXISTS batch_number  INTEGER;
ALTER TABLE routine ADD COLUMN IF NOT EXISTS batch_section VARCHAR(10);

-- ── Updated_at trigger for results ────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_results_updated_at') THEN
    CREATE TRIGGER trg_results_updated_at
      BEFORE UPDATE ON results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Add student_number and batch info to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_number VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_number   INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_section  VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id_num VARCHAR(30);

-- ── Reschedule Requests ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id              SERIAL PRIMARY KEY,
  routine_id      INTEGER      REFERENCES routine(id) ON DELETE SET NULL,
  teacher_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_day    VARCHAR(10)  NOT NULL,
  original_time   VARCHAR(20)  NOT NULL,
  original_room   VARCHAR(50)  NOT NULL,
  requested_day   VARCHAR(10)  NOT NULL,
  requested_time  VARCHAR(20)  NOT NULL,
  requested_room  VARCHAR(50)  NOT NULL,
  course_code     VARCHAR(20)  NOT NULL,
  course_name     VARCHAR(255),
  reason          TEXT         NOT NULL,
  status          VARCHAR(15)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  admin_note      TEXT,
  reviewed_by     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add student_number unique index if not exists
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);

-- ── Reschedule Requests (teacher → admin approval) ────────────
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id              SERIAL PRIMARY KEY,
  teacher_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id      INTEGER      REFERENCES routine(id) ON DELETE SET NULL,
  -- original slot
  original_day    VARCHAR(10)  NOT NULL,
  original_time   VARCHAR(20)  NOT NULL,
  original_room   VARCHAR(20)  NOT NULL,
  course_code     VARCHAR(20)  NOT NULL,
  course_name     VARCHAR(255) NOT NULL,
  batch_number    INTEGER,
  batch_section   VARCHAR(10),
  -- requested new slot
  requested_day   VARCHAR(10)  NOT NULL,
  requested_time  VARCHAR(20)  NOT NULL,
  requested_room  VARCHAR(20)  NOT NULL,
  reason          TEXT,
  status          VARCHAR(15)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  admin_note      TEXT,
  reviewed_by     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reschedule_teacher ON reschedule_requests(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_reschedule_status  ON reschedule_requests(status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reschedule_updated_at') THEN
    CREATE TRIGGER trg_reschedule_updated_at
      BEFORE UPDATE ON reschedule_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── Reschedule Requests (teacher → admin) ─────────────────────
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id               SERIAL PRIMARY KEY,
  routine_id       INTEGER      REFERENCES routine(id) ON DELETE CASCADE,
  teacher_id       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_day     VARCHAR(10)  NOT NULL,
  original_time    VARCHAR(20)  NOT NULL,
  original_room    VARCHAR(50)  NOT NULL,
  requested_day    VARCHAR(10)  NOT NULL,
  requested_time   VARCHAR(20)  NOT NULL,
  requested_room   VARCHAR(50),
  reason           TEXT,
  status           VARCHAR(15)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
  admin_note       TEXT,
  resolved_by      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast teacher/status lookups
CREATE INDEX IF NOT EXISTS idx_reschedule_teacher ON reschedule_requests(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_reschedule_status  ON reschedule_requests(status);

-- Trigger
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reschedule_updated_at') THEN
    CREATE TRIGGER trg_reschedule_updated_at
      BEFORE UPDATE ON reschedule_requests
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Ensure student_number on users (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_number VARCHAR(30) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_number   INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_section  VARCHAR(10);

-- Link Smart Classroom activity and deadlines back to assignments
ALTER TABLE classroom_announcements ADD COLUMN IF NOT EXISTS assignment_id INTEGER;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS assignment_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_deadlines_assignment ON deadlines(assignment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_announcements_assignment
  ON classroom_announcements(assignment_id)
  WHERE assignment_id IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_classroom_announcements_assignment'
  ) THEN
    ALTER TABLE classroom_announcements
      ADD CONSTRAINT fk_classroom_announcements_assignment
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_deadlines_assignment'
  ) THEN
    ALTER TABLE deadlines
      ADD CONSTRAINT fk_deadlines_assignment
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill missing assignment-linked classroom activity rows
INSERT INTO classroom_announcements (classroom_id, title, content, assignment_id, author_id)
SELECT
  a.classroom_id,
  'New Assignment: ' || a.title,
  'A new assignment has been posted for '
    || c.course_code || ' - ' || c.course_name
    || '. Due '
    || COALESCE(TO_CHAR(a.due_date, 'YYYY-MM-DD HH24:MI'), 'No due date')
    || '. ' || COALESCE(a.points, 100)::text || ' points.'
    || CASE
         WHEN COALESCE(a.description, '') <> '' THEN ' ' || a.description
         ELSE ''
       END,
  a.id,
  a.teacher_id
FROM assignments a
JOIN classrooms c ON c.id = a.classroom_id
LEFT JOIN classroom_announcements ca ON ca.assignment_id = a.id
WHERE ca.id IS NULL;

-- Backfill missing assignment-linked student deadlines
INSERT INTO deadlines (title, description, course_code, course_name, deadline_date, assignment_id, type, priority, user_id)
SELECT
  a.title,
  'A new assignment has been posted for '
    || c.course_code || ' - ' || c.course_name
    || '. Due '
    || TO_CHAR(a.due_date, 'YYYY-MM-DD HH24:MI')
    || '. ' || COALESCE(a.points, 100)::text || ' points.'
    || CASE
         WHEN COALESCE(a.description, '') <> '' THEN ' ' || a.description
         ELSE ''
       END,
  c.course_code,
  c.course_name,
  a.due_date,
  a.id,
  'assignment',
  CASE
    WHEN a.due_date <= NOW() + INTERVAL '3 days' THEN 'high'
    WHEN a.due_date <= NOW() + INTERVAL '7 days' THEN 'medium'
    ELSE 'low'
  END,
  cs.student_id
FROM assignments a
JOIN classrooms c ON c.id = a.classroom_id
JOIN classroom_students cs ON cs.classroom_id = a.classroom_id
LEFT JOIN deadlines d ON d.assignment_id = a.id AND d.user_id = cs.student_id
WHERE a.due_date IS NOT NULL
  AND d.id IS NULL;

-- Clean invalid legacy attachment payloads
UPDATE assignments
SET attachments = '[]'::jsonb
WHERE attachments = '[{}]'::jsonb;

UPDATE assignment_submissions
SET attachments = '[]'::jsonb
WHERE attachments = '[{}]'::jsonb;

-- Link classroom marks back to assignment grading
ALTER TABLE classroom_marks ADD COLUMN IF NOT EXISTS assignment_id INTEGER;
ALTER TABLE classroom_marks ADD COLUMN IF NOT EXISTS submission_id INTEGER;
ALTER TABLE classroom_marks ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';
ALTER TABLE classroom_marks ADD COLUMN IF NOT EXISTS feedback TEXT;

ALTER TABLE classroom_marks ALTER COLUMN source SET DEFAULT 'manual';
UPDATE classroom_marks
SET source = 'manual'
WHERE source IS NULL OR source = '';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_marks_source_check'
  ) THEN
    ALTER TABLE classroom_marks
      ADD CONSTRAINT classroom_marks_source_check
      CHECK (source IN ('manual', 'assignment'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_classroom_marks_assignment'
  ) THEN
    ALTER TABLE classroom_marks
      ADD CONSTRAINT fk_classroom_marks_assignment
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_classroom_marks_submission'
  ) THEN
    ALTER TABLE classroom_marks
      ADD CONSTRAINT fk_classroom_marks_submission
      FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classroom_marks_assignment ON classroom_marks(assignment_id);
CREATE INDEX IF NOT EXISTS idx_classroom_marks_source ON classroom_marks(classroom_id, source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_marks_submission ON classroom_marks(submission_id);

-- Backfill assignment-linked classroom marks from existing graded submissions.
UPDATE classroom_marks cm
SET
  classroom_id = a.classroom_id,
  student_id = s.student_id,
  assignment_id = a.id,
  submission_id = s.id,
  source = 'assignment',
  title = a.title,
  marks_obtained = s.grade,
  total_marks = COALESCE(a.points, 100),
  feedback = COALESCE(s.feedback, cm.feedback),
  date = COALESCE(s.graded_at::date, cm.date, CURRENT_DATE),
  updated_at = NOW()
FROM assignment_submissions s
JOIN assignments a ON a.id = s.assignment_id
WHERE s.grade IS NOT NULL
  AND cm.submission_id = s.id;

UPDATE classroom_marks cm
SET
  assignment_id = a.id,
  submission_id = s.id,
  source = 'assignment',
  title = a.title,
  marks_obtained = s.grade,
  total_marks = COALESCE(a.points, 100),
  feedback = COALESCE(s.feedback, cm.feedback),
  date = COALESCE(s.graded_at::date, cm.date, CURRENT_DATE),
  updated_at = NOW()
FROM assignment_submissions s
JOIN assignments a ON a.id = s.assignment_id
WHERE s.grade IS NOT NULL
  AND cm.submission_id IS NULL
  AND cm.assignment_id IS NULL
  AND cm.classroom_id = a.classroom_id
  AND cm.student_id = s.student_id
  AND cm.title = a.title
  AND cm.total_marks = COALESCE(a.points, 100);

INSERT INTO classroom_marks (
  classroom_id,
  student_id,
  assignment_id,
  submission_id,
  source,
  title,
  marks_obtained,
  total_marks,
  feedback,
  date
)
SELECT
  a.classroom_id,
  s.student_id,
  a.id,
  s.id,
  'assignment',
  a.title,
  s.grade,
  COALESCE(a.points, 100),
  COALESCE(s.feedback, ''),
  COALESCE(s.graded_at::date, CURRENT_DATE)
FROM assignment_submissions s
JOIN assignments a ON a.id = s.assignment_id
LEFT JOIN classroom_marks cm ON cm.submission_id = s.id
WHERE s.grade IS NOT NULL
  AND cm.id IS NULL;

-- Study group communication tables and extensions
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS study_group_messages (
  id              SERIAL PRIMARY KEY,
  group_id        INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message         TEXT    NOT NULL,
  message_type    VARCHAR(20) NOT NULL DEFAULT 'text'
                    CHECK (message_type IN ('text','emoji','attachment')),
  attachment_name VARCHAR(255),
  attachment_url  TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_announcements (
  id             SERIAL PRIMARY KEY,
  group_id       INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  content        TEXT NOT NULL,
  category       VARCHAR(30) NOT NULL DEFAULT 'update'
                   CHECK (category IN ('important','update','meeting','resource','general')),
  content_format VARCHAR(20) NOT NULL DEFAULT 'markdown'
                   CHECK (content_format IN ('plain','markdown')),
  is_pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_activities (
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(80) NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_resources (
  id            SERIAL PRIMARY KEY,
  group_id      INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  resource_type VARCHAR(20) NOT NULL DEFAULT 'link'
                  CHECK (resource_type IN ('link','file','note')),
  resource_url  TEXT,
  file_path     VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_announcement_comments (
  id              SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES study_group_announcements(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_message_reactions (
  id         SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES study_group_messages(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction   VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_study_group_message_reaction UNIQUE (message_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS study_group_message_reads (
  id         SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES study_group_messages(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_study_group_message_read UNIQUE (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_group_typing_status (
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_study_group_typing_user UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_messages_group ON study_group_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_announcements_group ON study_group_announcements(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_comment_announcement ON study_group_announcement_comments(announcement_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_resources_group ON study_group_resources(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_activity_group ON study_group_activities(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_reactions_message ON study_group_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_study_group_reads_message ON study_group_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_study_group_typing_group ON study_group_typing_status(group_id, updated_at);

ALTER TABLE study_group_announcements ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'update';
ALTER TABLE study_group_announcements ADD COLUMN IF NOT EXISTS content_format VARCHAR(20) DEFAULT 'markdown';
ALTER TABLE study_group_announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE study_group_announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE study_group_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE study_group_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
ALTER TABLE study_group_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE study_group_messages ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE study_group_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE study_group_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
