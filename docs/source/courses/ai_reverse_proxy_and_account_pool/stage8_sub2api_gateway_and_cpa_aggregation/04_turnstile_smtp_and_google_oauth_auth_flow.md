# 8.4 安全防御与三方认证全流程：Turnstile、Gmail SMTP 与 Google OAuth

作为面向公网提供服务的商业级中转网关，完善的**自动化防刷人机验证**、**事务邮件通知（注册/验证码/重置密码）**以及**第三方单点登录（SSO）**是不可或缺的基石设施。

本节系统记录 Cloudflare Turnstile、Gmail SMTP 发信服务的接入规范，并重点深入剖析 **Google OAuth 两套完全不同的体系架构（用户登录 vs Gemini 渠道授权）**，彻底扫清回调地址配置的常见误区。

---

## Cloudflare Turnstile 人机验证无缝集成

相较于传统的 Google reCAPTCHA（国内加载极慢、强迫用户点击红绿灯图片）与 Geetest（极验），**Cloudflare Turnstile** 依托 Cloudflare 全球边缘网络，提供了原生无感、毫秒级响应的人机验证体验，且完全免费。

### 1. Cloudflare 控制台创建 Widget
1. 登录 Cloudflare 仪表盘，进入 **Turnstile** 菜单；
2. 点击 **Add site (添加站点)**：
   * **Site name**：输入如 `Sub2API Turnstile`；
   * **Domain**：输入你的网关域名 `flux.yourdomain.com`（若有子域名或测试域名，需全部列入 Allowed Domains 列表，否则前端验证会报 `Invalid domain`）；
   * **Widget Mode**：推荐选择 **Managed (托管模式)**，由 Cloudflare 自动根据客户端信誉决定无感放行或非侵入交互。
3. 创建完成后获取专属凭据对：
   * **Site Key (站点密钥)**：公开展现于前端，如 `0x4AAAAAAxxxxxxxxxxxxxx`；
   * **Secret Key (通信密钥)**：供后端私密校验，如 `0x4AAAAAAxxxxxxxxxxxxxxxxxxxxxxxxx`。

### 2. Sub2API 管理后台配置
Sub2API 将人机验证作为系统动态配置存储于数据库中，**无需修改 `.env` 或重启容器**：
1. 登录管理员后台，进入 **「系统设置」** -> **「安全与验证码」**；
2. 勾选 **启用 Turnstile 验证码**；
3. 填入对应的 Site Key 与 Secret Key；
4. 保存后，前台用户登录、注册、找回密码与发码页面将自动嵌入 Turnstile 浮层。

---

## Gmail 生产级 SMTP 事务发信服务实战

大模型网关在用户注册验证、邮箱绑定、余额不足预警与异常运维告警时依赖可靠的邮件发送服务。

### 1. Google 账号生成「应用专用密码 (App Password)」
因为 Google 早已关闭了“安全性较低的应用访问 (Less Secure Apps)”，直接使用普通的 Gmail 账号密码会直接被 Google 拦截（报 `535-5.7.8 Username and Password not accepted`）。
必须使用专用应用密码：
1. 登录 Google 账号 -> 进入 **「管理您的 Google 账号」** -> **「安全性」**；
2. 确保已开启 **「两步验证 (2-Step Verification)」**；
3. 在搜索栏直接搜索 **「应用专用密码 (App Passwords)」**；
4. 应用名称输入 `Sub2API Mailer`，点击创建；
5. 系统将生成一组 **16 位字母密码**（如 `xxxx xxxx xxxx xxxx`）。

> [!IMPORTANT]
> **关键去空格细节**：
> Google 生成的应用密码格式为带空格的四段字母（`xxxx xxxx xxxx xxxx`），复制填入配置时，**务必将所有空格去除**，拼接为连续的 16 位字符：`xxxxxxxxxxxxxxxx`！

### 2. Sub2API 邮件参数精准对齐

| 字段名称 | 标准生产配置值 | 说明 |
| :--- | :--- | :--- |
| **SMTP Host** | `smtp.gmail.com` | Google 官方 SMTP 主机 |
| **SMTP Port** | `587` | STARTTLS 加密标准端口 |
| **启用 TLS / STARTTLS** | **勾选开启** | 587 端口通过 STARTTLS 握手协议动态升级为 TLS |
| **SMTP 用户名** | `your_mailer@gmail.com` | 完整的发件人邮箱 |
| **SMTP 密码** | `<YOUR_GMAIL_16_CHAR_APP_PASSWORD>` | 刚生成的 16 位专用密码（无空格） |
| **发件人地址** | `your_mailer@gmail.com` | 必须与 SMTP 用户名严格一致，防止被识为伪造邮件 |
| **发件人名称** | `Sub2API 网关` | 邮件客户端展示的发件人别名 |

