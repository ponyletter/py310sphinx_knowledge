# 阶段三：全协议矩阵编排与零探测自建伪装实战

> **探索 Xray-core 单端口 443 终极伪装方案（`reality-self`），掌握合法流量代理出网与非法扫描回落 Nginx 的 PROXY protocol 联动，落地多协议共存与后量子握手适配。**

---

## 阶段导读

传统的“自建节点”容易被封锁的关键原因，在于目标端口对外暴露的特征不符合真实合规的互联网流量模型：要么监听在非标准的冷门高端口，要么返回伪造的他人证书，极易被主动探测系统（Active Probing）识别。

本阶段将详细拆解由智能体自动化实现的 **`reality-self`（单端口自建伪装）** 与 **`unified`（全协议共存）** 两种核心 Profile。此外，本阶段还将深入复盘包括 **Mihomo / Clash 后量子密码（ML-KEM-768）握手失败**、**3X-UI SQLite 数据库锁与单事务恢复** 等一系列重磅踩坑实战。

---

## 核心架构拓扑

```{mermaid}
flowchart TD
    Client["客户端发起 TLS 连接<br/>(TCP 443)"] --> Xray["Xray-core :443<br/>(VLESS + REALITY + Vision)"]
    
    Xray -- "① 具备合法密钥与合法 SNI" --> ProxyOut["代理转发成功<br/>(高速直连访问外网)"]
    Xray -- "② 扫描器 / 爬虫 / 浏览器探测" --> Fallback["PROXY protocol 回落<br/>(127.0.0.1:8443)"]
    
    Fallback --> Nginx["本地 Nginx 静态站点<br/>(挂载真实有效 Let's Encrypt 证书)"]
    Nginx --> Web["返回真实企业官网 / 博客页面<br/>(主动探测完全合规)"]
    
    HTTP["外部 HTTP :80 访问"] --> ACME["Nginx :80<br/>(ACME.sh 证书验证 + 301 强制跳转)"]
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_reality_self_single_port_camouflage
02_unified_protocol_matrix_and_mlkem
```
