# CI/CD Pipeline Lab (Jenkins + Docker + Git Branch Environments)

This repository is prepared for the Jenkins lab with two branch-based environments:

- `main` environment:
  - docker image: `nodemain:v1.0`
  - container name: `nodemain`
  - deployment URL: `http://localhost:3000`
- `dev` environment:
  - docker image: `nodedev:v1.0`
  - container name: `nodedev`
  - deployment URL: `http://localhost:3001`

The project uses a React demo app from `epam-msdp/cicd-pipeline` and branch-specific `src/logo.svg`.

## Jenkins pipeline files in this repo

- `Jenkinsfile` - multibranch pipeline for job name `CICD`
- `Jenkinsfile.manual` - manual pipeline for job name `CD_deploy_manual`
- `Jenkinsfile.deploy-main` - downstream deploy pipeline `Deploy_to_main`
- `Jenkinsfile.deploy-dev` - downstream deploy pipeline `Deploy_to_dev`
- `jenkins-shared-library/vars/*` - Shared Library helper functions (for documentation and reuse)

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

## Docker image naming

`DOCKERHUB_REPOSITORY` accepts either:

- `username`
- `username/repository`

In both cases, pipelines use the Docker Hub namespace (`username`) and always push/pull canonical image names:

- `username/nodemain:v1.0`
- `username/nodedev:v1.0`

## Main multibranch job (`CICD`)

Create a **Multibranch Pipeline** job:

1. Branch Source -> your GitHub repo.
2. Script Path -> `Jenkinsfile`.
3. Scan repository now.

Pipeline stages:

1. Checkout
2. Prepare environment by branch
3. Dockerfile lint with Hadolint
4. Build in Docker agent (`node:20-alpine`)
5. Test in Docker agent (`node:20-alpine`)
6. Build Docker image
7. Vulnerability scan with Trivy
8. Push to Docker Hub (if `DOCKERHUB_REPOSITORY` is set in Jenkins env)
9. Deploy container on branch port (only container for selected env is replaced)
10. Automatically trigger downstream deploy job for matching branch (`Deploy_to_main` / `Deploy_to_dev`)

Pipeline environment variables:

- `IMAGE_TAG` (default `v1.0`)
- `DOCKERHUB_REPOSITORY` (required for push and downstream jobs)
- `ENABLE_DOWNSTREAM_DEPLOY` (default `true`)

## Manual job (`CD_deploy_manual`)

Create a regular **Pipeline** job:

1. Definition -> Pipeline script from SCM (or paste file content).
2. Script path -> `Jenkinsfile.manual`.
3. Build with Parameters:
   - `TARGET_ENV` = `main` or `dev`
   - `IMAGE_TAG` = `v1.0`
   - `DOCKERHUB_REPOSITORY` optional (`username` or `username/repository`)

This job deploys only the selected environment container and does not remove unrelated env containers.

## Optional advanced deploy jobs

Create two regular Pipeline jobs:

- `Deploy_to_main` using `Jenkinsfile.deploy-main`
- `Deploy_to_dev` using `Jenkinsfile.deploy-dev`

Both jobs expect `DOCKERHUB_REPOSITORY` and `IMAGE_TAG`, pull canonical image names from Docker Hub, then deploy to:

- main: `3000 -> 3000`
- dev: `3001 -> 3000`

## Shared Library (documentation)

This repository includes a sample Shared Library skeleton in `jenkins-shared-library/vars/`:

- `cicdBranchConfig.groovy` - branch to environment mapping
- `cicdResolveImageName.groovy` - Docker image naming logic
- `cicdDeployContainer.groovy` - env-specific container replacement logic

To use it in Jenkins:

1. Create a separate repository for the Shared Library and copy `jenkins-shared-library/*` into its root.
2. In Jenkins: **Manage Jenkins -> System -> Global Trusted Pipeline Libraries**.
3. Add library (for example name `cicd-shared-lib`) and point to the Shared Library repository.
4. In pipelines, load with `@Library('cicd-shared-lib') _`.

## Branch-specific logo requirement

- `main` branch has main environment logo.
- `dev` branch has different dev environment logo.

After deployment, open the corresponding port and verify the logo differs by branch.
