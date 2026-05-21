-- Populate changelabs table from changelab_roster
-- One row per unique project+semester combo
-- Uses a generated code (first word of project + semester abbreviation)
INSERT INTO changelabs (code, title, semester, brief, status, capacity, enrolled)
SELECT
  UPPER(SUBSTRING(REGEXP_REPLACE(project_name, '[^a-zA-Z0-9]', '', 'g'), 1, 6))
    || '-' || REPLACE(semester, ' ', '') AS code,
  project_name AS title,
  semester,
  'Imported from historical ChangeLab roster.' AS brief,
  'completed' AS status,
  COUNT(*) + 2 AS capacity,
  COUNT(*) AS enrolled
FROM changelab_roster
GROUP BY project_name, semester
ON CONFLICT DO NOTHING;

-- Update faculty name from roster instructor field
-- Store instructor as a text note in the brief since faculty_id requires a users row
UPDATE changelabs cl
SET brief = 'Instructor: ' || cr.instructor || CASE WHEN cr.instructor IS NOT NULL THEN ' · ' ELSE '' END || 'Imported from historical ChangeLab roster.'
FROM (
  SELECT project_name, semester, instructor
  FROM changelab_roster
  WHERE instructor IS NOT NULL
  GROUP BY project_name, semester, instructor
) cr
WHERE cl.title = cr.project_name
  AND cl.semester = cr.semester
  AND cr.instructor IS NOT NULL;
