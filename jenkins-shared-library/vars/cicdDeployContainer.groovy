def call(String containerName, String hostPort, String containerPort, String imageName) {
  sh """
    set -e
    if docker ps -a --format '{{.Names}}' | grep -q '^${containerName}\$'; then
      docker rm -f ${containerName}
    fi
    docker run -d --name ${containerName} -e PORT=${containerPort} -p ${hostPort}:${containerPort} ${imageName}
  """
}
