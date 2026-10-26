# 【实战对话】多节点 VPS 集群工程实战：GreenCloud 与 ByteVirt 3X-UI 部署、Cloudflare 443 CDN 复活、移动/联通优选 IP 与 ACL4SSR 多节点全景分流聚合

> **沉淀人**：极客探索团队  
> **实战机型**：
> 1. **RackNerd 美西洛杉矶 VPS**（IP: `192.255.232.12`，域名: `racknerd.kesiv.com`）
> 2. **GreenCloud 日本/美西 VPS**（IP: `216.158.79.128`，域名: `greencloudvps.kesiv.com`，针对山东联通宽带优化）
> 3. **ByteVirt 亚太/海外 VPS**（IP: `69.8.136.116`，SSH 端口: `4400`，域名: `bytevirt.kesiv.com`，针对中国移动宽带优化）  
> **核心领域**：多节点科学网络拓扑、3X-UI 面板版本差异（v3.8 vs v3.11）与 SQLite 底层表结构兼容、Cloudflare CDN 标准 443 端口与回源改造、运营商（中国移动 / 中国联通）优选 IP 智能调度、Subconverter 多节点批量聚合与 ACL4SSR 国内分流规则实战。

---

## 📌 背景与多节点架构演进：从单点救援到运营商多路容灾

在完成了单台 RackNerd VPS 的 CDN 复活与分流调优后，为了保障高可用性与跨境多线路冗余，集群进一步接入了两台核心机器：
1. **GreenCloud 节点（`216.158.79.128`）**：针对山东联通（China Unicom）网络优化；
2. **ByteVirt 节点（`69.8.136.116`，SSH 4400）**：针对中国移动（China Mobile）网络出口丢包与 QoS 进行针对性 Anycast 优选加速。

当海外服务器的裸 IP 受到国内不同运营商的针对性丢包或封锁时，传统的“换 IP”策略不仅成本高昂，且无法根本解决运营商出境路由劣化的难题。通过将所有机器接入 **Cloudflare CDN（开启小云朵 Orange Cloud）**，配合标准 **443 端口 VLESS-WS-TLS** 协议与 **运营商本地优选 IP**，我们实现了：
* **零换 IP 成本**：所有受阻 IP 均获得 Anycast“复活甲”；
* **真 443 端口兼容**：全面规避国内运营商对 8443、2053、2083 等非标端口的 QoS 降速与阻断；
* **多网异构分流**：联通走联通专有 Anycast 入口，移动走低延迟香港/亚太 Anycast 入口，国内流量全量 DIRECT 直连。

---

## 🏗️ 多节点拓扑与智能分流全景架构

```{mermaid}
flowchart TD
    subgraph Users["客户端终端 (Clients)"]
        ClientApp["v2rayN / Clash Verge Rev (Mihomo)"]
    end

    subgraph RuleEngine["ACL4SSR 智能分流引擎"]
        Rule_CN["国内流量 (GEOIP:cn / Direct) ──> 🏡 本地直连 (不走代理)"]
        Rule_Ads["广告追踪 (Reject) ──> 🛑 静默丢弃"]
        Rule_Proxy["境外/AI流量 (Proxy) ──> 🚀 运营商专线分流"]
    end

    subgraph CarrierOptimized["Cloudflare Anycast 优选接入层 (Port 443)"]
        MobileIP["中国移动优选节点 (162.159.192.1)<br/>低延迟香港/亚太 Anycast"]
        UnicomIP["中国联通优选节点 (162.159.193.1)<br/>北美/亚太 Anycast 骨干"]
        DefaultDNS["CF 默认域名 Anycast (bytevirt / greencloud / racknerd)"]
    end

    subgraph CF_Network["Cloudflare 边缘中继网络 (Orange Cloud)"]
        WAF_TLS["TLS 终止 (Let's Encrypt ECC)"]
        Tunnel["WebSocket 长连接回源隧道"]
    end

    subgraph NodesCluster["海外 VPS 目标集群"]
        subgraph Node1["Node 1: RackNerd"]
            RN_Core["Xray-core"]
            RN_Inbound["VLESS-WS-TLS 443"]
        end
        subgraph Node2["Node 2: GreenCloud"]
            GC_Core["Xray-core"]
            GC_Inbound["VLESS-WS-TLS 443"]
        end
        subgraph Node3["Node 3: ByteVirt (SSH 4400)"]
            BV_Core["Xray-core"]
            BV_Inbound["VLESS-WS-TLS 443"]
        end
    end

    Users ==> RuleEngine
    Rule_Proxy ==> MobileIP & UnicomIP & DefaultDNS
    MobileIP & UnicomIP & DefaultDNS --> WAF_TLS --> Tunnel
    Tunnel --> RN_Inbound & GC_Inbound & BV_Inbound
```

