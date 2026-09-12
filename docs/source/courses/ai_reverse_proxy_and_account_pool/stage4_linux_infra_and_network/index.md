# 阶段四：海外 Linux 节点选型与环境加固

欢迎进入《阶段四：海外 Linux 节点选型与环境加固》。

反代中转引擎的稳定性，底层完全依赖于宿主机所在的**海外 VPS 网络质量、IP 纯净度以及系统级安全加固**。如果 VPS 的出口 IP 早就被 OpenAI 列入滥用黑名单，那么无论使用多么优质的 Plus 账号，每次调用都会遭遇频繁拦截或验证码死锁。

本阶段系统讲解海外 VPS 选型（原生 ISP IP vs 广播数据中心 IP）、一键 IP 纯净度与欺诈分检测脚本实操，并带您完成 Ubuntu 生产级安全初始化、TCP BBR 内核加速与 Docker CE 安全容器化部署。

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_vps_selection_and_clean_ip_check
02_ubuntu_hardening_and_docker_setup
```
