# 6.5 Web 可视化管理控制台与高可用运维实战

在多账号、多供应商的大模型反向代理集群中，如果仅依赖 Linux 命令行与手动编辑 JSON 维护号池，运维人员将面临极高的管理心智负担与翻车风险：
1. **凭据健康状态黑盒**：无法直观掌握哪些账号额度耗尽、哪些已触发官方 401 封停；
2. **多账号模型支持边界模糊**：无法快速厘清某个 Free 账号究竟支持哪些模型、是否包含了特权模型；
3. **手动修改易导致语法事故**：在高频变更凭据属性（如调整优先级、权重、添加备注）时，手动编辑 JSON 极易破坏格式引发解析崩溃；
4. **Free 账号与 Plus 账号混用灾难**：缺乏模型维度的隔离拦截，导致生图或旗舰推理请求被错误路由到 Free 账号引发 400/403 生产报错。

**CLIProxyAPI (CPA)** 内置了一套工业级的现代化单页（SPA）Web 可视化管理控制台。本节将全面拆解其安全登录、仪表大盘、凭据运维、优先级微调、排除 Free 不可用模型以及 API 密钥生成的全流程实战。

---

## 控制台架构与公网 HTTPS 安全登录

CLIProxyAPI 的管理面板前端基于现代 Web 技术栈构建，后端通过 `/v0/management/*` 系列 REST API 提供受保护的控制面能力。

### 1. 生产网络链路与 Nginx 反向代理拓扑

```{mermaid}
flowchart LR
    Browser["运维浏览器<br/>https://cpa.tg-cc755.cn/management.html"]
    
    subgraph HostGateway ["宿主机 Nginx 网关 (:443)"]
        direction TB
        NginxStatic["location = /management.html<br/>静态 SPA 资源分发"]
        NginxAPI["location /v0/management/<br/>控制面接口代理"]
    end
    
    subgraph Container ["Docker 容器 (cli-proxy-api)"]
        direction TB
        Port8317["CPA 核心监听 127.0.0.1:8317"]
        AuthInterceptor["Bearer 鉴权拦截器<br/>(bcrypt.CompareHashAndPassword)"]
        CoreEngine["账号池 / 调度引擎 / 配置文件"]
    end

    Browser -->|HTTPS TLS 1.3| NginxStatic
    Browser -->|Authorization: Bearer <Key>| NginxAPI
    NginxStatic -->|HTTP 1.1| Port8317
    NginxAPI -->|HTTP 1.1| Port8317
    Port8317 --> AuthInterceptor --> CoreEngine
```

### 2. 核心访问与登录配置

#### (1) `config.yaml` 关键项核对
确保配置文件开启了远程管理，并配置了管理员密钥：
```yaml
remote-management:
  allow-remote: true           # 必须为 true，允许经由 Nginx 反代的外部流量访问管理接口
  secret-key: "rootsugar"      # 初始直接填明文，启动后自动转为 Bcrypt 加密哈希
  disable-control-panel: false # 必须为 false，保持 Web 控制台开启
```

#### (2) Nginx 站点配置参考（`cpa.tg-cc755.cn`）
在 `/etc/nginx/sites-available/cpa.tg-cc755.cn` 中，确保将请求准确反代至容器的 `8317` 端口：
```nginx
server {
    listen 443 ssl http2;
    server_name cpa.tg-cc755.cn;

    ssl_certificate /etc/letsencrypt/live/cpa.tg-cc755.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cpa.tg-cc755.cn/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8317;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600;
        proxy_send_timeout 600;
    }

    location = /management.html {
        proxy_pass http://127.0.0.1:8317;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_method GET;
    }
}
```

### 3. Web 登录交互与密码自动哈希机制

打开浏览器访问公网管理地址：
```text
https://cpa.tg-cc755.cn/management.html#/login
```

```{image} /_static/research/traditional_templates.png
:alt: CPA Web 控制台登录
:align: center
:width: 700px
```

* **管理密钥（Management Key）**：输入在 `config.yaml` 中配置的明文密码（例如 `rootsugar`）。
* **服务地址（API Base）**：默认自动锁定为当前访问域名（`https://cpa.tg-cc755.cn`），无需改动。
* **记住密码**：勾选后前端会将 Token 暂存至本地安全的 LocalStorage 中，刷新页面无需重复登录。

````{admonition} 核心技术真相：为什么查看 yml 文件密码“不是明文”？
:class: important

许多工程师在初次查看 `/root/cliproxyapi/config.yaml` 时，会发现原来的明文密码变成了一串以 `$2a$10$...` 开头的长字符，从而误以为自己密码被篡改或不知如何找回。

