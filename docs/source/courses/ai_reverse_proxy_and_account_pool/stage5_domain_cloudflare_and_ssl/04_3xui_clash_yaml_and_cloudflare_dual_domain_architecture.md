# 04. 跨境自建节点工程实战：3x-UI 部署、Clash YAML 订阅排障与 Cloudflare 双域名隔离安全架构

在构建海外大模型反代中转池（`cliproxyapi`）或驱动 Claude Code 进行自动化编程时，拥有一个**网络稳定、出口地理固定、控制权完全自主的海外中转节点**是整套系统的基石。

许多开发者在自建海外 VPS 节点时，经常遭遇一系列连环工程暗坑：
1. **订阅解析失败**：在电脑或手机端导入订阅时，Clash 突然弹窗报错：`the remote profile dat is invalid yaml`；
2. **CDN 代理困境**：听说 Cloudflare 橙云代理（小云朵）能防御 DDoS 并隐藏源站 IP，一开启却发现所有代理节点瞬间全部超时断连；
3. **源站裸奔风险**：若关闭小云朵保持直连，黑客只需扫描子域名字段，即可轻而易举获取 VPS 真实公网 IP，进而针对 3x-UI 管理端口发起暴力破解。

本篇基于真实的 VPS 生产环境排障与架构重构经验（严格对公网 IP 与敏感凭据脱敏），详细拆解 **3x-UI 自动化部署、Base64 转原生 Clash YAML 排障、双协议兼容设计**，以及行业级**“Cloudflare 双域名动静分离安全架构”**全套 SOP。

---

## 一、双域名动静分离与高可用网络拓扑图

```mermaid
flowchart TD
    subgraph 客户端多端适配
        ClashClient["用户端 (Clash Verge / Mihomo / 手机端)"]
    end

    subgraph 域名与安全网关分离层
        SubDomain["管理与订阅域名<br/>web3xui.example.com<br/>【开启 Cloudflare 橙云代理】"]
        NodeDomain["节点流量直连域名<br/>xui.example.com<br/>【保持 Cloudflare 灰云 (仅 DNS)】"]
    end

    subgraph 海外 VPS 宿主机 (脱敏 IP: 107.173.xx.xx)
        CaddyProxy["Caddy 反向代理网关<br/>(自动申请 Let's Encrypt TLS 证书)"]
        PanelBackend["3x-UI 管理后台 / 订阅 API<br/>(本地环回或内部端口: 2053)"]
        XrayCore["Xray 核心转发引擎"]
        
        VlessNode["VLESS + XHTTP 节点<br/>(端口: 29648/TCP, 极速现代协议)"]
        VmessNode["VMess + TCP 节点<br/>(端口: 5001/TCP, 全平台旧内核兼容)"]
    end

    ClashClient -->|1. 获取 Clash YAML 订阅| SubDomain
    SubDomain -->|Cloudflare CDN 隐藏源站| CaddyProxy
    CaddyProxy --> PanelBackend
    
    ClashClient -->|2. 发送业务代理解密流量| NodeDomain
    NodeDomain -->|公网 IP 直连| XrayCore
    XrayCore --> VlessNode & VmessNode
    
    CaddyProxy -.->|安全收尾：443 路径阻断来自 xui 的面板访问| Block["404 / 403 拒绝直连"]
```

---

## 二、第一阶段：VPS 连通性排障与 SSH 密钥免密配置

在拿到一台全新分配的海外 VPS（如美区机房机器，此处以脱敏 IP `107.173.xx.xx` 为例）时，第一步是打通安全、低延迟的运维通道。

### 1. 连通性测试与端口探测
使用终端测试目标机器的 SSH 连通性：
```bash
# 测试目标 VPS 端口是否开放（脱敏 IP）
ssh -v root@107.173.xx.xx -p 22
```
* **排障要点**：
  * 若直接报错 `Connection timed out`，首先检查 VPS 服务商后台（如 RackNerd、BandwagonHost、DigitalOcean）的安全组/防火墙策略是否放行了 22 端口；
  * 若提示 `Permission denied (publickey,password)`，确认后台重置的初始密码是否生效，注意转义密码中的特殊字符（如 `%`、`$`）。

### 2. 部署 Ed25519 现代 SSH 密钥（免密运维）
为了防止公网 22 端口被全网爬虫暴力扫破，建立基于现代椭圆曲线的高强密钥对：
```bash
# 本地生成高强度 ed25519 密钥
ssh-keygen -t ed25519 -C "admin@example.com"

# 一键推送公钥至目标服务器
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@107.173.xx.xx

# 验证免密直连
ssh root@107.173.xx.xx
```

---

## 三、第二阶段：3x-UI 部署与 Caddy TLS 自动化网关

