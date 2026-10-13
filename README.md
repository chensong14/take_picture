# AI-powered Creative Generation WeChat Mini Program

一个面向 AI 应用工程学习与求职展示的生产级微信小程序项目。用户可以上传图片、输入创作描述、提交异步 AI 任务，并在作品库中查看与收藏结果。

## 当前进度

- Phase 0：需求、架构、数据模型与 API 规划已完成
- Phase 1：微信原生小程序基础版本已完成，当前使用 Mock AI 任务
- MySQL 8.4：已通过 Docker Compose 运行
- Phase 2：Node.js + Express API、数据库迁移和本地上传接口已完成
- Phase 5：本地 Worker 状态流转已完成，当前使用原图适配器

## 本地启动

```powershell
cd "C:\Users\Desong Chen\Desktop\photo_service"
docker compose up -d
```

使用微信开发者工具导入项目根目录。当前 `project.config.json` 使用 `touristappid`，获得正式 AppID 后再替换。

## 项目结构

```text
photo_service/
├─ apps/miniprogram/       微信原生小程序
├─ services/api/           Node.js API（Phase 2）
├─ services/worker/        AI 异步 Worker（Phase 5）
├─ services/cv-service/    Python/OpenCV 服务（Phase 6）
├─ database/               数据库迁移和种子数据
├─ packages/contracts/     前后端共享接口定义
├─ infra/                  Docker、Nginx 与部署配置
└─ docs/                   架构、API 和面试文档
```

## 本地后端启动

```powershell
cd "C:\Users\Desong Chen\Desktop\photo_service\services\api"
npm install
npm run db:migrate
npm start
```

另开一个 PowerShell 启动 Worker：

```powershell
cd "C:\Users\Desong Chen\Desktop\photo_service\services\worker"
npm install
npm start
```

小程序的 `apps/miniprogram/config/env.js` 默认仍为 `useMock: true`，便于前端独立开发。启动 API 和 Worker 后，将它改为 `false`，重新编译即可走真实的上传、任务和作品流程。
