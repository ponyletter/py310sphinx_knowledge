# 安全优先虚拟商品与数字服务交易平台：24goods 从 0 到 1 工业级全栈研发实战

> **基于 FastAPI + Vue 3、双进程非对称信封加密保险库、闲鱼式议价协商、多通道支付（易支付/BEpusdt）与 Claude Code / Agent 协同开发的全流程实战指南**

---

## 专栏背景与核心价值

在数字化商品与虚拟资产交易领域，传统的自动发卡系统与 C2C 交易平台正面临着严峻的**安全性与体验割裂困境**：

1. **灾难性的卡密明文泄露隐患**：绝大多数开源发卡系统（如独角数卡、ZFAKA 等）直接将充值卡、授权激活码以明文或简单对称加密形式存储在业务数据库中。一旦 Web 容器遭遇 SQL 注入漏洞、备份文件泄露或后台权限失陷，所有数字资产将被洗劫一空；
2. **缺乏即时协商与定制服务交付能力**：传统发卡系统仅支持“货架式”固定标价出售标准卡密，对于 ChatGPT 代充、账号定制、海外软件激活等需要买家提供个性化参数（如账号/密码/Token）或动态砍价协商的数字化服务，系统无法承接，商家只能将流量导出至第三方社交软件，极易造成客源流失与跳单欺诈；
3. **黑灰产与假支付漏洞层出不穷**：易支付及加密货币网关常年遭受签名伪造、重放攻击、金额篡改、并发争抢等手段撞库；更有甚者通过修改客户端金额实现 1 分钱提货，后台账目混乱无法对账；
4. **多租户与分销白标的技术壁垒**：如何让二级代理商一键开设独立品牌的白标店铺、绑定自定义域名，同时在数据库底层实现物理级的租户数据强隔离（Row-Level Security），并精确进行分润自动结转？
5. **AI 辅助研发下的工程质量控制**：在利用 Claude Code、Antigravity (AGY) 等前沿大模型进行代码自动生成时，如果缺乏严密的工程规范约束，很容易引入隐藏的内存膨胀、死锁、金额浮点数精度丢失与权限越权（IDOR）缺陷。

本专栏脱胎于 **24goods (Kesiv)** 真实商业级虚拟商品交易平台的完整研发历程，带你从**行业调研、技术选型、密钥安全规划、双进程卡密金库研发、闲鱼式议价协商、多通道支付流水（复式记账账本）、白标分销体系**，一直到 **AI Agent 规范约束与低配服务器 OOM 调优实战**，完整还原一个现代化、高可用、高安全的虚拟商品交易系统从 0 到 1 的全部工程细节。

---

## 阶段架构概览

```{mermaid}
flowchart TD
    S1["阶段一：业务定位、行业竞品深度调研与架构决策<br/>(独角数卡/Sellix/Gumroad/闲鱼对比/为何不用Nuxt与Centrifugo/ADR选型)"]
    S2["阶段二：前置准备、全套密钥规划与第三方基础设施<br/>(AES-256/Ed25519/Cloudflare WAF与Turnstile/Telegram Bot/BEpusdt自建USDT/易支付)"]
    S3["阶段三：安全底座研发：双进程隔离金库与数据库强加固<br/>(非对称信封加密/零出网独立交付进程/PostgreSQL FORCE RLS/复式记账账本)"]
    S4["阶段四：核心业务闭环：闲鱼式即时聊天、议价与履约交付<br/>(HMAC签名报价卡片/购物车合并结算/买家定制信息弹窗/售后退款流转)"]
    S5["阶段五：白标分销商体系、动态域名与智能商品采集<br/>(Cloudflare for SaaS多租户域名/加价定价引擎/防SSRF IP锁定商品搬家引擎)"]
    S6["阶段六：AI Agent 协同开发规范、低资源机优化与 Bug 攻防实战<br/>(AGENTS.md安全铁律/2GB内存防OOM互斥锁/全自动CI流水线/支付重放与锁死踩坑复盘)"]
    S7["阶段七：真实 Claude 对话实录、LXD/Docker 容器踩坑与双环境运维手册<br/>(8d2e5ffb与5defe2ff会话复盘/人机高频问答/LXD升级与嵌套/双环境运维手册)"]

    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
```

