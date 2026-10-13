const env = require('../config/env')
const http = require('./http')
const auth = require('./auth')

async function listWorks() {
  const session = await auth.ensureUser()
  const response = await http.request({ path: '/works', header: auth.authorizationHeader(session.token) })
  return (response.items || []).map((item) => ({
    ...item,
    favorite: Boolean(item.favorite),
    resultUrl: item.resultUrl && item.resultUrl.startsWith('/') ? `${env.apiOrigin}${item.resultUrl}` : item.resultUrl,
    imagePath: item.resultUrl && item.resultUrl.startsWith('/') ? `${env.apiOrigin}${item.resultUrl}` : item.resultUrl
  }))
}

async function toggleFavorite(id) {
  const session = await auth.ensureUser()
  return http.request({ path: `/works/${id}/favorite`, method: 'PUT', header: auth.authorizationHeader(session.token) })
}

module.exports = { listWorks, toggleFavorite }
