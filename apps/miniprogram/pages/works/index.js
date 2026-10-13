const storage = require('../../utils/storage')
const env = require('../../config/env')
const worksApi = require('../../services/works')

Page({
  data: { works: [] },

  onShow() {
    this.loadWorks()
  },

  async loadWorks() {
    let sourceWorks = storage.getWorks()
    if (!env.useMock) {
      try {
        sourceWorks = await worksApi.listWorks()
      } catch (error) {
        wx.showToast({ title: '作品加载失败，显示本地缓存', icon: 'none' })
      }
    }
    const works = sourceWorks.map((item) => ({
      ...item,
      imagePath: item.imagePath || item.resultUrl,
      displayTime: this.formatTime(item.createdAt)
    }))
    this.setData({ works })
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const pad = (value) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  },

  async toggleFavorite(event) {
    const id = event.currentTarget.dataset.id
    if (!env.useMock) {
      try {
        await worksApi.toggleFavorite(id)
        await this.loadWorks()
        return
      } catch (error) {
        wx.showToast({ title: '收藏操作失败', icon: 'none' })
        return
      }
    }
    const works = storage.getWorks().map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item)
    storage.setWorks(works)
    this.loadWorks()
  },

  previewWork(event) {
    const url = event.currentTarget.dataset.url
    if (url) wx.previewImage({ urls: [url] })
  },

  goCreate() {
    wx.switchTab({ url: '/pages/capture/index' })
  }
})
