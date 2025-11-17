# Revised Part 1 – Stage 3: Indexing Changes

This note summarizes **what we changed** in the indexing work for Stage 3 and **what we decided to keep**. The goal was to try small, targeted indexes on JOIN and WHERE columns, measure with `EXPLAIN ANALYZE`, and retain only the designs that consistently helped.

## Q1: Authorship × Papers × Reviews (per‑user, recent uploads, count reviews)
**Tried**
- `Papers(upload_timestamp, project_id, paper_id)` to support the date filter and final sort.
- `Reviews(paper_id, review_id)` to cover the left join count.
- `Authorship(user_id, paper_id)` to combine the filter and join key.

**Outcome**
- All three were faster than baseline in our runs. The biggest cross‑query win comes from indexing **Reviews on the join key**.
- For a shared schema across queries, we prefer **`Reviews(paper_id, review_timestamp)`** (chosen for Q3–Q4) since it still performs well here while also helping the other queries.

## Q2: Venues × Papers (year filter, count per venue)
**Tried**
- `Venues(year)` (filter column).
- `Papers(venue_id, status)` and the reverse order `Papers(status, venue_id)`.
- `Papers(status)` alone.

**Outcome**
- The planner continued to scan `Venues` and filter `year`, so `Venues(year)` did not change the plan.
- **`Papers(venue_id, status)`** gave a covering lookup on the join plus the `Published` filter and was the best performer.
- The reverse order and `status` alone were slower.

## Q3: Users × Authorship × Reviews (reviewers within a date range)
**Tried**
- `Users(is_reviewer)`.
- `Reviews(review_timestamp, paper_id)`.
- `Reviews(paper_id, review_timestamp)`.
- `Reviews(paper_id, review_timestamp, review_id)`.

**Outcome**
- Filtering on a small `Users` table made `Users(is_reviewer)` unnecessary.
- **`Reviews(paper_id, review_timestamp)`** was consistently strong: it enables tight lookups by paper and efficient filtering by timestamp, improving latency versus baseline.
- The triple‑column variant did not improve beyond the two‑column version.

## Q4: Authorship × Papers ⟕ Reviews (per‑author, count reviews and latest timestamp)
**Tried**
- `Reviews(paper_id, review_timestamp)`.
- `Papers(paper_id, paper_title)`.
- `Reviews(paper_id, review_id)`.

**Outcome**
- **`Reviews(paper_id, review_timestamp)`** again helped the aggregation (count + max) with efficient access by paper and timestamp.
- Extra indexes on `Papers` did not change the plan because the PK already covers the join and projection.

## Final index set to keep
- **Reviews(paper_id, review_timestamp)** — shared win for Q3 and Q4; neutral to positive for Q1.
- **Papers(venue_id, status)** — clear win for Q2.

## Optional (keep only if Q1 is a heavy workload)
- `Papers(upload_timestamp, project_id, paper_id)` — helps Q1’s date filter and sort; otherwise can be omitted to reduce index bloat.

## Clean‑up
- We dropped experimental indexes that did not help (e.g., `Venues(year)`, `Papers(status)`, `Papers(status, venue_id)`, `Users(is_reviewer)`) and retained only the two core winners above.
- Primary keys and existing foreign‑key/leftmost indexes remain unchanged.
