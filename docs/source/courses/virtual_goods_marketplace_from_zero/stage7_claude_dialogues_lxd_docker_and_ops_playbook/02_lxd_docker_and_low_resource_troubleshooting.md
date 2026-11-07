# LXD 容器化、Docker 嵌套虚拟化避坑与低内存服务器调优

在 24goods（Kesiv）的实际运维实践中，底层基础设施经历了一次从单机极简测试到高隔离、双环境（本地测试机 + 日本物理机 LXD 容器）的演化过程。

生产环境部署在位于**日本 IIJ 机房的物理宿主机**上，在物理机内通过 **LXD 系统级容器**划分出业务隔离环境（`c4-desktop`），并在该容器内部运行 **Docker-in-LXD** 容器集群；与此同时，本地开发与演示机受限于 **2 vCPU / 2GB RAM / 2.5GB Swap** 的极端硬件约束，频繁遭遇性能悬崖。

本节系统拆解 **LXD 4.0 到 5.21 升级、Docker 嵌套虚拟化内核参数调优、Cloudflare 端口双向认证与 2GB 内存防崩溃调优策略**。

---

## 一、生产环境硬件与网络拓扑

生产环境并未采用昂贵且笨重的公有云集群，而是采用了高性价比的**物理机 + LXD 轻量级系统虚拟化**方案：

```{mermaid}
flowchart TB
    CF["Cloudflare Edge 边缘节点<br/>(开启 Authenticated Origin Pull 双向证书)"]
    
    subgraph Host["日本 IIJ 物理宿主机 (公网 IP: 141.98.198.150)"]
        FW["宿主机 iptables 端口映射"]
        
        subgraph LXD["LXD 系统容器: c4-desktop (内网 IP: 10.0.43.40)<br/>配置: 2 vCPU / 4GB RAM / 4GB Swap"]
            CD["Caddy 2 反向代理网关<br/>(监听容器内 8088 端口，核验 CF 客户端证书)"]
            
            subgraph Docker["Docker 容器集群 (Docker-in-LXD)"]
                API["app_api 业务主进程<br/>(FastAPI, 权限受限)"]
                DELIVERY["delivery 独立履约进程<br/>(持有 Cardvault 私钥, 零外网出栈)"]
                PG[("PostgreSQL 16 + RLS")]
                RD[("Redis 7.2 (ACL 隔离)")]
            end
        end
    end
    
    CF -- "HTTPS 请求 (携带 CF CA 客户端证书)" --> FW
    FW -- "宿主机 2204 端口 -> 容器 22 (SSH 运维)" --> LXD
    FW -- "宿主机 8088 端口 -> 容器 8088 (Web 流量)" --> CD
    CD --> API
    API --> PG
    API --> RD
    DELIVERY --> PG
    DELIVERY -. "内部 Unix Socket" .-> API
```

* **日本 IIJ 宿主机**：公网 IP `141.98.198.150`，对外只暴露自定义 SSH 运维端口（`2204`）与 Web 专用入栈端口（`8088`）；
* **LXD 业务容器 (`c4-desktop`)**：内网 IP `10.0.43.40`，承载全部业务代码；
* **源站隐藏与防 DDOS**：所有公共流量均通过 Cloudflare 代理，并通过 **Cloudflare Authenticated Origin Pull (AOP)** 执行双向 TLS 认证，直接通过 IP 访问 8088 端口的请求会被 Caddy 握手层直接拒绝（返回 400 Bad Request），杜绝源站 IP 暴露。

---

## 二、LXD 4.0 升级 5.21 与 Docker 嵌套虚拟化踩坑 (Issue #6)

在初始部署阶段，物理宿主机运行的是 Ubuntu 20.04 自带的旧版 LXD 4.0。当团队尝试在 LXD 容器内部运行 `docker compose up` 时，遭遇了一系列灾难性报错：

### 1. 致命报错与根因剖析

```text
Error response from daemon: cgroup-parent for systemd cgroup should be a valid slice: invalid argument
failed to start daemon: Error initializing network controller: error obtaining controller instance: 
failed to create NAT chain DOCKER: iptables failed: iptables -t nat -N DOCKER: File exists
```

