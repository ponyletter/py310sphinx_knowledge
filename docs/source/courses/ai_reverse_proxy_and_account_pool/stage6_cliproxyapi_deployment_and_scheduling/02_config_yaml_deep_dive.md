# 6.2 核心配置文件 config.yaml 全参数深度剖析

`config.yaml` 是 CLIProxyAPI 网关的核心大脑，控制着安全鉴权、模型映射、调度策略、管理面板、出站代理以及防风控协议混淆。

本节将以真实生产环境中的标准配置为基础，对每一项关键参数进行深度逐行拆解，并提供最佳安全加固方案。

---

## 生产级配置样例全景

在 `/root/cliproxyapi/config.yaml` 中，典型的工业级配置结构如下：

```yaml
# ==============================================================================
# CLIProxyAPI 生产级核心服务配置文件
# ==============================================================================

# 1. 基础网络监听
host: "0.0.0.0"
port: 8317

# 2. TLS/HTTPS 配置 (因由前端 Nginx 统一终止 TLS，此处务必保持 false)
tls:
  enable: false

# 3. 远程运维管理面板设置
remote-management:
  allow-remote: true       # 是否允许非 localhost 访问管理接口 (通过 Nginx 反代公网访问时务必设为 true)
  secret-key: "$2a$10$NZCcnti3VCM2bwlaokX7k.XNBzDT/jWKhEaeALY75gVRjLYxY4mqa"
  disable-control-panel: false # 保持 false 开启内置 Web 管理控制面板

# 4. 授权凭据存放目录 (容器内部的绝对路径)
auth-dir: "/root/.cli-proxy-api"

# 5. 客户端访问令牌鉴权池 (支持配置多个 Token 分配给不同下游应用)
api-keys:
  - "sk-prod-cliproxy-secret-2026"
  - "sk-agy-developer-key-9988"

# 6. 运行日志与调试模式
debug: true

# 7. 账号调度与负载均衡策略
routing:
  strategy: "fill-first"   # 可选: "fill-first" 或 "round-robin"

# 8. 图像生成多模态基座模型重定向
gpt-image-2-base-model: "gpt-5.5"

# 9. 出站 IP 混淆与代理网关 (连接同网络下的 Cloudflare WARP 容器)
proxy-url: "socks5://warp-socks:1080"

# 10. 协议层反风控与伪 429 报错混淆防御
antigravity:
  sensitive-words:
    - "Claude Agent SDK"

# 11. 官方客户端指纹伪装（防爬虫探测）
disable-codex-cloaking: false     # 开启 Codex 客户端指纹伪装
disable-claude-cloak-mode: false  # 开启 Claude 客户端指纹伪装
```

---

## 核心参数深度剖析与实战细节

### 1. `remote-management`（管理面板与 Bcrypt 安全散列）
- **`allow-remote`**：
  - 默认值为 `false`（仅允许宿主机内网 127.0.0.1 访问）。
  - **生产建议**：当我们需要配置 Nginx 反向代理并通过公网独立域名（如 `https://cpa.yourdomain.com/management.html`）安全访问 Web 管理面板时，**必须将其设置为 `true`**，否则网关将拒绝外部转发的管理请求。
- **`secret-key`（管理密钥自动哈希与密码重置机制）**：
  - **核心机制**：CLIProxyAPI 具备高度人性化的密码哈希保护策略。在首次配置或修改密码时，**你可以直接填入明文密码**（如 `secret-key: "AdminPassword123"`）。
  - **启动自动散列**：容器启动加载配置文件时，程序会自动检测该字段内容；若发现是普通明文（非 Bcrypt 哈希特征字符串），程序会自动在内存中调用 Bcrypt 算法计算强单向哈希，并**自动将散列值回写至宿主机的 `config.yaml` 文件中**（显示为形如 `$2a$10$...` 的加密散列）。这就是启动后检查 yml 发现“不是明文”的根本原因。
  - **忘记密码的紧急重置方案**：
    由于 Bcrypt 属于强单向加密，任何人都无法反解原始明文。如果你忘记了 Web 管理后台的登录密码，**切勿尝试爆破或重置整个系统**，标准操作极其简捷：
    1. 登录 VPS 宿主机，编辑配置文件：
       ```bash
       vim /root/cliproxyapi/config.yaml
       ```
    2. 将 `secret-key` 直接修改为你所需的新密码明文（例如 `secret-key: "AdminPassword123"`）；
    3. 保存退出后，重启容器：
       ```bash
       docker restart cli-proxy-api
       ```
    4. 容器启动后将重新读取明文、更新 Bcrypt 哈希并回写文件。你即可直接在 Web 管理界面使用新密码 `AdminPassword123` 畅行登录。
- **`disable-control-panel`**：是否彻底关闭内置 Web 控制面板静态资源服务。保持 `false` 即可正常使用自带的现代化管理后台。

### 2. `auth-dir`（凭据存储目录映射）
- 必须严格设置为容器内部路径 `"/root/.cli-proxy-api"`。
- 在宿主机的 `docker-compose.yml` 中，正是通过挂载卷将其绑定到宿主机的 `./auths`：
  ```yaml
  volumes:
    - ./auths:/root/.cli-proxy-api
  ```
  这意味着，你只需直接在宿主机的 `/root/cliproxyapi/auths/` 目录下增删、复制或修改 JSON 凭据，容器便能同步感知。