3x-UI 是当前社区最推崇的多协议代理管理平台之一（支持 Xray 核心、VLESS、VMess、Trojan、Shadowsocks 等协议可视化编排）。

### 1. 自动化部署 3x-UI
登录宿主机后，执行官方或开源自动化脚手架安装：
```bash
# 执行 3x-UI 安装命令
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```
安装过程中设置管理端口（如 `2053`）以及自定义后台初始账号密码。

### 2. Caddy 反向代理网关配置（解决 404 困境）
直接在公网通过 `http://107.173.xx.xx:2053` 访问管理后台不仅极易被运营商识别，而且密码明文传输。业界标准做法是使用 **Caddy** 提供全自动 HTTPS 证书申请与反代。

在实际调试中，很多开发者最常踩的坑是：**浏览器访问 `https://xui.example.com` 出现 404**。
* **原因剖析**：3x-UI 出于安全防御机制，默认配置了**随机 URL Base Path（URL 根路径前缀）**，例如 `/1c9541b86f5b/`。如果 Caddy 没有透传完整路径或直接访问根路径，服务端就会安全拒绝返回 404；
* **Caddyfile 标准配置模板**：
```caddy
# 管理与订阅专用域名（由 Cloudflare 代理）
web3xui.example.com {
    encode gzip zstd
    
    # 将流量反代至本机 3x-UI 监听的 2053 端口
    reverse_proxy 127.0.0.1:2053 {
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```
重载 Caddy 即可实现免手动续签的自动化 HTTPS 加密：
```bash
systemctl reload caddy
```

---

## 四、第三阶段：绝杀 Clash `invalid yaml` 报错与双协议输出

将 3x-UI 的订阅链接导入客户端时，Clash 或 Clash Verge 经常弹窗警告：
```text
The remote profile dat is invalid yaml
```

### 1. 报错底层机理揭秘
* **数据格式不匹配**：传统 3x-UI 默认生成的 `/sub/...` 订阅接口返回的是 **单行 Base64 编码字符串**（解码后为 `vmess://...` 或 `vless://...` 纯文本列表）。该格式专为 v2rayN、Shadowrocket 设计；
* **Clash 严格校验规则**：Clash / Mihomo 客户端原生只接收合法的 **YAML 配置文件格式**（必须包含 `proxies:`、`proxy-groups:`、`rules:` 等顶层键树）。强行将 Base64 数据当作 YAML 解析，解析器就会直接报语法崩溃。

### 2. 解决方案：3x-UI 原生直出 Clash / Mihomo YAML
无需依赖容易泄露隐私的第三方在线“订阅转换工具”，在 3x-UI 进阶设置中，配置订阅输出模板，使其原生支持以下两种订阅路径：
1. **现代内核订阅**：`/mihomo/{token}` $\rightarrow$ 专为 Mihomo 内核输出，支持现代 VLESS / XHTTP 协议；
2. **兼容内核订阅**：`/clash-legacy/{token}` $\rightarrow$ 专为旧版 Clash 内核输出，兼容标准 VMess / TCP 协议。

### 3. 双协议入站编排（兼容全平台设备）
为了保证无论是使用最新版 Mihomo 的 Windows 开发机，还是使用旧版 Clash 的移动设备都能免升级即用，在 3x-UI 后台编排两个互补的入站节点：

| 节点类型 | 协议与传输层 | 服务端口 | 适用客户端与优势 |
| :--- | :--- | :--- | :--- |
| **主打主力节点** | **VLESS + XHTTP** | `29648/TCP` | **现代高性能首选**。底层基于 HTTP/3 与分块流，穿透能力极强，流式吐字延迟极低，适配最新版 Mihomo。 |
| **兜底兼容节点** | **VMess + TCP** | `5001/TCP` | **全平台免升级兜底**。适配所有历史版本 Clash、软路由固件及低版本客户端，永不报协议缺失。 |

* **宿主机防火墙端口放行**：
```bash
# 放行节点端口与常用协议范围
ufw allow 5000:6000/tcp
ufw allow 29648/tcp
ufw reload
```

---

## 五、第四阶段：Cloudflare 橙云灰云深度权衡与双域名隔离安全架构

在节点部署完成后，很多开发者面临一个极其纠结的安全抉择：**“Cloudflare 的小云朵（代理）到底要不要开？”**

### 1. 为什么不能直接开启 Cloudflare 橙云代理？
很多新手将解析到节点的域名（如 `xui.example.com`）直接开启橙云代理，结果所有节点全部暴毙。

```{admonition} 官方 Cloudflare 代理机制真相
:class: warning
**Cloudflare 免费版仅代理固定的标准 HTTP/HTTPS 端口！**  
HTTP 端口：`80, 8080, 8880, 2052, 2082, 2086, 2095`  
HTTPS 端口：`443, 2053, 2083, 2087, 2096, 8443`  
我们节点运行的 `5001`、`29648` 等端口根本不在 Cloudflare CDN 的支持列表中！流量经过 Cloudflare 边缘节点时会直接被丢弃（报 521/522 错误）。
```

