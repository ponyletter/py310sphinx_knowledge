# 2.1 LXD 5.21 架构设计、虚拟网桥配置与专用 Profile 隔离

> **深入 Canonical LXD 容器底层，掌握静默非交互式初始化、`lxdbr0` NAT 网桥原理，以及独立专有 Profile 与 Docker 嵌套虚拟化配置。**

---

## 一、 LXD 架构与非交互式初始化

在自动化运维体系中，不能依赖交互式的 `lxd init` 问答向导，必须通过预定义的 YAML 配置或 CLI 指令完成静默初始化：

```mermaid
flowchart TD
    Init["非交互式初始化"] --> Snap["安装 LXD 5.21 LTS<br/>(snap install lxd)"]
    Snap --> Pool["创建基础存储池<br/>(driver: dir / default)"]
    Pool --> Bridge["创建托管虚拟网桥 lxdbr0<br/>(ipv4.address: 10.10.10.1/24, ipv4.nat: true)"]
    Bridge --> Profile["创建专属 Profile: vps-lxc<br/>(security.nesting: true)"]
```

### 1. 静默初始化脚本范例

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. 确保安装 LXD 5.21 LTS 长期支持版
if ! command -v lxd &>/dev/null; then
    echo "正在安装 LXD 5.21 LTS..."
    sudo snap install lxd --channel=5.21/stable
fi

# 2. 初始化存储池（采用通用性最广的 dir 驱动）
if ! lxc storage show default &>/dev/null; then
    echo "创建默认存储池 default (dir 模式)..."
    lxc storage create default dir
fi

# 3. 初始化托管网桥 lxdbr0
if ! lxc network show lxdbr0 &>/dev/null; then
    echo "创建私网 NAT 网桥 lxdbr0..."
    lxc network create lxdbr0 \
        ipv4.address=10.10.10.1/24 \
        ipv4.nat=true \
        ipv6.address=none
fi
```

---

## 二、 独立 Profile 设计与 Docker 嵌套权限（PR #3 避坑）

### 1. [关键踩坑] 绝不污染宿主机的 `default` Profile！

在早期的自动化设计中，许多脚本直接修改 LXD 自带的 `default` Profile。当宿主机本身已经部署了其他业务容器或老旧服务时，修改 `default` Profile 极易引发连锁崩溃。此外，在旧版本 LXD 中执行 `lxc profile show` 时，缺少 `--format` 参数会导致解析脚本意外退出。

**工业级解决方案**：
* 坚决保留宿主机原始的 `default` Profile 不动；
* 为业务集群创建**全新的专属 Profile（如 `vps-lxc`）**，所有由引擎派生的容器只绑定此专属 Profile。

### 2. 开启 `security.nesting=true`（容器内运行 Docker）

为了支持在 LXC 容器内部再次运行 Docker 容器（如运行 Web 监控、DUIX 离线数字人或定制镜像），必须在 Profile 中注入嵌套权限：

```bash
# 创建并配置专属 profile
lxc profile create vps-lxc || true

# 绑定根磁盘与网桥
lxc profile device add vps-lxc root disk path=/ pool=default || true
lxc profile device add vps-lxc eth0 nic network=lxdbr0 name=eth0 || true

# 开启容器内 Docker 嵌套与特权能力
lxc profile set vps-lxc security.nesting=true
```

---

## 三、 NAT 端口转发陷阱与探测盲区（PR #5 避坑）

在实现宿主机到容器的端口穿透时，LXD 提供了一种极其高效的 `proxy` 设备模式：

```bash
# 将宿主机 2201 端口直通映射到容器 c1 的 22 端口
lxc config device add c1 ssh-in proxy \
    listen=tcp:0.0.0.0:2201 \
    connect=tcp:127.0.0.1:22
