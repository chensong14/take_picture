const { randomUUID, createHash } = require('node:crypto')
const { pool } = require('../db/pool')

async function requireUser(req, res, next) {
  try {
    const authorization = req.header('authorization') || ''
    const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
    const devUserId = process.env.NODE_ENV === 'production' ? '' : req.header('x-user-id')
    const tokenHash = bearer ? hashToken(bearer) : ''
    const [rows] = tokenHash
      ? await pool.query(
        `SELECT u.id, u.openid, u.nickname, u.avatar_url AS avatarUrl
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP(3)`,
        [tokenHash]
      )
      : await pool.query('SELECT id, openid, nickname, avatar_url AS avatarUrl FROM users WHERE id = ?', [devUserId])
    if (!rows[0]) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: '用户不存在或登录已失效' })
    }
    req.user = rows[0]
    return next()
  } catch (error) {
    return next(error)
  }
}

async function createDevelopmentUser() {
  const id = randomUUID()
  const openid = `dev_${id.replaceAll('-', '')}`
  await pool.query('INSERT INTO users (id, openid, nickname) VALUES (?, ?, ?)', [id, openid, '开发测试用户'])
  return { id, openid, nickname: '开发测试用户', avatarUrl: '' }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function createSession(userId, days) {
  const token = randomUUID() + randomUUID()
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  await pool.query('INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)', [randomUUID(), userId, hashToken(token), expiresAt])
  return { token, expiresAt }
}

module.exports = { requireUser, createDevelopmentUser, createSession }
