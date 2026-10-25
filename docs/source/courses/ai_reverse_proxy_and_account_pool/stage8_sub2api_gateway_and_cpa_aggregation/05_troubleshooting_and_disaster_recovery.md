# 8.5 故障排错全景剖析与自动化容灾备份

在大模型中转网关的日常运维与初始部署中，面对复杂的鉴权流水线、跨云网络往返以及不可预测的异常状态码，建立一套“从日志快速反推根因”的排错机制和“周期性全量冷备份”容灾方案是保障高可用的终极底线。

本节汇总了 Sub2API 生产实战中最隐蔽的深水区故障案例，并提供配套的自动化冷备份脚本与日常巡检命令集。

---

## 生产级高频故障与隐蔽拦截深度排错

### 1. 深度案例：首次登录后台大面积报 HTTP 423 Locked
* **现象表现**：
  管理员通过一次性初始密码成功登录系统后，点击左侧菜单（如分组管理、系统设置、更新检测等），控制台突然弹出红色报错，网络面板（F12）显示大量请求被拒绝，状态码为罕见的 **`423 Locked`**：
  ```log
  423 GET /api/v1/admin/settings
  423 GET /api/v1/admin/payment/config
  423 GET /api/v1/admin/system/check-updates
  423 GET /api/v1/admin/groups/live-capability
  ```
* **底层根因**：
  查阅 `internal/server/middleware/admin_compliance.go` 源码，Sub2API 部署有一道内置法律合规门控 `AdminComplianceGuard`。
  当系统刚刚部署完成时，管理员数据库记录尚未完成合规签署（`IsAdminComplianceAcknowledged` 返回 false）。此时，除了 `/api/v1/admin/compliance` 本身以外的所有管理员接口都会被物理截断并抛出 `423`：
  ```json
  {
    "code": "ADMIN_COMPLIANCE_ACK_REQUIRED",
    "message": "administrator compliance acknowledgement is required"
  }
  ```
* **解决与排查指引**：
  * **正常解除**：前端检测到该状态码后会派发自定义事件 `admin-compliance-required` 并弹出一份《管理员合规使用协议》，管理员只需点击“同意签署”，系统调用签署接口后，423 拦截将永久解除；
  * **前端被广告插件拦截未弹窗时的备选应急方案**：
    在浏览器直接发起确认请求或通过 curl 携带管理员 Token 显式调用：
    ```bash
    curl -X POST https://flux.kesiv.com/api/v1/admin/compliance/acknowledge \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
    ```

---

### 2. 深度案例：敏感操作触发 HTTP 403 Forbidden（Step-up Auth）
* **现象表现**：
  常规修改系统名称、设置模型价格一切正常，但只要管理员尝试执行以下操作之一：
  1. 重置或删除系统 Admin API Key；
  2. 导出账号凭据池或代理池数据；
  3. 修改 S3 备份存储桶密钥；
  4. 开启“敏感操作二次验证”安全开关；
  页面立即弹窗提示拒绝，后台返回 **`403 Forbidden`**。
* **底层根因**：
  查阅 `internal/server/middleware/step_up.go` 源码，系统为防止“攻击者在截获管理员 Cookie/Token 后瞬间窃取所有核心号池资产并销毁证据”，对敏感路由设置了 **提升权限验证（Step-up Auth）**：
  ```go
  if !user.TotpEnabled {
      AbortWithError(c, 403, "STEP_UP_TOTP_NOT_ENABLED",
          "This operation requires two-factor authentication; please enable TOTP first")
      return false
  }
  ```
  如果当前操作的管理员账号**未在个人中心绑定 Authenticator 两步验证（TOTP 2FA）**，为了防止开启安全防线后管理员将自己“反锁”在系统外，系统会强行返回 403 阻断！
* **解决与排查指引**：
  在后台右上角点击管理员头像 -> **个人中心** -> **安全设置** -> 扫描二维码绑定 2FA TOTP。绑定后，再次点击高危操作时，系统会优雅弹出 6 位动态验证码确认窗口，输入后即可正常放行。

---

### 3. 深度案例：Cloudflare WAF 边缘静默拦截（客户端感知 403）
* **现象表现**：
  在系统设置中尝试保存带有特殊字符、反斜杠、HTML/JS 代码段（例如自定义网站统计代码、复杂的邮件 HTML 模板）时，点击保存直接跳出 403 Forbidden，但在 VPS 上的 Caddy 日志和 Sub2API 日志中**完全找不到任何请求记录**！
