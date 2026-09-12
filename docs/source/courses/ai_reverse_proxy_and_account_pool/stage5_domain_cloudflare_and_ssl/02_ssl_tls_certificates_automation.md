# 5.2 SSL/TLS 证书申请与自动化续签

在为 AI 反向代理服务提供公开访问时，传输层安全协议（TLS 1.2 / TLS 1.3）与 HTTPS 是必不可少的基础设施。特别是微信小程序要求所有对外请求的域名必须是经过权威 CA 机构签发合法证书的 HTTPS 接口，且不支持自签名证书或存在安全告警的证书。

针对海外反代服务器，根据**网络拓扑模式（灰云直连 vs 橙云代理）**，主要有两种最优雅、最主流的证书策略：

1. **方案 A：Cloudflare 15 年免费 Origin CA 证书**（适用于开启橙云 CDN 代理的拓扑）
2. **方案 B：ACME.sh + Let's Encrypt 现代 ECC 证书自动化续签**（适用于灰云 DNS 解析或通用生产拓扑）

本节将详细拆解两种方案的实施步骤、自动化脚本与验证排错。

---

## 方案 A：Cloudflare Origin CA 证书（15 年超长有效期）

### 1. 适用场景与运行原理

如果你的域名在 Cloudflare 中开启了**橙云（Proxy 模式）**，用户/小程序客户端与 Cloudflare 边缘节点之间由 Cloudflare 自动签发通用 SSL 证书（由 Google Trust Services 或 Let's Encrypt 签发）。

此时，Cloudflare 边缘节点到你的 VPS 源站（Origin Server）之间的通信仍需加密，否则无法启用最安全的 **Full (Strict) 严格加密模式**。

Cloudflare Origin CA 是 Cloudflare 专门为其生态内的源站服务器签发的数字证书：
- **有效期超长**：支持长达 15 年，一劳永逸，彻底告别每年/每季度的续签烦恼；
- **免端口验证**：直接在后台生成，无需源站开放 80 端口或做 HTTP-01 文件验证；
- **仅限 Cloudflare 回源**：该证书由 Cloudflare 私有 CA 根证书签发，浏览器直接访问该源站 IP 会提示不信任，但只要经过 Cloudflare 橙云转发，外部客户端看到的就是 100% 权威信任的顶级泛域名证书。

```{mermaid}
sequenceDiagram
    autonumber
    actor Client as 微信小程序 / Web / AGY
    participant CF as Cloudflare 边缘节点 (开启橙云)
    participant Nginx as VPS 源站 Nginx
    participant Proxy as CLIProxyAPI (:8317)

    Client->>CF: 1. HTTPS 请求 (CF 边缘权威证书 TLS 1.3)
    Note over CF,Nginx: Full (Strict) 双向严格加密
    CF->>Nginx: 2. 回源 HTTPS 请求 (验证 Origin CA 15 年证书)
    Nginx->>Proxy: 3. 内网反代转交 (http://127.0.0.1:8317)
    Proxy-->>Nginx: 4. 返回流式大模型数据
    Nginx-->>CF: 5. 加密回传
    CF-->>Client: 6. 边缘推流打字机
```

### 2. Origin CA 生成步骤

1. 登录 Cloudflare Dashboard，选择你的域名。
2. 点击左侧导航栏 **SSL/TLS** -> **Origin Server（源服务器）**。
3. 点击 **Create Certificate（创建证书）**。
4. 配置参数：
   - **私钥类型（Private key type）**：推荐选择 **RSA (2048)** 或 **ECDSA**（若兼容性优先选择 RSA 2048；若计算效率优先选择 ECDSA）。
   - **主机名列表（Hostnames）**：默认包含 `yourdomain.com` 和 `*.yourdomain.com`，也可明确写入 `api.yourdomain.com`。
   - **证书有效时长（Certificate Validity）**：选择 **15 years**。
5. 点击 **Create（创建）**。
6. 页面将展示两串密钥文本：
   - **Origin Certificate（证书公钥）**：内容以 `-----BEGIN CERTIFICATE-----` 开头。
   - **Private Key（私钥）**：内容以 `-----BEGIN PRIVATE KEY-----` 开头（**注意：私钥仅展示一次，关闭后无法重新查看**）。

### 3. 源站服务器部署 Origin 证书

