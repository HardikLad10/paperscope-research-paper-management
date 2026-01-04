# How Related Papers Are Found & LLM Usage

## 🤖 LLM Being Used

**Model:** **Google Gemini 2.5 Flash** (`gemini-2.5-flash`)

**Service:** Google Cloud Platform (GCP) Generative AI API

**Authentication:** OAuth token via Google Auth Library using service account credentials

**API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

---

## 📚 How Related Papers Are Found

Your system has **TWO different approaches** for finding related papers, depending on which backend file is being used:

### Approach 1: Fictional AI-Generated Recommendations (server.js)

**Location:** `server.js` - `GET /api/papers/:paper_id/recommendations`

**What it does:**
- **Generates completely NEW, fictional paper recommendations** (not from your database)
- Uses Gemini LLM to create creative, realistic-sounding paper titles and summaries
- These are **suggestions for papers that don't exist yet** - like "what papers should be written?"

**How it works:**
1. Takes the current paper's title and abstract
2. Sends a prompt to Gemini asking for 5-10 fictional related paper ideas
3. Gemini generates:
   - **title**: A creative, realistic research paper title
   - **summary**: 2-3 sentence description of what the paper would be about
   - **reason**: Why it's relevant to the current paper
4. Returns these fictional recommendations to the user

**Example Prompt:**
```
You are a research paper recommendation system. Based on the following paper, 
recommend 5-10 related research papers.

IMPORTANT: Create NEW, FICTIONAL paper titles and summaries. Do NOT reference 
or reuse any paper titles from any database. These should be original, creative 
recommendations that would be interesting to researchers reading this paper.
```

**Use Case:** 
- Users can see "what papers should be written next?"
- Can create AI draft papers from these recommendations
- Inspires new research directions

**LLM Configuration:**
- Temperature: `0.7` (more creative)
- Max Output Tokens: `4096`
- Top P: `0.9`
- Top K: `40`

---

### Approach 2: Find Similar Papers from Database (api/index.js)

**Location:** `api/index.js` - `GET /api/papers/:paper_id/recommendations`

**What it does:**
- **Finds the 10 most similar papers that already exist in your database**
- Uses Gemini LLM to analyze similarity between papers
- Returns actual papers from your database

**How it works:**
1. Gets the current paper's title and abstract
2. Fetches up to 100 other papers from the database (excluding current paper)
3. Sends all papers to Gemini with a prompt asking it to identify the 10 most similar
4. Gemini analyzes similarity based on:
   - Research topic and subject matter
   - Methodology and approach
   - Abstract content and keywords
   - Overall thematic similarity
5. Returns a JSON array of paper IDs (most similar first)
6. Backend fetches full details of those papers and returns them

**Example Prompt:**
```
You are a research paper recommendation system. Given a paper and a list of other 
papers, identify the 10 most similar papers based on:
1. Research topic and subject matter
2. Methodology and approach
3. Abstract content and keywords
4. Overall thematic similarity

Current Paper:
[Title and Abstract]

Available Papers:
[100 papers with IDs, titles, abstracts]

Please analyze the similarity and return ONLY a JSON array of exactly 10 paper IDs 
(in order of similarity, most similar first).
```

**Use Case:**
- Users can discover existing papers similar to the one they're viewing
- Helps researchers find related work
- Builds connections between papers in the database

**LLM Configuration:**
- Temperature: `0.2` (more focused, less creative)
- Max Output Tokens: `1024`
- Top P: `0.8`
- Top K: `40`

**Fallback Logic:**
- If LLM response can't be parsed, it falls back to returning the first 10 papers
- Validates that returned paper IDs actually exist in the database

---

## 🔗 RelatedPapers Table

There's also a **database table** called `RelatedPapers` that stores explicit relationships between papers:

**Schema:**
```sql
CREATE TABLE RelatedPapers (
    paper_id VARCHAR(50) NOT NULL,
    related_paper_id VARCHAR(50) NOT NULL,
    relation_type VARCHAR(50) DEFAULT 'RELATED',
    PRIMARY KEY (paper_id, related_paper_id),
    FOREIGN KEY (paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    FOREIGN KEY (related_paper_id) REFERENCES Papers(paper_id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_relation CHECK (paper_id <> related_paper_id)
);
```

**What it stores:**
- Explicit relationships between papers (manually added or AI-generated)
- `relation_type` can be:
  - `'RELATED'` - General relationship
  - `'AI_RECOMMENDED'` - Created from AI recommendation
- Used when creating AI draft papers (links the draft to the source paper)

**How it's used:**
- When you create an AI draft from a recommendation, it creates a `RelatedPapers` entry
- The `sp_delete_paper_safe` procedure deletes all `RelatedPapers` links when a paper is deleted
- Can be queried to find all papers related to a given paper

---

## 📊 Summary Comparison

| Feature | Approach 1 (server.js) | Approach 2 (api/index.js) |
|---------|----------------------|---------------------------|
| **Type** | Fictional recommendations | Similar papers from DB |
| **Source** | AI-generated (doesn't exist) | Existing papers in database |
| **Count** | 5-10 recommendations | Exactly 10 papers |
| **Use Case** | Inspiration for new papers | Discovery of existing papers |
| **Temperature** | 0.7 (more creative) | 0.2 (more focused) |
| **Can Create Drafts** | Yes (via AI draft feature) | No (papers already exist) |
| **Database Query** | None (just current paper) | Fetches 100 papers for comparison |

---

## 🔧 Technical Details

### Authentication
Both approaches use the same authentication method:
1. Uses `GoogleAuth` from `google-auth-library`
2. Reads `GOOGLE_APPLICATION_CREDENTIALS` environment variable (service account key file)
3. Gets OAuth token with scope: `https://www.googleapis.com/auth/generative-language`
4. Uses token as Bearer token in API request

### Error Handling
- If Vertex AI is not configured (`GCP_PROJECT_ID` not set), returns 503 error
- If authentication fails, returns 503 with error details
- If LLM response can't be parsed, Approach 2 falls back to first 10 papers
- Approach 1 returns empty array if parsing fails

### Configuration Check
```javascript
const isVertexAIConfigured = () => {
  return !!VERTEX_AI_CONFIG.projectId;
};
```

Where `VERTEX_AI_CONFIG.projectId` comes from `process.env.GCP_PROJECT_ID`

---

## 🎯 Which One Is Active?

You have **two different backend files**:
- `server.js` - Uses Approach 1 (fictional recommendations)
- `api/index.js` - Uses Approach 2 (similar papers from database)

**Check which one your application is using** - it depends on your deployment setup. The `api/index.js` file appears to be for Vercel serverless deployment, while `server.js` is for traditional server deployment.

---

## 💡 Key Takeaways

1. **LLM:** Google Gemini 2.5 Flash via GCP Generative AI API
2. **Two Approaches:**
   - **Fictional recommendations** - AI suggests new papers that could be written
   - **Similarity search** - AI finds existing papers similar to the current one
3. **Database Table:** `RelatedPapers` stores explicit relationships between papers
4. **Authentication:** OAuth via service account credentials
5. **Both use same LLM** but with different prompts and temperature settings



