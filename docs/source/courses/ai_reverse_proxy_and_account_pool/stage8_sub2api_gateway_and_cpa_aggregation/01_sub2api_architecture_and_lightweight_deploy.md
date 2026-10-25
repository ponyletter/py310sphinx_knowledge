# 8.1 Sub2API 核心架构与低配 VPS 轻量化解耦部署

在构建完底层的 CLIProxyAPI (CPA) 或拥有多个模型服务商（OpenRouter、Google AI Studio、第三方代理）后，开发者通常需要构建一层面向终端业务系统或客户的**商业化 SaaS / 企业级统一模型中转网关**。

**Sub2API**（[GitHub 仓库: Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api)）是目前大模型中转领域极具工程美感的高性能系统，基于 Go (Gin + Ent ORM) 开发，集成了账号分组、渠道权重、会话粘滞调度、跨协议转换、计费计次与精细化风控。

本节重点聚焦于在**低配海外 VPS（如 2GB 内存）**的严苛约束下，如何通过“外部数据库分离解耦 + 单容器轻量化编排 + 跨国网络迁移调优”完成生产级部署。

---

## 核心架构与资源瓶颈痛点剖析

### 1. 默认部署方案在低配 VPS 上的致命风险
Sub2API 官方提供的 `docker-deploy.sh` 脚本默认会在本地拉起 3 个容器：
* `sub2api`（Go 应用核心）
* `sub2api-postgres`（PostgreSQL 18 数据库）
* `sub2api-redis`（Redis 8 缓存）

在官方默认模板 `.env.example` 中，数据库与缓存参数为高并发大内存机器配置：
```env
POSTGRES_SHARED_BUFFERS=1GB
POSTGRES_EFFECTIVE_CACHE_SIZE=4GB
REDIS_POOL_SIZE=4096
REDIS_MAXCLIENTS=50000
```

> [!CAUTION]
> **低配 VPS 宕机警示**：
> 如果你的服务器仅有 2GB 内存（且系统已有 X-UI、Caddy 等其他守护进程，剩余可用内存通常仅 500MB~800MB），如果直接运行默认的三容器编排，PostgreSQL 仅 `shared_buffers` 就会索取 1GB 内存，容器启动瞬间将直接耗尽物理内存与 Swap，触发 Linux 内核的 **OOM Killer (Out of Memory)**，导致 SSH 断开、关键业务进程崩溃！

### 2. 生产级解耦架构：外部托管与单容器运行
为了在有限的 VPS 硬件资源下获得最高稳定性，最佳生产架构是将**计算与存储彻底解耦**：
* **计算端（反代前置 VPS，如 `107.173.10.79`）**：仅运行 `sub2api` 单一二进制容器，剥离本地数据库负载；
* **存储端（外部数据库服务器，如 `139.199.223.40`）**：独立承载 PostgreSQL 18 与 Redis 8 服务；
* **内存收益**：Sub2API 单容器运行内存仅消耗 **约 40MB~50MB**，机器负载接近 0%，彻底终结 OOM 风险！

```{mermaid}
flowchart LR
    subgraph ClientLayer [客户端访问层]
        WebBrowser["管理员 / Web 控制台"]
        APIClient["API 接入端 (NextChat / Cherry / AGY)"]
    end

    subgraph FrontVPS ["反代 VPS (107.173.10.79 / 2GB RAM)"]
        CFProxy["Cloudflare CDN (小云朵)"]
        CaddyProxy["Caddy 反向代理 (:443)"]
        Sub2APIApp["Sub2API 单容器 (:8080)<br/>(Go轻量运行时, 内存仅 ~45MB)"]
        
        CFProxy -->|HTTPS 终止| CaddyProxy
        CaddyProxy -->|127.0.0.1:8080 (流式零缓冲)| Sub2APIApp
    end

    subgraph StorageServer ["外部数据中心 (139.199.223.40)"]
        PGDB[("PostgreSQL 18.6 实例<br/>DB: sub2api / Port: 5432")]
        RedisCache[("Redis 8.x 实例<br/>Port: 6379 (密码认证)")]
    end

    subgraph UpstreamProviders [多协议上游生态]
        CPA["本地/集群 CLIProxyAPI 号池"]
        OR["OpenRouter 商业 API"]
        GAS["Google Gemini AI Studio"]
    end

    WebBrowser --> CFProxy
    APIClient --> CFProxy
    Sub2APIApp -->|TCP 5432| PGDB
    Sub2APIApp -->|TCP 6379| RedisCache
    Sub2APIApp -->|会话粘滞 / 负载均衡| UpstreamProviders
```

