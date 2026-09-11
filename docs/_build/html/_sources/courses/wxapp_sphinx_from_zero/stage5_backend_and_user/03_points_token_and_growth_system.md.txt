# 研学成长体系、积分资产与兑换码裂变闭环

知识付费系统如果只是一手交钱一手交货的“货架电商”，用户往往复购率极低、毫无社区粘性。通过设计一套**“研学币 + 积分 + 签到打卡 + 裂变路线图 + 福利兑换码”**的虚拟资产成长体系，能够让产品兼具可玩性、日活留存与裂变自增长能力。

---

## 1. 虚拟资产中台数据库表结构设计

在 SQLite 数据库中，我们设计了轻量但严谨的数据模型：

```sql
-- 1. 用户核心资产表
CREATE TABLE IF NOT EXISTS users (
    openid TEXT PRIMARY KEY,
    nickname TEXT DEFAULT '微信用户',
    avatar_url TEXT DEFAULT '',
    balance REAL DEFAULT 0.0,             -- 研学币 (核心硬通货，可直接解锁专栏)
    score INTEGER DEFAULT 0,              -- 积分 (通过打卡、做任务获得，可按汇率换币)
    download_tickets INTEGER DEFAULT 0,   -- 源码与算力券 (提取高价值项目代码)
    invite_code TEXT UNIQUE,              -- 专属邀请码
    invited_by TEXT DEFAULT '',           -- 上级邀请人 openid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 每日签到记录表 (排重防刷)
CREATE TABLE IF NOT EXISTS checkin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT NOT NULL,
    checkin_date TEXT NOT NULL,           -- 格式 YYYY-MM-DD
    reward_score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(openid, checkin_date)          -- 数据库级唯一索引，从物理上杜绝重复签到！
);

-- 3. 资产流水日志表 (确保每一笔进出都有据可查)
CREATE TABLE IF NOT EXISTS balance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT NOT NULL,
    amount REAL NOT NULL,                 -- 正数为获得，负数为消耗
    reason TEXT NOT NULL,                 -- 来源/用途说明
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. 每日签到领分与积分换币算法

### 2.1 每日签到逻辑
签到是提升 DAU（日活跃用户）的杀手级功能。在 `backend/app/database.py` 中：
- 用户每天首次点击【签到领分】，赠送 **10 积分**；
- 利用 SQLite `INSERT INTO checkin_logs ... ON CONFLICT DO NOTHING`，借助数据库行级排他锁，彻底防止用户利用并发脚本在同一天内多次刷取积分。

### 2.2 积分兑换研学币模型
设定兑换汇率：**10 积分 = 1 研学币**。
- 用户只要坚持签到 20 天（获得 200 积分），就能无门槛兑换 20 研学币，**免费解锁价值 19.9 元的完整技术专栏**！
- 这种机制让没有经济收入的学生和新手也能通过“时间与专注”获得知识，形成极具口碑的自传播效应。

---

## 3. 邀请裂变阶梯路线图

在个人中心设计的“邀请好友 · 领奖路线图”是低成本冷启动的核心利器：

```text
邀请好友裂变里程碑：
├── 节点 1 : 成功邀请 1 人 ➔ 赠送 5 研学币 (立即体验付费章节)
├── 节点 2 : 累计邀请 3 人 ➔ 赠送 15 研学币 + 2次源码算力券
└── 节点 3 : 累计邀请 5 人 ➔ 【终极大奖】直接免费开通 1 年全专栏 VIP 畅读！
```

### 3.1 口令追踪与好友归因
- 每个用户在注册时，系统会自动生成一个 6 位唯一的 `invite_code`；
- 当新用户通过好友分享的卡片或口令进入小程序时，后端在 `users` 表的 `invited_by` 字段建立绑定关系；
- 当新用户完成首次阅读时，自动激活邀请人的阶梯进度，并下发对应的研学币与 VIP 权益。

---

## 4. 福利兑换码系统设计与防刷机制

福利兑换码既是运营做活动的利器，也是**审核期间为审核员预置测试福利的秘密武器**。

```python
def redeem_coupon(openid: str, code: str) -> dict:
    """核销福利兑换码"""
    code = code.strip().upper()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, type, reward_val, max_uses, used_count FROM coupons WHERE code = ?", (code,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=400, detail="兑换码不存在或已失效")
            
        c_id, c_type, reward_val, max_uses, used_count = row
        if used_count >= max_uses:
            raise HTTPException(status_code=400, detail="该兑换码已被领完")
            
        # 检查该用户是否已经兑换过该优惠码
        cursor.execute("SELECT id FROM user_coupons WHERE openid = ? AND coupon_id = ?", (openid, c_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="您已经使用过该兑换码，不可重复兑换")
            
        # 原子性扣减名额并派发资产
        cursor.execute("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", (c_id,))
        cursor.execute("INSERT INTO user_coupons (openid, coupon_id) VALUES (?, ?)", (openid, c_id))
        
        if c_type == "points": # 赠送研学币
            cursor.execute("UPDATE users SET balance = balance + ? WHERE openid = ?", (reward_val, openid))
            cursor.execute("INSERT INTO balance_logs (openid, amount, reason) VALUES (?, ?, ?)", 
                           (openid, reward_val, f"兑换码福利: {code}"))
        conn.commit()
    return {"msg": f"成功兑换 {reward_val} 研学币！"}
```

---

## 5. 本章小结

一个将“免费白嫖”与“商业付费”平滑过渡的虚拟资产系统，能够大幅降低用户的防备心理。通过研学币柔化现金交易，配合签到打卡、积分兑换与阶梯裂变，让系统具备了自我造血与自传播的商业生命力。下一阶段，我们将进入小程序原生前端与四大实战踩坑实录。
