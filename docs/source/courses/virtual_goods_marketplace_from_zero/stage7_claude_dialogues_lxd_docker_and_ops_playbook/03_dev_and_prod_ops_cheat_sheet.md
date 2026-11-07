# 开发与生产环境终极运维命令手册 (Cheat Sheet)

在 24goods（Kesiv）的工程实践中，为了抹平开发机（本地 2GB 内存环境）、测试机（`demo.kesiv.com`）与生产机（日本 IIJ 物理宿主机 LXD 容器 `shop.kesiv.com`）之间的环境差异，并规范人类工程师与 Claude Code 智能体的操作行为，平台封装了标准化的一体化运维脚本体系。

本篇作为全专栏的终极工具手册，系统整理了**开发环境运维（`scripts/dev.sh`）**、**生产环境发布（`scripts/prod.sh`）**、**Claude Code 智能体会话流**以及**生产突发应急响应 SOP**。

---

## 一、开发环境运维实战 (`scripts/dev.sh`)

开发运维脚本专为资源受限的本地机定制，内置依赖校验、容器启停、单模块单测防护与锁机制管理。

```bash
# 切换至项目根目录
cd /root/02project/24goods_web
```

### 1. 核心命令矩阵

| 子命令 | 命令语法 | 适用场景与底层行为 |
| :--- | :--- | :--- |
| **`setup`** | `./scripts/dev.sh setup` | 初始化本地开发环境：自动检测 Python 3.12 / pnpm / Docker 依赖，生成 `.env` 研发文件并安装后端 dev 依赖与前端 npm 包。 |
| **`up`** | `./scripts/dev.sh up` | **启动开发栈**：以后台守护进程启动 PostgreSQL、Redis 依赖容器，并前台/后台拉起 FastAPI 后端（热重载）与 Vite 前端热服务。 |
| **`down`** | `./scripts/dev.sh down` | **优雅停止开发栈**：立刻击杀 uvicorn、node 进程并停止暂存数据库容器，**彻底释放 1GB+ 物理内存**，开发机待机必备。 |
| **`status`** | `./scripts/dev.sh status` | **状态体检**：实时输出后端 8000 端口、买家端 5173、管理端 5174 监听状态、容器健康度与系统 RSS 内存水位。 |
| **`logs`** | `./scripts/dev.sh logs [api\|web\|admin]` | 动态跟踪日志：实时 tail 聚合或指定服务的控制台输出。 |
| **`test`** | `./scripts/dev.sh test` | **本地受控测试**：自动在 `flock` 互斥保护下运行 ruff 语法检查、受限 pytest 单测与前端轻量 lint。 |
| **`reset`** | `./scripts/dev.sh reset` | **重置本地数据库**：强制 drop 数据库、重新运行 Alembic 最新迁移脚本，并自动填充测试种子数据（Seed Data）。 |
| **`creds`** | `./scripts/dev.sh creds` | **输出当前凭证**：打印本地生成的管理员初始账号、演示商户 API 密钥与测试卡密凭据。 |

### 2. 常用操作范式

```bash
# 范式 1：开始编写代码前（启动轻量开发服务）
./scripts/dev.sh up
./scripts/dev.sh status

# 范式 2：修改了后端代码，执行安全验证（带互斥锁）
flock .dev/heavy.lock pytest -q tests/test_orders.py
ruff check app/modules/orders/

# 范式 3：修改了前端代码，执行类型检查
cd frontend && pnpm --filter @24goods/web typecheck

# 范式 4：开发结束或准备执行重型编译前（彻底清空常驻开销）
./scripts/dev.sh down
free -m
```

---

## 二、生产环境发布与部署手册 (`scripts/prod.sh`)

生产脚本面向日本 IIJ 物理宿主机的 LXD 容器（`c4-desktop`），严格遵循**最小权限原则、零明文暴露与无缝滚动更新**标准。

### 1. 核心生产命令矩阵

