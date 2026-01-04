-- ============================================================
-- TRANSACTIONS
-- Documentation of all transactions in the system
-- ============================================================

USE research_paper_review_db;

-- ============================================================
-- TRANSACTION 1: sp_delete_paper_safe (Database-level)
-- ============================================================
--
-- Location: Stored procedure in database/procedures.sql
-- Purpose: Atomically delete a paper and all related records
-- Isolation Level: READ COMMITTED
-- UI Access: Delete button on My Papers page
--
-- Implementation:
-- ============================================================

DROP PROCEDURE IF EXISTS sp_delete_paper_safe;

DELIMITER $$

CREATE PROCEDURE sp_delete_paper_safe (
    IN p_paper_id VARCHAR(50),
    IN p_user_id  VARCHAR(50)
)
BEGIN
    DECLARE v_is_author       INT DEFAULT 0;
    DECLARE v_coauthor_count  INT DEFAULT 0;

    -- Check that the paper exists AND that p_user_id is an author
    SELECT COUNT(*) INTO v_is_author
    FROM Papers p
    WHERE p.paper_id = p_paper_id
      AND EXISTS (
          SELECT 1
          FROM Authorship a
          WHERE a.paper_id = p.paper_id
            AND a.user_id  = p_user_id
      );

    IF v_is_author = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Paper not found or user is not an author';
    END IF;

    -- Count co-authors
    SELECT COALESCE(t.coauthor_count, 0) INTO v_coauthor_count
    FROM (
        SELECT paper_id, COUNT(*) AS coauthor_count
        FROM Authorship
        WHERE paper_id = p_paper_id
          AND user_id <> p_user_id
        GROUP BY paper_id
    ) AS t;

    IF v_coauthor_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot delete: paper has co-authors';
    END IF;

    -- TRANSACTION: Atomic deletion of paper and all related records
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    START TRANSACTION;

    -- 1) Delete reviews for this paper
    DELETE FROM Reviews
    WHERE paper_id = p_paper_id;

    -- 2) Delete related paper links (both directions)
    DELETE FROM RelatedPapers
    WHERE paper_id = p_paper_id
       OR related_paper_id = p_paper_id;

    -- 3) Delete authorship links
    DELETE FROM Authorship
    WHERE paper_id = p_paper_id;

    -- 4) Finally delete the paper itself
    DELETE FROM Papers
    WHERE paper_id = p_paper_id;

    COMMIT;
END$$

DELIMITER ;