在 Ubuntu 服务器上创建统一的 SSL 存储目录，并保存证书文件：

```bash
# 1. 创建规范的 SSL 证书目录
sudo mkdir -p /etc/nginx/ssl
sudo chmod 700 /etc/nginx/ssl

# 2. 保存公钥证书为 /etc/nginx/ssl/cf_origin_api.yourdomain.com.pem
sudo tee /etc/nginx/ssl/cf_origin_api.yourdomain.com.pem << 'EOF'
-----BEGIN CERTIFICATE-----
[粘贴 Cloudflare Dashboard 生成的 Origin Certificate 内容]
-----END CERTIFICATE-----
EOF

# 3. 保存私钥为 /etc/nginx/ssl/cf_origin_api.yourdomain.com.key
sudo tee /etc/nginx/ssl/cf_origin_api.yourdomain.com.key << 'EOF'
-----BEGIN PRIVATE KEY-----
[粘贴 Cloudflare Dashboard 生成的 Private Key 内容]
-----END PRIVATE KEY-----
EOF

# 4. 严控私钥权限（仅 root/nginx 可读）
sudo chmod 600 /etc/nginx/ssl/cf_origin_api.yourdomain.com.key
sudo chmod 644 /etc/nginx/ssl/cf_origin_api.yourdomain.com.pem
```

并在 Cloudflare 的 **SSL/TLS** -> **Overview** 页面中，将加密模式切换为 **Full (strict)**，确保全链路防篡改与中间人攻击防御。

---

## 方案 B：ACME.sh + Let's Encrypt 现代 ECC 证书自动化

### 1. 适用场景与优势

如果你的反代服务需要**灰云直连（仅 DNS，追求绝对的最低延迟与无超时限制的 SSE 推流）**，或者你希望获得一个被全球所有操作系统、浏览器、curl 甚至嵌入式设备直接完全信任的权威公网证书，推荐使用由社区维护的极简脚本利器：`acme.sh`。

**优势特性**：
- **纯 Shell 编写**：不依赖臃肿的 Python 解释器或 Certbot 复杂的守护进程；
- **支持 DNS API 自动化验证**：不需要在 Nginx 中配置 HTTP 验证目录，即使 VPS 80 端口被封锁或防火墙阻断也能正常签发；
- **现代 ECC 椭圆曲线加密（ec-256）**：相比传统 RSA 2048/4096，ECC 密钥更短、握手速度提升 30% 以上，CPU 占用极低，极适合大模型高并发握手；
- **全自动 Cron 续签与 Nginx 软重载**：到期前 30 天静默续签，续签成功后自动执行 `systemctl reload nginx`，业务零感知。

### 2. 安装 acme.sh 脚本

```bash
# 1. 切换至临时目录或用户主目录
cd ~

# 2. 从官方源一键安装（替换成你自己的告警邮箱）
curl https://get.acme.sh | sh -s email=your_ops_email@example.com

# 3. 激活环境变量与别名
source ~/.bashrc

# 4. 验证安装版本
acme.sh --version

# 5. 设置默认 CA 机构为 Let's Encrypt（默认为 ZeroSSL，Let's Encrypt 签发速度更快更稳定）
acme.sh --set-default-ca --server letsencrypt
```

### 3. 配置 Cloudflare DNS API 凭据

为了让 `acme.sh` 能够在 Cloudflare 域名后台自动添加 `_acme-challenge.api.yourdomain.com` 的 TXT 临时记录完成所有权验证，我们需要提供 Cloudflare API Token。

````{admonition} 最佳安全实践：创建专用 API Token，不要使用全局 Global API Key
:class: tip

1. 访问 Cloudflare Dashboard -> 右上角 **My Profile** -> **API Tokens**。
2. 点击 **Create Token** -> 选用模板 **Edit zone DNS**。
3. 权限设置为：`Zone - DNS - Edit`；Zone Resources 选择 `Include - Specific zone - yourdomain.com`。
4. 生成并复制 40 位的 Token。
````

在 Linux 终端中导出临时环境变量（`acme.sh` 在首次签发成功后会将密钥持久化加密保存至 `~/.acme.sh/account.conf` 中，后续 Cron 调度会自动调用）：

