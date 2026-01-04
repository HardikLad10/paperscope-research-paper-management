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
// Handle Cloud SQL Unix socket connection (when DB_HOST starts with /cloudsql/)
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/')) {
  // Cloud SQL Unix socket connection
  dbConfig.socketPath = process.env.DB_HOST;
} else {
  // Standard TCP connection
  dbConfig.host = process.env.DB_HOST;
  dbConfig.port = Number(process.env.DB_PORT || 3306);
  
  // Cloud SQL requires SSL for public IP connections
  // Try without SSL first if DB_SSL=false, otherwise use SSL
  if (process.env.DB_SSL === 'false') {
    console.log(`[DB] Attempting connection to ${dbConfig.host}:${dbConfig.port} WITHOUT SSL`);
  } else {
    dbConfig.ssl = {
      rejectUnauthorized: false, // Accept self-signed certificates
      // Cloud SQL uses Google-managed certificates
    };
    console.log(`[DB] Attempting connection to ${dbConfig.host}:${dbConfig.port} with SSL: true`);
  }
  
  // Enable connection retry and keep-alive
  dbConfig.enableKeepAlive = true;
  dbConfig.keepAliveInitialDelay = 0;
}

const pool = mysql.createPool(dbConfig);

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
  const to = String(req.query.to || "2025-12-31");
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
 * Get papers that a user can review (not authored by them, not already reviewed)
 * GET /api/reviewable-papers?user_id=U001&venue_id=V001&q=keyword&page=1&limit=20
 * 
 * Query params:
 *   - user_id (required): exclude papers authored by this user
 *   - venue_id (optional): filter by venue
 *   - q (optional): search in title/abstract
 *   - page (optional): page number (default: 1)
 *   - limit (optional): papers per page (default: 20, max: 100)
 */
