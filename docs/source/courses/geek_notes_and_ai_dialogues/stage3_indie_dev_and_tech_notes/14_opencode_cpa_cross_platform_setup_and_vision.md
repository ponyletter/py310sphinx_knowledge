# 3.14 OpenCode 接入 CPA 实战：Windows 桌面、双平台终端、看图配置与 Nginx 413 排错

> 记录日期：2026-10-22。目标：在新电脑上手动复现本次配置，并能区分客户端能力声明、CPA 转换和服务器上传限制。

本文以本次实际安装的 **OpenCode 1.19.3** 为复现基线。Windows GUI 已实际安装并运行；两个文本模型、图片输入与图片生成经过直接 API 测试。Linux/Windows CLI 安装与启动命令按官方文档整理，本文编写时没有另外部署 Linux，也没有把 API 成功等同于完整桌面交互验收。

```{important}
OpenCode 1 与 OpenCode 2 的命令名都叫 `opencode`，但包名、配置结构和迁移行为可能不同。本文使用 OpenCode 1 的 `opencode-ai` 包及 `provider`、`attachment` 配置；不要把 V2 的 `@opencode/cli` 安装命令或配置片段混进来。安装后先执行 `opencode --version`，升级到 V2 时另按官方迁移文档操作。
```

## 1. 准备哪些输入，最终得到什么

| 输入项 | 本次记录／填写方式 |
| --- | --- |
| CPA 基础地址 | `https://cpa.yourdomain.cn/v1`，已经带 `/v1`，不要再重复追加 |
| CPA API Key | 自己的客户端调用密钥；交互输入或存入本地密钥文件，本文不记录真实值 |
| 供应商 ID | `cpa`，这是自定义名称，不是接口返回的模型名 |
| 主模型 | `gpt-6.1-sol`，在 OpenCode 中写成 `cpa/gpt-6.1-sol` |
| 辅助模型 | `gemini-3.8-flash-high`，在 OpenCode 中写成 `cpa/gemini-3.8-flash-high` |
| 图片生成模型 | `gpt-image-2.5`，通过 `/images/generations` 调用 |
| Windows 安装目录 | `C:\01soft\73opencode`，程序在 `app\OpenCode.exe` |
| Linux/Windows CLI 前提 | Node.js LTS 与 npm；如使用 Python 测试脚本，还需 Python 3.10+ |
| Nginx 调整前提 | 仅服务器管理员执行；本机用户无需安装 Nginx |

本次连接链路：

```text
OpenCode GUI / CLI
  → https://cpa.yourdomain.cn/v1
  → Nginx（整次请求体大小限制）
  → CPA（模型路由与协议转换）
  → 实际上游模型
```

**下载附件**：{download}`跨平台配置模板 <downloads/opencode-cpa.json>`、{download}`Python 标准库测试脚本 <downloads/cpa_probe.py>`。下载到本地后使用，不需要把真实密钥放进文档仓库。下文假设附件已保存到当前终端工作目录。

## 2. Windows：安装完整桌面 GUI

### 2.1 手动下载与签名检查

