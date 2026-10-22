# 18 tmux、日志、更新、备份和故障恢复

## tmux 是操作台，systemd 是守护者

案例会话为 `xianyu-monitor`，窗口是 status、worker-log、web-log、manage。断开 SSH 不会停止 systemd；tmux 窗口退出也不应影响托管服务。

```bash
tmux attach -t xianyu-monitor
tmux list-windows -t xianyu-monitor
journalctl -u xianyu-monitor-worker --since '10 minutes ago' --no-pager
journalctl -fu xianyu-monitor-worker
journalctl -fu xianyu-monitor-web
```

新机器没有会话时可创建操作台，但不要在其中执行第二个 `worker`：

```bash
tmux new-session -d -s xianyu-monitor -n status
tmux new-window -t xianyu-monitor -n worker-log 'journalctl -fu xianyu-monitor-worker'
tmux new-window -t xianyu-monitor -n web-log 'journalctl -fu xianyu-monitor-web'
tmux new-window -t xianyu-monitor -n manage
```

## 有证据地更新

先检查 Git 工作区、部署提交、CI 和是否有进行中的不可逆任务；备份私密配置、活动校准和数据库。`git pull` 不能证明运行进程已经加载新代码。

```bash
cd /root/02project/01xianyumonitor
git status --short
git rev-parse HEAD
git fetch origin main
git log --oneline HEAD..origin/main
# 完成差异审查、CI 检查和运行任务检查后才继续
systemctl stop xianyu-monitor-worker xianyu-monitor-web
git merge --ff-only origin/main
# 非 editable 安装需按固定依赖重新安装；不要临时升级全部依赖
systemctl start xianyu-monitor-web xianyu-monitor-worker
```

失败时先恢复服务或已验证的发布目录；涉及迁移时必须单独设计数据库回滚。不要用 `git reset --hard` 掩盖用户未提交修改，也不要回放 uncertain 历史任务。

## 恢复查表

|症状|先查|动作|
|---|---|---|
|没有回复|reply mode、真实发送、图片开关、pause、规则审核和冷却|看具体原因，修复后由店主恢复|
|layout_mismatch|显示号、实际尺寸、Chrome 全屏／缩放、锚点|恢复原布局或重新校准|
|文字已发，图片未核实|是否已经 Open、上传等待、匹配与预览证据|查接收端，先不重选图片|
|回车后长期停留|return_to_list 结果、草稿、未知目标或对话框|不能靠点击系统会话解决|
|后台 fresh 但没新消息|专用 Chrome 是否被遮挡或登录过期|核对当前截图|
|MySQL 不可用|1Panel 原容器、端口、应用账号和磁盘|恢复现有实例，不重装或清空|

备份用私密客户端配置或交互口令，避免命令行密码；数据库 dump、Chrome profile、Xauthority、截图均按敏感数据保管。恢复演练使用隔离库，不对生产执行清表测试。

**交付**：一个值班手册：检测、止损、核实、恢复、受控验收、复盘各有记录。
