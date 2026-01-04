-- ============================================================
-- PaperScope Database Schema
-- Matches the existing master_setup.sql schema exactly
-- ============================================================

CREATE DATABASE IF NOT EXISTS research_paper_review_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE research_paper_review_db;

-- ============================================================
-- CREATE TABLES (DDL)
-- ============================================================

CREATE TABLE IF NOT EXISTS Users (
    user_id       VARCHAR(10) PRIMARY KEY,
    user_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    affiliation   VARCHAR(150),
    profile_url   VARCHAR(255),
    is_reviewer   VARCHAR(1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Venues (
    venue_id   VARCHAR(10) PRIMARY KEY,
    venue_name VARCHAR(150) NOT NULL,
    venue_type VARCHAR(50),
    publisher  VARCHAR(100),
    year       INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Datasets (
    dataset_id   VARCHAR(10) PRIMARY KEY,
    dataset_name VARCHAR(200) NOT NULL,
    dataset_url  VARCHAR(255),
    domain       VARCHAR(100),
    access_type  VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Projects (
    project_id   VARCHAR(10) PRIMARY KEY,
    project_title VARCHAR(200) NOT NULL,
    description  TEXT,
    project_date DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Papers (
    paper_id     VARCHAR(10) PRIMARY KEY,
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
        FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE SET NULL,
    INDEX idx_paper_id (paper_id),
    INDEX idx_status (status),
    INDEX idx_venue_id (venue_id),
    INDEX idx_project_id (project_id),
    INDEX idx_upload_timestamp (upload_timestamp),
    FULLTEXT INDEX idx_title_abstract (paper_title, abstract)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Authorship (
    user_id   VARCHAR(10) NOT NULL,
    paper_id  VARCHAR(10) NOT NULL,
    PRIMARY KEY (user_id, paper_id),
    CONSTRAINT fk_authorship_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_authorship_paper
        FOREIGN KEY (paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_paper_id (paper_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Reviews (
    review_id          VARCHAR(10) PRIMARY KEY,
    user_id            VARCHAR(10) NOT NULL,
    paper_id           VARCHAR(10) NOT NULL,
    comment            TEXT NOT NULL,
    review_timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_paper
        FOREIGN KEY (paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    INDEX idx_review_id (review_id),
    INDEX idx_paper_id (paper_id),
    INDEX idx_user_id (user_id),
    INDEX idx_review_timestamp (review_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS RelatedPapers (
    paper_id          VARCHAR(10) NOT NULL,
    related_paper_id  VARCHAR(10) NOT NULL,
    PRIMARY KEY (paper_id, related_paper_id),
    CONSTRAINT fk_related_main
        FOREIGN KEY (paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    CONSTRAINT fk_related_secondary
        FOREIGN KEY (related_paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_relation CHECK (paper_id <> related_paper_id),
    INDEX idx_paper_id (paper_id),
    INDEX idx_related_paper_id (related_paper_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
