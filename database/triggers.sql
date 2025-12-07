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

DELIMITER ;

