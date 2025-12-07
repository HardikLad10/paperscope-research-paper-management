import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

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
  dbConfig.ssl = {
    rejectUnauthorized: false, // For GCP Cloud SQL with Google-managed certificates
  };
  // Enable connection retry
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
 * Get papers authored by user that are in review
 * GET /api/users/:user_id/papers-in-review
 */
app.get("/api/users/:user_id/papers-in-review", async (req, res) => {
  const { user_id } = req.params;
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
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Get papers assigned to user for review
 * GET /api/users/:user_id/assigned-reviews
 * Returns papers that are under review, user didn't author, and user is a reviewer
 */
app.get("/api/users/:user_id/assigned-reviews", async (req, res) => {
  const { user_id } = req.params;
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
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Create AI Draft Paper (uses stored procedure with transaction)
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

// Export for Vercel serverless
export default app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`PaperScope API running at http://localhost:${port}`);
  });
}

