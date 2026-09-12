# 02. Ubuntu 生产基线安全加固与 Docker 环境实操

为了防止反代中转站被扫描器恶意探测或遭受暴力破解，必须对新安装的 Linux（推荐 Ubuntu 22.04 / 24.04 LTS）实施标准生产加固。

---

## 一、系统更新与基础工具链

```bash
# 1. 更新软件包源并升级现有组件
sudo apt update && sudo apt upgrade -y

# 2. 安装生产必备系统工具
sudo apt install -y curl wget git jq htop ufw ca-certificates gnupg lsb-release
```

---

## 二、UFW 防火墙安全端口隔离策略

````{admonition} 端口暴露安全准则
:class: important

反代中转引擎（如 CLIProxyAPI 的 `8317` 端口）**绝不能直接向全公网 `0.0.0.0` 裸奔开放**，否则极易遭到黑客针对性穷举 API-Key 或发动 DDoS 攻击。
**正确的生产规范**：`8317` 端口只监听本地 `127.0.0.1`，仅通过 Nginx 反向代理配合 SSL/TLS 对外服务。
````

```bash
# 1. 默认拒绝所有入站流量，允许所有出站流量
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. 放行 SSH 远程登录端口 (若修改过端口，请替换 22)
sudo ufw allow 22/tcp comment 'SSH'

# 3. 放行 Web 流量 (Nginx 反向代理与 SSL 证书申请)
sudo ufw allow 80/tcp comment 'HTTP Let Encrypt'
sudo ufw allow 443/tcp comment 'HTTPS'

# 4. 启用防火墙并查看状态
sudo ufw enable
sudo ufw status verbose
```

---

## 三、Docker CE 与 Docker Compose 官方最新源极速部署

坚决避免使用系统自带的过期旧版 Docker。遵循官方规范添加 GPG 密钥与源：

```bash
# 1. 创建密钥管理目录
sudo install -m 0755 -d /etc/apt/keyrings

# 2. 引入 Docker 官方官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. 添加 Docker 软件源
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. 安装 Docker 核心引擎与 Compose 插件
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. 启动服务并配置开机自启
sudo systemctl enable --now docker

# 6. 验证安装版本
docker --version
docker compose version
```

输出若显示类似于 `Docker version 27.x.x` 及 `Docker Compose version v2.x.x`，说明底层运行环境已完美就绪！
