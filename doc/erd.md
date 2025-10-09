# Entities

User – Represents a registered account. Each user can upload papers and write reviews. Chosen as an entity since users have multiple attributes (name, email, role) and relationships.

Author – Represents an author of the paper. Made separate from User because users can have different roles (author, reviewer or even both (of different papers)).

Paper – Central research artifact containing title, abstract, and upload info. Modeled as an entity since many users, reviews, datasets, and venues relate to it.

Venue – Journal or conference where papers are published. Entity form enables reuse and links to multiple papers.

Dataset – Independent resource used by multiple papers. Stored separately for reuse and provenance tracking.

Project – Groups papers/datasets under one initiative. Entity chosen because it aggregates many resources and has its own metadata.

Review – Represents user evaluations of papers. Entity form allows multiple reviews per paper with timestamps and text.


# Relationships & Cardinalities

User–Paper: One user uploads many papers; each paper is uploaded by exactly one user.

Paper–Author: Many-to-many (a paper can have several authors; an author can write many papers).

Paper–Venue: Many papers can be published at one venue; each paper belongs to only one venue.

Paper–Paper: Many-to-many (papers can reference or relate to multiple other papers). (used by related papers or referenced papers)

Paper–Dataset: One paper can have one dataset; a dataset can be referenced by multiple papers.

Project–Paper: One project can have multiple papers; each paper belongs to only one project.

User–Review–Paper: One review is written by one user for one paper; a paper can have multiple reviews.
1 review can have one comment; paper can have multiple reviews

# Key Assumptions

Each paper has exactly one uploader for accountability.

A paper is tied to one venue edition.

Reviews are authored by unique user–paper pairs.

Authors and users are separate roles for flexibility.

Datasets and projects are reusable, hence modeled independently.
