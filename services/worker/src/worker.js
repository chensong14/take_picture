const mysql = require('mysql2/promise')
const env = require('./config')
const { createImageProvider } = require('./providers')
const { readSourceImage, saveGeneratedImage } = require('./image-storage')
const { buildImagePrompt } = require('./prompt')

const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 4,
  charset: 'utf8mb4'
})

const imageProvider = createImageProvider(env.imageProvider)

async function claimJob() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [jobs] = await connection.query(
      `SELECT j.id, j.user_id AS userId, j.image_id AS imageId, j.prompt, j.style, i.object_key AS objectKey
       FROM ai_jobs j JOIN images i ON i.id = j.image_id
       WHERE j.status = 'queued' ORDER BY j.created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`
    )
    if (!jobs[0]) {
      await connection.rollback()
      return null
    }
    const job = jobs[0]
    await connection.query(
      "UPDATE ai_jobs SET status = 'preprocessing', progress = 20, started_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [job.id]
    )
    await connection.commit()
    return job
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function updateJob(id, status, progress, errorMessage = null) {
  await pool.query('UPDATE ai_jobs SET status = ?, progress = ?, error_message = ? WHERE id = ?', [status, progress, errorMessage, id])
}

async function processJob(job) {
  console.log(`processing job=${job.id} provider=${env.imageProvider.name} model=${env.imageProvider.model}`)
  try {
    const source = await readSourceImage(env.uploadDir, job.objectKey)
    const prompt = buildImagePrompt(job.prompt, job.style)

    await updateJob(job.id, 'generating', 55)
    const generated = await imageProvider.generate({
      imageDataUrl: source.dataUrl,
      sourceUrl: source.sourceUrl,
      prompt
    })

    await updateJob(job.id, 'postprocessing', 85)
    const resultUrl = env.imageProvider.name === 'passthrough'
      ? generated.imageUrl
      : await saveGeneratedImage(env.uploadDir, generated.imageUrl, env.imageProvider.timeoutMs)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.query(
        `INSERT INTO works (id, user_id, job_id, result_url, prompt, style)
         VALUES (UUID(), ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE result_url = VALUES(result_url), prompt = VALUES(prompt), style = VALUES(style)`,
        [job.userId, job.id, resultUrl, job.prompt, job.style]
      )
      await connection.query(
        "UPDATE ai_jobs SET status = 'succeeded', progress = 100, error_message = NULL, finished_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [job.id]
      )
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

    console.log(`completed job=${job.id} requestId=${generated.requestId || 'unavailable'}`)
  } catch (error) {
    const safeMessage = toSafeErrorMessage(error)
    try {
      await pool.query(
        "UPDATE ai_jobs SET status = 'failed', progress = 100, error_message = ?, finished_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [safeMessage, job.id]
      )
    } catch (updateError) {
      console.error(`failed to persist failure job=${job.id}`, updateError)
    }
    console.error(`failed job=${job.id} code=${error.code || 'WORKER_ERROR'} requestId=${error.requestId || 'unavailable'} message=${safeMessage}`)
  }
}

function toSafeErrorMessage(error) {
  const knownMessages = {
    InvalidApiKey: 'AI 服务密钥无效，请联系管理员检查配置',
    ModelNotFound: '当前图像模型不可用，请联系管理员检查配置',
    MODEL_RESULT_MISSING: 'AI 服务没有返回图片，请稍后重试'
  }
  if (error?.code && knownMessages[error.code]) return knownMessages[error.code]
  const fallback = 'AI 生成失败，请稍后重试'
  const message = typeof error?.message === 'string' ? error.message.trim() : ''
  if (!message) return fallback
  return message.replace(/[\r\n\t]+/g, ' ').slice(0, 500)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loop() {
  console.log(`photo-service-worker started; polling every ${env.pollMs}ms`)
  while (true) {
    try {
      const job = await claimJob()
      if (job) await processJob(job)
      else await delay(env.pollMs)
    } catch (error) {
      console.error('worker iteration failed', error)
      await delay(env.pollMs)
    }
  }
}

loop().catch(async (error) => {
  console.error('worker startup failed', error)
  await pool.end()
  process.exitCode = 1
})