| 子命令 | 命令语法 | 适用场景与技术动作 |
| :--- | :--- | :--- |
| **`sync`** | `./scripts/prod.sh sync` | **拉取最新代码**：执行 `git fetch && git checkout <release-tag>`，核验 Git 提交签名。 |
| **`bootstrap`**| `./scripts/prod.sh bootstrap` | **生产密钥派生**：初始化 `deploy/env/*.env`（各微服务权限受限的环境文件），生成 AES 根密钥与 Ed25519 卡密私钥。 |
| **`deploy`** | `./scripts/prod.sh deploy` | **零停机滚动部署**：触发 `docker compose pull`，执行数据库 Alembic 在线迁移，并平滑重启业务与交付容器。 |
| **`status`** | `./scripts/prod.sh status` | **生产探针检查**：通过 Docker 状态检查与 HTTP `/api/health` 探针核验系统可用性。 |
| **`logs`** | `./scripts/prod.sh logs -f [service]` | **生产日志排查**：实时查看 Caddy 访问日志、API 错误日志或履约 Worker 消费状态。 |
| **`backup`** | `./scripts/prod.sh backup` | **冷热双备**：触发全量 PostgreSQL `pg_dump`，打包密文卡密金库并使用 age/GPG 离线加密存储。 |
| **`install-backup-cron`** | `./scripts/prod.sh install-backup-cron` | **配置定时备份任务**：在宿主机注册每日凌晨 3 点自动加密备份并在异地多点留存 30 天的 cron 任务。 |
| **`smoke`** | `./scripts/prod.sh smoke` | **全链路冒烟测试**：针对生产域名（或预发域名）执行完整的买家下单、易支付仿真、卡密履约闭环检验。 |

### 2. 生产发布标准执行流 (SOP)

```bash
# 步骤 1：连接至日本物理机运维端口
ssh -p 2204 root@141.98.198.150

# 步骤 2：进入 LXD 生产业务容器
lxc exec c4-desktop -- bash
cd /opt/24goods_web

# 步骤 3：拉取最新发布分支
./scripts/prod.sh sync

# 步骤 4：确认关键生产密钥就绪（尤其是 v5.1 引入的管理配置加解密密钥）
if ! grep -q "APP_SETTINGS_KEY" deploy/env/api.env; then
  echo "FATAL: APP_SETTINGS_KEY missing! Aborting deployment."
  exit 1
fi

# 步骤 5：执行生产滚动发布
./scripts/prod.sh deploy

# 步骤 6：触发端到端自动化冒烟测试
python3 e2e/smoke.py --base https://shop.kesiv.com --seed-env deploy/env/seed.env
```

---

## 三、Claude Code 智能体会话流与 Token 节流宝典

在利用 Claude Code 协同开发大型项目时，掌握高效的 CLI 会话管理与上下文节流技巧是控制研发成本的关键。

### 1. 快速检索并恢复历史会话

针对断联或切出后的场景，使用以下单行 Bash 脚本即可瞬间罗列最近 10 次对话的主题、会话 ID 并一键复制唤醒：

```bash
latest_sid=""; for f in $(ls -t ~/.claude/projects/*/*.jsonl 2>/dev/null | head -n 10); do \
  sid=$(basename "$f" .jsonl); \
  mtime=$(date -r "$f" "+%Y-%m-%d %H:%M" 2>/dev/null || stat -c "%y" "$f" 2>/dev/null | cut -c 1-16); \
  title=$(grep -m 1 -o '"aiTitle":"[^"]*"' "$f" 2>/dev/null | sed 's/.*:"//;s/"//'); \
  [ -z "$title" ] && title=$(grep -m 1 -o '"content":"[^"]*"' "$f" 2>/dev/null | sed 's/.*:"//;s/"//' | cut -c 1-40); \
  [ -z "$title" ] && title="(No question text)"; \
  [ -z "$latest_sid" ] && latest_sid="$sid"; \
  printf "%-38s  %-16s  %s\n" "$sid" "$mtime" "$title"; \
done; \
[ -n "$latest_sid" ] && printf -- "--------------------------------------------------------------------------------\n快速唤醒最新会话 (复制执行):\nclaude --resume %s --permission-mode auto\n" "$latest_sid"
```

