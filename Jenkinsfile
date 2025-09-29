/* groovylint-disable LineLength */
pipeline {
    agent any

    environment {
        REGISTRY = credentials('docker-registry-url')
        DEPLOY_HOST = credentials('deploy-host')
        IMAGE_NAME = 'tro-client'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build -t ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
                    docker tag ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:latest
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                sh """
                    docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                    docker push ${REGISTRY}/${IMAGE_NAME}:latest
                """
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
                            docker run -d \\
                                --name ${IMAGE_NAME} \\
                                --restart unless-stopped \\
                                -p 5174:5174 \\
                                ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        '
                    """
                }
            }
        }

        stage('Cleanup Old Images') {
            steps {
                sh """
                    # Xóa images cũ trên Jenkins server (giữ lại 3 builds gần nhất)
                    docker images ${REGISTRY}/${IMAGE_NAME} --format "{{.Tag}}" | \\
                    grep -E '^[0-9]+\$' | sort -rn | tail -n +4 | \\
                    xargs -I {} docker rmi ${REGISTRY}/${IMAGE_NAME}:{} 2>/dev/null || true

                    # Xóa dangling images
                    docker image prune -f
                """
            }
        }
    }

    post {
        success {
            echo '✅ Build & Deploy thành công!'
            echo "🚀 App: http://${DEPLOY_HOST}:5174"
        }
        failure {
            echo '❌ Pipeline lỗi!'
        }
    }
}
