# Advanced Features Documentation

## AI-Powered Paper Recommendations & Draft Creation

### Overview
This feature integrates Google Cloud's Vertex AI (Gemini LLM) to provide intelligent paper recommendations and allows users to create draft papers from AI suggestions. It demonstrates advanced database concepts including stored procedures, triggers, transactions, and constraints.

---

## Feature Components

### 1. LLM Integration (Vertex AI / Gemini)

**Endpoint**: `GET /api/papers/:paper_id/recommendations`

**Purpose**: Generate fictional related paper recommendations using Google's Gemini LLM based on a paper's title and abstract.

**Implementation**:
- Uses Google Generative AI API with OAuth authentication
- Model: `gemini-2.5-flash`
- Generates 5-10 fictional paper recommendations with:
  - **title**: Creative, realistic research paper title
  - **summary**: 2-3 sentence description
  - **reason**: Why it's relevant to the source paper

**Response Format**:
```json
{
  "paper_id": "P014",
  "recommendations": [
    {
      "title": "Advanced Graph Traversal Optimization",
      "summary": "This paper explores novel algorithms...",
      "reason": "Relevant because it addresses similar indexing challenges..."
    }
  ]
}
```

**UI Integration**:
- `PaperModal.jsx` component displays recommendations
- Each recommendation shows AI-generated badge
- "Add to My Papers" button to create draft from recommendation

---

### 2. AI Draft Creation (Transaction + Stored Procedure)

**Endpoint**: `POST /api/ai-drafts`

**Request Body**:
```json
{
  "source_paper_id": "P014",
  "paper_id": "P_<uuid>",
  "title": "AI-generated title",
  "abstract": "AI-generated summary",
  "user_id": "U001"
}
```

**Stored Procedure**: `sp_create_ai_draft_paper`

**Database Objects Involved**:

#### Schema Changes (`ai_draft_schema.sql`)
```sql
ALTER TABLE Papers
  ADD COLUMN ai_generated TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN source_paper_id VARCHAR(50) NULL,
  ADD CONSTRAINT fk_papers_source
      FOREIGN KEY (source_paper_id) REFERENCES Papers(paper_id)
      ON DELETE SET NULL,
  ADD CONSTRAINT chk_ai_flag
      CHECK (ai_generated IN (0,1));

ALTER TABLE RelatedPapers
  ADD COLUMN relation_type VARCHAR(50) DEFAULT 'RELATED';
```

**Key Constraints**:
1. **CHECK Constraint**: `chk_ai_flag` ensures `ai_generated` is 0 or 1
2. **Foreign Key**: `fk_papers_source` links AI draft to source paper (ON DELETE SET NULL)
3. **Self-referential FK**: Papers can reference other Papers

---

### 3. Stored Procedure: `sp_create_ai_draft_paper`

**Location**: `database/procedures.sql`

**Signature**:
```sql
CREATE PROCEDURE sp_create_ai_draft_paper (
    IN p_creator_user_id   VARCHAR(10),
    IN p_source_paper_id   VARCHAR(50),
    IN p_paper_id          VARCHAR(50),
    IN p_title             VARCHAR(255),
    IN p_abstract          TEXT
)
```

**Transaction Logic**:
```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;

-- 1. Validate title is not empty
IF p_title IS NULL OR CHAR_LENGTH(TRIM(p_title)) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'AI draft must have a title';
END IF;

-- 2. Get venue from source paper
SELECT venue_id INTO v_venue_id
  FROM Papers
 WHERE paper_id = p_source_paper_id;

-- 3. Insert new AI draft paper
INSERT INTO Papers (
    paper_id, paper_title, abstract, pdf_url,
    upload_timestamp, venue_id, status,
    ai_generated, source_paper_id
) VALUES (
    p_paper_id, p_title, p_abstract, 'AI_DRAFT_NO_PDF',
    NOW(), v_venue_id, 'AI_DRAFT', 1, p_source_paper_id
);

-- 4. Link creator as author
INSERT INTO Authorship (user_id, paper_id)
VALUES (p_creator_user_id, p_paper_id);

-- 5. Link in RelatedPapers for traceability
INSERT INTO RelatedPapers (paper_id, related_paper_id, relation_type)
VALUES (p_source_paper_id, p_paper_id, 'AI_RECOMMENDED');

COMMIT;
```

**Error Handling**:
- Uses `EXIT HANDLER FOR SQLEXCEPTION` to rollback on any error
- Validates source paper exists and has venue
- All-or-nothing transaction ensures data consistency

**Stage 4 Requirements Met**:
- **Transaction**: Explicit `START TRANSACTION` / `COMMIT` with `READ COMMITTED` isolation
- **Stored Procedure**: Encapsulates complex multi-table insert logic
- **Error Handling**: Validates inputs and rolls back on failure

---

### 4. Trigger: `trg_ai_paper_before_update`

**Location**: `database/triggers.sql`

**Purpose**: Validate AI drafts before promoting to "Under Review" status

