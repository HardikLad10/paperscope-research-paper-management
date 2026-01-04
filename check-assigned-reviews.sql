-- Diagnostic queries for Assigned Reviews
-- Run these in MySQL to check why assigned reviews are empty

-- 1. Check if your user is a reviewer
SELECT user_id, user_name, is_reviewer 
FROM Users 
WHERE user_id = 'U001';  -- Replace with your user_id

-- 2. Check how many papers have 'Under Review' or 'In Review' status
SELECT status, COUNT(*) as count 
FROM Papers 
GROUP BY status;

-- 3. Check papers with 'Under Review' or 'In Review' status
SELECT paper_id, paper_title, status 
FROM Papers 
WHERE status IN ('Under Review', 'In Review') 
LIMIT 10;

-- 4. Check which papers U001 authored (so we can exclude them)
SELECT DISTINCT p.paper_id, p.paper_title, p.status
FROM Papers p
JOIN Authorship a ON a.paper_id = p.paper_id
WHERE a.user_id = 'U001'  -- Replace with your user_id
LIMIT 10;

-- 5. Check papers that should appear in assigned reviews for U001
-- (papers with 'Under Review'/'In Review' that U001 didn't author)
SELECT DISTINCT
  p.paper_id,
  p.paper_title,
  p.status,
  v.venue_name
FROM Papers p
LEFT JOIN Venues v ON v.venue_id = p.venue_id
WHERE p.status IN ('Under Review', 'In Review')
  AND p.paper_id NOT IN (
    SELECT a.paper_id 
    FROM Authorship a 
    WHERE a.user_id = 'U001'  -- Replace with your user_id
  )
ORDER BY p.upload_timestamp DESC
LIMIT 10;

