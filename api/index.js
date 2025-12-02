// Vercel serverless function - Express app entry point
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware - logs all requests
app.use((req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    query: req.query,
    params: req.params,
    body: req.method === 'POST' ? { ...req.body, password: req.body?.password ? '***' : undefined } : undefined,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  // Capture response
  const originalSend = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      statusCode: res.statusCode,
      responseSize: JSON.stringify(data).length,
      duration: `${duration}ms`
    });
    return originalSend.call(this, data);
  };

  next();
});

// MySQL pool (raw SQL)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Root route
app.get("/", (_req, res) => {
  console.log("[ROOT] API info requested");
  res.json({ 
    message: "PaperScope API", 
    version: "1.0.0",
    endpoints: [
      "GET /api/health",
      "GET /api/papers",
      "GET /api/papers/:paper_id",
      "GET /api/venues/recent",
      "GET /api/authors/:user_id/portfolio",
      "GET /api/reviewers/top",
      "GET /api/advanced/query1",
      "GET /api/advanced/query2",
      "GET /api/advanced/query3",
      "GET /api/advanced/query4",
      "POST /api/auth/login"
    ]
  });
});

// Health
app.get("/api/health", async (_req, res) => {
  const startTime = Date.now();
  console.log("[HEALTH] Checking database connection...");
  try {
    const [r] = await pool.query("SELECT 1 AS ok");
    const duration = Date.now() - startTime;
    console.log(`[HEALTH] Database connection successful (${duration}ms)`);
    return res.json({ ok: r[0]?.ok === 1 });
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[HEALTH] Database connection failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      DB_USER: process.env.DB_USER ? "SET" : "MISSING",
      DB_PASSWORD: process.env.DB_PASSWORD ? "SET" : "MISSING",
      DB_NAME: process.env.DB_NAME ? "SET" : "MISSING",
      DB_PORT: process.env.DB_PORT || "3306 (default)"
    });
    // Debug: Show which env vars are missing
    const envCheck = {
      DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      DB_USER: process.env.DB_USER ? "SET" : "MISSING",
      DB_PASSWORD: process.env.DB_PASSWORD ? "SET" : "MISSING",
      DB_NAME: process.env.DB_NAME ? "SET" : "MISSING",
      DB_PORT: process.env.DB_PORT || "3306 (default)",
      error: String(e)
    };
    return res.status(500).json({ ok: false, ...envCheck });
  }
});

// Papers endpoints
app.get("/api/papers", async (req, res) => {
  const startTime = Date.now();
  const search = String(req.query.search || "").trim();
  console.log(`[PAPERS] GET /api/papers`, { search: search || "none" });
  
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
    let rows;
    if (search) {
      const like = `%${search}%`;
      console.log(`[PAPERS] Executing search query with term: "${search}"`);
      [rows] = await pool.execute(
        baseSql + " WHERE p.paper_title LIKE ? OR p.abstract LIKE ?" + orderLimit,
        [like, like]
      );
    } else {
      console.log(`[PAPERS] Executing query for latest papers`);
      [rows] = await pool.query(baseSql + orderLimit);
    }
    const duration = Date.now() - startTime;
    console.log(`[PAPERS] Query successful: ${rows.length} papers found (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[PAPERS] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      search: search || "none"
    });
    return res.status(500).json({ error: String(e) });
  }
});

app.get("/api/papers/:paper_id", async (req, res) => {
  const startTime = Date.now();
  const { paper_id } = req.params;
  console.log(`[PAPER_DETAIL] GET /api/papers/${paper_id}`);
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
    const duration = Date.now() - startTime;
    if (!rows.length) {
      console.log(`[PAPER_DETAIL] Paper not found: ${paper_id} (${duration}ms)`);
      return res.status(404).json({ error: "Not found" });
    }
    console.log(`[PAPER_DETAIL] Paper found: ${paper_id} (${duration}ms)`);
    return res.json(rows[0]);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[PAPER_DETAIL] Query failed for ${paper_id} (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      paper_id
    });
    return res.status(500).json({ error: String(e) });
  }
});

// Venues
app.get("/api/venues/recent", async (req, res) => {
  const startTime = Date.now();
  const sinceYear = Number(req.query.sinceYear || 2018);
  console.log(`[VENUES] GET /api/venues/recent`, { sinceYear });
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
    const duration = Date.now() - startTime;
    console.log(`[VENUES] Query successful: ${rows.length} venues found (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[VENUES] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      sinceYear
    });
    return res.status(500).json({ error: String(e) });
  }
});

