# 7.4 Claude Code 桥接实战：Gemini 超长上下文调优、号池连网机制与 GPT 绘图 Skill 扩展

在构建完成高可用海外 AI 账号池与反向代理网关（CPA）后，将网关的高性能推理能力无缝交付给本地主流代码智能体（如 **Claude Code**、**Aider**、**Cursor** 等）是赋能日常研发生产力的核心步骤。

本节基于真实生产环境，深入剖析**免费账号连网受限的根本机理**、**客户端 Agent 本地工具闭环**、**Gemini 1M 上下文调优避坑**，并手把手实现一套**利用 Plus 会员权限进行自动绘图的轻量 Skill 扩展系统**。

---

## 一、核心原理剖析：为什么 Free 账号在 Web 端无法连网，而在终端 CLI 却可以？

很多开发者在将 ChatGPT Free 或 xAI Free 账号挂载至中转网关后，常发现一个奇怪的现象：
> 在普通 Web 聊天前端向模型询问最新网页内容时，模型频繁回答“无法连接网络工具”；但如果在本地官方终端运行 Codex 客户端，却能正常抓取网页与分析文档。

### 1. 纯 API 代理与 Agent 智能体的执行主体差异

```{mermaid}
flowchart TD
    subgraph ModeA["模式 A：普通 WebUI 对话（纯 API 模式）"]
        U1["用户提问：请抓取网页"] --> F1["WebUI 客户端<br/>(无本地工具/无沙箱)"]
        F1 --"POST /v1/chat/completions<br/>tools: [] (无工具定义)"--> CPA1["CPA 反代网关"]
        CPA1 --> Cloud1["云端大模型 (GPT Free)"]
        Cloud1 --"模型无工具可用<br/>直接拒答：无法连接网络工具"--> F1
    end

    subgraph ModeB["模式 B：终端 CLI 智能体（Agent Tool Loop 模式）"]
        U2["用户提问：请抓取网页"] --> CLI["本地 Windows 终端 Claude Code / Codex"]
        CLI --"声明可用工具: web_fetch, bash, curl"--> CPA2["CPA 反代网关"]
        CPA2 --> Cloud2["云端大模型"]
        Cloud2 --"输出 Tool Call: fetch(url)"--> CPA2
        CPA2 --> CLI
        CLI --"① 触发本地 Windows 网络请求<br/>真实抓取网页 HTML"--> Web["目标外部网站"]
        Web --"返回网页内容"--> CLI
        CLI --"② 发送 Tool Result (网页文本)"--> CPA2
        CPA2 --> Cloud2
        Cloud2 --"基于网页内容分析输出最终答案"--> CLI
    end
```

### 2. 对接你自己的 CPA 时，它是怎么工作的？

很多开发者直觉上认为：*“是不是我在云端配置了反代网关，所有网络请求和爬虫都由服务器完成？”* —— **并非如此**。

当在本地开发机（如 Windows）运行 Claude Code 或 Codex CLI 并将其网关指向你自己的 CPA（如 `https://cpa.yourdomain.com`）时，其端到端的工作时序如下：

```
[你在本地 Windows 终端输入任务: "请总结 https://docs.example.com 的内容"]
       │
       ▼
[本地 Windows 运行的 Claude Code]
       │  (1) 组装请求：包含你的 Prompt + 本地自带的工具声明 (web_fetch, bash, view_file)
       ▼
[你的私有 CPA 反代网关 (https://cpa.yourdomain.com)]
       │  (2) 协议转换与身份鉴权：将 Anthropic/OpenAI 格式转为上游 Provider 格式
       ▼
[云端 AI 基础模型 (即便绑定的是免费 Free 账号)]
       │  (3) 模型推理计算：识别到需要抓取网页，输出一条标准的 Tool Call 指令
       ▼
[你的私有 CPA 反代网关]
       │  (4) 透传 Tool Call (例如: `fetch_url("https://docs.example.com")`)
       ▼
[本地 Windows 运行的 Claude Code] ◄── 接收到 Tool Call 指令！
       │
       ├─► (5) 本地执行：Claude Code 在你的 Windows 电脑上直接发起网络请求获取网页文本
       │
       ▼
[本地 Windows 运行的 Claude Code]
       │  (6) 组装 Tool Result：将抓取到的几千字网页正文打包为结果消息
       ▼
[你的私有 CPA 反代网关] ──► [云端 AI 基础模型]
                                   │  (7) 二次推理：模型根据回传的正文进行归纳总结
                                   ▼
[本地 Windows 终端] ◄── 输出结构化的网页分析结果给开发者！
```

