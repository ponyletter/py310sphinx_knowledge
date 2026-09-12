# 6.3 热重载机制、智能故障转移与多账号负载均衡

在企业级 AI 服务运维中，**业务高可用性（High Availability）与零停机时间（Zero Downtime）** 是底线要求。

如果每次添加新购买的 Plus 账号、删除过期失效的账号，都需要 `docker compose restart` 重启整个服务，正在进行流式输出（SSE）的数百个并发长连接将被生生掐断，造成极其糟糕的用户体验。

CLIProxyAPI 内部实现了一套高度精密的**文件系统监听（File Watcher）、增量热重载（Incremental Hot-Reload）、令牌自动保活刷新（Auto-Refresh Loop）以及上游故障毫秒级故障转移（Automatic Failover）机制**。本节将深入源码级运行逻辑，剖析其工作机理。

---

## 增量热重载运行机制（File Watcher & events.go）

CLIProxyAPI 启动时，`service_lifecycle.go` 会在后台拉起针对凭据目录的实时文件监控器（基于 Linux `inotify` 机制）：

```text
[info ] [service_lifecycle.go:196] file watcher started for config and auth directory changes
```

### 1. 动态感知与增量热重载全流程

```{mermaid}
sequenceDiagram
    autonumber
    actor Ops as 运维工程师 / 自动化脚本
    participant Disk as 宿主机 ./auths 目录
    participant Watcher as 内部监听器 (events.go)
    participant Registry as 内存模型凭据注册表 (model_registry.go)
    participant Conductor as 运行时调度引擎 (conductor_execution.go)

    Ops->>Disk: 放入新账号 codex-newplus.json
    Disk-->>Watcher: 触发 inotify 写入事件 (WRITE)
    Watcher->>Watcher: 校验 JSON 合法性，过滤空文件
    Watcher->>Registry: 增量注入新凭据与所支持的模型列表
    Registry-->>Conductor: 动态更新在线可用账号池 (Active Pool)
    Note over Conductor: 下一个客户端请求即可无缝调度该新账号！
```

### 2. 真实系统日志深度溯源

当我们在宿主机目录 `/root/cliproxyapi/auths/` 中新增或更新一个凭据文件时，容器内控制台将精准打印如下行为轨迹：

```text
[debug] [events.go:82] file system event detected: WRITE /root/.cli-proxy-api/codex-plus-01.json
[info ] [events.go:126] auth file changed (WRITE): codex-plus-01.json, processing incrementally
[debug] [model_registry.go:367] Registered client codex-plus-01.json from provider codex with 11 models
[info ] [clients.go:152] full client load complete - 4 clients
```
- **全程耗时仅数毫秒**；
- **当前正在执行的 HTTP 请求完全不受干扰**；
- **新账号立刻加入轮询或首发候选队列**。

````{admonition} 原子化文件写入技巧（Atomic Write）
:class: tip

在编写 Python 自动抓取或批量写入脚本时，如果直接在大并发时向 `auths/` 写半截文件，可能触发 `[clients.go:179] ignoring empty auth file`。
**最佳实践**：先写入临时文件（如 `/tmp/temp.json`），再使用 Linux 原子重命名命令 `mv /tmp/temp.json /root/cliproxyapi/auths/codex-account.json`。`inotify` 将捕获到单次原子 `MOVED_TO` 事件，实现 100% 稳定的热注入。
````

---

## 令牌自动刷新与保活机制（auto_refresh_loop.go）

OAuth 2.0 凭据中的 `access_token`（AT）通常具备较短的有效生命周期（数小时至数天不等）。若依赖人工定期更换，维护成本极高。

CLIProxyAPI 内置了定时刷新引擎：
```text
[info ] [service_lifecycle.go:206] core auth auto-refresh started (interval=15m0s)
```

1. **周期性巡检**：默认每 15 分钟触发一次自动刷新检查；
2. **静默换发**：`conductor_refresh.go` 解析当前凭据的过期时间戳，若发现即将过期，自动携带凭据内的 `refresh_token`（RT）向上游官方端点发起换发请求；
3. **回写持久化**：换发成功获得全新的 `access_token` 后，系统会自动将新 Token、新过期时间戳回写到挂载目录对应的 `.json` 文件中，确保即使机器重启，凭据状态依然最新；
4. **日志跟踪**：
   ```text
   [debug] [auto_refresh_loop.go:212] auto-refresh scheduler due auths: 1
   [debug] [conductor_refresh.go:482] refreshed codex, codex-account.json, <nil>
   ```

---

## 智能故障转移与容灾（Automatic Failover）

在实际使用中，经常遇到由于模型类型不匹配、官方限流（HTTP 429）或临时网络波动导致请求失败的情形。CLIProxyAPI 的 Conductor 引擎具备强大的**自动重试与故障隔离能力**。

### 实战案例：模型不兼容时的毫秒级切换

观察以下真实的生产环境调度追踪日志：

```text
# 步骤 1: 客户端请求 gpt-5.6-sol 模型，网关首先选择账号 A (JonathanSullivan)
[1ea35ec2] [debug] [conductor_execution.go:1788] Use OAuth provider=codex auth_file=codex-JonathanSullivan435658V@outlook.com.json for model gpt-5.6-sol

# 步骤 2: 上游返回错误，账号 A 不支持该特权模型
[1ea35ec2] [debug] [codex_executor_stream.go:132] request error, error status: 400, error message: {"detail":"The 'gpt-5.6-sol' model is not supported when using Codex with a ChatGPT account."}
[1ea35ec2] [warn ] [conductor_execution.go:1907] 400 | upstream execution failed: provider=codex auth_file=codex-JonathanSullivan...

# 步骤 3: 调度器并没有将 400 错误直接抛给客户端！而是立即无缝尝试备用账号 B (akuncalback9-plus)
[1ea35ec2] [debug] [conductor_execution.go:1788] Use OAuth provider=codex auth_file=codex-f11baede-akuncalback9@gmail.com-plus.json for model gpt-5.6-sol

# 步骤 4: 备用账号具备 Plus 特权，执行成功并流式回传！客户端请求耗时 10.5 秒成功完成
[1ea35ec2] [info ] [gin_logger.go:103] 200 | 10.591s | POST "/v1/chat/completions"
```

通过这一自愈能力，服务可用性（SLA）从传统单账号反代的 85% 跃升至 **99.9%**！

---

## 多层级账号池分级管理模型

针对规模化运营场景，推荐采用三级分层架构管理凭据：

| 分级队列 | 包含账号类型 | 路由分配机制 | 适用业务场景 |
| :--- | :--- | :--- | :--- |
| **Tier 1: 独享主力池** | 官方正价订阅的 Plus 账号（包含美区礼品卡、海外 Visa/Mastercard 银行卡、U卡借记卡等全套正规采买渠道） | `fill-first` 或优先调度 | 微信小程序高客单价会员、AGY 核心开发、高并发实时打字机 |
| **Tier 2: 拼车备用池** | Gamsgo 独立车位号、高信誉中转号 | `round-robin` 轮询平摊 | 普通用户日常闲聊、非流式后台批量摘要提取 |
| **Tier 3: 体验探索池** | 发卡网低成本号、白嫖号、测试号 | 仅作为 Fallback 兜底 | 离线爬虫清洗、自动化单元测试、临时试用体验 |

通过在账号目录命名上加注业务标识（如 `tier1-plus-01.json`、`tier2-shared-01.json`），运维人员一目了然，实现精细化运维与成本精准控制。
