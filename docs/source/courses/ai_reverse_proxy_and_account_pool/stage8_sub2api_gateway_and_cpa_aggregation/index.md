# 阶段八：Sub2API 企业级多协议中转网关与多上游聚合实战

欢迎进入《阶段八：Sub2API 企业级多协议中转网关与多上游聚合实战》。

在完成底层的海外账号采购、Token 自动化提取以及 CLIProxyAPI (CPA) 核心服务池构建后，如何将分散的多个号池、商业化聚合服务（OpenRouter、CRS2）、Google AI Studio 直连渠道统一收拢为标准化的企业级服务？

**Sub2API** 提供了顶层的商业化 SaaS 网关解法：不仅具备精细的用户体系、API Key 授权、多分组流控，更通过底层的**会话粘滞（Sticky Session Affinity）**机制，实现了高达 90% 的 Prompt Cache 命中率与极低扣费。

本阶段基于生产环境真实落地案例，系统记录从资源极端受限的低配 VPS 解耦部署、现存 X-UI 节点的 Caddy 多域名共存、Cloudflare 15 年 Origin 证书绑定，到 Turnstile 防刷、Gmail 发信、Google OAuth SSO 鉴权以及深水区故障排查的完整工程指南。

---

## 阶段架构全景图

```{mermaid}
flowchart TD
    subgraph ClientAccess [终端访问与安全接入]
        ClientWeb["终端用户 / 管理员浏览器"]
        ClientIDE["智能体开发 / 本地 IDE / 聚合客户端"]
        CFTurnstile["Cloudflare Turnstile 人机防刷质询"]
        GoogleSSO["Google OAuth 2.0 用户单点登录"]
    end

    subgraph EdgeProxy ["Cloudflare CDN 边缘节点 (*.kesiv.com)"]
        CFWAF["Cloudflare WAF 托管防火墙"]
        CFEdgeSSL["边缘 SSL 自动证书 (TLS 1.3)"]
    end

    subgraph HostServer ["反代 VPS (107.173.10.79 / 2GB RAM)"]
        CaddyMesh["Caddy 反向代理网关 (:443)<br/>(加载 15 年 Origin CA 证书 / 100MB 上限 / 流式零缓冲)"]
        Sub2APIApp["Sub2API Go 核心网关 (:8080)<br/>(轻量单容器运行, 内存仅 ~45MB)"]
        CronBackup["Crontab + pg_dump 自动冷备份任务"]
    end

    subgraph StorageCluster ["外部数据库集群 (139.199.223.40)"]
        PGDB[("PostgreSQL 18.6<br/>库名: sub2api")]
        RedisCache[("Redis 8.x<br/>会话锁 / RPM 预扣")]
    end

    subgraph MultiUpstreams ["多协议混合上游生态"]
        CPACluster["本地/远程 CLIProxyAPI 号池集群 (Plus/Codex)"]
        ORGateway["OpenRouter 商业大模型通道"]
        GoogleStudio["Google Gemini AI Studio 原生渠道"]
    end

    ClientWeb --> CFTurnstile
    ClientWeb --> GoogleSSO
    ClientWeb --> EdgeProxy
    ClientIDE --> EdgeProxy
    EdgeProxy -->|Full Strict SSL| CaddyMesh
    CaddyMesh -->|127.0.0.1:8080| Sub2APIApp
    Sub2APIApp -->|TCP 5432| PGDB
    Sub2APIApp -->|TCP 6379| RedisCache
    Sub2APIApp -->|会话粘滞高缓存命中| MultiUpstreams
    CronBackup -.->|每日凌晨 03:00 归档| PGDB
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_sub2api_architecture_and_lightweight_deploy
02_caddy_cf_ssl_and_multisite_coexistence
03_scheduling_sticky_session_and_protocol_grouping
04_turnstile_smtp_and_google_oauth_auth_flow
05_troubleshooting_and_disaster_recovery
```

```{seealso}
* **底层账号池部署**：参阅 [阶段六：CLIProxyAPI 核心网关部署与动态调度](../stage6_cliproxyapi_deployment_and_scheduling/index.md)；
* **跨境网络管道与证书基石**：参阅 [阶段五：跨境通信管道：SSH 加密隧道 vs HTTPS](../stage5_domain_cloudflare_and_ssl/index.md)；
* **Sub2API 官方项目与最新 Release**：[https://github.com/Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api)；
* **CLIProxyAPI 官方项目**：[https://github.com/router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)。
```
