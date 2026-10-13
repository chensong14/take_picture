Component({
  properties: {
    progress: { type: Number, value: 0 },
    message: { type: String, value: '等待任务开始' },
    status: { type: String, value: 'queued' }
  },

  data: {
    statusLabels: {
      queued: '排队中',
      preprocessing: '图片分析',
      generating: 'AI 生成',
      postprocessing: '图片处理',
      succeeded: '生成完成',
      failed: '生成失败'
    }
  }
})
