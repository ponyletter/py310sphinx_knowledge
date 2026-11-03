# 阶段五：商业级客户端分流生态与高可用自动化自愈

> **彻底解决 Clash Verge 在线订阅转换失败的沉疴，实现本地 Native 商业级 YAML 规则生成与 Split DNS，配合 systemd 开机自愈与 vnStat 阶梯流控防爆单。**

---

## 阶段导读

在日常使用中，用户经常遭遇两大痛点：
1. **订阅导入与协议识别死局**：使用第三方在线 Subconverter 转换订阅链接时，经常因为在线工具后端版本滞后，无法识别 VLESS-REALITY、XHTTP、Hysteria 2 或后量子密码，导致客户端解析报错；更严重的是，自动测速（`url-test`）会将按量计费的住宅代理频繁测速，导致宝贵的流量配额迅速耗尽。
2. **服务器断电重启瘫痪与流量超额账单**：云服务商故障重启后，容器内代理服务常因网卡唤醒延迟而丢失端口监听；而未加限额的 VPS 若遭遇异常大流量，极易产生高昂的超额账单甚至直接被服务商封停。

本阶段将详细拆解由 Python 驱动的本地商业级 Clash YAML 规则生成引擎，并落地 systemd 开机自愈守护（`boot_check`）与基于 `vnstat` 的三级流量守卫（`traffic_guard`）。

---

## 核心架构拓扑

```{mermaid}
flowchart TD
    subgraph ClientConfig["商业级 Clash Verge Rev 本地配置"]
        SplitDNS["Split DNS 模块<br/>(国内阿里/腾讯DoH + 国外加密解析)"]
        DirectGroup["国内直连 (DIRECT)"]
        ProxyGroup["自动优选 (url-test: REALITY + Hy2 + CDN)"]
        IsolatedRes["住宅隔离组 (禁止测速 / 仅手动触发)"]
    end

    subgraph ServerGuard["服务端高可用守护"]
        BootCheck["systemd boot_check.timer<br/>(开机后检查容器/重启失活服务/补齐BBR)"]
        TrafficGuard["systemd traffic_guard.timer<br/>(vnStat 10分钟轮询: 80%预警/90%限速50M/98%限速5M)"]
    end

    ClientConfig -.-> ServerGuard
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_clash_native_yaml_and_split_dns
02_systemd_boot_check_and_traffic_guard
03_cross_border_network_error_triage_and_gfw_latency_troubleshooting_sop
```
