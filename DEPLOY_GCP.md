# Deploy to Google Cloud Platform (GCP)

This guide will help you deploy both the backend API and frontend to GCP using Cloud Run.

## 🚀 Quick Start

1. **Install gcloud CLI** (if not installed):
   ```bash
   brew install google-cloud-sdk  # macOS
   ```

2. **Login and set project**:
   ```bash
   gcloud auth login
   gcloud config set project gen-lang-client-0153916214
   ```

3. **Deploy Backend**:
   ```bash
   ./deploy-backend.sh
   ```
   Copy the service URL from the output.

4. **Deploy Frontend**:
   ```bash
   ./deploy-frontend.sh https://YOUR-BACKEND-URL
   ```

That's it! Your app will be live on GCP. 

---

## Prerequisites

1. **GCP Project**: `gen-lang-client-0153916214` (already set up)
2. **Billing**: Enabled with $50 credit 
3. **gcloud CLI**: Install if not already installed
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```
4. **Docker**: Not required - Cloud Run builds from source automatically

## Step 1: Install and Configure gcloud CLI

```bash
# Login to GCP
gcloud auth login

# Set your project
gcloud config set project gen-lang-client-0153916214

# The deployment script will enable required APIs automatically
# Or enable them manually:
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com sqladmin.googleapis.com generativelanguage.googleapis.com --quiet
```

## Step 2: Quick Deployment (Recommended)

The easiest way is to use the provided deployment scripts:

### Deploy Backend API:

```bash
./deploy-backend.sh
```

This script will:
-  Enable required GCP APIs
-  Build and deploy to Cloud Run
-  Configure Cloud SQL connection
-  Set all environment variables
-  Grant necessary permissions
-  Return your service URL

### Deploy Frontend:

After backend is deployed, get the backend URL and deploy frontend:

```bash
# Get your backend URL from the deployment output
BACKEND_URL="https://paperscope-api-XXXXX-uc.a.run.app"

# Deploy frontend
./deploy-frontend.sh $BACKEND_URL
```

---

## Manual Deployment (Alternative)

If you prefer to deploy manually:

## Step 3: Deploy Backend API to Cloud Run

### Option A: Deploy from Source (Recommended)

```bash
# From the root directory
cd api

# Deploy to Cloud Run
gcloud run deploy paperscope-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DB_HOST=104.197.169.189,DB_PORT=3306,DB_USER=team126,DB_PASSWORD=Team@126,DB_NAME=research_paper_review_db,GCP_PROJECT_ID=gen-lang-client-0153916214,GCP_LOCATION=us-central1,VERTEX_AI_MODEL=gemini-2.5-flash" \
  --set-secrets="GOOGLE_APPLICATION_CREDENTIALS=service-account-key:latest"
```

### Option B: Deploy with Dockerfile

1. Create a Dockerfile in the `api` directory
2. Build and deploy:
   ```bash
   gcloud builds submit --tag gcr.io/gen-lang-client-0153916214/paperscope-api
   gcloud run deploy paperscope-api \
     --image gcr.io/gen-lang-client-0153916214/paperscope-api \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Step 4: Set Up Service Account for Cloud Run

### Option A: Use Cloud Run's Default Service Account (Easier)

Grant the default Cloud Run service account the necessary permissions:

```bash
# Get the default Cloud Run service account
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
PROJECT_NUMBER=$(gcloud projects describe gen-lang-client-0153916214 --format="value(projectNumber)")

# Grant Generative AI permissions
gcloud projects add-iam-policy-binding gen-lang-client-0153916214 \
  --member="serviceAccount:${CLOUD_RUN_SA}" \
  --role="roles/aiplatform.user"

# Grant Secret Manager access (if using secrets)
gcloud projects add-iam-policy-binding gen-lang-client-0153916214 \
  --member="serviceAccount:${CLOUD_RUN_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

### Option B: Use Service Account Key as Secret

```bash
# Create a secret from your service account key
gcloud secrets create service-account-key \
  --data-file=gen-lang-client-0153916214-f9f301e26425.json \
  --project=gen-lang-client-0153916214

# The deployment script will mount this secret automatically
```

## Step 5: Deploy Frontend to Cloud Run

The frontend can also be deployed to Cloud Run or Cloud Storage.

### Option A: Cloud Run (Recommended)

```bash
cd frontend

# Build the frontend
npm run build

# Deploy to Cloud Run
gcloud run deploy paperscope-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="VITE_API_BASE_URL=https://paperscope-api-XXXXX-uc.a.run.app"
```

### Option B: Cloud Storage + Cloud CDN (Static Hosting)

```bash
# Build frontend
cd frontend
npm run build

# Create a bucket
gsutil mb gs://paperscope-frontend

# Upload files
gsutil -m cp -r dist/* gs://paperscope-frontend/

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://paperscope-frontend

# Enable static website hosting
gsutil web set -m index.html -e index.html gs://paperscope-frontend
```

## Step 6: Configure Cloud SQL Access

The deployment script automatically configures Cloud SQL access. If you need to do it manually:

```bash
# Get your Cloud SQL instance connection name
CONNECTION_NAME=$(gcloud sql instances describe mysqlteam126 --format="value(connectionName)")

# Connect Cloud Run to Cloud SQL (already done in deploy script)
gcloud run services update paperscope-api \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --region us-central1
```

**Note:** When using Cloud SQL via Unix socket (`/cloudsql/CONNECTION_NAME`), the DB_HOST should be set to the connection name path, not the IP address.

## Step 7: Quick Deployment

Use the provided deployment scripts:

### Deploy Backend:
```bash
./deploy-backend.sh
```

This will:
- Enable required APIs
- Build and deploy to Cloud Run
- Configure Cloud SQL connection
- Set all environment variables
- Return the service URL

### Deploy Frontend:
```bash
# First, get your backend URL from the backend deployment
BACKEND_URL="https://paperscope-api-XXXXX-uc.a.run.app"

# Deploy frontend
./deploy-frontend.sh $BACKEND_URL
```

Or manually update environment variables:

```bash
gcloud run services update paperscope-api \
  --update-env-vars="DB_HOST=/cloudsql/YOUR_CONNECTION_NAME,DB_PORT=3306,DB_USER=team126,DB_PASSWORD=Team@126,DB_NAME=research_paper_review_db,GCP_PROJECT_ID=gen-lang-client-0153916214,GCP_LOCATION=us-central1,VERTEX_AI_MODEL=gemini-2.5-flash" \
  --region us-central1
```

## Step 8: Test Deployment

```bash
# Get your service URL
gcloud run services describe paperscope-api --region us-central1 --format="value(status.url)"

# Test the API
curl https://YOUR-SERVICE-URL/api/health
```

## Quick Deployment Script

I'll create deployment scripts to automate this process.

## Troubleshooting

- **Connection Issues**: Make sure Cloud SQL instance allows connections from Cloud Run
- **Authentication Errors**: Verify service account has correct permissions
- **Build Errors**: Check Cloud Build logs in GCP Console

