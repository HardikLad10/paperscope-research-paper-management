-- ============================================================
-- Triggers for research_paper_review_db
-- ============================================================

USE research_paper_review_db;

DELIMITER $$

-- Trigger 1: Auto-set review_timestamp if NULL
DROP TRIGGER IF EXISTS trg_reviews_set_timestamp $$

CREATE TRIGGER trg_reviews_set_timestamp
BEFORE INSERT ON Reviews
FOR EACH ROW
BEGIN
  IF NEW.review_timestamp IS NULL THEN
    SET NEW.review_timestamp = NOW();
  END IF;
END$$

-- Trigger 2: Prevent authors from reviewing their own papers
DROP TRIGGER IF EXISTS trg_no_self_review $$

CREATE TRIGGER trg_no_self_review
BEFORE INSERT ON Reviews
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM Authorship
    WHERE user_id = NEW.user_id
      AND paper_id = NEW.paper_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Authors cannot review their own paper';
  END IF;
END$$

-- Trigger 3: Validate AI draft promotion to Under Review
DROP TRIGGER IF EXISTS trg_ai_paper_before_update$$

CREATE TRIGGER trg_ai_paper_before_update
BEFORE UPDATE ON Papers
FOR EACH ROW
BEGIN
    -- Only apply when an AI draft is being promoted
    IF OLD.ai_generated = 1
       AND OLD.status = 'AI_DRAFT'
       AND NEW.status = 'Under Review' THEN

        -- Require a real PDF URL
        IF NEW.pdf_url IS NULL
           OR NEW.pdf_url = ''
           OR NEW.pdf_url = 'AI_DRAFT_NO_PDF' THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'AI paper must have a real PDF URL before moving to Under Review';
        END IF;

        -- Require a non-trivial abstract (example threshold)
        IF NEW.abstract IS NULL
           OR CHAR_LENGTH(NEW.abstract) < 50 THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'AI paper must have an abstract of at least 50 characters before moving to Under Review';
        END IF;

        -- Venue should already be non-NULL, but we guard anyway
        IF NEW.venue_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'AI paper must have a venue before moving to Under Review';
        END IF;

    END IF;
END$$

DELIMITER ;