### 2. 业界最佳实践：双域名分离架构（Dual-Domain Architecture）

为了兼顾 **“管理后台绝对安全（防扫防打）”** 与 **“节点流量正常直连穿透”**，推荐采用**双域名物理分离方案**：

| 规划域名 | 角色分工 | Cloudflare 云朵状态 | 承载业务与安全防御机制 |
| :--- | :--- | :---: | :--- |
| **域名 A**<br>`web3xui.example.com` | **管理后台与订阅中枢** | **【开启橙云】**<br>（Proxied） | 1. 仅监听 443 标准 HTTPS 端口；<br>2. 所有请求经由 Cloudflare 全球 CDN 与 WAF 转发至 Caddy；<br>3. **彻底隐藏 VPS 真实源站 IP**，阻断自动化探测；<br>4. 在 Cloudflare 设置防火墙规则，限制国家/地区访问。 |
| **域名 B**<br>`xui.example.com` | **节点数据物理通道** | **【保持灰云】**<br>（DNS Only） | 1. 仅作为节点连接时的物理 IP 动态映射；<br>2. 承载 `5001`（VMess）、`29648`（VLESS）等非标端口业务流量；<br>3. 保证原生 TCP/UDP 数据包低延迟直通 VPS 宿主机。 |

### 3. 关键安全闭环：切断灰云 443 绕过通道
许多团队配置了双域名，却遗漏了最关键的一步：**灰云域名 `xui.example.com` 的 443 端口依然可以直通 Caddy 打开后台！** 这导致攻击者可以通过直接探测灰云 IP，轻易绕过 `web3xui` 上的 Cloudflare 防火墙。

* **加固方案（Caddyfile 路径阻断）**：
```caddy
# 灰云节点域名：直接拒绝所有 Web 入口访问
xui.example.com {
    respond "Not Found" 404
}

# 橙云安全域名：唯一合法的管理与订阅入口
web3xui.example.com {
    encode gzip zstd
    reverse_proxy 127.0.0.1:2053
}
```
经过此加固，黑客即使通过灰云嗅探到了源站 IP，向 443 发送任何 HTTP 请求也只会收到 404 拒绝应答，后台管理入口得到真正物理隔离。

---

## 六、第五阶段：自动化验证与匿名安全分发

完成配置后，在服务器本地执行端到端链路自检：

### 1. 验证订阅 YAML 响应与协议完整性
```bash
# 1. 验证订阅接口返回合法 HTTP 200 与 YAML 结构
curl -sI https://web3xui.example.com/clash-legacy/<YOUR_TOKEN> | grep "HTTP/2 200"

# 2. 验证本地非标端口公网可达性（脱敏 IP）
nc -zv 107.173.xx.xx 5001
nc -zv 107.173.xx.xx 29648
```

### 2. 匿名群聊 API 自动化推送（可选运维集成）
在工程号池团队中，为避免运维账号与团队个人身份直接关联，常通过无状态 API 将更新的节点订阅与二维码推送到内部匿名聊天频道（如自建的聊天室 `https://chat.example.com/group-chat`）：

```bash
# 使用 cURL 调用匿名群聊接口推送订阅与变更通知
curl -X POST https://chat.example.com/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "group-chat",
    "title": "海外中转节点配置更新通知",
    "content": "双域名架构已就绪：\n- 订阅入口: https://web3xui.example.com/clash-legacy/token\n- 节点域名: xui.example.com (灰云直连)\n- 已集成 VMess(5001) 与 VLESS(29648) 双协议",
    "timestamp": 1790421600
  }'
```

---

## 七、全套部署验收 Checklist

- [ ] **1. SSH 运维通道**：已配置 Ed25519 密钥免密登录，已禁用高风险密码登录；
- [ ] **2. 3x-UI 与 Caddy**：后台已配置 URL Base Path，Caddyfile 正确反代至 2053，无裸露明文端口；
- [ ] **3. Clash YAML 校验**：直接请求订阅地址，返回体为有效 YAML，客户端导入不再报 `invalid yaml`；
- [ ] **4. 双协议覆盖**：VMess/TCP（5001）与 VLESS/XHTTP（29648）端口均已放行且公网连通；
- [ ] **5. 双域名安全隔离**：
  - `web3xui` 开启 Cloudflare 橙云代理（隐藏源站 IP）；
  - `xui` 保持 Cloudflare 灰云解析（仅用于节点数据传输）；
  - 灰云域名的 443 访问已被 Caddy 阻断（返回 404）；
- [ ] **6. 敏感信息脱敏**：文档与脚本中严禁留存 VPS 真实公网 IP 与根管理员明文凭据。
