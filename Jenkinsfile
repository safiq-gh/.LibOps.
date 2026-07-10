pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS_ID = 'docker-hub-credentials'
        DOCKER_IMAGE_BACKEND = 'myorg/libops-backend'
        DOCKER_IMAGE_FRONTEND = 'myorg/libops-frontend'
        SONARQUBE_SCANNER_HOME = tool 'SonarQubeScanner'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Quality Checks') {
            steps {
                sh '''
                chmod +x scripts/quality.sh
                ./scripts/quality.sh
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQubeServer') {
                    sh "${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner"
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE_BACKEND}:${env.BUILD_ID} -t ${DOCKER_IMAGE_BACKEND}:latest ./backend"
                sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:${env.BUILD_ID} -t ${DOCKER_IMAGE_FRONTEND}:latest ./frontend"
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDENTIALS_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh 'echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin'
                    sh "docker push ${DOCKER_IMAGE_BACKEND}:${env.BUILD_ID}"
                    sh "docker push ${DOCKER_IMAGE_BACKEND}:latest"
                    sh "docker push ${DOCKER_IMAGE_FRONTEND}:${env.BUILD_ID}"
                    sh "docker push ${DOCKER_IMAGE_FRONTEND}:latest"
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "CI/CD Pipeline Completed Successfully."
        }
        failure {
            echo "CI/CD Pipeline Failed. Please check the logs."
        }
    }
}
