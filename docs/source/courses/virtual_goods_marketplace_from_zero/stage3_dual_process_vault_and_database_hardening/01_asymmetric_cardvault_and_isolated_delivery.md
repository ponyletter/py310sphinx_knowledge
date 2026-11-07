# 双进程物理隔离卡密金库与无出网交付 Worker

虚拟商品电商的核心资产是**卡密（Card Key / Secret）**。如果卡密在数据库中以明文或单层对称加密方式存放，整个业务系统就如同一座纸糊的城堡。本节详细讲解 24goods 所实现的**双进程物理隔离非对称信封加密保险库**架构。

---

## 1. 非对称信封加密模型 (Envelope Encryption)

在传统对称加密中，加密与解密使用的是同一个密码。如果 Web 进程需要将卡密入库，就必须在其内存中持有该密码，这导致攻击者只要攻破 Web 进程，就能拿到解密密码。

我们采用密码学上标准的**信封加密（Envelope Encryption）**机制：

```{mermaid}
sequenceDiagram
    autonumber
    participant Admin as 商家后台 / 上架
    participant API as FastAPI 业务进程 (持有公钥)
    participant DB as PostgreSQL 数据库
    participant Worker as 交付 Worker (持有私钥, 无外网)
    participant Buyer as 付款买家

    Note over Admin,API: 阶段一：卡密录入与入库封存
    Admin->>API: 上传原始卡密明文 (Secret)
    API->>API: 1. 生成一次性临时数据密钥 (DEK, AES-256-GCM)<br/>2. 用 DEK 加密卡密明文得到 Ciphertext<br/>3. 用金库公钥 (Public Key) 加密 DEK 得到 Encrypted DEK<br/>4. 计算明文 SHA-256 得到 Fingerprint (指纹防重)
    API->>DB: 写入 (Encrypted_DEK, Ciphertext, Nonce, Tag, Fingerprint)
    Note over API: 内存即时销毁明文，API 自身根本无法解密！

    Note over Buyer,Worker: 阶段二：支付履约与隔离解密
    Buyer->>API: 支付完成 (Order status: paid)
    API->>DB: 写入 Outbox 履约任务
    Worker->>DB: FOR UPDATE SKIP LOCKED 争抢锁定可用卡密并绑定订单
    Buyer->>API: 请求提取卡密 (提供一次性 Access Code)
    API->>Worker: 内部受限 RPC 请求解密 (经由内部安全网络)
    Worker->>Worker: 1. 用金库私钥 (Private Key) 解密 Encrypted DEK<br/>2. 用解出的 DEK 解密 Ciphertext 得到卡密明文
    Worker-->>API: 纯内存返回明文卡密
    API-->>Buyer: 响应明文展示给买家 (不记日志，内存立即 GC)
```

### 核心存储结构设计 (`CardStock`)
在数据库表 `card_stocks` 中，存储的数据绝对不包含任何明文字符：
- `encrypted_dek`：由 4096 位 RSA-OAEP 或 X25519 金库公钥加密后的数据密钥密文；
- `ciphertext`：由 DEK 加密后的卡密数据密文；
- `nonce` & `tag`：AES-256-GCM 认证随机数与消息验证码（防止密文被篡改重放）；
- `fingerprint`：原始卡密的 SHA-256 哈希值。**用于在未解密状态下完成去重与唯一性校验**，防止重复录入相同卡密。

---

## 2. 物理网络隔离：无出网权限的 Delivery 容器

在 Docker Compose 生产编排中，我们将 `delivery` 容器的网络权限收敛到了极致：

```yaml
# deploy/docker-compose.yml (核心网络截选)
networks:
  public_edge:      # 面向 Caddy 反代的前端网络
  internal_backend: # 内部网络，禁止任何公网网关出网 (internal: true)
    internal: true

services:
  api:
    image: ghcr.io/yourorg/24goods-api:latest
    networks:
      - public_edge
      - internal_backend
    env_file: deploy/env/api.env
    secrets:
      - cardvault_public_key

  delivery:
    image: ghcr.io/yourorg/24goods-delivery:latest
    networks:
      - internal_backend  # 物理隔离，无法连接任何公网 IP
    env_file: deploy/env/delivery.env
    secrets:
      - cardvault_private_key # 全系统唯一挂载私钥的容器
```

### 纵深防御收益：
即使公网暴露的 `api` 容器由于某个第三方 Python 库缺陷被黑客打下并获得 Root Shell：
1. 黑客在 `api` 容器内只能找到 `cardvault_public.pem`（公钥），根本无法解密库中密文；
2. 黑客试图反向扫描内网中的 `delivery` 容器，但由于 `delivery` **没有外网网关且只监听内部最小端口**，黑客即便强行发起内网攻击，也无法将私钥或解密后的数据发往外部恶意 C2 服务器（受 `internal: true` 网络隔离限制）。

---

## 3. 并发防超卖：Outbox + `SKIP LOCKED` 争抢模型

在秒杀或大促场景下，多个买家同时抢购同一款数字卡密，极易引发死锁（Deadlock）或超卖（同一张卡发给多个人）。

24goods 采用经典高效的 **事务性发件箱（Transactional Outbox）+ 行级非阻塞争抢** 机制：

### 3.1 事务一致性入队
当支付完成时，在**同一个数据库事务**内完成：
1. 订单状态更新为 `paid`；
2. 记账流水写入 `ledger`；
3. 向 `outbox` 表写入一条履约任务：
   ```python
   db.add(Outbox(
       tenant_id=order.tenant_id,
       topic="order.paid",
       key=str(order.id),
       payload={"order_id": str(order.id), "tenant_id": str(order.tenant_id)}
   ))
   ```

### 3.2 `SKIP LOCKED` 争抢消费
`delivery` 进程后台轮询消费未完成的 Outbox 任务。当为订单出库绑定卡密时，执行带有 `SKIP LOCKED` 语义的高性能查询：

```python
# app/delivery/worker.py (核心出库锁)
stmt = (
    select(CardStock.id)
    .where(
        CardStock.product_id == order.product_id,
        CardStock.status == "available",
        or_(CardStock.expires_at.is_(None), CardStock.expires_at > func.now())
    )
    .order_by(CardStock.created_at, CardStock.id)
    .limit(order.qty)
    .with_for_update(skip_locked=True)  # 核心：跳过已被其他并行任务锁定的卡密行！
)
card_ids = list(await db.scalars(stmt))

if len(card_ids) < order.qty:
    # 库存不足，安全流转至人工审查 manual_review，绝不超发，绝不报错崩盘
    order.status = "manual_review"
    await add_event(db, order, "paid", "manual_review", reason="out_of_stock")
else:
    # 锁定成功，标记卡密归属
    await db.execute(
        update(CardStock)
        .where(CardStock.id.in_(card_ids))
        .values(status="claimed", order_id=order.id, claimed_at=func.now())
    )
    order.status = "delivered"
```

**并发特性**：
多个 Worker 实例同时消费时，各自锁定互不冲突的数据行，无需引入高复杂度的分布式锁，且杜绝任何死锁风险，单节点轻松应对数千 QPS 并发出库。