**这一设计带来的巨大红利**：
1. **完全解耦账号连网限制**：不管你号池里是免费账号还是付费账号，云端模型只负责“发出抓取指令”，真实的网络请求全是在**你本地 Windows 上由客户端执行的**；
2. **零封号风险**：云端官方只看到普通的文本生成与代码交互流量，爬虫行为完全发生在开发者的本地 IP 上，彻底避免了机房 IP 高频爬网页导致账号被连坐封控。

### 3. 在本地 Windows 用 CLI 工具，会调用连网工具吗？自带了吗？还是需要另外配置？

这是许多开发者非常关心的实操疑问：

| 客户端类别 | 是否自带连网工具？ | 连网工具的实现原理 | 是否需要额外配置？ |
| :--- | :--- | :--- | :--- |
| **Claude Code** | **原生自带**基础抓取<br/>（支持 URL 访问与命令执行） | 内置 `read_url_content` 工具，可直接提取网页 Markdown；内置终端工具可执行本地 `curl`、`PowerShell` | **基础抓取免配置**（开箱即用）；<br/>若需**全网关键词检索**，建议挂载 MCP 扩展 |
| **Codex CLI / Aider** | **原生自带**网页读取 | Aider 原生支持 `/web <URL>` 抓取指令；Codex 终端内置终端 Shell 执行环境 | **开箱即用**，自动调用本地 Python 或系统网络栈抓取 |
| **Cursor / Windsurf** | **原生自带**网络搜索 | 软件自身维护了客户端搜索索引与文档爬虫管线 | **开箱即用**，在对话中勾选 `@Web` 即可激活 |

* **原生自带的能力（无需配置）**：
  只要你在对话中直接给出一个具体的 URL 网址（如 GitHub 仓库地址、在线 API 手册、Issue 链接），Claude Code 和各类 CLI 就会自动调用本地网络直接读取，不需要你单独写爬虫代码。
* **什么时候需要额外配置？**
  当你需要让模型像 Google/Brave 搜索一样，根据一段朦胧的“关键词”在互联网上漫游找资料时，模型本身缺乏搜索引擎索引。此时可以通过 **MCP（Model Context Protocol）** 为 Claude Code 挂载一个搜索插件（后文有详细配置指南）。

### 4. xAI 渠道的特殊优化：服务端原生搜索自动注入

如果希望在第三方 WebUI 界面中也能让免费 xAI 账号具备实时联网能力，CPA 支持在网关层自动注入官方搜索工具。在 `/root/cliproxyapi/config.yaml` 中配置：

```yaml
xai:
  # 当请求未声明任何工具时，自动注入 xAI 原生的 x_search 工具定义
  inject-x-search: true
```

启用后，CPA 会在上游代理请求中自动补全 `x_search`，让 `grok-4.5` 与 `grok-4.6` 在不依赖客户端本地环境的情况下直接激活 xAI 官方的实时全网搜索。

### 5. 实战深水区：xAI 连网报错“无法直接搜索 X”与“invoke tool”假死机理及破解方案

在真实业务调用中，很多开发者在测试 xAI（Grok 4.6）连网时，常遭遇以下两类典型异常：

