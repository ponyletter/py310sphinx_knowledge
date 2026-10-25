# 【实战对话】海外 VPS 节点极速搭建与分流排错实战：3X-UI 运维、BBR 加速、Cloudflare CDN 复活甲拯救被阻断 IP、VLESS-WS-TLS 443 改造、移动优选 IP 与 ACL4SSR Clash 智能分流订阅全景指南

> **沉淀人**：极客探索团队  
> **对话与实战来源**：RackNerd 低成本美西 VPS 部署、3X-UI 面板底层 SQLite 数据库探针运维、国内移动宽带阻断排查、Let's Encrypt 证书自动化签发、Cloudflare CDN 小云朵（Orange Cloud）代理救援受阻 IP、VLESS-WS-TLS 标准 443 改造、Cloudflare 移动优选 IP 延迟压降，以及 ACL4SSR / Loyalsoldier 全网分流规则库转换实录  
> **核心领域**：VPS 节点基础设施（RackNerd KVM）、3X-UI 面板与 Xray-core 架构、BBR 拥塞控制、Cloudflare Anycast CDN 代理机制、VLESS / VMess / Hysteria 2 / Reality 协议选型决策树、v2rayN 导入规范、Clash Verge Rev（Mihomo/Clash.Meta）配置、Subconverter 订阅转换管道、国内直连分流（Bypass Mainland China）

---

## 📌 背景与核心痛点排查：从“开箱即用”到“移动宽带阻断与协议自救”

在海外 VPS 采购与科学代理节点搭建过程中，新手与资深开发者常遭遇各种经典网络阻断与协议不兼容故障。本次对话源于一台典型的 **RackNerd 美西洛杉矶 VPS（IP: `192.255.232.12`）** 的搭建运维实战，历经四层典型矛盾：

1. **面板凭证遗忘与不可逆哈希**：服务器预装了 3X-UI 面板，因未记录初始密码导致管理入口受阻。经分析，现代面板采用单向 Bcrypt 加密，无法直接反解明文，需要通过命令行工具或 SQLite 底层介入重置；
2. **移动网络与机房直连被阻断**：国内宽带（特别是中国移动）对海外低价机房（如 Multacom LAX）存在严重的国际出口丢包、QoS 降速以及 TCP 22 端口 / ICMP 针对性阻断，导致家庭宽带直连 SSH 与 Reality 节点均超时无法握手；
3. **CDN 小云朵（Cloudflare Proxy）的误区与解救**：
   * **误区**：盲目给 VLESS-Reality 或 Hysteria 2 套上 Cloudflare 小云朵，因免费 CDN 仅支持 HTTP/HTTPS 流量、不支持 UDP 与原始 TCP 握手，导致 Hy2 彻底瘫痪、Reality 握手解构；
   * **正确救援姿势**：当 VPS IP 遭遇严重阻断时，开启小云朵作为“免费复活甲/减速带”，将协议改造为 **WebSocket + TLS**，流量经由 Cloudflare Anycast 全球节点转发，彻底免去更换 IP 的费用；
4. **客户端导入失败与分流缺陷**：
   * v2rayN 对 VMess JSON 字段数据类型有严格校验（端口必须为整型，字符串整型会导致解析静默失败）；
   * Cloudflare 非标端口（如 8443）在国内移动网络遭阻断，必须迁移至通用标准 **443 端口**；
   * Clash Verge 需加载完备的国内外智能分流规则（国内直连不耗 VPS 流量，国外走代理，广告全局拦截）。

```{important}
**核心工程结论**：
1. **IP 完好首选直连 Reality / Hy2**：无需自备域名，直连速度与低延迟最佳；
2. **IP 受阻开启 Cloudflare CDN**：协议必须切换为 **VLESS + WebSocket + TLS** 或 **VMess + WS + TLS**，且必须绑定在标准 **443 端口**；
3. **移动宽带搭配优选 IP**：使用移动优选 CDN 节点（如 `162.159.192.1`）替代拥堵的默认 Anycast IP，大幅提升握手成功率与带宽利用率；
4. **分流交给 ACL4SSR / Loyalsoldier**：使用标准 Subconverter 管道自动生成规则集，实现国内流量完全零损耗直连。
```

---

## 🏗️ 总体网络拓扑架构图