从 [OpenCode 官网下载页](https://opencode.ai/download) 选择 **OpenCode Desktop → Windows x64**。桌面安装包与 CLI ZIP 是不同产物；只下载 CLI 不会得到完整桌面窗口。

下面固定到本次安装版本，PowerShell 5.1/7 均可使用：

```powershell
$installRoot = 'C:\01soft\73opencode'
New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
$installer = Join-Path $installRoot 'opencode-desktop-win-x64-v1.19.3-setup.exe'
$downloadUrl = 'https://github.com/anomalyco/opencode/releases/download/v1.19.3/opencode-desktop-win-x64.exe'
Invoke-WebRequest -Uri $downloadUrl -OutFile $installer
$signature = Get-AuthenticodeSignature -LiteralPath $installer
$signature | Select-Object Status, @{Name='Signer';Expression={$_.SignerCertificate.Subject}}
Get-FileHash -LiteralPath $installer -Algorithm SHA256
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Anomaly Innovations') {
    throw '签名检查未通过，请检查下载来源。'
}
```

本次安装包 SHA256 为 `EB2554AB5484886DB78FD861008A2A2DB985BFA3DC3720CE7D1CDA027CE99174`。它只对应这个版本、这个 x64 安装包，不能用于验证其他版本。

### 2.2 指定安装目录

```powershell
# NSIS 的 /D 参数放在最后；本例目录不含空格。
$p = Start-Process -FilePath $installer -ArgumentList '/S','/D=C:\01soft\73opencode\app' -PassThru -WindowStyle Hidden
$p.WaitForExit()
$p.ExitCode
Test-Path 'C:\01soft\73opencode\app\OpenCode.exe'
```

也可以双击安装包，按向导安装。已有同版本安装时无需重复执行。完成下一节全局配置后，打开 `C:\01soft\73opencode\app\OpenCode.exe`，在模型选择器中选择 **CPA OpenAI Compatible** 下的模型。

本次 1.19.3 安装产物使用 Electron；其他版本可能采用不同桌面框架，遇到 WebView2 提示时再按对应版本要求处理，不要把 WebView2 当成本次图片报错的原因。

## 3. Windows PowerShell：安装终端版

GUI 与 CLI 是两个入口：GUI 安装成功，不代表 PowerShell 中已经有 `opencode` 命令。CLI 默认启动交互式 TUI，也可以运行单次请求。

```powershell
node --version
npm.cmd --version
npm.cmd install -g opencode-ai@1.19.3
Get-Command opencode* -ErrorAction SilentlyContinue
opencode.cmd --version
```

如果没有 Node/npm，先从 [Node.js 官网](https://nodejs.org/) 安装 LTS，再重新打开终端。使用 `npm.cmd`、`opencode.cmd` 可以避免 PowerShell 把同名 `.ps1` 启动脚本拦截；不必为这个问题全局放宽执行策略。

若安装后提示命令找不到：

```powershell
$npmPrefix = (npm.cmd config get prefix).Trim()
$env:Path = "$npmPrefix;$env:Path"
& (Join-Path $npmPrefix 'opencode.cmd') --version
```

这只修复当前终端的 PATH；长期使用时把 `npm config get prefix` 输出的目录加入用户 PATH，再开新终端。若出现旧版本冲突，用 `Get-Command opencode* -All` 检查实际命令来源。

Windows 原生终端可以按本教程配置；官方也推荐 WSL。**WSL 的 Linux 家目录与 Windows 用户目录不同**，需要在 WSL 内另做 Linux 配置，不能假设 Windows 全局配置自动共享。

## 4. Linux Bash：安装终端版

已安装 Node.js LTS/npm 的 Linux 可以使用同一固定版本：

```bash
node --version
npm --version
npm install -g opencode-ai@1.19.3
command -v opencode
opencode --version
```

若 npm 全局安装出现 `EACCES`，可以在用户目录设置 prefix，避免为 npm 安装使用 `sudo`：

```bash
mkdir -p "$HOME/.local"
npm config set prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
npm install -g opencode-ai@1.19.3
opencode --version
```

确认后把 `export PATH="$HOME/.local/bin:$PATH"` 加入所用 shell 的启动文件。使用 nvm/fnm 等 Node 版本管理器时，优先沿用其现有 prefix 配置，不要叠加修改。

OpenCode 1 官方另提供 `curl -fsSL https://opencode.ai/install | bash`，但它默认获取发布时的版本，不能保证未来仍复现本文版本。需要可复现时采用上述固定 npm 版本。不同 CPU 架构应使用对应官方产物，不要把 Windows x64 安装包复制到 Linux 执行。

## 5. 双平台共用配置：先存密钥，再放 JSON

### 5.1 路径与优先级

| 内容 | Windows | Linux/WSL |
| --- | --- | --- |
| 用户全局配置 | `%USERPROFILE%\.config\opencode\opencode.json` | `~/.config/opencode/opencode.json` |
| 本教程新机器密钥文件 | `%USERPROFILE%\.config\opencode\cpa-api-key` | `~/.config/opencode/cpa-api-key` |
| 项目配置 | 项目根目录 `opencode.json` | 项目根目录 `opencode.json` |
| 临时指定配置 | `$env:OPENCODE_CONFIG = '绝对路径'` | `export OPENCODE_CONFIG='/绝对路径'` |

GUI 与原生 CLI 在同一 Windows 用户下通常共用上述全局配置。项目配置会与全局配置合并，并覆盖冲突字段；`OPENCODE_CONFIG_CONTENT` 等更高优先级来源也可能覆盖设置。排错时不要只检查一个 JSON。

### 5.2 Windows：交互输入密钥，不把密钥打进命令历史

```powershell
$configDir = Join-Path $env:USERPROFILE '.config\opencode'
New-Item -ItemType Directory -Path $configDir -Force | Out-Null
$keyPath = Join-Path $configDir 'cpa-api-key'
$secureKey = Read-Host '输入 CPA 客户端 API Key' -AsSecureString
$plainKey = [System.Net.NetworkCredential]::new('', $secureKey).Password
[IO.File]::WriteAllText($keyPath, $plainKey.Trim(), [Text.UTF8Encoding]::new($false))
Remove-Variable plainKey,secureKey
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls.exe $keyPath /inheritance:r /grant:r "${identity}:(F)" 'SYSTEM:(F)'
```

输入的是 **CPA 客户端 API Key**，不要误填管理面板密码或上游 OAuth Token。密钥文件是本地明文文件，ACL 用于限制访问，它并不是加密保险箱。

### 5.3 Linux：交互输入与文件权限

```bash
mkdir -p "$HOME/.config/opencode"
chmod 700 "$HOME/.config/opencode"
read -r -s -p '输入 CPA 客户端 API Key: ' cpa_key
printf '\n'
(umask 077; printf '%s' "$cpa_key" > "$HOME/.config/opencode/cpa-api-key")
unset cpa_key
chmod 600 "$HOME/.config/opencode/cpa-api-key"
```

### 5.4 安装配置模板

附件 `opencode-cpa.json` 内容如下。自建其他网关时改 `baseURL` 和模型 ID；`models` 中的键要与 `/models` 返回的 ID 完全一致。

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "cpa/gpt-6.1-sol",
  "small_model": "cpa/gemini-3.8-flash-high",
  "provider": {
    "cpa": {
      "name": "CPA OpenAI Compatible",
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://cpa.yourdomain.cn/v1",
        "apiKey": "{file:~/.config/opencode/cpa-api-key}"
      },
      "models": {
        "gpt-6.1-sol": {
          "name": "gpt-6.1-sol",
          "attachment": true,
          "tool_call": true,
          "modalities": {"input": ["text", "image"], "output": ["text"]}
        },
        "gemini-3.8-flash-high": {
          "name": "gemini-3.8-flash-high",
          "attachment": true,
          "tool_call": true,
          "modalities": {"input": ["text", "image"], "output": ["text"]}
        }
      }
    }
  },
  "attachment": {
    "image": {
      "auto_resize": true,
      "max_width": 1600,
      "max_height": 1600,
      "max_base64_bytes": 512000
    }
  }
}
```

Windows：先检查已有文件，再操作。

```powershell
$target = Join-Path $configDir 'opencode.json'
if (Test-Path $target) {
    Copy-Item -LiteralPath $target -Destination ($target + '.before-cpa.bak')
    notepad.exe $target
    # 把模板中的 cpa、model、small_model、attachment 合并到原 JSON。
} else {
    Copy-Item -LiteralPath '.\opencode-cpa.json' -Destination $target
}
Get-Content -LiteralPath $target -Raw | ConvertFrom-Json | Out-Null
```

Linux：

```bash
target="$HOME/.config/opencode/opencode.json"
if [ -f "$target" ]; then
    cp -- "$target" "${target}.before-cpa.bak"
    nano "$target"   # 合并模板，保留原有 provider、MCP、插件等设置
