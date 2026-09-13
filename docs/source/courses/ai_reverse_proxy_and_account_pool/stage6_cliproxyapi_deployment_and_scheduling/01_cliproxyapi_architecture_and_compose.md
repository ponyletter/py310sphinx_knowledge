# 6.1 CLIProxyAPI 架构设计与 Docker Compose 容器化部署

在私有化搭建海外 AI 账号池与反向代理时，**CLIProxyAPI** 是目前开源界针对 ChatGPT Plus、Codex、Claude 以及 Antigravity (AGY) 凭据集成最成熟、性能最强劲的高性能网关。

它采用 Go 语言构建，原生具备高并发、低内存占用、高吞吐的特性。本节将从系统架构、目录规划、容器编排到启动维护，进行全方位的实战讲解。

---

## 核心架构与流量流转模型

CLIProxyAPI 运行在反代 VPS 的内网环回地址（`127.0.0.1`），位于 Nginx 网关之后，负责处理复杂的 OAuth 凭据管理、Token 定时刷新、上游请求封装与多账号轮询调度。

```{mermaid}
graph TD
    subgraph Internet [公网接入]
        Client1[微信小程序后端]
        Client2[本地开发 IDE / AGY]
    end

    subgraph HostGateway [宿主机 Nginx 网关]
        Nginx[Nginx :443 TLS 终止]
    end

    subgraph DockerBridgeNet [Docker 内部专属网络 cliproxyapi_net]
        direction TB
        subgraph CPAContainer [容器: cli-proxy-api]
            Port8317[API 服务端口 :8317]
            Port8085[管理控制台端口 :8085]
            Scheduler[多账号调度网关 Conductor Engine]
            Watcher[文件变动监听器 events.go]
            Refresher[Token 自动刷新调度器 auto_refresh_loop.go]
        end

        subgraph WarpContainer [容器: warp-socks 出站代理网关]
            WarpDaemon[Cloudflare WARP 核心进程]
            SocksPort[SOCKS5 服务端口 :1080]
        end
    end

    subgraph DiskVolume [宿主机挂载卷 ./auths]
        Auth1[Plus 账号 A: codex-accountA.json]
        Auth2[Plus 账号 B: codex-accountB.json]
        Auth3[AGY 账号 C: antigravity-accountC.json]
        Auth4[xAI 账号 D: xai-accountD.json]
    end

    subgraph UpstreamAI [海外官方 AI 接口]
        OAI[OpenAI / Codex Backend]
        Anth[Anthropic Backend]
        AGYBack[Google Antigravity Backend]
        XAIBack[xAI Grok Backend]
    end

    Client1 -->|HTTPS| Nginx
    Client2 -->|HTTPS| Nginx
    Nginx -->|127.0.0.1:8317| Port8317
    Port8317 --> Scheduler
    DiskVolume -.->|挂载至 /root/.cli-proxy-api| Watcher
    Watcher -->|热重载注入| Scheduler
    
    Refresher -->|proxy-url: socks5://warp-socks:1080| SocksPort
    Scheduler -->|proxy-url: socks5://warp-socks:1080| SocksPort
    SocksPort --> WarpDaemon
    WarpDaemon -->|Cloudflare Anycast 干净原生 IP 池| UpstreamAI
```

### CLIProxyAPI 的核心职责
1. **协议标准化转换**：将外部客户端发送的标准 OpenAI 格式（`/v1/chat/completions`、`/v1/models`、`/v1/images/generations`）动态转换为对应上游平台（OpenAI、Anthropic、Google Antigravity、xAI）的私有 RPC / gRPC 或 REST/OAuth 协议；
2. **凭据自动化全生命周期管理**：自动识别挂载目录下的 JSON 凭据，内置 `auto_refresh_loop.go` 引擎以固定周期（默认 15 分钟）向官方刷新换发新的 Access Token，保持服务 24 小时永不断连；
3. **故障转移与自动重试（Failover）**：当某个账号出现官方 400/429 限流或网络抖动时，调度器 `conductor_execution.go` 会在毫秒级内自动剥离异常账号，并将该请求无缝切换至下一个可用凭据执行，客户端毫无感知；
4. **出站流量 IP 混淆伪装**：配合容器内 Cloudflare WARP SOCKS5 代理网关，彻底洗白数据中心 VPS 机房 IP，杜绝因 IP 段污染触发上游风控与伪 429 报错。

---

## 出站网络治理：容器化 Cloudflare WARP SOCKS5 网关

在大模型反代体系中，许多开发者常遭遇如下惨痛教训：
* **机房 IP 段污染**：DigitalOcean、Vultr、Oracle、Hetzner 等主流 IDC 机房 IP 段常被 Google Cloud Armor 与 OpenAI Cloudflare WAF 列入高风险黑名单，请求频繁遭遇图形验证码（hCaptcha/Turnstile）或直接报 403 Forbidden；
* **全局 TUN 误区**：在 VPS 上直接安装官方 WARP 客户端并开启全局 VPN/TUN 模式，会导致系统的默认路由表（`0.0.0.0/0`）被强行重写。其致命后果是：**入站 SSH 连接（Port 22）、1Panel 管理面板、Nginx 入口瞬间全部断联失联！**

