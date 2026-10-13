const env = require('../config/env')
const http = require('./http')
const auth = require('./auth')

async function uploadImage(filePath) {
  const session = await auth.ensureUser()
  const response = await http.uploadFile({
    path: '/uploads',
    filePath,
    name: 'file',
    header: auth.authorizationHeader(session.token)
  })
  return {
    ...response,
    url: response.url && response.url.startsWith('/') ? `${env.apiOrigin}${response.url}` : response.url
  }
}

module.exports = { uploadImage }
