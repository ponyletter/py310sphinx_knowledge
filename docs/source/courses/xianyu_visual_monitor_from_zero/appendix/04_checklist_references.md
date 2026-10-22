# D 交付验收、术语与参考

## 一张交付检查表

- [ ] 固定源码 commit、依赖与 ABI；核对导入路径与 systemd 生效配置。
- [ ] 复用现有数据库，应用库／账号独立，备份恢复在隔离环境验证。
- [ ] 独立显示与 Chrome profile；断开 RDP 后仍采集，登录和验证码由人完成。
- [ ] 重新校准尺寸、行、颜色、输入框、锚点与图片对话框。
- [ ] 历史基线定义明确，可见首屏不冒充完整客户历史。
- [ ] 首次无红点 → 后续来信补提醒；重启后保持唯一。
- [ ] 发出文字、失败图标、完整草稿、连续来信、草稿保留均有测试。
- [ ] 文图发送核对接收端顺序及张数；不确定上传不自动重选。
- [ ] F5 返回单独有证据，系统会话不被点击。
- [ ] benchmark 正匹配、冷／热缓存、结果一致性与端到端耗时分别列明。
- [ ] 公开内容不含秘密、真实客户图／原始 HTML；保留源码许可证。
- [ ] 多账号与模型客服标明设计状态，未覆盖边界列入交付说明。

## 术语速查

|术语|本课含义|
|---|---|
|baseline|启用前已知客户基线，不自动等于平台全部历史|
|incoming／outgoing|有证据的来信／发出方向|
|possible|画面变化存在但方向证据不足|
|read_elsewhere|其他端已读或角标下降，非新增来信|
|intent|某个触发事件的持久化回复意图|
|outbox|数据库中的待执行任务箱|
|lease|有期限的执行权，不是平台账号登录态|
|superseded|被较新来信替代，区别于发送失败|
|uncertain|副作用可能发生但无法核实，需人工查证|
|sent_verified|程序看到所要求的证据；不等同平台官方送达回执|
|exact cache|相同模式与精确像素才复用的 OCR 缓存|
|oracle|供对照的穷举实现，而非更快算法自己的返回值|
|shadow mode|CPU 等既有路径仍权威，新后端只对照记录|
|control plane|配置、权限和健康管理面|
|execution plane|实际采集、输入与核验的执行面|

## 一手资料与证据来源

1. [项目固定版本](https://github.com/stackoracode/xianyu-visual-monitor/tree/f909acb4217231a7839429b532b20a0b4e4441a7)：源码、测试、MIT 许可与部署模板。
2. [PR20](https://github.com/stackoracode/xianyu-visual-monitor/pull/20)、[PR26](https://github.com/stackoracode/xianyu-visual-monitor/pull/26)、[板上报告25](https://github.com/stackoracode/xianyu-visual-monitor/issues/25)：性能改动与实测；真实帧未进入本课程。
3. [问题21](https://github.com/stackoracode/xianyu-visual-monitor/issues/21)、[22](https://github.com/stackoracode/xianyu-visual-monitor/issues/22)、[23](https://github.com/stackoracode/xianyu-visual-monitor/issues/23)、[24](https://github.com/stackoracode/xianyu-visual-monitor/issues/24)：快照版本的后续工作。
4. [ONNX Runtime 线程管理](https://onnxruntime.ai/docs/performance/tune-performance/threading.html)：线程参数与调度解释，不代替特定板子的测量。
5. [systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)：单元与 ExecStart 语义；老系统以本机支持项为准。
6. [Ansible 执行策略](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_strategies.html)：分批管理语义，课程只给未来编排设计。
7. [Sphinx directives](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html)：课程导航与源码引用。

案例运维和收讫数据来自作者本地私密验收记录：文图任务38、文字任务39。只转述耗时、状态和用户确认，不分发客户昵称、邮箱、私密截图或原始日志。