**背后的自动加密机制**：
1. **自动升级安全存储**：CLIProxyAPI 的 Go 启动程序内置了密码嗅探器。当读取到 `secret-key` 为普通明文字符串时，会在系统内存中使用单向 Bcrypt 算法（Cost 10）生成散列，并**立即原子化重写回宿主机的 `config.yaml`**。
2. **防爆破防泄漏**：即使 VPS 发生配置泄漏，攻击者也只能拿到不可逆的哈希字符串，保障资产安全。
3. **忘记密码秒级重置秘籍**：
   若忘记密码，**切勿尝试逆向解密**！仅需两步：
   ```bash
   # 步骤 1: 直接在宿主机编辑配置，将 secret-key 改回新密码明文
   sed -i 's|secret-key:.*|secret-key: "rootsugar"|g' /root/cliproxyapi/config.yaml
   
   # 步骤 2: 重启容器生效
   docker restart cli-proxy-api
   ```
   重启后，程序重新读取明文 `rootsugar`，自动更新 Bcrypt 哈希并保存，你即可用新密码登录，整个过程耗时不足 5 秒！
````

---

## 仪表大盘与多供应商流量全景监控

登录成功后，系统直接进入 **运行概览（Dashboard）** 大盘：

```text
┌────────────────────────────────────────────────────────────────────────┐
│  运行概览 (Dashboard)                     服务端版本: v7.2.155 (最新)     │
├────────────────────┬──────────────────────┬────────────────────────────┤
│ 凭据总数: 5 个     │ 正常启用: 5 个       │ 异常/冷却: 0 个            │
├────────────────────┴──────────────────────┴────────────────────────────┤
│ [供应商流量对比]                                                       │
│ • Codex:        4 账号在线  | 请求成功率: 99.8%  | 延迟: 1.2s          │
│ • Antigravity:  1 账号在线  | 请求成功率: 100%   | 延迟: 0.8s          │
├────────────────────────────────────────────────────────────────────────┤
│ [运行时核心配置]                                                       │
│ • 路由策略: fill-first     • 请求重试: 0 次        • 上游代理: 直连     │
│ • 文件日志: 关闭           • WebSocket鉴权: 开启   • 调试模式: 启用     │
└────────────────────────────────────────────────────────────────────────┘
```

1. **供应商横向对比（Fleet Comparison）**：精准汇总各模型源（Codex / Claude / Gemini / Antigravity）的实时活跃度与请求分配量；
2. **全维度健康度雷达**：分为“健康（Healthy）”、“警告（Warning）”与“已停用（Disabled）”，当某个账号遭遇 429 或被官方注销时，卡片状态会即时变色预警；
3. **核心运行时总览**：无需查看后台命令行，直观复核当前调度器策略与系统状态。

---

## 认证文件管理（Auth Files Operations）

导航进入 **「认证文件（Auth Files）」** 专区（路由 `/auth-files`），这里是号池中枢的指挥塔。

### 1. 凭据清单与模型资产反查
* 列表清晰展示出所有已加载的 `.json` 凭据文件名、文件大小、最后修改时间与绑定的官方邮箱地址（如 `codex-accountA@outlook.com.json`）；
* 点击任意凭据条目，可**下钻展开查看该凭据所成功注册的完整模型清单**（例如当前号支持 `gpt-5.6-luna`、`gpt-4o`、`gpt-5.3-codex-spark` 等），一目了然确认账号权限。

### 2. 认证文件上传与导出备份
* **免 SSH 拖拽上传**：采购新号或通过本地脚本抓取到新的 OAuth JSON 凭据后，直接点击右上角 **「上传文件」**，支持批量拖入 `.json` 文件。前端自动校验 JSON 结构，上传后容器内部 Linux inotify 监听器毫秒级感知并完成热注入；
* **单键下载备份**：点击操作栏的 **「下载」** 按钮，即可将线上正在运行并已刷新 Token 的最新 JSON 凭据导出到本地作为容灾备份。

### 3. 主动重置与手动刷新凭证（Manual OAuth Refresh）
* 当某个账号出现临时响应卡顿，或者你希望在长假/重大活动前对所有账号的 Token 进行主动换新保活时，无需等待 15 分钟后台轮询；
* 直接点击该账号右侧的 **「刷新 OAuth 凭证」** 按钮。网关底层将立即使用凭据内的 `refresh_token` 向官方 OAuth 端点发起换发，成功后即刻重置并在本地磁盘完成回写持久化。

