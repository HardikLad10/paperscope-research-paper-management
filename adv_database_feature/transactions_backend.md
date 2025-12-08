## TX_CREATE_PAPER_WITH_AUTHORS (Backend Transaction)

**Location:** `server.js`, POST `/api/papers/with-authors`  
**Purpose:** Atomically create a new paper and its authorship rows.

### Isolation Level
```javascript
await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
await conn.beginTransaction();
```

### Steps

1. **Generate a new paper_id** with uuidv4():
```javascript
const paperId = "P_" + uuidv4();
```

2. **Insert the paper**:
```sql
INSERT INTO Papers (paper_id, paper_title, abstract, pdf_url,
                    upload_timestamp, status, venue_id, project_id, dataset_id)
VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)
```

3. **Insert one row into Authorship** for each author_id:
```sql
INSERT INTO Authorship (user_id, paper_id) VALUES (?, ?)
```

4. **On success:** `await conn.commit();`
5. **On any error:** `await conn.rollback();` and return an error to the UI.

### Error Handling
- `ER_NO_REFERENCED_ROW[_2]` → FK violation (bad venue/project/dataset/user)
- `ER_DUP_ENTRY` → unique constraint error (same title in same venue)
- Any other error → generic "Failed to create paper"

### ACID Properties
- **Atomicity:** Paper + all authors created together or not at all
- **Consistency:** PK/FK + `uq_papers_venue_title` enforced by the DB
- **Isolation:** READ COMMITTED avoids dirty reads
- **Durability:** InnoDB guarantees committed changes are persisted

### UI Access
Accessible via the "Create Paper" page in the application.

---

## Summary of Transactions

We have **two transactions** in the system:

1. **sp_delete_paper_safe** (Database-level)
   - Location: Stored procedure in `database/procedures.sql`
   - Purpose: Atomically delete a paper and all related records
   - Isolation: READ COMMITTED
   - UI Access: Delete button on My Papers page

2. **TX_CREATE_PAPER_WITH_AUTHORS** (Backend-level)
   - Location: `server.js`, POST `/api/papers/with-authors`
   - Purpose: Atomically create a paper with multiple authors
   - Isolation: READ COMMITTED
   - UI Access: Create Paper page

Both transactions are fully accessible from the UI and demonstrate proper ACID compliance.
