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
