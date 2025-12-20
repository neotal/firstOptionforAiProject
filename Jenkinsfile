pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    stages {
        stage('1. Checkout') {
            steps {
                checkout scm
            }
        }

        stage('2. Install & Test Backend') {
            steps {
                dir('backend') {
                    echo 'Installing Backend dependencies...'
                    sh 'npm install'
                    echo 'Running Backend tests...'
                    sh 'npm test'
                }
            }
        }

        stage('3. Install & Test Frontend') {
            steps {
                dir('frontend') {
                    echo 'Installing Frontend dependencies...'
                    sh 'npm install'
                    echo 'Running Frontend tests...'
                    sh 'npm test -- --run'
                }
            }
        }

        stage('4. Docker Build & Compose') {
            steps {
                echo 'Building and starting environment with Docker Compose...'
                // פקודות אלו יעבדו כי התקנו את docker-compose בתוך הקונטיינר של ג'נקינס
                sh 'docker-compose build'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished. Cleaning up...'
        }
        success {
            echo 'Success: The application is up and running!'
        }
        failure {
            echo 'Failure: Something went wrong during the pipeline.'
        }
    }
}