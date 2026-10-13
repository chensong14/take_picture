const env = require('../config/env')
const storage = require('../utils/storage')

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${env.apiBaseUrl}${options.path}`,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: env.requestTimeout,
      header: {
        'content-type': 'application/json',
        ...(options.header || {})
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data)
          return
        }
        if (response.statusCode === 401) storage.clearSession()
        reject(new Error(response.data?.message || `请求失败：${response.statusCode}`))
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络连接失败'))
      }
    })
  })
}

function uploadFile(options) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${env.apiBaseUrl}${options.path}`,
      filePath: options.filePath,
      name: options.name || 'file',
      timeout: options.timeout || env.uploadTimeout || env.requestTimeout,
      header: options.header || {},
      success(response) {
        let data
        try {
          data = JSON.parse(response.data || '{}')
        } catch (error) {
          reject(new Error('上传接口返回了无效数据'))
          return
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(data)
          return
        }
        if (response.statusCode === 401) storage.clearSession()
        reject(new Error(data.message || `上传失败：${response.statusCode}`))
      },
      fail(error) {
        reject(new Error(error.errMsg || '文件上传失败'))
      }
    })
  })
}

module.exports = { request, uploadFile }
