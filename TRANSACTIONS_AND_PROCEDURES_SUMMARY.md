# Transactions and Stored Procedures Summary

## 📋 Overview
This document explains all the **transactions** and **stored procedures** in our research paper review system in simple, easy-to-understand language.

---

## 🔄 TRANSACTIONS

Transactions ensure that multiple database operations happen **all together or not at all**. Think of it like buying groceries - you either pay for everything and take it all home, or you don't pay and leave everything behind. You can't pay for half your groceries and leave with only some items.

### Transaction 1: `sp_delete_paper_safe` (Safe Paper Deletion)
**Location:** Database stored procedure  
**What it does:** Safely deletes a paper and everything related to it

**In Simple Words:**
- When you want to delete a paper, this transaction makes sure:
  1. ✅ You're actually an author of that paper (security check)
  2. ✅ The paper has no co-authors (can't delete if others worked on it)
  3. ✅ Then it deletes everything in one go:
     - All reviews for that paper
     - All links to related papers
     - All author connections
     - The paper itself

**Why it's a transaction:** If any step fails, nothing gets deleted. This prevents orphaned data (like reviews without a paper).

**Where you use it:** Delete button on "My Papers" page

---

### Transaction 2: `TX_CREATE_PAPER_WITH_AUTHORS` (Create Paper with Authors)
**Location:** Backend API (`server.js`)  
**What it does:** Creates a new paper and links all authors to it

**In Simple Words:**
- When you create a paper, this transaction:
  1. Generates a unique paper ID
  2. Creates the paper record
  3. Links all authors to the paper (one by one)
  4. If anything fails, nothing gets created

**Why it's a transaction:** You can't have a paper without authors, or authors linked to a paper that doesn't exist. It's all or nothing.

**Where you use it:** "Create Paper" page

---

### Transaction 3: `TX_BATCH_CREATE_PAPERS_WITH_AUTHORS` (Batch Create Multiple Papers)
**Location:** Backend API (`server.js`)  
**What it does:** Creates multiple papers with their authors all at once

**In Simple Words:**
- This is like Transaction 2, but for multiple papers at once:
  1. Validates all the data first (venues, projects, datasets, authors exist)
  2. Checks for duplicate paper titles
  3. Creates all papers and links all authors
  4. Returns a summary of what was created

**Why it's a transaction:** If creating 10 papers and the 7th one fails, all 10 are cancelled. This keeps your data consistent.

**Special Features:**
- Uses row-level locking to prevent duplicate titles
- Validates all foreign keys before creating anything
- Provides a summary grouped by venue

**Where you use it:** "Batch Create Papers" page

---

## 📦 STORED PROCEDURES

Stored procedures are pre-written SQL code that you can call like a function. They're like recipes - you give them ingredients (parameters) and they cook up the result.

### Procedure 1: `sp_author_insights` (Author Statistics Dashboard)
**What it does:** Gives you a complete overview of an author's research activity

**In Simple Words:**
This procedure is like a personal research report card. It tells you:
- 📊 **Total papers** the author has written
- 📝 **Total reviews** their papers have received
- 📈 **Average reviews per paper** (how popular their work is)
- 🏆 **Top 5 most reviewed papers** (their most popular work)
- 📅 **Year-by-year breakdown** (how many papers and reviews each year)
- 📌 **Status breakdown** (how many papers in Draft, Under Review, Accepted, etc.)

**Returns:** 4 different result sets with all this information

**Where you use it:** "Author Insights" page - shows your research statistics

---

### Procedure 2: `sp_author_portfolio_with_coauthors` (My Papers with Co-Authors)
**What it does:** Shows all your papers with information about co-authors

**In Simple Words:**
This is like a portfolio view of all your papers. For each paper, it shows:
- Paper details (title, upload date, status, PDF link)
- Project information (if the paper is part of a project)
- How many reviews the paper has received
- How many co-authors you worked with
- A comma-separated list of all co-author names

**Why it's useful:** You can see all your work at a glance, including who you collaborated with.

**Where you use it:** "My Papers" page - shows your complete paper portfolio

---

### Procedure 3: `sp_delete_paper_safe` (Safe Paper Deletion)
**What it does:** Safely deletes a paper (this is also a transaction!)

**In Simple Words:**
- Checks if you're an author (security)
- Checks if there are co-authors (can't delete if others worked on it)
- Deletes everything related to the paper in one transaction:
  - Reviews
  - Related paper links
  - Author connections
  - The paper itself

**Why "safe":** It prevents accidental deletions and ensures data integrity.

**Where you use it:** Delete button on "My Papers" page

---

### Procedure 4: `sp_create_ai_draft_paper` (Create AI-Generated Draft)
**What it does:** Creates a draft paper that was generated by AI

**In Simple Words:**
When the AI system suggests a new paper idea based on an existing paper, this procedure:
1. Takes the source paper's venue information
2. Creates a new draft paper with status "AI_DRAFT"
3. Links you as the author
4. Creates a relationship link showing this draft came from the AI recommendation

**Special features:**
- Marks the paper as `ai_generated = 1`
- Links back to the source paper for traceability
- Uses a placeholder PDF URL since it's just a draft

**Where you use it:** When you accept an AI recommendation to create a draft paper

---

## 🔒 ACID Properties (What Makes Transactions Safe)

All our transactions follow ACID principles:

- **Atomicity:** All operations succeed together or fail together (all or nothing)
- **Consistency:** Data always follows the rules (foreign keys, constraints)
- **Isolation:** Multiple users can work at the same time without interfering
- **Durability:** Once saved, the data is permanent (won't disappear)

---

## 📍 Quick Reference

| Name | Type | Purpose | Location |
|------|------|---------|----------|
| `sp_delete_paper_safe` | Transaction + Procedure | Delete paper safely | Database |
| `TX_CREATE_PAPER_WITH_AUTHORS` | Transaction | Create one paper with authors | Backend API |
| `TX_BATCH_CREATE_PAPERS_WITH_AUTHORS` | Transaction | Create multiple papers | Backend API |
| `sp_author_insights` | Procedure | Get author statistics | Database |
| `sp_author_portfolio_with_coauthors` | Procedure | Get papers with co-author info | Database |
| `sp_create_ai_draft_paper` | Procedure | Create AI-generated draft | Database |

---

## 🎯 Summary in One Sentence Each

- **sp_delete_paper_safe:** Safely deletes a paper and all its related data if you're the only author
- **TX_CREATE_PAPER_WITH_AUTHORS:** Creates a new paper and links all authors to it atomically
- **TX_BATCH_CREATE_PAPERS_WITH_AUTHORS:** Creates multiple papers with authors in one transaction
- **sp_author_insights:** Generates a comprehensive research statistics report for an author
- **sp_author_portfolio_with_coauthors:** Lists all your papers with co-author and review information
- **sp_create_ai_draft_paper:** Creates an AI-generated draft paper linked to a source paper



