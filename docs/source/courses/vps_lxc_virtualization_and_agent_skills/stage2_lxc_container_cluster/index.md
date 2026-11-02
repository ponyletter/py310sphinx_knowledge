# 阶段二：LXC 容器集群编排引擎架构与网络穿透

> **基于 Canonical LXD 5.21 LTS 架构，深入剖析轻量级容器生命周期管理、`lxdbr0` 虚拟网桥与私网 NAT 转发原理，落地 4 容器黄金拓扑与端口矩阵。**

---

## 阶段导读

与 Docker 的“单进程微服务”模型不同，**LXC（LXD）提供的是完备的“系统容器”（System Containers）**：每个容器都拥有独立的 init 系统（systemd）、独立的文件系统、独立的网络接口与独立的 SSH 服务，其操作体验与一台完整的独立 VPS 毫无二致，但内存与 CPU 开销却仅为 KVM 虚拟机的十分之一。

本阶段将详细介绍如何通过自动化脚本完成 LXD 的静默安装、`lxdbr0` 虚拟网桥的配置、专有 Profile 的隔离设计，并实操一套包含 Cloudflare CDN 端口矩阵与原生 RDP 3389 的 4 容器黄金拓扑。

---

## 核心架构拓扑

```{mermaid}
flowchart TD
    subgraph Host["宿主机 (Public IP: 198.51.100.150)"]
        HostSSH["宿主机 SSH :2222"]
        Bridge["LXD 托管网桥 lxdbr0<br/>(10.10.10.1/24)"]
    end

    subgraph Cluster["4 容器集群 (独立 Namespace)"]
        C1["c1: 基础代理容器<br/>(10.10.10.10)<br/>SSH: 2201 | CDN: 443, 8443"]
        C2["c2: 住宅落地出口容器<br/>(10.10.10.20)<br/>SSH: 2202 | CDN: 2053, 2083"]
        C3["c3: Realm 高性能转发<br/>(10.10.10.30)<br/>SSH: 2203 | Relay 端口组"]
        C4["c4: XRDP 远程桌面容器<br/>(10.10.10.40)<br/>SSH: 2204 | RDP: 3389"]
    end

    HostSSH -.-> Host
    Bridge --> C1
    Bridge --> C2
    Bridge --> C3
    Bridge --> C4
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_lxd_architecture_and_bridge_nat
02_container_topology_and_port_matrix
```
