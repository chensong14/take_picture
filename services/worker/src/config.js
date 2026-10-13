const path = require('node:path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config()

module.exports = {
  pollMs: Number(process.env.WORKER_POLL_MS || 1500),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.resolve(__dirname, '../storage/uploads')),
  imageProvider: {
    name: (process.env.AI_IMAGE_PROVIDER || 'passthrough').toLowerCase(),
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    model: process.env.DASHSCOPE_IMAGE_MODEL || 'qwen-image-3.0',
    baseUrl: (process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1').replace(/\/$/, ''),
    timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 300000),
    maxRetries: Number(process.env.AI_MAX_RETRIES || 2)
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'ai_creative',
    user: process.env.DB_USER || 'ai_app',
    password: process.env.DB_PASSWORD || 'AiCreative_2026'
  }
}
