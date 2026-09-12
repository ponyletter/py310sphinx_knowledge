# 7.1 本地桌面号池工具（CLIProxyAPIPlus）、Claude Code 桥接与 AGY 编程助手集成

大模型高阶编程工具（如 Google Antigravity AGY、Claude Code、Cursor）对底层模型的推理吞吐量与稳定性有着极高要求。如果在本地进行全天候代码重构或触发多 Agent 协同推演，直接直连官方单账号极易撞上 TPM/RPM 速率上限。

针对个人开发者与团队，除了在海外 VPS 部署外，在本地运行**轻量级桌面代理号池工具（基于开源项目 `CLIProxyAPIPlus` / `ToAPI Proxy`）** 也是一种极其轻巧、开箱即用的高性价比方案。

本节系统讲解跨平台桌面工具的使用、多账号导入，以及如何将其无缝桥接到 **Claude Code** 与 **Antigravity (AGY)**。

---

## 一、跨平台本地桌面代理工具（ToAPI Proxy / CLIProxyAPIPlus）

为了降低普通开发者在本地配置 Docker 与编译 Go 环境的门槛，社区基于 `CLIProxyAPIPlus` 封装了专用的跨平台桌面客户端应用：

### 1. 四大系统芯片架构安装包规范
根据本地电脑的芯片架构与操作系统，选择对应的软件包：
- **Mac 平台 (Intel 芯片)**：`ToAPI_Proxy_xx_macos_intel.dmg`
- **Mac 平台 (Apple Silicon M系列芯片 M1/M2/M3/M4)**：`ToAPI_Proxy_xx_macos_apple_silicon.dmg`
- **Windows 平台 (x64 传统架构)**：`ToAPI_Proxy_xx_windows_x64_setup.exe`
- **Windows 平台 (arm64 架构)**：`ToAPI_Proxy_xx_windows_arm64_setup.exe`

下载安装后启动，软件将在本地环回端口（通常为 `http://127.0.0.1:8317`）静默拉起高性能代理核心。

---

## 二、账号池导入与登录实操（两种模式）

桌面工具支持将多个 Plus 账号（如在 Gamsgo 购买的 6 人拼车账号）统一导入池化：

```{mermaid}
flowchart TD
    subgraph LoginChoice [账号登入方式]
        M1["方式 A: 一键导入 VSCode 凭据<br/>(import Current Codex)"]
        M2["方式 B: 官方 OpenAI 邮箱验证码登录<br/>(Login with OpenAI)"]
    end

    subgraph Pool [桌面多账号池]
        AccPool["本地账号池: 账号 1 ~ 7+<br/>自动轮换保活 / 避免单号限流"]
    end

    M1 --> AccPool
    M2 --> AccPool
    AccPool --> Out["对外输出统一接口: http://127.0.0.1:8317/v1"]
```

### 1. 方式 A：从 VSCode Codex 插件一键导入
- 若你已在 VSCode 的 Codex 官方插件中登录过账号；
- 打开本地代理客户端，直接点击 **“import Current Codex”**；
- 客户端将自动提取本地的合法 OAuth 凭证并无缝载入号池。

### 2. 方式 B：走官方 "Login with OpenAI" 邮箱验证码流程
适合导入从正规拼车平台（如 Gamsgo）获取的账号：
1. 在桌面代理工具中点击 **“Login with OpenAI”**；
2. 弹出登录页面后，输入你在拼车后台分配的专属邮箱账号；
3. 输入密码后，若提示安全验证，点击 **“试试邮箱 / 发送验证码”**；
4. 在对应的邮箱控制台获取 6 位数字动态验证码，填入客户端；
5. 验证成功！该账号即被永久载入本地账号池。
6. 重复上述步骤可依次添加 5~10 个账号，实现本地多账号并发调度。

---

## 三、桥接至 Claude Code：在 Claude Code 中使用 GPT-5 系列满血基座模型

Claude Code 是 Anthropic 官方推出的强大终端 Agent 编程利器。通过将本地代理地址映射为 Claude Code 的上游端点，开发者可以以极低成本让 GPT-5 系列或其它满血基座模型在 Claude Code 内部奔跑：

### 1. 配置 Claude Code 端点环境变量
在终端中注入本地代理地址与密钥：

```bash
# 指向本地代理工具的监听地址
export ANTHROPIC_BASE_URL="http://127.0.0.1:8317"
export ANTHROPIC_API_KEY="sk-prod-cliproxy-secret-2026"

# 或者针对兼容 OpenAI 协议的扩展配置:
export OPENAI_BASE_URL="http://127.0.0.1:8317/v1"
export OPENAI_API_KEY="sk-prod-cliproxy-secret-2026"
```

### 2. 启动 Claude Code 与模型选择
在终端进入你的代码项目目录，启动客户端：

```bash
claude
```

在交互命令行中，通过 `/model` 指令快速查看或切换你配置的基座模型：
```text
/model gpt-5
```
发送一条测试提示词（例如：“请检查当前项目的目录结构”）。若收到模型流畅回复，即代表本地代理号池与 Claude Code 全链路贯通！

---

## 四、接入 Antigravity (AGY) 智能编程助手

对于使用 Google Antigravity (AGY CLI / IDE) 的开发者，接入本地或远程反代同样极为简单：

```{mermaid}
flowchart TD
    subgraph AGYEnvironment [Antigravity 开发者工作区]
        AGYCore[AGY CLI / Antigravity 2.0]
        SubAgent1[Subagent 1: 架构分析]
        SubAgent2[Subagent 2: 测试用例生成]
    end

    subgraph LocalCPA [本地/远程反代网关 :8317]
        CPA[CLIProxyAPI 动态调度引擎]
        Pool[("账号池: 账号 A, B, C...")]
    end

    AGYCore --> SubAgent1 & SubAgent2
    SubAgent1 & SubAgent2 -->|并发 OpenAI 标准请求| LocalCPA
    LocalCPA -->|Round-Robin 分流| Pool
```

### 1. 环境变量全局注入方式
在 `~/.bashrc` 或 `~/.zshrc` 中配置：

```bash
export OPENAI_BASE_URL="http://127.0.0.1:8317/v1"
export OPENAI_API_KEY="sk-prod-cliproxy-secret-2026"
export AGY_DEFAULT_MODEL="gpt-4o"
```
执行 `source ~/.bashrc` 即可生效。

### 2. AGY 客户端配置文件定制
在 `~/.gemini/antigravity-cli/config.json` 中配置模型别名与映射：

```json
{
  "api_endpoint": "http://127.0.0.1:8317/v1",
  "api_key": "sk-prod-cliproxy-secret-2026",
  "default_model": "gpt-4o",
  "streaming": true,
  "request_timeout_seconds": 600,
  "models": {
    "inherit": "gpt-4o",
    "pro": "gpt-5.6-luna",
    "flash": "gpt-5.5"
  }
}
```

### 3. 多 Agent 并发测试验证
在终端执行冒烟测试：
```bash
agy "请简要介绍当前工作空间"
```
得益于本地或 VPS 号池的 Round-Robin 自动轮换调度，AGY 在并发调用多个子智能体（Subagents）时再也不会触发 429 限流，编码推理飞速推进！
