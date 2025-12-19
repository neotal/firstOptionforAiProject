pipeline {
    agent any 

    environment {
        DOCKER_IMAGE = "username/project-name"
        REGISTRY_CREDENTIALS = 'docker-hub-credentials-id'
    }

    stages {
        stage('Install') {
            steps {
                echo 'Installing dependencies...'
                // פקודה לדוגמה: sh 'npm install' או 'pip install'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                // פקודה לדוגמה: sh 'npm test'
            }
        }

        stage('Build Docker') {
            steps {
                script {
                    // בניית האימג'
                    app = docker.build("${DOCKER_IMAGE}:${env.BUILD_ID}")
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    // התחברות ודחיפה לרגיסטרי
                    docker.withRegistry('', REGISTRY_CREDENTIALS) {
                        app.push()
                        app.push("latest")
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying...'
                // פקודה לפריסה בשרת או בענן
                // sh 'docker-compose up -d'
            }
        }
    }
}