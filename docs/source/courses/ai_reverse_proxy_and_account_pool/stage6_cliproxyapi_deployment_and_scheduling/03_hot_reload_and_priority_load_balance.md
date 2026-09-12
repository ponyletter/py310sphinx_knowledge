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

## 优先级配置与调度策略（fill-first 深度实战）

CLIProxyAPI 支持在 `/CLIProxyAPI/config.yaml` 中自定义多账号调度策略：

```yaml
routing:
  strategy: "fill-first"      # fill-first: 填满优先调度; round-robin: 轮询平摊
  session-affinity: false     # 生图与通用 API 建议关闭会话粘性，实现请求级实时调度
```

### 1. 凭据权重与优先级规则（Priority 核心真相）
在凭据 JSON 文件的顶层可直接声明 `priority`（优先级）与 `weight`（权重）：
* **核心规则**：在底层 Go 调度引擎中，**`priority` 数值越大，优先级越高（Priority 100 > Priority 1）**；
* **生产最佳实践**：
  * 主力号（如新采买的低成本号 / 拼车号）：`"priority": 100, "weight": 100`；
  * 灾备号（个人珍贵 Plus 独享号）：`"priority": 1, "weight": 1`；
* **调度表现**：CPA 将 100% 的流量持续灌给 Priority 100 的主力号；只有当主力号触碰频次限制（HTTP 429）或遭遇模型不兼容（HTTP 400）时，系统才会自动无缝 Failover 激活 Priority 1 的备份号接管。

---

## 智能故障转移与容灾（Automatic Failover）

在实际生产中，经常遇到由于模型类型不匹配、官方限流（HTTP 429）或临时令牌失效导致请求失败的情形。CLIProxyAPI 的 Conductor 引擎具备强大的**自动重试、自愈换票与故障隔离能力**。

### 实战案例 1：令牌失效时的自动换票自愈（Auto-Heal）
当号商发货的初始 `access_token` 已在官方端点失效时，CPA 不会直接报 401 崩溃，而是自动激活自愈流程：
```text
[debug] [codex_executor_execute.go:123] request error, error status: 401, error message: Could not parse your authentication token. Please try signing in again.
[debug] [conductor_refresh.go:419] unauthorized response for codex (codex-account.json), refreshing credentials before fallback
[debug] [conductor_refresh.go:482] refreshed codex, codex-account.json, <nil>
[info ] [events.go:126] auth file changed (WRITE): codex-account.json, processing incrementally
[info ] [gin_logger.go:103] 200 OK | 3.479s | POST "/v1/chat/completions"
```
系统捕获 401 后，瞬间调用 `refresh_token` 向上游换发有效新票并写回磁盘，请求重放成功并返回 200 OK！

### 实战案例 2：模型不兼容时的毫秒级无缝切换
观察以下真实的生产环境调度追踪日志：

```text
# 步骤 1: 客户端请求 gpt-5.6-sol 模型，网关优先选择 Priority 100 的主力账号 A (JonathanSullivan)
[1ea35ec2] [debug] [conductor_execution.go:1788] Use OAuth provider=codex auth_file=codex-JonathanSullivan435658V@outlook.com.json for model gpt-5.6-sol

# 步骤 2: 上游返回 400，账号 A (高权限Free号) 不支持 sol 特权模型
[1ea35ec2] [debug] [codex_executor_stream.go:132] request error, error status: 400, error message: {"detail":"The 'gpt-5.6-sol' model is not supported when using Codex with a ChatGPT account."}
[1ea35ec2] [warn ] [conductor_execution.go:1907] 400 | upstream execution failed: provider=codex auth_file=codex-JonathanSullivan...

# 步骤 3: 调度器并没有将 400 抛给客户端！而是立即无缝尝试 Priority 1 的备用账号 B (akuncalback9-plus)
[1ea35ec2] [debug] [conductor_execution.go:1788] Use OAuth provider=codex auth_file=codex-f11baede-akuncalback9@gmail.com-plus.json for model gpt-5.6-sol

# 步骤 4: 备用账号具备 Plus 特权，执行成功并流式回传！客户端请求耗时 10.5 秒成功完成
[1ea35ec2] [info ] [gin_logger.go:103] 200 OK | 10.591s | POST "/v1/chat/completions"
```

---

## 核心权限边界实测：Free 号 vs Plus 会员号

在号池维护中，切忌将“高权限 Free 开发者号”等同于“Plus 会员号”。我们通过生产全量模型实测，梳理出如下硬核权限分水岭：

| 模型代号 / 接口 | High-Tier Free 账号表现 | ChatGPT Plus 会员号表现 | 生产使用指引与真相 |
| :--- | :--- | :--- | :--- |
| **`gpt-5.6-luna`** | ✅ **完全支持** (200 OK，秒出) | ✅ **完全支持** (200 OK) | 免费号拥有高达 **8 ~ 10M Tokens** 的超大上下文配额，极度适合日常高频代码辅助与文本对话。 |
| **`gpt-5.6-terra`** | ✅ **完全支持** (深度推理) | ✅ **完全支持** (深度推理) | 适合复杂逻辑分析与高难度代码重构。 |
| **`gpt-5.6-sol`** | ❌ **报 HTTP 400 不支持** | ✅ **完全支持** (满血调用) | 旗舰高阶模型仅对订阅级 ChatGPT 账号开放。 |
| **`gpt-image-2` (生图接口)** | 🚨 **报 HTTP 403 Forbidden** | ✅ **完全支持** (支持 16 宫格生图) | ⚠️ **终极结论**：Codex 底层生图接口（`/v1/images/edits`）**100% 仅限 Plus 会员**！发卡网宣称的“Free号生图5-25张”仅限网页端 chat2api，切勿尝试用 Free 号作为小程序生图主力！ |

### 生图 403 真实日志复盘
```text
[debug] [conductor_execution.go:1788] Use OAuth provider=codex auth_file=codex-FreeAccount.json for model gpt-image-2
[debug] [codex_openai_images.go:369] request error, error status: 403, error message: {"detail":"Forbidden"}
[warn ] [conductor_execution.go:1907] 403 | upstream execution failed: provider=codex model=gpt-image-2 err={"detail":"Forbidden"}
```

---

## 多层级账号池分级管理模型

针对规模化运营场景，推荐采用三级分层架构管理凭据：

| 分级队列 | 包含账号类型 | 路由分配机制 | 适用业务场景 |
| :--- | :--- | :--- | :--- |
| **Tier 1: 独享生图主力池** | 官方正价订阅的 Plus 独享账号（支持 `gpt-image-2`、`gpt-5.6-sol`） | `fill-first` 优先调度 | 微信表情包小程序生图、企业核心生成流水线 |
| **Tier 2: 高配文本开发池** | Gamsgo 拼车号、高配带 RT Free 号（支持 `gpt-5.6-luna`、`terra`） | `fill-first` (Priority 100) | AGY 终端日常编程开发、超大长文本上下文推理 |
| **Tier 3: 灾备兜底池** | 备用 Plus 会员号、企业备用 Key | Fallback (Priority 1) | 主力号 429 限流或 400 异常时毫秒级补位救场 |
