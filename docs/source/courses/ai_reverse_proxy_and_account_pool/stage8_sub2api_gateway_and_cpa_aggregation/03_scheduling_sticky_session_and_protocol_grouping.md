# 8.3 中转网关核心调度机制：会话粘滞（Sticky Session）与跨协议归组

在设计多账号中转与大模型多上游代理系统时，许多初学者常常存在一个严重的技术误区：**“网关路由是不是搞个简单的随机轮询（Round-Robin）就足够了？”**

在真实的生产级大模型中转架构中，随机轮询不仅会导致上游风控与会话混乱，更会带来灾难性的成本恶化——**直接击穿大模型的上下文缓存（Prompt Caching），导致用户和运营方的 Token 账单暴增数倍！**

本节深入剖析 Sub2API 的底层调度源码（`gateway_scheduling.go`），全面揭秘会话粘滞（Sticky Session Affinity）、高缓存命中率降低扣费的实现原理，以及如何优雅地将 CLIProxyAPI (CPA)、CRS2 与 OpenRouter 进行跨协议转换与归组集成。

---

## 为什么不能用随机轮询？Prompt Caching 的经济账

### 1. 现代大模型 Prompt Caching 核心机制
无论是 Anthropic Claude（Prompt Caching）、OpenAI（Cached Input Tokens），还是 Google Gemini（Context Caching），其底层原理均依赖于：**上游推理节点在内存或高速缓存中保留前序对话的 KV Cache**。
* **Claude 官方计费**：常规输入 1M Tokens 为 $3.00；但若命中缓存（Cache Read），每 1M Tokens 仅需 **$0.30（直接降至 1 折，省 90%）**！
* **OpenAI 计费**：命中 Cached Input 时直接享受 **50% 折扣**。

### 2. 随机轮询带来的“缓存灾难”
假设用户在进行多轮长代码分析，累计 Prompt 长度达到 50,000 Tokens：
* **如果使用随机轮询**：
  * 第 1 轮命中账号 A（全量计算，写入缓存）；
  * 第 2 轮请求被随机分配到账号 B（账号 B 根本没有该前缀的缓存，全量重新计算，再次按全价计费并写入 B 的缓存）；
  * 第 3 轮被分配到账号 C……
  * **后果**：所有上游账号的缓存全线击穿，每一次对话都是“全额原价计费”，运营方若按缓存折扣扣用户余额，则自身血亏；若全额扣用户，用户将面临极其高昂的扣费！
* **如果使用会话粘滞（Sticky Session）**：
  * 该用户从第 2 轮开始，请求**永远锁定在账号 A**上；
  * 账号 A 持续命中 Cache Read，输入 Token 成本立减 90%，Sub2API 解析真实 Usage 并给予低额度扣减，双方双赢！

```{mermaid}
sequenceDiagram
    autonumber
    actor User as 客户端 (Claude Code / NextChat)
    participant Sub2API as Sub2API 调度核心 (Sticky Engine)
    participant Redis as Redis 会话注册表
    participant AccA as 上游账号 A (有 KV Cache)
    participant AccB as 上游账号 B (无 KV Cache)

    User->>Sub2API: 发起第 1 轮提问 (计算 sessionHash)
    Sub2API->>Redis: 查询该 sessionHash 绑定的账号 -> 空
    Sub2API->>AccA: 智能分配至账号 A 处理
    AccA-->>Sub2API: 写入上游 KV Cache，返回结果
    Sub2API->>Redis: 绑定 sessionHash -> 账号 A
    Sub2API-->>User: 逐字打字机流式响应

    User->>Sub2API: 发起第 2 轮提问 (携带相同会话上下文)
    Sub2API->>Redis: 查询 sessionHash -> 命中账号 A!
    Sub2API->>AccA: 强行路由至账号 A
    Note over AccA: 命中 Prompt Cache (90% 成本折扣!)
    AccA-->>Sub2API: 返回结果 (Usage 含 cache_read_tokens)
    Sub2API-->>User: 极低费用扣减，流式返回
```

---

## Sub2API 调度内核源码深度拆解