---

## 🛠️ 集群节点配置矩阵

| 节点名称 | 原始 IP / SSH 端口 | 解析域名 (CF Proxy 开启) | 协议与端口 | 运营商优化目标 | 3X-UI 面板入口 (Direct IP) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RackNerd-US** | `192.255.232.12:22` | `racknerd.kesiv.com` | VLESS-WS-TLS : 443 | 美西基础备用线路 | `https://192.255.232.12:60357/iItrkcZcuFHedxwh2N/` |
| **GreenCloud-SD** | `216.158.79.128:22` | `greencloudvps.kesiv.com` | VLESS-WS-TLS : 443 | 山东联通骨干直连 | `https://216.158.79.128:60357/iItrkcZcuFHedxwh2N/` |
| **ByteVirt-MB** | `69.8.136.116:4400` | `bytevirt.kesiv.com` | VLESS-WS-TLS : 443 | 中国移动宽带极速 | `https://69.8.136.116:60357/iItrkcZcuFHedxwh2N/` |

---

## 💻 现场部署实录与 3X-UI 数据库兼容性避坑

### 1. 3X-UI 版本差异与 SQLite 架构陷阱

在多台机器部署过程中，发现 3X-UI 面板存在不同版本（v3.8.0 与 v3.11.0）的底层数据库结构差异：
* **3X-UI >= v3.10**：`inbounds` 表新增了 `exclude_from_sub` 字段；
* **3X-UI v3.8.0**：`inbounds` 表只有 24 个基础字段，**不存在 `exclude_from_sub` 字段**。若直接复用高版本 SQL 插入语句，会触发致命异常：
  ```text
  sqlite3.OperationalError: table inbounds has no column named exclude_from_sub
  ```

### 2. 生产级自动化建站与端口调整脚本（兼容 v3.8.0）

为避免破坏已有 Reality 节点，脚本采用如下无损改造逻辑：
1. 将既有占用 443 端口的 Reality 节点迁移至非冲突端口（如 `2083`），保留其作为直连备用；
2. 注入标准 `443` 端口的 VLESS + WebSocket + TLS 入站规则；
3. 将用户 UUID 绑定至该 443 入站；
4. 部署 Let's Encrypt ECC 域名证书并重启 `x-ui` 服务。

```python
import sqlite3
import json
import time

conn = sqlite3.connect('/etc/x-ui/x-ui.db')
c = conn.cursor()

# 1. 开启面板订阅与证书挂载
c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('subEnable', 'true')")
c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('subClashEnable', 'true')")
c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('webCertFile', '/root/cert/bytevirt.kesiv.com/fullchain.pem')")
c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('webKeyFile', '/root/cert/bytevirt.kesiv.com/privkey.pem')")

# 2. 将既有 Reality 节点移至 2083，释放 443 端口给 CF CDN
c.execute("UPDATE inbounds SET port = 2083, tag = 'in-2083-tcp', remark = 'ByteVirt-Direct-Reality' WHERE id = 1")

client_uuid = "9c086931-8248-4a52-9f1c-7907ce407373"
sub_id = "r1i8hzt09rjbfx6g"
email = "2eyqrgyt5i"
now_ms = int(time.time() * 1000)

vless_settings = json.dumps({
    "clients": [{
        "id": client_uuid,
        "flow": "",
        "email": email,
        "enable": True,
        "subId": sub_id,
        "created_at": now_ms,
        "updated_at": now_ms
    }],
    "decryption": "none"
})

vless_stream = json.dumps({
    "network": "ws",
    "security": "tls",
    "tlsSettings": {
        "serverName": "bytevirt.kesiv.com",
        "certificates": [{
            "certificateFile": "/root/cert/bytevirt.kesiv.com/fullchain.pem",
            "keyFile": "/root/cert/bytevirt.kesiv.com/privkey.pem"
        }],
        "alpn": ["http/1.1"]
    },
    "wsSettings": {
        "acceptProxyProtocol": False,
        "path": "/ws",
        "headers": {
            "Host": "bytevirt.kesiv.com"
        }
    }
})

# 3. 兼容 v3.8.0 的精确列入站插入
c.execute('''
INSERT OR REPLACE INTO inbounds (
    id, user_id, up, down, total, remark, sub_sort_index,
    enable, expiry_time, traffic_reset, traffic_reset_day, last_traffic_reset_time,
    listen, port, protocol, settings, stream_settings, tag, sniffing,
    node_id, share_addr_strategy, share_addr, disable_flow, origin_node_guid
) VALUES (
    2, 1, 0, 0, 0, 'ByteVirt-CF-VLESS-443', 2,
    1, 0, 'never', 1, 0,
    '', 443, 'vless', ?, ?, 'in-443-vless', '{"enabled":true,"destOverride":["http","tls","quic","fakedns"],"routeOnly":false}',
    NULL, 'node', '', 0, ''
)
''', (vless_settings, vless_stream))

c.execute('INSERT OR REPLACE INTO client_inbounds (client_id, inbound_id, flow_override, created_at) VALUES (1, 2, "", ?)', (now_ms,))

conn.commit()
conn.close()
```

