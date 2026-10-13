const { randomUUID } = require('node:crypto')
const router = require('express').Router()
const { z } = require('zod')
const { pool } = require('../db/pool')
const { requireUser } = require('../middleware/auth')

const createSchema = z.object({
  imageId: z.string().uuid(),
  prompt: z.string().trim().min(1).max(300),
  style: z.enum(['natural', 'cinematic', 'illustration']).default('natural')
})

router.post('/', requireUser, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const [images] = await pool.query('SELECT id FROM images WHERE id = ? AND user_id = ?', [body.imageId, req.user.id])
    if (!images[0]) return res.status(404).json({ code: 'IMAGE_NOT_FOUND', message: '图片不存在或无权使用' })
    const id = randomUUID()
    await pool.query(
      'INSERT INTO ai_jobs (id, user_id, image_id, prompt, style, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, body.imageId, body.prompt, body.style, 'queued', 0]
    )
    return res.status(202).json({ id, status: 'queued', progress: 0, message: '任务已进入队列' })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', requireUser, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT j.id, j.status, j.progress, j.prompt, j.style, j.error_message AS errorMessage,
              w.id AS workId, w.result_url AS resultUrl
       FROM ai_jobs j LEFT JOIN works w ON w.job_id = j.id
       WHERE j.id = ? AND j.user_id = ?`,
      [req.params.id, req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ code: 'JOB_NOT_FOUND', message: '任务不存在' })
    const job = rows[0]
    return res.json({ ...job, message: job.errorMessage || statusMessage(job.status) })
  } catch (error) {
    return next(error)
  }
})

function statusMessage(status) {
  return {
    queued: '任务已进入队列',
    preprocessing: '正在分析图片',
    generating: 'AI 正在生成内容',
    postprocessing: '正在处理生成结果',
    succeeded: '生成完成',
    failed: '生成失败'
  }[status] || '任务处理中'
}

module.exports = router