---

## 生产级编排文件与参数逐行精讲

### 1. 极简容器编排：`docker-compose.yml`
在部署根目录 `/root/02project/13sub2api/docker-compose.yml` 中，只需声明 Sub2API 核心服务，安全起见仅监听本地回环地址 `127.0.0.1:8080`，避免端口直接暴露公网被扫描：

```yaml
# =============================================================================
# Sub2API Single Container Deployment (External PostgreSQL & Redis)
# =============================================================================
services:
  sub2api:
    image: weishaw/sub2api:latest
    container_name: sub2api
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ulimits:
      nofile:
        soft: 100000
        hard: 100000
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - ./data:/app/data:Z
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "wget", "-q", "-T", "5", "-O", "/dev/null", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

### 2. 环境变量配置文件：`.env`
在同级目录下配置 `.env`，权限必须锁定为 `chmod 600 .env`：

```env
# =============================================================================
# Sub2API Environment Configuration
# =============================================================================

AUTO_SETUP=true
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_MODE=release
RUN_MODE=standard
TZ=Asia/Shanghai

# -----------------------------------------------------------------------------
# 外部数据库连接 (PostgreSQL: 139.199.223.40)
# -----------------------------------------------------------------------------
DATABASE_HOST=139.199.223.40
DATABASE_PORT=5432
DATABASE_USER=root
DATABASE_PASSWORD=rootsugar
DATABASE_DBNAME=sub2api
DATABASE_SSLMODE=disable
DATABASE_MAX_OPEN_CONNS=50
DATABASE_MAX_IDLE_CONNS=10
DATABASE_CONN_MAX_LIFETIME_MINUTES=30
DATABASE_CONN_MAX_IDLE_TIME_MINUTES=5

# -----------------------------------------------------------------------------
# 外部缓存连接 (Redis: 139.199.223.40)
# -----------------------------------------------------------------------------
REDIS_HOST=139.199.223.40
REDIS_PORT=6379
REDIS_PASSWORD=redis_hAhaSr
REDIS_DB=0
REDIS_POOL_SIZE=512
REDIS_MIN_IDLE_CONNS=16
REDIS_ENABLE_TLS=false

# -----------------------------------------------------------------------------
# 安全与上传包体限制 (完全贴合 Cloudflare 免费版 100MB 限制)
# -----------------------------------------------------------------------------
# 100MB = 104857600 bytes
SERVER_MAX_REQUEST_BODY_SIZE=104857600
GATEWAY_MAX_BODY_SIZE=104857600
SERVER_H2C_ENABLED=true

# -----------------------------------------------------------------------------
# 核心系统密钥 (固定随机 32 字节 Hex，防止容器重启后会话失效)
# -----------------------------------------------------------------------------
JWT_SECRET=024d120747b871c1c72ff66a8d4611e31f54aee74570bfe82a0318aa4cbc2998
TOTP_ENCRYPTION_KEY=72f8913a1c21979d56f1c8c978fbaccbe4d81d1cf621b81a71aabc1da99721fc
JWT_EXPIRE_HOUR=24

# -----------------------------------------------------------------------------
# 关键调优：跨国公网数据库迁移超时控制 (极重要避坑项)
# -----------------------------------------------------------------------------
SETUP_MIGRATION_TIMEOUT_SECONDS=600