else
    cp -- ./opencode-cpa.json "$target"
fi
python3 -m json.tool "$target" >/dev/null
```

如已有 `.jsonc` 配置，需按现有结构合并；`json.tool` 与 `ConvertFrom-Json` 的严格 JSON 检查不能作为带注释 JSONC 的通用验证器。

本次现有机器有一个差异：真实密钥已保存在 `C:\01soft\73opencode\.cpa-api-key`，全局配置引用的是 `{file:C:/01soft/73opencode/.cpa-api-key}`。继续使用原机器时可保留这个有效引用；不要只换引用路径却忘记创建新密钥文件。本教程的统一家目录方案用于新机器手动复现。

### 5.5 可选：改用环境变量

把 `apiKey` 改为 `"{env:CPA_API_KEY}"`。Windows 当前终端可从密钥文件加载：

```powershell
$env:CPA_API_KEY = [IO.File]::ReadAllText($keyPath).Trim()
opencode.cmd
```

Linux：

```bash
export CPA_API_KEY="$(cat "$HOME/.config/opencode/cpa-api-key")"
opencode
```

环境变量只影响继承该环境的进程。Windows 从开始菜单启动 GUI，不会自动继承另一个 PowerShell 会话后来设置的变量，因此 GUI 长期使用更适合文件引用。更改后完全退出 GUI 再打开；仅关闭一个标签页可能不够。

## 6. 从终端启动、切换模型与附图

Windows PowerShell：

```powershell
Set-Location 'C:\你的项目目录'
opencode.cmd models cpa
opencode.cmd -m cpa/gpt-6.1-sol
opencode.cmd run -m cpa/gemini-3.8-flash-high '只回复 OK'
opencode.cmd run -m cpa/gpt-6.1-sol '描述这张图片中的形状与颜色' --file 'C:\图片目录\test.png'
```

Linux/WSL：

```bash
cd /你的项目目录
opencode models cpa
opencode -m cpa/gpt-6.1-sol
opencode run -m cpa/gemini-3.8-flash-high '只回复 OK'
opencode run -m cpa/gpt-6.1-sol '描述这张图片中的形状与颜色' --file /图片目录/test.png
```

TUI 运行后可用 `/models` 切换模型。GUI 可以直接粘贴截图；SSH、Linux 终端和不同终端模拟器的图片剪贴板行为并不一致，复现时优先用 `--file`，避免把剪贴板兼容问题当成模型问题。

`/models` 是 OpenCode TUI 内部命令，不要直接粘贴到 PowerShell/Bash 当系统命令执行。

## 7. 脱离 OpenCode，直接测试 CPA

下载本页的 `cpa_probe.py`。脚本只用 Python 标准库，支持 Python 3.10+；从 `CPA_API_KEY` 环境变量读取密钥，未设置时读取 `~/.config/opencode/cpa-api-key`。每条命令发送一次真实 API 请求，不自动重试。

Windows 用 `python`，Linux 通常用 `python3`。如果使用本次文档站环境，也可以把命令中的 `python` 替换成：

```powershell
& 'C:\01soft\12conda\envs\py310sphinx_knowledge_base\python.exe' .\cpa_probe.py models
```

### 7.1 模型列表与文本

Windows：

```powershell
python .\cpa_probe.py models
python .\cpa_probe.py text --model gemini-3.8-flash-high
python .\cpa_probe.py text --model gpt-6.1-sol
```

Linux：

```bash
python3 ./cpa_probe.py models
python3 ./cpa_probe.py text --model gemini-3.8-flash-high
python3 ./cpa_probe.py text --model gpt-6.1-sol
```

列表中出现模型只说明“已列出”，不证明实际调用可用。文本测试预期得到 HTTP 200 和 `OK`。脚本中填模型原始 ID，不加 `cpa/` 前缀；这个前缀仅用于 OpenCode 选择供应商。

### 7.2 图片输入

先准备一张内容已知且可以发送给 CPA 的 PNG/JPEG/WebP，例如蓝色圆形。脚本不会缩图，便于测服务端原始限制：

```powershell
python .\cpa_probe.py vision --model gemini-3.8-flash-high --image 'C:\图片目录\test.png'
python .\cpa_probe.py vision --model gpt-6.1-sol --image 'C:\图片目录\test.png'

