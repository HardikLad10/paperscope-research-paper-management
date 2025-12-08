# Project Update Report - Stage 4

**Team:** fa25-cs411-team126-ysql  
**Date:** December 7, 2024

---

## How to Run Backend Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Create `.env` file with database credentials:
     ```
     DB_HOST=34.41.182.58
     DB_USER=your_user
     DB_PASSWORD=your_password
     DB_NAME=research_paper_review_db
     ```

3. **Start server:**
   ```bash
   node server.js
   ```
   - Server runs on `http://localhost:4000`

---

## How to Run Frontend

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   - Frontend runs on `http://localhost:5173`

3. **Access application:**
   - Open browser to `http://localhost:5173`
   - Login with existing user credentials

---

## Database Transactions

**Location:** All transaction code in `/database/` folder

### Transaction 1: `sp_delete_paper_safe`
- **File:** `database/procedures.sql`
- **Type:** Stored procedure
- **Purpose:** Safely delete paper with authorization check
- **Features:** Atomic deletion of Reviews, RelatedPapers, Authorship, Papers

### Transaction 2: `TX_CREATE_PAPER_WITH_AUTHORS`
- **File:** `server.js` (line 866)
- **Type:** Backend transaction
- **Purpose:** Create single paper with authors
- **Features:** Atomic paper + authorship creation

### Transaction 3: `TX_BATCH_CREATE_PAPERS_WITH_AUTHORS` ⭐
- **File:** `server.js` (line 1229-1434)
- **Type:** Backend transaction (Advanced)
- **Purpose:** Batch create multiple papers
- **Advanced Features:**
  - SELECT FOR UPDATE (row-level locking)
  - Foreign key validation with IN queries
  - Composite IN subquery for duplicates
  - GROUP BY aggregation for summary
  - Write-heavy operations
- **UI:** "Batch Other Authors' Papers" page (`/batch-create`)
- **Endpoint:** `POST /api/papers/batch-with-authors`

### Transaction 4: `sp_create_ai_draft_paper`
- **File:** `database/procedures.sql`
- **Type:** Stored procedure
- **Purpose:** Create draft papers
- **Features:** Atomic creation with metadata

**Documentation:** `database/transactions.sql` contains detailed documentation for all transactions.

---

## Key Changes

### New Features
- ✅ Batch paper creation with advanced transaction
- ✅ Collapsible UI for managing multiple papers
- ✅ Comma-separated author input
- ✅ Per-venue summary with GROUP BY

### UI Updates
- "New Paper" → "Add My Paper"
- "Batch Create" → "Batch Other Authors' Papers"
- Removed branding from recommendations
- Sticky footer for batch submit

### Files Modified
- `server.js` - Added batch endpoint (+206 lines)
- `frontend/src/pages/BatchCreatePapersPage.jsx` - New page (474 lines)
- `frontend/src/components/MainLayout.jsx` - Updated navigation
- `database/transactions.sql` - Added Transaction 3 docs

---

## Demo Instructions

1. Navigate to "Batch Other Authors' Papers"
2. Click "+ Add Paper" to add papers
3. Fill required fields and enter author IDs (e.g., "U003, U005")
4. Click "Submit Batch"
5. View success modal with venue breakdown

**Transaction Code:** `server.js` line 1229  
**Documentation:** `database/transactions.sql`


---

## Summary of Changes

This update adds advanced transaction capabilities, improves the UI for batch operations, and enhances documentation for the database course project requirements.

---

## New Features Added

### 1. Batch Paper Creation Transaction ⭐

**Purpose:** Demonstrate advanced transaction features with write-heavy operations, locking, and complex queries.

**Implementation:**
- **Endpoint:** `POST /api/papers/batch-with-authors`
- **Location:** `server.js` lines 1229-1434
- **UI Page:** "Batch Other Authors' Papers" (`/batch-create`)

**Advanced SQL Features:**
1. **SELECT FOR UPDATE** - Row-level locking to prevent duplicate title insertion
2. **Foreign Key Validation** - Batch validation using IN queries for venues, projects, datasets, authors
3. **Composite IN Subquery** - Duplicate detection for (venue_id, paper_title) pairs
4. **GROUP BY Aggregation** - Summary statistics by venue for UI feedback
5. **Write-Heavy Operations** - Multiple INSERT statements within single transaction

**ACID Properties:**
- **Atomicity:** All papers + authorships created together or none
- **Consistency:** Enforces all FK constraints and unique constraints
- **Isolation:** READ COMMITTED with SELECT FOR UPDATE locking
- **Durability:** InnoDB guarantees persistence after COMMIT

**Files Modified:**
- `server.js` - Added batch create endpoint
- `frontend/src/pages/BatchCreatePapersPage.jsx` - New batch UI with collapsible cards
- `database/transactions.sql` - Added transaction documentation

---

### 2. UI/UX Improvements

