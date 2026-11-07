# 阶段五：白标分销商体系、动态域名与智能商品采集

> **实现基于 Cloudflare for SaaS 的白标分销商独立自定义域名接入、上浮加价定价引擎，以及具备严格防 SSRF（IP锁定与协议白名单）的跨平台商品智能导入引擎。**

---

## 阶段导读

一个平台想要快速做大交易体量，**分销代理商网络（Reseller Ecosystem）** 是关键引擎：
- 二级分销商希望拥有自己独立的品牌、专属的二级子域名甚至独立顶级域名（如 `shop.reseller.com`），不希望买家察觉上游供货商的存在；
- 分销商需要自主设定加价比例（如统一上浮 15% 或固定加价 5 元），上游发卡与售后履约全自动同步，差额利润自动计入分销商专属账户；
- 商家从其他老旧系统迁移资产时，往往需要从上游供货商（如 GmailBuy、Maitg、Ka8 等）一键导入商品数据，但若采集逻辑设计不当，极易遭受服务端请求伪造（SSRF）内网穿透攻击。

本阶段带你攻克 **Cloudflare for SaaS 动态 SSL 证书自动化签发**、**高精度整数加价运算引擎** 以及 **基于 IP 锁定的防御级安全抓取器（SafeFetch）**。

---

## 核心知识点图谱

```{mermaid}
flowchart LR
    A["分销商白标体系<br/>(独立品牌名/自定义Logo/隐藏上游痕迹)"] --> B["Cloudflare for SaaS 自定义域名<br/>(CNAME解析 / 自动签发并续期SSL证书)"]
    B --> C["上浮加价与限高定价引擎<br/>(千分比加价/固定加价/平台限高熔断保护)"]
    C --> D["跨平台商品智能导入适配器<br/>(适配 GmailBuy / Maitg / Ka8 格式)"]
    D --> E["防 SSRF 安全抓取引擎 SafeFetch<br/>(DNS预解析/RFC保留IP阻断/防DNS重绑定)"]
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_reseller_subdomains_and_markup_engine
02_safefetch_and_product_importer
```
