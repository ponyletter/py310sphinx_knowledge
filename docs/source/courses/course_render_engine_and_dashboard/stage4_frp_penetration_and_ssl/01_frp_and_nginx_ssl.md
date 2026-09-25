# 4.1 本地算力内网穿透、Nginx 工业级反代与 SSL 加固

## 一、网络拓扑与业务痛点

在部署高性能 AI 服务（例如本地部署的 IndexTTS 2.5 语音服务、FastAPI 控制台中枢、或运行在 `127.0.0.1:8266` 的语音推理服务）时，通常面临以下网络瓶颈：

1. **本地开发机无公网 IPv4 地址**：处于运营商家庭宽带或企业内网 NAT 之后，外部移动设备与云端无法直接发起 TCP 连接；
2. **移动端录音与访问需要强 HTTPS**：现代手机浏览器（iOS Safari、Android Chrome）调用麦克风录制音频时，必须运行在 `localhost` 或合法的 `https://` 安全上下文中，明文 `http://` 会直接被浏览器禁用麦克风权限；
3. **直连暴露的潜在安全隐患**：如果直接向公网开放原生端口，容易遭受端口扫描、暴力破解与恶意请求灌注。

为解决上述问题，系统采用了 **「本地 Windows (FRP Client) ➔ 跨境云主机 (FRP Server) ➔ Nginx 反向代理 (Certbot SSL)」** 的多层安全路由架构：

```{mermaid}
flowchart LR
    Client["移动端手机 / 外网浏览器"] -->|HTTPS (443端口)| Nginx["云服务器 Nginx 反向代理<br/>(SSL 证书 / 强制跳 HTTPS)"]
    Nginx -->|本地环回 8266端口| FRPS["云服务器 FRP Server 容器<br/>(监听 7000 端口)"]
    FRPS -.->|长连接加密穿透隧道| FRPC["本地 Windows FRP Client<br/>(frpc.exe)"]
    FRPC -->|转发至 127.0.0.1:8266| Service["本地 Windows 运行的 AI 服务<br/>(TTS 语音合成 / Web 服务)"]
```

---

## 二、服务端 FRP Server (FRPS) 规范配置

在云端 Linux 服务器上，通过 Docker 或直接运行 `frps`（以 v0.60+ TOML 格式为例），配置文件 `frps.toml`：

```toml
# 服务端监听地址与端口
bindAddr = "0.0.0.0"
bindPort = 7000

# 通信安全密钥（请替换为强随机字符串）
auth.method = "token"
auth.token = "<YOUR_STRONG_AUTH_TOKEN>"

# 状态监控仪表盘 (可选)
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "<ADMIN_PASSWORD>"
```

云服务器防火墙（如 UFW / 云安全组）需放行：
* `7000/tcp`（FRP 通信端口）
* `80/tcp` 与 `443/tcp`（Nginx Web 访问端口）
* `8266/tcp`（若需直接进行原始 TCP 调试）

---

## 三、Windows 客户端 FRP Client (FRPC) 配置

在本地 Windows 机器上，下载官方发布的 `frp_windows_amd64`，编写 `frpc.toml`：

```toml
# 远端云服务器信息
serverAddr = "<SERVER_IP_OR_DOMAIN>"
serverPort = 7000
auth.token = "<YOUR_STRONG_AUTH_TOKEN>"

# 穿透规则：将本地 8266 映射到云端 8266 端口
[[proxies]]
name = "win-tts-service-8266"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8266
remotePort = 8266
```

启动命令（管理员 CMD 或 PowerShell）：
```cmd
frpc.exe -c frpc.toml
```
当终端输出 `[win-tts-service-8266] start proxy success` 时，隧道即告建立。

---

## 四、云端 Nginx 反代与 Let's Encrypt SSL 自动化配置

通过云端 Nginx 统一终结 SSL，为穿透出来的服务提供标准的域名和绿锁体验。

### 1. Nginx 虚拟主机配置 (`/etc/nginx/sites-available/frp.example.com`)
```nginx
server {
    listen 80;
    server_name frp.example.com;

    # 长连接与大数据体保障（针对长音频生成与视频素材上传）
    client_max_body_size 100M;
    client_body_timeout 300s;
    client_header_timeout 60s;
    send_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:8266;
        proxy_http_version 1.1;
        
        # 兼容 WebSocket 实时通信
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 宽容超时时间，避免 AI 语音推理时长中断
        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }
}
```

### 2. 自动化申请与部署 SSL 证书
运行 Certbot 官方工具，一键完成 HTTPS 证书签发与自动续期：
```bash
certbot --nginx -d frp.example.com --non-interactive --agree-tos --redirect
```
Certbot 会自动修改 Nginx 配置，添加 443 SSL 监听并开启 HTTP 301 自动跳转 HTTPS。

---

## 五、Windows 实操避坑指南：Windows Defender 报毒与权限拒绝

### 痛点现象
在 Windows 上解压并运行 `frpc.exe` 时，频繁遇到：
* 终端直接报错：`Access is denied. (拒绝访问)`
* 文件被杀毒软件悄无声息删除或缩水为 0 字节
* 弹窗提示：`HackTool:Win32/FRP` 风险

### 根治操作三步法：

1. **PowerShell 一键添加目录排除项（管理员身份）：**
   ```powershell
   Add-MpPreference -ExclusionPath "C:\Tools\frp"
   ```
2. **解除下载文件安全锁定（NTFS Zone 标识）：**
   从网络下载的压缩包默认携带安全保护，执行解除锁定：
   ```powershell
   Unblock-File -Path "C:\Tools\frp\*"
   ```
3. **以管理员身份运行并放行防火墙：**
   右键使用管理员身份打开 CMD 并启动：
   ```cmd
   cd /d C:\Tools\frp
   frpc.exe -c frpc.toml
   ```
   首次运行时，Windows 防火墙弹窗中，务必将 **【专用网络】** 与 **【公用网络】** 两个复选框全部勾选，点击“允许访问”。