app.get("/api/reviewable-papers", async (req, res) => {
  const { user_id, venue_id, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    // Build WHERE conditions
    const whereConditions = ["p.status = 'Under Review'"];
    const params = [];

    // Exclude papers authored by user_id
    whereConditions.push(`
      NOT EXISTS (
        SELECT 1 FROM Authorship a
        WHERE a.paper_id = p.paper_id
          AND a.user_id = ?
      )
    `);
    params.push(user_id);

    // Exclude papers already reviewed by user_id
    whereConditions.push(`
      NOT EXISTS (
        SELECT 1 FROM Reviews r
        WHERE r.paper_id = p.paper_id
          AND r.user_id = ?
      )
    `);
    params.push(user_id);

    // Venue filter
    if (venue_id && venue_id.trim()) {
      whereConditions.push("p.venue_id = ?");
      params.push(venue_id.trim());
    }

    // Search filter
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereConditions.push("(p.paper_title LIKE ? OR p.abstract LIKE ?)");
      params.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Papers p
      WHERE ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    const dataQuery = `
      SELECT
        p.paper_id,
        p.paper_title,
        p.abstract,
        p.pdf_url,
        p.upload_timestamp,
        p.status,
        v.venue_name,
        v.year,
        COUNT(DISTINCT r.review_id) AS review_count
      FROM Papers p
      LEFT JOIN Venues v ON p.venue_id = v.venue_id
      LEFT JOIN Reviews r ON p.paper_id = r.paper_id
      WHERE ${whereClause}
      GROUP BY p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status, v.venue_name, v.year
      ORDER BY p.upload_timestamp DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [papers] = await pool.execute(dataQuery, params);

    res.json({
      papers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
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
 * Create AI draft paper from LLM recommendation
 * POST /api/ai-drafts
 * Body: { source_paper_id, paper_id, title, abstract, user_id }
 */
app.post("/api/ai-drafts", async (req, res) => {
  const { source_paper_id, paper_id, title, abstract, user_id } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!source_paper_id || !paper_id || !title) {
    return res.status(400).json({ error: 'Missing required fields: source_paper_id, paper_id, title' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Call the stored procedure
    await conn.query(
      'CALL sp_create_ai_draft_paper(?, ?, ?, ?, ?)',
      [user_id, source_paper_id, paper_id, title, abstract || '']
    );

    return res.status(201).json({ message: 'AI draft created', paper_id });
  } catch (err) {
    console.error('[AI-DRAFT] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to create AI draft',
      message: err.message || 'Failed to create AI draft'
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * Update a paper (used for editing AI drafts and promoting to Under Review)
 * PUT /api/papers/:paper_id
 * Body: { paper_title, abstract, pdf_url, status, venue_id }
 */
app.put("/api/papers/:paper_id", async (req, res) => {
  const { paper_id } = req.params;
  const { paper_title, abstract, pdf_url, status, venue_id } = req.body;

  if (!paper_title) {
    return res.status(400).json({ message: 'paper_title is required' });
  }

  try {
    await pool.execute(
      `UPDATE Papers
       SET paper_title = ?, abstract = ?, pdf_url = ?, status = ?, venue_id = ?
       WHERE paper_id = ?`,
      [paper_title, abstract, pdf_url, status, venue_id, paper_id]
    );

    return res.json({ message: 'Paper updated successfully' });
  } catch (err) {
    console.error('[PUT /api/papers/:paper_id] Error:', err);

    // Surface trigger error messages (e.g., "AI paper must have a real PDF URL...")
    if (err.sqlMessage) {
      return res.status(400).json({ message: err.sqlMessage });
    }

    return res.status(400).json({ message: err.message || 'Update failed' });
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

    // Create prompt for Gemini to generate fictional paper recommendations
    const prompt = `You are a research paper recommendation system. Based on the following paper, recommend 5-10 related research papers.

IMPORTANT: Create NEW, FICTIONAL paper titles and summaries. Do NOT reference or reuse any paper titles from any database. These should be original, creative recommendations that would be interesting to researchers reading this paper.

Current Paper:
${currentPaperText}

Please return a JSON array of recommended papers. Each recommendation should have:
- title: A fictional but realistic research paper title
- summary: A brief 2-3 sentence summary of what the paper would be about
- reason: A short explanation of why this paper is relevant to the current paper

Format your response as a valid JSON array like this:
[
  {
    "title": "Example Paper Title 1",
    "summary": "This paper would explore...",
    "reason": "Relevant because..."
  },
  {
    "title": "Example Paper Title 2",
    "summary": "This paper would investigate...",
    "reason": "Related to the current work on..."
  }
]

Return ONLY the JSON array, no other text. Generate 5-10 recommendations.`;

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
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.9,
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
    console.log(`[RECOMMENDATIONS] LLM response (first 1000 chars):`, trimmedText.substring(0, 1000));

    // Parse the JSON response - expect array of recommendation objects
    let recommendations;
    try {
      // Remove markdown code blocks if present (```json ... ```)
      let jsonText = trimmedText;
      if (jsonText.includes('```json')) {
        // Remove ```json at start and ``` at end
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```\s*$/g, '').trim();
      } else if (jsonText.includes('```')) {
        // Remove any code block markers
        jsonText = jsonText.replace(/^```\s*/g, '').replace(/\s*```\s*$/g, '').trim();
      }

      // Extract JSON array from the response (handle truncated responses)
      // Try to find a complete JSON array
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log(`[RECOMMENDATIONS] Found JSON array, length: ${jsonStr.length}`);
        try {
          recommendations = JSON.parse(jsonStr);
        } catch (parseErr) {
          // If parsing fails, try to fix truncated JSON
          console.log(`[RECOMMENDATIONS] JSON parse failed, attempting to fix truncated response`);
          // Try to find and extract complete objects
          const objectMatches = jsonStr.match(/\{[^}]*"title"[^}]*\}/g);
          if (objectMatches && objectMatches.length > 0) {
            // Try to parse each complete object
            recommendations = [];
            for (const objStr of objectMatches) {
              try {
                const obj = JSON.parse(objStr);
                if (obj.title) recommendations.push(obj);
              } catch (e) {
                // Skip incomplete objects
              }
            }
            console.log(`[RECOMMENDATIONS] Extracted ${recommendations.length} complete objects from truncated response`);
          } else {
            throw parseErr;
          }
        }
      } else {
        console.log(`[RECOMMENDATIONS] No JSON array found, trying to parse entire response`);
        recommendations = JSON.parse(jsonText);
      }

      console.log(`[RECOMMENDATIONS] Parsed recommendations count: ${Array.isArray(recommendations) ? recommendations.length : 'not an array'}`);

      // Ensure it's an array
      if (!Array.isArray(recommendations)) {
        console.error(`[RECOMMENDATIONS] Response is not an array:`, typeof recommendations);
        throw new Error('Response is not an array');
      }

      // Validate structure
      const beforeFilter = recommendations.length;
      recommendations = recommendations.filter(rec =>
        rec && typeof rec === 'object' && rec.title
      );
      console.log(`[RECOMMENDATIONS] After filtering: ${recommendations.length} valid recommendations (from ${beforeFilter} total)`);

      // Log first recommendation for debugging
      if (recommendations.length > 0) {
        console.log(`[RECOMMENDATIONS] First recommendation:`, JSON.stringify(recommendations[0], null, 2));
      }

    } catch (parseError) {
      console.error(`[RECOMMENDATIONS] Failed to parse LLM response:`, parseError.message);
      console.error(`[RECOMMENDATIONS] Parse error stack:`, parseError.stack);
      console.error(`[RECOMMENDATIONS] Full response text:`, trimmedText);
      // Return empty array on parse error
      recommendations = [];
    }

    // Return the AI-generated recommendations directly
    console.log(`[RECOMMENDATIONS] Returning ${recommendations.length} recommendations for paper ${paper_id}`);
    const responseData = {
      paper_id,
      recommendations: recommendations || []
    };
    console.log(`[RECOMMENDATIONS] Response object:`, JSON.stringify(responseData, null, 2));
    return res.json(responseData);
  } catch (e) {
    console.error(`[RECOMMENDATIONS] Error:`, e);
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * TX_BATCH_CREATE_PAPERS_WITH_AUTHORS
 * Batch create multiple papers with authors in a single transaction
 * POST /api/papers/batch-with-authors
 * 
 * Advanced Transaction Features:
 * - SELECT ... FOR UPDATE for locking
 * - Multiple advanced queries (JOIN validation, subquery duplicate check, GROUP BY summary)
 * - Write-heavy operations with proper isolation
 * 
 * Body: {
 *   papers: [
 *     {
 *       paper_title, abstract, pdf_url, status,
 *       venue_id, project_id, dataset_id,
 *       author_ids: ["U001", "U002"]
 *     },
 *     ...
 *   ]
 * }
 */
app.post("/api/papers/batch-with-authors", async (req, res) => {
  const { papers } = req.body;

  if (!papers || !Array.isArray(papers) || papers.length === 0) {
    return res.status(400).json({ error: "papers array is required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Set isolation level and begin transaction
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await conn.beginTransaction();

    // Collect all foreign key IDs for validation
    const allVenueIds = [...new Set(papers.map(p => p.venue_id).filter(Boolean))];
    const allProjectIds = [...new Set(papers.map(p => p.project_id).filter(Boolean))];
    const allDatasetIds = [...new Set(papers.map(p => p.dataset_id).filter(Boolean))];
    const allAuthorIds = [...new Set(papers.flatMap(p => p.author_ids || []))];

    // ============================================================
    // ADVANCED QUERY 1: Validate all foreign keys with JOINs
    // ============================================================
    // Validate venues
    if (allVenueIds.length > 0) {
      const [venueRows] = await conn.execute(
        `SELECT venue_id FROM Venues WHERE venue_id IN (${allVenueIds.map(() => '?').join(',')})`,
        allVenueIds
      );
      if (venueRows.length !== allVenueIds.length) {
        await conn.rollback();
        return res.status(400).json({ error: "Invalid venue_id in batch" });
      }
    }

    // Validate projects
    if (allProjectIds.length > 0) {
      const [projectRows] = await conn.execute(
        `SELECT project_id FROM Projects WHERE project_id IN (${allProjectIds.map(() => '?').join(',')})`,
        allProjectIds
      );
      if (projectRows.length !== allProjectIds.length) {
        await conn.rollback();
        return res.status(400).json({ error: "Invalid project_id in batch" });
      }
    }

    // Validate datasets
    if (allDatasetIds.length > 0) {
      const [datasetRows] = await conn.execute(
        `SELECT dataset_id FROM Datasets WHERE dataset_id IN (${allDatasetIds.map(() => '?').join(',')})`,
        allDatasetIds
      );
      if (datasetRows.length !== allDatasetIds.length) {
        await conn.rollback();
        return res.status(400).json({ error: "Invalid dataset_id in batch" });
      }
    }

    // Validate authors
    if (allAuthorIds.length > 0) {
      const [authorRows] = await conn.execute(
        `SELECT user_id FROM Users WHERE user_id IN (${allAuthorIds.map(() => '?').join(',')})`,
        allAuthorIds
      );
      if (authorRows.length !== allAuthorIds.length) {
        await conn.rollback();
        return res.status(400).json({ error: "Invalid author user_id in batch" });
      }
    }

    // ============================================================
    // ADVANCED QUERY 2: Check duplicates with SELECT FOR UPDATE
    // ============================================================
    // Build list of (venue_id, paper_title) pairs to check
    const venueTitlePairs = papers
      .filter(p => p.venue_id && p.paper_title)
      .map(p => [p.venue_id, p.paper_title]);

    if (venueTitlePairs.length > 0) {
      const placeholders = venueTitlePairs.map(() => '(?, ?)').join(',');
      const params = venueTitlePairs.flat();

      const [duplicates] = await conn.execute(
        `SELECT p.venue_id, p.paper_title
         FROM Papers p
         WHERE (p.venue_id, p.paper_title) IN (${placeholders})
         FOR UPDATE`,
        params
      );

      if (duplicates.length > 0) {
        await conn.rollback();
        const dupTitles = duplicates.map(d => d.paper_title).join(', ');
        return res.status(409).json({
          error: "Duplicate paper titles in venue",
          duplicates: dupTitles
        });
      }
    }

    // ============================================================
    // WRITE OPERATIONS: Insert all papers and authorships
    // ============================================================
    const createdPaperIds = [];

    for (const paper of papers) {
      const {
        paper_title,
        abstract,
        pdf_url,
        status,
        venue_id,
        project_id,
        dataset_id,
        author_ids
      } = paper;

      // Generate unique paper ID
      const paperId = "P_" + uuidv4();
      createdPaperIds.push(paperId);

      // Insert paper
      await conn.execute(
        `INSERT INTO Papers 
         (paper_id, paper_title, abstract, pdf_url, upload_timestamp, status, venue_id, project_id, dataset_id)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
        [paperId, paper_title, abstract || null, pdf_url || null, status || 'Draft',
          venue_id || null, project_id || null, dataset_id || null]
      );

      // Insert authorship for each author
      if (author_ids && author_ids.length > 0) {
        for (const authorId of author_ids) {
          await conn.execute(
            `INSERT INTO Authorship (user_id, paper_id) VALUES (?, ?)`,
            [authorId, paperId]
          );
        }
      }
    }

    // ============================================================
    // ADVANCED QUERY 3: Aggregation summary for UI
    // ============================================================
    const [summary] = await conn.execute(
      `SELECT 
         v.venue_name,
         COUNT(*) AS num_created
       FROM Papers p
       LEFT JOIN Venues v ON p.venue_id = v.venue_id
       WHERE p.paper_id IN (${createdPaperIds.map(() => '?').join(',')})
       GROUP BY v.venue_id, v.venue_name`,
      createdPaperIds
    );

    // Commit transaction
    await conn.commit();

    return res.status(201).json({
      success: true,
      created_count: createdPaperIds.length,
      paper_ids: createdPaperIds,
      summary: summary
    });

  } catch (error) {
    // Rollback on any error
    if (conn) await conn.rollback();

    console.error("Error in batch create papers:", error);
    return res.status(500).json({
      error: error.message || "Failed to create papers in batch"
    });

  } finally {
    if (conn) conn.release();
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

