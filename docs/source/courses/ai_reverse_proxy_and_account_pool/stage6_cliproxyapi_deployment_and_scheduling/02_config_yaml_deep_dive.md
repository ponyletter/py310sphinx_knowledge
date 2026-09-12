# 6.2 核心配置文件 config.yaml 全参数深度剖析

`config.yaml` 是 CLIProxyAPI 网关的核心大脑，控制着安全鉴权、模型映射、调度策略、管理面板与凭据目录寻址。

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
  allow-remote: false
  secret-key: "$2a$10$bBL1V/qAEOdozTbvHfqeBOajYy5k4QV9Xke1tNIIYOsD18FeIZB1q"
  disable-control-panel: false

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

# 9. (可选) 上游出国透明代理配置 (若 VPS 本身 IP 不干净，可挂载住宅代理)
# proxy-url: "socks5://user:pass@res-proxy.provider.com:1080"
```

---

## 核心参数深度剖析与实战细节

### 1. `remote-management`（管理面板与 Bcrypt 安全散列）
- **`allow-remote`**：默认为 `false`。表示只允许在本地内网环境访问管理接口。
- **`secret-key`**：访问 Web 管理后台（8085 端口）时的管理员密码。**重要：此处严禁直接填明文密码，必须填入标准的 Bcrypt 单向哈希值**。
  
  **如何生成强密码的 Bcrypt 哈希值**：
  在服务器上借助 Python 一键生成：
  ```bash
  python3 -c "import bcrypt; pw = b'YourStrongPassword2026'; print(bcrypt.hashpw(pw, bcrypt.gensalt()).decode())"
  # 输出示例: $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
  ```
  将生成的以 `$2a$10$` 开头的长字符串粘贴到 `secret-key` 中即可。
- **`disable-control-panel`**：是否彻底关闭 8085 端口的 Web 界面。若设置为 `true`，则只保留 8317 纯 API 接口，杜绝任何管理界面的潜在暴破攻击面。

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

### 5. `gpt-image-2-base-model`（多模态绘图引擎映射）
- 在各类生图应用或下游客户端场景中，客户端经常会请求 `gpt-image-2` 模型。
- CLIProxyAPI 通过该配置项，将图像提示词重定向交由高智力基座模型（如 `gpt-5.5` 或 `gpt-4o`）进行提示词扩写、结构化推理和最终图像生成渲染，实现卓越的生图效果。

---

## 配置生效与安全性核对清单

修改 `config.yaml` 后，由于容器监听了配置文件的变动（File Watcher），大部分通用配置会自动生效。若涉及端口变动或核心网络模式调整，推荐执行快速重启：

```bash
cd /root/cliproxyapi
docker compose restart
```

### 生产部署安全排查清单
- [x] `ports` 绑定确认是 `127.0.0.1:8317`，未监听公网 `0.0.0.0`；
- [x] `secret-key` 已更新为自己独立的 Bcrypt 散列，未遗留默认空密码；
- [x] `api-keys` 长度大于 24 字符，包含随机数字与字母组合；
- [x] 前端已配置 Nginx 代理，并通过 HTTPS 域名对外交互。
