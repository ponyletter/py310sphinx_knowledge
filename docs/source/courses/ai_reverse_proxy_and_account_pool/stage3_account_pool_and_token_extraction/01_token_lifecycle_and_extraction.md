# 01. Token 生命周期拆解与自动化提取链路

要保障号池 24×7 小时持续可用，必须透彻理解 **OAuth 2.0 授权机制** 与 **Token 生命周期**。本节详细拆解为什么普通的短期 Token 会失效，以及生产级号池如何利用 Refresh Token 实现“永动轮转”。

---

## 一、Access Token 与 Refresh Token 的生命周期机制

```{mermaid}
sequenceDiagram
    autonumber
    participant Client as 客户端 / 业务系统
    participant Proxy as CLIProxyAPI 反代网关
    participant OpenAI as OpenAI Auth0 认证服务器
    participant Core as 大模型计算后端

    Note over Proxy: 容器启动加载包含 refresh_token 的 JSON 凭证
    Client->>Proxy: 发起对话请求 (携带普通 API-Key)
    alt access_token 尚未过期 (仍在有效期内)
        Proxy->>Core: 直接携带 access_token 调用推理
        Core-->>Proxy: 返回推理流
    else access_token 已过期或即将过期 (< 5分钟)
        Note over Proxy: 触发 conductor_refresh.go 静默自动续签
        Proxy->>OpenAI: POST /oauth/token (grant_type=refresh_token)
        OpenAI-->>Proxy: 下发新 access_token + 新轮转 refresh_token
        Note over Proxy: 内存实时更新并写回对应 JSON 凭证文件
        Proxy->>Core: 携带全新 access_token 完成业务调用
        Core-->>Proxy: 返回推理流
    end
    Proxy-->>Client: 交付模型结果
```

### 1. 短命的 Access Token (AT)
- **有效期**：通常仅有 **3600 秒（1小时）** 或更短；
- **用途**：作为 Bearer Token 挂载在 HTTP Header 中，直接向推理后端声明鉴权；
- **致命痛点**：若号池中只保存 AT，系统运行 1 小时后所有请求将大面积遭遇 `401 Unauthorized` 致命报错。

### 2. 永动的 Refresh Token (RT)
- **有效期**：通常长达 **30 天至数月**，只要账号本身未被封禁或手动改密，即可反复续期；
- **轮转机制（Refresh Token Rotation, RTR）**：现代安全规范下，每次使用 RT 换取新 AT 时，认证服务器通常会同时下发一个全新的 RT，旧 RT 自动作废。反代程序（如 CLIProxyAPI）在接收到新 RT 后会**自动写回并替换本地 JSON 文件**，从而实现持续无限期的无感顺延。

---

## 二、提取 OAuth 凭据的标准实操路径

提取高质量、带完整 RT 的 JSON 凭据，通常有两种标准途径：

### 途径 A：使用 CLIProxyAPI 自带的 `-codex-login` 命令行工具（最推荐）

CLIProxyAPI 官方二进制内置了标准 OAuth 授权拦截器，能够模拟标准客户端发起 PKCE 认证并在本地自动生成完美格式的 JSON 凭据。

1. **直接启动登录拦截器**：
   ```bash
   # 在海外服务器或本地海外终端执行
   docker exec -it cli-proxy-api ./CLIProxyAPI -codex-login
   ```
2. **终端输出授权链接**：
   终端会输出类似于以下格式的官方登录 URL：
   ```text
   Please open the following URL in your browser:
   https://auth0.openai.com/u/login/identifier?state=...
   ```
3. **完成人机验证与登录**：
   将 URL 复制到浏览器打开，输入对应的 Plus 账号与密码；
4. **自动生成凭证**：
   登录成功后，浏览器会自动重定向到本地监听端口，CLIProxyAPI 自动拦截回调、换取 Token，并在 `auth-dir` 目录下直接生成合规的标准 `codex-xxxx.json` 文件！

### 途径 B：使用 `-codex-device-login` 设备码流（适用于无公网浏览器环境）

如果你的 VPS 无法打开图形界面，且不便进行本地端口回调转发，可使用设备码登录流：
```bash
docker exec -it cli-proxy-api ./CLIProxyAPI -codex-device-login
```
系统会输出一个 **8 位字符的设备配对码**（如 `WDJB-49KM`）和官方配对网址 `https://auth0.openai.com/activate`。用任何手机或电脑浏览器打开该网址，输入该 8 位码并确认授权，服务器后台便会立刻捕获并下发凭据包。

---

### 途径 C：开源会话嗅探与标本工具箱 ([chatgpt-specimen-toolbox](https://github.com/1837620622/chatgpt-specimen-toolbox))

对于已有 Web 浏览器登录会话、需要批量分析账号属性或协助朋友代充的场景，推荐使用开源的标本提取工具：

- **开源仓库地址**：[chatgpt-specimen-toolbox (GitHub)](https://github.com/1837620622/chatgpt-specimen-toolbox)
- **核心功能亮点**：
  1. **一键会话嗅探**：快速捕获当前浏览器上下文中的 `session-token`、`access_token` 以及敏感授权凭据，无需手动打开 F12 审查网络包；
  2. **账号资产与订阅探测**：自动识别目标账号绑定的邮箱、订阅套餐类别（Free / Plus / Team / Enterprise）及会员到期截止日；
  3. **Stripe 独立充值长链提取**：基于会话底层自动调用 `/backend-api/payments/checkout` 并解析出免账密独立付款长链接，实现零风控朋友代付；
  4. **导出标准格式**：将捕获的会话参数一键转为标准 JSON 格式，方便导入号池管理网关。

---

### 途径 D：Claude 官方免密会话直登插件 ([Claude Session Login](https://chromewebstore.google.com/detail/claude-session-login/oajafgeonljhlfedcmeolcfmnnjiclbc))

在维护 Anthropic Claude 账号池时，号商或协同人员交付的往往是长效会话密钥（`sessionKey`，形如 `sk-ant-sid01-...`）。为了避免跨设备登录反复触发邮箱验证码，或在不暴露主账号密码的前提下实现多人复用，可使用专用的 Chrome 浏览器扩展：

- **Chrome 网上应用店官方下载**：[Claude Session Login 扩展插件](https://chromewebstore.google.com/detail/claude-session-login/oajafgeonljhlfedcmeolcfmnnjiclbc)
- **核心机制与使用流程**：
  1. **安装扩展**：在 Google Chrome 浏览器中访问 [Chrome 应用店详情页](https://chromewebstore.google.com/detail/claude-session-login/oajafgeonljhlfedcmeolcfmnnjiclbc)，点击添加至浏览器；
  2. **粘贴 Session Key**：打开 Claude 官方网站（`claude.ai`），点击扩展图标，在输入框中直接粘贴 `sessionKey`（sk 格式会话密钥）；
  3. **一秒免密直登**：插件会自动将该 Session Token 注入浏览器的目标安全 Cookie 作用域并刷新页面，瞬间完成免账密登录；
  4. **号池验活与抓包制作**：登录成功后，即可直接在开发者工具中提取最新的会话 Header 与 Cookie，制作规范的 Claude JSON 凭据挂载进反代服务中。

