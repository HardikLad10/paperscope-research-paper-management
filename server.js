import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

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
  // SSL configuration for GCP Cloud SQL
  ssl: {
    rejectUnauthorized: false, // For GCP Cloud SQL with Google-managed certificates
  },
});

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
 * Q1 — Latest papers with venue (optional search)
 * Matches your "list latest Papers (join Venues)"; limited for speed.
 * GET /api/papers?search=transformer
 */
app.get("/api/papers", async (req, res) => {
  const search = String(req.query.search || "").trim();
  const baseSql = `
    SELECT
      p.paper_id, p.paper_title, p.abstract, p.pdf_url,
      p.upload_timestamp, p.status,
      v.venue_name, v.year
    FROM Papers p
    LEFT JOIN Venues v ON v.venue_id = p.venue_id
  `;
  const orderLimit = " ORDER BY p.upload_timestamp DESC LIMIT 20";
  try {
    if (search) {
      const like = `%${search}%`;
      const [rows] = await pool.execute(
        baseSql + " WHERE p.paper_title LIKE ? OR p.abstract LIKE ?" + orderLimit,
        [like, like]
      );
      return res.json(rows);
    }
    const [rows] = await pool.query(baseSql + orderLimit);
    return res.json(rows);
  } catch (e) {
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
 * Q4 — Author portfolio: papers for a user since a date, with review counts
 * GET /api/authors/:user_id/portfolio?since=2018-01-01
 */
app.get("/api/authors/:user_id/portfolio", async (req, res) => {
  const { user_id } = req.params;
  const since = String(req.query.since || "2018-01-01");
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        pr.project_id, pr.project_title,
        p.paper_id, p.paper_title, p.upload_timestamp,
        COUNT(r.review_id) AS review_count
      FROM Authorship a
      JOIN Papers p   ON p.paper_id = a.paper_id
      JOIN Projects pr ON pr.project_id = p.project_id
      LEFT JOIN Reviews r ON r.paper_id = p.paper_id
      WHERE a.user_id = ? AND (p.upload_timestamp IS NULL OR p.upload_timestamp >= ?)
      GROUP BY pr.project_id, pr.project_title, p.paper_id, p.paper_title, p.upload_timestamp
      ORDER BY p.upload_timestamp DESC, review_count DESC
      LIMIT 50
      `,
      [user_id, since]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
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

// Export for Vercel serverless
export default app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`PaperScope API running at http://localhost:${port}`);
  });
}

