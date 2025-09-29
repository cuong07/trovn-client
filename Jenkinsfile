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

        stage('Setup Environment') {
            steps {
                script {
                    sh '''
                        if ! command -v docker >/dev/null 2>&1; then
                            echo "Installing Docker..."
                            curl -fsSL https://get.docker.com -o get-docker.sh
                            sh get-docker.sh
                            usermod -aG docker jenkins || true
                            systemctl start docker || service docker start || true
                        else
                            echo "Docker is already installed"
                            docker --version
                        fi
                    '''
                }
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        # Build the image
                        docker build -t $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER .
                        docker tag $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER $REGISTRY/$IMAGE_NAME:latest

                        # Login and push
                        echo $DOCKER_PASS | docker login $REGISTRY -u $DOCKER_USER --password-stdin
                        docker push $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER
                        docker push $REGISTRY/$IMAGE_NAME:latest

                        # Clean up local images to save space
                        docker rmi $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER || true
                        docker rmi $REGISTRY/$IMAGE_NAME:latest || true
                    '''
                }
            }
        }

        stage('Deploy to Server 2') {
            steps {
                sshagent(['server2-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@$DEPLOY_HOST '
                            docker pull $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER &&
                            docker stop $IMAGE_NAME || true &&
                            docker rm $IMAGE_NAME || true &&
                            docker run -d --name $IMAGE_NAME -p 5174:5174 $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER
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
