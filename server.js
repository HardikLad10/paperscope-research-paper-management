import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---- MySQL pool (raw SQL) ----
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL configuration for GCP Cloud SQL (only for remote connections)
  ...(process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1' ? {
    ssl: {
      rejectUnauthorized: false,
    }
  } : {}),
});

// Vertex AI Configuration for GCP
const VERTEX_AI_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION || 'us-central1',
  model: process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash', // Try gemini-1.5-flash as default
};

// Check if Vertex AI is configured
const isVertexAIConfigured = () => {
  return !!VERTEX_AI_CONFIG.projectId;
};

// Health
app.get("/api/health", async (_req, res) => {
  try {
    const [r] = await pool.query("SELECT 1 AS ok");
    return res.json({ ok: r[0]?.ok === 1 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

/**
 * Q1 — Latest papers with venue (optional filters)
 * Global search endpoint - returns all papers, not filtered by user
 * GET /api/papers?q=keyword&venue_id=V001&status=Under Review&page=1&limit=50
 */
app.get("/api/papers", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const venue_id = String(req.query.venue_id || "").trim();
  const status = String(req.query.status || "").trim();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  
  try {
    // Build WHERE conditions dynamically
    const whereConditions = [];
    const params = [];

    // Search filter (q parameter)
    if (q) {
      const like = `%${q}%`;
      whereConditions.push("(p.paper_title LIKE ? OR p.abstract LIKE ?)");
      params.push(like, like);
    }

    // Venue filter
    if (venue_id) {
      whereConditions.push("p.venue_id = ?");
      params.push(venue_id);
    }

    // Status filter
    if (status) {
      whereConditions.push("p.status = ?");
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? "WHERE " + whereConditions.join(" AND ")
      : "";

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.paper_id) AS total
      FROM Papers p
    `;
    if (whereClause) {
      countQuery += whereClause;
    }
    
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0]?.total || 0;

    // Get paginated results
    let dataQuery = `
      SELECT
        p.paper_id,
        p.paper_title,
        p.abstract,
        p.pdf_url,
        p.upload_timestamp,
        p.status,
        v.venue_name,
        v.year,
        COUNT(r.review_id) AS review_count
      FROM Papers p
      LEFT JOIN Venues v ON v.venue_id = p.venue_id
      LEFT JOIN Reviews r ON r.paper_id = p.paper_id
    `;
    if (whereClause) {
      dataQuery += whereClause;
    }
    dataQuery += `
      GROUP BY p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status, v.venue_name, v.year
      ORDER BY p.upload_timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const [rows] = await pool.execute(dataQuery, params);

    return res.json({
      papers: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error("Error in /api/papers:", e);
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Q2 — Paper detail WITH review stats
 * (a) total reviews  (b) most recent review timestamp
 * GET /api/papers/:paper_id
 */
app.get("/api/papers/:paper_id", async (req, res) => {
  const { paper_id } = req.params;
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status,
        v.venue_name, v.year,
        COUNT(r.review_id) AS review_count,
        MAX(r.review_timestamp) AS last_review_at
      FROM Papers p
      LEFT JOIN Venues v ON v.venue_id = p.venue_id
      LEFT JOIN Reviews r ON r.paper_id = p.paper_id
      WHERE p.paper_id = ?
      GROUP BY p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status, v.venue_name, v.year
      `,
      [paper_id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get all venues
 * GET /api/venues
 */
app.get("/api/venues", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT venue_id, venue_name, venue_type, publisher, year FROM Venues ORDER BY venue_name, year DESC"
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Q3 — Recent venue activity: count of PUBLISHED papers per venue since a year
 * GET /api/venues/recent?sinceYear=2018
 */
app.get("/api/venues/recent", async (req, res) => {
  const sinceYear = Number(req.query.sinceYear || 2018);
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        v.venue_id, v.venue_name, v.year,
        COUNT(p.paper_id) AS total_papers
      FROM Venues v
      JOIN Papers p ON p.venue_id = v.venue_id
      WHERE v.year >= ? AND p.status IN ('Published')
      GROUP BY v.venue_id, v.venue_name, v.year
      ORDER BY v.year DESC, total_papers DESC
      LIMIT 25
      `,
      [sinceYear]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Q4 — Author portfolio: papers for a user with co-author information
 * GET /api/authors/:user_id/portfolio?since=2018-01-01
 * 
 * Uses stored procedure sp_author_portfolio_with_coauthors which returns:
 * - paper_id, paper_title, upload_timestamp
 * - project_title
 * - review_count
 * - coauthor_count
 * - coauthors (comma-separated list)
 */
app.get("/api/authors/:user_id/portfolio", async (req, res) => {
  const { user_id } = req.params;
  const since = String(req.query.since || "2018-01-01");
  
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Call stored procedure
    const [resultSets] = await conn.query(
      'CALL sp_author_portfolio_with_coauthors(?)',
      [user_id]
    );
    
    // MySQL returns an array of result sets
    const portfolio = Array.isArray(resultSets[0]) ? resultSets[0] : [];
    
    // Filter by since date if provided (client-side filter for now)
    // Note: The procedure doesn't filter by date, so we filter in JS
    const filtered = portfolio.filter(paper => {
      if (!paper.upload_timestamp) return true;
      return new Date(paper.upload_timestamp) >= new Date(since);
    });
    
    return res.json(filtered);
  } catch (e) {
    console.error("Error in /api/authors/:user_id/portfolio:", e);
    return res.status(500).json({ error: String(e) });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * Author Insights — backed by stored procedure sp_author_insights
 * GET /api/authors/:user_id/insights
 *
 * Returns a JSON object with:
 * {
 *   summary: { ... },
 *   most_reviewed_paper: { ... },
 *   yearly_stats: [ ... ],
 *   status_breakdown: [ ... ]
 * }
 */
app.get("/api/authors/:user_id/insights", async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // CALL the stored procedure that we already created in MySQL
    const [resultSets] = await conn.query("CALL sp_author_insights(?)", [user_id]);

    // MySQL returns an array of result sets. For this procedure:
    // resultSets[0] -> summary (1 row)
    // resultSets[1] -> top 5 reviewed papers (0-5 rows, with pdf_url)
    // resultSets[2] -> yearly stats (0+ rows)
    // resultSets[3] -> status breakdown (0+ rows)
    const summaryRows = Array.isArray(resultSets[0]) ? resultSets[0] : [];
    const topPapersRows = Array.isArray(resultSets[1]) ? resultSets[1] : [];
    const yearlyRows = Array.isArray(resultSets[2]) ? resultSets[2] : [];
    const statusRows = Array.isArray(resultSets[3]) ? resultSets[3] : [];

    const summary = summaryRows[0] || null;

    return res.json({
      author_id: user_id,
      summary,
      top_reviewed_papers: topPapersRows,
      yearly_stats: yearlyRows,
      status_breakdown: statusRows,
    });
  } catch (e) {
    console.error("Error in /api/authors/:user_id/insights:", e);
    return res.status(500).json({ error: "Failed to load author insights" });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * Q5 — Top reviewers in a window (rank by number of reviews)
 * GET /api/reviewers/top?from=2024-02-15&to=2024-05-15
 */
app.get("/api/reviewers/top", async (req, res) => {
  const from = String(req.query.from || "2024-01-01");
  const to   = String(req.query.to   || "2025-12-31");
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        u.user_id, u.user_name, u.affiliation,
        COUNT(r.review_id) AS total_reviews
      FROM Users u
      JOIN Reviews r ON r.user_id = u.user_id
      WHERE r.review_timestamp BETWEEN ? AND ?
      GROUP BY u.user_id, u.user_name, u.affiliation
      HAVING COUNT(r.review_id) > 0
      ORDER BY total_reviews DESC, u.user_name ASC
      LIMIT 25
      `,
      [from + " 00:00:00", to + " 23:59:59"]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get all reviewers for review form dropdown
 * GET /api/reviewers
 */
app.get("/api/reviewers", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        user_id,
        user_name,
        affiliation
      FROM Users
      WHERE is_reviewer = 1
      ORDER BY user_name
      `
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get all reviews for a specific paper
 * GET /api/papers/:paper_id/reviews
 */
app.get("/api/papers/:paper_id/reviews", async (req, res) => {
  const { paper_id } = req.params;
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        r.review_id,
        r.user_id,
        u.user_name,
        u.affiliation,
        r.comment,
        r.review_timestamp
      FROM Reviews r
      JOIN Users u ON u.user_id = r.user_id
      WHERE r.paper_id = ?
      ORDER BY r.review_timestamp DESC
      `,
      [paper_id]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Submit a new review for a paper
 * POST /api/papers/:paper_id/reviews
 * Body: { user_id, comment }
 */
app.post("/api/papers/:paper_id/reviews", async (req, res) => {
  const { paper_id } = req.params;
  const { user_id, comment } = req.body;

  if (!user_id || !comment || !comment.trim()) {
    return res.status(400).json({ error: "user_id and comment are required" });
  }

  try {
    const reviewId = "R_" + uuidv4();

    await pool.execute(
      `INSERT INTO Reviews (review_id, user_id, paper_id, comment, review_timestamp)
       VALUES (?, ?, ?, ?, NOW())`,
      [reviewId, user_id, paper_id, comment.trim()]
    );

    return res.status(201).json({ ok: true, review_id: reviewId });
  } catch (err) {
    console.error("Error in POST /api/papers/:paper_id/reviews:", err);
    
    // If trigger blocks this (e.g., author reviewing own paper)
    if (err.code === "ER_SIGNAL_EXCEPTION" || err.message.includes("own paper")) {
      return res.status(400).json({ error: "Authors cannot review their own paper" });
    }
    
    // Foreign key violation (invalid user_id or paper_id)
    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
      return res.status(400).json({ error: "Invalid user_id or paper_id" });
    }

    return res.status(400).json({ error: err.message || "Failed to submit review" });
  }
});

/**
 * R1 — Get reviewable papers (papers NOT authored by current user, NOT already reviewed)
 * GET /api/reviewable-papers?user_id=U001&venue_id=V001&q=keyword
 * 
 * Returns only papers the reviewer CAN review:
 * - Status is ALWAYS 'Under Review' (locked, not filterable)
 * - Excludes papers where user is an author
 * - Excludes papers the user has already reviewed
 * - Optional filters: venue_id, q (search keyword)
 */
app.get("/api/reviewable-papers", async (req, res) => {
  const user_id = String(req.query.user_id || "");
  const venue_id = String(req.query.venue_id || "").trim();
  const q = String(req.query.q || "").trim();

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    // Build WHERE conditions
    const whereConditions = [
      "p.status = 'Under Review'",  // Always enforce Under Review status
      "NOT EXISTS (SELECT 1 FROM Authorship a WHERE a.paper_id = p.paper_id AND a.user_id = ?)",
      "NOT EXISTS (SELECT 1 FROM Reviews rr WHERE rr.paper_id = p.paper_id AND rr.user_id = ?)"
    ];
    const params = [user_id, user_id];

    // Optional venue filter
    if (venue_id) {
      whereConditions.push("p.venue_id = ?");
      params.push(venue_id);
    }

    // Optional search filter
    if (q) {
      const like = `%${q}%`;
      whereConditions.push("(p.paper_title LIKE ? OR p.abstract LIKE ?)");
      params.push(like, like);
    }

    const whereClause = whereConditions.join(" AND ");

    const [rows] = await pool.execute(
      `
      SELECT
        p.paper_id,
        p.paper_title,
        p.pdf_url,
        v.venue_name,
        p.status,
        COUNT(r.review_id) AS review_count
      FROM Papers p
      JOIN Venues v ON v.venue_id = p.venue_id
      LEFT JOIN Reviews r ON r.paper_id = p.paper_id
      WHERE ${whereClause}
      GROUP BY
        p.paper_id, p.paper_title, p.pdf_url, v.venue_name, p.status
      ORDER BY p.upload_timestamp DESC
      `,
      params
    );

    return res.json(rows);
  } catch (e) {
    console.error("Error in /api/reviewable-papers:", e);
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Advanced Query 1 — User papers by year (for frontend compatibility)
 * GET /api/advanced/query1?year=2024&user_id=U005
 * Matches frontend Query 1 interface
 */
app.get("/api/advanced/query1", async (req, res) => {
  const year = String(req.query.year || "2024");
  const user_id = String(req.query.user_id || "");
  
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const yearStart = `${year}-01-01 00:00:00`;

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        p.paper_id,
        p.paper_title,
        p.upload_timestamp,
        p.status,
        COUNT(r.review_id) as review_count
      FROM Authorship a
      INNER JOIN Papers p ON a.paper_id = p.paper_id
      LEFT JOIN Reviews r ON p.paper_id = r.paper_id
      WHERE a.user_id = ? 
        AND p.upload_timestamp >= ?
        AND p.project_id IS NOT NULL
      GROUP BY p.paper_id, p.paper_title, p.upload_timestamp, p.status
      ORDER BY p.upload_timestamp DESC, review_count DESC
      LIMIT 15
      `,
      [user_id, yearStart]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Advanced Query 2 — Venues by year (for frontend compatibility)
 * GET /api/advanced/query2?year=2020
 */
app.get("/api/advanced/query2", async (req, res) => {
  const year = Number(req.query.year || 2020);
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        v.venue_id,
        v.venue_name,
        v.venue_type,
        v.publisher,
        v.year,
        COUNT(p.paper_id) as total_papers
      FROM Venues v
      INNER JOIN Papers p ON v.venue_id = p.venue_id
      WHERE v.year >= ? AND p.status = 'Published'
      GROUP BY v.venue_id, v.venue_name, v.venue_type, v.publisher, v.year
      ORDER BY v.year DESC, total_papers DESC
      LIMIT 15
      `,
      [year]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Advanced Query 3 — Top reviewers (for frontend compatibility)
 * GET /api/advanced/query3?start_date=2024-02-15&end_date=2024-05-15
 */
app.get("/api/advanced/query3", async (req, res) => {
  const start_date = String(req.query.start_date || "2024-01-01");
  const end_date = String(req.query.end_date || "2025-12-31");
  const startDateTime = `${start_date} 00:00:00`;
  const endDateTime = `${end_date} 23:59:59`;

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        u.user_id,
        u.user_name,
        u.affiliation,
        COUNT(r.review_id) as total_reviews_received,
        COUNT(DISTINCT a.paper_id) as papers_reviewed
      FROM Reviews r
      INNER JOIN Authorship a ON r.paper_id = a.paper_id
      INNER JOIN Users u ON a.user_id = u.user_id
      WHERE r.review_timestamp BETWEEN ? AND ?
        AND u.is_reviewer = true
      GROUP BY u.user_id, u.user_name, u.affiliation
      HAVING COUNT(r.review_id) > 0
      ORDER BY total_reviews_received DESC
      LIMIT 15
      `,
      [startDateTime, endDateTime]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Advanced Query 4 — User paper reviews (for frontend compatibility)
 * GET /api/advanced/query4?user_id=U010
 */
app.get("/api/advanced/query4", async (req, res) => {
  const user_id = String(req.query.user_id || "");
  
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        p.paper_id,
        p.paper_title,
        p.upload_timestamp,
        p.status,
        COUNT(r.review_id) as review_count,
        MAX(r.review_timestamp) as last_review_at
      FROM Authorship a
      INNER JOIN Papers p ON a.paper_id = p.paper_id
      LEFT JOIN Reviews r ON p.paper_id = r.paper_id
      WHERE a.user_id = ?
      GROUP BY p.paper_id, p.paper_title, p.upload_timestamp, p.status
      ORDER BY review_count DESC, last_review_at DESC
      LIMIT 15
      `,
      [user_id]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Login — User authentication
 * POST /api/auth/login
 * Body: { username, password }
 * Uses user_id as username and validates password
 */
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Query Users table - use user_id as username and validate password
    const [rows] = await pool.execute(
      `
      SELECT 
        user_id,
        user_id as username,
        user_name,
        email,
        affiliation,
        is_reviewer
      FROM Users
      WHERE user_id = ? AND password = ?
      LIMIT 1
      `,
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];
    return res.json({
      token: "authenticated",
      user: {
        user_id: user.user_id,
        username: user.user_id,
        user_name: user.user_name,
        email: user.email,
        affiliation: user.affiliation,
        is_reviewer: user.is_reviewer
      }
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * TX_CREATE_PAPER_WITH_AUTHORS — Create paper with authors (Transaction, lean version)
 * POST /api/papers/with-authors
 * Body: { paper_title, abstract, pdf_url, status, venue_id, project_id, dataset_id, author_ids }
 */
app.post("/api/papers/with-authors", async (req, res) => {
  const {
    paper_title,
    abstract,
    pdf_url,
    status,
    venue_id,
    project_id,
    dataset_id,
    author_ids, // array: first is primary author
  } = req.body;

  // Basic request validation only
  if (!paper_title || !pdf_url || !venue_id) {
    return res.status(400).json({
      error: "paper_title, pdf_url, and venue_id are required",
    });
  }

  if (!Array.isArray(author_ids) || author_ids.length === 0) {
    return res.status(400).json({
      error: "author_ids must be a non-empty array of existing user_ids",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Start transaction at READ COMMITTED
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await conn.beginTransaction();

    // Generate new paper_id
    const paperId = "P_" + uuidv4();

    // Insert into Papers
    await conn.query(
      `INSERT INTO Papers (
        paper_id,
        paper_title,
        abstract,
        pdf_url,
        upload_timestamp,
        status,
        venue_id,
        project_id,
        dataset_id
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [
        paperId,
        paper_title,
        abstract || null,
        pdf_url,
        status || "Under Review",
        venue_id,
        project_id || null,
        dataset_id || null,
      ]
    );

    // Insert into Authorship for each author_id
    // Schema: Authorship (user_id, paper_id) - no is_primary column
    for (let i = 0; i < author_ids.length; i++) {
      const userId = author_ids[i];

      await conn.query(
        `INSERT INTO Authorship (user_id, paper_id)
         VALUES (?, ?)`,
        [userId, paperId]
      );
    }

    await conn.commit();

    return res.status(201).json({
      ok: true,
      paper_id: paperId,
    });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }

    console.error("Error in /api/papers/with-authors:", err);

    // Foreign key violations: invalid venue/project/dataset/user_id
    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
      return res.status(400).json({
        error:
          "Foreign key constraint failed. Please check venue, project, dataset, and author user IDs.",
      });
    }

    // Unique constraint violations (e.g. venue_id + paper_title)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error:
          "A paper with this title already exists in the selected venue. Please choose a different title or venue.",
      });
    }

    // Fallback
    return res.status(400).json({
      error: err.message || "Failed to create paper",
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * Delete a paper safely (transaction via stored procedure)
 * DELETE /api/papers/:paper_id?user_id=U001
 * 
 * Uses stored procedure sp_delete_paper_safe which:
 * - Verifies user is an author
 * - Deletes Reviews, RelatedPapers, Authorship, then Paper in a transaction
 */
app.delete("/api/papers/:paper_id", async (req, res) => {
  const { paper_id } = req.params;
  const user_id = String(req.query.user_id || "").trim();

  if (!paper_id || !user_id) {
    return res.status(400).json({ error: "paper_id and user_id are required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    
    // Call stored procedure
    await conn.query("CALL sp_delete_paper_safe(?, ?)", [paper_id, user_id]);
    
    return res.json({ ok: true, paper_id });
  } catch (e) {
    console.error("Error in DELETE /api/papers/:paper_id:", e);
    
    // Surface the procedure error message if available
    if (e.code === "ER_SIGNAL_EXCEPTION" || e.message) {
      return res.status(400).json({ error: e.message || String(e) });
    }
    
    return res.status(400).json({ error: "Failed to delete paper" });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * Get all projects
 * GET /api/projects
 */
app.get("/api/projects", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT project_id, project_title, description, project_date FROM Projects ORDER BY project_title"
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get all datasets
 * GET /api/datasets
 */
app.get("/api/datasets", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT dataset_id, dataset_name, dataset_url, domain, access_type FROM Datasets ORDER BY dataset_name"
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get recommended papers using GCP Gemini LLM
 * GET /api/papers/:paper_id/recommendations
 * Uses Gemini to find 10 most similar papers based on title and abstract
 */
app.get("/api/papers/:paper_id/recommendations", async (req, res) => {
  const { paper_id } = req.params;

  if (!isVertexAIConfigured()) {
    return res.status(503).json({ 
      error: "Recommendation service not available. GCP_PROJECT_ID not set." 
    });
  }

  try {
    // Get the current paper
    const [currentPaperRows] = await pool.execute(
      `SELECT paper_id, paper_title, abstract FROM Papers WHERE paper_id = ?`,
      [paper_id]
    );

    if (currentPaperRows.length === 0) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const currentPaper = currentPaperRows[0];
    const currentPaperText = `Title: ${currentPaper.paper_title}\nAbstract: ${currentPaper.abstract || 'No abstract available'}`;

    // Get all other papers from database (excluding current paper)
    const [allPapers] = await pool.execute(
      `SELECT paper_id, paper_title, abstract FROM Papers WHERE paper_id != ? ORDER BY upload_timestamp DESC LIMIT 100`,
      [paper_id]
    );

    if (allPapers.length === 0) {
      return res.json([]);
    }

    // Prepare context for LLM
    const papersContext = allPapers.map((p, idx) => 
      `${idx + 1}. Paper ID: ${p.paper_id}\n   Title: ${p.paper_title}\n   Abstract: ${p.abstract || 'No abstract available'}`
    ).join('\n\n');

    // Create prompt for Gemini
    const prompt = `You are a research paper recommendation system. Given a paper and a list of other papers, identify the 10 most similar papers based on:
1. Research topic and subject matter
2. Methodology and approach
3. Abstract content and keywords
4. Overall thematic similarity

Current Paper:
${currentPaperText}

Available Papers:
${papersContext}

Please analyze the similarity and return ONLY a JSON array of exactly 10 paper IDs (in order of similarity, most similar first). Format your response as a valid JSON array like this:
["P001", "P002", "P003", "P004", "P005", "P006", "P007", "P008", "P009", "P010"]

Return ONLY the JSON array, no other text.`;

    // Use Generative AI API directly (simpler, works with API key or service account)
    // This uses the generativelanguage.googleapis.com endpoint
    const modelName = 'gemini-2.5-flash'; // Use available model from your project
    const genAIEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    console.log(`[RECOMMENDATIONS] Using Generative AI API with model: ${modelName}`);
    
    // Get API key from service account for Generative AI API
    // The Generative AI API can use an API key or OAuth token
    let apiKey;
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const authOptions = {
        scopes: ['https://www.googleapis.com/auth/generative-language'],
      };
      
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        authOptions.keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      
      const auth = new GoogleAuth(authOptions);
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      apiKey = tokenResponse.token; // Use as bearer token
    } catch (authError) {
      console.error(`[RECOMMENDATIONS] Authentication error:`, authError);
      return res.status(503).json({ 
        error: "Failed to authenticate with GCP.",
        details: authError.message
      });
    }

    // Call Generative AI API using OAuth token
    const response = await fetch(genAIEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          topP: 0.8,
          topK: 40,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vertex AI API error:`, errorText);
      throw new Error(`Vertex AI API error: ${response.status} ${errorText}`);
    }

    const genAIResponse = await response.json();
    // Extract text from Generative AI API response
    const text = genAIResponse.candidates?.[0]?.content?.parts?.[0]?.text || 
                 genAIResponse.candidates?.[0]?.text || 
                 genAIResponse.text ||
                 '';
    const trimmedText = String(text).trim();
    console.log(`[RECOMMENDATIONS] LLM response length: ${trimmedText.length} chars`);

    // Parse the JSON response
    let recommendedPaperIds;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = trimmedText.match(/\[.*?\]/s);
      if (jsonMatch) {
        recommendedPaperIds = JSON.parse(jsonMatch[0]);
      } else {
        recommendedPaperIds = JSON.parse(trimmedText);
      }
    } catch (parseError) {
      console.error(`[RECOMMENDATIONS] Failed to parse LLM response:`, parseError.message);
      console.error(`[RECOMMENDATIONS] Response text (first 200 chars):`, trimmedText.substring(0, 200));
      // Fallback: return first 10 papers sorted by similarity heuristics
      // Try to extract paper IDs from the text even if not valid JSON
      const paperIdMatches = trimmedText.match(/P\d{3}/g);
      if (paperIdMatches && paperIdMatches.length > 0) {
        recommendedPaperIds = [...new Set(paperIdMatches)].slice(0, 10);
      } else {
        // Last resort: return first 10 papers
        recommendedPaperIds = allPapers.slice(0, 10).map(p => p.paper_id);
      }
    }

    // Limit to 10 and ensure they're valid paper IDs
    recommendedPaperIds = recommendedPaperIds.slice(0, 10).filter(id => 
      allPapers.some(p => p.paper_id === id)
    );

    // If we got fewer than 10, fill with remaining papers
    if (recommendedPaperIds.length < 10) {
      const remaining = allPapers
        .filter(p => !recommendedPaperIds.includes(p.paper_id))
        .slice(0, 10 - recommendedPaperIds.length)
        .map(p => p.paper_id);
      recommendedPaperIds = [...recommendedPaperIds, ...remaining];
    }

    // Fetch full paper details for recommended papers
    const placeholders = recommendedPaperIds.map(() => '?').join(',');
    const [recommendedPapers] = await pool.execute(
      `SELECT 
        p.paper_id, 
        p.paper_title, 
        p.abstract, 
        p.upload_timestamp, 
        p.status,
        v.venue_name, 
        v.year
      FROM Papers p
      LEFT JOIN Venues v ON v.venue_id = p.venue_id
      WHERE p.paper_id IN (${placeholders})
      ORDER BY FIELD(p.paper_id, ${placeholders})`,
      [...recommendedPaperIds, ...recommendedPaperIds]
    );

    return res.json(recommendedPapers);
  } catch (e) {
    console.error(`[RECOMMENDATIONS] Error:`, e);
    return res.status(500).json({ error: String(e) });
  }
});

// Export for Vercel serverless
export default app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`PaperScope API running at http://localhost:${port}`);
  });
}