# 本次现有机器使用原密钥路径时，加 --key-file：
python .\cpa_probe.py vision --model gpt-6.1-sol --image 'C:\01soft\73opencode\gpt-image-2.5-test.png' --key-file 'C:\01soft\73opencode\.cpa-api-key'
```

```bash
python3 ./cpa_probe.py vision --model gemini-3.8-flash-high --image ./test.png
python3 ./cpa_probe.py vision --model gpt-6.1-sol --image ./test.png
```

实际协议是 `/chat/completions` 的 `messages[].content` 数组，图片项使用 `image_url.url = data:image/png;base64,...`。输出包含 `image_bytes` 与完整 JSON 的 `request_bytes`，判断 413 应看后者。HTTP 200 后还要核对回答确实对应图片内容，不能只看状态码。

### 7.3 图片生成

```powershell
python .\cpa_probe.py generate --model gpt-image-2.5 --prompt '白色背景上的蓝色圆形，不要文字' --output .\generated-image.png
```

```bash
python3 ./cpa_probe.py generate --model gpt-image-2.5 --prompt '白色背景上的蓝色圆形，不要文字' --output ./generated-image.png
```

这个测试调用 `/images/generations`。返回 Base64 时保存 PNG；返回 URL 时保存 `.url.txt`，不会把 CPA 密钥转发到图片下载域名。**会生成图片不等于可以作为 OpenCode 的聊天主模型**，所以模板只把两个文本/视觉模型放进聊天菜单。

换接口时给脚本加 `--base-url https://你的域名/v1`。PowerShell 5.1 的中文终端输出若乱码，可在该终端设置 `$env:PYTHONIOENCODING='utf-8'` 后重试；这与上游视觉能力无关。

