# B 源码索引、版本与许可证

## 真实代码与教学设计的界限

`_code/` 文件直接取自项目 commit `f909acb4217231a7839429b532b20a0b4e4441a7`，不是从生产数据库导出。它们保留原模块结构，供 `literalinclude` 阅读，不会在 Sphinx 构建时启动应用。

|文件／对象|阅读问题|位置|
|---|---|---|
|`detection/tracker.observe`|什么算来信、已读和未知方向|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/detection/tracker.py)|
|`detection/identity`|昵称与头像如何处理冲突|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/detection/identity.py)|
|`worker/pipeline`|首次通知资格如何延后补建|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/worker/pipeline.py)|
|`replies/rules.evaluate`|匹配、审核、否定与敏感项|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/replies/rules.py)|
|`replies/planner`|新来信如何取消未输入旧任务|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/replies/planner.py)|
|`replies/executor`|目标、草稿、发送与返回如何分离|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/replies/executor.py)|
|`replies/images`|Open、上传与失败如何核实|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/replies/images.py)|
|`vision/analyzer`|裁剪、缓存、锚点和安全探测|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/vision/analyzer.py)|
|`vision/reply_image`|穷举 oracle 与快速匹配|[源码](https://github.com/stackoracode/xianyu-visual-monitor/blob/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/vision/reply_image.py)|
|`ocr/pool`、`ocr/base`|精确缓存、进程与 OCR 回退|[源码目录](https://github.com/stackoracode/xianyu-visual-monitor/tree/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor/ocr)|
|`queueing/jobs`、`models`|任务租约、唯一索引和状态|[源码目录](https://github.com/stackoracode/xianyu-visual-monitor/tree/f909acb4217231a7839429b532b20a0b4e4441a7/src/xianyu_monitor)|

本地冻结文件列表、来源和 SHA256 见 {download}`源码清单 <../_code/manifest.json>`；分发说明见 {download}`MIT LICENSE <../_code/LICENSE.txt>`。

## 可复查的工程演进

|阶段|版本／PR|解决的问题|
|---|---|---|
|首次提醒与安全发送|PR6|首次无角标后的补提醒、完整草稿及失败图标|
|连续来信|PR8|旧任务 superseded、选中会话的可见来信|
|刷新闭环|PR10、14、18|发送后 F5、短气泡、换行文字、返回与发送分离|
|文图功能|PR11、12、13、15|文字先行、慢上传、GTK Open、路径焦点|
|桌面隔离|案例部署记录|独立用户、Xvnc、Chrome profile 与 RDP|
|性能|PR20／fd3eea8|精确缓存、绑核、向量化、匹配器|
|基准校验|PR26／f909acb|冷／热结果分别对照，逐帧冷缓存|

源码修改应配对应状态回归、板上基准或受控验收。冻结源码不是发布包，更新课程快照时应同步 manifest 与教学引用，不能只替换一两个文件后仍声称整个目录来自同一个 commit。

## 离线源码下载

这些是教学快照，不构成独立可安装的软件包。

- {download}`detection/tracker.py <../_code/detection/tracker.py>`
- {download}`detection/identity.py <../_code/detection/identity.py>`
- {download}`worker/pipeline.py <../_code/worker/pipeline.py>`
- {download}`replies/rules.py <../_code/replies/rules.py>`
- {download}`replies/planner.py <../_code/replies/planner.py>`
- {download}`replies/executor.py <../_code/replies/executor.py>`
- {download}`replies/images.py <../_code/replies/images.py>`
- {download}`vision/analyzer.py <../_code/vision/analyzer.py>`
- {download}`vision/reply_image.py <../_code/vision/reply_image.py>`
- {download}`ocr/base.py <../_code/ocr/base.py>`
- {download}`ocr/pool.py <../_code/ocr/pool.py>`
- {download}`queueing/jobs.py <../_code/queueing/jobs.py>`
- {download}`models.py <../_code/models.py>`
- {download}`cli.py <../_code/cli.py>`
- {download}`settings.py <../_code/settings.py>`
- {download}`runtime_settings.py <../_code/runtime_settings.py>`
