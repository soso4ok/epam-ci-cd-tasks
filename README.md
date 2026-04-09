# CI/CD Pipeline Lab (Jenkins + Docker + Git Branch Environments)

This repository is prepared for the Jenkins lab with two branch-based environments:

- `main` environment:
  - docker image: `nodemain:v1.0`
  - deployment URL: `http://localhost:3000`
- `dev` environment:
  - docker image: `nodedev:v1.0`
  - deployment URL: `http://localhost:3001`

The project uses a React demo app from `epam-msdp/cicd-pipeline` and branch-specific `src/logo.svg`.

## Jenkins pipeline files in this repo

- `Jenkinsfile` - multibranch pipeline for job name `CICD`
- `Jenkinsfile.manual` - manual pipeline for job name `CD_deploy_manual`
- `Jenkinsfile.deploy-main` - optional downstream deploy pipeline `Deploy_to_main`
- `Jenkinsfile.deploy-dev` - optional downstream deploy pipeline `Deploy_to_dev`

## Required Jenkins setup

1. Install plugins:
   - Docker Pipeline
   - Docker plugin
   - Git plugin
   - Groovy
   - NodeJS plugin
   - Pipeline
2. Configure **Global Tool Configuration**:
   - NodeJS installation name: `Node 7.8.0`
3. Configure credentials:
   - Docker Hub credentials ID: `dockerhub-creds`
   - GitHub token credential for SCM access/webhooks (if needed)

## Main multibranch job (`CICD`)

Create a **Multibranch Pipeline** job:

1. Branch Source -> your GitHub repo.
2. Script Path -> `Jenkinsfile`.
3. Scan repository now.

Pipeline stages:

1. Checkout
2. Prepare environment by branch
3. Build (`npm install`, `npm run build`)
4. Test (`CI=true npm test -- --watchAll=false`)
5. Build Docker image
6. Optional push to Docker Hub (if `DOCKERHUB_REPOSITORY` is set in Jenkins env)
7. Deploy container on branch port
8. Optional trigger of downstream jobs (`Deploy_to_main` / `Deploy_to_dev`) if `TRIGGER_DEPLOY_JOBS=true`

## Manual job (`CD_deploy_manual`)

Create a regular **Pipeline** job:

1. Definition -> Pipeline script from SCM (or paste file content).
2. Script path -> `Jenkinsfile.manual`.
3. Build with Parameters:
   - `TARGET_ENV` = `main` or `dev`
   - `IMAGE_TAG` = `v1.0`
   - `DOCKERHUB_REPOSITORY` optional (`username/repository`)

This job deploys only the selected environment container and does not remove unrelated env containers.

## Optional advanced deploy jobs

Create two regular Pipeline jobs:

- `Deploy_to_main` using `Jenkinsfile.deploy-main`
- `Deploy_to_dev` using `Jenkinsfile.deploy-dev`

Both jobs expect `DOCKERHUB_REPOSITORY` and `IMAGE_TAG`, pull from Docker Hub, then deploy to:

- main: `3000 -> 3000`
- dev: `3001 -> 3000`

## Branch-specific logo requirement

- `main` branch has main environment logo.
- `dev` branch has different dev environment logo.

After deployment, open the corresponding port and verify the logo differs by branch.
