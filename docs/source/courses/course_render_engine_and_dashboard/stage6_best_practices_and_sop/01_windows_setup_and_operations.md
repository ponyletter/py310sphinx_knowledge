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
```cmd
cd /d C:\Workspace
git clone https://github.com/ponyletter/course-render-dashboard.git
cd course-render-dashboard

# 使用专属 Conda Python 环境安装中台依赖
python -m pip install -r requirements.txt
```

### 第二步：运行一键环境诊断
项目内置了全自动环境体检脚本 `check-setup.bat`：
```cmd
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
