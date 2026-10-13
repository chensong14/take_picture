const router = require('express').Router()
const { pool } = require('../db/pool')
const { requireUser } = require('../middleware/auth')

router.get('/', requireUser, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT w.id, w.result_url AS resultUrl, w.prompt, w.style, w.created_at AS createdAt,
              EXISTS(SELECT 1 FROM favorites f WHERE f.work_id = w.id AND f.user_id = ?) AS favorite
       FROM works w WHERE w.user_id = ? ORDER BY w.created_at DESC LIMIT 100`,
      [req.user.id, req.user.id]
    )
    return res.json({ items: rows })
  } catch (error) {
    return next(error)
  }
})

router.put('/:id/favorite', requireUser, async (req, res, next) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [works] = await connection.query('SELECT id FROM works WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    if (!works[0]) {
      await connection.rollback()
      return res.status(404).json({ code: 'WORK_NOT_FOUND', message: '作品不存在' })
    }
    const [existing] = await connection.query('SELECT work_id FROM favorites WHERE work_id = ? AND user_id = ?', [req.params.id, req.user.id])
    if (existing[0]) {
      await connection.query('DELETE FROM favorites WHERE work_id = ? AND user_id = ?', [req.params.id, req.user.id])
    } else {
      await connection.query('INSERT INTO favorites (user_id, work_id) VALUES (?, ?)', [req.user.id, req.params.id])
    }
    await connection.commit()
    return res.json({ favorite: !existing[0] })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

module.exports = router