```{mermaid}
flowchart TD
    subgraph ClientLayer["客户端终端 (Clients)"]
        C1["v2rayN<br/>(Windows / Xray Core)"]
        C2["Clash Verge Rev<br/>(Mihomo / Clash.Meta)"]
        C3["手机端<br/>(v2rayNG / Shadowrocket)"]
    end

    subgraph CDNLayer["Cloudflare CDN Anycast 中继网 (Orange Cloud)"]
        CF_DNS["域名解析 (racknerd.kesiv.com)"]
        CF_BestIP["移动优选节点<br/>(162.159.192.1 / 香港/美西边缘)"]
        CF_Edge["Cloudflare 边缘集群 (Port 443 / HTTPS)"]
        CF_WAF["安全过滤与 TLS 终止 (Let's Encrypt / Full SSL)"]
        CF_WS["WebSocket 流量隧道转发"]
    end

    subgraph VPSLayer["RackNerd VPS 目标节点 (192.255.232.12)"]
        BBR["Linux Kernel BBR 拥塞控制"]
        Xray["Xray-core 26.10.10"]
        XUI["3X-UI 管理面板 (Port 60357 / SQLite)"]
        Inbound443["入站：VLESS-WS-TLS (Port 443, Path /ws)"]
        Outbound["出站直连 (Freedom) 访问国际互联网"]
    end

    subgraph SplitRouting["客户端智能分流判定 (Rule Engine)"]
        R_Direct["国内域名/IP (GEOSITE:cn / GEOIP:cn) ──> 🏡 本地直连 (DIRECT)"]
        R_Proxy["境外受限/AI站点 (OpenAI / YouTube / GitHub) ──> 🚀 Cloudflare CDN 代理"]
        R_Block["广告与追踪列表 ──> 🛑 阻断拦截 (REJECT)"]
    end

    ClientLayer ==> SplitRouting
    R_Proxy ==> CF_BestIP & CF_DNS
    CF_BestIP & CF_DNS --> CF_Edge --> CF_WAF --> CF_WS
    CF_WS == "专线回源 (HTTPS:443)" ==> Inbound443
    Inbound443 --> Xray --> BBR --> Outbound
    XUI -. "底层管理与凭证控制" .-> Xray
```

---

## 🛠️ 技术栈清单全景