# -----------------------------------------------------------------------------
# 日志规范与风控默认项
# -----------------------------------------------------------------------------
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT_TO_STDOUT=true
LOG_OUTPUT_TO_FILE=true
LOG_ROTATION_MAX_SIZE_MB=100
LOG_ROTATION_MAX_BACKUPS=5
LOG_ROTATION_MAX_AGE_DAYS=7

OPS_ENABLED=true
SECURITY_URL_ALLOWLIST_ENABLED=false
SECURITY_URL_ALLOWLIST_ALLOW_INSECURE_HTTP=true
SECURITY_URL_ALLOWLIST_ALLOW_PRIVATE_HOSTS=true
```

---

## 跨国网络数据库迁移超时与锁残留深度踩坑

在跨机房连接数据库时，我们遇到了一个极其典型的生产环境网络级故障：

### 1. 现象复现：`context deadline exceeded`
首次启动 Sub2API 容器时，查看 `docker logs sub2api` 发现容器在初始化中途崩溃退出：
```log
Auto setup failed: database initialization failed: check migration 031_add_ip_address.sql: context deadline exceeded
```
紧接着容器重启后再次报错：
```log
Auto setup failed: database initialization failed: acquire migrations lock: context deadline exceeded
```

### 2. 根因剖析（查阅 `backend/internal/setup/setup.go` 源码）
Sub2API 在启动时需要执行近 **300 个 SQL 迁移脚本（Migrations）**：
```go
func (cfg *SetupConfig) migrationTimeout() time.Duration {
    if cfg != nil && cfg.MigrationTimeoutSeconds > 0 {
        return time.Duration(cfg.MigrationTimeoutSeconds) * time.Second
    }
    return defaultMigrationTimeout // 源码写死为 60 * time.Second (60秒)
}
```
* 当数据库在本地容器时，300 次 SQL 执行耗时仅需数秒；
* 但当应用位于美国（`107.173.10.79`）、数据库位于中国广州（`139.199.223.40`）时，**跨太平洋往返网络延迟 (RTT) 约为 200ms**；
* 300 次事务与 checksum 往返交互至少消耗 `300 × 0.2s = 60秒` 以上，刚好触顶了默认的 60 秒硬超时门限，导致事务强行熔断！
* 异常中断后，PostgreSQL 中的 **Advisory Lock（分布式咨询锁）** 未能正常释放，使得下一次重启时在锁等待步骤直接再次超时！

### 3. 标准解决方案
1. **调高迁移超时门限**：在 `.env` 中明确配置 `SETUP_MIGRATION_TIMEOUT_SECONDS=600`（放宽至 10 分钟）；
2. **强制清理残留的 Advisory Lock 与陈旧连接**：
   在宿主机通过临时容器执行清理 SQL：
   ```bash
   docker run --rm -e PGPASSWORD=rootsugar postgres:18-alpine psql \
     -h 139.199.223.40 -U root -d sub2api \
     -c "SELECT pg_advisory_unlock_all(); SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sub2api' AND pid <> pg_backend_pid();"
   ```
3. **重新拉起服务**：`docker compose up -d`，系统将平滑完成全部 298 个迁移文件。

---

## 验证与首次启动初始凭据提取

执行以下命令检查容器启动状态：
```bash
docker compose ps
docker logs sub2api | grep -E "Admin user created|Generated admin" -A 3
```

启动成功后，控制台将输出如下带有一次性凭据的关键日志：
```text
Admin user created: admin-fc18929c03dc@sub2api.local
Generated admin email (login username): admin-fc18929c03dc@sub2api.local
Generated admin password (one-time): be970aa377b470ae30d29d3fc86f909e
IMPORTANT: Save this password! It will not be shown again.
Auto setup completed successfully!
```
保存好该一次性密码，后续我们将通过反向代理配置域名访问并登录系统。
