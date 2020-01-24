properties([
	parameters([
		booleanParam(name: 'Release', defaultValue: false, description: 'Mark if this is a Release Build', )
	])
])
pipeline {
  environment {
    dockerImage = "coolboynova/country-airport-service"
  }
  agent {
    label 'linux'
  }
  stages {
    stage('Checkout') {
      when { expression { !params.Release } }
      steps {
        checkout([
          $class: 'GitSCM',
          branches: scm.branches,
          doGenerateSubmoduleConfigurations: scm.doGenerateSubmoduleConfigurations,
          extensions: scm.extensions + [[$class: 'CleanBeforeCheckout'], [$class: 'LocalBranch', localBranch: "**"]],
          userRemoteConfigs: scm.userRemoteConfigs,
        ])
      }
    }
    stage('Building image') {
      when { expression { !params.Release } }
      steps{
        script {
          app = docker.build(dockerImage)
          app.inside {
            sh 'echo docker image built successfully'
          }
        }
      }
    }
    stage('Publishing Image') {
      when { expression { !params.Release } }
      steps{
        script {
          docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-creds') {
            app.push("${env.BUILD_NUMBER}")
            app.push("latest")
          }
        }
      }
    }
    stage('Remove Unused docker image') {
      when { expression { !params.Release } }
      steps{
        sh "docker image prune --force"
        sh "docker volume prune --force"
      }
    }
    stage('Deploying helm chart') {
      when { expression { params.Release } }
      agent {
        docker {
          label 'linux'
          image 'dtzar/helm-kubectl:2.16.1'
          args '''-v /var/run/docker.sock:/var/run/docker.sock \
                    -v /data/config:/data/config \
                    -h $HOSTNAME \
                    --cap-add SYS_ADMIN \
                    --cap-add DAC_READ_SEARCH
                '''
        }
      }
      steps{
        sh "helm repo add helm http://helm.dihalk.com"
        sh "helm repo update"
        sh 'helm upgrade --recreate-pods --install --kubeconfig /data/config country-airport  helm/country-airport-service-helm  --set image.pullPolicy=Always,image.repository=$dockerImage,image.tag=latest --namespace country-airport-api-prod'
      }
    }
  }
}