| 层次类别 | 选用技术 / 工具 | 版本 / 规格 | 核心作用与定位 |
| :--- | :--- | :--- | :--- |
| **服务器底座** | RackNerd KVM VPS | 1 vCPU / 1GB RAM / Los Angeles DC02 | 海外低成本主机底座，分配独立公网 IPv4 |
| **操作系统** | Ubuntu 24.04 LTS | Kernel 6.8+ (已启用 TCP BBR) | 提供稳定可靠的底层 Linux 服务环境 |
| **代理核心** | Xray-core | v26.10.10 | 支持 VLESS、Reality、VMess、Hysteria 2、XHTTP 的现代代理核心 |
| **运维面板** | 3X-UI | v3.10.2 (Port 60357, HTTPS) | 多协议、多用户、多节点流量统计与订阅管理 Web 面板 |
| **数据库** | SQLite 3 | `/etc/x-ui/x-ui.db` | 3X-UI 面板的核心配置、用户信息与节点流控数据存储 |
| **证书自动化** | acme.sh | v3.0+ (ECC P-256 / Let's Encrypt) | 独立模式 (Standalone) 自动化签发与续期域名泛 SSL 证书 |
| **CDN 中继** | Cloudflare CDN | Free Tier (Orange Cloud 开启) | 隐藏受阻 VPS 真实 IP，充当 Anycast 减速带复活被墙机器 |
| **桌面客户端** | v2rayN & Clash Verge Rev | 最新版 (内置 Xray-core 与 Mihomo 内核) | Windows / macOS 主力代理连接前端，支持智能路由模式 |
| **分流转换器** | Subconverter API | v1.9.9 (`api.v1.mk` / `sub.xeton.dev`) | 将原始 VLESS/VMess 链接转换为标准 Clash 规则集 |
| **分流规则库** | ACL4SSR & Loyalsoldier | Online Full NoAuto 规则配置 | 识别国内大陆 IP/域名直连，广告拦截，境外网站代理 |

---

## 💻 现场执行命令实录与故障复盘

### 1. 探针检测与 3X-UI 密码重置

当无法登录 3X-UI 面板时，不要盲目重装。通过 SSH 连接直接排查 SQLite 数据库结构：

```bash
# 1. 检查 x-ui 服务状态与默认配置
x-ui status
x-ui settings

# 2. 查询 SQLite 数据库中的用户凭证
python3 -c "
import sqlite3
conn = sqlite3.connect('/etc/x-ui/x-ui.db')
c = conn.cursor()
print('Users:', c.execute('SELECT username, password FROM users').fetchall())
"
# 输出示例：[('qq137771819', '$2a$10$iO2Ds/DSpE1HlLXnZzC3H.zf9A2krZ8UvFLxAfMO0XQc6QSU48w86')]
```

由于 `$2a$10$...` 为 Bcrypt 单向不可逆哈希，直接读取无法还原明文。官方提供了命令行快速重置指令：

```bash
# 3. 官方命令行重置用户名与密码（无需重启数据库）
/usr/local/x-ui/x-ui setting -username "qq137771819" -password "你的新密码"
systemctl restart x-ui
```

### 2. 检查内核 BBR 加速与防火墙

跨国高延迟网络（美西往返 160ms~220ms）必须开启 BBR，以避免单线程 TCP 下载速度骤降：

```bash
# 验证 BBR 拥塞控制状态
sysctl net.ipv4.tcp_congestion_control
# 输出：net.ipv4.tcp_congestion_control = bbr

# 检查端口监听情况
ss -tulpn | grep -E ':22|:443|:8443|:60357|:2096'
```

### 3. 域名解析与 Let's Encrypt ECC 证书签发

开启 Cloudflare CDN 后，VPS 源站与 Cloudflare 之间需配置 SSL/TLS 证书（Cloudflare SSL 模式设为 **Full** 或 **Full (strict)**）。利用 `acme.sh` 独立模式签发证书：

```bash
# 利用 acme.sh standalone 模式签发 ECC 证书（占用 80 端口，Cloudflare 会回源请求验证）
/root/.acme.sh/acme.sh --issue -d racknerd.kesiv.com --standalone --server letsencrypt

# 将签发证书归档至持久化目录
mkdir -p /root/cert/racknerd.kesiv.com
cp /root/.acme.sh/racknerd.kesiv.com_ecc/fullchain.cer /root/cert/racknerd.kesiv.com/fullchain.pem
cp /root/.acme.sh/racknerd.kesiv.com_ecc/racknerd.kesiv.com.key /root/cert/racknerd.kesiv.com/privkey.pem
```

### 4. 3X-UI 节点底层热更新脚本

在通过脚本向 3X-UI 的 SQLite 添加入站节点时，需规避 3X-UI 的集群多节点逻辑：**单机 Master 节点的 `node_id` 必须为 `NULL`**，若赋值为 `0` 或数字，3X-UI 会误判为远程 Slave 节点而拒绝在本地 Xray 中加载：

```python
# 自动化入库 VLESS-WS-TLS 443 入站脚本
import sqlite3
import json
import time

conn = sqlite3.connect('/etc/x-ui/x-ui.db')
c = conn.cursor()

client_uuid = '28eda044-2bd3-431c-b5dd-d1406a131ee7'
sub_id = 'dgv6y1oz31xs0qk3'
email = '137771819@qq.com'

vless_settings = json.dumps({
    "clients": [{
        "id": client_uuid,
        "flow": "",
        "email": email,
        "limitIp": 0,
        "totalGB": 0,
        "expiryTime": 0,
        "enable": True,
        "tgId": 0,
        "subId": sub_id,
        "reset": 0,
        "resetDay": 0,
        "resetWeekday": 0,
        "resetMax": 0,
        "trafficReset": "never",
        "trafficResetDay": 1,
        "created_at": int(time.time() * 1000),
        "updated_at": int(time.time() * 1000)
    }],
    "decryption": "none"
}, indent=2)

vless_stream = json.dumps({
    "network": "ws",
    "security": "tls",
    "tlsSettings": {
        "serverName": "racknerd.kesiv.com",
        "minVersion": "1.2",
        "maxVersion": "1.3",
        "cipherSuites": "",
        "rejectUnknownSni": False,
        "disableSystemRoot": False,
        "enableSessionResumption": False,
        "certificates": [{
            "ocspStapling": 0,
            "oneTimeLoading": False,
            "usage": "encipherment",
            "buildChain": False,
            "certificateFile": "/root/cert/racknerd.kesiv.com/fullchain.pem",
            "keyFile": "/root/cert/racknerd.kesiv.com/privkey.pem"
        }],
        "alpn": ["http/1.1"]
    },
    "wsSettings": {
        "acceptProxyProtocol": False,
        "path": "/ws",
        "headers": {
            "Host": "racknerd.kesiv.com"
        }
    }
})

# 注意：node_id 必须赋值为 NULL，确保单机本地加载
c.execute('''
INSERT OR REPLACE INTO inbounds (
    id, user_id, up, down, total, remark, sub_sort_index, exclude_from_sub,
    enable, expiry_time, traffic_reset, traffic_reset_day, last_traffic_reset_time,
    listen, port, protocol, settings, stream_settings, tag, sniffing,
    node_id, share_addr_strategy, share_addr, disable_flow, origin_node_guid
) VALUES (
    6, 1, 0, 0, 0, 'CF-VLESS-WS-443', 6, 0,
    1, 0, 'never', 1, 0,
    '', 443, 'vless', ?, ?, 'in-443-vless', '{"enabled":true,"destOverride":["http","tls","quic","fakedns"],"routeOnly":false}',
    NULL, 'node', '', 0, ''
)
''', (vless_settings, vless_stream))

# 关联用户与入站节点（flow_override 字段）
c.execute('INSERT OR REPLACE INTO client_inbounds (client_id, inbound_id, flow_override, created_at) VALUES (1, 6, "", ?)', (int(time.time()*1000),))

conn.commit()
conn.close()
print("VLESS 443 节点数据库配置完成！")
```

执行完成后重启生效并验证监听：
```bash
systemctl restart x-ui
ss -tulpn | grep :443
# 确认 xray-linux-amd64 已成功接管 0.0.0.0:443
```

---

## ⚖️ 常见协议深度横评与选型决策树

在科学代理演进史中，协议历经了从明文 Shadowsocks、VMess 到 Trojan、VLESS-Reality，再到基于 UDP QUIC 的 Hysteria 2。在不同网络与机房环境下，选型差异巨大：

| 协议 / 传输方案 | 是否需域名 | CF 小云朵兼容性 | 抗封锁与伪装机制 | 移动网络表现 | 推荐使用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VLESS + Reality (TCP)** | **无需域名** | ❌ **绝对冲突** | 借用亚马逊/苹果真实证书，主动探测回源亚马逊，零自建特征 | 易受严重丢包与精准 QoS 压制 | **未被墙正常 IP 首选**，延迟低、无证书维护烦恼 |
| **Hysteria 2 (UDP/QUIC)** | 建议域名 | ❌ **绝对冲突** | 标准 HTTP/3 伪装 + Salamander 混淆，暴力拥塞控制抗丢包 | 部分省份丢包率超 80% 或被限速 | 晚高峰跨国拥塞、高丢包线路超强突破 |
| **VMess + WS + TLS** | 必须域名 | ✅ **完美兼容** | 标准 HTTPS 流量，客户端需额外 VMess 加密头 | 经 Cloudflare 中继后可正常复活 | 老旧客户端、传统全平台兼容兜底 |
| **VLESS + WS + TLS** | 必须域名 | ✅ **完美兼容** | 无损明文转发，完全依托 TLS 443 握手加密，性能高于 VMess | 搭配移动优选 IP 延迟大幅改善 | **IP 被阻断时的第一首选拯救方案** |
| **VLESS + gRPC + TLS** | 必须域名 | ✅ **兼容** (需开启 gRPC) | 多路复用 HTTP/2 原生 RPC 调用，性能好于 WebSocket | 偶遇部分省份中间件掐断连接 | 对延迟敏感的跨国工作流备用方案 |

### 协议决策树流程图

```{mermaid}
graph TD
    Start["评估 VPS 公网 IP 连通性"] --> CheckIP{"国内能否直连 SSH (Port 22) / Ping?"}
    
    CheckIP -- "能正常直连 (未被墙)" --> CheckISP{"本地运营商主要是哪家?"}
    CheckISP -- "电信 / 联通 / 境外宽带" --> PreferReality["首选：VLESS-Reality (端口 443/2083)<br/>借用 amazon.com 伪装，无需购买域名"]
    CheckISP -- "中国移动 (高峰丢包大)" --> PreferHy2["首选：Hysteria 2 (UDP 暴力抗丢包)<br/>配合自签/Let's Encrypt 证书与混淆"]
    
    CheckIP -- "无法直连 / 严重阻断 (被墙)" --> UseCF["激活 Cloudflare CDN (小云朵开启)<br/>套上免费复活甲"]
    UseCF --> CFProtocol["协议必须选：WebSocket + TLS<br/>切忌使用 Reality 或 Hysteria 2"]
    CFProtocol --> CFPort{"接入端口选择"}
    CFPort -- "推荐首选" --> Port443["标准 443 端口 (VLESS-WS-TLS)<br/>通行率 100%，无运营商非标封锁"]
    CFPort -- "备用端口" --> PortOther["非标端口 (8443 / 2053)<br/>易被移动局端 QoS，尽量避免"]
    
    Port443 --> MobileOpt{"移动网络速度较慢?"}
    MobileOpt -- "是" --> BestIP["启用 Cloudflare 移动优选 IP<br/>(162.159.192.1 / cf.090227.xyz)<br/>降低往返延迟至 70~100ms"]
    MobileOpt -- "否" --> DefaultDomain["直接使用解析域名 (racknerd.kesiv.com)"]
```

---

## ⚡ v2rayN 与移动优选 IP 配置指南

### 1. v2rayN 无法 `Ctrl+V` 导入 VMess 的技术根源

部分版本 v2rayN 在剪贴板中解析 `vmess://<Base64>` 时，底层针对 JSON 反序列化映射到强类型实体类（C# struct）：
```csharp
// 实体类字段定义
public int port { get; set; }
public int aid { get; set; }
```
如果生成的 JSON 格式将端口包裹为字符串：`"port": "443", "aid": "0"`，反序列化器会抛出类型转换异常而**静默忽略剪贴板**。因此，生成 VMess 链接时必须严格确保 `port` 与 `aid` 为**数值整型**。

### 2. VLESS 标准 443 链接与优选 IP 节点

当前已上线可用的两条核心节点链接（直接复制整行并在 v2rayN 界面按 `Ctrl + V`）：

```text
# 节点 1：标准 443 端口域名直连
vless://28eda044-2bd3-431c-b5dd-d1406a131ee7@racknerd.kesiv.com:443?type=ws&security=tls&path=%2Fws&host=racknerd.kesiv.com&sni=racknerd.kesiv.com#RackNerd-CF-VLESS-443

# 节点 2：移动优选 IP 版（解决移动宽带直连 Cloudflare 拥塞丢包）
vless://28eda044-2bd3-431c-b5dd-d1406a131ee7@162.159.192.1:443?type=ws&security=tls&path=%2Fws&host=racknerd.kesiv.com&sni=racknerd.kesiv.com#RackNerd-CF-移动优选-443
```

> **原理解密（优选 IP 为什么有效？）**：  
> Cloudflare 的全球 Anycast 广播会将 `racknerd.kesiv.com` 解析到公共边缘池（如 `104.21.x.x`、`172.67.x.x`）。在中国移动网络中，这些 IP 往往绕道美西拥堵网关；  
> 将连接地址（Address）改为优选 IP（如 `162.159.192.1`），握手阶段直连 Cloudflare 香港/日本节点，而 HTTP 请求头中的 `Host` 和 TLS 握手中的 `SNI` 依然携带 `racknerd.kesiv.com`，Cloudflare 内部专线依然能准确反代到 RackNerd 源站，速度立竿见影。

---

## 🌐 Clash Verge Rev 订阅与 ACL4SSR 规则全景

### 1. 订阅在线转换服务核心接口

通过标准 Subconverter 服务，可将单条或多条节点链接一键转换为携带完整分流规则集的 Clash 配置文件。

* **转换后端地址 1**：`https://api.v1.mk/sub`
* **转换后端地址 2**：`https://sub.xeton.dev/sub`
* **标准调用规范**：
  * `target=clash`：目标格式为 Clash / Mihomo；
  * `new_name=true`：保留节点原始备注名称；
  * `url=<URL_ENCODED_NODES>`：节点链接经 URL 编码（多个节点用管道符 `|` 分隔）；
  * `config=<URL_ENCODED_CONFIG_INI>`：远程分流规则集模板 URL。

### 2. 生产级一键导入订阅 URL

直接在 **Clash Verge Rev** 的「订阅 (Profiles)」界面粘贴并下载：

```text
https://api.v1.mk/sub?target=clash&new_name=true&url=vless%3A//28eda044-2bd3-431c-b5dd-d1406a131ee7%40racknerd.kesiv.com%3A443%3Ftype%3Dws%26security%3Dtls%26path%3D%252Fws%26host%3Dracknerd.kesiv.com%26sni%3Dracknerd.kesiv.com%23RackNerd-CF-VLESS-443%7Cvless%3A//28eda044-2bd3-431c-b5dd-d1406a131ee7%40162.159.192.1%3A443%3Ftype%3Dws%26security%3Dtls%26path%3D%252Fws%26host%3Dracknerd.kesiv.com%26sni%3Dracknerd.kesiv.com%23RackNerd-CF-%E7%A7%BB%E5%8A%A8%E4%BC%98%E9%80%89-443&config=https%3A//raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_NoAuto.ini
```

### 3. 国内分流与规则策略分组解析

转换后的配置完整内嵌了 **ACL4SSR_Online_Full_NoAuto** 规则引擎，其核心行为特征如下：

1. **🚀 节点选择 / 手动切换**：可自由指定走 `RackNerd-CF-VLESS-443` 或 `RackNerd-CF-移动优选-443`；
2. **🎯 全球直连 (DIRECT)**：国内所有常见站点（百度、腾讯、阿里、京东、网易、Bilibili）以及所有属于中国大陆的 IP 段（`GEOIP,cn`），强制走本机网络直连，**绝对不消耗 VPS 流量与 Cloudflare 额度**；
3. **💬 Ai平台**：OpenAI / ChatGPT / Claude / Gemini / Copilot 自动定向至代理组；
4. **🛑 全球拦截**：数万条广告与恶意追踪域名（Reject 规则）静默丢弃；
5. **🐟 漏网之鱼**：未明文匹配的海外长尾域名自动兜底代理。

---

## 🔗 参考资料与权威资源链接

在长期网络工程与运维中，以下开源项目与在线工具构成了现代代理科学分流的坚固基石：

### 1. 订阅在线转换平台与 Web 前端
* **ACL4SSR 在线订阅转换平台**：[https://acl4ssr-sub.github.io/](https://acl4ssr-sub.github.io/) —— 最广为人知的规则转换 Web 前端，支持全系列客户端格式切换；
* **OnePage Sub-Convert 转换工具**：[https://onepage.czl.net/tools/sub-convert/](https://onepage.czl.net/tools/sub-convert/) —— 极简纯净的第三方轻量级订阅转换工具，支持多节点批量拼接；
* **Subconverter 官方核心仓库**：[https://github.com/tindy2013/subconverter](https://github.com/tindy2013/subconverter) —— 跨平台订阅转换底层引擎，支持本地自建 Docker 隔离私有部署。

### 2. 业界标杆分流规则集与配置参考
* **Loyalsoldier Clash 经典规则库**：[https://github.com/Loyalsoldier/clash-rule](https://github.com/Loyalsoldier/clash-rule) —— 专为 Clash 设计的工业级分流规则提供者（Rule Providers），提供 direct、proxy、reject、gfw、tld-not-cn 等高频维护规则；
* **mcxiaoke 精选 Clash 规则与配置 Gist**：[https://gist.github.com/mcxiaoke/d41b9f6aefe15002b38b95c96c60ffc0](https://gist.github.com/mcxiaoke/d41b9f6aefe15002b38b95c96c60ffc0) —— 资深开发者深度整理的高清流媒体、社交网络与大陆直连精细化规则模板；
* **ACL4SSR 官方规则全集**：[https://github.com/ACL4SSR/ACL4SSR](https://github.com/ACL4SSR/ACL4SSR) —— 中国大陆最全面的规则路由集，涵盖国内媒体、微软应用、苹果生态、电报集群及漏网之鱼细分。

### 3. 服务端与客户端生态核心仓库
* **3X-UI 多协议管理面板**：[https://github.com/MHSanaei/3x-ui](https://github.com/MHSanaei/3x-ui) —— 功能完善的 Xray Web 仪表盘，支持多用户限额与多协议聚合；
* **Xray-core 官方主仓库**：[https://github.com/XTLS/Xray-core](https://github.com/XTLS/Xray-core) —— VLESS、XTLS、Reality 与 XHTTP 的发源地，模块化多协议核心；
* **acme.sh 自动化 SSL 证书工具**：[https://github.com/acmesh-official/acme.sh](https://github.com/acmesh-official/acme.sh) —— 纯 Shell 实现的高效 ACME 客户端；
* **Clash Verge Rev 官方仓库**：[https://github.com/clash-verge-rev/clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) —— 基于 Tauri 与 Mihomo 内核开发的高颜值桌面客户端；
* **Mihomo (Clash.Meta) 核心**：[https://github.com/MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) —— 活跃支持现代新协议（VLESS、Reality、Hysteria 2、TUIC）的次世代 Clash 核心。
