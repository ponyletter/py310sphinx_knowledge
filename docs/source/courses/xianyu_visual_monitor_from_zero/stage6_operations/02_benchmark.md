# 17 用 --reference 做公平的板上基准

## 正匹配帧必须真的看得到参考图

“两种算法都返回 None”也会令一致性为 true，因此必须确认参考图片在 profile 的 `message_pane` 内可见，并检查 `image_match_found=true`。不能只凭帧文件名判断，也不要为了基准向客户再次发图。

准备私密 frame.png、校准 profile.json 和原始参考图片。下列是独立计时示例：先确认没有正在发送的任务，在后台暂停新回复，再停止 worker，避免 CPU 争用。记录原状态，完成后按原状态恢复；命令不会替你判断是否处于 typing／上传阶段。

```bash
sudo systemctl stop xianyu-monitor-worker
trap 'sudo systemctl start xianyu-monitor-worker' EXIT
cd /root/02project/01xianyumonitor
XVM_ENV_FILE=/etc/xianyu-monitor/monitor.env \
 /root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor benchmark \
 --processes --profile /private/profile.json /private/image-visible.png \
 --reference /usr/local/share/xianyu-monitor/images/01problem_pic.png \
 > /private/benchmark.json
```

`/private` 是需要替换的示意目录，不是项目自动创建的路径；目录先设 0700，报告文件设 0600。使用同一个帧、profile、参考图和版本对比，记录是否有并行测试、温度和 CPU 状态。

## 实测结果

RK3588、1280×1440、pane 650×272，OCR 子进程 CPUs 4–7、4 线程。以下是两次隔离测量，匹配器代码相同：

|指标|main fd3eea8|增强基准复核|
|---|---:|---:|
|image_match_exhaustive_ms|15295.8|15360.2|
|image_match_fast_cold_ms|1957.7|1991.4|
|image_match_fast_warm_ms|833.1|842.6|
|image_match_found|true|true|
|image_match_identical|true|true|
|image_match_cold_identical|未单列|true|
|image_match_warm_identical|未单列|true|

第二列扩展工具最终合并为 PR26／f909acb。原 CLI 计时热缓存调用却丢弃结果，而且后续帧继承缓存却标作 cold。修复后每帧清空缩略图缓存，分别核对两种状态下框位置和得分，再形成 aggregate identical。

缓存列表分析约 49.5ms、会话分析约 15.6ms；首次列表约 6.46s，完整安全 OCR 约 9.07s。0.84 秒是**单次图片匹配**，不是端到端文图发送。数据来自一个真实帧，不能推导所有输入均准确或同速。

## 下一步优化

#23 先统计识别器直读与低置信度检测回退的次数／耗时，再 opt-in 对比输入尺寸；#24 的 NPU 是影子对照设计，尚未启用。既有板子驱动 v0.9.6、librknnrt 1.6.0，既定方案要求工具链与运行库版本相匹配，不能直接套用最新 2.x 模型。

**交付**：只包含耗时、版本、几何尺寸和一致性布尔值的脱敏报告；私密帧留在本地。
