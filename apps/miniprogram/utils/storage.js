const KEYS = {
  USER: 'ai_creative_user',
  TOKEN: 'ai_creative_token',
  AUTH_MODE: 'ai_creative_auth_mode',
  DRAFT: 'ai_creative_draft',
  WORKS: 'ai_creative_works'
}

function safeGet(key, fallback) {
  try {
    return wx.getStorageSync(key) || fallback
  } catch (error) {
    console.warn('读取本地缓存失败', key, error)
    return fallback
  }
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (error) {
    console.warn('写入本地缓存失败', key, error)
    return false
  }
}

module.exports = {
  getUser: () => safeGet(KEYS.USER, null),
  setUser: (user) => safeSet(KEYS.USER, user),
  getToken: () => safeGet(KEYS.TOKEN, ''),
  setToken: (token) => safeSet(KEYS.TOKEN, token),
  getAuthMode: () => safeGet(KEYS.AUTH_MODE, ''),
  setAuthMode: (mode) => safeSet(KEYS.AUTH_MODE, mode),
  clearSession: () => {
    wx.removeStorageSync(KEYS.USER)
    wx.removeStorageSync(KEYS.TOKEN)
    wx.removeStorageSync(KEYS.AUTH_MODE)
  },
  getDraft: () => safeGet(KEYS.DRAFT, null),
  setDraft: (draft) => safeSet(KEYS.DRAFT, draft),
  clearDraft: () => wx.removeStorageSync(KEYS.DRAFT),
  getWorks: () => safeGet(KEYS.WORKS, []),
  setWorks: (works) => safeSet(KEYS.WORKS, works)
}
