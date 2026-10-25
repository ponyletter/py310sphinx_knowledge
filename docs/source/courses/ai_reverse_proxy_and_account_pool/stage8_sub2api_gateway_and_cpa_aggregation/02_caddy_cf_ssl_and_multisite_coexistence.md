# 8.2 Caddy 单机多域名共存架构与 Cloudflare Origin CA 实践

在大模型中转网关的实际落地过程中，很多开发者手头的海外 VPS 往往不是“纯净新机”，而是同时运行着科学上网节点、X-UI 面板、个人博客或其他 Web 应用。

本节以实战案例出发，详解在 **80 / 443 端口已被现有 Caddy 服务（用于 X-UI/V2Ray）占用** 的复杂工况下，如何实现零冲突平滑共存，并结合 **Cloudflare 15 年免费 Origin CA 证书** 与 **Caddy 流式零缓冲反代**，构建企业级生产网络通道。

---

## 端口冲突排查与反向代理选型破局

### 1. 端口占用实地探测
在配置域名前，通过 Linux 网络命令对宿主机端口进行探测：
```bash
ss -tulpn | grep -E ':80|:443|:8080'
```
输出显示：
```text
tcp   LISTEN   0   4096   *:80    *:*   users:(("caddy",pid=787,fd=5))
tcp   LISTEN   0   4096   *:443   *:*   users:(("caddy",pid=787,fd=8))
```
检查进程发现，宿主机已运行了由 `systemd` 托管的 Caddy 服务，且 `/etc/caddy/Caddyfile` 中配置了：
```caddy
import /etc/caddy/sites/*.conf
```
正在为 `web3xui.tg-cc755.cn` 等域名提供 X-UI 订阅分发与 WebSocket / gRPC 节点转发。

> [!WARNING]
> **切忌盲目安装 Nginx 覆盖 80/443**：
> 如果此时粗暴执行 `apt install nginx` 并强行启动，Nginx 会因为 `Address already in use` 启动失败；若强行杀死 Caddy 进程，原有的科学上网节点与订阅服务将瞬间全线瘫痪！
> **最优工程解**：直接复用宿主机的 Caddy 服务，在 `/etc/caddy/sites/` 下追加独立站点配置。

### 2. Caddy 相较于 Nginx 在大模型反代中的天然优势
1. **原生支持带下划线的请求头（Underscores in Headers）**：
   Nginx 默认配置下会对所有包含下划线的 Header（如 `x_api_key`）进行静默丢弃，必须手动开启 `underscores_in_headers on;`，否则客户端鉴权会莫名其妙失败；而 Caddy 基于 Go 标准库实现，原生遵循 RFC 规范，完全不会丢弃此类请求头。
2. **极简的高并发流式（SSE）推送支持**：
   Nginx 必须显式声明 `proxy_buffering off;`、`proxy_cache off;`、`chunked_transfer_encoding on;`；Caddy 仅需一行 `flush_interval -1` 即可实现毫秒级打字机流式逐字推送。
3. **原生 HTTP/2 与 HTTP/3 (QUIC) 自动支持**。

---

## Cloudflare 小云朵（CDN Proxy）与 15 年 Origin CA 证书

许多开发者在使用 Cloudflare CDN（开启黄色小云朵）时，试图使用 Let's Encrypt 或 Certbot 自动化申请免费证书，极易遭遇以下惨痛痛点：

* **HTTP-01 验证频繁失败**：Certbot 访问 `http://flux.kesiv.com/.well-known/acme-challenge/...` 时，容易被 Cloudflare 的 WAF 规则、防爬虫质询、自动 HTTPS 301 重定向或边缘缓存拦截，导致证书申请卡死；
* **SSL 重定向循环死循环（301 ERR_TOO_MANY_REDIRECTS）**：当 Cloudflare 开启“Flexible”模式，而源站又开启强制 HTTPS 时，流量在边缘与源站之间陷入无限重定向。

### 生产级最佳实践：Cloudflare Origin CA Certificate
直接在 Cloudflare 控制台签发长达 **15 年有效期** 的源服务器证书：
1. 打开 **Cloudflare 控制台** -> 选择域名（如 `kesiv.com`）-> **SSL/TLS** -> **Origin Server (源服务器)**；
2. 点击 **Create Certificate (创建证书)**：
   * 密钥类型选择 **RSA (2048)**；
   * 主机名列表填写通配符与根域名：`*.kesiv.com` 与 `kesiv.com`；
   * 有效期选择 **15 年**。