* **根因 1：cgroups v1 与 v2 混合层级冲突**：
  LXD 4.0 对 Linux 内核 cgroups v2 的命名空间支持不完整，导致在嵌套启动 Docker 的 `containerd` 时，无法为子容器分配正确的 systemd slice 切片；
* **根因 2：非特权容器权限受限**：
  默认 LXD 容器运行在非特权模式（Unprivileged User Namespace），内核禁止容器内部挂载 `overlayfs` 以及创建关键字符设备（mknod），导致 Docker overlay2 存储驱动直接暴毙。

### 2. 标准升级与配置治本方案

针对 Issue #6，团队制定了彻底平滑的升级改造方案：

#### 步骤一：平滑升级 LXD 至 5.21 LTS

```bash
# 查看当前宿主机 snap lxd 跟踪通道
snap list lxd

# 将 LXD 刷新升级至现代长期支持通道 5.21/stable
sudo snap refresh lxd --channel=5.21/stable

# 验证升级后版本与 cgroups 状态
lxc version
# 确认输出版本号 >= 5.21.x
```

#### 步骤二：开启容器关键特权与系统调用拦截

在宿主机上对 `c4-desktop` 容器施加关键配置，允许其嵌套运行 Docker 引擎：

```bash
# 1. 开启嵌套虚拟化支持（必须）
lxc config set c4-desktop security.nesting true

# 2. 开启系统调用拦截，允许在非特权容器内创建块/字符设备（解决 Docker 卷挂载问题）
lxc config set c4-desktop security.syscalls.intercept.mknod true

# 3. 开启扩展属性拦截（解决 overlay2 文件系统只读/权限丢失报错）
lxc config set c4-desktop security.syscalls.intercept.setxattr true

# 4. 重启 LXD 容器使内核参数生效
lxc restart c4-desktop
```

#### 步骤三：验证 Docker 嵌套状态

进入容器执行自检：

```bash
lxc exec c4-desktop -- bash
docker info
# 重点检查输出项：
# Storage Driver: overlay2
# Cgroup Version: 2
# Security Options: seccomp
```
经此配置，LXD 容器内的 Docker 服务完全恢复正常，且依然保持在宿主机的命名空间隔离保护之下。

---

## 三、Cloudflare 端口双向认证与 Caddy 安全接入

在 `c4-desktop` 容器中，Caddy 2 充当最外层的反向代理网关。为了确保没有任何外部攻击者能绕过 Cloudflare 直接打击源站，我们配置了双向证书核验：

### 1. 下载 Cloudflare Authenticated Origin Pull 根证书

在容器的 `/etc/caddy/certs/` 目录下放置 Cloudflare 官方签发的客户端验证 CA 证书：

```bash
mkdir -p /etc/caddy/certs
curl -sL https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem \
  -o /etc/caddy/certs/cf-origin-pull-ca.pem
```

### 2. Caddyfile 生产硬化配置

在 `deploy/Caddyfile` 中锁定端口与 TLS 客户端校验：

```caddy
:8088 {
    # 强制开启 mTLS 客户端证书核验
    tls {
        client_auth {
            mode require_and_verify
            trusted_ca_cert_file /etc/caddy/certs/cf-origin-pull-ca.pem
        }
    }

    # 安全响应头注入
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }

    # 买家端 SPA 静态资源与路由回退
    handle / {
        root * /srv/web
        try_files {path} /index.html
        file_server
    }

    # 管理后台 SPA
    handle_path /admin* {
        root * /srv/admin
        try_files {path} /index.html
        file_server
    }

    # API 反向代理到内部 FastAPI 容器
    handle /api/* {
        reverse_proxy app_api:8000 {
            header_up X-Real-IP {http.request.header.CF-Connecting-IP}
            header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}
            header_up X-Forwarded-Proto https
        }
    }
}
```

---

## 四、本地开发机（2GB 内存 / 2.5GB Swap）性能悬崖与防崩自救

与高配生产环境不同，团队的本地开发/测试节点配置极为苛刻：**2 核 CPU、2GB 物理内存、2.5GB 虚拟内存 Swap**。

在实际开发中，内存消耗的分布极其残酷：

