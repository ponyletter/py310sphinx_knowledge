# 01. 跨境网络通信方案横向评测：HTTPS 域名网关 vs 纯加密 SSH 隧道

在将海外多账号反代号池接入国内业务服务（如业务 API、小程序服务端、开发环境）时，选择何种跨国通信管道是决定系统稳定性、安全性与维护成本的关键决策。

业界主要有两种主流方案：
1. **方案 A：公网 HTTPS 方案**（海外 VPS 配置二级域名 + Cloudflare DNS + Nginx TLS 终止）；
2. **方案 B：加密 SSH 隧道方案（强烈推荐 ★★★★★）**（海外 VPS 与国内服务器之间建立持久化 SSH 端口加密转发通道）。

---

## 一、两大跨境通信方案全方位横向对比

| 评测维度 | 方案 A：公网 HTTPS 域名网关方案 | 方案 B：加密 SSH 隧道方案 (业界最推荐 ★★★★★) |
| :--- | :--- | :--- |
| **部署与维护门槛** | 较繁琐（需购买域名、配置 DNS 解析、申请 SSL/TLS 证书、配置 Nginx、定期续签） | ⭐️ **极简纯净**（仅需 Linux 原生 OpenSSH，无需任何域名与证书，零第三方依赖） |
| **网络安全性与暴露面** | 接口必须向全球公网暴露 443 端口，容易被公网扫描器爬取、探测或 DDoS 攻击 | ⭐️ **绝对内网隔离**（反代端口仅监听在本地 `127.0.0.1`，公网完全不可见，杜绝一切外部扫描） |
| **合规与国内环境兼容** | 境外域名与未备案接口在特定网络环境下容易遭遇 DNS 污染、握手阻断或 SNI 干扰 | ⭐️ **极度抗干扰**（基于标准 SSH 加密流，流量特征标准，连接极为稳定坚挺） |
| **大模型 SSE 流式输出** | 若使用 CDN 代理，易受 100 秒超时切断长文本流（需细致调优防超时） | ⭐️ **完美支持**（纯原生 TCP 管道，零缓冲、零超时切断，打字机推流极其丝滑） |
| **多节点容灾扩展性** | 需配置复杂的公网多 IP 解析或负载均衡器 | ⭐️ **极易实现多机热备**（多台海外 VPS 各建一条隧道回国内，本地 HAProxy 极速主备切换） |

````{admonition} 架构师推荐指南
:class: tip

- **如果你的客户端是国内服务器后端或本地开发机**：**强烈推荐方案 B（SSH 隧道）**，这是最轻量、最安全、最抗干扰的通信方式！
- **如果你的反向代理必须对外直接给移动端 App、Web 网页前端提供公开 API**：则采用方案 A（标准 HTTPS 域名网关）。
````

---

## 二、方案 A 实施：Cloudflare 二级域名 DNS 智能解析

如果需要对外提供公网 HTTPS 服务，可使用 Cloudflare 为反代服务绑定独立二级域名。

### 1. 配置二级域名 A 记录
假设主域名为 `example.com`，现在为反代中转引擎分配二级域名 `proxy.example.com`（或 `api.example.com`）：

```{mermaid}
flowchart LR
    Domain["二级域名<br/>proxy.example.com"] --> CF["Cloudflare DNS 权威解析"]
    CF --> VPS["海外反代 VPS 真实 IP<br/>(如 45.x.x.x)"]
```

1. 进入 Cloudflare 对应域名的【DNS】->【Records】；
2. 点击【Add record】：
   - **Type (类型)**：`A`
   - **Name (名称)**：`proxy`
   - **IPv4 address**：填入海外 VPS 的真实公网 IP
   - **Proxy status (代理状态)**：灰云或橙云（见下文取舍）
   - **TTL**：Auto

---

## 三、灰云（仅 DNS） vs 橙云（CDN 代理）核心取舍（必读避坑）

