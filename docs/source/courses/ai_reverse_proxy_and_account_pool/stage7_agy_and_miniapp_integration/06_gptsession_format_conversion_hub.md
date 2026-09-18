# 7.6 GPTSession2CPAandSub2API：七合一凭据格式转换中枢

> **核心导语：** 随着账号池管理工具的多样化，不同系统之间的凭据格式壁垒日益凸显。GPTSession2CPAandSub2API 是一个完全基于浏览器的纯前端零依赖工具，最初用于将 ChatGPT Web Session 转换为代理工具格式，现已演变为连接 Cockpit Tools、Sub2API、CPA 等生态系统的七合一异构格式互通中枢。

## 1. 项目定位与设计哲学

GPTSession2CPAandSub2API 采用了极简主义与隐私至上的设计哲学：

- **极简架构**：纯前端 SPA（单页应用），由一个约 979 行原生 JavaScript 代码的 HTML 文件构成。
- **零依赖与无构建**：无需任何构建工具，也没有引入外部库，完全在浏览器本地环境中运行。
- **隐私至上（Privacy First）**：坚守“不上云、不落盘”原则，不发起任何凭据上传网络请求，也不在 LocalStorage/Cookie 中写入任何数据。
- **源码与在线体验**：
  - GitHub 仓库：[gtxx3600/GPTSession2CPAandSub2API](https://github.com/gtxx3600/GPTSession2CPAandSub2API)
  - 在线工具：[gtxx3600.github.io/GPTSession2CPAandSub2API/](https://gtxx3600.github.io/GPTSession2CPAandSub2API/)

本项目最初是为了将 `ChatGPT Web Session` 转换为各种代理工具格式而设计的。然而，随着 OpenAI 安全策略的调整，其定位已发生转变，目前主要作为不同工具之间**异构格式转换的桥梁**。

```{admonition} 重要变更提醒
:class: warning
OpenAI 现已封堵通过直接转换 ChatGPT Web Session 来绕过 Codex OAuth 强制绑定手机号（add phone）的漏洞。该工具现在的纯粹定位是作为代理账号池管理工具（如 Cockpit Tools、Sub2API 等）之间的数据格式转换中枢，不再用于绕过风控。
```

---

## 2. 核心技术实现

为了实现多达七种格式的兼容与互通，该工具在底层实现了多项关键技术：

- **智能递归提取（Smart Recursive Extraction）**：
  核心函数 `collectSessionLikeObjects` 能够接收单个 JSON、JSON 数组或任意深度的嵌套对象。它会自动在复杂的层级树中寻找并识别包含 `accessToken` 及身份信息字段的凭据节点。
  
- **JWT 深度解析（JWT Deep Parsing）**：
  不仅提取 `accessToken` 的内容，更深度解码其 JWT payload 部分。从中提取过期时间 `exp`、命名空间 `https://api.openai.com/auth` 下的业务字段（包括 `chatgpt_account_id`、`chatgpt_plan_type`、`chatgpt_user_id`）以及绑定的 `email`。

- **合成 ID Token 生成器（Synthetic ID Token Generator）**：
  针对部分缺少 `id_token` 的输入源，`buildSyntheticCodexIdToken` 函数会生成结构合法的“三段式” JWT 占位符 Token。这一机制有效防止了依赖强校验 JWT 格式的下游工具（如 Cockpit Tools 或 CLIProxyAPI）在解析时发生崩溃。

- **批量处理管线（Batch Processing）**：
  支持直接粘贴文本或拖拽多个 `.json` 文件。内置错误过滤机制、解析状态统计、一键复制结果以及按格式重命名的文件下载功能。

---

## 3. 七大目标输出格式完整技术规范

该工具能够将识别到的会话信息标准化，并输出为七种主流的下游格式。下表提供了简要对照，后续详细说明各格式规范：

| 格式标识 | 目标系统 | 数据结构特征 | 刷新令牌 (refresh_token) 处理 |
| :--- | :--- | :--- | :--- |
| **sub2api** | Sub2API 负载均衡 | 嵌套的 accounts 数组，带并发参数 | 无则依赖 JWT exp 控制自动暂停 |
| **cpa** | Codex-Portable-Auth | 扁平化对象，包含 type: "codex" | 必须，缺失会提供合成占位 |
| **cockpit** | Cockpit Tools | 高度兼容的扁平导入结构 | 支持导入，支持本地管理状态 |
| **9router** | 9router 分发器 | 嵌套 providerSpecificData，高优先级 | - |
| **codex** | 官方 Codex 客户端 | 标准 auth.json (auth_mode, tokens) | 缺失则置为空字符串 |
| **axonhub** | AxonHub 平台 | 适配 Axon 平台字段规范 | 占位符 `__missing_refresh_token__` |
| **codexmanager** | Codex-Manager | 包含 tokens 和 meta 信息的 JSON | 完整支持附加元数据 (note/label) |

### 3.1 sub2api

用于导入 [Sub2API](#) 系统进行并发负载均衡。
- **结构特征**：顶层包含 `exported_at`，数据存放在 `accounts` 数组中。预设 `platform: "openai"`, `type: "oauth"`, `concurrency: 10`, `priority: 1`。
- **关键机制**：
  - 如果凭据中**没有** `refresh_token`，工具会从 JWT 的 `exp` 中提取过期时间填入 `expires_at`，并强制设置 `auto_pause_on_expired: true`，以便到期自动停用。
  - 如果**存在** `refresh_token`，则省略 `expires_at`，将续期逻辑交给 Sub2API 处理。

```json
{
  "exported_at": "2026-09-18T21:38:07Z",
  "proxies": [],
  "accounts": [
    {
      "platform": "openai",
      "type": "oauth",
      "credentials": {
        "access_token": "eyJhbGci...",
        "id_token": "eyJhbGci...",
        "refresh_token": "rt-..."
      },
      "email": "user@example.com",
      "accountId": "org-xxx",
      "concurrency": 10,
      "priority": 1,
      "auto_pause_on_expired": true,
      "expires_at": "2026-09-19T10:00:00Z"
    }
  ]
}
```

### 3.2 cpa (Codex-Portable-Auth)

为 CPA 格式标准设计的扁平化凭据。
- **结构特征**：扁平化结构，明确 `type: "codex"`，包含 `account_id`, `email`, `id_token`, `access_token`, `refresh_token`。
- **处理细节**：如果原始数据缺失 `id_token`，将生成带有 `id_token_synthetic: true` 标记的合成 JWT。
- **注意**：该格式不包含 Agent Identity 相关的凭据导出。

```json
{
  "type": "codex",
  "account_id": "org-xxx",
  "email": "user@example.com",
  "id_token": "eyJhbGci...",
  "access_token": "eyJhbGci...",
  "refresh_token": "rt-...",
  "id_token_synthetic": true
}
```

### 3.3 cockpit

用于 [Cockpit Tools](./05_cockpit_tools_account_lifecycle.md) 的凭据导入。
- **结构特征**：类似 CPA 格式，但增加了 Cockpit 管理特有的状态字段：`last_refresh`, `expired`, `account_note`。
- **兼容性**：100% 兼容 Cockpit Tools 的 Token/JSON 批量导入功能，缺失 `refresh_token` 时设为空字符串 `""`。

```json
{
  "type": "codex",
  "id_token": "eyJhbGci...",
  "access_token": "eyJhbGci...",
  "refresh_token": "",
  "account_id": "org-xxx",
  "email": "user@example.com",
  "last_refresh": 1726690687,
  "expired": false,
  "account_note": "Imported via Hub"
}
```

### 3.4 9router

适配 9router 分发器的配置格式。
- **结构特征**：包含 `providerSpecificData`，设定 `authType: "oauth"`, `priority: 9`, `isActive: true`。

```json
{
  "email": "user@example.com",
  "isActive": true,
  "priority": 9,
  "authType": "oauth",
  "providerSpecificData": {
    "accessToken": "eyJhbGci...",
    "idToken": "eyJhbGci...",
    "refreshToken": "rt-..."
  }
}
```

### 3.5 codex (Official Codex Client)

生成官方 Codex Client 可直接使用的 `auth.json` 格式。
- **结构特征**：标准的 `{ auth_mode: "chatgpt", tokens: { ... }, last_refresh }` 结构。

```json
{
  "auth_mode": "chatgpt",
  "tokens": {
    "access_token": "eyJhbGci...",
    "id_token": "eyJhbGci...",
    "refresh_token": ""
  },
  "last_refresh": "2026-09-18T21:38:07Z"
}
```

### 3.6 axonhub

用于导入 AxonHub 平台的专属格式。
- **关键机制**：如果 `refresh_token` 缺失，为满足系统强校验，会填充占位符 `"__missing_refresh_token__"`，并附加布尔值标志 `axonhub_refresh_token_placeholder: true`。

```json
{
  "email": "user@example.com",
  "access_token": "eyJhbGci...",
  "id_token": "eyJhbGci...",
  "refresh_token": "__missing_refresh_token__",
  "axonhub_refresh_token_placeholder": true
}
```

### 3.7 codexmanager

用于导入 Codex-Manager 面板工具。
- **结构特征**：具备 `tokens` 和 `meta` (元数据) 分层，支持导入 `label`, `workspace_id`, `note` 等附加管理信息。

```json
{
  "tokens": {
    "access_token": "eyJhbGci...",
    "id_token": "eyJhbGci...",
    "refresh_token": "rt-..."
  },
  "meta": {
    "email": "user@example.com",
    "account_id": "org-xxx",
    "label": "imported",
    "note": "Imported via Hub"
  }
}
```

---

## 4. 输入数据识别与处理管线

GPTSession2CPAandSub2API 的一大优势在于强大的“杂食”输入处理能力。它无需用户手动指定输入数据的来源类型。

### 支持的输入源
1. **ChatGPT Web Session**（获取自 `https://chatgpt.com/api/auth/session`）
2. **9router 导出文件**
3. **原生 Codex `auth.json`**
4. **AxonHub 格式文件**
5. **Codex-Manager 导出 JSON**

### 字段提取优先级与流水线
在解析嵌套对象时，系统按照以下顺序合并字段信息，优先级：
1. 直接在当前对象层级匹配的 `accessToken`、`email`、`accountId`。
2. 从 `accessToken` 的 JWT Payload 深度解析提取。

````
```{mermaid}
flowchart TD
    A["用户输入: 文本粘贴 / 文件拖拽"] --> B{解析为 JSON}
    B -- 失败 --> E[输出错误并跳过]
    B -- 成功 --> C["调用 collectSessionLikeObjects 递归遍历"]
    
    C --> D{节点是否包含 AccessToken ?}
    D -- 否 --> C
    D -- 是 --> F["深度解析 JWT Payload"]
    
    F --> G["提取 exp, 账户ID, email"]
    G --> H{是否存在 ID Token?}
    H -- 否 --> I["生成 Synthetic ID Token"]
    H -- 是 --> J[保留原始数据]
    
    I --> K[组装为标准化中间模型]
    J --> K
    
    K --> L["根据用户选择，映射到 7 种目标格式之一"]
    L --> M["单文件复制 / 批量打包下载"]
```
````

---

## 5. 实操指南 — 卡密 JSON 到 Cockpit 的完整转换流程

以用户在号池电商购买了账号卡密，需要导入 Cockpit Tools 为例，典型的操作流程如下：

1. **获取源文件**：从卡密激活网站下载收到的凭据 JSON 文件（通常是 CPA 或 sub2api 格式）。
2. **打开工具**：访问 [GPTSession2CPAandSub2API](https://gtxx3600.github.io/GPTSession2CPAandSub2API/) 在线页面。
3. **选择目标格式**：在工具顶部导航栏，点击 `cockpit` 选项卡，指定转换目标格式。
4. **加载文件**：点击页面中的“选择文件”（或直接将文件拖入虚线框中），支持批量选中多个下载好的 JSON 卡密文件。
5. **自动解析**：工具瞬间在本地完成解析，页面会显示解析成功/失败的统计摘要。
6. **导出下载**：确认无误后，点击“下载 JSON”按钮，系统会将转换好格式的文件以 `cockpit_xxx.json` 保存到本地。
7. **导入系统**：返回 Cockpit Tools 管理后台，利用其批量导入功能，上传转换后的文件，完成账号入库。

```{admonition} 批量处理提示
:class: tip
无需手动合并文件，您可以直接框选数十个 JSON 文件一次性拖入工具，系统会自动处理为目标格式的数组或对应数据结构。
```

---

## 6. 离线本地运行与安全审计

对于拥有高价值账号池，对数据安全有极高要求的用户，完全可以将工具部署在本地断网环境。

### 离线部署步骤
```bash
# 1. 克隆源码仓库
git clone https://github.com/gtxx3600/GPTSession2CPAandSub2API.git

# 2. 进入目录
cd GPTSession2CPAandSub2API

# 3. 直接用浏览器打开单 HTML 文件
# (以 macOS 为例)
open docs/index.html
# (或者直接双击文件)
```

### 安全审计便利性
得益于工具**单文件（Single HTML）**、**零依赖（Zero dependencies）**的设计，安全审计极为容易。打开 `index.html` 即可在一页内通读全部 JavaScript 源码，确认没有任何隐藏的 `fetch`、`XMLHttpRequest` 等向外发送网络请求的代码，保障账号数据资产绝对安全。

---

## 7. 生态互通性与协同工作流

下表展示了 GPTSession2CPAandSub2API 串联各大系统的兼容互通能力：

| 格式 | Cockpit Tools | Sub2API | CPA Client | 9router | Official Codex | AxonHub | Codex-Manager |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **支持互通** | ✅ 完美导入 | ✅ 完美兼容 | ✅ 双向兼容 | ✅ 完美导入 | ✅ 完全兼容 | ✅ 兼容导入 | ✅ 兼容导入 |

### 推荐工作流实践
1. **老旧资产盘活（Session to Pool）**：
   早期提取的 ChatGPT Web Session -> GPTSession2CPAandSub2API -> 转换为 Cockpit/Sub2API 格式 -> 批量导入系统。
2. **长效稳定账号（Refresh Token 获取）**：
   对于高质量账号，建议后续直接使用 [Cockpit Tools 的 OAuth 免登提取](./05_cockpit_tools_account_lifecycle.md) 获取完整的 `refresh_token`，确保无限续期。本工具仅作为过渡期的转换手段。
3. **跨设备/跨节点迁移（Multi-device migration）**：
   从 Cockpit Tools 中批量导出账号为 sub2api/cockpit 格式 -> 发送给新设备/其他服务器 -> 再次导入，实现快速迁移备份。

---

## 8. 版本演进与关键节点

GPTSession2CPAandSub2API 的演进历史见证了代理工具生态的发展：

- **2026-05-08**：项目创建，最初仅支持基本的 Session 转换。
- **2026-05-22**：
  - 针对 sub2api 格式新增了 `expires_at` 解析与 `auto_pause_on_expired` 字段，加强到期管控。
  - 加入对原生 Codex `auth.json` 导出格式的支持。
- **2026-05-25**：合并 PR #9，生态大扩容，加入 9router、AxonHub、Codex-Manager 格式支持，并引入了完备的单元测试。
- **2026-06-09**：由于 OpenAI 政策变化，工具正式添加“OpenAI 强制手机绑定风控”预警（重要变更提醒）。
- **2026-06-10**：优化带有有效 `refresh_token` 的账号逻辑，使之在转换为 Sub2API 格式时更好地支持自动续期。

> **延伸阅读：** 关于 Token 生命周期管理与强校验，请参阅 Stage 3 以及 Stage 6 等相关章节的内容。
