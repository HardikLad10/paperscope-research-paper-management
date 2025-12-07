# Quick Setup Verification Checklist

## ✅ What You Need to Verify:

### 1. GCP Project Setup
- [ ] You have a GCP project (either created or existing)
- [ ] Project is linked to billing account: https://console.cloud.google.com/billing/0128D1-7A3519-F384C1
- [ ] You know your **Project ID** (shown in project dropdown)

### 2. Vertex AI API
- [ ] Vertex AI API is enabled in your project
- [ ] Check: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
- [ ] Status should show "Enabled" (green checkmark)

### 3. Environment Variables
Check your `.env` file has:
- [ ] `GCP_PROJECT_ID=your-project-id-here`
- [ ] `GCP_LOCATION=us-central1` (or your preferred region)
- [ ] `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (already set)

### 4. Authentication
Choose one:
- [ ] **Option A:** Ran `gcloud auth application-default login`
- [ ] **Option B:** Set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

### 5. Test It!
- [ ] Start your server: `node server.js` or `npm start`
- [ ] Test health: `curl http://localhost:4000/api/health`
- [ ] Open frontend, login, view a paper
- [ ] Check if "Similar Papers" section appears

## 🚨 Common Issues:

**If you see "GCP_PROJECT_ID not set":**
- Add `GCP_PROJECT_ID=your-project-id` to `.env` file
- Restart server

**If you see "Failed to authenticate":**
- Run: `gcloud auth application-default login`
- Or set up service account credentials

**If you see "Vertex AI API not enabled":**
- Go enable it: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com

## 📝 Quick Test Command:

```bash
# Test if Vertex AI is configured (should return project ID or error)
node -e "require('dotenv').config(); console.log('Project ID:', process.env.GCP_PROJECT_ID || 'NOT SET')"
```

