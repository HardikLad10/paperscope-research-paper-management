# Internal Paper review system

# Project Summary

The Internal Paper Review System aims to simplify the process of reviewing unpublished research papers within an organization. Authors can easily upload their papers/manuscripts to receive organized feedback from a team of peers, allowing for early evaluation before sending their work out for external review.

By keeping all submissions and reviews in one platform, the system promotes constructive criticism, knowledge sharing, and overall improvement in quality. Multiple reviewers can provide input on each paper, ensuring a variety of perspectives and a comprehensive assessment. This collaborative approach ultimately enhances the standard of research produced.

# Creative

- Integrate with the OpenAlex or OpenReview API to fetch related papers based on keywords/abstracts.
- Store fetched metadata in our DB and link it with uploaded manuscripts.
- semantic similarity on paper titles and abstracts (e.g., PostgreSQL tsvector) to recommend similar papers.
- User Benefit: Reviewers see related prior work, making their feedback more informed.

# Usefulness

The Internal Paper Review System is useful because it allows authors to receive structured, early feedback on unpublished research from a trusted internal team. This helps improve paper quality before external submission and fosters collaboration within an organization.

Basic functions include:
- Paper Submission: Authors upload manuscripts with metadata like title, abstract, and keywords.
- Reviewing & Feedback: Reviewers submit structured comments and scores, and authors can view aggregated feedback.
- Search & Filtering: Users can browse submissions.
- Recommendation: We will show related papers to reviewers so they can form a better review

Similar platforms like OpenReview.net and journal management systems exist, but our system focuses on internal collaboration, making it private, simple, and analytics-driven.

# Realness

We will use [OpenReview API](https://docs.openreview.net/reference/api-v1/openapi-definition) for the dataset.

# Functionality

The Internal Paper Review System enables authors, reviewers to manage papers and reviews efficiently.

Authors:

- Add/Insert: Submit papers (title, abstract, keywords, co-authors).
- Update: Edit paper details
- View/Search: Track submissions, view reviewer feedback

Reviewers:

- View/Search: Browse submitted papers.
- Add/Insert: Submit structured reviews (comments).
- Update: Edit reviews.

## Work distribution

Satwik -> Recommendation related
Chitsimran -> Database design
Hardik -> SQL queries
Bharath -> APIs and extraction

