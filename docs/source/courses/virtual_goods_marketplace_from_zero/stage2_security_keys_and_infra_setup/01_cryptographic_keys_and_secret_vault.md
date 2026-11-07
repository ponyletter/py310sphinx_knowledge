# 全生命周期密钥规划与环境隔离体系

在安全优先架构中，**“凭据最小化暴露”（Least Privilege per Process）是防御横向渗透的核心法则**。24goods 绝不在开发或生产中使用单一、全局共享的 `.env` 文件，而是为每个容器规划专属的密钥配额。

---

## 1. 生产级密码学密钥矩阵清单

系统在启动前，必须通过密码学真随机数生成器（CSPRNG）就绪以下六大独立密钥：

| 密钥标识 | 算法与规范 | 最小熵要求 | 持有者与作用域 | 安全敏感度与泄密后果 |
| :--- | :--- | :--- | :--- | :--- |
| **`APP_SETTINGS_KEY`** | AES-256-GCM (32 bytes base64) | 256 位 | 仅 `api` 进程持有 | 极高。用于加密存储租户敏感配置（如商户支付网关密钥、第三方 API Token 等），密文存入数据库。 |
| **`CARDVAULT_PUBLIC_KEY`** | X25519 或 RSA-OAEP 公钥 (PEM) | 256 位 / 4096 位 | `api` 进程持有 | 中。仅用于买家下单或后台录入卡密时的**加密封存**，持有公钥无法执行解密。 |
| **`CARDVAULT_PRIVATE_KEY`**| X25519 或 RSA-OAEP 私钥 (PEM) | 256 位 / 4096 位 | **严格限制仅 `delivery` 进程持有** | **全系统最高机密**。用于卡密最终解密。若泄密将导致库存明文全部失守。 |
| **`QUOTE_SECRET_KEY`** | HMAC-SHA256 (32 bytes hex) | 256 位 | `api` 进程持有 | 高。用于对客服发起的所有议价报价卡片进行防篡改数字签名，防止买家抓包篡改折扣。 |
| **`LOOKUP_SECRET_KEY`** | HMAC-SHA256 (32 bytes hex) | 256 位 | `api` 进程持有 | 高。用于将买家匿名查单的一次性访问凭证（Access Code）进行单向散列加盐存储。 |
| **`JWT_SECRET_KEY`** | HMAC-SHA256 (32 bytes base64) | 256 位 | `api` 进程持有 | 高。用于买家和管理端会话 Session 的签名鉴权。 |

---

## 2. 容器环境变量的物理隔离结构

在 `deploy/env/` 目录下，我们为各个微服务容器定制了互不连通的环境配置：

```
deploy/
├── docker-compose.yml       # 编排定义，每个服务严格挂载自己所属的 env_file
├── bootstrap.sh             # 一键自动化生产密钥派生脚本
└── env/
    ├── api.env              # 仅包含 API 所需：DB连接(app_api)、Redis(app_api)、公钥、JWT、SettingsKey
    ├── delivery.env         # 仅包含 Delivery 所需：DB连接(app_delivery)、Redis(app_delivery)、金库私钥
    ├── mockusdt.env         # 开发测试专用的模拟器配置 (生产环境不挂载)
    ├── postgres.env         # 数据库初始化超级账号与库名
    └── redis.env            # Redis 基础 ACL 认证配置
```

### 数据库角色权限收敛（Column Grants & Roles）
通过 PostgreSQL 的原生角色机制实现权限降级：
- **`app_api` 角色**：
  - 对商品表、订单表具备常规读写权限；
  - 对卡密库存表（`card_stocks`），**严禁赋予解密私钥表或高级管理表的访问权**；
- **`app_delivery` 角色**：
  - 仅拥有处理出库交付所需的最小表权限；
  - 通过 `FOR UPDATE SKIP LOCKED` 读取排队任务，更新已交付卡密状态。

---

## 3. 自动化生产密钥生成实战 (`bootstrap.sh`)

杜绝任何人工手动敲击密码的行为。在全新的宿主机上，我们通过自动化脚本一键生成所有高熵密钥并配置权限：

```bash
#!/usr/bin/env bash
# deploy/bootstrap.sh — 自动初始化密钥与隔离环境
set -euo pipefail

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/env"
mkdir -p "$ENV_DIR"

gen_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

# 1. 生成数据库与 Redis 密码
DB_APP_PASS="$(gen_secret)"
DB_DELIVERY_PASS="$(gen_secret)"
REDIS_API_PASS="$(gen_secret)"
REDIS_DELIVERY_PASS="$(gen_secret)"

# 2. 生成业务主密钥
SETTINGS_KEY="$(gen_secret)"
JWT_KEY="$(gen_secret)"
QUOTE_KEY="$(gen_secret)"
LOOKUP_KEY="$(gen_secret)"

# 3. 生成非对称卡密金库密钥对 (Ed25519 / RSA)
KEY_DIR="$ENV_DIR/keys"
mkdir -p "$KEY_DIR"
chmod 700 "$KEY_DIR"

if [ ! -f "$KEY_DIR/cardvault_private.pem" ]; then
  openssl genpkey -algorithm RSA -out "$KEY_DIR/cardvault_private.pem" -pkeyopt rsa_keygen_bits:4096
  openssl rsa -pubout -in "$KEY_DIR/cardvault_private.pem" -out "$KEY_DIR/cardvault_public.pem"
  chmod 600 "$KEY_DIR/cardvault_private.pem"
  chmod 644 "$KEY_DIR/cardvault_public.pem"
fi

# 4. 组装 api.env
cat <<EOF > "$ENV_DIR/api.env"
DATABASE_URL=postgresql+asyncpg://app_api:${DB_APP_PASS}@postgres:5432/goods24
REDIS_URL=redis://app_api:${REDIS_API_PASS}@redis:6379/0
APP_SETTINGS_KEY=${SETTINGS_KEY}
JWT_SECRET_KEY=${JWT_KEY}
QUOTE_SECRET_KEY=${QUOTE_KEY}
LOOKUP_SECRET_KEY=${LOOKUP_KEY}
CARDVAULT_PUBLIC_KEY_PATH=/run/secrets/cardvault_public.pem
EOF

# 5. 组装 delivery.env (仅交付服务读取私钥)
cat <<EOF > "$ENV_DIR/delivery.env"
DATABASE_URL=postgresql+asyncpg://app_delivery:${DB_DELIVERY_PASS}@postgres:5432/goods24
REDIS_URL=redis://app_delivery:${REDIS_DELIVERY_PASS}@redis:6379/1
CARDVAULT_PRIVATE_KEY_PATH=/run/secrets/cardvault_private.pem
EOF

chmod 600 "$ENV_DIR"/*.env
echo "[✓] 所有生产密钥已成功初始化，文件权限已收敛为 600！"
```