```{mermaid}
graph TD
    subgraph Grey["灰云：DNS Only (纯解析)"]
        G1["客户端直连海外 VPS 真实 IP"]
        G2["延迟最低，无任何中间层缓冲"]
        G3["缺点：真实源站 IP 暴露，需自行防 DDoS"]
    end

    subgraph Orange["橙云：Proxied (开启 CDN 代理)"]
        O1["客户端连接 Cloudflare Anycast 边缘节点"]
        O2["优点：隐藏真实源站 IP，自带全球 WAF 防护"]
        O3["🚨 痛点：默认限制 100 秒超时，易切断长文本流"]
    end
```

### 1. 为什么“橙云”可能破坏大模型流式输出？
- **100 秒强制作废（Gateway Timeout 524）**：Cloudflare 免费版对单个 HTTP 请求的最长保持时间为 100 秒。当大模型在深度推理、长文本生成或批量生图时，一旦超过 100 秒无新数据包，Cloudflare 会强行断连并向客户端抛出 `524 A timeout occurred`；
- **响应缓冲干扰**：默认情况下，CDN 可能会尝试缓冲小数据块，破坏即时打字机流式体验。

### 2. 生产最佳决策矩阵

| 业务场景 | 推荐配置 | 优化方案与要点 |
| :--- | :--- | :--- |
| **作为后端业务直接 API 接口** | ⭐️ **首选 灰云 (DNS Only)** | 延迟最低，完全避免任何 100s 握手断连风险。在 VPS 上依靠 UFW 与 Nginx 限流保证安全。 |
| **需要隐藏源站 IP / 防止被恶意攻击** | ⭐️ **选择 橙云 (Proxied)** | 必须在 Cloudflare 的【Configuration Rules】中针对该二级域名设置 **Disable Buffer** 并延长超时时间。 |

---

## 四、核心辨析：入站“小云朵” vs 出站“Cloudflare WARP”（新手必读）

许多初学者在搭建反代网关时，容易将 **“Cloudflare 小云朵（橙云代理）”** 与 **“Cloudflare WARP 出口代理”** 混为一谈，甚至误以为“开启小云朵就能防止账号被封”，导致灾难性翻车。两者具有完全相反的流量方向与职责定位：

```{mermaid}
flowchart LR
    subgraph InboundTraffic ["【入站链路 Inbound】—— 必须保持灰云"]
        User["客户端 / 开发者"] -->|域名请求| CF_DNS["Cloudflare DNS (灰云 DNS Only)"]
        CF_DNS -->|直连原生握手| Nginx["海外 VPS (Nginx 反代)"]
    end

    subgraph OutboundTraffic ["【出站链路 Outbound】—— 建议挂 WARP 混淆"]
        CPA["CLIProxyAPI 网关"] -->|本地 SOCKS5 :40000| WARP["Cloudflare WARP 客户端"]
        WARP -->|Anycast 优质原生 IP| Upstream["海外官方 (Google / OpenAI / xAI)"]
    end

    Nginx -->|本地环回 127.0.0.1:8317| CPA
```

### 关键对比清单

| 对比维度 | Cloudflare 小云朵 (Proxied 橙云) | Cloudflare WARP (出站网关) |
| :--- | :--- | :--- |
| **生效流向** | **入站 (Inbound)**：从终端用户指向你的 VPS 域名 | **出站 (Outbound)**：从你的 VPS 指向上游 AI 官方接口 |
| **核心用途** | 隐藏源站服务器公网 IP，提供全球 CDN 缓存与 DDoS 防护 | 掩盖 VPS 机房机架 IP，伪装成优质 Anycast 原生家庭/移动双栈 IP |
| **对大模型的影响** | 🚨 **破坏流式推流**：100 秒强制作废（524 错误）+ 分块缓冲延迟 | ⭐️ **抵御账号封锁**：有效解除 Google/OpenAI 对机房 IP 的验证码与假 429 拦截 |
| **生产配置建议** | 🚨 **坚决关闭（保持灰云 DNS Only）** | ⭐️ **强烈推荐开启（以本地 SOCKS5 模式运行）** |