3. 生成并下载：
   * **PEM 证书**：包含从 `-----BEGIN CERTIFICATE-----` 到 `-----END CERTIFICATE-----` 的公钥证书链；
   * **私钥**：包含 `-----BEGIN PRIVATE KEY-----` 的私钥文件。
4. 将 Cloudflare SSL/TLS 加密模式设置为 **Full (strict)**，实现端到端的军工级全链路加密。

### 宿主机证书安全落盘与权限加固
在 VPS 上创建专属目录，将证书与私钥写入：
```bash
mkdir -p /etc/ssl/flux.kesiv.com && chmod 700 /etc/ssl/flux.kesiv.com
# 写入证书至 /etc/ssl/flux.kesiv.com/cert.pem
# 写入私钥至 /etc/ssl/flux.kesiv.com/key.pem

# 严格锁定私钥权限，仅 root 可读写
chmod 600 /etc/ssl/flux.kesiv.com/key.pem /etc/ssl/flux.kesiv.com/cert.pem
```

通过 OpenSSL 校验落盘证书的合法性：
```bash
openssl x509 -in /etc/ssl/flux.kesiv.com/cert.pem -noout -subject -dates
```
输出验证通过：
```text
subject=O = "CloudFlare, Inc.", OU = CloudFlare Origin CA, CN = CloudFlare Origin Certificate
notBefore=Oct 25 08:33:00 2026 GMT
notAfter=Oct 21 08:33:00 2041 GMT
```

---

## Caddy 生产级配置文件实战

在 `/etc/caddy/sites/flux.kesiv.com.conf` 中创建完整站点反代配置：

```caddy
flux.kesiv.com {
    # 绑定刚部署的 Cloudflare 15 年 Origin 证书
    tls /etc/ssl/flux.kesiv.com/cert.pem /etc/ssl/flux.kesiv.com/key.pem

    # 严格匹配 Cloudflare 免费版计划的单请求 100MB 上限
    request_body {
        max_size 100MB
    }

    # 反向代理到本地 Sub2API 容器
    reverse_proxy 127.0.0.1:8080 {
        # 请求头透传真实用户 IP（用于后台风控与审计日志精准捕获）
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto https

        # 核心参数：禁用反向代理缓冲，实时刷新大模型 SSE 打字机流
        flush_interval -1

        # 应对长上下文、超长思考推理（如 o1/o3/Claude 3.7 Sonnet Thinking）防超时
        transport http {
            read_timeout 600s
            write_timeout 600s
        }
    }
}
```

### 语法校验与平滑热加载
先测试配置文件语法是否正确：
```bash
/usr/local/bin/caddy validate --config /etc/caddy/Caddyfile
```
确认输出 `Valid configuration` 后，重启 Caddy 生效配置：
```bash
systemctl restart caddy
systemctl status caddy
```

---

## 本地与全网连通性验证套件

### 1. 本地通过 SNI 校验反代闭环
因为 Caddy 基于 TLS Server Name Indication (SNI) 分发虚拟主机，直接 curl 本地 IP 会失败，需要使用 `--resolve` 强行指定解析：
```bash
curl -k -sSL -I --resolve flux.kesiv.com:443:127.0.0.1 https://flux.kesiv.com/
```
预期输出：
```http
HTTP/2 200 
server: Caddy
content-type: text/html; charset=utf-8
x-frame-options: DENY
```

### 2. 公网通过 Cloudflare CDN 链路验证
从任意公网客户端或终端发起请求：
```bash
curl -sSL -I https://flux.kesiv.com/
```
预期输出包含标准的 Cloudflare 边缘特征与内部 Caddy 标识：
```http
HTTP/2 200 
server: cloudflare
cf-ray: a5000077ac5fce9a-LAX
via: 1.1 Caddy
content-type: text/html; charset=utf-8
```
至此，外部访问流量经由 Cloudflare Anycast CDN 节点安全抵达反代 VPS，并无缝转发至 Sub2API 容器。
