# 阶段二：前置准备、全套密钥规划与第三方基础设施

> **从零规划生产级密码学密钥矩阵、容器化独立配置隔离，并打通 Cloudflare WAF、Turnstile 人机验证、Telegram Bot 告警、易支付与自建 BEpusdt (USDT) 支付网关。**

---

## 阶段导读

虚拟电商平台的致命弱点通常爆发在**密钥管理混乱**与**第三方基础设施裸奔**上：
- 许多团队将数据库密码、JWT 密钥、支付商户私钥混杂在一个全局 `.env` 中，由所有微服务甚至前端构建脚本共享读取；
- 一旦某一个容器被挂马，整个系统的所有底层凭证全部泄露；
- 另外，缺乏有效的防刷防爬防扫机制，易支付接口暴露在外秒级被扫描器打到频繁风控，Telegram 告警缺乏降噪策略导致被群消息轰炸失效。

本阶段带你建立一套**最小特权原则的密钥矩阵**，规划并生成 AES-256-GCM 根密钥、Ed25519 签名对与 JWT 会话密钥，并将容器环境变量进行物理级严格隔离；同时深入接入 **Cloudflare、Telegram Bot、彩虹易支付与自建 BEpusdt (多链 USDT)**，构建抵御生产恶意流量的第一道硬核防线。

---

## 核心知识点图谱

```{mermaid}
flowchart LR
    A["密码学密钥规划矩阵<br/>(AES-256主密钥/Ed25519/HMAC-SHA256)"] --> B["多容器最小特权环境隔离<br/>(deploy/env/api.env vs delivery.env)"]
    B --> C["边缘防护与抗机器人体系<br/>(Cloudflare WAF/Turnstile/自研PoW)"]
    C --> D["双通道支付网关集成<br/>(易支付MD5/BEpusdt Arbitrum+TRC20)"]
    D --> E["Telegram 运维与履约通知中枢<br/>(订单支付/人工交付/风控熔断降噪)"]
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_cryptographic_keys_and_secret_vault
02_gateways_cloudflare_and_telegram
```
