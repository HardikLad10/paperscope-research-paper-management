# GCP Authentication Setup

## Current Error:
```
Failed to authenticate with GCP. Please configure GOOGLE_APPLICATION_CREDENTIALS or run 'gcloud auth application-default login'.
```

## Solution: Choose One Method

###  Method 1: Service Account (Recommended - No Installation)

**Step 1: Create Service Account**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=gen-lang-client-0153916214
2. Click **"Create Service Account"**
3. Name: `vertex-ai-service`
4. Click **"Create and Continue"**

**Step 2: Grant Permissions**
1. Role: Select **"Vertex AI User"**
2. Click **"Continue"** then **"Done"**

**Step 3: Create Key**
1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **"JSON"**
5. Click **"Create"** - file will download automatically

**Step 4: Add to .env**
1. Move the downloaded JSON file to a safe location (e.g., `~/gcp-keys/vertex-ai-key.json`)
2. Add to your `.env` file:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/Users/satwikm/gcp-keys/vertex-ai-key.json
   ```
   (Use the actual path where you saved the file)

**Step 5: Restart Server**
```bash
# Stop your server (Ctrl+C) and restart
node server.js
```

---

### Method 2: Install gcloud CLI (Alternative)

**Step 1: Install gcloud**
```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

**Step 2: Authenticate**
```bash
gcloud auth application-default login
gcloud config set project gen-lang-client-0153916214
```

**Step 3: Restart Server**
```bash
node server.js
```

---

## Quick Test After Setup

Once you've set up authentication, test it:

```bash
# Start your server
node server.js

# In another terminal, test recommendations
curl http://localhost:4000/api/papers/P001/recommendations
```

If it works, you should see JSON with recommended papers (or an empty array if no papers match).

---

## Troubleshooting

**Still getting authentication error?**
- Make sure the JSON file path in `.env` is correct (use absolute path)
- Make sure the service account has "Vertex AI User" role
- Restart your server after adding `GOOGLE_APPLICATION_CREDENTIALS`
- Check file permissions: `chmod 600 /path/to/key.json`

**"Permission denied" error?**
- Make sure Vertex AI API is enabled
- Verify service account has correct role
- Check that project is linked to billing account

