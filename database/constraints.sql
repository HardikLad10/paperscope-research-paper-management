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