---

## ⚡ 客户端连接凭证与订阅

### 1. ByteVirt 节点（中国移动优选）

```text
# 节点 1：标准 443 域名接入
vless://9c086931-8248-4a52-9f1c-7907ce407373@bytevirt.kesiv.com:443?type=ws&security=tls&path=%2Fws&host=bytevirt.kesiv.com&sni=bytevirt.kesiv.com#ByteVirt-CF-VLESS-443

# 节点 2：中国移动优选 Clean IP 接入（推荐移动宽带使用）
vless://9c086931-8248-4a52-9f1c-7907ce407373@162.159.192.1:443?type=ws&security=tls&path=%2Fws&host=bytevirt.kesiv.com&sni=bytevirt.kesiv.com#ByteVirt-CF-移动优选-443
```

### 2. 多节点一键 Clash Verge Rev 聚合订阅链接

通过 **Subconverter API** 批量聚合 RackNerd、GreenCloud、ByteVirt 全部优质节点，并挂载 **ACL4SSR_Online_Full_NoAuto** 规则引擎，实现全网智能分流：

```text
https://api.v1.mk/sub?target=clash&new_name=true&url=vless%3A%2F%2F9c086931-8248-4a52-9f1c-7907ce407373%40bytevirt.kesiv.com%3A443%3Ftype%3Dws%26security%3Dtls%26path%3D%252Fws%26host%3Dbytevirt.kesiv.com%26sni%3Dbytevirt.kesiv.com%23ByteVirt-CF-VLESS-443%7Cvless%3A%2F%2F9c086931-8248-4a52-9f1c-7907ce407373%40162.159.192.1%3A443%3Ftype%3Dws%26security%3Dtls%26path%3D%252Fws%26host%3Dbytevirt.kesiv.com%26sni%3Dbytevirt.kesiv.com%23ByteVirt-CF-%25E7%25A7%25BB%25E5%258A%25A8%25E4%25BC%2598%25E9%2580%2589-443&config=https%3A%2F%2Fraw.githubusercontent.com%2FACL4SSR%2FACL4SSR%2Fmaster%2FClash%2Fconfig%2FACL4SSR_Online_Full_NoAuto.ini
```

---

## 🔗 参考资料与工具

* **ACL4SSR 在线订阅转换平台**：[https://acl4ssr-sub.github.io/](https://acl4ssr-sub.github.io/)
* **OnePage 极简订阅转换**：[https://onepage.czl.net/tools/sub-convert/](https://onepage.czl.net/tools/sub-convert/)
* **Loyalsoldier 规则集**：[https://github.com/Loyalsoldier/clash-rule](https://github.com/Loyalsoldier/clash-rule)
* **mcxiaoke Clash 配置精选**：[https://gist.github.com/mcxiaoke/d41b9f6aefe15002b38b95c96c60ffc0](https://gist.github.com/mcxiaoke/d41b9f6aefe15002b38b95c96c60ffc0)
