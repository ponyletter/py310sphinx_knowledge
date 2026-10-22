# 15 配置分层、systemd 与权限

## 静态配置在 env，运行开关在数据库

`Settings` 从 `XVM_` 环境读取，`XVM_ENV_FILE` 提供私密文件，真实进程环境覆盖文件值。规则、正式模式、自动／审核、图片路径和发送开关由数据库中的运行设置管理。给 env 随意添加 `XVM_REPLY_MODE=auto` 并不会取代后台运行设置。

```ini
# 示例，必须填写私密值后才能使用，禁止提交填写后的版本
XVM_ENV=production
XVM_DATABASE_URL=mysql+aiomysql://xvm:CHANGE_ME_DB_PASSWORD@127.0.0.1:3306/xianyu_monitor?charset=utf8mb4
XVM_SECRET_KEY=CHANGE_ME_RANDOM_SESSION_KEY
XVM_DATA_DIR=/var/lib/xianyu-monitor
XVM_WEB_HOST=127.0.0.1
XVM_WEB_PORT=8080
XVM_CAPTURE_DISPLAY=:20
XVM_CAPTURE_XAUTHORITY=/home/xy-monitor/.Xauthority
XVM_INPUT_BACKEND=xdotool
XVM_INPUT_TEXT_METHOD=clipboard
XVM_OCR_BACKEND=rapidocr
XVM_OCR_WORKERS=1
XVM_OCR_USE_PROCESSES=true
XVM_OCR_CPU_AFFINITY=auto
XVM_OCR_THREADS=0
XVM_OCR_CACHE_SIZE=4096
XVM_SMTP_HOST=smtp.example.com
XVM_SMTP_PORT=465
XVM_SMTP_SECURITY=ssl
XVM_SMTP_USERNAME=sender@example.invalid
XVM_SMTP_PASSWORD=CHANGE_ME_SMTP_PASSWORD
XVM_SMTP_FROM=sender@example.invalid
XVM_NOTIFY_TO=owner@example.invalid
```

邮箱端口和加密方式应来自实际服务商配置，示例不代表案例账号的真实参数。数据库 URI 的特殊字符需 URL 编码。先生成至少 32 字符随机会话密钥，再将私密文件设为 root:xvm 0640，父目录限制访问。

## 已部署实例以实际生效单元为准

```bash
systemctl cat xianyu-monitor-worker xianyu-monitor-web
systemctl show xianyu-monitor-web xianyu-monitor-worker \
 -p User -p Group -p ExecStart -p WorkingDirectory -p ProtectHome
```

案例核对：工作目录 `/root/02project/01xianyumonitor`，两服务调用 `/root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor`；Web 用 `xvm`、`ProtectHome=read-only`，worker 用 root、`ProtectHome=no`。`/root` 仅给 xvm 穿越 ACL，应用及解释器目录本身具备读取／执行权限。

`ProtectHome=read-only` 不会绕过 Unix 权限。新实例若沿用 `/root`，需要最小必要 ACL 并验证完整路径，不能把 `/root` 改成全员可读。长期产品化可把只读程序和环境移到 `/srv`，但这属于另一次有验收的迁移。

下面是**新建覆盖文件的示例片段**，不是要求覆盖已部署实例全部 drop-in：

```ini
[Service]
WorkingDirectory=/root/02project/01xianyumonitor
ExecStart=
ExecStart=/root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor worker
EnvironmentFile=/etc/xianyu-monitor/monitor.env
ProtectHome=false
```

Web 使用对应 `web --workers 2` 命令、`User=xvm` 和 `ProtectHome=read-only`。替换 ExecStart 前先用空值清除旧值，语义见 [systemd.service 官方文档](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)。Ubuntu 20.04 上以本机 `man` 和 `systemd-analyze verify` 支持项为准。

```bash
systemctl daemon-reload
systemctl restart xianyu-monitor-web xianyu-monitor-worker
systemctl is-active xianyu-monitor-web xianyu-monitor-worker
```

案例 Docker 已有本地出站代理 drop-in，并针对缺少 raw 表配置 `DOCKER_INSECURE_NO_IPTABLES_RAW=1`。这是特定板子内核兼容措施，不能当作所有部署默认设置；课程不要求重装 Docker 或改动已有 1Panel 容器。

**交付**：静态／运行设置对照表、生效单元、权限检查和重启后的健康证据。
