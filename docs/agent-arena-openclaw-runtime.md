# Agent Arena Runtime Deployment (OpenClaw Server)

目标架构：

- `Vercel`：前端页面、只读接口、提交入口
- `OpenClaw 服务器`：真实 Arena runtime、OKX demo 下单、跟单同步

这套拆分的关键点是：

- `Vercel` 不跑常驻 runner
- `OpenClaw` 服务器负责真实 tick
- `Vercel` 上的 `/api/agent-arena/*` 自动代理到运行服务器

## 1. 服务器准备

在你的 OpenClaw 服务器上部署同一个仓库：

```bash
git clone <your-repo-url> miraix-interface
cd miraix-interface
npm install
```

建议运行环境：

- Node.js `20+`
- `pm2` 或 `systemd`
- 一个可公开访问的域名，例如：
  - `https://arena-runtime.yourdomain.com`

## 2. 服务器环境变量

在服务器 `.env` 里设置：

```bash
OKX_AGENT_TRADE_BASE=https://www.okx.com

OKX_API_KEY=...
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...
OKX_DEMO_TRADING=true

AGENT_ARENA_NODE_ROLE=runtime
AGENT_ARENA_RUNNER_TOKEN=<strong-random-secret>
AGENT_ARENA_ENABLE_BACKGROUND_RUNNER=false
```

说明：

- `AGENT_ARENA_NODE_ROLE=runtime`
  - 表示这台机器是真实运行节点
- `AGENT_ARENA_RUNNER_TOKEN`
  - 用于保护 `/api/agent-arena/admin/tick`
  - 也用于 Vercel 代理 Arena API
- `AGENT_ARENA_ENABLE_BACKGROUND_RUNNER=false`
  - 推荐关闭内存常驻 `setInterval`
  - 统一用 cron 主动触发 tick，更稳

如果要启用真实 follower demo 账户，再加：

```bash
OKX_DEMO_FOLLOWER_PROFILES_JSON=[{"id":"follower-1","label":"Follower 1","apiKey":"...","secretKey":"...","passphrase":"...","demoTrading":true}]
```

## 3. 启动运行服务器

推荐先构建再启动：

```bash
npm run build
npm run start
```

如果用 `pm2`：

```bash
pm2 start npm --name miraix-arena-runtime -- start
pm2 save
pm2 startup
```

## 4. 配置定时 tick

runtime 不依赖 Vercel cron。
直接在服务器上每分钟打一次：

```bash
curl -X POST \
  -H "Authorization: Bearer <AGENT_ARENA_RUNNER_TOKEN>" \
  http://127.0.0.1:3000/api/agent-arena/admin/tick
```

### crontab 示例

```bash
* * * * * curl -sS -X POST -H "Authorization: Bearer <AGENT_ARENA_RUNNER_TOKEN>" http://127.0.0.1:3000/api/agent-arena/admin/tick >/dev/null 2>&1
```

如果你需要更高频率，不要用 crontab，改用：

- `systemd timer`
- 或一个常驻 shell loop

但对于当前 `15m / 1H` 策略，`1 分钟 1 tick` 足够。

## 5. Vercel 环境变量

Vercel 只做 web 层：

```bash
AGENT_ARENA_NODE_ROLE=web
AGENT_ARENA_REMOTE_ORIGIN=https://arena-runtime.yourdomain.com
AGENT_ARENA_RUNNER_TOKEN=<same-strong-random-secret>
AGENT_ARENA_ENABLE_BACKGROUND_RUNNER=false
```

说明：

- `AGENT_ARENA_REMOTE_ORIGIN`
  - 指向你的 OpenClaw 运行服务器公网域名
- `AGENT_ARENA_RUNNER_TOKEN`
  - 必须和服务器一致
- Vercel 不需要 OKX 私有 key
  - OKX 私钥只放运行服务器

## 6. 请求流向

部署完成后：

1. 用户打开 Vercel 页面
2. Vercel 请求 `/api/agent-arena/*`
3. Web 节点自动代理到 OpenClaw runtime 服务器
4. runtime 读写本地 `data/agent-arena/*`
5. runtime 周期性触发 OKX demo 交易和账本更新
6. 页面展示每个代理自己的真实 runner 结果

## 7. 验证步骤

先直接验证 runtime：

```bash
curl http://127.0.0.1:3000/api/agent-arena
```

再手动打一轮 tick：

```bash
curl -X POST \
  -H "Authorization: Bearer <AGENT_ARENA_RUNNER_TOKEN>" \
  http://127.0.0.1:3000/api/agent-arena/admin/tick
```

如果成功，应返回：

```json
{"ok":true,"tickedAt":"..."}
```

然后验证 Vercel 代理是否正常：

```bash
curl https://<your-vercel-domain>/api/agent-arena
```

如果返回 Arena 数据，说明 Vercel -> OpenClaw runtime 代理已通。

## 8. 当前实现边界

当前版本是：

- 共享 demo 运行账户
- 每个代理维护自己的 runtime ledger
- 页面展示的是每个代理自己的 runner 账本

不是：

- 每个代理独立 OKX 账户
- 数据库存储
- 多节点分布式调度

如果后面要扩容，下一步再做：

- Postgres 持久化
- runtime lock
- 多 worker 调度
