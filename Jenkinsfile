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
      steps{
        sh "docker image prune --force"
        sh "docker volume prune --force"
      }
    }
    stage('Deploying helm chart') {
      agent {
        docker {
          label 'linux'
          image 'dtzar/helm-kubectl:3.0.2'
          args '''-v /var/run/docker.sock:/var/run/docker.sock \
                    -h $HOSTNAME \
                    --cap-add SYS_ADMIN \
                    --cap-add DAC_READ_SEARCH
                '''
        }
      }
      steps{
        sh "helm"
        //sh "helm repo add helm http://helm.dihalk.com/"
        //sh "helm update"
        // configFileProvider([configFile(fileId: 'k8_kubeconfig')]) {
        //   sh 'helm upgrade --recreate-pods --install --kubeconfig $k8_kubeconfig country-airport  helm/country-airport-service-helm  --set image.pullPolicy=Always,image.repository=$registry,image.tag=$BUILD_NUMBER --namespace country-airport-api-prod'
        // }
      }
    }
  }
}