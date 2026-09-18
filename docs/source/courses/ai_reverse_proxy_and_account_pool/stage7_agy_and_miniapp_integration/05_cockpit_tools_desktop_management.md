# 7.5 Cockpit Tools 桌面级多账号管理与 Windows 反代实战

> **核心导语：** 本节将深入探讨 Cockpit Tools 这一桌面级多账号管理工具的使用。该工具作为多平台 IDE 和 AI 编程助手的统一登录和调度中心，支持账号额度聚合、自动切换以及本地反代网关服务，尤其是在 Windows 环境下提供了极为便利的实操体验。

---

## 1. Cockpit Tools 项目概览与技术架构

Cockpit Tools 是一款基于 **Tauri (Rust + React + TypeScript + Vite)** 构建的跨平台桌面端应用。它为多款 AI 编程助手和 IDE 提供了一站式的多账号管理与会话调度能力。

* **多平台支持**：支持多达 16 款客户端，包括 Antigravity IDE、Codex、GitHub Copilot、Windsurf、Kiro、Cursor、Grok CLI、CodeBuddy、Trae、Zed、ZCode 等。
* **可视化数据面板**：内置 Dashboard 提供实时的额度监控、重置倒计时提示以及可视化的进度条。
* **当前版本信息**：最新版本为 v1.3.57 (2026-09-18)。
* **开源地址**：[GitHub - jlcodes99/cockpit-tools](https://github.com/jlcodes99/cockpit-tools)

```{mermaid}
flowchart TD
    A[Cockpit Tools Desktop UI<br/>React + Vite] --> B(Tauri Core<br/>Rust)
    B --> C{支持的平台与客户端}
    C --> D[Codex]
    C --> E[Antigravity IDE]
    C --> F[Cursor / Windsurf]
    C --> G[Grok CLI / CodeBuddy]
    B --> H[CLIProxyAPI<br/>网关层]
    H --> I[账号池额度聚合]
```

---

## 2. 下载与安装（重点 Windows）

建议前往官方 Releases 页面获取最新版：[Releases · jlcodes99/cockpit-tools](https://github.com/jlcodes99/cockpit-tools/releases)。虽然部分用户偏好 v0.23.9，但强烈建议安装最新版以获得最新特性支持。

### Windows 系统
推荐使用 `.msi` 格式的安装包，也可使用 `.exe` 格式。
* 安装包命名示例：`Cockpit.Tools_<version>_x64-setup.exe`

### macOS 系统
提供 Universal 架构的 `.dmg` 安装包，也可通过 Homebrew Cask 安装。

```{admonition} macOS 启动报错解决
:class: warning
如果遇到 Gatekeeper 阻止运行的问题，请在终端执行以下命令清除隔离属性：
```bash
sudo xattr -rd com.apple.quarantine "/Applications/Cockpit Tools.app"
```
```

### Linux 系统
支持 `.deb`、`.rpm` 以及便携的 `.AppImage` 格式。

### 源码编译安装
需要提前准备好 Node.js (v18+) 与 Rust 工具链：
```bash
npm install
npm run tauri build
```

---

## 3. Codex 账号 JSON 导入实操

在获取到账号资产后，将其导入 Cockpit 的标准流程如下：

1. **进入面板**：点击左侧边栏的第 4 个按钮进入 Codex 专属管理面板。
2. **导入账号**：点击蓝色的 `+` 按钮，选择 `Import`，支持批量选择 JSON 文件。
3. **格式验证**：确保你的 JSON 格式符合 Cockpit 的原生格式 (`cockpit_tools` format)。
   * 如果你持有的 JSON 是 `CPA` 或 `sub2api` 格式，**必须先使用工具**（如 `GPTSession2CPAandSub2API`）进行格式转换（详见下一篇 7.6 节）。
4. **完整导入工作流**：卡密网站激活 $\rightarrow$ 下载 JSON $\rightarrow$ 格式转换 (如有需要) $\rightarrow$ 导入 Cockpit。
5. **启动客户端**：
   * 在启动前，请前往 Settings (设置)，找到 Codex 启动路径配置，选择手动指定或使用 `Default Auto-Select`（默认自动匹配）。
   * 点击每个账号右侧的 Launch 按钮即可启动对应的 Codex 客户端。

---

## 4. API 服务 — 号池额度聚合与自动切换

**核心概念**：在单账号模式下，一旦某个账号的额度耗尽，你需要手动切换到下一个账号。而通过开启 API 服务，Cockpit 可以将所有（例如 100 个）账号的额度聚合到一个号池中，当单个账号额度耗尽时，服务会自动无缝切换。

### 配置 API 服务步骤

1. 点击 **Add Account** 按钮。
2. 勾选所有免费账号（无需对免费账号做特殊限制）。
3. 点击 **Select All**，然后点击 **Save**。
4. 返回主面板，点击 **Start API** 启动聚合服务。

```{admonition} Standard vs Fast 模式
:class: tip
在 API 服务中，即使全部使用免费账号组成的号池，开启 **Fast 模式**后，依然能够获得相当于 1.5 倍 Plus 账号的响应速度体验。
```

```{mermaid}
flowchart LR
    Client[Codex 客户端] -->|发送 API 请求| Gateway[Cockpit API 服务]
    Gateway --> Pool[多账号聚合池]
    Pool -->|账号 1| Account1[API 额度]
    Pool -->|账号 2| Account2[API 额度]
    Pool -->|账号 N| AccountN[API 额度]
    Gateway -.->|额度耗尽自动切换| Pool
```

---

## 5. 会话管理与聊天记录恢复

在使用过程中，请务必注意会话模式的切换风险。

```{admonition} 模式切换警告
:class: danger
**切勿频繁在 API 服务模式和单账号模式之间切换**，这极易导致历史聊天记录丢失！最佳实践是：选择其中一种模式（API 服务 **或** 单账号）并长期保持。
```

### 聊天记录丢失的恢复方法

如果因为误操作导致会话不可见：
1. 在 Cockpit 中点击 **会话管理**。
2. 选择需要恢复的会话记录（建议直接选择全部）。
3. 点击 **恢复可见性**。

每次恢复操作会将对应的记录以副本形式下载到本地目录：`C:\Users\<username>\.codex`。
* **高阶用户**：可以进入该目录手动清理重复生成的副本记录。
* **普通用户**：**不建议**手动进行任何目录清理，以免误删导致历史记录永久丢失。

---

## 6. 支持的账号格式与导入/导出规范

Cockpit 支持以下几种主流的账号数据结构，供导入和导出使用：

**1. cockpit_tools (Native 原生格式)**
包含完整的 token 链、邮箱、标签、账号名、分组，支持可选的敏感字段。
```json
{
  "account_name": "codex_acc_01",
  "email": "user@example.com",
  "tokens": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "group": "default",
  "tags": ["vip", "fast"]
}
```

**2. auth_json (官方格式)**
标准的 OAuth 认证格式。
```json
{
  "tokens": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

**3. sub2api 格式**
包含并发和优先级配置的聚合结构。
```json
{
  "exported_at": "2026-09-18T12:00:00Z",
  "proxies": [],
  "accounts": [
    {
      "concurrency": 2,
      "priority": 1,
      "tokens": {
        "access_token": "..."
      }
    }
  ]
}
```

**4. cpa 格式**
扁平化数据结构。
```json
{
  "account_id": "acc_001",
  "id_token": "...",
  "access_token": "...",
  "refresh_token": "..."
}
```

---

## 7. Cockpit 内置 Codex API 网关深度解析

Cockpit 内部集成了一个名为 **CLIProxyAPI**（详情可回顾第 6 阶段相关章节） 的 sidecar 服务，它提供了一个兼容 OpenAI 协议的 API 网关。

* **高可用调度**：实现号池负载均衡、失败降级、冷却重试以及严格的并发控制。
* **混合模型路由 (Mixed Model Routing)**：可将对 GPT 模型的请求路由至 Codex 的 OAuth 账号池，将 Grok 或 DeepSeek 请求分别路由至其官方的 provider。
* **客户端运行时注入 (Client Runtime Injection)**：能够动态地将额度 Badge 挂件注入到 Codex 客户端的 UI 界面中。
* **鹈鹕测智 (Pelican Benchmark)**：内置针对多账号的并发基准测试功能，评估号池吞吐量。
* **多实例隔离支持**：启动多个 Codex 实例时，每个实例会使用相互隔离的 Profile 目录，互不干扰。

---

## 8. 安全模型与本地存储路径

所有的鉴权与历史数据均保存在本地，无云端数据库，最大程度保证隐私安全。导出时也提供数据脱敏选项。

**关键本地存储路径**：
* `~/.antigravity_cockpit`：AGY IDE 账号信息。
* `~/.codex`：Codex 默认的 `auth.json` 和历史记录。
* `~/.grok`：Grok 的认证信息与配置文件。
* 系统 `AppData`：`com.antigravity.cockpit-tools`，用于存放多账号管理的 SQLite 数据库。
* **本地 WebSocket 通信**：`127.0.0.1:19528`，提供给各类 IDE 插件（如 Antigravity IDE Plugin）进行集成和调用。

> **回顾与预告**：若你对 Token 机制有疑惑，请参考第 3 阶段的内容；有关复杂号池配置，请参阅第 6 阶段的 CLIProxyAPI 解析。下一节（7.6）我们将实战演练 GPTSession2CPAandSub2API 格式转换工具的使用，敬请期待！
