#!/bin/bash
# Deploy Backend API to Cloud Run

set -e

PROJECT_ID="gen-lang-client-0153916214"
REGION="us-central1"
SERVICE_NAME="paperscope-api"

# Set SQL_INSTANCE_NAME to use Unix socket connection (recommended)
# Leave empty to use IP connection (not working - timing out)
# To use Unix socket: SQL_INSTANCE_NAME="instance-name" ./deploy-backend.sh
SQL_INSTANCE_NAME="${SQL_INSTANCE_NAME:-}"

echo "🚀 Deploying Backend API to Cloud Run..."

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com --quiet

# Deploy to Cloud Run
echo "🔨 Building and deploying from root folder (using server.js)..."
# Deploy from root directory - uses server.js (matches local setup)

# Determine database connection method
DB_HOST="104.197.169.189"  # Your current Cloud SQL IP
CLOUDSQL_FLAG=""

if [ -n "$SQL_INSTANCE_NAME" ]; then
  echo "📊 Using Cloud SQL Unix socket connection..."
  CONNECTION_NAME=$(gcloud sql instances describe $SQL_INSTANCE_NAME --format="value(connectionName)" 2>/dev/null || echo "")
  
  if [ -z "$CONNECTION_NAME" ]; then
    echo "⚠️  Warning: Could not find Cloud SQL instance '$SQL_INSTANCE_NAME'"
    echo "   Falling back to IP connection (104.197.169.189)"
    DB_HOST="104.197.169.189"
  else
    echo "✅ Cloud SQL Connection: $CONNECTION_NAME"
    DB_HOST="/cloudsql/$CONNECTION_NAME"
    CLOUDSQL_FLAG="--add-cloudsql-instances=$CONNECTION_NAME"
  fi
else
  echo "📊 Using IP connection to Cloud SQL: $DB_HOST"
  echo "   (Database is in teammate's project - using IP connection)"
  echo ""
  echo "⚠️  IMPORTANT: Your teammate needs to add Cloud Run IP ranges to Cloud SQL authorized networks:"
  echo "   1. Go to GCP Console → SQL → [their instance] → Networking"
  echo "   2. Add authorized network: 0.0.0.0/0 (for testing) OR Cloud Run's specific IP ranges"
  echo "   3. Or ask them to share the instance with this project for Unix socket connection"
  echo ""
fi

# Grant Cloud Run service account Generative AI permissions (uses default service account)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "🔐 Granting Generative AI permissions to Cloud Run service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_RUN_SA}" \
  --role="roles/generativelanguage.developer" \
  --quiet 2>/dev/null || echo "✅ Permissions already set or being set..."

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --platform managed \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars=\"DB_HOST=$DB_HOST,DB_PORT=3306,DB_USER=team126,DB_PASSWORD=Team@126,DB_NAME=research_paper_review_db,GCP_PROJECT_ID=$PROJECT_ID,GCP_LOCATION=$REGION,VERTEX_AI_MODEL=gemini-2.5-flash\" \
  --project $PROJECT_ID"

# Add Cloud SQL flag if using Unix socket
if [ -n "$CLOUDSQL_FLAG" ]; then
  DEPLOY_CMD="$DEPLOY_CMD $CLOUDSQL_FLAG"
fi

eval $DEPLOY_CMD

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo ""
echo "✅ Backend deployed successfully!"
echo "📍 Service URL: $SERVICE_URL"
echo ""
echo "🧪 Test the deployment:"
echo "curl $SERVICE_URL/api/health"
echo ""
if [ "$DB_HOST" != "/cloudsql/"* ]; then
  echo "⚠️  Database Connection Note:"
  echo "   Your database is in a teammate's project. Make sure they've added"
  echo "   Cloud Run IP ranges to the Cloud SQL authorized networks."
  echo "   See DATABASE_SETUP.md for details."
  echo ""
fi

# Deployment complete - already in root directory

