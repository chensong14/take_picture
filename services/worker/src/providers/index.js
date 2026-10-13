const DashScopeImageProvider = require('./dashscope')
const PassthroughImageProvider = require('./passthrough')

function createImageProvider(config) {
  if (config.name === 'dashscope') return new DashScopeImageProvider(config)
  if (config.name === 'passthrough') return new PassthroughImageProvider()
  throw new Error(`不支持的图像模型提供方：${config.name}`)
}

module.exports = { createImageProvider }
