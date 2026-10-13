const app = getApp()
const storage = require('../../utils/storage')

Page({
  data: {
    user: { avatarUrl: '', nickname: '' },
    loginCodePreview: '',
    workCount: 0,
    favoriteCount: 0
  },

  onShow() {
    const user = storage.getUser() || { avatarUrl: '', nickname: '' }
    const works = storage.getWorks()
    this.setData({
      user,
      workCount: works.length,
      favoriteCount: works.filter((item) => item.favorite).length
    })
  },

  chooseAvatar(event) {
    const user = { ...this.data.user, avatarUrl: event.detail.avatarUrl }
    this.setData({ user })
    this.saveUser(user)
  },

  changeNickname(event) {
    const user = { ...this.data.user, nickname: event.detail.value.trim() }
    this.setData({ user })
    this.saveUser(user)
  },

  saveUser(user) {
    storage.setUser(user)
    app.globalData.user = user
  },

  simulateLogin() {
    wx.login({
      success: ({ code }) => {
        this.setData({ loginCodePreview: code ? `${code.slice(0, 8)}...` : '未获得 code' })
        wx.showToast({ title: '已获取登录凭证', icon: 'success' })
      },
      fail: () => wx.showToast({ title: '微信登录调用失败', icon: 'none' })
    })
  }
})