配置保存后，在后台界面直接点击 **「发送测试邮件」**，系统向管理员邮箱派发测试函，查看控制台确认返回 `POST /api/v1/admin/settings/send-test-email 200 OK`，发信链路即宣告就绪。

---

## Google OAuth 登录全流程与重大概念辨析

在大模型中转网关中，“Google OAuth”存在两套**用途完全不同、配置入口完全独立、回调地址完全互斥**的体系，初学者极易混淆：

### 1. 两套 OAuth 体系全景对照

| 体系类型 | 场景 A：面向普通用户的网站一键登录 (用户端 SSO) | 场景 B：面向管理员的 Gemini 渠道授权 (模型上游) |
| :--- | :--- | :--- |
| **核心用途** | 允许终端用户不用输入密码，直接用 Google 账号登录/注册 Sub2API 面板 | 将 Google Gemini AI Studio 作为一个“上游模型渠道”接入，白嫖免费配额 |
| **配置入口** | **Sub2API 管理后台** -> 系统设置 -> 登录认证 -> Google 登录 | VPS 宿主机的 **`.env` 文件** 中的 `GEMINI_OAUTH_CLIENT_ID` |
| **Google Cloud 必须配置的回调地址 (Authorized redirect URIs)** | `https://flux.yourdomain.com/api/v1/auth/oauth/google/callback`<br>*(Sub2API 后端实际路由)* | `http://localhost:1455/auth/callback`<br>*(Sub2API 源码硬编码的本地/手动流程)* |

### 2. GCP 控制台创建用户登录客户端步骤
若你的需求是实现“终端用户用 Google 账号登录你的中转平台”：

1. 登录 [Google Cloud Console](https://console.cloud.google.com/)；
2. 选择或新建一个 GCP 项目；
3. 进入 **APIs & Services (API 和服务)** -> **OAuth consent screen (OAuth 同意屏幕)**：
   * 用户类型选择 **External (外部)**；
   * 应用名称填写 `Sub2API AI Gateway`，用户支持电子邮件选择你的 Gmail；
   * 在 **Scopes (范围)** 中确保勾选基础三项：`openid`、`.../auth/userinfo.email`、`.../auth/userinfo.profile`；
   * *重要*：在发布状态中，建议点击 **PUBLISH APP (发布应用)** 为正式版，避免测试模式下 Refresh Token 在 7 天后失效且限制 100 个测试用户。
4. 进入 **Credentials (凭据)** -> 点击 **Create Credentials (创建凭据)** -> 选择 **OAuth client ID**：
   * **Application type (应用类型)**：必须选择 **Web application (网页应用)**；
   * **Name (名称)**：如 `Sub2API Web Client`；
   * **Authorized JavaScript origins (已获授权的 JavaScript 来源)**：
     ```text
     https://flux.yourdomain.com
     ```
     *(注意：必须以 `https://` 开头，末尾严禁加斜杠 `/`)*；
   * **Authorized redirect URIs (已获授权的重定向 URI)**：
     ```text
     https://flux.yourdomain.com/api/v1/auth/oauth/google/callback
     ```
     *(核心避坑点：绝对不能留空，且必须与后端完全吻合！)*
5. 点击创建，即刻弹出 `Client ID` 与 `Client Secret`。

### 3. Sub2API 后台配置与全链路打通测试
在 Sub2API 管理后台系统设置中，除了填入 Client ID 与 Client Secret，**还必须在后台的“重定向 URL”中显式保存**：
```text
https://flux.yourdomain.com/api/v1/auth/oauth/google/callback
```

测试验证全流程是否走通：
```bash
curl -sSL -i https://flux.yourdomain.com/api/v1/auth/oauth/google/start
```
预期输出：
```http
HTTP/2 302 
location: https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fflux.yourdomain.com%2Fapi%2Fv1%2Fauth%2Foauth%2Fgoogle%2Fcallback&response_type=code&scope=openid+email+profile...
```
用户点击前台的 Google 登录按钮，将丝滑跳转至 Google 授权页面，授权后无感完成注册与登录！
