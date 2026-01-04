#!/bin/bash
# Complete database setup script for Cloud SQL
# Creates instance, database, user, and schema matching existing master_setup.sql

set -e

PROJECT_ID="gen-lang-client-0153916214"
REGION="us-central1"
INSTANCE_NAME="paperscope-db"
DB_NAME="research_paper_review_db"
DB_USER="team126"
DB_PASSWORD="Team@126"
ROOT_PASSWORD="Team@126"

echo "🚀 Setting up Cloud SQL Database for PaperScope"
echo "   (Matching existing master_setup.sql schema)"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Step 1: Create Cloud SQL instance
echo "📦 Step 1: Creating Cloud SQL instance..."
if gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "   ✅ Instance '$INSTANCE_NAME' already exists. Skipping creation."
else
  echo "   Creating new instance (this may take 5-10 minutes)..."
  gcloud sql instances create $INSTANCE_NAME \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=$REGION \
    --root-password=$ROOT_PASSWORD \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --enable-bin-log \
    --project=$PROJECT_ID
  
  echo "   ✅ Instance created successfully!"
fi

# Wait for instance to be ready
echo "   ⏳ Waiting for instance to be ready (this can take 5-10 minutes)..."
INSTANCE_READY=false
for i in {1..60}; do
  STATE=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(state)" 2>/dev/null || echo "PENDING")
  if [ "$STATE" = "RUNNABLE" ]; then
    echo "   ✅ Instance is ready!"
    INSTANCE_READY=true
    break
  fi
  if [ $((i % 6)) -eq 0 ]; then
    echo "   Still waiting... (${i}0 seconds elapsed, current state: $STATE)"
  fi
  sleep 10
done

if [ "$INSTANCE_READY" = false ]; then
  echo "   ⚠️  Instance not ready after 10 minutes."
  echo "   Please wait and check status: gcloud sql instances describe $INSTANCE_NAME"
  echo "   Then re-run this script to continue with database creation."
  exit 1
fi

# Step 2: Create database
echo ""
echo "📦 Step 2: Creating database '$DB_NAME'..."
if gcloud sql databases describe $DB_NAME --instance=$INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "   ✅ Database '$DB_NAME' already exists. Skipping creation."
else
  gcloud sql databases create $DB_NAME \
    --instance=$INSTANCE_NAME \
    --project=$PROJECT_ID
  echo "   ✅ Database created successfully!"
fi

# Step 3: Create user
echo ""
echo "📦 Step 3: Creating user '$DB_USER'..."
if gcloud sql users describe $DB_USER --instance=$INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "   ✅ User '$DB_USER' already exists. Updating password..."
  gcloud sql users set-password $DB_USER \
    --instance=$INSTANCE_NAME \
    --password=$DB_PASSWORD \
    --project=$PROJECT_ID
else
  gcloud sql users create $DB_USER \
    --instance=$INSTANCE_NAME \
    --password=$DB_PASSWORD \
    --project=$PROJECT_ID
fi
echo "   ✅ User created/updated successfully!"

# Step 4: Get connection info
echo ""
echo "📦 Step 4: Getting connection information..."
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)" --project=$PROJECT_ID)
PUBLIC_IP=$(gcloud sql instances describe $INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)" --project=$PROJECT_ID)

echo "   Connection Name: $CONNECTION_NAME"
echo "   Public IP: $PUBLIC_IP"

# Step 5: Create schema
echo ""
echo "📦 Step 5: Creating database schema..."
echo "   This will connect to the database and run schema.sql"

# Check if mysql client is available
if command -v mysql &> /dev/null; then
  echo "   Using mysql client to create schema..."
  if mysql -h $PUBLIC_IP -u $DB_USER -p$DB_PASSWORD $DB_NAME < schema.sql 2>/dev/null; then
    echo "   ✅ Schema created successfully!"
  else
    echo "   ⚠️  Schema creation had issues. You may need to run it manually."
    echo "   Command: mysql -h $PUBLIC_IP -u $DB_USER -p$DB_PASSWORD $DB_NAME < schema.sql"
  fi
else
  echo "   ⚠️  mysql client not found. Please run schema manually:"
  echo ""
  echo "   Option 1: Install mysql client and run:"
  echo "   mysql -h $PUBLIC_IP -u $DB_USER -p$DB_PASSWORD $DB_NAME < schema.sql"
  echo ""
  echo "   Option 2: Use Cloud SQL Proxy:"
  echo "   1. Install: https://cloud.google.com/sql/docs/mysql/sql-proxy"
  echo "   2. Run: cloud-sql-proxy $CONNECTION_NAME"
  echo "   3. In another terminal: mysql -h 127.0.0.1 -u $DB_USER -p$DB_PASSWORD $DB_NAME < schema.sql"
  echo ""
  echo "   Option 3: Use Cloud Shell:"
  echo "   1. Upload schema.sql to Cloud Shell"
  echo "   2. Run: mysql -h $PUBLIC_IP -u $DB_USER -p$DB_PASSWORD $DB_NAME < schema.sql"
fi

# Summary
echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Summary:"
echo "   Instance: $INSTANCE_NAME"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Connection Name: $CONNECTION_NAME"
echo "   Public IP: $PUBLIC_IP"
echo ""
echo "🚀 Next steps:"
echo "   1. (Optional) Import data: Copy master_setup.sql data inserts if needed"
echo "   2. Deploy backend: SQL_INSTANCE_NAME=\"$INSTANCE_NAME\" ./deploy-backend.sh"
echo "   3. Test: curl https://paperscope-api-XXXXX-uc.a.run.app/api/health"
echo ""
