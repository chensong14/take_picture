const app = getApp()
const env = require('../../config/env')
const jobs = require('../../services/jobs')
const uploads = require('../../services/uploads')
const storage = require('../../utils/storage')

Page({
  data: {
    draft: null,
    hasDraft: false,
    jobId: '',
    status: 'queued',
    progress: 0,
    message: '正在创建任务',
    resultUrl: '',
    resultImageError: false,
    errorMessage: ''
  },

  onLoad() {
    const draft = app.getDraft()
    if (!draft?.imagePath) {
      this.setData({
        status: 'failed',
        message: '无法开始生成',
        errorMessage: '创作草稿已失效，请返回创作页重新选择图片。'
      })
      return
    }
    this.setData({ draft, hasDraft: true })
    this.createJob(draft)
  },

  onShow() {
    if (this.data.jobId && !['succeeded', 'failed'].includes(this.data.status)) {
      this.startPolling()
    }
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  async createJob(draft) {
    try {
      let payload = draft
      if (!env.useMock) {
        this.setData({ message: '正在上传图片', progress: 8 })
        const image = await uploads.uploadImage(draft.imagePath)
        payload = { ...draft, imageId: image.id }
      }
      const job = await jobs.createJob(payload)
      this.updateJob(job)
      this.startPolling()
    } catch (error) {
      this.handleError(error)
    }
  },

  startPolling() {
    this.stopPolling()
    this.pollTimer = setInterval(() => this.pollJob(), env.pollInterval)
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },

  async pollJob() {
    if (!this.data.jobId) return
    try {
      const job = await jobs.getJob(this.data.jobId)
      this.updateJob(job)
      if (job.status === 'succeeded') {
        this.stopPolling()
        this.saveWork(job)
      }
      if (job.status === 'failed') {
        this.stopPolling()
      }
    } catch (error) {
      this.stopPolling()
      this.handleError(error)
    }
  },

  updateJob(job) {
    this.setData({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      resultUrl: job.resultUrl || '',
      resultImageError: false,
      errorMessage: job.errorMessage || ''
    })
  },

  saveWork(job) {
    const works = storage.getWorks()
    if (works.some((item) => item.id === job.id)) return
    const work = {
      id: job.id,
      imagePath: job.resultUrl,
      sourceImagePath: this.data.draft.imagePath,
      prompt: this.data.draft.prompt,
      style: this.data.draft.style,
      favorite: false,
      createdAt: Date.now()
    }
    storage.setWorks([work, ...works])
    storage.clearDraft()
  },

  handleError(error) {
    this.setData({
      status: 'failed',
      message: '生成失败',
      errorMessage: error.message || '未知错误'
    })
  },

  retry() {
    if (!this.data.draft?.imagePath) {
      this.goCreate()
      return
    }
    this.setData({ status: 'queued', progress: 0, errorMessage: '' })
    this.createJob(this.data.draft)
  },

  goCreate() {
    wx.switchTab({ url: '/pages/capture/index' })
  },

  previewResult() {
    if (!this.data.resultUrl) return
    wx.previewImage({ urls: [this.data.resultUrl] })
  },

  onResultImageError(error) {
    console.warn('[generation] result image failed', error)
    this.setData({ resultImageError: true })
  },

  goWorks() {
    wx.switchTab({ url: '/pages/works/index' })
  }
})
