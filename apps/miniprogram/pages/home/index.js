Page({
  data: {
    recommendations: [
      { id: 1, title: '回头抓拍', description: '自然捕捉回头瞬间，让画面更有故事感。', tags: ['单人', '街拍'], icon: '↗' },
      { id: 2, title: '侧身漫步', description: '边走边拍，利用环境线条增强画面层次。', tags: ['简单', '氛围'], icon: '→' },
      { id: 3, title: '窗边柔光', description: '利用窗边自然光，获得干净柔和的人像效果。', tags: ['室内', '人像'], icon: '☼' }
    ]
  },

  goCreate() {
    wx.switchTab({ url: '/pages/capture/index' })
  },

  goWorks() {
    wx.switchTab({ url: '/pages/works/index' })
  }
})
