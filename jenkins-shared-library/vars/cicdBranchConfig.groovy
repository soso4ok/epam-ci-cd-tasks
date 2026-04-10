def call(String branchName) {
  if (branchName == 'main') {
    return [
      targetEnv    : 'main',
      imageBase    : 'nodemain',
      containerName: 'nodemain',
      appPort      : '3000'
    ]
  }

  if (branchName == 'dev') {
    return [
      targetEnv    : 'dev',
      imageBase    : 'nodedev',
      containerName: 'nodedev',
      appPort      : '3001'
    ]
  }

  error("Unsupported branch '${branchName}'. Use main or dev.")
}