```

### [重大踩坑复盘] 为什么 `ss -tulpn` 会漏报已占用的 NAT 端口？

> [!WARNING]
> 当用户尝试在已运行业务的“繁忙宿主机（Busy Host）”上扩容新容器时，脚本如果仅依赖 `ss -tulpn` 或 `netstat` 检测宿主机端口空闲状态，**会产生致命的误判**！
> 
> **原因分析**：
> 某些 Linux 发行版或内核在通过 iptables PREROUTING / NAT 转发端口时，宿主机内核空间并不存在处于 `LISTEN` 状态的 Local Socket！
> 
> **工程解决方案**：
> 端口冲突校验必须执行**双层验证**：
> 1. 第一层：`ss -tulpn` 检查本地宿主机进程监听；
> 2. 第二层：**遍历所有已有容器的 `devices` 配置**，提取已存在的 proxy 设备监听端口，两层求并集，确保新容器分配的端口矩阵绝对不产生碰撞。

---

## 四、 系统容器 (LXD/Incus) vs 应用容器 (Podman/Docker) 深度辨析

在日常运维中，很多人会疑问：“既然都是容器，为什么不用 Podman 或 Docker，而要用 LXD？”：

| 评估维度 | Podman / Docker (应用级容器) | LXD / Incus (系统级容器) | 运维实战优劣势对比 |
| :--- | :--- | :--- | :--- |
| **定位哲学** | 运行单进程应用 (Xray 进程) | **运行完整的 Linux 虚拟机体验** | LXD 允许安装任意常规软件，自由度与完整 VPS 一致 |
| **PID 1 进程** | 通常为容器启动入口程序 | **原生 systemd (PID 1)** | LXD 原生支持 `systemctl start/enable` 与各类守护服务 |
| **SSH 远程登录** | 需侵入式注入 SSH 服务与密钥 | **开箱即用原生 OpenSSH 服务** | 每个 LXD 容器都能当成独立的远程 Linux 主机使用 |
| **一键脚本兼容** | 大量 Shell 安装脚本运行报错 | **极高（等同真实 Debian/Ubuntu）** | 官方一键脚本无感知安装，无需针对容器改写环境 |
| **内存开销** | 极轻（~20MB-40MB） | 稍高（~60MB-120MB） | LXD 虽多消耗微量内存，但换取了完整的系统治理能力 |

---

## 五、 安全防线：LXD Root 不等于 KVM Root

在分租或隔离多套业务时，必须厘清容器的安全边界：

```mermaid
flowchart TD
    subgraph Host["宿主机 (KVM VPS)"]
        HostRoot["宿主机真实 root (UID 0)"]
        LXDDaemon["LXD 守护进程 (绑定 unix.socket)"]
        subgraph SubUID["宿主机非特权映射区 (UID 1000000+)"]
            MappedRoot["容器 root (UID 0) 映射为宿主 UID 1000000"]
        end
    end

    subgraph Container["非特权 LXC 容器"]
        CRoot["容器内部看似为 root<br/>(可管理容器内服务，但无权越权宿主内核)"]
    end

    CRoot -.-> MappedRoot
    HostRoot --> LXDDaemon
```

1. **默认非特权容器（Unprivileged Containers）**：
   LXD 默认使用 Linux User Namespace。容器内部看似是 `root`（UID 0），在宿主机看来其实是映射到一个极高编号的普通非特权用户（如 UID 1000000）。即使容器内被挂马，黑客也无法直接突破到宿主机提权。
2. **严防管理 Socket 泄露**：
   **绝对不能将宿主机的 `/var/snap/lxd/common/lxd/unix.socket` 挂载进任何容器内部**！因为在 LXD 的设计规范中，只要拥有向该 Unix Domain Socket 写入的权限，就等于拥有宿主机的完整 Root 控制权。

---

## 六、 双重 NAT 损耗与 UDP 断流（nf_conntrack）真相

许多用户担忧：“经过了宿主机端口映射（DNAT）和 LXD 私网网桥，双重 NAT 会不会导致严重的性能衰减与延迟飙升？”

### 真实工程实测结论：
* **TCP 延迟与吞吐**：Linux 内核 Netfilter 在处理包转发时的耗时仅为**微秒级（< 0.05ms）**，CPU 额外开销不到 1.5%，千兆跑满状态下双重 NAT 对网速几乎 0 影响；
* **真正隐患：UDP 连接跟踪超时（UDP 断流）**：
  Hysteria 2、QUIC 等高并发 UDP 协议会在 Linux 连接跟踪表（`ip_conntrack` / `nf_conntrack`）中建立大量状态项。如果宿主机内存过小，默认的连接跟踪表被撑爆后，操作系统会直接抛弃新连接！
  **根治手段**：如阶段一所述，在宿主机配置 `net.netfilter.nf_conntrack_max = 262144`，彻底规避 UDP 断流。

---

## 🔗 参考资料

* **Canonical LXD 网络配置指南**：[LXD Network Configuration](https://documentation.ubuntu.com/lxd/en/latest/reference/network_bridge/)
* **LXD Proxy 设备协议直通规范**：[LXD Device Type Proxy](https://documentation.ubuntu.com/lxd/en/latest/reference/devices_proxy/)
