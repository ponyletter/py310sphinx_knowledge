# 数据库内核级加固：PostgreSQL FORCE RLS 与不可篡改复式账本

在软件工程中，**墨菲定律永远有效**：随着业务迭代和 AI 智能体协助编码，开发者（或大模型）终究会在某一条复杂的 SQL 或关联查询中**遗漏 `WHERE tenant_id = :tid` 过滤条件**，从而引发极其严重的跨租户越权（IDOR）事故。

24goods 通过 **PostgreSQL 数据库引擎内核层面的行级安全策略（RLS）** 与 **复式记账触发器**，为资金与多租户数据筑起了坚不可摧的底层防线。

---

## 1. 深度防御：PostgreSQL `FORCE RLS` 强制行级隔离

很多系统即便宣称支持多租户，也仅仅停留在代码层的“约定式过滤”。24goods 采用数据库内核级的 **强制行级安全（FORCE Row-Level Security）**：

### 1.1 RLS 策略定义 (Alembic Migration)
在所有属于多租户维度的业务表（如 `products`, `orders`, `card_stocks`, `users`, `chat_conversations`）上启用 RLS：

```sql
-- 1. 启用并强制执行 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY; -- 核心：即使是表所有者(Table Owner)也强制执行策略！

-- 2. 创建基于会话变量的隔离策略
CREATE POLICY tenant_isolation_policy ON orders
    FOR ALL
    TO app_api, app_delivery
    USING (
        tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    );
```

### 1.2 SQLAlchemy 事务级自动绑定 (`db.py`)
在 Python 异步数据库连接池中，通过连接事件监听器，在事务启动（`after_begin`）的第一时间向 PostgreSQL 发送事务局部配置：

```python
# app/core/db.py
from sqlalchemy import event, text
from sqlalchemy.orm import Session, SessionTransaction
from sqlalchemy.engine import Connection

_SET_TENANT = text("SELECT set_config('app.tenant_id', :tid, true)")

class TenantSession(Session):
    """绑定租户上下文的 SQLAlchemy 增强会话"""

@event.listens_for(TenantSession, "after_begin")
def _pin_tenant(session: Session, _tx: SessionTransaction, connection: Connection) -> None:
    tid = session.info.get("tenant_id")
    if tid is not None:
        # 第三个参数 true 表示事务级局部生效：事务提交或回滚后自动失效，杜绝连接池串流污染
        connection.execute(_SET_TENANT, {"tid": str(tid)})
```

**双重防御效果**：
即便某位初级工程师或 AI 在代码中写出 `select(Order).where(Order.status == 'paid')`，PostgreSQL 也会在物理查询计划中强制拼接 `AND tenant_id = '当前租户ID'`，攻击者绝不可能跨租户读取或篡改数据。

---

## 2. 资金安全基石：不可篡改复式记账账本

电商交易中最可怕的漏洞莫过于“浮点数丢分”、“账目凭空生成”或“退款后商户余额出现负数空洞”。

24goods 在底层建立了类似银行核心系统的**复式记账账本（Double-Entry Bookkeeping Ledger）**：

### 2.1 会计借贷恒等式
系统内部没有任何“修改余额（`balance = balance + 10`）”的直接 UPDATE 操作。每一笔资金流变动，都必须拆解为一组借贷平衡的明细行：

```
支付成功 (¥103.00) 时的复式记账明细：
--------------------------------------------------------------------------------
1. gateway_clearing:zpay      +10300 fen  (资产增加：收银台实际收到网关入账)
2. sales_revenue              -9700 fen   (收入增加：商家的商品净销售额)
3. reseller_payable:store_1   -300 fen    (负债增加：分销商获得的加价佣金)
4. surcharge_revenue          -300 fen    (收入增加：平台收取的3%通道手续费)
--------------------------------------------------------------------------------
SUM(amount_minor) = +10300 - 9700 - 300 - 300 = 0  (严格借贷平衡！)
```

### 2.2 数据库内核触发器强制校验 (`tg_check_ledger_balance`)
为了防止应用层由于复杂的促销优惠券拆分或退款计算缺陷产生不平衡账目，PostgreSQL 配置了事务级约束触发器：

```plpgsql
CREATE OR REPLACE FUNCTION check_ledger_transaction_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_sum BIGINT;
BEGIN
    -- 聚合校验同一个事务批次 (txn_id) 下的所有借贷行总和
    SELECT COALESCE(SUM(amount_minor), 0)
    INTO v_sum
    FROM ledger_entries
    WHERE txn_id = NEW.txn_id;

    IF v_sum <> 0 THEN
        RAISE EXCEPTION 'Ledger transaction is unbalanced! txn_id: %, sum: % fen', NEW.txn_id, v_sum;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_ledger_balance_check
AFTER INSERT OR UPDATE ON ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_ledger_transaction_balance();
```

**安全性收益**：
如果由于某种极端并发或溢出导致生成的流水借贷不平，数据库底层直接抛出异常并**回滚整个订单支付事务**，资金黑洞在物理层被彻底抹杀。
