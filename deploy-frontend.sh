#!/bin/bash
# Deploy Frontend to Cloud Run

set -e

PROJECT_ID="gen-lang-client-0153916214"
REGION="us-central1"
SERVICE_NAME="paperscope-frontend"
BACKEND_URL="${1:-https://paperscope-api-XXXXX-uc.a.run.app}"  # Pass backend URL as argument

echo "🚀 Deploying Frontend to Cloud Run..."

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com --quiet

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
cd frontend

# Create .env.production file for build (Vite reads this during build)
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env.production

echo "   Using backend URL: $BACKEND_URL"
echo "   Created .env.production with: VITE_API_BASE_URL=$BACKEND_URL"
echo "   This file will be copied into Docker and used during Vite build"

# Deploy using source (Cloud Build will handle the build)
# The .env.production file will be copied into the Docker image and Vite will read it
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --platform managed \
  --memory 256Mi \
  --cpu 1 \
  --timeout 60 \
  --set-build-env-vars="VITE_API_BASE_URL=$BACKEND_URL" \
  --project $PROJECT_ID

# Note: We keep .env.production in the repo so it gets copied into Docker
# The build-env-vars is a backup, but .env.production takes precedence

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo ""
echo "✅ Frontend deployed successfully!"
echo "📍 Service URL: $SERVICE_URL"
echo ""
echo "🌐 Open in browser: $SERVICE_URL"

cd ..