* **底层根因**：
  开启 Cloudflare CDN（黄色小云朵）后，流量在抵达 VPS 之前必须穿透 Cloudflare 的边缘托管规则集（Managed Ruleset）。Cloudflare 的 WAF 防火墙误将上传的 HTML 代码段识别为 XSS 或 SQL 注入攻击，在边缘直接拦截并返回了 Cloudflare 风格的 403 Forbidden / Error 1020 页面。
* **解决与排查指引**：
  登录 Cloudflare 控制台 -> **安全性 (Security)** -> **WAF** -> **自定义规则 (Custom Rules)**，创建一条白名单规则：
  ```text
  (http.host eq "flux.kesiv.com" and starts_with(http.request.uri.path, "/api/v1/admin/"))
  操作：跳过 (Skip) -> 勾选所有托管规则集
  ```

---

## 生产级定时全量备份与容灾脚本

由于我们将数据库解耦部署在独立服务器（`139.199.223.40`），为了防止机房突发灾难、误删库或勒索病毒风险，必须建立本地与远端的自动化增量导出冷备份。

### 1. 编写备份脚本：`/root/backup_sub2api.sh`
创建脚本文件并赋予仅 root 可读写权限：
```bash
cat << 'EOF' > /root/backup_sub2api.sh
#!/bin/bash
# =============================================================================
# Sub2API PostgreSQL Automated Daily Backup Script
# =============================================================================
set -e

BACKUP_DIR="/root/db_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sub2api_${DATE}.sql.gz"

# 数据库连接参数 (与 .env 严格对齐)
DB_HOST="139.199.223.40"
DB_PORT="5432"
DB_USER="root"
DB_PASS="rootsugar"
DB_NAME="sub2api"

mkdir -p "$BACKUP_DIR"

# 使用宿主机已就绪的 postgres:18-alpine 镜像执行无依赖流式导出并 gzip 压缩
docker run --rm \
  -e PGPASSWORD="${DB_PASS}" \
  postgres:18-alpine \
  pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists \
  | gzip > "${BACKUP_FILE}"

# 打印备份日志
SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 数据库成功备份至: ${BACKUP_FILE} (文件大小: ${SIZE})"

# 自动清理轮转：删除 7 天以前的陈旧归档
find "${BACKUP_DIR}" -type f -name "sub2api_*.sql.gz" -mtime +7 -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 历史备份轮转清理完成。"
EOF

chmod 700 /root/backup_sub2api.sh
```

### 2. 配置 Linux Crontab 定时作业
设置每天凌晨 03:00 业务低峰期自动执行备份：
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup_sub2api.sh >> /var/log/sub2api_backup.log 2>&1") | crontab -
```

### 3. 一键快速还原验证命令
当发生极端灾难需要回滚数据时：
```bash
gunzip -c /root/db_backups/sub2api_20261025_xxxxxx.sql.gz | \
  docker run -i --rm -e PGPASSWORD=rootsugar postgres:18-alpine \
  psql -h 139.199.223.40 -p 5432 -U root -d sub2api
```

---

## 生产环境一键日常巡检指令清单

为方便后续日常运维与状态诊断，将核心巡检指令归纳如下：

```bash
# 1. 检查 Sub2API 容器存活与运行资源
docker ps --filter "name=sub2api"
docker stats sub2api --no-stream

# 2. 检查反向代理 Caddy 运行状态与端口
systemctl status caddy
ss -tulpn | grep -E ':80|:443|:8080'

# 3. 校验 SSL 证书有效期（剩余天数）
openssl x509 -in /etc/ssl/flux.kesiv.com/cert.pem -noout -enddate

# 4. 远程测试数据库与 Redis 连通健康度
docker run --rm -e PGPASSWORD=rootsugar postgres:18-alpine \
  psql -h 139.199.223.40 -U root -d sub2api -c "SELECT current_database(), now();"
nc -zv -w 3 139.199.223.40 6379

# 5. 查看实时 API 访问日志与异常状态码
tail -f /root/02project/13sub2api/data/logs/sub2api.log | grep --line-buffered '"status_code":'
```
