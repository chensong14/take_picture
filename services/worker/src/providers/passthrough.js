class PassthroughImageProvider {
  async generate({ sourceUrl }) {
    return { imageUrl: sourceUrl, requestId: 'local-passthrough', usage: null }
  }
}

module.exports = PassthroughImageProvider
