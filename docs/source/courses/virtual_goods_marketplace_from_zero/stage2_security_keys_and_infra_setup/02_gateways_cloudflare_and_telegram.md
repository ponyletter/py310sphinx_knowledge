# 第三方服务矩阵打通：Cloudflare、Telegram、易支付与 BEpusdt

虚拟交易平台不能存在单点依赖。在架构层面，我们将**边缘安全清洗、人机验证抗刷、即时履约告警以及法定货币与加密资产双收银通道**深度集成到统一的生命周期中。

---

## 1. 边缘防护与抗机器人体系 (Cloudflare + Turnstile + PoW)

面向公网的虚拟商品平台，每天会遭遇数以万计的扫描器刺探、撞库机器人与重放攻击。我们采用**三层递进防御拓扑**：

```{mermaid}
flowchart LR
    Traffic["公网访问流量"] --> L1["第一层: Cloudflare Edge<br/>(WAF规则/Under Attack 5秒盾/黑名单IP同步)"]
    L1 --> L2["第二层: Cloudflare Turnstile<br/>(零感知人机验证: 注册/优惠券领取/未登录快捷购买)"]
    L2 --> L3["第三层: 客户端自研 PoW 引擎<br/>(Web Worker 算力挑战/防瞬时脚本并发刷单)"]
    L3 --> App["FastAPI 业务核心"]
```

### 1.1 Cloudflare Turnstile 无感接入
传统字符图形验证码（CAPTCHA）在移动端极度劝退用户，且早已被打码平台和视觉大模型轻松破解。我们选用 Cloudflare Turnstile：
- **触发场景**：仅在未登录游客快速下单（Instant Account）、批量领券验券（Promo Validate）等高频易刷接口上开启；
- **校验原则**：前端通过组件获取 `cf-turnstile-response` Token，后端在服务端向 `https://challenges.cloudflare.com/turnstile/v0/siteverify` 验证其真实性；验证通过后立即消耗重置，杜绝 Token 重放。

### 1.2 客户端轻量级 PoW（工作量证明）防线
在 Turnstile 之外，24goods 前端内置了纯 JavaScript/WebAssembly 的 SHA-256 算力挑战引擎（Proof of Work）：
- 买家在执行即时游客建号时，浏览器在 Web Worker 后台消耗微量 CPU 算力（通常在手机端耗时 300ms~600ms）寻找符合特定前导零难度的 Hash；
- **商业价值**：普通买家毫无感知，但黑产如果使用自动化脚本批量发卡抢购，其并发攻击成本将呈指数级上升。

---

## 2. Telegram 智能运维与履约通知中枢

系统中的核心业务事件通过 Telegram Bot 实现毫秒级推送到管理员手机，杜绝订单漏发：

### 2.1 核心通知事件
1. **订单支付成功（自动发卡）**：通知订单号、实付金额、商品名称，标记为“已自动出库”；
2. **人工交付订单提醒（Manual Delivery）**：当买家购买了需人工充值/交付的定制商品时，TG 机器人高亮推送买家填写的凭据（如邮箱/账号），附带后台直达处理链接；
3. **安全风控拦截预警**：检测到非法支付签名、金额篡改尝试、或单 IP 高频被限流（429）封禁时，触发 Critical 级别警报。

### 2.2 防刷与告警降噪策略
为防止异常流量或黑客攻击触发 TG 接口调用频率限制（Rate Limit），我们在 Redis 中实现了**滑窗降噪器**：
- 同一 IP、同一异常类型（如 `payment.notify_bad_signature`）每分钟仅落盘记录一次并合并推送一次告警；
- 避免管理员 Telegram 被海量垃圾消息轰炸而遗漏真实订单。

---

## 3. 双通道支付集成：彩虹易支付与自建 BEpusdt

平台提供法定货币（通过聚合网关）与加密货币（自建无第三方抽成的 USDT）双结算通道。

### 3.1 易支付 (ZPay) 协议对接
ZPay 遵循经典的“彩虹易支付”MD5 签名规范：
- **请求签名**：将所有非空参数按 Key 字典序升序排序，拼接为 `k1=v1&k2=v2...` 后追加商户密钥 `key`，计算小写 MD5；
- **恒定时间校验防时序攻击**：
  ```python
  import hmac
  # 严禁使用 if given == sign(params):
  # 必须使用恒定时间比较，防止攻击者利用字符逐字节响应耗时差异推导密钥
  is_valid = hmac.compare_digest(given_signature.lower(), calculated_signature.lower())
  ```
- **关键铁律**：严禁在验签通过后直接交付！必须再次调用网关查单接口 `api.php?act=order&out_trade_no=...`，由服务端核对实际支付状态。

### 3.2 自建 BEpusdt (多链 USDT) 结算网关
针对加密货币结算，我们选用开源高性能的 **BEpusdt**，以独立容器运行在受限 Docker 网络中：
- **支持网络拓扑**：
  - **Arbitrum One**（Layer 2，极低 Gas，适合小额支付）；
  - **X Layer**（OKX 生态链，低手续费）；
  - **TRON (TRC20)**（高普及度，大额结算主流）。
- **流程规范**：
  1. 买家下单后，FastAPI 调用 BEpusdt RPC `/api/v1/order/create-transaction` 申请独立交易；
  2. 获取唯一的收款地址与精确的小数金额（例如 10.02 USDT 用于订单区分）；
  3. 前端展示专属倒计时与链上地址二维码；
  4. 链上确认后，BEpusdt 回调 FastAPI 的 `/api/v1/payments/notify/bepusdt`，走统一状态机入账并触发自动发卡。
