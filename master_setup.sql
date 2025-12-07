-- ============================================================
-- MASTER SETUP SCRIPT
-- Complete database setup: DDL, Data Inserts, and Queries
-- ============================================================

-- ============================================================
-- PART 1: DROP AND CREATE DATABASE
-- ============================================================

DROP DATABASE IF EXISTS research_paper_review_db;
CREATE DATABASE research_paper_review_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE research_paper_review_db;

-- ============================================================
-- PART 2: CREATE TABLES (DDL without AUTO_INCREMENT)
-- ============================================================

CREATE TABLE Users (
    user_id       VARCHAR(10) PRIMARY KEY,
    user_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    affiliation   VARCHAR(150),
    profile_url   VARCHAR(255),
    is_reviewer   VARCHAR(1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Venues (
    venue_id   VARCHAR(10) PRIMARY KEY,
    venue_name VARCHAR(150) NOT NULL,
    venue_type VARCHAR(50),
    publisher  VARCHAR(100),
    year       INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Datasets (
    dataset_id   VARCHAR(10) PRIMARY KEY,
    dataset_name VARCHAR(200) NOT NULL,
    dataset_url  VARCHAR(255),
    domain       VARCHAR(100),
    access_type  VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Projects (
    project_id   VARCHAR(10) PRIMARY KEY,
    project_title VARCHAR(200) NOT NULL,
    description  TEXT,
    project_date DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Papers (
    paper_id     VARCHAR(50) PRIMARY KEY,
    paper_title  VARCHAR(255) NOT NULL,
    abstract     TEXT,
    pdf_url      VARCHAR(255),
    upload_timestamp DATETIME,
    status       VARCHAR(50),
    venue_id     VARCHAR(10),
    dataset_id   VARCHAR(10),
    project_id   VARCHAR(10),
    CONSTRAINT fk_papers_venue
        FOREIGN KEY (venue_id) REFERENCES Venues(venue_id) ON DELETE SET NULL,
    CONSTRAINT fk_papers_dataset
        FOREIGN KEY (dataset_id) REFERENCES Datasets(dataset_id) ON DELETE SET NULL,
    CONSTRAINT fk_papers_project
        FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Authorship (
    user_id   VARCHAR(10) NOT NULL,
    paper_id  VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, paper_id),
    CONSTRAINT fk_authorship_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_authorship_paper
        FOREIGN KEY (paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Reviews (
    review_id          VARCHAR(50) PRIMARY KEY,
    user_id            VARCHAR(10) NOT NULL,
    paper_id           VARCHAR(50) NOT NULL,
    comment            TEXT NOT NULL,
    review_timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_paper
        FOREIGN KEY (paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE RelatedPapers (
    paper_id          VARCHAR(50) NOT NULL,
    related_paper_id  VARCHAR(50) NOT NULL,
    PRIMARY KEY (paper_id, related_paper_id),
    CONSTRAINT fk_related_main
        FOREIGN KEY (paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    CONSTRAINT fk_related_secondary
        FOREIGN KEY (related_paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_relation CHECK (paper_id <> related_paper_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PART 3: INSERT INITIAL DATA
-- ============================================================

INSERT INTO Venues (venue_id, venue_name, venue_type, publisher, year) VALUES
('V001', 'ICDE', 'Conference', 'IEEE', 2023),
('V002', 'VLDB', 'Conference', 'VLDB Endowment', 2024),
('V003', 'SIGMOD', 'Conference', 'ACM', 2025),
('V004', 'CIDR', 'Conference', 'CIDR', 2024),
('V005', 'ICDE Workshops', 'Workshop', 'IEEE', 2025),
('V006', 'PVLDB', 'Journal', 'VLDB Endowment', 2025);

INSERT INTO Users (user_id, user_name, email, password, affiliation, profile_url, is_reviewer) VALUES
('U001', 'Ada Lovelace', 'ada@cs411.edu', 'Ada@123', 'UIUC', 'https://ex/ada', '1'),
('U002', 'Edsger Dijkstra', 'edsger@cs411.edu', 'Edsger@123', 'UIUC', 'https://ex/edsger', '0'),
('U003', 'Grace Hopper', 'grace@cs411.edu', 'Grace@123', 'UIUC', 'https://ex/grace', '1'),
('U004', 'Donald Knuth', 'knuth@cs411.edu', 'Knuth@123', 'UIUC', 'https://ex/knuth', '1'),
('U005', 'Barbara Liskov', 'liskov@cs411.edu', 'Liskov@123', 'UIUC', 'https://ex/liskov', '1'),
('U006', 'Ken Thompson', 'ken@cs411.edu', 'Ken@123', 'UIUC', 'https://ex/ken', '0'),
('U007', 'Linus Torvalds', 'linus@cs411.edu', 'Linus@123', 'UIUC', 'https://ex/linus', '0'),
('U008', 'Margaret Hamilton', 'margaret@cs411.edu', 'Margaret@123', 'UIUC', 'https://ex/mh', '1'),
('U009', 'John McCarthy', 'jm@cs411.edu', 'McCarthy@123', 'UIUC', 'https://ex/jm', '0'),
('U010', 'Tim Berners-Lee', 'tbl@cs411.edu', 'Tim@123', 'UIUC', 'https://ex/tbl', '1');

INSERT INTO Datasets (dataset_id, dataset_name, dataset_url, domain, access_type) VALUES
('D001', 'TPC-H', 'https://tpc.org/tpch/', 'OLAP', 'public'),
('D002', 'IMDb Sample', 'https://imdb.com/data', 'media', 'restricted'),
('D003', 'StackOverflow Snippets', 'https://archive.org/stack/', 'text', 'public'),
('D004', 'TPC-DS', 'https://tpc.org/tpcds/', 'OLAP', 'public'),
('D005', 'Synthetic Logs', 'https://example.org/logs', 'systems', 'public');

INSERT INTO Projects (project_id, project_title, description, project_date) VALUES
('PR001', 'Join Optimization', 'Cost-based join order and hints', '2024-09-01'),
('PR002', 'Index Structures', 'Learned vs. B+Tree tradeoffs', '2025-01-15'),
('PR003', 'Adaptive Query Plans', 'Runtime re-optimization', '2025-02-10'),
('PR004', 'Cardinality Estimation', 'Hybrid ML + rules', '2024-11-05'),
('PR005', 'Storage Layouts', 'Row vs column vs hybrid', '2025-03-20');

INSERT INTO Papers (paper_id, paper_title, abstract, pdf_url, upload_timestamp, status, venue_id, project_id, dataset_id) VALUES
('P001', 'Efficient Joins in Practice', 'We study join orders...', '/pdfs/p001.pdf', '2024-10-12 09:00:00', 'Published', 'V001', 'PR001', 'D001'),
('P002', 'Learned Indexes Revisited', 'Comparison with B+Trees...', '/pdfs/p002.pdf', '2025-01-03 12:30:00', 'Under Review', 'V002', 'PR002', 'D002'),
('P003', 'Adaptive Query Plans', 'Runtime re-optimization', '/pdfs/p003.pdf', '2025-02-10 15:12:00', 'Draft', 'V002', 'PR003', 'D001'),
('P004', 'Hybrid CE with ML', 'Rules + ML for cardinality', '/pdfs/p004.pdf', '2024-11-07 10:05:00', 'Published', 'V003', 'PR004', 'D003'),
('P005', 'Vectorized Execution', 'SIMD-aware operators', '/pdfs/p005.pdf', '2025-03-01 08:00:00', 'Under Review', 'V003', 'PR001', 'D004'),
('P006', 'Storage Layout Showdown', 'Row vs column vs PAX', '/pdfs/p006.pdf', '2025-03-20 13:45:00', 'Draft', 'V004', 'PR005', 'D004'),
('P007', 'Join Hints Benchmark', 'Pragmatic optimizer hints', '/pdfs/p007.pdf', '2024-12-21 17:22:00', 'Published', 'V001', 'PR001', 'D001'),
('P008', 'Log-Structured Systems', 'Write-optimized pipelines', '/pdfs/p008.pdf', '2025-04-02 11:11:00', 'Under Review', 'V005', 'PR005', 'D005'),
('P009', 'CE on Text Data', 'Estimating text-centric schemas', '/pdfs/p009.pdf', '2025-02-25 09:40:00', 'Under Review', 'V006', 'PR004', 'D003'),
('P010', 'Branchless Hash Join', 'Micro-architectural tweaks', '/pdfs/p010.pdf', '2025-03-15 14:25:00', 'Draft', 'V003', 'PR001', 'D004'),
('P011', 'Page Cache Modeling', 'Hot/cold separation', '/pdfs/p011.pdf', '2025-01-25 10:10:00', 'Published', 'V004', 'PR005', 'D005'),
('P012', 'Learned Bloom Filters', 'Reducing false positives', '/pdfs/p012.pdf', '2025-04-10 16:00:00', 'Under Review', 'V002', 'PR002', 'D002');

INSERT INTO RelatedPapers (paper_id, related_paper_id) VALUES
('P001', 'P002'),
('P012', 'P002'),
('P002', 'P003'),
('P004', 'P009'),
('P005', 'P010'),
('P006', 'P011');

INSERT INTO Reviews (review_id, user_id, paper_id, comment, review_timestamp) VALUES
('R001', 'U001', 'P001', 'Solid experimental design', '2025-02-01 10:00:00'),
('R002', 'U003', 'P001', 'Consider larger TPC-H scale', '2025-02-02 11:45:00'),
('R003', 'U005', 'P002', 'Stronger B+Tree baseline pls', '2025-02-05 09:20:00'),
('R004', 'U004', 'P002', 'Great literature coverage', '2025-02-06 18:00:00'),
('R005', 'U008', 'P003', 'Clarify re-optimization trigger', '2025-02-12 08:05:00'),
('R006', 'U001', 'P004', 'Like the hybrid CE idea', '2024-11-10 15:30:00'),
('R007', 'U003', 'P004', 'Add ablations for rules vs ML', '2024-11-11 09:00:00'),
('R008', 'U005', 'P005', 'Report SIMD counters', '2025-03-05 12:00:00'),
('R009', 'U008', 'P006', 'Nice PAX baseline', '2025-03-22 10:10:00'),
('R010', 'U004', 'P007', 'Realistic workload mix', '2024-12-22 13:13:00'),
('R011', 'U001', 'P008', 'Consider LSM compaction costs', '2025-04-03 17:50:00'),
('R012', 'U010', 'P009', 'Interesting on text schemas', '2025-03-01 09:15:00'),
('R013', 'U003', 'P010', 'Perf counters section needed', '2025-03-16 08:40:00'),
('R014', 'U005', 'P011', 'Great hot/cold stratification', '2025-01-27 14:44:00'),
('R015', 'U008', 'P011', 'Compare with CLOCK-Pro', '2025-01-28 16:10:00'),
('R016', 'U004', 'P012', 'Add learned BF theory details', '2025-04-12 12:05:00'),
('R017', 'U010', 'P012', 'Check false positive drift', '2025-04-13 09:09:00'),
('R018', 'U001', 'P009', 'Neat CE on unstructured text', '2025-03-02 10:20:00');

INSERT INTO Authorship (user_id, paper_id) VALUES
('U001', 'P001'),
('U001', 'P003'),
('U001', 'P005'),
('U001', 'P010'),
('U002', 'P001'),
('U002', 'P007'),
('U003', 'P002'),
('U003', 'P004'),
('U003', 'P012'),
('U004', 'P004'),
('U004', 'P012'),
('U005', 'P003'),
('U005', 'P006'),
('U005', 'P008'),
('U006', 'P005'),
('U007', 'P008'),
('U008', 'P006'),
('U008', 'P009'),
('U009', 'P010'),
('U010', 'P011');

-- ============================================================
-- PART 4: INSERT ADDITIONAL TEST DATA (if missing)
-- ============================================================

START TRANSACTION;

INSERT IGNORE INTO Papers (paper_id, paper_title, abstract, pdf_url, upload_timestamp, status, venue_id, dataset_id, project_id) VALUES
('P013', 'Distributed Query Optimization', 'Novel approaches to distributed query planning', '/pdfs/p013.pdf', '2025-04-15 10:00:00', 'Under Review', 'V001', 'D001', 'PR001'),
('P014', 'Graph Database Indexing', 'Efficient indexing strategies for graph databases', '/pdfs/p014.pdf', '2025-04-18 14:30:00', 'Under Review', 'V003', 'D002', 'PR002'),
('P015', 'Real-time Analytics Processing', 'Streaming data processing techniques', '/pdfs/p015.pdf', '2025-04-20 09:15:00', 'Under Review', 'V002', 'D003', 'PR003'),
('P016', 'Memory-Efficient Join Algorithms', 'Optimizing joins for memory-constrained systems', '/pdfs/p016.pdf', '2025-04-22 11:45:00', 'Under Review', 'V004', 'D004', 'PR004'),
('P017', 'Query Result Caching Strategies', 'Intelligent caching for repeated queries', '/pdfs/p017.pdf', '2025-04-25 16:20:00', 'Under Review', 'V005', 'D005', 'PR005');

INSERT IGNORE INTO Authorship (user_id, paper_id) VALUES
('U001', 'P013'),
('U001', 'P014'),
('U001', 'P005'),
('U002', 'P015'),
('U002', 'P016'),
('U006', 'P017'),
('U006', 'P013'),
('U007', 'P014'),
('U009', 'P015'),
('U009', 'P016');

UPDATE Papers SET status = 'Under Review' WHERE paper_title = 'Adaptive Query Plans';
UPDATE Papers SET status = 'Under Review' WHERE paper_title = 'Branchless Hash Join';

INSERT IGNORE INTO Reviews (review_id, user_id, paper_id, comment, review_timestamp) VALUES
('R019', 'U003', 'P013', 'Interesting distributed approach, needs more evaluation', '2025-04-16 10:30:00'),
('R020', 'U004', 'P013', 'Good theoretical foundation', '2025-04-17 14:00:00'),
('R021', 'U005', 'P014', 'Graph indexing is well-explored, add novelty', '2025-04-19 09:45:00'),
('R022', 'U008', 'P014', 'Solid experimental setup', '2025-04-20 11:20:00'),
('R023', 'U001', 'P015', 'Real-time processing needs latency metrics', '2025-04-21 08:15:00'),
('R024', 'U010', 'P015', 'Streaming techniques are relevant', '2025-04-22 16:30:00'),
('R025', 'U003', 'P016', 'Memory constraints well addressed', '2025-04-23 10:00:00'),
('R026', 'U004', 'P017', 'Caching strategies need comparison with existing work', '2025-04-26 13:45:00');

COMMIT;

-- ============================================================
-- PART 5: EXECUTE QUERIES
-- ============================================================

-- Query 1: Get papers authored by user that are under review
-- Example: SET @user_id = 'U001';
SET @user_id = 'U001';

SELECT
    p.paper_id,
    p.paper_title,
    p.abstract,
    p.pdf_url,
    p.upload_timestamp,
    p.status,
    v.venue_name,
    v.year,
    COUNT(r.review_id) AS review_count,
    MAX(r.review_timestamp) AS last_review_at
FROM Authorship a
INNER JOIN Papers p ON a.paper_id = p.paper_id
LEFT JOIN Venues v ON v.venue_id = p.venue_id
LEFT JOIN Reviews r ON p.paper_id = r.paper_id
WHERE a.user_id = @user_id 
    AND p.status = 'Under Review'
GROUP BY p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status, v.venue_name, v.year
ORDER BY p.upload_timestamp DESC;

-- Query 2: Get papers assigned to user for review
-- Example: SET @user_id = 'U003';
SET @user_id = 'U003';

SELECT DISTINCT
    p.paper_id,
    p.paper_title,
    p.abstract,
    p.pdf_url,
    p.upload_timestamp,
    p.status,
    v.venue_name,
    v.year,
    COUNT(DISTINCT r.review_id) AS review_count,
    MAX(r.review_timestamp) AS last_review_at,
    CASE WHEN EXISTS (
        SELECT 1 FROM Reviews rev 
        WHERE rev.paper_id = p.paper_id AND rev.user_id = @user_id
    ) THEN 1 ELSE 0 END AS has_reviewed
FROM Papers p
LEFT JOIN Venues v ON v.venue_id = p.venue_id
LEFT JOIN Reviews r ON p.paper_id = r.paper_id
WHERE p.status = 'Under Review'
    AND p.paper_id NOT IN (
        SELECT a.paper_id FROM Authorship a WHERE a.user_id = @user_id
    )
GROUP BY p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status, v.venue_name, v.year
ORDER BY p.upload_timestamp DESC;

-- ============================================================
-- PART 6: APPLY CONSTRAINTS, PROCEDURES, AND TRIGGERS
-- ============================================================

SOURCE database/constraints.sql;
SOURCE database/procedures.sql;
SOURCE database/triggers.sql;
