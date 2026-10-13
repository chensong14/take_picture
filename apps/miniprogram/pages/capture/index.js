const app = getApp()

Page({
  data: {
    imagePath: '',
    previewError: false,
    prompt: '',
    promptLength: 0,
    selectedStyle: 'natural',
    styles: [
      { id: 'natural', name: '自然写实' },
      { id: 'cinematic', name: '电影质感' },
      { id: 'illustration', name: '插画风格' }
    ]
  },

  chooseImage() {
    wx.showLoading({ title: '正在打开相册', mask: true })

    const handleSelection = (result) => {
      wx.hideLoading()

      const files = result && result.tempFiles ? result.tempFiles : []
      const firstFile = files.length > 0 ? files[0] : {}
      const paths = result && result.tempFilePaths ? result.tempFilePaths : []
      const imagePath = firstFile.tempFilePath || firstFile.path || paths[0] || (result && result.tempFilePath) || (result && result.path) || ''
      const imageSize = firstFile.size || 0

      console.log('[capture] image selected', {
        hasPath: Boolean(imagePath),
        size: imageSize,
        result
      })

      if (!imagePath) {
        wx.showModal({
          title: '图片读取失败',
          content: '选择器返回了图片，但没有获取到临时路径。请重新编译开发者工具后再试。',
          showCancel: false
        })
        return
      }

      if (imageSize > 10 * 1024 * 1024) {
        wx.showToast({ title: '图片不能超过 10MB', icon: 'none' })
        return
      }

      this.setData({ imagePath, previewError: false }, () => {
        wx.getImageInfo({
          src: imagePath,
          fail: (error) => {
            console.warn('[capture] image info failed', error)
          }
        })
      })
    }

    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: ({ tempFiles, tempFilePaths }) => {
        handleSelection({ tempFiles, tempFilePaths })
      },
      fail: (error) => {
        wx.hideLoading()
        if (!error.errMsg || !error.errMsg.includes('cancel')) {
          wx.showModal({
            title: '无法打开图片选择器',
            content: error.errMsg || '请确认开发者工具已开启模拟器文件选择能力，然后重试。',
            showCancel: false
          })
        }
      }
    })
  },

  previewImage() {
    if (!this.data.imagePath) {
      this.chooseImage()
      return
    }
    wx.previewImage({ urls: [this.data.imagePath] })
  },

  onPreviewError() {
    this.setData({ previewError: true })
    wx.showToast({ title: '图片预览失败，请重新选择', icon: 'none' })
  },

  onPromptInput(event) {
    const prompt = event.detail.value
    this.setData({ prompt, promptLength: prompt.length })
  },

  selectStyle(event) {
    this.setData({ selectedStyle: event.currentTarget.dataset.id })
  },

  startGeneration() {
    const { imagePath, prompt, selectedStyle } = this.data
    if (!imagePath) {
      wx.showToast({ title: '请先选择一张图片', icon: 'none' })
      return
    }
    if (!prompt.trim()) {
      wx.showToast({ title: '请描述你的创作想法', icon: 'none' })
      return
    }

    app.setDraft({ imagePath, prompt: prompt.trim(), style: selectedStyle })
    wx.navigateTo({ url: '/pages/generation/index' })
  }
})
