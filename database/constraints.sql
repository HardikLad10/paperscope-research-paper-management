-- ============================================================
-- DATABASE CONSTRAINTS
-- Additional constraints for research_paper_review_db
-- ============================================================

USE research_paper_review_db;

-- ============================================================
-- CONSTRAINT 1: Prevent Duplicate Paper Titles in Same Venue
-- ============================================================
--
-- Business Rule:
-- A venue cannot have two papers with the exact same title.
-- This prevents accidental duplicate submissions.
--
-- Used by: Transaction TX_CREATE_PAPER_WITH_AUTHORS
-- Backend check at: server.js lines 473-482
-- ============================================================

ALTER TABLE Papers
ADD CONSTRAINT uq_papers_venue_title 
UNIQUE (venue_id, paper_title);

-- ============================================================
-- CONSTRAINT 2: Papers - Status vs Upload Timestamp (Tuple-level)
-- ============================================================
--
-- Business Rule:
-- If a paper is visible in the workflow ('Under Review' or 'Published'),
-- it must have a non-NULL upload_timestamp.
-- 'Draft' and 'AI_DRAFT' are allowed to be missing timestamp while in progress.
-- ============================================================

ALTER TABLE Papers
ADD CONSTRAINT chk_papers_timestamp_when_active
CHECK (
    status IN ('Draft', 'AI_DRAFT')
    OR upload_timestamp IS NOT NULL
);

-- ============================================================
-- CONSTRAINT 3: Reviews - Comment Cannot Be Empty (Attribute-level)
-- ============================================================
--
-- Business Rule:
-- Every review must contain a meaningful comment, not just empty text.
-- ============================================================

ALTER TABLE Reviews
ADD CONSTRAINT chk_reviews_comment_nonempty
CHECK (CHAR_LENGTH(TRIM(comment)) > 0);

-- ============================================================
-- CONSTRAINT 4: Users - Email Format Sanity Check (Attribute-level)
-- ============================================================
--
-- Business Rule:
-- Email should at least look like a valid address: contains '@' and '.'.
-- This is not a full RFC validator, just a basic integrity check.
-- ============================================================

ALTER TABLE Users
ADD CONSTRAINT chk_users_email_format
CHECK (email LIKE '%@%.%');

-- ============================================================
-- NOTE: Existing Tuple-level Constraint (in DDL, not redefined here)
-- ============================================================
-- RelatedPapers already has:
--   CONSTRAINT chk_no_self_relation CHECK (paper_id <> related_paper_id);
-- We reference it in the report/demo as another tuple-level constraint.
