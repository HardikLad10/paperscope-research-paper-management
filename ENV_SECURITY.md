# Environment Variables & Security

## Your .env File is NOT Uploaded to GCP ✅

The `.env` file stays on your local machine and is **never** uploaded to GCP.

## How It Works

### Local Development
- Uses `.env` file (stays on your computer)
- Contains: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.

### Cloud Run Deployment
- Environment variables are set **directly in the deployment command**
- Using `--set-env-vars` flag in `gcloud run deploy`
- The `.env` file is **not** used or uploaded

## What Gets Deployed

Looking at `deploy-backend.sh`, environment variables are set like this:

```bash
--set-env-vars="DB_HOST=...,DB_USER=...,DB_PASSWORD=..."
```

These are set **in the command**, not from your `.env` file.

## Security Best Practices

### ✅ What's Safe
- `.env` file stays local (in `.gitignore`)
- Environment variables in Cloud Run are encrypted at rest
- Only accessible to your Cloud Run service

### ⚠️ What to Watch
- The deployment script contains credentials in plain text
- Anyone with access to the script can see the values
- Consider using **Secret Manager** for sensitive values

## For Your Friend's Database

When connecting to your friend's database:
- The credentials are set in the deployment command
- They're stored as environment variables in Cloud Run
- They're **not** in your `.env` file (unless you're testing locally)

## Using Secret Manager (More Secure)

For production, you could use GCP Secret Manager:

```bash
# Create secrets
gcloud secrets create db-password --data-file=-
# (paste password, then Ctrl+D)

# Reference in deployment
--set-secrets="DB_PASSWORD=db-password:latest"
```

But for now, the current approach (direct env vars) is fine for development.

## Summary

- ✅ `.env` file never leaves your computer
- ✅ Environment variables are set in deployment command
- ✅ Cloud Run stores them securely (encrypted)
- ⚠️ Script contains credentials (but that's normal for deployment scripts)

