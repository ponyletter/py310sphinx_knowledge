# 阶段四：跨境出海住宅代理链式转发与安全防封

> **拆解跨境电商与社媒防封利器——“前置 VPS 高速转发 + 纯净住宅 IP 出口”链式代理架构，阻断 QUIC 真实 IP 泄漏，规避 Cloudflare 优选 IP 端口陷阱并实现面板纯内网加固。**

---

## 阶段导读

在 TikTok 运营、跨境店铺管理、海外独立站收款等对环境纯净度要求极高的场景中，机房数据中心（Data Center）IP 很容易触发风控封禁。单纯购买昂贵的住宅 IP（按流量计费），如果直接连向客户端，又往往因为延迟极高、丢包严重导致操作卡顿。

本阶段将带你攻克**链式代理（Chained Proxy）**的核心架构设计，并解决实战中的两大致命陷阱：**QUIC 协议旁路导致的机房真实 IP 泄露**，以及 **Cloudflare 优选 IP 在非 443 端口上的超时死局**。

---

## 核心架构拓扑

```{mermaid}
flowchart LR
    subgraph Client["本地办公机 (客户端)"]
        Browser["跨境专用浏览器 / 客户端"]
    end

    subgraph Transit["日本/美西 VPS 容器 c2 (前置高速中继)"]
        Inbound["Xray / 3X-UI 入站监听<br/>(TCP/TLS 加密中转)"]
        BlockQUIC["强制阻断 UDP 443 (QUIC)<br/>(防 UDP 绕过代理泄漏宿主 IP)"]
    end

    subgraph Residential["海外住宅 IP 代理服务提供商"]
        SocksExit["SOCKS5 / HTTP 认证网关<br/>(按量计费纯净住宅宽带)"]
    end

    subgraph Target["目标风控平台"]
        TikTok["TikTok / PayPal / Stripe / Amazon<br/>(识别到的客户端 IP 完全为本地家庭宽带)"]
    end

    Browser -->|极速专线直连| Inbound
    Inbound --> BlockQUIC
    BlockQUIC -->|SOCKS5 链式转接| SocksExit
    SocksExit -->|真实美国家庭宽带出口| TikTok
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_residential_exit_and_quic_leak_prevention
02_cf_clean_ip_port_trap_and_origin_rules
```