-- ============================================================
-- TRANSACTION 2: TX_CREATE_PAPER_WITH_AUTHORS (Backend-level)
-- ============================================================
--
-- Location: server.js, POST /api/papers/with-authors
-- Purpose: Atomically create a new paper and its authorship rows
-- Isolation Level: READ COMMITTED
-- UI Access: Create Paper page
--
-- Implementation (JavaScript/Node.js):
-- ============================================================
--
-- async function createPaperWithAuthors(req, res) {
--   const { paper_title, abstract, pdf_url, status, venue_id, 
--           project_id, dataset_id, author_ids } = req.body;
--   
--   let conn;
--   try {
--     conn = await pool.getConnection();
--     
--     // Set isolation level and begin transaction
--     await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
--     await conn.beginTransaction();
--     
--     // Step 1: Generate unique paper_id
--     const paperId = "P_" + uuidv4();
--     
--     // Step 2: Insert the paper
--     await conn.execute(
--       `INSERT INTO Papers (paper_id, paper_title, abstract, pdf_url,
--                            upload_timestamp, status, venue_id, project_id, dataset_id)
--        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
--       [paperId, paper_title, abstract, pdf_url, status, venue_id, project_id, dataset_id]
--     );
--     
--     // Step 3: Insert authorship for each author
--     for (const authorId of author_ids) {
--       await conn.execute(
--         `INSERT INTO Authorship (user_id, paper_id) VALUES (?, ?)`,
--         [authorId, paperId]
--       );
--     }
--     
--     // Commit transaction
--     await conn.commit();
--     return res.status(201).json({ paper_id: paperId });
--     
--   } catch (error) {
--     // Rollback on any error
--     if (conn) await conn.rollback();
--     
--     // Handle specific errors
--     if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
--       return res.status(400).json({ error: 'Invalid venue, project, dataset, or author ID' });
--     }
--     if (error.code === 'ER_DUP_ENTRY') {
--       return res.status(409).json({ error: 'Paper with same title already exists in this venue' });
--     }
--     return res.status(500).json({ error: 'Failed to create paper' });
--     
--   } finally {
--     if (conn) conn.release();
--   }
-- }
--
-- ============================================================
-- ACID Properties for Both Transactions
-- ============================================================
--
-- Atomicity:
--   - sp_delete_paper_safe: All deletions happen together or none
--   - TX_CREATE_PAPER_WITH_AUTHORS: Paper + all authors created together or not at all
--
-- Consistency:
--   - Both enforce PK/FK constraints and business rules
--   - sp_delete_paper_safe: Checks authorship before deletion
--   - TX_CREATE_PAPER_WITH_AUTHORS: Enforces uq_papers_venue_title constraint
--
-- Isolation:
--   - Both use READ COMMITTED isolation level
--   - Prevents dirty reads while allowing concurrent access
--
-- Durability:
--   - InnoDB storage engine guarantees committed changes persist
--   - Both transactions are durable after COMMIT
--
-- ============================================================
-- Error Handling
-- ============================================================
--
-- sp_delete_paper_safe:
--   - SQLSTATE 45000: User not authorized or paper has co-authors
--   - Automatic rollback on any error during transaction
--
-- TX_CREATE_PAPER_WITH_AUTHORS:
--   - ER_NO_REFERENCED_ROW: Invalid foreign key reference
--   - ER_DUP_ENTRY: Unique constraint violation
--   - Explicit rollback on any error
--

-- ============================================================
-- TRANSACTION 3: TX_BATCH_CREATE_PAPERS_WITH_AUTHORS (Backend-level)
-- ============================================================
--
-- Location: server.js, POST /api/papers/batch-with-authors (lines 1229-1434)
-- Purpose: Atomically create multiple papers with authors in a single transaction
-- Isolation Level: READ COMMITTED
-- UI Access: Batch Other Authors' Papers page
--
-- Advanced Transaction Features:
-- ============================================================
--
-- 1. SELECT ... FOR UPDATE (Row-level locking)
--    - Locks existing papers to prevent duplicate title insertion
--    - Query: SELECT p.venue_id, p.paper_title FROM Papers p 
--             WHERE (p.venue_id, p.paper_title) IN (...) FOR UPDATE
--
-- 2. Foreign Key Validation with JOINs
--    - Validates all venue_id, project_id, dataset_id, user_id before insertion
--    - Uses IN queries to batch validate all foreign keys
--    - Ensures referential integrity before any writes
--
-- 3. Composite IN Subquery for Duplicate Detection
--    - Checks (venue_id, paper_title) pairs against existing papers
--    - Prevents duplicate titles within same venue
--
-- 4. GROUP BY Aggregation for Summary
--    - Query: SELECT v.venue_name, COUNT(*) AS num_created
--             FROM Papers p LEFT JOIN Venues v ON p.venue_id = v.venue_id
--             WHERE p.paper_id IN (...) GROUP BY v.venue_id, v.venue_name
--    - Returns per-venue paper count for UI feedback
--
-- 5. Write-heavy Operations
--    - Multiple INSERT statements for Papers and Authorship tables
--    - All writes happen within single transaction boundary
--
-- Implementation (JavaScript/Node.js):
-- ============================================================
--
-- async function batchCreatePapersWithAuthors(req, res) {
--   const { papers } = req.body;
--   
--   let conn;
--   try {
--     conn = await pool.getConnection();
--     
--     // Set isolation level and begin transaction
--     await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
--     await conn.beginTransaction();
--     
--     // ADVANCED QUERY 1: Validate all foreign keys
--     // Validate venues, projects, datasets, authors with IN queries
--     
--     // ADVANCED QUERY 2: Check duplicates with SELECT FOR UPDATE
--     const [duplicates] = await conn.execute(
--       `SELECT p.venue_id, p.paper_title
--        FROM Papers p
--        WHERE (p.venue_id, p.paper_title) IN (...)
--        FOR UPDATE`,
--       params
--     );
--     
--     if (duplicates.length > 0) {
--       await conn.rollback();
--       return res.status(409).json({ error: "Duplicate paper titles" });
--     }
--     
--     // WRITE OPERATIONS: Insert all papers and authorships
--     for (const paper of papers) {
--       const paperId = "P_" + uuidv4();
--       
--       await conn.execute(
--         `INSERT INTO Papers (...) VALUES (...)`,
--         [paperId, ...]
--       );
--       
--       for (const authorId of paper.author_ids) {
--         await conn.execute(
--           `INSERT INTO Authorship (user_id, paper_id) VALUES (?, ?)`,
--           [authorId, paperId]
--         );
--       }
--     }
--     
--     // ADVANCED QUERY 3: Aggregation summary
--     const [summary] = await conn.execute(
--       `SELECT v.venue_name, COUNT(*) AS num_created
--        FROM Papers p LEFT JOIN Venues v ON p.venue_id = v.venue_id
--        WHERE p.paper_id IN (...)
--        GROUP BY v.venue_id, v.venue_name`,
--       createdPaperIds
--     );
--     
--     // Commit transaction
--     await conn.commit();
--     return res.status(201).json({
--       success: true,
--       created_count: createdPaperIds.length,
--       summary: summary
--     });
--     
--   } catch (error) {
--     // Rollback on any error
--     if (conn) await conn.rollback();
--     return res.status(500).json({ error: error.message });
--     
--   } finally {
--     if (conn) conn.release();
--   }
-- }
--
-- ============================================================
-- ACID Properties for TX_BATCH_CREATE_PAPERS_WITH_AUTHORS
-- ============================================================
--
-- Atomicity:
--   - All papers + all authorships created together or none
--   - Single transaction boundary ensures all-or-nothing behavior
--
-- Consistency:
--   - Enforces PK/FK constraints for all foreign keys
--   - Enforces uq_papers_venue_title constraint (no duplicate titles in venue)
--   - Validates all foreign keys before any writes
--
-- Isolation:
--   - READ COMMITTED isolation level prevents dirty reads
--   - SELECT FOR UPDATE provides row-level locking for duplicate prevention
--   - Concurrent transactions cannot insert duplicate (venue, title) pairs
--
-- Durability:
--   - InnoDB storage engine guarantees committed changes persist
--   - All changes durable after COMMIT
--
-- ============================================================
-- Error Handling
-- ============================================================
--
-- TX_BATCH_CREATE_PAPERS_WITH_AUTHORS:
--   - 400: Invalid foreign key (venue_id, project_id, dataset_id, user_id)
--   - 409: Duplicate paper title in same venue
--   - 500: Generic database error
--   - Explicit rollback on any error
--
