# Vertex AI Setup Guide

## Step 0: Verify Your Billing Account and Project

**IMPORTANT:** Make sure you're using the project linked to your $50 credit billing account.

### Check Your Billing Account:
1. Go to your billing account: https://console.cloud.google.com/billing/0128D1-7A3519-F384C1
2. Look at the **"Linked projects"** section to see which project(s) are linked
3. Note the **Project ID** of the project with billing enabled

**✅ Your Credit Status:**
- Credit: "Database Systems aug25" 
- Status: Available
- Amount: $50.00 (100% remaining)
- Valid until: August 25, 2026
- Usage scope: Any service on this billing account
- This credit will automatically apply to Vertex AI usage!

### Verify Current Project:
1. In Google Cloud Console, look at the **project dropdown** at the top (next to "Google Cloud")
2. Click on it to see all your projects
3. **Select the project** that's linked to your billing account (from Step 0.1)
4. You should see the project name/ID in the top bar

### Verify Billing is Active:
1. In the billing account page, check:
   - Status should be **"Active"**
   - You should see your **$50 credit** amount
   - The project should be listed under "Linked projects"

**If you don't have a project yet:**
1. Click **"Create Project"** in the top bar
2. Give it a name (e.g., "cs411-papers")
3. After creation, go back to billing: https://console.cloud.google.com/billing/0128D1-7A3519-F384C1
4. Click **"Link a project"** and select your new project

## Step 1: Enable Vertex AI API in GCP

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Make sure the correct project is selected** (check the dropdown at the top)
3. Navigate to **APIs & Services** > **Library**
4. Search for **"Vertex AI API"**
5. Click on it and press **"Enable"**
6. Wait for it to enable (may take 1-2 minutes)

## Step 2: Get Your GCP Project ID

1. In Google Cloud Console, look at the **project dropdown** at the top
2. The **Project ID** is shown in the dropdown (it's usually a string like `my-project-123456`)
3. **Copy this Project ID** - you'll need it for the `.env` file
4. Alternative: Go to **IAM & Admin** > **Settings** to see your Project ID and Project Number
5. **Double-check:** Make sure this is the same project linked to your billing account (from Step 0)

## Step 3: Set Up Authentication

### Option A: Application Default Credentials (Easiest for Local Development)

```bash
# Install gcloud CLI if you haven't
# macOS: brew install google-cloud-sdk
# Or download from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### Option B: Service Account (Recommended for Production)

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **"Create Service Account"**
3. Give it a name (e.g., "vertex-ai-service")
4. Grant it the role: **"Vertex AI User"**
5. Click **"Create Key"** > Choose **JSON**
6. Save the JSON file securely
7. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

## Step 4: Configure Environment Variables

Add these to your `.env` file in the root directory:

```bash
# Existing database config (you already have these)
DB_HOST=104.197.169.189
DB_PORT=3306
DB_USER=team126
DB_PASSWORD=Team@126
DB_NAME=research_paper_review_db
PORT=4000

# NEW: Vertex AI Configuration
GCP_PROJECT_ID=your-project-id-here
GCP_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-pro

# Optional: If using service account (Option B)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Step 5: Test the Setup

1. **Start your server:**
   ```bash
   cd api
   npm start
   # Or from root:
   node server.js
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:4000/api/health
   ```

3. **Test recommendations (after viewing a paper in the frontend):**
   - Open your frontend
   - Login and navigate to any paper
   - The recommendations should load automatically
   - Or test directly:
     ```bash
     curl http://localhost:4000/api/papers/P001/recommendations
     ```

## Troubleshooting

### Error: "GCP_PROJECT_ID not set"
- Make sure you added `GCP_PROJECT_ID` to your `.env` file
- Restart your server after adding it

### Error: "Failed to authenticate with GCP"
- If using Option A: Run `gcloud auth application-default login`
- If using Option B: Check that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid JSON file
- Make sure the service account has "Vertex AI User" role

### Error: "Vertex AI API not enabled"
- Go back to Step 1 and enable the Vertex AI API
- Wait a few minutes for it to propagate

### Error: "Permission denied" or "403"
- Make sure your service account (or user account) has the "Vertex AI User" role
- Check that billing is enabled on your project

## Cost Information

- Vertex AI Gemini Pro pricing (approximate):
  - Input: ~$0.00025 per 1K characters
  - Output: ~$0.0005 per 1K characters
- With $50 credit, you can make thousands of recommendation calls
- Monitor usage in: [GCP Console Billing](https://console.cloud.google.com/billing)

## Next Steps

Once everything is configured:
1. ✅ Your server should start without errors
2. ✅ View any paper in the frontend
3. ✅ See "Similar Papers" section with AI-powered recommendations
4. ✅ Click on recommended papers to navigate to them

Enjoy your AI-powered paper recommendations! 🎉

