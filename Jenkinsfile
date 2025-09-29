/* groovylint-disable LineLength */
pipeline {
    agent {
        docker {
            image 'docker:24-dind'
            args '--privileged -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        REGISTRY    = credentials('docker-registry-url')
        DEPLOY_HOST = credentials('deploy-host')
        IMAGE_NAME  = 'tro-client'
    }

    stages {
        stage('Setup Docker') {
            steps {
                sh '''
                    if ! command -v docker &> /dev/null; then
                        echo "Docker not found, installing..."
                        apk add --no-cache docker
                        dockerd &
                        sleep 5
                    else
                        echo "Docker already installed"
                    fi
                '''
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER ."
                sh "docker tag $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER $REGISTRY/$IMAGE_NAME:latest"
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login $REGISTRY -u $DOCKER_USER --password-stdin
                        docker push $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER
                        docker push $REGISTRY/$IMAGE_NAME:latest
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
