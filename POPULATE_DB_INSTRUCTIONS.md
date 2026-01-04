# Populate Database with 1000+ Papers

## Generated Data

The `populate_database.sql` file contains:
-  **200 users** (70% are reviewers)
-  **15 top CS conferences**: NeurIPS, ICCV, CVPR, ICML, ICLR, ACL, EMNLP, AAAI, SIGGRAPH, SIGKDD, WWW, SIGIR, CHI, SIGMOD, VLDB
-  **8 datasets**: ImageNet, COCO, GLUE, SQuAD, CIFAR-10, MNIST, WikiText, OpenImages
-  **50 research projects**
-  **1000 papers** with realistic titles and abstracts from ML/CV/NLP topics
-  **~3000 authorship records** (2-5 authors per paper)
-  **~2000 reviews** (only for published/under review papers)
-  **~500 related paper relationships**

## How to Populate

### Step 1: Upload to Cloud Shell

1. Open Cloud Shell: https://console.cloud.google.com/cloudshell
2. Click "Upload file" button
3. Upload `populate_database.sql`

### Step 2: Connect to Database

In Cloud Shell:
```bash
gcloud sql connect paperscope-db --user=team126
```

Password: `Team@126`

### Step 3: Run the SQL File

Once connected (you'll see `mysql>` prompt):
```sql
USE research_paper_review_db;
source populate_database.sql;
```

This will take a minute or two to insert all the data.

### Step 4: Verify

Check that data was inserted:
```sql
SELECT COUNT(*) FROM Papers;
-- Should show: 1000

SELECT COUNT(*) FROM Users;
-- Should show: 200

SELECT COUNT(*) FROM Reviews;
-- Should show: ~2000

SELECT COUNT(*) FROM Authorship;
-- Should show: ~3000
```

### Step 5: Exit

```sql
exit;
```

## Alternative: Run Directly

If you prefer, you can also run it directly:
```bash
mysql -h [YOUR_IP] -u team126 -pTeam@126 research_paper_review_db < populate_database.sql
```

## What You'll Get

- **Papers from top conferences**: NeurIPS, ICCV, CVPR, ICML, ICLR, ACL, etc.
- **Realistic titles**: "Efficient Deep Learning for Computer Vision", "Transformer-based NLP: Classification and Generation", etc.
- **Proper relationships**: Authors linked to papers, reviews linked to papers, etc.
- **Varied statuses**: 60% Published, 20% Under Review, 15% In Review, 5% Draft

## After Populating

Once the database is populated, your backend will have plenty of data to work with! Deploy and test:

```bash
SQL_INSTANCE_NAME="paperscope-db" ./deploy-backend.sh
```

