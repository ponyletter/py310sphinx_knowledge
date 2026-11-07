# 阶段三：安全底座研发：双进程隔离金库与数据库强加固

> **实现非对称信封加密卡密保险库、零外网出网独立交付 Worker、PostgreSQL FORCE RLS 全局行级租户隔离与不可篡改复式记账审计账本。**

---

## 阶段导读

虚拟商品平台的立身之本是**防盗、防漏、防篡改**。如果安全防护仅依赖应用层代码中的 `if` 逻辑，任何一次未捕获的边界缺陷或第三方库漏洞，都会直接击穿数据防线。

在这一阶段，我们将系统安全下沉到**操作系统网络命名空间、密码学非对称信封以及数据库内核引擎**中：
1. **双进程物理隔离**：即便公网 API 容器被攻陷，由于其根本没有解密私钥，攻击者无论如何也解密不了数据库中的卡密；
2. **PostgreSQL FORCE RLS**：无论业务代码是否忘记拼写 `WHERE tenant_id = ...`，PostgreSQL 内核级别强制仅返回当前租户数据，杜绝越权；
3. **复式记账审计账本**：资金流变动必须借贷平衡，任何尝试伪造余额、改写交易的操作都会触发数据库触发器报警并整单回滚。

---

## 核心知识点图谱

```{mermaid}
flowchart LR
    A["卡密信封加密模型<br/>(AES-256-GCM数据密钥 + 非对称私钥解密)"] --> B["双进程物理拓扑<br/>(公网API仅持公钥 / 交付Worker持私钥且零出网)"]
    B --> C["高并发防超卖争抢<br/>(Outbox队列 + FOR UPDATE SKIP LOCKED)"]
    C --> D["PostgreSQL 内核级加固<br/>(FORCE RLS行级隔离 + 每角色列权限收敛)"]
    D --> E["复式记账不可篡改账本<br/>(sales_revenue/reseller_payable/触发器平衡校验)"]
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_asymmetric_cardvault_and_isolated_delivery
02_postgresql_rls_and_immutable_ledger
```