## 8. 排错一：Cannot read image.png / does not support image input

### 8.1 本次根因

原配置只有模型 `name`，漏了图片输入声明。OpenCode 据此把自定义模型当成纯文本模型，在本地处理附件时就可能生成：

```text
ERROR: Cannot read "image.png" (this model does not support image input)
```

这条提示本身不能证明 CPA 或上游模型不支持看图。对应模型至少要明确：

```json
"modalities": {
  "input": ["text", "image"],
  "output": ["text"]
}
```

模板还保留 `attachment: true` 与 `tool_call: true`，避免修复视觉声明时丢失附件或工具能力声明。能力字段是客户端声明，不会替上游增加本来不存在的能力；新模型仍需分别测试。

### 8.2 手动排查顺序

1. 用 `cpa_probe.py vision` 直测同一模型和同一图片。
2. 直测成功：查 OpenCode 的 `modalities`、实际选中的 `cpa/模型名`、项目配置覆盖和环境变量。
3. 保存配置，完全退出并重开 GUI/TUI。
4. 新建对话，重新附图。旧消息里的“无法读图”文字不会自动恢复为图片，继续追问可能只让模型重复解释历史错误。
5. 直测返回明确“不支持图片”：查模型路由、CPA 转换以及实际后端能力，不能只改客户端标志。

## 9. 排错二：Nginx 413 Request Entity Too Large

### 9.1 为什么 1 MB 左右的图片会失败

图片内嵌 Base64 后通常增加约三分之一体积：

```text
Base64 字节数 = 4 × ceil(原图字节数 / 3)
整次请求体 = Base64 + JSON + 文本 + 历史图片 + 系统/工具信息
```

Nginx 的 `client_max_body_size` 默认是 `1m`，限制整个请求体。它不是图片分辨率限制，也不是 token 上限。本次约 1.06 MB PNG 形成约 1.42 MB JSON，修改前被标注 `nginx/1.18.0` 的 HTML 413 页拒绝；约 20 KB 请求则成功。

### 9.2 服务端提高到 100m

在 **实际处理 CPA 域名的现有 HTTPS server 块**中添加以下指令；若 `location` 中另有更小值，也要检查覆盖关系：

```nginx
server {
    # 此处仅示意；保留现有 listen、SSL、location、proxy_pass 等配置
    server_name cpa.yourdomain.cn;
    client_max_body_size 100m;
}
```

