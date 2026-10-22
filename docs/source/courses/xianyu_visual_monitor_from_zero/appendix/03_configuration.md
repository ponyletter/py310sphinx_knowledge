# C 当前案例配置表与下载模板

## 静态资源映射（案例快照）

|类别|案例值|
|---|---|
|源码|`/root/02project/01xianyumonitor`|
|Conda|`/root/miniconda3/envs/xianyu-monitor`|
|静态 env|`/etc/xianyu-monitor/monitor.env`，root:xvm，0640|
|数据|`/var/lib/xianyu-monitor`|
|worker／Web|`xianyu-monitor-worker`／`xianyu-monitor-web`|
|显示／授权|`:20`／`/home/xy-monitor/.Xauthority`|
|桌面用户／Chrome|`xy-monitor`／`/home/xy-monitor/chrome-profile`|
|共享图片|`/usr/local/share/xianyu-monitor/images/01problem_pic.png`，0644|
|MySQL|现有 1Panel 容器，宿主 3306，独立应用库和账号|
|tmux|`xianyu-monitor`，四个操作窗口|

## 校准坐标（仅帮助理解，不能直接激活）

所有框使用 `(left, top, right, bottom)`，右下边界按图像裁剪习惯处理。分辨率相同仍需核对字体、主题、缩放与系统色深。

|区域|案例坐标|
|---|---|
|frame|1280×1440|
|conversation_list|120,166,449,1389|
|row|left121、right448、first_top166、height68、count18|
|title|462,124,862,153|
|最近 message_pane|450,970,1100,1242|
|完整可见上下文候选|450,250,1100,1242；当前不等于已实现上下文记忆|
|composer／点击|457,1280,1042,1335／732,1300|
|image attach 点击|516,1264|
|dialog title|490,363,800,389|
|dialog path|240,395,1196,425|
|dialog confirm／点击|1138,1009,1188,1036／1148,1022|
|incoming color|232,240,240，tolerance4|
|outgoing color|248,228,8，tolerance30|
|image_match_threshold|0.92|

活动 profile 还需要锚点等字段，不应把此表拼成缺字段 JSON 后直接覆盖生产校准。提供的 {download}`公开起步校准示例 <../_examples/calibration.example.json>` 来自源码，**不是当前板子的完整活动 profile**。

## 运行设置快照

案例启用 active、auto、真实发送与图片发送，dry_run=false。问候与首次欢迎配置发图；在售、物流、资料只发文字，价格保留审核。debounce3秒；规则冷却60秒（首次欢迎3600秒）；测试时客户每日上限30。不要把这些案例值当作通用最优默认。

系统会话排除名称：闲小蜜、闲鱼小助手、闲鱼助手、系统通知、官方通知、闲鱼官方。排除名单用于不监控／不回复，不能作为“自动点击这些会话”的导航名单。

## 示例下载

- {download}`静态 env 模板 <../_examples/monitor.env.example>`：无凭据；显示号等需按本机修改。
- {download}`规则 JSON 模板 <../_examples/rules.example.json>`：源码示例，默认停用。
- {download}`校准 JSON 模板 <../_examples/calibration.example.json>`：仅起步参考。

真实 SMTP、数据库、SSH、桌面和后台密码，以及 Xauthority 和 Chrome 登录目录另存私密运维材料，课程不提供。不要通过 `cat monitor.env` 截图或复制到 issue 来排障。
