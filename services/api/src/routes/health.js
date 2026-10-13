const router = require('express').Router()
const { checkDatabase } = require('../db/pool')

router.get('/live', (req, res) => res.json({ status: 'ok', service: 'api' }))

router.get('/ready', async (req, res, next) => {
  try {
    await checkDatabase()
    return res.json({ status: 'ready', database: 'ok' })
  } catch (error) {
    error.statusCode = 503
    error.publicMessage = '数据库暂不可用'
    return next(error)
  }
})

module.exports = router
