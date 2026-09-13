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

* **Web 对话模式（纯 API 转发）**：
  * 普通 Web 聊天软件（如 NextChat、Chatbox 等）如果未显式配置搜索引擎插件，发送给 CPA 的 API 请求中 `tools` 列表为空。
  * 模型本身是静态权重，无法凭空突破沙箱访问外网，因此只能回答“我无法访问网络”。
  * 官方 Web 网页版（ChatGPT Web）的连网依赖于 OpenAI 服务器端的云端爬虫集群（Browse with Bing），这项重型基础设施不会开放给通过 CLI 逆向接口调用的免费账号。
* **终端 CLI 模式（客户端 Agent 驱动）**：
  * 像 Claude Code、Aider 这类终端工具本质上是**全功能的 Agent（智能体）**。
  * 连网抓取的真正执行者**不是云端模型，而是运行在你本地计算机上的 CLI 客户端**！
  * 模型仅负责输出结构化的“工具调用指令”（Tool Call），本地 CLI 截获指令后调用本地系统的网络库或 Shell 命令发起真实 HTTP 请求，再把抓取到的网页正文灌回给模型。
  * **核心结论**：哪怕你的号池全部由免费账号组成，只要在本地终端运行 Agent 客户端，就能 100% 具备稳定的连网读取与抓取能力！

### 2. xAI 渠道的特殊优化：服务端原生搜索自动注入

如果希望在第三方 WebUI 界面中也能让免费 xAI 账号具备实时联网能力，CPA 支持在网关层自动注入官方搜索工具。在 `/root/cliproxyapi/config.yaml` 中配置：

```yaml
xai:
  # 当请求未声明任何工具时，自动注入 xAI 原生的 x_search 工具定义
  inject-x-search: true
```

启用后，CPA 会在上游代理请求中自动补全 `x_search`，让 `grok-4.5` 与 `grok-4.6` 在不依赖客户端本地环境的情况下直接激活 xAI 官方的实时全网搜索。

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