#### 异常现象复盘
* **异常现象 A（输出裸调用指令 / 假死）**：
  直接给模型一个推文链接或 ID，模型没有输出正文，而是直接返回一行奇怪的代码甚至卡住：
  ```text
  invoke tool get_tweet with tweet_id is 2098683651739320420
  ```
  或者直接输出待执行的工具参数 JSON：
  ```json
  {
    "query": "\"Gergely Orosz\" \"软件行业趋势\"",
    "max_results": 10
  }
  ```
* **异常现象 B（双语直接拒答）**：
  在 Prompt 中包含“X 平台搜索”时，模型直接触发拒答护栏：
  > *“I cannot perform the requested X search or extract trends as specified. 我目前无法直接搜索 X（Twitter）平台上的推文。”*

#### 底层深层机理深度剖析
1. **机理一：CLI 专属的文本化 Tool Loop 协议与普通 API 客户端的断层**
   * CPA 挂载的凭据上游端点为 `https://cli-chat-proxy.grok.com/v1`，这是 xAI 官方为命令行终端（`grok-shell` CLI）定制的接口；
   * 在这个协议下，当 Grok 判定需要调用外部工具时，它会输出调用指令（如 `get_tweet`），**官方 CLI 客户端截获该文本后，会在本地终端执行抓取并回传给模型**；
   * 但普通 WebUI 或单次 API 调用脚本并不是一个持续监听工具回调的 Agent，当模型吐出调用指令后，客户端没有执行回传，模型便“卡”在这一步，直接把这行调用命令打在屏幕上。
2. **机理二：模型能力安全对齐护栏（Alignment Safety Guardrail）**
   * 为防止黑产利用免费 API 将 Grok 当作高频 Twitter 爬虫，xAI 植入了严格的安全边界：Grok 被告知自己拥有通用全网搜索（General Web Search），但不具备直接对外开放的 Twitter 私有 API 爬取权限；
   * 一旦 Prompt 出现 **“X 搜索工具”**、**“搜索 X 平台上的推文”** 或 **推文 ID**，模型推理链就会直接激活拒答模板，输出 *“I cannot perform the requested X search...”*。
3. **机理三：X.com 的重度 JavaScript 动态渲染与强登录墙**
   * 通用网络爬虫在未登录状态下请求 `https://x.com/...`，拿到的只是一个没有数据的空壳骨架（`<div id="react-root"></div>`）；
   * 爬虫拿不到动态渲染的正文，模型感知不到文本输入，自然只能告知用户无法获取。

#### 彻底破解与最佳提问公式

经过严格对照实验，只要遵循以下提问法则，成功率即可达 100%：

| 提问方式 | 是否推荐 | 表现与机理 |
| :--- | :---: | :--- |
| ❌ **直接甩 URL 或推文 ID**<br/>`查一下推文 2098683651739320420 的内容` | **极不推荐** | 误触发本地专有指令，导致输出 `invoke tool get_tweet...` 假死 |
| ❌ **限制平台专有名词**<br/>`请使用 X 搜索工具，在推特上搜索……` | **极不推荐** | 命中 Twitter 反爬对齐护栏，直接双语拒答 |
| ✅ **通用全网检索 + 核心实体/人名**<br/>`请使用网络搜索工具，在全网检索知名博主 Gergely Orosz 最近总结的关于软件行业与AI的趋势清单` | **强烈推荐 (100% 成功)** | 绕过专有拒答护栏，稳定触发 `web_search`，自动聚合并提取包含宝玉（@dotey）在内的全网最优质公开讨论与 7 大趋势清单！ |

---

## 二、Claude Code 接入 Gemini 3.8 Flash High（1M 上下文）调优指南

Gemini 3.8 Flash High 凭借极高的推理吞吐量、原生 Thinking（思考）能力以及高达 **100 万 Token（1M）的超长上下文**，是极高性价比的代码工程底座。

### 1. 模型别名避坑：为什么不能写 `[1m]`？

很多开发者习惯在模型名后加上 `[1m]` 后缀以提醒自己该模型具备 1M 上下文。但在默认情况下，向 CPA 发送该模型名会引发致命错误：

```json
HTTP/1.1 400 Bad Request
{"type":"error","error":{"type":"invalid_request_error","message":"unknown provider for model gemini-3.8-flash-high[1m]"}}
```

