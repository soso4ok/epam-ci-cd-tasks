pipeline {
  agent any

  tools {
    nodejs "Node 7.8.0"
  }

  environment {
    IMAGE_TAG = "v1.0"
    APP_INTERNAL_PORT = "3000"
    DOCKERHUB_REPOSITORY = ""
    TRIGGER_DEPLOY_JOBS = "false"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare environment') {
      steps {
        script {
          if (env.BRANCH_NAME == 'main') {
            env.TARGET_ENV = 'main'
            env.IMAGE_BASE = 'nodemain'
            env.CONTAINER_NAME = 'node-main'
            env.APP_PORT = '3000'
          } else if (env.BRANCH_NAME == 'dev') {
            env.TARGET_ENV = 'dev'
            env.IMAGE_BASE = 'nodedev'
            env.CONTAINER_NAME = 'node-dev'
            env.APP_PORT = '3001'
          } else {
            error("Unsupported branch '${env.BRANCH_NAME}'. Use main or dev.")
          }

          env.IMAGE_NAME = "${env.IMAGE_BASE}:${env.IMAGE_TAG}"
          if (env.DOCKERHUB_REPOSITORY?.trim()) {
            if (env.DOCKERHUB_REPOSITORY.contains('/')) {
              env.DOCKER_REMOTE_IMAGE = "${env.DOCKERHUB_REPOSITORY}:${env.IMAGE_BASE}-${env.IMAGE_TAG}"
            } else {
              env.DOCKER_REMOTE_IMAGE = "${env.DOCKERHUB_REPOSITORY}/${env.IMAGE_BASE}:${env.IMAGE_TAG}"
            }
          }

          echo "Environment: ${env.TARGET_ENV}"
          echo "Port: ${env.APP_PORT}"
          echo "Local image: ${env.IMAGE_NAME}"
          if (env.DOCKER_REMOTE_IMAGE?.trim()) {
            echo "Remote image: ${env.DOCKER_REMOTE_IMAGE}"
          }
        }
      }
    }

    stage('Build') {
      steps {
        sh 'npm install'
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        sh 'CI=true npm test -- --watchAll=false'
      }
    }

    stage('Build Docker image') {
      steps {
        sh 'docker build -t ${IMAGE_NAME} .'
      }
    }

    stage('Push Docker image') {
      when {
        expression { return env.DOCKERHUB_REPOSITORY?.trim() }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            set -e
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker tag ${IMAGE_NAME} ${DOCKER_REMOTE_IMAGE}
            docker push ${DOCKER_REMOTE_IMAGE}
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          set -e
          if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            docker rm -f ${CONTAINER_NAME}
          fi
          docker run -d --name ${CONTAINER_NAME} -e PORT=${APP_INTERNAL_PORT} -p ${APP_PORT}:${APP_INTERNAL_PORT} ${IMAGE_NAME}
        '''
      }
    }

    stage('Trigger environment deployment job') {
      when {
        expression { return env.TRIGGER_DEPLOY_JOBS == 'true' }
      }
      steps {
        script {
          def targetJob = (env.TARGET_ENV == 'main') ? 'Deploy_to_main' : 'Deploy_to_dev'
          build job: targetJob,
            wait: false,
            propagate: false,
            parameters: [
              string(name: 'IMAGE_TAG', value: env.IMAGE_TAG),
              string(name: 'DOCKERHUB_REPOSITORY', value: env.DOCKERHUB_REPOSITORY ?: '')
            ]
        }
      }
    }
  }
}
