const path = require('node:path')
const fs = require('node:fs/promises')
const { randomUUID } = require('node:crypto')

const mimeByExtension = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
}

async function readSourceImage(uploadDir, objectKey) {
  const fileName = path.basename(objectKey)
  const extension = path.extname(fileName).toLowerCase()
  const mimeType = mimeByExtension[extension]
  if (!mimeType) throw new Error('上传图片格式不受模型支持')
  const buffer = await fs.readFile(path.join(uploadDir, fileName))
  if (buffer.length > 10 * 1024 * 1024) throw new Error('上传图片超过模型 10MB 限制')
  return {
    dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
    sourceUrl: `/uploads/${fileName}`
  }
}

async function saveGeneratedImage(uploadDir, imageUrl, timeoutMs) {
  const url = new URL(imageUrl)
  if (url.protocol !== 'https:') throw new Error('模型返回了不安全的图片地址')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
  if (!response.ok) throw new Error(`生成图片下载失败（HTTP ${response.status}）`)

  const mimeType = (response.headers.get('content-type') || '').split(';')[0].toLowerCase()
  const extension = extensionByMime[mimeType] || '.png'
  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length || buffer.length > 25 * 1024 * 1024) throw new Error('生成图片大小异常')

  const relativePath = `generated/${randomUUID()}${extension}`
  const absolutePath = path.join(uploadDir, relativePath)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, buffer, { flag: 'wx' })
  return `/uploads/${relativePath.replaceAll('\\', '/')}`
}

module.exports = { readSourceImage, saveGeneratedImage }
