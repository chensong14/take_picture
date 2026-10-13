# 本地 API

## 启动

```powershell
cd "C:\Users\Desong Chen\Desktop\photo_service\services\api"
npm install
npm run db:migrate
npm run dev
```

健康检查：`GET http://127.0.0.1:3000/health/ready`

开发登录：`POST http://127.0.0.1:3000/api/v1/auth/dev-login`

开发登录返回的 `token` 目前就是测试用户 ID，后续替换为微信 `code2Session` 和签名会话。上传、创建任务、作品接口都需要在请求头中携带：

```text
x-user-id: <dev-login 返回的 token>
```

## 接口边界

- `POST /api/v1/uploads`：multipart 字段 `file`
- `POST /api/v1/ai/jobs`：`{ imageId, prompt, style }`
- `GET /api/v1/ai/jobs/:id`：查询任务状态
- `GET /api/v1/works`：查询作品
- `PUT /api/v1/works/:id/favorite`：切换收藏

上传文件当前保存到本地 `services/api/storage/uploads`，生产环境应替换为 R2/S3 存储适配器。

## 本地 Worker

```powershell
cd "C:\Users\Desong Chen\Desktop\photo_service\services\worker"
npm install
npm start
```

当前 Worker 使用本地适配器：它会推进任务状态，并把上传的原图作为临时结果写入 `works`。这样可以验证完整链路。接入真实模型时，只替换 `processJob` 中的模型适配器，任务状态、数据库和前端轮询流程保持不变。
