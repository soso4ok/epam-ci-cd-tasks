pipeline {
  agent any

  options {
    timestamps()
  }

  environment {
    CI = "true"
    IMAGE_TAG = "v1.0"
    APP_INTERNAL_PORT = "3000"
    DOCKERHUB_REPOSITORY = ""
    ENABLE_DOWNSTREAM_DEPLOY = "true"
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
            env.CONTAINER_NAME = 'nodemain'
            env.APP_PORT = '3000'
            env.APP_EXPOSE_PORT = '3000'
          } else if (env.BRANCH_NAME == 'dev') {
            env.TARGET_ENV = 'dev'
            env.IMAGE_BASE = 'nodedev'
            env.CONTAINER_NAME = 'nodedev'
            env.APP_PORT = '3001'
            env.APP_EXPOSE_PORT = '3001'
          } else {
            error("Unsupported branch '${env.BRANCH_NAME}'. Use main or dev.")
          }

          env.IMAGE_NAME = "${env.IMAGE_BASE}:${env.IMAGE_TAG}"
          env.DOCKER_REMOTE_IMAGE = ""
          env.DOCKERHUB_EFFECTIVE_NAMESPACE = ""

          echo "Environment: ${env.TARGET_ENV}"
          echo "Port: ${env.APP_PORT}"
          echo "Local image: ${env.IMAGE_NAME}"
          if (env.DOCKER_REMOTE_IMAGE?.trim()) {
            echo "Remote image: ${env.DOCKER_REMOTE_IMAGE}"
          }
        }
      }
    }

    stage('Dockerfile lint (Hadolint)') {
      agent {
        docker {
          image 'hadolint/hadolint:latest-debian'
          reuseNode true
        }
      }
      steps {
        sh 'hadolint --failure-threshold error Dockerfile'
      }
    }

    stage('Build') {
      agent {
        docker {
          image 'node:20-alpine'
          reuseNode true
        }
      }
      steps {
        sh 'npm install'
      }
    }

    stage('Test') {
      agent {
        docker {
          image 'node:20-alpine'
          reuseNode true
        }
      }
      steps {
        sh 'npm test'
      }
    }

    stage('Build Docker image') {
      steps {
        sh 'docker build -t ${IMAGE_NAME} .'
      }
    }

    stage('Vulnerability scan (Trivy)') {
      steps {
        sh '''
          set -e
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy:0.56.2 image --no-progress --severity HIGH,CRITICAL --exit-code 0 ${IMAGE_NAME}
        '''
      }
    }

    stage('Push Docker image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          script {
            def configuredNamespace = env.DOCKERHUB_REPOSITORY?.trim()
            def dockerNamespace = configuredNamespace ? configuredNamespace.tokenize('/')[0] : env.DOCKER_USER
            env.DOCKERHUB_EFFECTIVE_NAMESPACE = dockerNamespace
            env.DOCKER_REMOTE_IMAGE = "${dockerNamespace}/${env.IMAGE_BASE}:${env.IMAGE_TAG}"
            echo "Resolved Docker image for push: ${env.DOCKER_REMOTE_IMAGE}"
          }
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
          docker run -d --name ${CONTAINER_NAME} --expose ${APP_EXPOSE_PORT} -e PORT=${APP_INTERNAL_PORT} -p ${APP_PORT}:${APP_INTERNAL_PORT} ${IMAGE_NAME}
        '''
      }
    }

    stage('Trigger environment deployment job') {
      when {
        expression {
          return env.ENABLE_DOWNSTREAM_DEPLOY == 'true'
        }
      }
      steps {
        script {
          def targetJob = (env.TARGET_ENV == 'main') ? 'Deploy_to_main' : 'Deploy_to_dev'
          build job: targetJob,
            wait: false,
            propagate: false,
            parameters: [
              string(name: 'IMAGE_TAG', value: env.IMAGE_TAG),
              string(name: 'DOCKERHUB_REPOSITORY', value: env.DOCKERHUB_EFFECTIVE_NAMESPACE ?: env.DOCKERHUB_REPOSITORY ?: '')
            ]
        }
      }
    }
  }
}