### 3. `api-keys`（多客户端接入鉴权池）
- 该列表定义了哪些 Bearer Token 能够合法调用本反代服务。
- 当国内后端、终端应用或 AGY 客户端发起请求时，请求头必须包含：
  ```http
  Authorization: Bearer sk-prod-cliproxy-secret-2026
  ```
- 若客户端未传该头或密钥不匹配，网关将直接返回 `401 Unauthorized`，杜绝未授权白嫖。
- 支持针对不同部门或下游业务分发不同的 Token（如一个给国内业务中枢，一个给本地 Cursor/AGY），便于日志审计。

### 4. `routing.strategy`（账号调度模式）
网关支持两种核心调度策略：
1. **`fill-first`（单号跑满策略）**：
   - 优先使用优先级最高或列表靠前的第一顺位账号；
   - 只有当该账号遭遇官方速率限制（HTTP 429 Too Many Requests）或账号失效（HTTP 401）时，才自动将请求切换至下一个可用备用账号；
   - **优势**：充分压榨单个 Plus 账号在 3~5 小时内的额度上限，避免过早分散消耗备用号的冷却时间；
2. **`round-robin`（负载均衡轮询策略）**：
   - 请求按顺序依次分发给凭据池中的所有可用账号（A -> B -> C -> A）；
   - **优势**：极大平摊并发请求压力，显著降低单一账号被官方风控探测为“高频异常使用”的风险，推荐在多 Plus 账号并发池中使用。

### 5. `proxy-url`（容器间 SOCKS5 出站代理网关）
- **作用**：指定 CLIProxyAPI 请求所有海外大模型接口（OpenAI、Anthropic、Google Antigravity、xAI）时必须经过的出站代理节点。
- **配置语法**：
  - 若在同一 `docker-compose.yml` 网络下，直接填写服务名及端口：`proxy-url: "socks5://warp-socks:1080"`；
  - 若代理运行在宿主机本地，可填写宿主机网关或环回：`proxy-url: "socks5://127.0.0.1:40000"`。
- **核心收益**：
  1. 所有出站流量均由 Cloudflare Anycast 优质原生 IP 池对外承载；
  2. 远端 DNS 解析（SOCKS5h），杜绝数据中心 DNS 泄漏与 DNS 污染；
  3. 彻底避免 VPS 自身机房 IP 被 OpenAI / Google 识别为 IDC 代理而频繁遭遇验证码或封禁。

### 6. `antigravity.sensitive-words`（零宽字符混淆防伪 429 报错）
- **痛点机理**：
  高频调用 Claude Code、Cursor、AGY 或各类 Agent SDK 时，请求体中往往带有类似 `"Claude Agent SDK"` 的固定客户端特征指纹。Google Antigravity 后端部署了严格的规则审查引擎，一旦在 Prompt、System Prompt 或元数据中正则匹配到该指纹，**后端会直接拦截该请求，并刻意伪装返回 `429 Rate Limit Exceeded` 或 `Resource Exhausted` 报错**，造成“明明额度充沛却无法调用”的假限流现象。
- **零宽字符混淆机制**：
  在 `config.yaml` 中配置敏感词：
  ```yaml
  antigravity:
    sensitive-words:
      - "Claude Agent SDK"
  ```
  CLIProxyAPI 在向上游发送请求前，会自动对 Prompt 文本执行动态扫描。当匹配到命中词时，网关会在英文字符间动态植入不可见的 **Unicode 零宽空格（Zero-Width Space, `\u200B`）**，例如将 `"Claude Agent SDK"` 实时变换为 `"C\u200blaude Agent SDK"`：
  1. **规避上游正则**：Google 后端的关键词正则引擎无法匹配到被零宽字符隔断的词组，请求直接放行，成功率恢复 100%；
  2. **模型理解无损**：大语言模型的分词器（Tokenizer）在解析时会自动跳过或正常吸收零宽字符，语义完全不发生任何偏移；
  3. **下游展示无感**：对终端开发者或客户端而言，零宽字符在屏幕上完全透明不可见，丝毫不影响代码生成与终端输出。

### 7. 客户端指纹伪装（`disable-codex-cloaking` & `disable-claude-cloak-mode`）
- `disable-codex-cloaking: false`：开启针对 OpenAI Codex 接口的客户端伪装，自动为出站请求补全完整的浏览器特征头（如 `sec-ch-ua`、`referer: https://chatgpt.com/`、真实 Desktop User-Agent），彻底消除无头脚本特征；
- `disable-claude-cloak-mode: false`：开启针对 Anthropic Claude 接口的指纹混淆，防止被上游识别为代理中继节点。

---

## 配置生效与安全性核对清单

修改 `config.yaml` 后，由于容器监听了配置文件的变动（File Watcher），大部分通用配置会自动生效。若涉及网络代理模式（`proxy-url`）调整或防风控模块变更，推荐执行快速重启：

```bash
cd /root/cliproxyapi
docker compose restart
```

### 生产部署安全排查清单
- [x] `ports` 绑定确认是 `127.0.0.1:8317` 与 `127.0.0.1:40000`，未监听公网 `0.0.0.0`；
- [x] `secret-key` 已更新为自己独立的 Bcrypt 散列，未遗留默认空密码；
- [x] `proxy-url` 已绑定到 `socks5://warp-socks:1080`，出站流量走 Cloudflare 原生 IP 池；
- [x] `antigravity.sensitive-words` 已配置 `"Claude Agent SDK"` 混淆，杜绝假 429 拦截；
- [x] `api-keys` 长度大于 24 字符，包含随机数字与字母组合；
- [x] 前端已配置 Nginx 代理，并通过 HTTPS 域名对外交互。