| 进程 / 服务 | 常规 RSS 占用 | 峰值 RSS 占用 | 风险说明 |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16 + Redis 7** | 120 MB | 180 MB | 基础常驻开销，相对稳定 |
| **Claude Code 智能体 CLI** | 280 MB | 380 MB | Node.js 运行时 + 庞大上下文缓存 |
| **FastAPI 后端开发服务 (uvicorn)**| 80 MB | 140 MB | 代码热重载时有轻微内存泄漏 |
| **Vite 开发服务器 / vue-tsc** | 220 MB | 620 MB | TypeScript 复杂类型推导极度吃内存 |
| **pytest 后端测试（全套回归）** | 350 MB | **1.05 GB** | 加载所有 ORM 模型、加解密套件与临时数据表 |

> [!CAUTION] 性能悬崖（Memory Thrashing）的触发点
> 当空闲物理内存低于 **120 MB** 时，Linux 内核会开始强制将匿名内存换出到 Swap 分区。由于云主机虚拟磁盘随机读写 IOPS 受限，**磁盘 I/O 瞬间爆满达 100%，CPU 全部陷入 `iowait`，SSH 控制台直接假死掉线**！

### 1. `flock` 自锁死惨剧复盘与排查命令

如上一节所述，智能体曾误将常驻服务挂载在互斥锁下：

```bash
# 错误示范：绝对禁止将长周期服务置于 flock 互斥锁下！
flock .dev/heavy.lock ./scripts/dev.sh up
```

当后续命令卡住时，可以通过以下现场排查三板斧迅速定位并击杀挂起进程：

```bash
# 步骤 1：排查当前是谁占用了 .dev/heavy.lock 文件描述符
lsof .dev/heavy.lock
# 或者使用 fuser 命令：
fuser -v .dev/heavy.lock

# 输出示例：
# COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME
# uvicorn   18492 root    3wW  REG  253,1        0 786433 .dev/heavy.lock

# 步骤 2：强制击杀霸占文件锁的常驻守护进程
kill -9 18492

# 步骤 3：释放锁文件并重新清理锁状态
rm -f .dev/heavy.lock
```

### 2. Linux 内核 Swap 换页激进倾向调优

为了避免系统过早陷入疯狂的 Swap 磁盘置换，我们在开发机上调整了 Linux 虚拟内存子系统参数：

```bash
# 1. 降低 swappiness 倾向（默认 60，推荐改为 10，仅当物理内存极度紧张时才使用 swap）
sudo sysctl vm.swappiness=10

# 2. 降低目录项与 inode 缓存回收倾向，减少磁盘 I/O 颠簸
sudo sysctl vm.vfs_cache_pressure=50

# 3. 持久化到 /etc/sysctl.d/99-low-memory.conf
cat << 'EOF' | sudo tee /etc/sysctl.d/99-low-memory.conf
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
```

### 3. 多智能体开发安全工作流 SOP

为了杜绝内存崩溃与开发瘫痪，智能体在开发机必须严格遵守以下执行规范：

1. **先查内存，再开工**：
   ```bash
   free -m
   # 若 available < 300MB，严禁启动任何构建，先执行 ./scripts/dev.sh down 释放容器
   ```
2. **禁止本地跑全量测试套件**：
   本地只允许针对改动文件执行单文件验证：
   ```bash
   flock .dev/heavy.lock pytest -q tests/test_orders.py
   ```
3. **前端检查轻量化**：
   使用增量构建模式，避免并发执行 `pnpm build`。

---

## 阶段小结

本节从生产宿主机日本 IIJ 物理机 LXD 容器 (`c4-desktop`) 到开发机 2GB 内存极限场景，系统梳理了容器嵌套虚拟化与内存瓶颈攻防：
* **生产侧**：通过 LXD 5.21 现代化升级与 `security.nesting` 内核参数，打通了安全的 Docker-in-LXD 链路，并结合 Cloudflare AOP 实现了源站零暴露；
* **开发侧**：通过 `flock` 锁边界界定、`vm.swappiness=10` 虚拟内存调优与云端 CI 分流，让低配服务器依然能够顺畅支撑起复杂的全栈工业级研发。

在下一节中，我们将带来专栏的收官之作——**《开发与生产环境终极运维命令手册（Cheat Sheet）》**，一网打尽双环境所有实战指令！