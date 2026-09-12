# 7.3 全链路监控排错与高频故障代码速查手册

在将海外 AI 反向代理与多账号池投入实际生产运行后，日常的**健康状态巡检、日志审计分析与突发故障快速定位**是保障服务 99.9% 稳定性的核心支撑。

本节系统整理了全链路日志监控技巧、高频报错代码速查手册及一套经过实战检验的长效运维准则。

---

## 生产日志审计与关键特征签名

运维人员可通过跟踪 `cli-proxy-api` 容器日志，掌握当前网关的实时运转脉搏：

```bash
docker compose -f /root/cliproxyapi/docker-compose.yml logs -f --tail 100
```

### 必须掌握的五大健康日志签名

1. **正常请求与耗时响应**：
   ```text
   [info ] [gin_logger.go:103] 200 | 3.935s | 172.20.0.1 | POST "/v1/chat/completions"
   ```
   *说明：请求成功执行，状态码 200，端到端耗时约 3.9 秒。*

2. **多账号动态调度与模型匹配**：
   ```text
   [debug] [conductor_execution.go:1788] Use OAuth provider=codex auth_file=codex-plus-01.json for model gpt-4o
   ```
   *说明：网关调度引擎正在自动分派 `codex-plus-01.json` 账号承接该次模型请求。*

3. **账号增量热重载触发**：
   ```text
   [info ] [events.go:126] auth file changed (WRITE): codex-plus-02.json, processing incrementally
   [info ] [clients.go:152] full client load complete - 4 clients
   ```
   *说明：宿主机放入了新凭据，网关在零中断的前提下瞬间完成新凭据增量载入。*

4. **Token 自动保活与静默刷新**：
   ```text
   [debug] [auto_refresh_loop.go:212] auto-refresh scheduler due auths: 1
   [debug] [conductor_refresh.go:482] refreshed codex, codex-plus-01.json, <nil>
   ```
   *说明：内置的 15 分钟保活定时器成功使用 Refresh Token 换回了全新的 Access Token，并持久化回写至磁盘。*

5. **故障自动转移与上游重试（Failover）**：
   ```text
   [warn ] [conductor_execution.go:1907] 400 | upstream execution failed: provider=codex ...
   [debug] [conductor_execution.go:1788] Use OAuth provider=codex auth_file=codex-plus-backup.json ...
   ```
   *说明：首选账号遇到模型限制或异常，调度器未中断客户端，而是毫秒级拉起备用账号重试成功。*

---

## 生产级高频故障诊断排查百科

遇到接口调用异常或报警时，请对照下表快速定界定位：

| 故障现象 / 状态码 | 根本原因剖析 (Root Cause) | 诊断排查步骤与根治对策 |
| :--- | :--- | :--- |
| **HTTP 400 Bad Request** | 1. 客户端请求的模型 ID 在该账号中不存在（如普通 Free 号请求 `gpt-5.6-sol`）。<br>2. 提示词或图片输入格式不合规。 | 检查日志中的 `err={"detail":"The 'xxx' model is not supported..."}`。确保请求的模型在对应账号权限清单内，或调整 `gpt-image-2-base-model` 映射。 |
| **HTTP 401 Unauthorized** | 1. 客户端传入的 `Authorization: Bearer` 密钥与 `config.yaml` 的 `api-keys` 不匹配。<br>2. 某个账号的 Refresh Token 被官方吊销（如改密或被封号）。 | 1. 核对客户端请求头与 `config.yaml` 中的鉴权 Key。<br>2. 检查日志中哪个 `.json` 刷新失败，将坏死凭据移出 `auths/` 目录。 |
| **HTTP 403 Forbidden** | 1. VPS 机房 IP 被 OpenAI / Cloudflare 官方风控或触发了人机验证（Turnstile / WAF）。<br>2. 官方账号所在地区封禁（Country Not Supported）。 | 1. 使用 4.1 节的 `curl https://chatgpt.com/cdn-cgi/trace` 检查 IP 欺诈度。<br>2. 在 `config.yaml` 中配置 `proxy-url: "socks5://..."` 挂载纯净住宅住宅代理出国。 |
| **HTTP 429 Too Many Requests** | 1. 单个 Plus 账号在短时间内发送频率过快，触发官方每 3 小时额度上限。<br>2. 账号池中所有账号全部耗尽额度。 | 1. 在 `config.yaml` 中将 `routing.strategy` 改为 `round-robin`，平摊并发。<br>2. 向 `auths/` 目录添加新的 Plus 备用账号，触发热重载扩容。 |
| **HTTP 502 Bad Gateway** | 宿主机 Nginx 无法连接 `127.0.0.1:8317`。CLIProxyAPI 容器停止运行或未完成初始化。 | 执行 `docker compose ps` 查看容器状态；若退出执行 `docker compose logs` 检查配置文件是否存在 YAML 语法缩进错误。 |
| **HTTP 504 Gateway Timeout** | 上游生成复杂内容（如生图、长推理）耗时过长，超过了 Nginx 设定的超时阈值。 | 在 Nginx 对应路由中将 `proxy_read_timeout` 调大至 `600s`，并确认是否启用了 `proxy_buffering off;`。 |
| **HTTP 524 A Timeout Occurred** | Cloudflare 免费版 CDN 代理在等待源站响应超过 100 秒时单方面切断长连接。 | 将 Cloudflare 中对应的 `api.yourdomain.com` DNS 记录切换为**灰云（仅 DNS 解析）**，绕过 100 秒超时限制。 |

---

## 长效高可用运维黄金法则

为确保海外反代与账号池能够稳定运行半年以上而无需人工干预，建议坚守以下四条黄金法则：

### 1. 建立凭据与配置的日常异地备份
定期将配置文件与凭据池打包备份，防止 VPS 意外故障：
```bash
tar -czf /root/cliproxyapi_backup_$(date +%F).tar.gz /root/cliproxyapi/config.yaml /root/cliproxyapi/auths/
```

### 2. 账号状态监控与自动化告警
可结合 Prometheus + Grafana 或简单的 Python 告警脚本（钉钉/企业微信机器人），每隔 1 小时向反代服务发起一次健康探针。当连续 2 次返回非 200 状态码时，立即推送告警给运维人员。

### 3. 正价账号续费与礼品卡余额预充
对于核心主力 Plus 账号，提前在对应的美区 Apple ID 中充值足够的礼品卡余额（建议保留 2~3 个月的订阅资金），防止月底由于扣款失败导致订阅掉级。

### 4. 严守安全红线，杜绝内网裸露
始终确保 8317 端口仅监听在 `127.0.0.1`，外网统一收归至 Nginx 443 端口，并通过强密钥与域名白名单进行严格准入控制。

遵循上述生产级规范，你的海外 AI 账号调度体系将坚如磐石，为微信小程序、AGY 编程助手及全方位 AI 业务场景提供源源不断的算力支持！
