# 阶段五：跨境网络互联与网关：SSH 加密隧道 vs HTTPS/Cloudflare

欢迎进入《阶段五：跨境网络互联与网关：SSH 加密隧道 vs HTTPS/Cloudflare》。

在大模型反代服务与国内业务端互联的工程实践中，网络管道的选择直接决定了系统的抗干扰能力、首字流式延迟与长期维护成本：

- **方案 A：纯加密 SSH 隧道（业界最推荐 ★★★★★）**：免域名、免国内备案、免证书维护，内网环回端口闭环（防公网端口扫描），无中间层缓冲，原生杜绝长文本推流中断；
- **方案 B：公网 HTTPS + Cloudflare 域名网关**：适用于对外直接面向公网客户端（Web 前端、移动端 App）提供标准化 API 的场景，需精细权衡 Cloudflare 灰云与橙云（规避免费版 100 秒超时），并配置 ACME.sh 自动化 ECC 证书；
- **方案 C：跨境自建跳板节点与 Cloudflare 双域名隔离**：自建 3x-UI 代理中枢，解决 Clash YAML 订阅兼容报错，并采用“橙云面板/订阅（防扫隐匿）+ 灰云节点（非标直连）”的终极安全物理分离架构。

本阶段系统讲解跨境网络管道的工程实现，并交付专为打字机流式推流（`proxy_buffering off`）与多模态大图上传调优的生产级 Nginx 与 Caddy 配置。

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_cloudflare_dns_and_subdomain
02_ssl_tls_certificates_automation
03_nginx_reverse_proxy_production
04_3xui_clash_yaml_and_cloudflare_dual_domain_architecture
```

