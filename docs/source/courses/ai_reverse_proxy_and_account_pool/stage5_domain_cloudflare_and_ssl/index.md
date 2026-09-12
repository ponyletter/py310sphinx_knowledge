# 阶段五：域名、Cloudflare 与 SSL 全链路加密

欢迎进入《阶段五：域名、Cloudflare 与 SSL 全链路加密》。

在微信小程序生态、移动端 App 及现代 Web 开发中，所有与大模型反代通信的流量**必须严格采用安全加密的 HTTPS 协议（TLS 1.2+）**。此外，裸用 VPS IP 对外提供服务极易被直接探测并遭到源站攻击。

本阶段将系统讲解如何利用 Cloudflare 进行二级域名 DNS 解析与全球边缘防护，剖析灰云（仅 DNS）与橙云（开启 CDN 代理）在长连接/流式响应（SSE）场景下的核心取舍，并传授 15 年长期 Origin CA 证书与 ACME.sh ECC 自动化证书申请，最后交付**支持大模型打字机流式输出（`proxy_buffering off`）与大文件上传的生产级 Nginx 配置模板**。

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_cloudflare_dns_and_subdomain
02_ssl_tls_certificates_automation
03_nginx_reverse_proxy_production
```
