# 阶段七：桌面客户端、多机 SSH 容灾与故障排查

欢迎进入《阶段七：桌面客户端、多机 SSH 容灾与故障排查》。

搭建完成高可用的海外 AI 账号池与反向代理网关后，最关键的一步是将这套强大的 AI 推理能力以最高可用度、抗干扰且合规的方式交付给实际生产力工具与业务系统：

1. **跨平台桌面号池客户端与 IDE 桥接**：基于开源项目打造的 `ToAPI Proxy`（覆盖 Mac/Windows），支持一键导入 VSCode 凭据或邮箱验证码登录，轻松桥接 Claude Code 与 Antigravity (AGY)，在本地直接调度 GPT-5.4 等满血模型；
2. **多海外 VPS + SSH 隧道 + 国内中枢高可用容灾**：多台海外 VPS 节点通过原生高强度 SSH 隧道回传国内中枢，配置本地故障自动转移，免域名、免备案、防端口扫描，为下游业务提供永不掉线的企业级服务网格；
3. **全链路运维监控与故障反推上游诊断表**：深度总结日志特征，独家揭秘如何根据 401、429、Tool Use 异常、回答风格突变等故障信号，反推中转商是否暗中掺水降级或层层转包。

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_antigravity_agy_integration
02_miniapp_fullstack_connection
03_ops_monitoring_and_troubleshooting
```