不要把这个示意块直接替换完整生产配置。Nginx 支持的写法是 `100m`，不要写 `100mb`。

```bash
# 查看生效配置；输出可能包含其他站点信息，不要直接公开粘贴全部内容
sudo nginx -T 2>&1 | grep -nE 'server_name|client_max_body_size'

# 修改对应站点文件，例如 /etc/nginx/sites-available/cpa
sudo nginx -t && sudo systemctl reload nginx

# 实际错误日志路径以 nginx -T 中的 error_log 为准
sudo tail -n 50 /var/log/nginx/error.log
```

Docker 中需修改挂载给实际 Nginx 容器的配置，再执行：

```bash
docker exec <nginx容器名> nginx -t
docker exec <nginx容器名> nginx -s reload
```

`client_body_buffer_size` 只是缓冲设置，不是上传容量开关；`proxy_buffering off` 主要影响响应缓冲，也不能代替 `client_max_body_size` 修复上传 413。链路中有 CDN/WAF、面板网关、容器入口或第二层 Nginx 时，每一层都可能成为更小的限制。

### 9.3 如何确认是哪层拦截

在 CPA 服务器本机，用同一图片、同一请求分别测试公网域名与 CPA 本机监听端口。假设 CPA 实际监听 `127.0.0.1:8317`，按真实部署端口替换：

```bash
python3 cpa_probe.py vision --model gemini-3.8-flash-high --image ./test.png --base-url https://cpa.yourdomain.cn/v1
python3 cpa_probe.py vision --model gemini-3.8-flash-high --image ./test.png --base-url http://127.0.0.1:8317/v1
```

本机直连成功、公网失败，优先检查入口网关；两者都失败，再看 CPA 与上游错误。不要为了测试把 CPA 端口公开暴露。Nginx 错误日志若出现 `client intended to send too large body`，是该层拦截的直接证据；仅凭页面上的 Nginx 版本还不能确认哪台服务器。

### 9.4 本次修改后的实测结果

用户反馈服务端已调大到约 100 MB 后，使用原始大小直接请求 CPA，得到：

| 图片字节数 | Gemini 请求字节数／结果 | GPT 请求字节数／结果 |
| --- | --- | --- |
| 1,063,116 | 1,417,737／HTTP 200，识别蓝色圆形 | 1,417,727／HTTP 200，识别蓝色圆形 |
| 4,720,429 | 6,294,157／HTTP 200，识别蓝色圆形 | 6,294,147／HTTP 200，识别蓝色圆形 |

大图通过对同一图像重新编码得到，用于测试传输体积，并不证明模型识别更高分辨率或复杂小字的效果。四次成功说明此前请求大小瓶颈已放宽，**没有测试 100 MB 边界，也没有读取服务器配置确认精确上限**。

### 9.5 服务端调大后，客户端还会缩图吗

会。模板沿用本次保守设置：宽高最多 1600、单图 Base64 最多 512000 字节。它用于此前小入口限制的缓解，与 Nginx 的 100m 是两个独立阈值。

需要保留截图小字时，可在确认服务端放行后，手动改为例如：

```json
"attachment": {
  "image": {
    "auto_resize": true,
    "max_width": 2000,
    "max_height": 2000,
    "max_base64_bytes": 5242880
  }
}
```

这是可选调整示例，本次只编写教程，没有替用户执行该调整。`5242880` 限制单图 Base64 约 5 MiB，不等于允许原始 5 MiB 图片；多图和历史消息仍会累积。设置 `auto_resize: false` 也不代表没有大小检查，超限时可能直接报错。

### 9.6 能否与原始 Antigravity（AGY）完全一致

本次没有查到可直接核实的 Antigravity 统一图片 MB 上限，不能把 Gemini API、其他产品或网上流传的数字直接当成 AGY 上限。官方客户端可能预处理图片或使用上传引用，而 OpenAI 兼容请求常把 Base64 内嵌 JSON。

实际可接受范围由客户端、各层网关、CPA 与上游共同决定。`100m` 只是本地入口容量，不会扩大上游模型限制；应以真实账号、实际路由、相同图片与历史消息条件做逐步测试。不要用图片生成输出尺寸反推图片输入上限。