**工业级解决方案**：采用 Docker 容器化 SOCKS5 代理模式（Sidecar 架构）。
1. 让 WARP 运行在独立的容器网络命名空间内，对外仅暴露本地 SOCKS5 端口（`warp-socks:1080` 或宿主机 `127.0.0.1:40000`）；
2. 宿主机的公网入站、SSH、Web 端口完全不受任何影响；
3. 仅让 `cli-proxy-api` 通过内部 Docker 网络（`socks5://warp-socks:1080`）发送出站 API 请求，享受 Cloudflare 全球 Anycast 优质原生 IP 出口与免费的 WARP 流量通道。

---

## 生产级目录规范规划

在 VPS 宿主机上创建专门的服务根目录 `/root/cliproxyapi`，遵循标准化的微服务目录划分：

```bash
# 1. 创建服务根目录与核心子目录
sudo mkdir -p /root/cliproxyapi/{auths,logs,plugins}
cd /root/cliproxyapi

# 2. 检查目录结构
# auths:   存放所有 Plus/Free/AGY/xAI 的 JSON 格式授权凭据
# logs:    存放网关访问日志与上游调度跟踪日志
# plugins: 存放自定义插件扩展（可选）
```

---

## Docker Compose 编排文件配置（CPA + WARP 双服务集成）

在 `/root/cliproxyapi/` 目录下创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

networks:
  cliproxyapi_net:
    driver: bridge

services:
  # 1. 出站 IP 混淆与洗白网关：Cloudflare WARP SOCKS5
  warp-socks:
    image: caorushizi/warp-socks:latest
    container_name: warp-socks
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
    sysctls:
      - net.ipv6.conf.all.disable_ipv6=0
    environment:
      - WARP_SLEEP=2
    ports:
      # 宿主机仅绑定 127.0.0.1，供运维工具或 curl 调试
      - "127.0.0.1:40000:1080"
    networks:
      - cliproxyapi_net
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "2"

  # 2. 核心大模型反代调度网关
  cli-proxy-api:
    image: eceasy/cli-proxy-api:latest
    container_name: cli-proxy-api
    restart: unless-stopped
    depends_on:
      - warp-socks
    ports:
      # 仅绑定宿主机 127.0.0.1 环回口，严防公网未授权裸露！
      - "127.0.0.1:8317:8317"
      - "127.0.0.1:8085:8085"
    volumes:
      # 挂载核心业务配置文件
      - ./config.yaml:/CLIProxyAPI/config.yaml
      # 挂载凭据池目录（映射至容器内置目录）
      - ./auths:/root/.cli-proxy-api
      # 挂载日志与插件目录
      - ./logs:/CLIProxyAPI/logs
      - ./plugins:/CLIProxyAPI/plugins
    environment:
      - TZ=Asia/Shanghai
    networks:
      - cliproxyapi_net
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"
```

````{admonition} 安全红线：切勿绑定 0.0.0.0:8317！
:class: caution

容器的端口映射务必写成 `"127.0.0.1:8317:8317"` 与 `"127.0.0.1:40000:1080"`。若直接写 `"8317:8317"`，Docker 会通过修改 `iptables` 绕过宿主机的大部分普通防火墙，将端口暴露给公网。恶意扫描器可在数分钟内扫描出开放端口并耗尽你的账号额度。
````

---

## 容器生命周期管理与健康检查

### 1. 启动容器集群
```bash
cd /root/cliproxyapi
# 后台拉取镜像并拉起容器
docker compose up -d
```

### 2. 检查容器运行状态与内存占用
```bash
docker compose ps
docker stats cli-proxy-api --no-stream
```
*正常情况下，Go 容器内存占用通常仅在 30MB~80MB 之间，CPU 占用低于 1%，极度轻量。*

### 3. 查看实时跟踪日志
```bash
# 跟踪最近 50 条日志并实时输出
docker compose logs -f --tail 50
```

当看到以下关键初始化标识时，代表网关架构已就绪：
```text
[info ] [clients.go:152] full client load complete - X clients
[info ] [service_lifecycle.go:196] file watcher started for config and auth directory changes
[info ] [service_lifecycle.go:206] core auth auto-refresh started (interval=15m0s)
```

### 4. 本地环回端口连通性验证
在宿主机内使用 curl 检查容器健康状况：
```bash
curl -i http://127.0.0.1:8317/health
# 或者列出当前支持的模型列表 (需带上在 config.yaml 中配置的 API 密钥)
curl -H "Authorization: Bearer sk-your-key" http://127.0.0.1:8317/v1/models
```

下一节中，我们将逐行剖析核心配置文件 `config.yaml`，详细解读 API Key 鉴权、密码哈希与路由模式。
