# Auto-Deploy on Main Branch Merge

## Overview

Set up automatic deployment to Google Cloud Platform (Cloud Run) whenever code is merged to the `main` branch. This uses Google Cloud Build triggers integrated with your GitHub repository.

## Current State

Your project already has:
- ✅ [cloudbuild.yaml](file:///c:/development/workspace/TimeM1/time-budget/cloudbuild.yaml) - Build configuration for GCP
- ✅ [Dockerfile](file:///c:/development/workspace/TimeM1/time-budget/Dockerfile) - Multi-stage Docker build with Prisma migrations
- ✅ Cloud Run deployment setup (image: `us-central1-docker.pkg.dev`)
- ✅ GitHub repository: `khurramShakir/TimeM1`

## User Review Required

> [!IMPORTANT]
> **Cloud Build Trigger Setup Method**
> 
> You have two options for setting up the trigger:
> 
> **Option 1: Google Cloud Console (Recommended - No code changes)**
> - Manual setup through GCP Console UI
> - One-time configuration
> - No files to commit
> - Takes 5-10 minutes
> 
> **Option 2: Terraform/gcloud CLI (Code-based)**
> - Configuration as code
> - Can be version controlled
> - Requires `gcloud` CLI setup
> - More complex initial setup
> 
> Which option would you prefer?

> [!WARNING]
> **Branch Strategy Consideration**
> 
> Based on conversation history, you use:
> - `dev` branch for local development
> - `release/release-YYYDDMM` branches for releases
> 
> Should we trigger deployments on:
> 1. **Merges to `main` only** (manual promotion from dev → main)
> 2. **Merges to release branches** (e.g., `release/release-*`)
> 3. **Both main and release branches**

## Proposed Changes

### Option 1: Google Cloud Console Setup (Recommended)

#### Manual Configuration Steps

**No code changes required.** Configuration done through GCP Console:

1. **Connect GitHub Repository** (one-time setup)
   - Navigate to Cloud Build → Triggers in GCP Console
   - Click "Connect Repository"
   - Authenticate with GitHub
   - Select repository: `khurramShakir/TimeM1`

2. **Create Cloud Build Trigger**
   - **Name**: `deploy-main-to-cloud-run`
   - **Event**: Push to a branch
   - **Branch pattern**: `^main$` (or your preferred pattern)
   - **Build Configuration**: Cloud Build configuration file
   - **Cloud Build file location**: `time-budget/cloudbuild.yaml`
   - **Substitution variables**: 
     - `_CLERK_KEY`: (already in cloudbuild.yaml)
   - **Service account**: Default or custom with Cloud Run deployment permissions

3. **Add Cloud Run Deployment Step** (optional enhancement)
   - Can add automatic deployment to Cloud Run service after image build

---

### Option 2: CLI/Terraform Setup

#### [NEW] [.gcp/trigger-config.yaml](file:///c:/development/workspace/TimeM1/.gcp/trigger-config.yaml)

Create a trigger configuration file:

```yaml
name: deploy-main-to-cloud-run
description: Auto-deploy to Cloud Run when code is merged to main
github:
  owner: khurramShakir
  name: TimeM1
  push:
    branch: ^main$
filename: time-budget/cloudbuild.yaml
substitutions:
  _CLERK_KEY: pk_test_c21pbGluZy1sb25naG9ybi01MS5jbGVyay5hY2NvdW50cy5kZXYk
```

Apply with:
```bash
gcloud builds triggers create github \
  --config=.gcp/trigger-config.yaml \
  --project=YOUR_PROJECT_ID
```

---

### Enhancement: Add Cloud Run Deployment to cloudbuild.yaml

#### [MODIFY] [cloudbuild.yaml](file:///c:/development/workspace/TimeM1/time-budget/cloudbuild.yaml)

Add a deployment step to automatically update the Cloud Run service:

```yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: [
    'build',
    '--no-cache',
    '--build-arg', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${_CLERK_KEY}',
    '-t', 'us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/timem1:latest',
    '.'
  ]
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/timem1:latest']
  
# NEW: Deploy to Cloud Run automatically
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args:
  - 'run'
  - 'deploy'
  - 'timem1'  # Your Cloud Run service name
  - '--image=us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/timem1:latest'
  - '--region=us-central1'
  - '--platform=managed'
  - '--allow-unauthenticated'
  
images:
- 'us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/timem1:latest'

substitutions:
  _CLERK_KEY: 'pk_test_c21pbGluZy1sb25naG9ybi01MS5jbGVyay5hY2NvdW50cy5kZXYk'
```

> [!NOTE]
> You'll need to replace `timem1` with your actual Cloud Run service name if different.

---

## Verification Plan

### Manual Verification

1. **Test the trigger setup**:
   - Make a small change to a non-critical file (e.g., README update)
   - Commit to `dev` branch
   - Create a Pull Request to `main`
   - Merge the PR
   - Monitor Cloud Build console for automatic trigger
   
2. **Verify deployment**:
   - Check Cloud Build logs: `https://console.cloud.google.com/cloud-build/builds`
   - Verify Cloud Run service updated: `https://console.cloud.google.com/run`
   - Visit your production URL to confirm the change is live

3. **Expected flow**:
   ```
   dev branch → PR to main → Merge → Cloud Build trigger → 
   Build Docker image → Push to Artifact Registry → 
   Deploy to Cloud Run → Service updated
   ```

### Commands to Check Status

```bash
# List all Cloud Build triggers
gcloud builds triggers list --project=time-budget-2026

# View recent builds
gcloud builds list --limit=5 --project=time-budget-2026

# Check Cloud Run service status
gcloud run services describe timem1 --region=us-central1 --project=time-budget-2026
```

---

## Questions for You

1. **Trigger Setup**: Do you prefer Option 1 (Console UI) or Option 2 (CLI/code)?
2. **Branch Pattern**: Should deployment trigger on `main`, release branches, or both?
3. **Cloud Run Service Name**: What is your Cloud Run service name? (needed for deployment step)
4. **Project ID**: What is your GCP project ID?
5. **Automatic Deployment**: Should we add the Cloud Run deployment step to `cloudbuild.yaml`, or just build/push the image?
