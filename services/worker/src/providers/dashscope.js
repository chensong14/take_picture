class DashScopeImageProvider {
  constructor(config) {
    if (!config.apiKey) throw new Error('DASHSCOPE_API_KEY 未配置')
    if (!config.model) throw new Error('DASHSCOPE_IMAGE_MODEL 未配置')
    this.config = config
  }

  async generate({ imageDataUrl, prompt }) {
    const endpoint = `${this.config.baseUrl}/services/aigc/multimodal-generation/generation`
    const payload = {
      model: this.config.model,
      input: {
        messages: [{
          role: 'user',
          content: [
            { image: imageDataUrl },
            { text: prompt }
          ]
        }]
      },
      parameters: {
        prompt_extend: true,
        watermark: false
      }
    }

    let lastError
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        return await this.request(endpoint, payload)
      } catch (error) {
        lastError = error
        if (!error.retryable || attempt === this.config.maxRetries) throw error
        await delay(1000 * (2 ** attempt))
      }
    }
    throw lastError
  }

  async request(endpoint, payload) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)
    let response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
    } catch (error) {
      const wrapped = new Error(error.name === 'AbortError' ? '图像模型请求超时' : '无法连接图像模型服务')
      wrapped.retryable = true
      wrapped.cause = error
      throw wrapped
    } finally {
      clearTimeout(timeout)
    }

    const requestId = response.headers.get('x-request-id') || ''
    const result = await parseJson(response)
    if (!response.ok || result.code) {
      const error = new Error(result.message || `图像模型请求失败（HTTP ${response.status}）`)
      error.code = result.code || 'MODEL_HTTP_ERROR'
      error.requestId = result.request_id || requestId
      error.retryable = response.status === 429 || response.status >= 500
      throw error
    }

    const content = result.output?.choices?.[0]?.message?.content || []
    const imageUrl = content.find((item) => item.image)?.image
    if (!imageUrl) {
      const error = new Error('图像模型响应中没有生成结果')
      error.code = 'MODEL_RESULT_MISSING'
      error.requestId = result.request_id || requestId
      error.retryable = false
      throw error
    }

    return { imageUrl, requestId: result.request_id || requestId, usage: result.usage || null }
  }
}

async function parseJson(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    const wrapped = new Error(`图像模型返回了无效 JSON（HTTP ${response.status}）`)
    wrapped.retryable = response.status >= 500
    wrapped.cause = error
    throw wrapped
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = DashScopeImageProvider