### 4. 账号注销与批量死号清理
* **单项删除**：点击「删除」按钮，确认后即可将该 JSON 凭据从磁盘移除并从活跃调度池中剔除；
* **一键清理问题凭证（Delete Problem Credentials）**：当遇到官方大规模风控清退时，直接点击顶部的 **「删除问题凭证」**，网关会自动扫描所有标记为 401 Unauthorized 或已彻底失效的废号并一次性批量抹除，避免人工逐个核查的繁重工作；
* **批量清空**：支持「删除全部」进行号池彻底重建。

---

## 凭据高级属性可视化调优（优先级、权重与备注）

在 Web 控制台中点击凭据的 **「编辑」** 按钮，可以直接对该账号的高级调度参数进行无损热微调：

```{mermaid}
graph TD
    subgraph EditModal [Web 编辑凭据弹窗]
        P["优先级 Priority<br/>(默认: 0，数值越大越优先)"]
        W["调度权重 Weight<br/>(默认: 100，加权轮询权重)"]
        N["自定义备注 Note<br/>(如: 发卡网拼车-01 / 官方独享Plus)"]
        DC["禁用冷却调度 Disable Cooling<br/>(开关: true/false)"]
    end

    EditModal -->|一键保存| WebAPI["POST /v0/management/auth-files/fields"]
    WebAPI -->|写回持久化| JSONDisk["宿主机 ./auths/codex-xxx.json"]
```

### 1. 优先级可视化微调（Priority）
* **调度铁律**：CLIProxyAPI 的 Go 调度器严格遵循 **`priority` 数值越大，调度顺位越靠前**（100 > 10 > 1）；
* **最佳落地策略**：
  * **低成本/拼车主力号**：设置 `priority = 100`，让流量 100% 优先灌给主力低价号；
  * **企业独享/昂贵正价 Plus 号**：设置 `priority = 1`，作为冷备灾备号，仅当主力号耗尽触发 429 时才无缝接盘救场。

### 2. 自定义业务备注（Note / Remark）
在多号混部的生产环境中，账号文件名往往是类似 `codex-user91823@outlook.com.json` 这种无规则字符串。通过 Web 控制台为每个账号添加备注：
* 示例：`"主力号-01-卡商A采购-到期时间10.15"`
* 示例：`"灾备独享Plus-02-香港实体Visa年付"`
资产归属与生命周期清清楚楚。

### 3. 禁用冷却调度（Disable Cooling）
正常情况下，如果账号上游返回暂态错误，网关会将其置入冷却队列（Cooling Down）。对于部分具备极高承载能力的独享企业账号，可在设置中勾选开启「禁用冷却」，确保请求随时可以即时重试。

---

## 核心防翻车利器：排除 Free 不可用模型（OAuth Excluded Models）

在所有号池运维实践中，**「排除 Free 不可用模型」是防止生产事故的最关键屏障！**

### 1. 生产痛点：为什么必须排除不可用模型？

很多号商出售的所谓“低成本 Codex 账号”本质上是**免费开发者账号（High-Tier Free 账号）**。这类账号有两大致命硬伤：
1. **调用旗舰推理模型 `gpt-5.6-sol` 报 HTTP 400**：官方限制仅订阅了 ChatGPT Plus 的付费账户才可使用该模型；
2. **调用图像生成接口 `gpt-image-2` 报 HTTP 403 Forbidden**：官方严格限制生图接口仅对 Plus 会员开放。

若在号池中混部了 Free 号与 Plus 会员号，当你的微信小程序或业务中枢发起生图或 `gpt-5.6-sol` 请求时：
* 如果未配置排除模型，网关调度器可能会根据轮询算法把生图任务指派给 Free 账号；
* Free 账号向上游请求后立刻返回 400 或 403 失败；
* 虽然网关具备 Failover 机制会尝试切换下一个账号，但这会导致**客户端接口延迟陡增（白等 3~10 秒），甚至在极端重试耗尽时直接向用户抛出 500 错误**！

### 2. Web 端可视化排除配置（`/auth-files/oauth-excluded`）

在 Web 管理控制台中，导航至 **「排除模型（OAuth Excluded Models）」** 配置中心：

```{image} /_static/research/traditional_templates.png
:alt: 排除不可用模型配置界面
:align: center
:width: 700px
```

#### 实战配置步骤：
1. **选择目标供应商（Provider）**：例如选择 `codex`；
2. **勾选或输入排除模型（Excluded Models）**：
   * 输入 `gpt-5.6-sol`
   * 输入 `gpt-image-2`
3. **点击「保存配置」**。

