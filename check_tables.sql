DO $$
DECLARE
  required_tables TEXT[] := ARRAY[
    'users', 'announcements', 'notifications', 'classrooms', 
    'classroom_students', 'classroom_attendance', 'classroom_marks',
    'classroom_announcements', 'classroom_resources', 'rooms', 'routine',
    'resources', 'resource_ratings', 'study_groups', 'study_group_members',
    'consultation_hours', 'consultation_appointments', 'deadlines'
  ];
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(t) INTO missing_tables
  FROM UNNEST(required_tables) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t
  );
  
  IF missing_tables IS NOT NULL THEN
    RAISE NOTICE 'Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'All required tables exist!';
  END IF;
END $$;