**原因**：CPA 内部注册的 Antigravity 原生模型 ID 为 `gemini-3.8-flash-high`，遇到非标后缀直接判定为未知模型。

**解决方案：在 CPA 中配置 `oauth-model-alias`**
编辑 `/root/cliproxyapi/config.yaml`，添加模型映射：

```yaml
oauth-model-alias:
  antigravity:
    - name: "gemini-3.8-flash-high"
      alias: "gemini-3.8-flash-high[1m]"
      fork: true # 保持原名可用，同时派生新别名供 Claude Code 使用
  codex:
    - name: "gpt-5.5"
      alias: "gpt-4o"
      fork: true
    - name: "gpt-5.6-sol"
      alias: "gpt-5.6"
      fork: true
  xai:
    - name: "grok-4.6"
      alias: "grok-beta"
      fork: true
```

重启容器后验证：
```bash
docker compose restart cli-proxy-api
```
调用 `/v1/models` 即可看到新别名已正式注册，`gemini-3.8-flash-high[1m]` 与标准名均可稳定返回 HTTP 200。

### 2. 避免上下文被 Claude Code 提前腰斩

Claude Code 默认是为 Anthropic Claude 模型（默认 200k 窗口）设计的。如果不做显式调整，Claude Code 会在上下文达到约 160k tokens 时自动执行上下文压缩裁剪（Compact），导致 Gemini 剩余的 800k 超长记忆被白白浪费。

必须通过环境变量显式放开窗口阈值：
* `CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000`：通知智能体最大允许持有 1M 上下文；
* `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000`：防止过早触发上下文压缩算法。

### 3. 跨平台生产级启动 Alias 推荐

#### Linux / macOS / Git Bash 配置（`~/.bashrc` 或 `~/.zshrc`）
```bash
alias geminicc="CLAUDE_CODE_NO_FLICKER=1 \
CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000 \
CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000 \
ANTHROPIC_BASE_URL=https://cpa.yourdomain.com \
ANTHROPIC_API_KEY=sk-prod-cliproxy-secret-2026 \
ANTHROPIC_AUTH_TOKEN=sk-prod-cliproxy-secret-2026 \
API_TIMEOUT_MS=3000000 \
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
ANTHROPIC_MODEL=gemini-3.8-flash-high \
ANTHROPIC_DEFAULT_OPUS_MODEL=gemini-3.8-flash-high \
ANTHROPIC_DEFAULT_SONNET_MODEL=gemini-3.8-flash-high \
ANTHROPIC_DEFAULT_HAIKU_MODEL=gemini-3.8-flash-high \
CLAUDE_CODE_SUBAGENT_MODEL=gemini-3.8-flash-high \
CLAUDE_CODE_EFFORT_LEVEL=max \
claude --teammate-mode in-process --dangerously-skip-permissions"
```

#### Windows PowerShell 配置（`$PROFILE`）
```powershell
function geminicc {
    $env:CLAUDE_CODE_NO_FLICKER = "1"
    $env:CLAUDE_CODE_MAX_CONTEXT_TOKENS = "1000000"
    $env:CLAUDE_CODE_AUTO_COMPACT_WINDOW = "1000000"
    $env:ANTHROPIC_BASE_URL = "https://cpa.yourdomain.com"
    $env:ANTHROPIC_API_KEY = "sk-prod-cliproxy-secret-2026"
    $env:ANTHROPIC_AUTH_TOKEN = "sk-prod-cliproxy-secret-2026"
    $env:API_TIMEOUT_MS = "3000000"
    $env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"
    $env:ANTHROPIC_MODEL = "gemini-3.8-flash-high"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL = "gemini-3.8-flash-high"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL = "gemini-3.8-flash-high"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "gemini-3.8-flash-high"
    $env:CLAUDE_CODE_SUBAGENT_MODEL = "gemini-3.8-flash-high"
    $env:CLAUDE_CODE_EFFORT_LEVEL = "max"
    
    claude --teammate-mode in-process --dangerously-skip-permissions $args
}
```