#### 调度器底层过滤机制解析：
配置保存后，网关底层内存的 `model_registry.go` 会在账号-模型匹配阶段自动建立黑名单索引：

```{mermaid}
flowchart TD
    Req["下游客户端请求: POST /v1/images/generations<br/>(Model: gpt-image-2)"] --> Dispatcher["网关调度引擎 (conductor_execution.go)"]
    
    Dispatcher --> Filter{"校验账号池凭据<br/>是否命中 oauth-excluded-models"}
    
    AccountFree["Free 开发者号<br/>(命中 codex 黑名单 gpt-image-2)"]
    AccountPlus["ChatGPT Plus 独享号<br/>(未命中黑名单)"]
    
    Filter -.->|❌ 预先剥离候选资格，禁止调度| AccountFree
    Filter ==>|✅ 100% 精准分配| AccountPlus
    
    AccountPlus -->|满血调用 200 OK| Upstream["OpenAI 官方端点"]
```

通过这一道静态防线，Free 账号将安分守己地处理日常 `gpt-5.6-luna` 与文本推理对话，而高难度的旗舰模型与多模态生图请求则被 100% 精准导流给 Plus 付费号，**零错误率、零冗余重试开销**！

---

## 后台可视化生成与管理 API 密钥（API Keys）

在日常业务对接中，频繁需要为新开发的微信小程序、本地 Cursor IDE、团队开发人员或自动化测试脚本发放独立的访问令牌。

进入 Web 控制台的 **「配置中心」->「API 密钥列表 (api-keys)」** 模块：

```text
┌────────────────────────────────────────────────────────────────────────┐
│  API 密钥管理 (api-keys)                     [ + 添加 API 密钥 ]       │
├────────────────────────────────────────────────────────────────────────┤
│ 密钥条目                              强度     操作                    │
├────────────────────────────────────────────────────────────────────────┤
│ sk-prod-cliproxy-secret-2026          很强     [复制] [编辑] [删除]     │
│ sk-agy-developer-key-9988             很强     [复制] [编辑] [删除]     │
│ sk-miniapp-avatar-gen-2026            很强     [复制] [编辑] [删除]     │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. 一键生成高强度密钥（Generate）
* 点击「添加 API 密钥」后，弹窗内提供 **「生成」** 按钮；
* 点击即可自动生成具备高熵值、符合业界标准的 32 位随机安全密钥（如 `sk-cpa-7x8a92m...`）；
* 实时显示密钥强度评估仪表（弱 / 一般 / 良好 / 很强），有效防止弱口令被公网扫号盗刷。

### 2. 一键持久化同步生效
在 Web 界面完成添加或编辑后，点击底部的 **「保存修改」**：
* 网关会通过 `/v0/management/config` 接口直接持久化写回宿主机的 `config.yaml` 文件中的 `api-keys` 列表；
* **无需重启 Docker 容器**！内存鉴权池毫秒级热更新，下游客户端立即即可携带新 Token 发起请求。

---

## 常用服务管理与排错运维命令汇总

为方便终端极客与生产自动化运维，以下将核心命令整理成速查清单：

### 1. 容器日常管理
```bash
# 进入部署根目录
cd /root/cliproxyapi

# 查看容器运行状态与端口占用
docker compose ps

# 重启容器 (如修改了 secret-key 明文或宿主机网络)
docker restart cli-proxy-api

# 查看最近 50 条日志并保持实时滚动
docker logs -f --tail 50 cli-proxy-api
```

### 2. 密码重置与配置自愈
```bash
# 紧急将 Web 管理密码重置为 rootsugar (支持明文输入，启动自动哈希)
sed -i 's|secret-key:.*|secret-key: "rootsugar"|g' /root/cliproxyapi/config.yaml
docker restart cli-proxy-api

# 验证管理接口是否已支持新密码鉴权 (返回 HTTP 200 即成功)
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer rootsugar" \
  http://127.0.0.1:8317/v0/management/config
```

### 3. Nginx 外部网络连通性验证
```bash
# 测试 Web 控制台静态页面分发状态 (预期 200 OK)
curl -I https://cpa.tg-cc755.cn/management.html

# 重新加载 Nginx 配置
sudo nginx -t && sudo systemctl reload nginx
```

通过这一整套**「密码自愈加密 + Web 控制台全景监控 + 凭据属性可视化微调 + 排除 Free 冲突模型 + API 密钥一键签发」**的组合拳，原本繁琐脆弱的大模型号池运维工作彻底蜕变为一套具备自愈能力、直观透明的企业级高可用生产基础设施。
