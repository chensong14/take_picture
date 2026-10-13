const env = require('../config/env')
const http = require('./http')
const storage = require('../utils/storage')

async function ensureUser() {
  let token = storage.getToken()
  let user = storage.getUser()
  const authMode = env.useMock ? 'mock' : (env.useWechatLogin ? 'wechat' : 'development')
  if (storage.getAuthMode() !== authMode) {
    storage.clearSession()
    token = ''
    user = null
  }
  if (token && user) return { token, user }
  if (env.useMock) {
    const mockUser = user || { id: 'mock-user', nickname: '本地测试用户', avatarUrl: '' }
    storage.setUser(mockUser)
    storage.setToken(mockUser.id)
    storage.setAuthMode(authMode)
    return { token: mockUser.id, user: mockUser }
  }
  let response
  if (env.useWechatLogin) {
    const login = await new Promise((resolve, reject) => {
      wx.login({ success: resolve, fail: reject })
    })
    response = await http.request({ path: '/auth/wechat-login', method: 'POST', data: { code: login.code } })
  } else {
    response = await http.request({ path: '/auth/dev-login', method: 'POST' })
  }
  storage.setUser(response.user)
  storage.setToken(response.token)
  storage.setAuthMode(authMode)
  return response
}

function authorizationHeader(token) {
  return { Authorization: `Bearer ${token}` }
}

module.exports = { ensureUser, authorizationHeader }