### 4. 本地 Windows 开发环境深度配置与避坑排雷指南

在 Windows 本地使用各类 CLI 智能体（Claude Code、Codex CLI、Aider）对接 CPA 时，以下三处配置直接决定了日常开发的顺畅度：

#### ① 核心大坑：本地网络代理设置（防止海外网页抓取超时）
如前文所述，**网页抓取是由你本地 Windows 计算机直接发起的**。
如果你让智能体抓取海外技术文档（如 GitHub Issue、Next.js 官网、Python 官方库），而国内本地终端默认未走代理，终端会频繁报错 `ETIMEDOUT` 或 `Connection reset by peer`。

**解决办法**：在运行 CLI 之前，先在终端声明本地科学上网客户端（如 Clash / v2rayA）的 HTTP/SOCKS 端口：
```powershell
# Windows PowerShell 临时设置
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"

# 若使用 CMD
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890
```
或直接将其写入 PowerShell 启动配置脚本 `$PROFILE` 中。

#### ② 终端乱码与 UTF-8 编码修正
Windows 默认控制台代码页可能是 GBK（CP936），当 Claude Code 或 Python 脚本在终端打印抓取到的多语言网页或中文 Markdown 时，极易产生乱码甚至导致 JSON 解析崩溃。

**解决办法**：在 PowerShell 的 `$PROFILE` 开头追加：
```powershell
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

#### ③ OpenAI 兼容型 CLI 工具（Aider / Cursor / Codex CLI）的 Windows 配置
除了 Claude Code 使用 Anthropic 协议外，如果你使用的是 Aider、Cursor、开源 Codex CLI 或 VSCode Continue 插件，它们通常基于标准 OpenAI 规范：

```powershell
# Windows PowerShell 下对接 CPA
$env:OPENAI_BASE_URL = "https://cpa.yourdomain.com/v1"
$env:OPENAI_API_KEY = "sk-prod-cliproxy-secret-2026"

# 运行 Aider 并指定模型（例如别名 gpt-4o 或原生 gpt-5.5）
aider --model openai/gpt-4o
```

#### ④ 进阶：为 Claude Code 挂载全网关键词搜索（MCP 扩展）
如果不想只局限于给固定 URL 抓取，而是希望 Claude Code 具备全网实时关键词检索的能力，可以通过 **MCP（Model Context Protocol）** 接入官方开源的 Fetch 服务：

```bash
# 在 Windows 终端执行（需本地安装有 Node.js 18+）
claude mcp add fetch npx -y @modelcontextprotocol/server-fetch
```
挂载后，Claude Code 会获得强大的网页抓取与 HTML 文本转换能力，遇到不懂的问题会自动在全网查询资料。

---

## 三、GPT Plus 会员绘图扩展：编写轻量 Skill 脚本与 `CLAUDE.md` 规则

### 1. 账号池的分级利用机制

在一个健康的混合号池中：
* **免费账号（Free）**：承担 80% 以上的高频日常编码、文本生成与常规审查任务；
* **订阅账号（Plus）**：专供高阶基座大模型（如 `gpt-5.6-sol`）以及多模态图像生成模型（**`gpt-image-2`**）。

免费账号的凭据已被网关自动标明 `"excluded_models": ["gpt-image-2", "gpt-image-1.5"]`，当向 `/v1/images/generations` 发送绘图请求时，CPA 会自动将流量路由至绑定的 Plus 账号凭据，杜绝免费账号无效调度。

### 2. 编写轻量绘图脚本 `scripts/draw.py`

在工程项目根目录创建 `scripts/draw.py`：

```python
#!/usr/bin/env python3
"""
CLIProxyAPI 图像生成集成脚本
支持将 Claude Code 等终端智能体的提示词自动路由至网关 Plus 号池进行渲染并落盘。
"""
import sys
import os
import time
import requests

