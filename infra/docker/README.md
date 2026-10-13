# 本机生产式运行

在项目根目录执行：

```powershell
docker compose up -d --build
docker compose ps
```

本地 API：`http://127.0.0.1:3000/health/ready`

查看日志：

```powershell
docker compose logs -f api worker
```

停止服务：

```powershell
docker compose down
```

不要使用 `docker compose down -v`，否则会删除 MySQL 和上传文件卷。

## 公网隧道

### 临时联调地址

临时 Tunnel 不需要 Cloudflare 账号或 Token：

```powershell
docker compose --profile quick-tunnel up -d cloudflared-quick
docker compose logs --tail=100 cloudflared-quick
```

在日志中找到 `https://*.trycloudflare.com`，然后访问：

```text
https://随机地址.trycloudflare.com/health/ready
```

停止临时 Tunnel：

```powershell
docker compose --profile quick-tunnel stop cloudflared-quick
```

临时地址可能在容器重建后变化，仅用于联调，不能作为小程序正式合法域名。

### 固定域名 Tunnel

配置根目录 `.env` 中的 `CLOUDFLARE_TUNNEL_TOKEN` 后启动：

```powershell
docker compose --profile public up -d cloudflared
```

Cloudflare Tunnel 会把已配置的 HTTPS 域名转发到 Compose 网络中的 `http://api:3000`。Tunnel 的 Public Hostname 配置应指向：

```text
http://api:3000
```
