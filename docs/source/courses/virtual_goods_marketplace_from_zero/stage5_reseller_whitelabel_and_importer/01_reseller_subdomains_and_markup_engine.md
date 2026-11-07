# 白标分销商体系、Cloudflare for SaaS 动态域名与加价引擎

为了让合作伙伴零技术门槛开展独立电商业务，24goods 实现了**全自动化的多租户白标分销（White-Label Reseller）与加价结算体系**。

---

## 1. 独立白标店铺：三级域名接入拓扑

分销商无需租用服务器或部署代码，即可获得完全属于自己的独立品牌网店：

```{mermaid}
flowchart TD
    Client["买家浏览器请求"] --> CF["Cloudflare 边缘节点"]

    subgraph 接入方式矩阵
        R1["方式一：URL 参数直通<br/>https://main.com/?store=vipshop"]
        R2["方式二：泛解析二级子域名<br/>https://vipshop.main.com"]
        R3["方式三：分销商独立顶级域名 (SaaS)<br/>https://buy.reseller-brand.com (CNAME)"]
    end

    CF --> R1 & R2 & R3
    R1 & R2 & R3 --> Caddy["Caddy 反向代理网关 (透传 Host)"]
    Caddy --> Middleware["FastAPI: StorefrontMiddleware<br/>(根据 Host / Query 查询匹配分销商)"]
    Middleware --> App["展示完全贴牌的独立店铺<br/>(品牌名/自选商品/自主加价/隐藏上游痕迹)"]
```

### 1.1 Cloudflare for SaaS 动态自动化 SSL 签发
分销商将自己的域名（如 `buy.reseller.com`）CNAME 解析至平台的专用接入点 `custom.main.com`。
- 平台通过 Cloudflare for SaaS 的 Custom Hostnames API 自动向 Cloudflare 注册该主机名；
- Cloudflare 自动完成域名控制权校验（DCV）并在边缘侧全自动签发并续期免费的 SSL/TLS 证书；
- **分销商买家全程享受 HTTPS 加密**，完全感知不到底层服务器的存在。

---

## 2. 整数加价定价引擎与平台限高保护

在分销体系中，分销商靠在货源底价上**“加价”**获取利润。为杜绝浮点数精度漏洞，我们设计了全整数运算的加价计算器：

### 2.1 两种加价策略
1. **百分比上浮加价（Percent Markup）**：
   在底价基础上按千分比上浮，结果**向上取整（CEIL）**到分：
   $$\text{Markup} = \left\lceil \frac{\text{Base\_Price} \times \text{permille}}{1000} \right\rceil$$
2. **固定金额加价（Fixed Markup）**：
   每件商品在底价基础上固定增加指定分（如加价 200 分即 2.00 元）：
   $$\text{Markup} = \text{Fixed\_Minor}$$

### 2.2 平台限高与防穿透熔断
为了防止恶意分销商恶意设置 1000% 的荒谬暴利价格损害平台口碑，平台管理员可设置全局限高上限（`max_markup_permille` / `max_markup_fixed_minor`）：

```python
# app/modules/reseller/pricing.py
def markup_per_unit(price_minor: int, kind: str, value: int, sf: Storefront) -> int:
    """计算单品加价金额（分）。即使分销商输入恶意值，也在计算时刻强制收敛于平台上限！"""
    value = max(0, int(value))
    if kind == "percent":
        # 强制收敛于分销商允许的最高千分比（如 200 即 20%）
        value = min(value, sf.max_permille)
        return (price_minor * value + 999) // 1000  # 向上取整，保障利润
    return min(value, sf.max_fixed_minor)
```

**不可破底线**：
加价金额 $\ge 0$。分销商**绝无可能将售价压低到低于供货商底价**，彻底杜绝跨商户低价倾销砸盘。

---

## 3. 分润实时结转与自动提现流转

当来自某分销商店铺的订单付款成功时：
1. **自动记账**：分销商赚取的 `reseller_markup_minor` 被自动记入复式账本科目 `reseller_payable:{reseller_id}`；
2. **结算与提现**：分销商在后台申请提现（支持绑定 USDT TRC20 / Arbitrum 钱包地址），管理员审核后一键执行转账冲销，整套分销佣金链条清晰可溯。
