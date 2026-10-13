# 项目背景与系统边界

更新日期：2026-09-30

## 1. 项目定位

项目名称：AI-powered Creative Generation Platform。

这是一个 AI 创作类微信小程序。用户上传或拍摄图片，输入自然语言需求，系统创建异步任务，由 Worker 调用大语言模型、图像生成模型和 OpenCV 处理链，最终把文件存入对象存储、把业务状态写入 MySQL，并将结果返回小程序。

## 2. 核心用户闭环

1. 用户通过微信登录进入小程序。
2. 用户选择图片并填写创作描述。
3. API 校验参数、保存上传记录并创建 AI Job。
4. Worker 从任务队列获取 Job，执行 Prompt 编排、模型调用和图片处理。
5. Worker 把结果上传到 R2/S3，并更新数据库任务状态。
6. 小程序轮询 Job 状态，成功后展示作品。
7. 用户保存、浏览、收藏和管理作品。

## 3. 生产架构

```text
微信小程序
  │ REST / HTTPS / Upload
  ▼
Node.js Express API
  ├─ 用户认证与权限
  ├─ 上传签名与资源记录
  ├─ AI Job 创建与查询
  └─ 作品与收藏管理
        │
        ├── MySQL：业务数据和任务状态
        ├── Queue：异步任务投递
        └── R2/S3：原图、处理中间文件和结果图
                     │
                     ▼
                 AI Worker
                  ├─ Prompt 管理
                  ├─ LLM / 图像生成 API
                  └─ Python + OpenCV
```

## 4. 为什么需要异步任务

模型推理可能耗时数秒到数分钟，且受排队、限流、网络和供应商波动影响。如果 HTTP 请求同步等待，容易触发网关超时、占用连接和重复提交。生产系统把一次生成请求转换为可持久化 Job，由 Worker 独立执行；客户端只查询 Job 状态，因此可以实现重试、限流、失败恢复、幂等和水平扩容。

## 5. 技术栈

- Frontend：微信原生小程序、WXML、WXSS、JavaScript
- API：Node.js、Express、RESTful API
- Database：MySQL 8.4
- Worker：Node.js 异步任务执行器
- CV：Python 3.12、OpenCV、GrabCut
- Storage：Cloudflare R2 或 S3 兼容对象存储
- Deployment：Docker、Linux、PM2、Nginx、HTTPS

## 6. 当前开发策略

Phase 1 通过 Mock Job 完成前端状态机，避免前端开发被后端阻塞。Phase 2 开始后，只需把 `config/env.js` 的 `useMock` 改为 `false`，并让 `services/jobs.js` 调用真实接口，页面交互和状态展示不需要重写。
