const env = require('../config/env')
const http = require('./http')
const auth = require('./auth')

const mockJobs = new Map()

function buildMockJob(job) {
  const elapsed = Date.now() - job.createdAt
  let status = 'queued'
  let progress = 8
  let message = '任务已进入队列'

  if (elapsed >= 1500) {
    status = 'preprocessing'
    progress = 28
    message = '正在分析图片与场景'
  }
  if (elapsed >= 3500) {
    status = 'generating'
    progress = 62
    message = 'AI 正在生成创作方案'
  }
  if (elapsed >= 6000) {
    status = 'postprocessing'
    progress = 88
    message = '正在进行图片后处理'
  }
  if (elapsed >= 8000) {
    status = 'succeeded'
    progress = 100
    message = '生成完成'
  }

  return {
    ...job,
    status,
    progress,
    message,
    resultUrl: status === 'succeeded' ? job.imagePath : ''
  }
}

async function createJob(payload) {
  if (!env.useMock) {
    const session = await auth.ensureUser()
    return http.request({
      path: '/ai/jobs',
      method: 'POST',
      data: payload,
      header: auth.authorizationHeader(session.token)
    })
  }

  const job = {
    id: `mock-${Date.now()}`,
    imagePath: payload.imagePath,
    prompt: payload.prompt,
    style: payload.style,
    createdAt: Date.now()
  }
  mockJobs.set(job.id, job)
  return buildMockJob(job)
}

async function getJob(jobId) {
  if (!env.useMock) {
    const session = await auth.ensureUser()
    const result = await http.request({ path: `/ai/jobs/${jobId}`, header: auth.authorizationHeader(session.token) })
    if (result.resultUrl && result.resultUrl.startsWith('/')) result.resultUrl = `${env.apiOrigin}${result.resultUrl}`
    return result
  }

  const job = mockJobs.get(jobId)
  if (!job) {
    throw new Error('任务不存在或已失效')
  }
  return buildMockJob(job)
}

module.exports = { createJob, getJob }
