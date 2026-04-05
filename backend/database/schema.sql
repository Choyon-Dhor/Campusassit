CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  student_number VARCHAR(20),
  password    VARCHAR(255)  NOT NULL,
  role        VARCHAR(20)   NOT NULL DEFAULT 'student'
                CHECK (role IN ('student','teacher','admin')),
  department  VARCHAR(100),
  avatar      VARCHAR(255),
  last_active_at TIMESTAMPTZ,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  content     TEXT          NOT NULL,
  author_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    VARCHAR(20)   NOT NULL DEFAULT 'general'
                CHECK (category IN ('general','academic','event','urgent')),
  target_role VARCHAR(20)   NOT NULL DEFAULT 'all'
                CHECK (target_role IN ('all','student','teacher')),
  is_pinned   BOOLEAN       NOT NULL DEFAULT FALSE,
  attachment  VARCHAR(255),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS  (Observer Pattern storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  message      TEXT         NOT NULL,
  type         VARCHAR(20)  NOT NULL DEFAULT 'announcement'
                 CHECK (type IN ('announcement','deadline','consultation','studygroup','resource')),
  reference_id INTEGER,
  is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SMART CLASSROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS classrooms (
  id          SERIAL PRIMARY KEY,
  course_code VARCHAR(50)  NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch       VARCHAR(20)  NOT NULL,
  section     VARCHAR(20)  NOT NULL,
  semester    VARCHAR(20)  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classroom_students (
  id           SERIAL PRIMARY KEY,
  classroom_id INTEGER      NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_classroom_student UNIQUE (classroom_id, student_id)
);

CREATE TABLE IF NOT EXISTS classroom_attendance (
  id           SERIAL PRIMARY KEY,
  classroom_id INTEGER      NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         DATE         NOT NULL,
  status       VARCHAR(10)  NOT NULL CHECK (status IN ('present','absent')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_attendance_record UNIQUE (classroom_id, student_id, date)
);

CREATE TABLE IF NOT EXISTS classroom_marks (
  id             SERIAL PRIMARY KEY,
  classroom_id   INTEGER      NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id  INTEGER,
  submission_id  INTEGER      UNIQUE,
  source         VARCHAR(20)  NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','assignment')),
  title          VARCHAR(255) NOT NULL,
  marks_obtained NUMERIC(8,2) NOT NULL,
  total_marks    NUMERIC(8,2) NOT NULL,
  feedback       TEXT,
  date           DATE         NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classroom_announcements (
  id           SERIAL PRIMARY KEY,
  classroom_id INTEGER      NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  content      TEXT         NOT NULL,
  assignment_id INTEGER,
  author_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classroom_resources (
  id           SERIAL PRIMARY KEY,
  classroom_id INTEGER      NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  file_url     VARCHAR(500) NOT NULL,
  uploader_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id          SERIAL PRIMARY KEY,
  room_name   VARCHAR(50)  NOT NULL UNIQUE,
  building    VARCHAR(100),
  capacity    INTEGER      NOT NULL DEFAULT 30,
  type        VARCHAR(20)  NOT NULL DEFAULT 'classroom'
                CHECK (type IN ('classroom','lab','seminar','lecture_hall')),
  floor       INTEGER      NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROUTINE  (Class schedule)
-- ============================================================
CREATE TABLE IF NOT EXISTS routine (
  id           SERIAL PRIMARY KEY,
  day          VARCHAR(10)  NOT NULL
                 CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  time_slot    VARCHAR(20)  NOT NULL,
  start_time   TIME         NOT NULL,
  end_time     TIME         NOT NULL,
  course_code  VARCHAR(20)  NOT NULL,
  course_name  VARCHAR(255) NOT NULL,
  room_name    VARCHAR(50)  NOT NULL,
  faculty_name VARCHAR(100),
  department   VARCHAR(100),
  semester     VARCHAR(20),
  batch        VARCHAR(20),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESOURCES
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
  id                   SERIAL PRIMARY KEY,
  title                VARCHAR(255)   NOT NULL,
  description          TEXT,
  file_path            VARCHAR(500)   NOT NULL,
  file_type            VARCHAR(20)    NOT NULL DEFAULT 'notes'
                         CHECK (file_type IN ('notes','question_paper','assignment','reference','other')),
  course_code          VARCHAR(20),
  course_name          VARCHAR(255),
  semester             VARCHAR(20),
  department           VARCHAR(100),
  uploader_id          INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  download_count       INTEGER        NOT NULL DEFAULT 0,
  average_rating       NUMERIC(3,2)   NOT NULL DEFAULT 0.00,
  recommendation_score NUMERIC(10,4)  NOT NULL DEFAULT 0.0000,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESOURCE RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_ratings (
  id          SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_rating UNIQUE (resource_id, user_id)
);

-- ============================================================
-- STUDY GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS study_groups (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  course_code      VARCHAR(20),
  course_name      VARCHAR(255),
  creator_id       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members      INTEGER      NOT NULL DEFAULT 10,
  is_private       BOOLEAN      NOT NULL DEFAULT FALSE,
  meeting_schedule VARCHAR(255),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STUDY GROUP MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS study_group_members (
  id        SERIAL PRIMARY KEY,
  group_id  INTEGER     NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id   INTEGER     NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  role      VARCHAR(10) NOT NULL DEFAULT 'member'
              CHECK (role IN ('creator','member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_member UNIQUE (group_id, user_id)
);

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
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  category   VARCHAR(30) NOT NULL DEFAULT 'update'
               CHECK (category IN ('important','update','meeting','resource','general')),
  content_format VARCHAR(20) NOT NULL DEFAULT 'markdown'
               CHECK (content_format IN ('plain','markdown')),
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_announcement_comments (
  id              SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES study_group_announcements(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_activities (
  id        SERIAL PRIMARY KEY,
  group_id  INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action    VARCHAR(80) NOT NULL,
  payload   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_resources (
  id           SERIAL PRIMARY KEY,
  group_id     INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  resource_type VARCHAR(20) NOT NULL DEFAULT 'link'
                CHECK (resource_type IN ('link','file','note')),
  resource_url TEXT,
  file_path    VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- ============================================================
-- CONSULTATION HOURS
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_hours (
  id         SERIAL PRIMARY KEY,
  teacher_id INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        VARCHAR(10) NOT NULL
               CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time TIME        NOT NULL,
  end_time   TIME        NOT NULL,
  location   VARCHAR(255),
  notes      TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONSULTATION APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_appointments (
  id               SERIAL PRIMARY KEY,
  consultation_id  INTEGER     NOT NULL REFERENCES consultation_hours(id) ON DELETE CASCADE,
  student_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_date DATE        NOT NULL,
  start_time       TIME        NOT NULL,
  purpose          TEXT        NOT NULL,
  status           VARCHAR(10) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','completed')),
  teacher_notes    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEADLINES
-- ============================================================
CREATE TABLE IF NOT EXISTS deadlines (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  course_code   VARCHAR(20),
  course_name   VARCHAR(255),
  deadline_date TIMESTAMPTZ  NOT NULL,
  assignment_id INTEGER,
  type          VARCHAR(20)  NOT NULL DEFAULT 'assignment'
                  CHECK (type IN ('assignment','exam','project','quiz','other')),
  priority      VARCHAR(10)  NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high')),
  user_id       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_completed  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_routine_day        ON routine(day);
CREATE INDEX IF NOT EXISTS idx_routine_time       ON routine(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_resources_score    ON resources(recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_deadlines_date     ON deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_assignment ON deadlines(assignment_id);
CREATE INDEX IF NOT EXISTS idx_announcements_auth ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom ON classroom_students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_attendance_student ON classroom_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_marks_student ON classroom_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_marks_assignment ON classroom_marks(assignment_id);
CREATE INDEX IF NOT EXISTS idx_classroom_marks_source ON classroom_marks(classroom_id, source);
CREATE INDEX IF NOT EXISTS idx_classroom_announcements_classroom ON classroom_announcements(classroom_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_announcements_assignment
  ON classroom_announcements(assignment_id)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classroom_resources_classroom ON classroom_resources(classroom_id);
CREATE INDEX IF NOT EXISTS idx_study_group_messages_group ON study_group_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_announcements_group ON study_group_announcements(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_comment_announcement ON study_group_announcement_comments(announcement_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_resources_group ON study_group_resources(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_activity_group ON study_group_activities(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_group_reactions_message ON study_group_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_study_group_reads_message ON study_group_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_study_group_typing_group ON study_group_typing_status(group_id, updated_at);

-- ============================================================
-- Auto-update updated_at via trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  -- Create triggers only if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_announcements_updated_at') THEN
    CREATE TRIGGER trg_announcements_updated_at
      BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_resources_updated_at') THEN
    CREATE TRIGGER trg_resources_updated_at
      BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_study_groups_updated_at') THEN
    CREATE TRIGGER trg_study_groups_updated_at
      BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_deadlines_updated_at') THEN
    CREATE TRIGGER trg_deadlines_updated_at
      BEFORE UPDATE ON deadlines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_consultation_appt_updated_at') THEN
    CREATE TRIGGER trg_consultation_appt_updated_at
      BEFORE UPDATE ON consultation_appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id              SERIAL PRIMARY KEY,
  classroom_id    INTEGER      NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  attachments     JSONB,  -- Array of file URLs/paths
  due_date        TIMESTAMPTZ,
  points          INTEGER      DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id              SERIAL PRIMARY KEY,
  assignment_id   INTEGER      NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_text TEXT,
  attachments     JSONB,  -- Array of file URLs/paths
  grade           NUMERIC(5,2),
  feedback        TEXT,
  submitted_at    TIMESTAMPTZ,
  graded_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_submission UNIQUE (assignment_id, student_id)
);

-- ============================================================
-- INDEXES FOR ASSIGNMENTS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_assignments_classroom    ON assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher      ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date     ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment   ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student      ON assignment_submissions(student_id);

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

-- ============================================================
-- UPDATE TRIGGERS FOR ASSIGNMENTS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assignments_updated_at') THEN
    CREATE TRIGGER trg_assignments_updated_at
      BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assignment_submissions_updated_at') THEN
    CREATE TRIGGER trg_assignment_submissions_updated_at
      BEFORE UPDATE ON assignment_submissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
