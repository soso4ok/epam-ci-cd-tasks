def call(String dockerhubRepository, String imageBase, String imageTag) {
  if (!dockerhubRepository?.trim()) {
    return ''
  }

  def dockerNamespace = dockerhubRepository.tokenize('/')[0]
  return "${dockerNamespace}/${imageBase}:${imageTag}"
}
