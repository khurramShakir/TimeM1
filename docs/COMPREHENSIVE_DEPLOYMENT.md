# TimeM1 Comprehensive Deployment Guide

> [!IMPORTANT]
> **Definitive Source of Truth** for deployment. Do not guess. Follow these instructions exactly.

## 1. Core Configuration

*   **GCP Project ID**: `timebudget-2026`
*   **Cloud Run Service Name**: **`timem1`** (NOT `time-budget`)
*   **Region**: `us-central1`
*   **Build Method**: `cloudbuild.yaml` (Artifact Registry)
*   **Database**: Supabase (PostgreSQL) - connection string is a **SECRET** already set in the `timem1` service environment variables.

---

## 2. Deployment Process

### Step 1: Commit Changes
Ensure all changes are committed to the `main` branch.

```bash
git add .
git commit -m "feat: description of changes"
git push origin main
```

### Step 2: Build and Push Docker Image
Use Google Cloud Build with the existing configuration file. This builds the image and pushes it to Artifact Registry.

```bash
# Run from project root (c:\development\workspace\TimeM1)
gcloud builds submit --config cloudbuild.yaml .
```
*Wait for the build to complete successfully (Status: SUCCESS).*

### Step 3: Update Cloud Run Service
Deploy the new image to the **existing** service. This preserves all environment variables (like `DATABASE_URL`).

```bash
gcloud run services update timem1 \
  --image us-central1-docker.pkg.dev/time-budget-2026/cloud-run-source-deploy/timem1:latest \
  --region us-central1
```

> [!WARNING]
> **DO NOT use `gcloud run deploy --source .`**
> This command creates a *new* service revision from scratch and **wipes out** all environment variables (Database URL, Clerk Keys). Always use the `builds submit` + `services update` method above.

---

## 3. Environment Variables (Reference Only)
*These depend on the production service configuration. Do not change unless necessary.*

*   `DATABASE_URL`: `postgresql://postgres:[password]@[host].supabase.co:5432/postgres` (Secret)
*   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: `pk_test_...`
*   `CLERK_SECRET_KEY`: `sk_test_...`

---

## 4. Emergency Recovery: Lost Environment Variables

If environment variables are accidentally deleted (e.g., by creating a new service), you can recover them from a previous **successful** revision of the `timem1` service.

1.  **List previous revisions** to find a stable one (look for older timestamps):
    ```bash
    gcloud run revisions list --service timem1 --region us-central1
    ```

2.  **Export configuration** of the stable revision to a JSON file:
    ```bash
    gcloud run revisions describe [REVISION-NAME] --region us-central1 --format=json > recovery_env.json
    ```

3.  **Extract environment variables** (PowerShell example):
    ```powershell
    $json = Get-Content recovery_env.json | ConvertFrom-Json
    $json.spec.containers[0].env | Where-Object { $_.name -in @('DATABASE_URL', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') }
    ```

4.  **Re-apply variables** to the current service using the recovered values.

---

## 5. Troubleshooting

### "Container failed to start"
*   **Cause**: Usually missing environment variables (specifically `DATABASE_URL`).
*   **Fix**: Verify you are updating `timem1` and not creating a new service. Check revisions:
    ```bash
    gcloud run revisions list --service timem1 --region us-central1
    ```

### Wrong Service Name
*   If you accidentally deployed to `time-budget`, delete it immediately to avoid confusion:
    ```bash
    gcloud run services delete time-budget --region us-central1
    ```