**Trigger Definition**:
```sql
CREATE TRIGGER trg_ai_paper_before_update
BEFORE UPDATE ON Papers
FOR EACH ROW
BEGIN
    -- Only apply when an AI draft is being promoted
    IF OLD.ai_generated = 1
       AND OLD.status = 'AI_DRAFT'
       AND NEW.status = 'Under Review' THEN

        -- Require a real PDF URL
        IF NEW.pdf_url IS NULL
           OR NEW.pdf_url = ''
           OR NEW.pdf_url = 'AI_DRAFT_NO_PDF' THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'AI paper must have a real PDF URL before moving to Under Review';
        END IF;

        -- Require a non-trivial abstract (minimum 50 characters)
        IF NEW.abstract IS NULL
           OR CHAR_LENGTH(NEW.abstract) < 50 THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'AI paper must have an abstract of at least 50 characters before moving to Under Review';
        END IF;

        -- Venue should already be non-NULL, but we guard anyway
        IF NEW.venue_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'AI paper must have a venue before moving to Under Review';
        END IF;

    END IF;
END
```

**Validation Rules**:
1. **PDF URL**: Must not be NULL, empty, or placeholder `'AI_DRAFT_NO_PDF'`
2. **Abstract**: Must be at least 50 characters
3. **Venue**: Must not be NULL

**Stage 4 Requirements Met**:
- **Trigger**: `BEFORE UPDATE` trigger with conditional logic
- **Data Validation**: Enforces business rules at database level
- **Error Messages**: Clear, user-friendly error messages via `SIGNAL`

---

## User Workflow

### Creating an AI Draft

1. **View Paper**: User clicks on any paper to open `PaperModal`
2. **See Recommendations**: Modal displays AI-generated related papers
3. **Add to My Papers**: User clicks "Add to My Papers" on a recommendation
4. **Draft Created**: Backend calls `sp_create_ai_draft_paper` which:
   - Creates new paper with `status='AI_DRAFT'` and `ai_generated=1`
   - Sets `pdf_url='AI_DRAFT_NO_PDF'` (placeholder)
   - Links current user as author
   - Links to source paper via `RelatedPapers` with `relation_type='AI_RECOMMENDED'`
5. **View in My Papers**: Draft appears with "AI Draft" badge

### Promoting AI Draft to Under Review

1. **Edit Draft**: User edits the AI draft paper
2. **Add Content**:
   - Upload real PDF (change `pdf_url`)
   - Expand/refine abstract (ensure ≥50 chars)
3. **Change Status**: User changes status from "AI_DRAFT" to "Under Review"
4. **Trigger Validation**: `trg_ai_paper_before_update` fires:
   - **Blocks** if PDF is still placeholder or abstract too short
   - **Allows** if all requirements met
5. **Success**: Paper is now "Under Review" and can receive reviews

---

## Stage 4 Requirements Summary

| Requirement | Implementation | Location |
|------------|----------------|----------|
| **Stored Procedure** | `sp_create_ai_draft_paper` | `database/procedures.sql` |
| **Transaction** | Explicit transaction in stored procedure | Lines 290-344 |
| **Trigger** | `trg_ai_paper_before_update` | `database/triggers.sql` |
| **Constraint** | `chk_ai_flag` CHECK, `fk_papers_source` FK | `database/ai_draft_schema.sql` |
| **Creative Component** | Vertex AI LLM integration | `server.js` lines 934-1142 |

---

## Testing

### Test Stored Procedure
```sql
CALL sp_create_ai_draft_paper(
    'U001',                    -- creator user
    'P001',                    -- source paper
    'P_TEST_001',              -- new paper ID
    'Test AI Paper',           -- title
    'Test abstract content'    -- abstract
);

-- Verify creation
SELECT * FROM Papers WHERE paper_id = 'P_TEST_001';
SELECT * FROM Authorship WHERE paper_id = 'P_TEST_001';
SELECT * FROM RelatedPapers WHERE related_paper_id = 'P_TEST_001';
```

### Test Trigger (Should Fail)
```sql
-- This should fail: no real PDF
UPDATE Papers 
SET status = 'Under Review' 
WHERE paper_id = 'P_TEST_001';
-- ERROR: AI paper must have a real PDF URL before moving to Under Review
```

### Test Trigger (Should Succeed)
```sql
-- Fix the draft
UPDATE Papers 
SET pdf_url = 'https://example.com/paper.pdf',
    abstract = 'This is a longer abstract that meets the 50 character minimum requirement for validation.'
WHERE paper_id = 'P_TEST_001';

-- Now this should succeed
UPDATE Papers 
SET status = 'Under Review' 
WHERE paper_id = 'P_TEST_001';
```

---

## Technical Notes

### Why Transactions Matter
The stored procedure uses a transaction to ensure atomicity:
- If any step fails (e.g., source paper not found), the entire operation rolls back
- No partial state (e.g., paper created but no authorship link)
- `READ COMMITTED` isolation prevents dirty reads

### Why Triggers Matter
The trigger enforces data quality at the database level:
- Application bugs can't bypass validation
- Consistent enforcement across all clients (web, mobile, API)
- Clear separation of concerns (business rules in DB, not scattered in app code)

### Why Constraints Matter
- `CHECK` constraint ensures `ai_generated` is always 0 or 1 (no invalid values)
- `FOREIGN KEY` maintains referential integrity (can't reference non-existent paper)
- `ON DELETE SET NULL` handles cascade gracefully (if source deleted, draft remains)

---

## Future Enhancements

1. **Semantic Search**: Use embeddings to find truly similar papers in database
2. **Citation Graph**: Build citation network from AI recommendations
3. **Batch Import**: Allow importing multiple AI drafts at once
4. **Review AI Suggestions**: Let reviewers see AI-recommended reviewers
5. **Auto-tagging**: Use LLM to suggest keywords/topics for papers