查阅 Sub2API 调度核心文件 `backend/internal/service/gateway_scheduling.go`，其调度算法由以下精密防线组成：

### 1. 会话哈希与 Redis 粘滞提取
```go
// gateway_scheduling.go 源码摘录
var stickyAccountID int64
var stickySource string
if prefetch := prefetchedStickyAccountIDFromContext(ctx, groupID); prefetch > 0 {
    stickyAccountID = prefetch
    stickySource = "prefetch"
} else if sessionHash != "" && s.cache != nil {
    // 从 Redis 缓存中读取该分组及会话绑定账号
    if accountID, err := s.cache.GetSessionAccountID(ctx, derefGroupID(groupID), sessionHash); err == nil {
        stickyAccountID = accountID
        stickySource = "cache"
    }
}
```

### 2. 排队等待保护机制（不盲目打散换号）
当目标粘滞账号由于客户端高频并发达到单号并发上限（Concurrency Limit）时，常规网关会直接换号，而 Sub2API 提供了排队等待机制：
```go
if stickyAccountID > 0 && stickyAccountID == account.ID && s.concurrencyService != nil {
    waitingCount, _ := s.concurrencyService.GetAccountWaitingCount(ctx, account.ID)
    if waitingCount < cfg.StickySessionMaxWaiting {
        // 创建排队等待计划，进入等待队列，保护已有缓存不丢失
        return s.newSelectionResult(ctx, account, false, nil, &AccountWaitPlan{
            AccountID:      account.ID,
            MaxConcurrency: account.Concurrency,
            Timeout:        cfg.StickySessionWaitTimeout, // 默认 120 秒
        })
    }
}
```

### 3. 多维负载评分与降级熔断
当确实没有已绑定的会话，或者旧账号遭遇了上游 429 / 封禁时，Sub2API 会结合以下指标综合打分选号：
* **Priority (优先级)**：高优先级账号组优先承接；
* **Weight (权重)**：按配置权重动态配比；
* **RPM / TPM 窗口水位**：实时预扣与滑动窗口，避免瞬间冲撞官方频率；
* **账号健康度与熔断状态**：自动隔离失效账号。

---

## CPA（CLIProxyAPI）再套一层：跨协议转换与同协议归组

在架构中，“Sub2API 作为总网关，上游套接 CPA、CRS2、OpenRouter 等”是一种极其经典的分层架构：
* **底层（CPA 号池）**：管理数个 Plus 账号、OAuth Token 刷新与 WARP IP 洗白；
* **上层（Sub2API）**：管理用户、API Key、配额充值、分组权限、跨平台协议标准化。

### 1. 跨协议转换的最佳实践
Sub2API 原生内置了**双向协议适配层**：
* 客户端使用 OpenAI 规范格式（`/v1/chat/completions`）发起请求；
* Sub2API 内部自动将其解析并转换为目标渠道所需的协议（如 Claude Message API、Google Gemini GenerativeLanguage API）；
* **在套娃架构中的原则**：建议让底层 CPA 暴露统一的 OpenAI 规范端点，Sub2API 仅将其作为标准的 `Platform: OpenAI` 渠道添加，能够获得最稳健的流式 Tool Calls 与 Function Calling 支持。

### 2. 同协议归组实践原则
在 Sub2API 的管理后台「分组管理」中：
1. **OpenAI 兼容分组（`openai-cluster`）**：
   * 将所有直接支持 OpenAI 格式的渠道归入一组（如：CPA 的 OpenAI 输出端点、OpenRouter、原生 OpenAI 账号、DeepSeek 等）；
   * 模型路由策略选择“按优先级”或“会话粘滞”。
2. **Claude 专属分组（`claude-native`）**：
   * 将原生 Anthropic 渠道或 CPA 的 Claude 原生端口归入此组；
   * 严格启用 Claude Code 客户端特征识别与模型白名单。
3. **隔离互斥**：
   * 严禁将协议格式差异过大的渠道混在同一个没有开启协议转换的分组内，防止流式 SSE 数据包头抖动导致前端渲染异常。
