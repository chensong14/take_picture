# Phase 1：微信小程序前端

## 当前阶段目标

- 建立微信原生小程序工程和统一视觉主题。
- 实现首页、创作页、生成状态页、作品页和个人中心。
- 实现图片选择、文字输入、风格选择和表单校验。
- 使用 Mock Job 演示排队、预处理、AI 生成、后处理和完成状态。
- 使用本地缓存保存用户资料、草稿、作品和收藏状态。

## 为什么这样设计

页面只负责展示和交互，API 请求统一放在 `services/`，缓存统一放在 `utils/storage.js`。这样接入真实后端时不会把网络逻辑散落在页面中，也便于替换 AI 模型供应商。

生成页不持续等待一个长 HTTP 请求，而是先创建 Job，再按照固定间隔查询状态。页面进入后台或被销毁时停止定时器，避免内存泄漏和无效网络请求。

## 页面数据流

```text
capture 页面
  ├─ wx.chooseMedia 选择图片
  ├─ 输入 Prompt 和风格
  └─ 保存 draft 后跳转 generation
             │
             ▼
generation 页面
  ├─ createJob
  ├─ setInterval 轮询 getJob
  ├─ succeeded 后保存 work
  └─ 跳转 works 页面
```

## 关键目录

```text
apps/miniprogram/
├─ app.js / app.json / app.wxss
├─ config/env.js
├─ services/http.js
├─ services/jobs.js
├─ utils/storage.js
├─ components/job-progress/
└─ pages/
   ├─ home/
   ├─ capture/
   ├─ generation/
   ├─ works/
   └─ profile/
```

## 如何运行测试

1. 启动微信开发者工具。
2. 点击“导入项目”。
3. 目录选择 `C:\Users\Desong Chen\Desktop\photo_service`。
4. 暂时使用测试号或游客模式。
5. 编译后依次验证：首页 → 创作 → 选择图片 → 填写描述 → 提交任务 → 等待约 8 秒 → 查看作品库。
6. 在“我的”页面测试头像、昵称和 `wx.login` 调用。

## 常见错误排查

### 图片无法选择

检查开发者工具是否允许模拟相册/相机；真机调试时检查微信相册和相机权限。

### HTTP 请求提示不合法域名

开发阶段可在开发者工具中暂时关闭域名校验。真机和生产环境必须使用已备案并配置到小程序后台的 HTTPS 域名。

### 手机无法访问 127.0.0.1

手机中的 `127.0.0.1` 指向手机自身。联调时需要将 API 地址改为电脑局域网 IP，并确保手机和电脑在同一网络。正式环境使用 HTTPS 域名。

### 生成进度不变化

检查 `config/env.js` 中 `useMock` 是否为 `true`，以及生成页是否被切到后台。页面后台会主动停止轮询，重新进入后继续。

## 面试知识点

问题：前端如何管理异步 AI 任务状态？

- 初级回答：提交生成请求后获得任务 ID，前端定时查询任务状态，成功后展示结果。
- 中级回答：页面维护 queued、preprocessing、generating、postprocessing、succeeded、failed 状态机，并在页面隐藏或销毁时清理轮询定时器。
- 高级回答：服务端返回可持久化 Job ID，前端使用退避轮询或 SSE/WebSocket 获取状态；同时处理幂等提交、断线恢复、超时、取消、失败重试和多端状态一致性。

问题：为什么选择微信小程序？

- 初级回答：用户不需要下载安装，通过微信即可快速使用。
- 中级回答：微信提供登录、支付、分享、相机和文件选择等能力，适合低成本验证 AI 产品。
- 高级回答：小程序降低获客和分发成本，但存在包体、域名、网络、后台运行和平台审核限制，因此耗时推理必须后端异步化，媒体资源必须使用对象存储和 CDN。
