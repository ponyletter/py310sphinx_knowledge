# 阶段四：Linux 生产基建与网络环境调优

欢迎进入《阶段四：Linux 生产基建与网络环境调优》。

反代中转引擎的稳定性，底层完全依赖于宿主机所在的**海外 VPS 网络质量、IP 纯净度以及系统级安全加固**。如果 VPS 的出口 IP 早就被 OpenAI 列入滥用黑名单，那么无论使用多么优质的 Plus 账号，每次调用都会遭遇频繁拦截或验证码死锁。

本阶段将系统讲解海外 VPS 选型（原生 IP vs 广播 IP）、一键 IP 纯净度与流媒体解锁检测脚本实操，并带您完成 Ubuntu 生产级安全初始化、Docker CE 与 Docker Compose 官方最新源部署。

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_vps_selection_and_clean_ip_check
02_ubuntu_hardening_and_docker_setup
```
