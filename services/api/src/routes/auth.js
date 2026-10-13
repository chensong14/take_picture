const router = require('express').Router()
const { randomUUID } = require('node:crypto')
const { z } = require('zod')
const env = require('../config/env')
const { pool } = require('../db/pool')
const { createDevelopmentUser, createSession } = require('../middleware/auth')

router.post('/dev-login', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.DEV_AUTH_ENABLED !== 'true') {
      return res.status(404).json({ code: 'NOT_FOUND', message: '开发登录接口已关闭' })
    }
    const user = await createDevelopmentUser()
    const session = await createSession(user.id, env.wechat.sessionDays)
    return res.status(201).json({ user, token: session.token, expiresAt: session.expiresAt })
  } catch (error) {
    return next(error)
  }
})

router.post('/wechat-login', async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body)
    if (!env.wechat.appId || !env.wechat.appSecret) {
      return res.status(503).json({ code: 'WECHAT_AUTH_NOT_CONFIGURED', message: '服务端尚未配置微信 AppID 和 AppSecret' })
    }
    const query = new URLSearchParams({
      appid: env.wechat.appId,
      secret: env.wechat.appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    })
    const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${query}`)
    const result = await response.json()
    if (!result.openid) {
      return res.status(401).json({ code: 'WECHAT_LOGIN_FAILED', message: result.errmsg || '微信登录凭证无效' })
    }
    let [users] = await pool.query('SELECT id, openid, nickname, avatar_url AS avatarUrl FROM users WHERE openid = ?', [result.openid])
    if (!users[0]) {
      const userId = randomUUID()
      await pool.query('INSERT INTO users (id, openid) VALUES (?, ?)', [userId, result.openid])
      ;[users] = await pool.query('SELECT id, openid, nickname, avatar_url AS avatarUrl FROM users WHERE id = ?', [userId])
    }
    const session = await createSession(users[0].id, env.wechat.sessionDays)
    return res.status(200).json({ user: users[0], token: session.token, expiresAt: session.expiresAt })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