### 2. 会话维护与 Token 节流军规

1. **会话压缩 (`/compact`)**：
   当会话上下文轮数超过 20 轮、响应开始变慢时，主动在交互窗口输入 `/compact`，命令 Claude 压缩上下文历史，释放 60% 以上的无效上下文；
2. **单一主题原则 (`/clear`)**：
   严禁在一个会话内既做后端重构、又做前端设计、又做运维调优。完成一个模块的 PR 合并后，立即 `/clear` 或开启全新会话，从 `docs/progress.md` 重新锚定状态；
3. **精准阅读日志**：
   坚决不要将数十兆的构建日志全文粘贴给 AI！使用 `tail -n 50` 或 `grep -E "ERROR|FAILED"` 仅向智能体提供核心报错切片；
4. **Subagent 严格管控**：
   严禁放任 Subagent 深度递归遍历。优先通过指明目标文件（如 `app/modules/orders/router.py`）进行单点修改。

---

## 四、生产突发故障应急响应手册 (Runbook)

当生产系统发生告警或交易异常时，值班工程师应按以下标准 SOP 执行排查。

### 场景 1：收到支付网关大量通知，但订单未履约且 DB 连接池耗尽

* **排查指令**：
  ```bash
  # 检查当前 PostgreSQL 活动连接数与等待事件
  docker exec -it 24goods_db psql -U postgres -d 24goods -c \
    "SELECT pid, state, wait_event_type, wait_event, query FROM pg_stat_activity WHERE state != 'idle';"
  ```
* **处置逻辑**：
  1. 检查是否存在未提交的长事务锁定了 `orders` 表的某一行；
  2. 若存在恶意重复请求，检查网关通知接口是否有防重放幂等锁；
  3. 执行紧急连接释放：`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';`。

### 场景 2：独立履约进程（`delivery`）假死或卡密解封异常

* **排查指令**：
  ```bash
  # 查看 delivery 容器实时日志与内部 Outbox 积压量
  docker compose logs -f --tail=100 delivery
  docker exec -it 24goods_db psql -U postgres -d 24goods -c \
    "SELECT count(*) FROM outbox_events WHERE status = 'PENDING';"
  ```
* **处置逻辑**：
  1. 若积压数不断上升，确认 `deploy/env/delivery.env` 中的卡密解密私钥是否因发布被意外覆写；
  2. 检查 `delivery` 容器是否与 `app_api` 发生网络失联：`docker compose restart delivery`；
  3. 确认后，Outbox 消费器会自动基于 `SELECT ... FOR UPDATE SKIP LOCKED` 重新拉起未消费事件，无损恢复发卡。

### 场景 3：突发严重 Bug 需紧急回滚

* **应急回滚指令**：
  ```bash
  # 1. 查找上一个稳定的 Git Commit SHA 或 GHCR 镜像 Tag
  git log --oneline -n 5
  
  # 2. 强制检出回滚目标并无缝拉起
  git checkout <stable-commit-sha>
  ./scripts/prod.sh deploy
  
  # 3. 验证回滚后健康状态
  ./scripts/prod.sh status
  ```

---

## 阶段小结

至此，《开发与生产环境终极运维命令手册》为整个 24goods 虚拟商品交易系统的技术闭环画上了圆满的句号。

从**架构选型的辩驳**、**密钥体系的规划**、**双进程金库的研发**、**闲鱼式议价与收银台交付**、**白标 SaaS 与防 SSRF 采集引擎**、**AI 智能体工程约束**，直到**真实对话推演、LXD 容器化与运维全景速查**，你已经完整掌握了一套历经生产实战检验、具备最高防御水准与极致研发效率的现代化全栈工程体系！祝你在未来的独立开发与系统架构设计中披荆斩棘、游刃有余！