---

## 🎯 学完能交付什么

完成本专栏的学习与实操，你将获得并掌握以下工业级交付成果：

| 交付成果物 | 对应阶段 | 核心技术标准与交付标准 |
| :--- | :--- | :--- |
| **虚拟商品/发卡行业全景调研报告与架构决策库 (ADRs)** | 阶段一 | 掌握独角数卡、Sellix、Gumroad、闲鱼的技术优劣势矩阵，掌握无 Node 运行时纯静态 SPA + FastAPI 模块化单体选型逻辑。 |
| **高安全性密钥全生命周期管理模型与环境拓扑** | 阶段二 | 落地 AES-256-GCM 根密钥、Ed25519 签名对、Telegram Bot 告警系统与自建 BEpusdt (Arbitrum/X Layer/TRC20) 节点环境。 |
| **双进程物理隔离卡密安全金库系统** | 阶段三 | 实现业务 API 与交付 Worker 的物理分离：只有零外网权限的 Worker 持有卡密私钥，`SKIP LOCKED` 并发秒级消费防超卖。 |
| **PostgreSQL 数据库深度加固体系** | 阶段三 | 落地 `FORCE RLS` 全局租户隔离策略，配置 `Ck_orders_amount_split` 约束与 $\sum=0$ 复式记账审计账本。 |
| **闲鱼式即时聊天、议价改价与收银台全套前端** | 阶段四 | 基于 Vue 3 + Vant 4 交付移动端优先的买家端，支持 HMAC 签名防篡改改价卡片、买家凭证输入、多渠道支付联动。 |
| **白标分销商 SaaS 独立域名与防 SSRF 采集搬家引擎** | 阶段五 | 基于 Cloudflare for SaaS 实现免配置 SSL 自定义域名分销，集成带 IP 固定与严格协议白名单的跨平台商品导入引擎。 |
| **面向 AI 智能体的工程协作规范 (AGENTS.md)** | 阶段六 | 建立 11 条不可逾越的安全不变量、低内存（2GB RAM）下的 `flock` 互斥保护与分阶段持续交付 SOP。 |
| **真实生产级重大 Bug 攻防案例集与排查手册** | 阶段六 | 深度掌握支付通知恒定时间 MD5 防时序攻击、购物车逐行向上取整舍入差解法、支付渠道切换 409 锁死破局之道。 |
| **真实 Claude 对话实录分析与双环境终极运维手册** | 阶段七 | 掌握 AI 辅助开发提速与 Token 节流控制，落地 LXD 5.21 与 Docker 嵌套虚拟化生产部署，熟练掌握 scripts/dev.sh 与 scripts/prod.sh 自动化运维。 |

---

## 🔒 隐私安全与工程脱敏声明

本专栏所有工程架构、业务流程、代码实现与排障记录均取材于 **24goods (Kesiv)** 真实生产演进历程，但已严格执行脱敏安全标准：
* **公网 IP 脱敏**：所有真实服务器 IP 均已映射为符合 **RFC 5737** 标准的文档专用保留 IP（如 `198.51.100.1`、`203.0.113.20`）；
* **域名脱敏**：示例域名统一使用 `shop.example.com`、`reseller.example.com` 占位符；
* **敏感密钥脱敏**：JWT 密钥、数据库凭证、AES 根密钥、Telegram Bot Token、易支付 Merchant Key 及 USDT 归集钱包地址均替换为高熵随机占位测试串。

---

## 📑 专栏阶段目录导航

```{toctree}
:maxdepth: 2

stage1_market_research_and_architecture_decisions/index
stage2_security_keys_and_infra_setup/index
stage3_dual_process_vault_and_database_hardening/index
stage4_core_commerce_flows_and_chat_negotiation/index
stage5_reseller_whitelabel_and_importer/index
stage6_agent_collaboration_cicd_and_bug_postmortems/index
stage7_claude_dialogues_lxd_docker_and_ops_playbook/index
```