```bash
export CF_Token="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CF_Account_ID="yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

*（注：若使用传统全局 API Key，则使用 `export CF_Key="你的GlobalKey"` 与 `export CF_Email="你的CF注册邮箱"`）*

### 4. 签发现代 ECC 泛域名/二级域名证书

执行以下命令开始申请 ECC 256 位证书：

```bash
# 签发单域名或多域名（推荐 ECC 算法 -k ec-256）
acme.sh --issue --dns dns_cf \
  -d api.yourdomain.com \
  -k ec-256 \
  --log /var/log/acme_issue.log
```

**命令执行过程解析**：
1. `acme.sh` 向 Let's Encrypt 提交订单，获得 TXT 校验值；
2. 自动调用 Cloudflare API 在 `yourdomain.com` 添加一条形如 `_acme-challenge.api.yourdomain.com` 的 TXT 记录；
3. 休眠约 20~120 秒等待全球 DNS 解析生效；
4. Let's Encrypt 查询 TXT 记录通过，颁发公钥证书；
5. `acme.sh` 自动调用 Cloudflare API 彻底清理该临时 TXT 记录，保持域名解析区干净。

### 5. 安装证书并绑定 Nginx 自动重载钩子

````{admonition} 切勿直接在 Nginx 配置文件中指向 ~/.acme.sh/ 内部的原始文件！
:class: important

`~/.acme.sh/` 目录为内部工作区，随时可能变动。必须使用官方提供的 `--install-cert` 命令将证书复制到目标系统目录并注册安装钩子（Hooks）：
````

```bash
# 创建统一的证书存放路径
sudo mkdir -p /etc/nginx/ssl/api.yourdomain.com

# 规范化安装证书
acme.sh --install-cert -d api.yourdomain.com --ecc \
  --key-file       /etc/nginx/ssl/api.yourdomain.com/privkey.pem  \
  --fullchain-file /etc/nginx/ssl/api.yourdomain.com/fullchain.pem \
  --reloadcmd     "systemctl reload nginx"
```

**参数说明**：
- `--ecc`：指定操作先前申请的 ECC 证书。
- `--key-file`：私钥目标写入路径。
- `--fullchain-file`：包含中间 CA 与根 CA 的完整链证书（**必须使用 fullchain，若只用 cert 会导致移动端或部分老旧系统提示“证书链不完整”**）。
- `--reloadcmd`：当证书自动续签更新后触发的执行指令，`systemctl reload nginx` 实现毫秒级热加载配置，不中断任何正在进行的客户端长连接。

### 6. 验证定时任务与自动化测试

`acme.sh` 安装时会在 Linux `crontab` 中自动注入每日检查任务：

```bash
# 查看系统的定时调度
crontab -l | grep acme.sh
# 预期输出示例：
# 15 0 * * * "/root/.acme.sh"/acme.sh --cron --home "/root/.acme.sh" > /dev/null
```

我们可以通过手动强制续签命令进行一次完整的干跑（Dry Run）测试，验证 Nginx 自动重载是否正常工作：

```bash
# 强制手动更新并验证 reloadcmd
acme.sh --renew -d api.yourdomain.com --ecc --force
```

---

## 证书部署验证与安全评级测试

部署完成后，在本地或任意外部机器上执行以下测试命令，确认 TLS 握手及证书有效性：

### 1. 使用 OpenSSL 检查证书链与算法

```bash
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com -tlsextdebug
```

**关键检查指标**：
- `Peer signing digest: SHA256`
- `Server public key is 256 bit (ECDSA)` 验证使用了 ECC 加密；
- `Verify return code: 0 (ok)` 验证证书链完整且权威信任。

### 2. 使用 curl 发送头部嗅探

```bash
curl -Iv https://api.yourdomain.com/v1/models
```

观察输出中的 SSL 握手过程：
```text
* ALPN, server accepted to use h2
* Server certificate:
*  subject: CN=api.yourdomain.com
*  start date: Sep 12 12:00:00 2026 GMT
*  expire date: Dec 11 12:00:00 2026 GMT
*  issuer: C=US; O=Let's Encrypt; CN=R3
*  SSL certificate verify ok.
```

至此，高可用、免维护的 SSL/TLS 加密基础设施已全部搭建完毕。下一节我们将打造专为大模型 SSE 流式输出与大图片生成量身定制的高性能生产级 Nginx 配置。
