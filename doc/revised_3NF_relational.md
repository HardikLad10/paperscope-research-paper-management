## FDs

We have the following FDs for our design.

- Users (`UID -> profile_url, email, user_name, affiliation`)
- Papers (`PAID -> PRID, DID, VID, paper_title, abstract, pdf_url, upload_timestamp, status`)
- Projects (`PRID -> project_title, desc, project_timestamp`)
- Datasets (`DID -> dataset_name, dataset_url, domain, access_type`)
- Venues (`VID -> venue_name, venue_type, publisher, year`)
- Reviews (`RID -> UID, PAID, comment, review_timestamp`)
- Authors (authoring relation `UID, PAID -> UID, PAID` trivial FD states the pair exists)
- RelatedPapers (`PAID, RelatedPAID -> PAID, RelatedPAID` relationship for related-paper links, also a trivial FD)

For simplicty, we've used the following for PKs:
UID = user_id, RID = review_id, PAID = paper_id, PRID = project_id, DID = dataset_id, VID = venue_id

## 3NF proof

3NF condition: for any FD X -> A in a relation R, at least one of:
1. X is a superkey of R, or
2. A is a prime attribute (member of some candidate key of R), or
3. A is part of a key

We will verify for each relation and the FDs that apply inside it:

1. Users(UID, profile_url, email, user_name, affiliation)

FD: `UID -> profile_url,email,user_name,affiliation`

UID is the primary key (superkey) -> satisfies 3NF.

2. Papers(PAID, PRID, DID, VID, paper_title, abstract, pdf_url, upload_timestamp, status)

FD: `PAID -> PRID,DID,VID,paper_title,abstract,pdf_url,upload_timestamp,status`

PAID is PK (superkey) -> satisfies 3NF.

3. Projects(PRID, project_title, desc, project_timestamp)

FD: `PRID -> project_title, desc, project_timestamp`

PRID is PK (superkey) -> satisfies 3NF.

4. Datasets(DID, dataset_name, dataset_url, domain, access_type)

FD: `DID -> dataset_name,dataset_url,domain,access_type`

DID is PK (superkey) -> satisfies 3NF.

5. Venues(VID, venue_name, venue_type, publisher, year)

FD: `VID -> venue_name,venue_type,publisher,year`

VID is PK (superkey) -> satisfies 3NF.

6. Reviews(RID, UID, PAID, comment, review_timestamp)

FD: `RID -> UID, PAID, comment, review_timestamp`

RID is PK (superkey) -> satisfies 3NF.

Note: UID and PAID are FKs to Users and Papers, foreign-key relationships do not break 3NF.

7. Authors(UID, PAID)

This relation represents the authoring relationship; the FD UID,PAID -> UID,PAID is trivial.

Candidate key = (UID, PAID). No non-key attributes, so trivially in 3NF.

8. RelatedPapers(PAID, RelatedPAID)

This stores related-paper pairs. Candidate key = (PAID, RelatedPAID); trivial FD only. No non-key attributes → 3NF.

Because every non-key attribute in each relation is fully functionally dependent on a key of that relation (and every determinant used is a key for that relation), the decomposition is in 3NF.


## Relational Schema

Users(UID:INT [PK], profile_url:VARCHAR(255), email:VARCHAR(255), user_name:VARCHAR(255), affiliation:VARCHAR(255))

Papers(PAID:INT [PK], PRID:INT [FK to Projects.PRID], DID:INT [FK to Datasets.DID], VID:INT [FK to Venues.VID], paper_title:VARCHAR(255), abstract:TEXT, pdf_url:VARCHAR(255), upload_timestamp:DATETIME, status:VARCHAR(50))

Projects(PRID:INT [PK], project_title:VARCHAR(255), desc:TEXT, project_timestamp:DATETIME)

Datasets(DID:INT [PK], dataset_name:VARCHAR(255), dataset_url:VARCHAR(255), domain:VARCHAR(255), access_type:VARCHAR(255))

Venues(VID:INT [PK], venue_name:VARCHAR(255), venue_type:VARCHAR(255), publisher:VARCHAR(255), year:INT)

Reviews(RID:INT [PK], UID:INT [FK to Users.UID], PAID:INT [FK to Papers.PAID], comment:TEXT, review_timestamp:DATETIME)

Authors(UID:INT [FK to Users.UID], PAID:INT [FK to Papers.PAID], PRIMARY_KEY(UID, PAID))

RelatedPapers(PAID:INT [FK to Papers.PAID], RelatedPAID:INT [FK to Papers.PAID], PRIMARY_KEY(PAID, RelatedPAID))
