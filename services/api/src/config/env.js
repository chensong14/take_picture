const path = require('node:path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })
dotenv.config()

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'ai_creative',
    user: process.env.DB_USER || 'ai_app',
    password: process.env.DB_PASSWORD || 'AiCreative_2026'
  },
  uploadDir: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'storage/uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    sessionDays: Number(process.env.SESSION_DAYS || 30)
  }
}

module.exports = env
