# 13 ARM64、Conda 和 1Panel MySQL 复用

## 先盘点，再安装

案例硬件为 RK3588／ARM64，Ubuntu 20.04.6、glibc 2.31。系统 Python 3.8 不适合直接运行本项目；应用使用 Conda Python 3.10。镜像或 wheel 必须同时匹配 CPU 架构、Python ABI 和 glibc。

```bash
uname -m
getconf GNU_LIBC_VERSION
cat /etc/os-release
docker version
docker compose version
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
/root/miniconda3/bin/conda env list
```

案例应用源码在 `/root/02project/01xianyumonitor`，环境在 `/root/miniconda3/envs/xianyu-monitor`。不要重新创建已删除的 `/opt/xianyu-monitor/src` 和 `/opt/xianyu-monitor/env`。仓库部分旧说明仍使用 `/opt`，它是另一部署布局，不应与本案例混搭。

## 新实例安装顺序

以下仅用于**尚未部署的新实例**；已有板子直接阅读运维章节。先有可信 ARM64 Conda，后创建环境、克隆和安装固定依赖。生产机器不从不明下载源安装解释器。

```bash
/root/miniconda3/bin/conda create -n xianyu-monitor python=3.10 -y
git clone https://github.com/stackoracode/xianyu-visual-monitor.git /root/02project/01xianyumonitor
cd /root/02project/01xianyumonitor
/root/miniconda3/envs/xianyu-monitor/bin/python -m pip install -r requirements/ocr.txt
/root/miniconda3/envs/xianyu-monitor/bin/python -m pip install --no-deps -e .
```

`-e .` 是可编辑安装，源码变更会在进程重新导入后生效；普通 wheel 安装则必须重新安装。两种模式都要在服务重启前核对路径：

```bash
/root/miniconda3/envs/xianyu-monitor/bin/python -c \
 'import xianyu_monitor; print(xianyu_monitor.__file__)'
```

## 复用已有 MySQL，不重装数据库

1Panel 已有 MySQL 8.0.45 容器 `1Panel-mysql-ly5i`，映射本机 3306。创建独立应用库和最小权限用户，不修改其他库，不清空数据卷。管理员密码与应用数据库密码分开。

```bash
docker exec -it 1Panel-mysql-ly5i mysql -uroot -p
```

在交互 SQL 会话中根据私密随机值初始化；不要把填写后的 SQL 放入 Git。若库／用户已存在，先查询而不是重复执行创建语句。

```sql
CREATE DATABASE xianyu_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xvm'@'%' IDENTIFIED BY '<私密随机应用密码>';
GRANT ALL PRIVILEGES ON xianyu_monitor.* TO 'xvm'@'%';
```

`%` 是数据库来源匹配，不代表应开放公网 3306；还需主机防火墙和网络边界。容器内客户端来源可能是桥接网关，不能以为宿主 `127.0.0.1` 必然对应 MySQL 的 `'localhost'`。

确认私密 env 配好后运行迁移与管理员创建；它们不是清空数据库操作，但升级前仍应备份。

```bash
XVM_ENV_FILE=/etc/xianyu-monitor/monitor.env \
 /root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor migrate
XVM_ENV_FILE=/etc/xianyu-monitor/monitor.env \
 /root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor create-admin --username owner
```

**交付**：架构／ABI 清单、独立应用库、可验证的迁移版本与解释器路径；不交付任何明文凭据到公开课程。