## 10. 高频问题速查

| 现象 | 优先检查 |
| --- | --- |
| `opencode` 找不到 | CLI 是否单独安装、npm prefix/PATH、是否开了新终端 |
| PowerShell 禁止执行 `.ps1` | 使用 `npm.cmd` / `opencode.cmd`，先不要改全局策略 |
| 401 / 403 | CPA API Key 是否正确、是否误用管理密码、密钥文件是否为空、权限或账号限制 |
| 404 | baseURL 是否重复 `/v1`、是否用了错误路径；端点也可能不支持 |
| `model not found` | `/models` 的精确 ID、CPA 路由、是否错误地给直接 API 模型 ID 加了 `cpa/` |
| 只能文字不能看图 | 先直测图片，再检查 modalities、模型选择和覆盖配置 |
| 413 HTML 页 | 请求总字节数、Nginx/其他网关的容量与生效配置 |
| 400 图片格式或内容错误 | MIME 与文件实际格式、Base64、CPA 转换及上游支持范围 |
| 429 | 配额、并发或限流，增加 Nginx 容量无效 |
| 502 / 504 / 超时 | CPA 日志、上游连通性、响应超时，不能直接判为大小限制 |
| GUI 改配置后没变化 | 进程是否完全退出、是否另一个 Windows 用户、是否 WSL、项目/环境覆盖 |
| 图片生成成功但不能做聊天 | `/images/generations` 与 `/chat/completions` 是不同能力与协议 |

配置与测试的顺序建议固定为：**确认版本 → `/models` → 文本直测 → 图片直测 → OpenCode 模型声明 → GUI/TUI 附件测试 → 大请求测试**。这样能避免同时修改客户端、反代和上游后无法定位是哪一层起作用。

## 11. 备份、回退与本机记录

回退配置时，恢复 `opencode.json.before-cpa.bak` 后重启 OpenCode。不要把密钥文件、带凭据的环境变量输出或完整请求日志放进公开教程。本文只提供输入方法与路径，未收录本次真实密钥。

本次现有 Windows 安装目录中可找到：

- `opencode-config.json`：全局配置的本地备份；真实生效全局配置位于用户家目录。
- `.cpa-api-key`：原密钥文件，不能随教程分发。
- `model-test-results.json`：文本与图片生成测试结果。
- `vision-small-test-results.json`：压缩小图的视觉测试结果。
- `vision-after-nginx-results.json`：调整服务端后两档图片、四次请求的结果。
- `generate-image.ps1`：本机 PowerShell 图片生成辅助脚本；跨平台复现使用本页附件 `cpa_probe.py`。

## 12. 官方资料与复查入口

- [OpenCode 官方下载](https://opencode.ai/download) 与 [1.19.3 发布页](https://github.com/anomalyco/opencode/releases/tag/v1.19.3)：桌面版及对应平台产物。
- [OpenCode 1 安装说明](https://docs.opencode.ai/docs/)：`opencode-ai`、Linux 与 Windows 安装方法，以及 V1/V2 区别。
- [OpenCode CLI](https://docs.opencode.ai/docs/cli/)：`models`、`run -m`、`--file` 等命令。
- [OpenCode 配置](https://docs.opencode.ai/docs/config/) 与 [供应商配置](https://docs.opencode.ai/docs/providers/)：全局/项目配置、文件/环境变量引用、OpenAI 兼容 SDK。
- [OpenCode 官方仓库的 modalities 问题与示例](https://github.com/anomalyco/opencode/issues/9897)：与本次错误一致的图片输入声明缺失。
- [Nginx client_max_body_size](https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size)：默认值、可配置作用域与 413 行为。
- [Gemini 图片输入文档](https://ai.google.dev/gemini-api/docs/image-understanding)：内嵌图片与文件上传是不同传输方式；不能直接当作 Antigravity 的统一限制。

版本与模型目录会变化，后续复现时先核对实际版本及对应官方文档，再保留自己的成功请求记录。
