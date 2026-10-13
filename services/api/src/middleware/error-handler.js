function notFound(req, res) {
  res.status(404).json({ code: 'NOT_FOUND', message: `接口不存在：${req.method} ${req.path}` })
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  console.error(`[${req.id || 'request'}]`, error)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ code: 'FILE_TOO_LARGE', message: '图片不能超过 10MB' })
  }
  if (error.code === 'UNSUPPORTED_MEDIA_TYPE') {
    return res.status(415).json({ code: error.code, message: error.publicMessage })
  }
  if (error.name === 'ZodError') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: '请求参数不合法', details: error.issues })
  }
  return res.status(error.statusCode || 500).json({
    code: error.code || 'INTERNAL_ERROR',
    message: error.publicMessage || '服务器内部错误'
  })
}

module.exports = { notFound, errorHandler }
