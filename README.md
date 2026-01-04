# Research Paper Review Database

Full-stack application for managing research papers, reviews, and author insights.

## 🚀 Live Demo

**Application URL:** [https://paperscope-frontend-ahrq6r24nq-uc.a.run.app](https://paperscope-frontend-ahrq6r24nq-uc.a.run.app)

### Demo Login Credentials

For reviewers and interviewers to test the application:

- **Username:** `U001`
- **Password:** `Emery@123`

**Note:** This is a public demo instance. The application includes:
- Full paper management (create, edit, delete, search)
- Author insights and portfolio tracking
- Peer review system
- AI-powered paper recommendations (Google Gemini LLM)
- Batch paper creation with advanced transactions

---

## Features

- Paper management (create, edit, delete, search)
- Author insights and portfolio tracking
- Review system for peer review
- AI-powered paper recommendations
- **Batch paper creation with advanced transaction support**

## Technology Stack

- **Backend:** Node.js + Express
- **Database:** MySQL (GCP Cloud SQL)
- **Frontend:** React + Vite
- **AI:** Google Vertex AI (Gemini 2.5 Flash)
- **Deployment:** Google Cloud Platform (Cloud Run)

## Setup

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- GCP account (for Vertex AI)

### Installation

1. Clone the repository
2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend && npm install
```

4. Configure environment variables in `.env`:
```
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=research_paper_review_db
GCP_PROJECT_ID=your_project_id
```

5. Initialize database:
```bash
mysql -h <host> -u <user> -p < database/master_setup.sql
```

6. Start the application:
```bash
# Backend (terminal 1)
node server.js

# Frontend (terminal 2)
cd frontend && npm run dev
```

## Advanced Database Features

### Transaction Feature: Batch Paper Creation

- **Endpoint:** `POST /api/papers/batch-with-authors`
- **UI:** Navigate to "Batch Create" tab
- **Behavior:**
  - Wraps full batch in one transaction at `READ COMMITTED` isolation level
  - Uses `SELECT ... FOR UPDATE` on Papers table to prevent duplicate titles
  - Validates all foreign keys (venues, projects, datasets, authors) with JOIN queries
  - Checks per-paper uniqueness (venue + title) using subqueries
  - Aggregates creation summary with `GROUP BY` for UI feedback
  - **Atomic:** Either all papers are created or none (rollback on any error)

**Advanced Queries Used:**
1. Foreign key validation with multiple JOINs
2. Duplicate detection with composite IN subquery + FOR UPDATE lock
3. Summary aggregation with GROUP BY for per-venue counts

**Files:**
- Backend: `server.js` (line ~945)
- Frontend: `frontend/src/pages/BatchCreatePapersPage.jsx`
- Documentation: `database/transactions.sql`

### Database Constraints

**CHECK Constraints (5 total):**
1. `chk_papers_timestamp_when_active` - Active papers must have timestamps
2. `chk_reviews_comment_nonempty` - Reviews must have non-empty comments
3. `chk_users_email_format` - Emails must contain '@' and '.'
4. `chk_no_self_relation` - Papers cannot relate to themselves
5. `chk_ai_flag` - Validates AI-generated flag

**Files:** `database/constraints.sql`

### Stored Procedures

1. `sp_delete_paper_safe` - Atomic paper deletion with authorization check
2. `sp_author_insights` - Author statistics and metrics
3. `sp_author_portfolio_with_coauthors` - Portfolio with co-author details
4. `sp_create_ai_draft_paper` - AI-generated paper creation

**Files:** `database/procedures.sql`

### Triggers

1. `trg_reviews_set_timestamp` - Auto-set review timestamps
2. `trg_no_self_review` - Prevent authors from reviewing their own papers
3. `trg_ai_paper_before_update` - Validate AI drafts before promotion

**Files:** `database/triggers.sql`

## API Endpoints

### Papers
- `GET /api/papers` - Search papers
- `GET /api/papers/:id` - Get paper details
- `POST /api/papers/with-authors` - Create single paper
- **`POST /api/papers/batch-with-authors`** - **Batch create papers (transaction)**
- `PUT /api/papers/:id` - Update paper
- `DELETE /api/papers/:id` - Delete paper

### Reviews
- `GET /api/reviewable-papers` - Get papers available for review (with pagination)
- `POST /api/papers/:id/reviews` - Submit review

### Authors
- `GET /api/authors/:id/insights` - Get author insights
- `GET /api/authors/:id/portfolio` - Get author portfolio

## Documentation

All advanced database features are documented in the `adv_database_feature/` directory:
- `constraints.txt` - All database constraints
- `procedures.txt` - Stored procedures
- `triggers.txt` - Database triggers
- `transactions.txt` - Transaction documentation

Auto-generate documentation:
```bash
./generate_db_docs.sh
```

## License

MIT
