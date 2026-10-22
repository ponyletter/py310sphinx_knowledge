# 16 启动命令、后台开关与受控验收

## 日常启动顺序

已有实例用 systemd 托管，不要在 tmux 再启动第二个 worker。先检查桌面和 Chrome，再检查数据库及应用。

```bash
systemctl start xianyu-monitor-display xianyu-monitor-desktop xianyu-monitor-chrome xianyu-monitor-rdp
systemctl start xianyu-monitor-web xianyu-monitor-worker
XVM_ENV_FILE=/etc/xianyu-monitor/monitor.env \
 /root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor check-config
```

Web 的绑定地址必须动态核实。案例只绑定板子的局域网地址，`curl 127.0.0.1:8080` 可能拒绝连接，不能据此断言服务停止：

```bash
ss -ltnp | grep ':8080'
# 用实际监听地址替换下面的 RFC5737 示例地址
curl -fsS http://192.0.2.114:8080/healthz
```

`web=ok, worker=fresh` 证明后台和最近心跳，不代表闲鱼登录或发送权限一定正常，还应检查最后识别状态、回复暂停原因、配置与当前截图。

## 后台启用顺序

历史基线 → 正式监控 → 配置 SMTP 并只发一封受控测试邮件 → 规则测试器 → 仅审核演练 → 自动模式＋真实发送开关 → 图片开关及规则发图标记。异常暂停是另一道门；即使 auto 已开，旧的布局暂停也会阻止发送。

本轮实测就发现自动开关已开，但旧 layout_mismatch 暂停仍在。先用新截图核实尺寸、锚点和安全提示正常，再按店主授权解除暂停；没有重发历史 uncertain 任务。

## 实际验收记录（源码 f909acb）

|场景|任务|从任务建立到完成|接收端与程序证据|
|---|---:|---:|---|
|问候文字＋默认图|38|68 秒|先文字、仅一张图；文字与图片均 sent_verified；F5 返回成功|
|返回后再次发在售咨询|39|34 秒|收到文字、无新增图；sent_verified；再次 F5 返回|

文字执行分别 33.519／30.898 秒；第一项图片选择后的验证 22.3 秒。不同阶段有不同起点，不能相加后与任意“总耗时”直接比较。本轮无新增邮件任务、待审核项或错误暂停；价格规则仍需审核。

以上是已完成的案例快照，不能代表此刻在线状态，也不覆盖旧图滚动、所有突发消息和登录过期。客户昵称、邮箱与真实帧不进入公开文档。

**交付**：测试起点的 event／intent／job 水位、接收端确认、三项发送结果、健康检查和耗时。
