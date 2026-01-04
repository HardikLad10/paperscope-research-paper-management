-- Setup Reviewers and Assign Papers for Review
-- Makes first 10 users reviewers and ensures they have papers to review

-- Step 1: Make first 10 users reviewers
UPDATE Users 
SET is_reviewer = '1' 
WHERE user_id IN ('U001', 'U002', 'U003', 'U004', 'U005', 'U006', 'U007', 'U008', 'U009', 'U010');

-- Step 2: Update some papers to 'Under Review' status (if they're not already)
-- Update papers that are currently 'Published' or 'Draft' to 'Under Review'
-- Using a simpler approach: update first 200 papers with those statuses
UPDATE Papers 
SET status = 'Under Review' 
WHERE status IN ('Published', 'Draft')
  AND paper_id IN (
    SELECT paper_id FROM (
      SELECT paper_id FROM Papers 
      WHERE status IN ('Published', 'Draft')
      LIMIT 200
    ) AS temp
  );

-- Step 3: Verify the setup
-- Check reviewers
SELECT user_id, user_name, is_reviewer 
FROM Users 
WHERE user_id IN ('U001', 'U002', 'U003', 'U004', 'U005', 'U006', 'U007', 'U008', 'U009', 'U010')
ORDER BY user_id;

-- Check paper statuses
SELECT status, COUNT(*) as count 
FROM Papers 
GROUP BY status;

-- Check papers available for review for U001 (example)
-- These are papers with 'Under Review' or 'In Review' that U001 didn't author
SELECT COUNT(*) as available_papers_for_review
FROM Papers p
WHERE p.status IN ('Under Review', 'In Review')
  AND p.paper_id NOT IN (
    SELECT a.paper_id 
    FROM Authorship a 
    WHERE a.user_id = 'U001'
  );

-- Show sample papers available for U001 to review
SELECT 
  p.paper_id,
  p.paper_title,
  p.status,
  v.venue_name,
  v.year
FROM Papers p
LEFT JOIN Venues v ON v.venue_id = p.venue_id
WHERE p.status IN ('Under Review', 'In Review')
  AND p.paper_id NOT IN (
    SELECT a.paper_id 
    FROM Authorship a 
    WHERE a.user_id = 'U001'
  )
ORDER BY p.upload_timestamp DESC
LIMIT 10;

