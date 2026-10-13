const path = require('node:path')
const fs = require('node:fs/promises')
const { randomUUID } = require('node:crypto')
const router = require('express').Router()
const multer = require('multer')
const env = require('../config/env')
const { pool } = require('../db/pool')
const { requireUser } = require('../middleware/auth')

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('只支持 jpg、png 或 webp 图片')
      error.code = 'UNSUPPORTED_MEDIA_TYPE'
      error.statusCode = 415
      error.publicMessage = error.message
      return callback(error)
    }
    return callback(null, true)
  }
})

router.post('/', requireUser, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: 'FILE_REQUIRED', message: '请上传 jpg、png 或 webp 图片' })
    await fs.mkdir(env.uploadDir, { recursive: true })
    const extension = path.extname(req.file.originalname).toLowerCase() || '.jpg'
    const fileName = `${randomUUID()}${extension}`
    const absolutePath = path.join(env.uploadDir, fileName)
    await fs.writeFile(absolutePath, req.file.buffer, { flag: 'wx' })
    const imageId = randomUUID()
    const objectKey = `uploads/${fileName}`
    await pool.query(
      'INSERT INTO images (id, user_id, object_key, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)',
      [imageId, req.user.id, objectKey, req.file.originalname.slice(0, 255), req.file.mimetype, req.file.size]
    )
    return res.status(201).json({ id: imageId, objectKey, url: `/uploads/${fileName}`, mimeType: req.file.mimetype, size: req.file.size })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
