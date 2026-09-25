# 6.1 Windows 工作站环境部署、性能调优与故障排查

## 一、Windows 环境依赖清单与极速安装

在 Windows 10/11 生产工作站上部署全套系统，需要具备以下核心工具链：

| 依赖软件 | 最低版本要求 | 作用与职责 | 验证命令 |
| :--- | :--- | :--- | :--- |
| **Node.js** | v18+ 或 v20+ LTS | 驱动 HyperFrames 视频排版与截图渲染引擎 | `node -v` |
| **FFmpeg** | 6.0+ | 音频转码、帧序列合成、降噪与切片封装 | `ffmpeg -version` |
| **Python** | 3.11+ | 核心脚本流水线与 FastAPI 中台控制服务 | `python --version` |
| **Codex CLI** | 0.150+ | 无头智能体驱动引擎，执行自主生图与剧本编排 | `codex --version` |
| **Git** | 2.40+ | 源码与版本管理 | `git --version` |

---

## 二、标准化部署与初始化 SOP

### 第一步：获取代码并安装依赖
```bat
cd /d C:\Workspace
git clone https://github.com/ponyletter/course-render-dashboard.git
cd course-render-dashboard

# 使用专属 Conda Python 环境安装中台依赖
python -m pip install -r requirements.txt
```

### 第二步：运行一键环境诊断
项目内置了全自动环境体检脚本 `check-setup.bat`：
```bat
check-setup.bat
```
输出中必须确保以下各项全部为 `OK`：
* `[OK] Node.js & npm available`
* `[OK] FFmpeg found on system PATH`
* `[OK] Codex CLI installed & logged in`
* `[OK] Course-render skill repository linked`
* `[OK] Python 3.11 environment valid`

---

## 三、硬件显存配比与多任务并发建议

| 宿主机硬件配置 | 推荐全局最大并发 (`concurrency`) | 推荐单视频渲染模式 | 说明 |
| :--- | :--- | :--- | :--- |
| **8核 CPU / 16G 内存 / GTX 1660 (6G)** | 1~2 个并发 | 单图 `single` 优先 | 显存较小，依赖 `gpu_lock` 严格排队，防止显存溢出 |
| **16核 CPU / 32G 内存 / RTX 3080/4070 (10~12G)** | 3~5 个并发（默认推荐） | 支持全模式 (`dual`, `triple`) | 性能平衡，多任务 CPU 插图与 HTML 组装完全跑满 |
| **24核+ CPU / 64G 内存 / RTX 4090 (24G)** | 5~8 个并发 | 支持高复杂度连续时序图 | 吞吐量极高，单日可无人值守自动化产出 50+ 门成片 |

---

## 四、生产环境高频故障与应急排错手册

### 1. Codex 启动报 `os error 3` 或找不到路径
* **诱因**：命令行参数中误传入了 Linux 风格路径（如 `/root/...`），或 `-C` 后面缺少参数。
* **解法**：在 Windows 下必须使用标准的反斜杠或盘符路径，并用双引号包裹：`-C "C:\Workspace\course-render-results\slug-v1"`。

### 2. 语音强制对齐报错 `match ratio < 0.55`
* **诱因**：讲稿中的长英文单词或专有名词发音与文本差异过大，导致 Faster-Whisper 转录文字与剧本匹配度低于门禁阈值。
* **解法**：检查 `course_config.json` 中的 `tts_text`，为发音有偏差的词加上注音标记（如 `<OpenAI|Open A I>`），然后重新执行对齐脚本，严禁为了通过校验而人为下调 0.55 阈值。

### 3. FRP 穿透出现 `Access is denied`
* **诱因**：Windows Defender 阻止了 `frpc.exe` 建立原始 TCP 穿透套接字。
* **解法**：使用管理员身份打开 PowerShell，执行 `Add-MpPreference -ExclusionPath "C:\Tools\frp"`，并解除文件锁定（`Unblock-File`）。

---

## 五、智能体生产运维治理与防熔断避坑实战

在真实企业级落地中，微课自动化流水线通常由大型语言模型（LLM Agent，如 Claude Code / Codex）自主调度与编写。在长周期连续研发中，必须建立严格的**算力成本治理与防封防熔断规范**：

### 1. 警惕“上下文无限膨胀”陷阱（会话物理降本）
* **事故复盘**：在长会话 `5cc61a5d` 中，单个会话持续进行了 795 轮交互，文件膨胀到 52 MB、6041 行。由于大模型每次请求都需要将全部前序历史完整重传，到后期用户每问一句话，底层就会重传数十万 Token，短短两天内产生了 **近 3 亿 Cache 缓存 Token** 和 **$114.18 美元** 的 API 等价算力消耗，最终触发了消费级账号的自动熔断（`account_on_hold`）；
* **治理规范**：
  * **单模块单会话**：严禁在一个会话中从头到尾包揽“TTS 开发 ➔ 对齐脚本 ➔ 封面排版 ➔ 前端控制台”。每一个独立功能或单门微课交付后，必须通过 `/clear` 或新建 Session 开启新会话；
  * **单会话控制在 200~300 行以内**：不仅能将 Token 消耗降低 80%~90%，还能极大降低大模型在超长上下文下的注意力稀释与幻觉率。

### 2. 模型分级路由（Sonnet vs Opus 经济学）
* **日常生产（默认）**：文本策划、代码重构、CSS 微调、生图 Prompt 润色统一挂载 **Claude Sonnet（3.5 / 3.7）**。其代码执行力顶尖、响应延迟极低，综合成本仅为 Opus 的几分之一；
* **关键攻坚（按需）**：仅在底层数学算法设计（如 Faster-Whisper 双向序列映射优化）、全局系统架构评审时，才按需切入 **Claude Opus 5.5**。

### 3. 生产环境网络指纹与商业 API Key 隔离
* **个人 Pro 订阅与商业 API 的本质定位**：
  * **Claude Pro（$20/月）**：是固定包月的个人消费级产品，官方明确限制仅用于人类交互式日常编码。若长期在云机房 VPS 环境下挂载 `--permission-mode auto` 无头自动高频并发，极易被标记为 Bot/共享号而封禁；
  * **官方商用 API Key（按量付费）**：是面向企业生产环境的基石。天然支持云端机房 IP、允许 7×24 小时无人值守高并发、支持单日跑数百甚至数千美刀，彻底从根源上免除封号风险；
* **双端协同工作流（Windows 本地预览 + Linux 算力集群）**：
  * **Windows 本地工作站**（低配/核显）：运行 Web 控制台界面与 Cover Studio，供创作者进行封面排版微调、文案草稿审阅和极速预览；
  * **Linux 云服务器/GPU 节点**：通过 Git 和 FRP 协同，负责承接耗显存、耗算力的 IndexTTS 2.5 声音克隆、Faster-Whisper 词级对齐以及 1080P 视频无头批量压制。
