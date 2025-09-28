pipeline {
    agent any

    environment {
        REGISTRY     = credentials('docker-registry-url')
        DEPLOY_HOST  = credentials('deploy-host')
        IMAGE_NAME   = 'tro-client'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Check Docker') {
            steps {
                sh 'docker --version'
                sh 'docker info'
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('tro-client') {
                    sh """
                        docker build -t ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
                        docker tag ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials',
                                                 usernameVariable: 'DOCKER_USER',
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo \$DOCKER_PASS | docker login ${REGISTRY} -u \$DOCKER_USER --password-stdin
                        docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${REGISTRY}/${IMAGE_NAME}:latest
                        docker logout ${REGISTRY}
                    """
                                                 }
            }
        }

        stage('Deploy to Server 2') {
            steps {
                sshagent(['server2-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@${DEPLOY_HOST} '
                            docker pull ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} &&
                            docker stop ${IMAGE_NAME} || true &&
                            docker rm ${IMAGE_NAME} || true &&
                            docker run -d --name ${IMAGE_NAME} -p 5174:5174 ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build & Deploy thành công!'
        }
        failure {
            echo '❌ Pipeline lỗi!'
        }
    }
}
