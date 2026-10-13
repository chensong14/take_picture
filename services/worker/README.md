# AI Worker

Worker 负责从任务队列读取 `ai_jobs.status = queued` 的任务，依次执行：

1. 图片预处理与安全检查
2. Prompt 模板渲染
3. LLM 或图像模型调用
4. OpenCV 后处理
5. 对象存储上传
6. 更新 `ai_jobs` 和 `works`

模型 API 尚未配置时，Worker 不会伪造生成结果。后续可使用 Redis/BullMQ 或云队列实现可靠投递；当前 API 已经完成 Job 持久化和状态查询。
