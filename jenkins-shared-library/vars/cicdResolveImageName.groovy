def call(String dockerhubRepository, String imageBase, String imageTag) {
  if (!dockerhubRepository?.trim()) {
    return ''
  }

  if (dockerhubRepository.contains('/')) {
    return "${dockerhubRepository}:${imageBase}-${imageTag}"
  }

  return "${dockerhubRepository}/${imageBase}:${imageTag}"
}