// Authors
app.get("/api/authors/:user_id/portfolio", async (req, res) => {
  const startTime = Date.now();
  const { user_id } = req.params;
  const since = String(req.query.since || "2018-01-01");
  console.log(`[AUTHORS] GET /api/authors/${user_id}/portfolio`, { since });
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
    const duration = Date.now() - startTime;
    console.log(`[AUTHORS] Query successful: ${rows.length} papers found for user ${user_id} (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[AUTHORS] Query failed for user ${user_id} (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      user_id,
      since
    });
    return res.status(500).json({ error: String(e) });
  }
});

// Reviewers
app.get("/api/reviewers/top", async (req, res) => {
  const startTime = Date.now();
  const from = String(req.query.from || "2024-01-01");
  const to   = String(req.query.to   || "2025-12-31");
  console.log(`[REVIEWERS] GET /api/reviewers/top`, { from, to });
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
    const duration = Date.now() - startTime;
    console.log(`[REVIEWERS] Query successful: ${rows.length} reviewers found (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[REVIEWERS] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      from,
      to
    });
    return res.status(500).json({ error: String(e) });
  }
});

// Advanced queries for frontend
app.get("/api/advanced/query1", async (req, res) => {
  const startTime = Date.now();
  const year = String(req.query.year || "2024");
  const user_id = String(req.query.user_id || "");
  console.log(`[QUERY1] GET /api/advanced/query1`, { user_id, year });
  if (!user_id) {
    console.log(`[QUERY1] Validation failed: user_id is required`);
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
    const duration = Date.now() - startTime;
    console.log(`[QUERY1] Query successful: ${rows.length} papers found for user ${user_id}, year ${year} (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[QUERY1] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      user_id,
      year
    });
    return res.status(500).json({ error: String(e) });
  }
});

app.get("/api/advanced/query2", async (req, res) => {
  const startTime = Date.now();
  const year = Number(req.query.year || 2020);
  console.log(`[QUERY2] GET /api/advanced/query2`, { year });
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
    const duration = Date.now() - startTime;
    console.log(`[QUERY2] Query successful: ${rows.length} venues found for year >= ${year} (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[QUERY2] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      year
    });
    return res.status(500).json({ error: String(e) });
  }
});

app.get("/api/advanced/query3", async (req, res) => {
  const startTime = Date.now();
  const start_date = String(req.query.start_date || "2024-01-01");
  const end_date = String(req.query.end_date || "2025-12-31");
  const startDateTime = `${start_date} 00:00:00`;
  const endDateTime = `${end_date} 23:59:59`;
  console.log(`[QUERY3] GET /api/advanced/query3`, { start_date, end_date });
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
    const duration = Date.now() - startTime;
    console.log(`[QUERY3] Query successful: ${rows.length} reviewers found (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[QUERY3] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      start_date,
      end_date
    });
    return res.status(500).json({ error: String(e) });
  }
});

app.get("/api/advanced/query4", async (req, res) => {
  const startTime = Date.now();
  const user_id = String(req.query.user_id || "");
  console.log(`[QUERY4] GET /api/advanced/query4`, { user_id });
  if (!user_id) {
    console.log(`[QUERY4] Validation failed: user_id is required`);
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
    const duration = Date.now() - startTime;
    console.log(`[QUERY4] Query successful: ${rows.length} papers found for user ${user_id} (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[QUERY4] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      user_id
    });
    return res.status(500).json({ error: String(e) });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const startTime = Date.now();
  const { username, password } = req.body;
  console.log(`[LOGIN] POST /api/auth/login`, { username, password: password ? "***" : undefined });
  if (!username || !password) {
    console.log(`[LOGIN] Validation failed: missing username or password`);
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
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
    const duration = Date.now() - startTime;
    if (rows.length === 0) {
      console.log(`[LOGIN] Authentication failed for user: ${username} (${duration}ms)`);
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const user = rows[0];
    console.log(`[LOGIN] Authentication successful for user: ${username} (${user.user_name}) (${duration}ms)`);
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
    const duration = Date.now() - startTime;
    console.error(`[LOGIN] Authentication error (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      username
    });
    return res.status(500).json({ error: String(e) });
  }
});

// Export for Vercel
export default app;