# 网关配置（建议通过环境变量读取，也可填入默认值）
CPA_GATEWAY = os.environ.get("CPA_BASE_URL", "https://cpa.yourdomain.com")
API_KEY = os.environ.get("CPA_API_KEY", "sk-prod-cliproxy-secret-2026")
IMAGE_ENDPOINT = f"{CPA_GATEWAY.rstrip('/')}/v1/images/generations"

def generate_and_save(prompt_text: str, output_directory: str = "./output_images") -> str:
    """向 CPA 发起绘图请求并将图片持久化至本地"""
    os.makedirs(output_directory, exist_ok=True)
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-image-2",
        "prompt": prompt_text,
        "size": "1024x1024",
        "n": 1
    }
    
    print(f"[CPA-Image] 正在向网关请求渲染: '{prompt_text}' ...")
    start_time = time.time()
    
    try:
        response = requests.post(IMAGE_ENDPOINT, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        data = response.json()
        
        # 提取渲染后的图片 URL
        remote_image_url = data["data"][0]["url"]
        
        # 将图片二进制下载至本地
        img_response = requests.get(remote_image_url, timeout=60)
        img_response.raise_for_status()
        
        timestamp = int(time.time())
        local_filename = os.path.join(output_directory, f"render_{timestamp}.png")
        with open(local_filename, "wb") as f:
            f.write(img_response.content)
            
        elapsed = round(time.time() - start_time, 2)
        print(f"[CPA-Image] 渲染完成 (耗时 {elapsed}s)！本地图片路径: {os.path.abspath(local_filename)}")
        return local_filename
        
    except requests.exceptions.RequestException as err:
        print(f"[CPA-Image] 绘图请求失败: {err}", file=sys.stderr)
        if hasattr(err, "response") and err.response is not None:
            print(f"[CPA-Image] 错误详情: {err.response.text}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用说明: python scripts/draw.py '<图像描述提示词>' [输出目录]")
        sys.exit(1)
        
    prompt = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else "./output_images"
    generate_and_save(prompt, out_dir)
```

### 3. 在项目 `CLAUDE.md` 中固化调用规则

Claude Code 在启动时会自动读取项目根目录的 `CLAUDE.md` 作为系统最高行为准则。在 `CLAUDE.md` 中追加以下规则：

```markdown
## 多模态与图像生成规则 (CPA Image Skill)

- 当用户要求绘制插图、生成 UI 概念图、Icon 图标或渲染图片时：
  1. **Prompt 提炼**：将用户的中文需求提炼并翻译为详尽、高质量的英文渲染提示词（包含画质、光影、艺术风格关键词）；
  2. **本地执行**：直接在终端执行绘图脚本：
     ```bash
     python scripts/draw.py "<英文提示词>"
     ```
  3. **结果回传**：脚本执行成功后，读取输出的文件绝对路径，向用户汇报图片已成功生成，并以 Markdown 链接形式展示保存位置。
```

### 4. 实际运行效果展示

在终端中启动 `geminicc` 后，只需输入：
> *“请为我们正在编写的 Sphinx 专栏封面绘制一张赛博朋克风格的数据网格图，包含服务器机架和流动的发光数据流。”*

Claude Code 会自动触发 Tool Use：
```
● Claude Code 正在调用终端工具:
  python scripts/draw.py "A cyberpunk style data grid cover for technical documentation, glowing blue and violet optical data streams flowing across high-density server racks, highly detailed 8k render, isometric view"

[CPA-Image] 正在向网关请求渲染...
[CPA-Image] 渲染完成 (耗时 8.35s)！本地图片路径: /root/02project/output_images/render_1789334520.png

● Claude Code 汇报:
  已为您成功调用网关 Plus 号池生成专栏封面图片！文件保存在:
  /root/02project/output_images/render_1789334520.png
```

通过这一闭环，完全无需对 Claude Code 客户端源码进行任何破解或逆向，即可无缝打通“文本推理走超长上下文 Gemini、图像渲染走高质量 GPT Plus 号池”的现代多智能体架构！
