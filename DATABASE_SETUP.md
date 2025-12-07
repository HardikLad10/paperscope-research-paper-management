# Database Connection Setup

## Current Setup

Your database is hosted in a **teammate's GCP project** and you're connecting via IP address:
- **IP:** `104.197.169.189`
- **Port:** `3306`
- **Database:** `research_paper_review_db`

## For Cloud Run Deployment

When deploying to Cloud Run, your teammate needs to configure the Cloud SQL instance to allow connections from Cloud Run.

### Option 1: Add Cloud Run IP Ranges (Recommended for IP Connection)

Your teammate should:

1. **Go to GCP Console:**
   - Navigate to: SQL → [their Cloud SQL instance] → **Networking**

2. **Add Authorized Network:**
   - Click "Add Network"
   - For testing: Add `0.0.0.0/0` (allows all IPs - **not secure for production**)
   - For production: Add Cloud Run's specific IP ranges:
     - `107.178.240.0/20`
     - `35.199.192.0/19`
     - `35.199.224.0/20`
     - `35.199.240.0/20`
     - `35.199.248.0/22`
     - `35.199.252.0/23`
     - `35.199.254.0/24`
     - `35.199.255.0/24`

3. **Save changes**

### Option 2: Share Cloud SQL Instance (Better for Production)

If both projects are in the same GCP organization, your teammate can:

1. **Share the instance with your project:**
   ```bash
   # In teammate's project
   gcloud sql instances patch [INSTANCE_NAME] \
     --database-flags=cloudsql.iam_authentication=on
   ```

2. **Grant access:**
   ```bash
   # Grant your project's service account access
   gcloud projects add-iam-policy-binding [TEAMMATE_PROJECT_ID] \
     --member="serviceAccount:[YOUR_PROJECT_NUMBER]@cloudservices.gserviceaccount.com" \
     --role="roles/cloudsql.client"
   ```

3. **Then you can use Unix socket connection:**
   ```bash
   SQL_INSTANCE_NAME=[INSTANCE_NAME] ./deploy-backend.sh
   ```

### Option 3: Use VPC Connector (Most Secure)

If both projects are in the same organization:

1. **Create a VPC connector** in your project
2. **Connect Cloud Run to VPC**
3. **Use private IP** for Cloud SQL connection

## Current Deployment

The deployment script (`deploy-backend.sh`) is configured to use **IP connection** by default, which works as long as your teammate has added the authorized networks.

## Testing Connection

After deployment, test the connection:

```bash
# Get your backend URL
BACKEND_URL=$(gcloud run services describe paperscope-api --region us-central1 --format="value(status.url)")

# Test health endpoint
curl $BACKEND_URL/api/health
```

If you get connection errors, ask your teammate to check:
- Cloud SQL instance is running
- Authorized networks include Cloud Run IPs
- Firewall rules allow port 3306

