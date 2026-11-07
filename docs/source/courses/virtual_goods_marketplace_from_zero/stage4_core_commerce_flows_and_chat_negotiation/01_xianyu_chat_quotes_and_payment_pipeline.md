# 闲鱼式即时聊天、HMAC 防篡改议价与支付状态机闭环

闲鱼的核心魔力在于：**买家咨询不仅是问答，更是实时商机与成交入口**。24goods 在系统内深度实现了这一链路，同时通过严格的密码学签名保障交易的严肃性。

---

## 1. 闲鱼式聊天议价与报价卡片体系

当买家从商品详情页点击“聊一聊”或“砍价”时，系统自动关联商品上下文打开专属会话。

### 1.1 报价卡片生成与商户底价防线
客服在后台 CS Inbox 中可针对买家诉求发起议价改价卡片：
1. **底价熔断保护（Floor Price）**：
   商家在商品库中为每件商品设置了 `floor_price_minor`（最低保护底价）。客服填写的议价金额若低于底价乘以数量，系统直接拦截报错，**防止内部客服恶意低价勾结或手误输入少打零**；
2. **HMAC-SHA256 规范化数字签名**：
   为杜绝买家在浏览器端篡改 WebSocket/SSE 下发的消息内容或伪造 HTTP 参数接受超低价格，服务端在生成报价时对其进行强密码学签名：

```python
# app/modules/chat/quotes.py
import json, hmac, hashlib

def canonical(q: Quote) -> bytes:
    """序列化规范化字段列表，严格消除空格与排序歧义"""
    fields = [
        "v1",
        str(q.id),
        str(q.tenant_id),
        str(q.conversation_id),
        str(q.product_id or ""),
        q.title,
        str(q.amount_minor),
        q.currency,
        str(q.qty),
        str(int(q.expires_at.timestamp())),
        str(q.version),
    ]
    return json.dumps(fields, ensure_ascii=False, separators=(",", ":")).encode()

def sign_quote(key: bytes, q: Quote) -> str:
    return hmac.new(key, canonical(q), hashlib.sha256).hexdigest()

def verify_quote(key: bytes, q: Quote) -> bool:
    return hmac.compare_digest(q.signature or "", sign_quote(key, q))
```

### 1.2 报价接受与原子化订单转换
买家在聊天界面点击“接受报价”时，后端在一个原子事务中执行：
1. 锁住报价行：`select(Quote).where(Quote.id == qid).with_for_update()`；
2. 校验状态必须为 `offered` 且未超时；
3. 执行 `verify_quote` 校验 HMAC 数字签名，**签名失效直接判定为严重篡改攻击并记入安全审计日志**；
4. 状态置为 `accepted`，同时生成待支付订单并将 `quote_id` 关联锁定，生成聊天流系统通知。

---

## 2. 严密的支付状态机与收银流水管线

在整个支付闭环中，**“支付回调通知仅仅是一个弱提示，绝不能作为最终履约依据”**。

```{mermaid}
sequenceDiagram
    autonumber
    participant Buyer as 买家
    participant Gateway as 支付网关 (易支付/USDT)
    participant API as FastAPI 支付管道
    participant Redis as Redis (重放防护)
    participant DB as PostgreSQL 事务
    participant Delivery as 隔离交付 Worker

    Buyer->>API: 发起支付请求 (选择通道: 支付宝 / USDT)
    API-->>Buyer: 返回签名安全的收银台跳转 URL
    Buyer->>Gateway: 在网关完成付款
    Gateway->>API: 异步通知 (HTTP POST Notify)

    Note over API,Redis: 严格防御三部曲
    API->>API: 1. 恒定时间 MD5/HMAC 签名算法强校验
    API->>API: 2. 商户 ID 匹配 & Decimal 绝对金额一分不差校验
    API->>Redis: 3. SET notify:trade_id NX EX 60 (防瞬时重放并发抢占)

    API->>Gateway: 4. 服务端发起主动回查 (Re-query Server-to-Server)
    Gateway-->>API: 确认网关底账确实已扣款成功！

    Note over API,DB: 原子化行级锁入账
    API->>DB: 5. 开启事务: SELECT Order FOR UPDATE
    API->>DB: 6. 状态流转: pending_payment -> paid
    API->>DB: 7. 写入 Payments 表 (唯一键 UNIQUE(channel, gateway_trade_no))
    API->>DB: 8. 写入复式记账账本 ledger_entries (借贷平衡)
    API->>DB: 9. 写入 Outbox 履约任务
    API->>DB: 10. COMMIT 事务提交
    API-->>Gateway: 响应 "success" 终止网关重试通知

    Delivery->>DB: 11. 异步消费 Outbox，绑定卡密并自动出库！
```

### 生产级防御要点：
- **瞬时重放与并发拦截**：网络抖动常导致网关在 1 秒内连续发送多条重复异步通知。通过 Redis 的 `SET NX` 作为互斥锁，只有第一条请求能够进入数据库处理，后续并发请求直接排队或跳过，杜绝重复发卡；
- **掉单自动补偿机制**：若网关回调由于公网链路阻断丢失，买家再次访问订单详情页或点击取消订单时，服务端强制触发**“关单前先向网关回查”（Query Before Close）**，一旦发现网关已扣款，立即原位就地激活订单完成履约，最大程度保障买家体验。
