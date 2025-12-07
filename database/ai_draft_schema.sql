-- ============================================================
-- AI DRAFT FEATURE - Schema Changes
-- Adds columns and constraints for AI-generated paper drafts
-- ============================================================

USE research_paper_review_db;

-- Add AI-specific columns to Papers table
ALTER TABLE Papers
  ADD COLUMN ai_generated TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN source_paper_id VARCHAR(50) NULL,
  ADD CONSTRAINT fk_papers_source
      FOREIGN KEY (source_paper_id) REFERENCES Papers(paper_id)
      ON DELETE SET NULL,
  ADD CONSTRAINT chk_ai_flag
      CHECK (ai_generated IN (0,1));

-- Add relation_type to RelatedPapers if it doesn't exist
-- Check if column exists first (MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
-- We'll add it and handle errors gracefully
ALTER TABLE RelatedPapers
  ADD COLUMN relation_type VARCHAR(50) DEFAULT 'RELATED';

