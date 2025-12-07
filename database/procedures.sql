-- ============================================================
-- Stored Procedure: sp_author_insights
-- Purpose: Get comprehensive research insights for an author
-- ============================================================

USE research_paper_review_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_author_insights$$

CREATE PROCEDURE sp_author_insights (IN p_user_id VARCHAR(50))
BEGIN
    -- Summary variables
    DECLARE v_total_papers INT DEFAULT 0;
    DECLARE v_total_reviews INT DEFAULT 0;
    DECLARE v_avg_reviews DECIMAL(10,2) DEFAULT 0.00;

    -- Most reviewed paper variables
    DECLARE v_most_paper_id VARCHAR(50);
    DECLARE v_most_paper_title VARCHAR(255);
    DECLARE v_most_review_count INT DEFAULT 0;
    DECLARE v_most_last_review_at DATETIME;

    -- 1) Total papers authored (JOIN Authorship + Papers)
    SELECT COUNT(DISTINCT a.paper_id)
      INTO v_total_papers
    FROM Authorship a
    JOIN Papers p ON p.paper_id = a.paper_id
    WHERE a.user_id = p_user_id;

    -- 2) Total reviews received (JOIN Authorship + Reviews)
    SELECT COUNT(r.review_id)
      INTO v_total_reviews
    FROM Authorship a
    JOIN Reviews r ON r.paper_id = a.paper_id
    WHERE a.user_id = p_user_id;

    -- 3) Compute average reviews per paper (control structure)
    IF v_total_papers > 0 THEN
        SET v_avg_reviews = v_total_reviews / v_total_papers;
    ELSE
        SET v_avg_reviews = 0;
    END IF;

    -- 4) Top reviewed papers for this author (still compute for backwards compatibility)
    --    Advanced query: JOIN + GROUP BY + subquery + ORDER BY + LIMIT
    SELECT
        x.paper_id,
        p.paper_title,
        x.review_count,
        x.last_review_at
    INTO
        v_most_paper_id,
        v_most_paper_title,
        v_most_review_count,
        v_most_last_review_at
    FROM (
        SELECT
            a.paper_id,
            COUNT(r.review_id) AS review_count,
            MAX(r.review_timestamp) AS last_review_at
        FROM Authorship a
        LEFT JOIN Reviews r ON r.paper_id = a.paper_id
        WHERE a.user_id = p_user_id
        GROUP BY a.paper_id
    ) AS x
    JOIN Papers p ON p.paper_id = x.paper_id
    ORDER BY x.review_count DESC, x.last_review_at DESC
    LIMIT 1;

    -- Result set 1: summary metrics
    SELECT
        p_user_id      AS author_id,
        v_total_papers AS total_papers,
        v_total_reviews AS total_reviews,
        v_avg_reviews  AS avg_reviews_per_paper;

    -- Result set 2: top 5 most reviewed papers (with pdf_url)
    SELECT
        p.paper_id,
        p.paper_title,
        p.pdf_url,
        COUNT(r.review_id) AS review_count,
        MAX(r.review_timestamp) AS last_review_at
    FROM Papers p
    JOIN Authorship a ON a.paper_id = p.paper_id
    LEFT JOIN Reviews r ON r.paper_id = p.paper_id
    WHERE a.user_id = p_user_id
    GROUP BY p.paper_id, p.paper_title, p.pdf_url
    ORDER BY review_count DESC, last_review_at DESC
    LIMIT 5;

    -- Result set 3: year-wise publication & review summary
    -- Uses YEAR(upload_timestamp) and aggregates.
    SELECT
        YEAR(p.upload_timestamp) AS year,
        COUNT(DISTINCT p.paper_id) AS papers_published,
        COUNT(r.review_id) AS reviews_received
    FROM Authorship a
    JOIN Papers p ON p.paper_id = a.paper_id
    LEFT JOIN Reviews r ON r.paper_id = p.paper_id
    WHERE a.user_id = p_user_id
      AND p.upload_timestamp IS NOT NULL
    GROUP BY YEAR(p.upload_timestamp)
    ORDER BY year;

    -- Result set 4: status breakdown for authored papers
    SELECT
        p.status,
        COUNT(DISTINCT p.paper_id) AS paper_count
    FROM Authorship a
    JOIN Papers p ON p.paper_id = a.paper_id
    WHERE a.user_id = p_user_id
    GROUP BY p.status;
END$$

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_author_portfolio_with_coauthors $$

CREATE PROCEDURE sp_author_portfolio_with_coauthors (
    IN p_author_id VARCHAR(50)
)
BEGIN
    /*
      Returns one row per paper authored by p_author_id, with:
        - paper_id, paper_title, upload_timestamp
        - project_title (if any)
        - review_count (total reviews for that paper)
        - coauthor_count (number of co-authors excluding this author)
        - coauthors (comma-separated list of co-author names)
    */
    SELECT
        p.paper_id,
        p.paper_title,
        p.pdf_url,
        p.upload_timestamp,
        proj.project_id,
        proj.project_title,
        -- total reviews per paper (pre-aggregated in a subquery)
        COALESCE(r.review_count, 0) AS review_count,
        -- number of co-authors (excluding the logged-in author)
        COUNT(DISTINCT co_auth.user_id) AS coauthor_count,
        -- human-readable co-author list
        COALESCE(
            GROUP_CONCAT(
                DISTINCT co_user.user_name
                ORDER BY co_user.user_name
                SEPARATOR ', '
            ),
            'No co-authors'
        ) AS coauthors
    FROM Authorship AS a_self
    JOIN Papers AS p
        ON p.paper_id = a_self.paper_id
    -- optional project info
    LEFT JOIN Projects AS proj
        ON proj.project_id = p.project_id
    -- pre-aggregated review counts (advanced subquery)
    LEFT JOIN (
        SELECT
            paper_id,
            COUNT(*) AS review_count
        FROM Reviews
        GROUP BY paper_id
    ) AS r
        ON r.paper_id = p.paper_id
    -- co-author links (same paper, different user)
    LEFT JOIN Authorship AS co_auth
        ON co_auth.paper_id = p.paper_id
       AND co_auth.user_id <> a_self.user_id
    -- co-author names
    LEFT JOIN Users AS co_user
        ON co_user.user_id = co_auth.user_id
    WHERE a_self.user_id = p_author_id
    GROUP BY
        p.paper_id,
        p.paper_title,
        p.pdf_url,
        p.upload_timestamp,
        proj.project_id,
        proj.project_title,
        r.review_count
    ORDER BY
        p.upload_timestamp DESC,
        p.paper_title;
END$$

DELIMITER ;

