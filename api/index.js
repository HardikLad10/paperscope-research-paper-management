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
// Handle Cloud SQL Unix socket connection (when DB_HOST starts with /cloudsql/)
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds (increased for Cloud Run)
  // Note: acquireTimeout and timeout are pool-level, not connection-level
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
      "GET /api/users/:user_id/papers-in-review",
      "GET /api/users/:user_id/assigned-reviews",
      "GET /api/advanced/query1",
      "GET /api/advanced/query2",
      "GET /api/advanced/query3",
      "GET /api/advanced/query4",
      "GET /api/papers/:paper_id/recommendations",
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
    const errorDetails = {
      message: e.message,
      code: e.code,
      errno: e.errno,
      sqlState: e.sqlState,
      sqlMessage: e.sqlMessage,
    };
    console.error(`[HEALTH] Database connection failed (${duration}ms):`, {
      ...errorDetails,
      DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      DB_USER: process.env.DB_USER ? "SET" : "MISSING",
      DB_PASSWORD: process.env.DB_PASSWORD ? "SET" : "MISSING",
      DB_NAME: process.env.DB_NAME ? "SET" : "MISSING",
      DB_PORT: process.env.DB_PORT || "3306",
      stack: e.stack,
    });
    return res.status(500).json({
      ok: false,
      status: "disconnected",
      DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      DB_USER: process.env.DB_USER ? "SET" : "MISSING",
      DB_PASSWORD: process.env.DB_PASSWORD ? "SET" : "MISSING",
      DB_NAME: process.env.DB_NAME ? "SET" : "MISSING",
      DB_PORT: process.env.DB_PORT || "3306",
      error: String(e),
      errorCode: e.code,
      errorMessage: e.message,
      troubleshooting: {
        ETIMEDOUT: "Connection timeout - Check firewall, IP whitelist, and Public IP enabled",
        ECONNREFUSED: "Connection refused - Check IP address and port",
        ENOTFOUND: "Host not found - Check DB_HOST value",
      }[e.code] || "See error message above",
    });
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

/**
 * Get papers authored by user that are in review
 * GET /api/users/:user_id/papers-in-review
 */
app.get("/api/users/:user_id/papers-in-review", async (req, res) => {
  const startTime = Date.now();
  const { user_id } = req.params;
  console.log(`[PAPERS_IN_REVIEW] GET /api/users/${user_id}/papers-in-review`);
  try {
    const [rows] = await pool.execute(
      `
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
      WHERE a.user_id = ? 
        AND p.status IN ('Under Review', 'In Review')
      GROUP BY p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status, v.venue_name, v.year
      ORDER BY p.upload_timestamp DESC
      `,
      [user_id]
    );
    const duration = Date.now() - startTime;
    console.log(`[PAPERS_IN_REVIEW] Query successful: ${rows.length} papers found for user ${user_id} (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[PAPERS_IN_REVIEW] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      user_id
    });
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get papers assigned to user for review
 * GET /api/users/:user_id/assigned-reviews
 * Returns papers that are under review, user didn't author, and user is a reviewer
 */
app.get("/api/users/:user_id/assigned-reviews", async (req, res) => {
  const startTime = Date.now();
  const { user_id } = req.params;
  console.log(`[ASSIGNED_REVIEWS] GET /api/users/${user_id}/assigned-reviews`);
  try {
    // First check if user is a reviewer
    const [userCheck] = await pool.execute(
      `SELECT is_reviewer FROM Users WHERE user_id = ?`,
      [user_id]
    );
    
    if (userCheck.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if user is a reviewer (handle both boolean and TINYINT(1) formats)
    const isReviewer = userCheck[0].is_reviewer === 1 || userCheck[0].is_reviewer === true;
    if (!isReviewer) {
      // User is not a reviewer, return empty array
      return res.json([]);
    }
    
    // Get papers under review that user didn't author
    const [rows] = await pool.execute(
      `
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
          WHERE rev.paper_id = p.paper_id AND rev.user_id = ?
        ) THEN true ELSE false END AS has_reviewed
      FROM Papers p
      LEFT JOIN Venues v ON v.venue_id = p.venue_id
      LEFT JOIN Reviews r ON p.paper_id = r.paper_id
      WHERE p.status IN ('Under Review', 'In Review')
        AND p.paper_id NOT IN (
          SELECT a.paper_id FROM Authorship a WHERE a.user_id = ?
        )
      GROUP BY p.paper_id, p.paper_title, p.abstract, p.pdf_url, p.upload_timestamp, p.status, v.venue_name, v.year
      ORDER BY p.upload_timestamp DESC
      `,
      [user_id, user_id]
    );
    const duration = Date.now() - startTime;
    console.log(`[ASSIGNED_REVIEWS] Query successful: ${rows.length} papers found for reviewer ${user_id} (${duration}ms)`);
    return res.json(rows);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[ASSIGNED_REVIEWS] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      user_id
    });
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get recommended papers using GCP Gemini LLM
 * GET /api/papers/:paper_id/recommendations
 * Uses Gemini to find 10 most similar papers based on title and abstract
 */
app.get("/api/papers/:paper_id/recommendations", async (req, res) => {
  const startTime = Date.now();
  const { paper_id } = req.params;
  console.log(`[RECOMMENDATIONS] GET /api/papers/${paper_id}/recommendations`);

  if (!isVertexAIConfigured()) {
    console.log(`[RECOMMENDATIONS] Vertex AI not configured`);
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
    // In Cloud Run, uses default service account or GOOGLE_APPLICATION_CREDENTIALS
    let apiKey;
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const authOptions = {
        scopes: ['https://www.googleapis.com/auth/generative-language'],
      };
      
      // Handle service account key file (local dev) or use default credentials (Cloud Run)
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const fs = await import('fs');
        const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        // Check if it's a file path that exists
        if (fs.existsSync(path)) {
          authOptions.keyFile = path;
        } else {
          // Try reading as secret mount path
          try {
            const keyData = fs.readFileSync(path, 'utf8');
            authOptions.credentials = JSON.parse(keyData);
          } catch {
            // Fall back to default credentials (Cloud Run will use its service account)
            console.log('[RECOMMENDATIONS] Using default GCP credentials (Cloud Run service account)');
          }
        }
      } else {
        // No credentials specified - use default (Cloud Run service account)
        console.log('[RECOMMENDATIONS] Using default GCP credentials');
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
      console.error(`[RECOMMENDATIONS] Vertex AI API error:`, errorText);
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

    const duration = Date.now() - startTime;
    console.log(`[RECOMMENDATIONS] Query successful: ${recommendedPapers.length} papers recommended (${duration}ms)`);
    return res.json(recommendedPapers);
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`[RECOMMENDATIONS] Query failed (${duration}ms):`, {
      error: String(e),
      stack: e.stack,
      paper_id
    });
    return res.status(500).json({ error: String(e) });
  }
});

// Export for Vercel
export default app;

// Start server for Cloud Run or local development
if (process.env.VERCEL !== '1') {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`PaperScope API running at http://0.0.0.0:${port}`);
  });
}

