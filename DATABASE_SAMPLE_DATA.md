# Research Paper Review Database - Sample Data

This document shows sample data from each table in the local MySQL database.

---

## Table: Users

Sample user account information.

| user_id | user_name    | email         | password | affiliation | profile_url    | is_reviewer |
|---------|--------------|---------------|----------|-------------|----------------|-------------|
| U001    | Ada Lovelace | ada@cs411.edu | Ada@123  | UIUC        | https://ex/ada | 1           |

**Total Records:** 10 users (U001 - U010)

**Login Credentials for Testing:**
- Username: `U001` | Password: `Ada@123` (Ada Lovelace - Reviewer)
- Username: `U002` | Password: `Edsger@123` (Edsger Dijkstra)
- Username: `U003` | Password: `Grace@123` (Grace Hopper - Reviewer)
- Username: `U005` | Password: `Liskov@123` (Barbara Liskov - Reviewer)
- Username: `U010` | Password: `Tim@123` (Tim Berners-Lee - Reviewer)

---

## Table: Venues

Conference and journal venues where papers are published.

| venue_id | venue_name | venue_type | publisher | year |
|----------|------------|------------|-----------|------|
| V001     | ICDE       | Conference | IEEE      | 2023 |

**Total Records:** 6 venues (V001 - V006)

---

## Table: Datasets

Datasets used in research papers.

| dataset_id | dataset_name | dataset_url           | domain | access_type |
|------------|--------------|------------------------|--------|-------------|
| D001       | TPC-H        | https://tpc.org/tpch/ | OLAP   | public      |

**Total Records:** 5 datasets (D001 - D005)

---

## Table: Projects

Research projects that produce papers.

| project_id | project_title     | description                     | project_date |
|------------|-------------------|---------------------------------|--------------|
| PR001      | Join Optimization | Cost-based join order and hints | 2024-09-01   |

**Total Records:** 5 projects (PR001 - PR005)

---

## Table: Papers

Research papers with their metadata.

| paper_id | paper_title                 | abstract                | pdf_url        | upload_timestamp    | status    | venue_id | dataset_id | project_id |
|----------|-----------------------------|-------------------------|----------------|---------------------|-----------|----------|------------|------------|
| P001     | Efficient Joins in Practice | We study join orders... | /pdfs/p001.pdf | 2024-10-12 09:00:00 | Published | V001     | D001       | PR001      |

**Total Records:** 17 papers (P001 - P017)

**Paper Statuses:**
- Published
- Under Review
- Draft

---

## Table: Authorship

Links users (authors) to their papers.

| user_id | paper_id |
|---------|----------|
| U001    | P001     |

**Total Records:** 27 authorship relationships

**Note:** Papers can have multiple authors, and users can author multiple papers.

---

## Table: Reviews

Peer reviews submitted for papers.

| review_id | user_id | paper_id | comment                   | review_timestamp    |
|-----------|---------|----------|---------------------------|---------------------|
| R001      | U001    | P001     | Solid experimental design | 2025-02-01 10:00:00 |

**Total Records:** 26 reviews (R001 - R026)

---

## Table: RelatedPapers

Links papers that are related to each other.

| paper_id | related_paper_id |
|----------|------------------|
| P001     | P002             |

**Total Records:** 6 related paper relationships

---

## Database Summary

- **Database Name:** `research_paper_review_db`
- **Character Set:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`
- **Total Tables:** 8

### Table Statistics:
- Users: 10 records
- Venues: 6 records
- Datasets: 5 records
- Projects: 5 records
- Papers: 17 records
- Authorship: 27 records
- Reviews: 26 records
- RelatedPapers: 6 records

---

## Connection Information

### Local MySQL Configuration

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root1234
DB_NAME=research_paper_review_db
```

### Application URLs

- **Backend API:** http://localhost:4000
- **Frontend:** http://localhost:5173 (or http://localhost:3002)
- **Health Check:** http://localhost:4000/api/health

---

## Quick Start

1. **Start MySQL Server** (via System Settings preference pane)

2. **Start Backend:**
   ```bash
   cd /Users/bganesh2/Desktop/fa25-cs411-team126-ysql
   node server.js
   ```

3. **Start Frontend** (in a new terminal):
   ```bash
   cd /Users/bganesh2/Desktop/fa25-cs411-team126-ysql/frontend
   npm run dev
   ```

4. **Login** with any test credentials listed above

---

*Last Updated: December 7, 2025*