**Navigation Updates:**
- Renamed "New Paper" → **"Add My Paper"** (for user's own papers)
- Renamed "Batch Create" → **"Batch Other Authors' Papers"** (for batch operations)

**Batch Create Page Features:**
- **Collapsible cards** - Only one paper expanded at a time for better UX
- **Compact headers** - Show paper number, title preview, status, and venue
- **Comma-separated author input** - Text field for entering author IDs (e.g., "U003, U005")
- **Sticky footer** - Submit buttons always visible
- **Real-time validation** - Client-side checks before submission
- **Success modal** - Shows created count and per-venue breakdown

**Files Modified:**
- `frontend/src/components/MainLayout.jsx` - Updated navigation labels
- `frontend/src/pages/BatchCreatePapersPage.jsx` - Complete UI implementation
- `frontend/src/App.jsx` - Added batch create route

---

### 3. Documentation Updates

**Transaction Documentation:**
- Added `TX_BATCH_CREATE_PAPERS_WITH_AUTHORS` to `database/transactions.sql`
- Documented all 4 transactions in the system
- Included ACID properties and error handling for each

**README Updates:**
- Added "Advanced Database Features" section
- Documented batch transaction feature
- Listed all constraints, procedures, triggers, and transactions

**Files Modified:**
- `database/transactions.sql` - Added Transaction 3 documentation
- `README.md` - Comprehensive feature documentation

---

### 4. Bug Fixes

**Collation Issues:**
- Fixed mixed collation errors in stored procedures
- Added `COLLATE utf8mb4_unicode_ci` to all JOIN and WHERE clauses
- Updated connection pool configuration

**UI Fixes:**
- Removed AI branding ("AI Generated" badges)
- Changed "AI Recommended Papers" → "Related Papers"
- Fixed submit button widths in batch create page

**Files Modified:**
- `database/procedures.sql` - Added collation clauses
- `frontend/src/components/PaperModal.jsx` - Removed AI badges

---

## Database Schema

**No schema changes** - All new features work with existing tables:
- `Papers` - Stores paper metadata
- `Authorship` - Links papers to authors
- `Venues` - Conference/journal information
- `Projects` - Research projects
- `Datasets` - Dataset references
- `Users` - Author information

---

## Transaction Inventory

### Total: 4 Transactions

1. **`sp_delete_paper_safe`** (Database-level)
   - Atomic deletion with authorization check
   - Location: `database/procedures.sql`

2. **`TX_CREATE_PAPER_WITH_AUTHORS`** (Backend-level)
   - Single paper creation with authors
   - Location: `server.js` line 866

3. **`TX_BATCH_CREATE_PAPERS_WITH_AUTHORS`** ⭐ (Backend-level - Advanced)
   - Batch paper creation with advanced queries
   - Location: `server.js` line 1229

4. **`sp_create_ai_draft_paper`** (Database-level)
   - AI-generated draft creation
   - Location: `database/procedures.sql`

---

## Testing & Verification

**Batch Create Transaction Testing:**
- ✅ Successfully creates multiple papers atomically
- ✅ Validates all foreign keys before insertion
- ✅ Prevents duplicate titles in same venue with SELECT FOR UPDATE
- ✅ Returns per-venue summary with GROUP BY
- ✅ Rolls back on any error (FK violation, duplicate, etc.)

**UI Testing:**
- ✅ Collapsible cards work correctly
- ✅ Comma-separated author input parses correctly
- ✅ Success modal shows venue breakdown
- ✅ Validation errors display properly

---

## API Endpoints

### New Endpoint

**`POST /api/papers/batch-with-authors`**
```json
{
  "papers": [
    {
      "paper_title": "Paper Title",
      "abstract": "Abstract text",
      "pdf_url": "https://...",
      "status": "Under Review",
      "venue_id": "V001",
      "project_id": "PRJ001",
      "dataset_id": "DS001",
      "author_ids": ["U003", "U005"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created_count": 2,
  "paper_ids": ["P_...", "P_..."],
  "summary": [
    { "venue_name": "ICCV", "num_created": 1 },
    { "venue_name": "EMNLP", "num_created": 1 }
  ]
}
```

---

## Files Changed

### Backend
- `server.js` - Added batch create endpoint (+206 lines)

### Frontend
- `frontend/src/pages/BatchCreatePapersPage.jsx` - New page (474 lines)
- `frontend/src/components/MainLayout.jsx` - Updated navigation
- `frontend/src/components/PaperModal.jsx` - Removed AI branding
- `frontend/src/App.jsx` - Added batch route

### Database
- `database/transactions.sql` - Added Transaction 3 documentation (+147 lines)
- `database/procedures.sql` - Fixed collation issues

### Documentation
- `README.md` - Updated with new features

---

## Demo Instructions

### For TAs/Grading:

1. **Navigate to Batch Create:**
   - Click "Batch Other Authors' Papers" in top navigation

2. **Create Multiple Papers:**
   - Click "+ Add Paper" to add paper blocks
   - Fill in required fields (title, PDF URL, venue)
   - Enter comma-separated author IDs (e.g., "U003, U005")
   - Click "Submit Batch"

3. **View Transaction Code:**
   - Open `server.js` line 1229
   - See SELECT FOR UPDATE, JOIN validation, GROUP BY

4. **Check Documentation:**
   - `database/transactions.sql` - Transaction 3
   - `README.md` - Advanced Database Features section

---

## Advanced Database Features Summary

**Constraints:** 5 CHECK constraints  
**Triggers:** 3 triggers  
**Stored Procedures:** 4 procedures  
**Transactions:** 4 transactions (1 advanced)  

**Advanced Transaction Features:**
- ✅ SELECT FOR UPDATE (locking)
- ✅ JOIN-based validation
- ✅ Composite IN subqueries
- ✅ GROUP BY aggregation
- ✅ Write-heavy operations
- ✅ ACID compliance

---

## Next Steps

- [ ] Test batch create with 5+ papers
- [ ] Verify all transactions work correctly
- [ ] Run final demo walkthrough
- [ ] Commit all changes to repository

---

## Contact

**Team:** fa25-cs411-team126-ysql  
**Database:** GCP MySQL (research_paper_review_db)  
**Backend:** Node.js + Express  
**Frontend:** React + Vite
