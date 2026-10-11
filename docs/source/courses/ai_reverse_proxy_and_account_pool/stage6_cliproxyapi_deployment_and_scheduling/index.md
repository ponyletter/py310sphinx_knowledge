# 阶段六：CLIProxyAPI 核心网关部署与动态调度

欢迎进入《阶段六：CLIProxyAPI 核心网关部署与动态调度》。

在构建海外大模型服务池的核心工程中，**CLIProxyAPI** 扮演着类似“微服务服务网格（Service Mesh）与网关调度器”的角色。它负责对外暴露标准 OpenAI / Claude 兼容的 HTTP 接口，对内管理数个、数十个甚至上百个 Plus / Free 账号的生命周期、Token 自动刷新、并发限流规避以及故障隔离。

本阶段深入真实生产环境，从容器编排配置、核心参数 `config.yaml` 逐行深度剖析，到 Linux Inotify 增量热重载机制与全自动化接口测试，提供全链路实战指导。

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_cliproxyapi_architecture_and_compose
02_config_yaml_deep_dive
03_hot_reload_and_priority_load_balance
04_full_verification_commands_suite
05_web_management_dashboard_and_operations
```

```{seealso}
**拓展架构延伸**：关于如何将 CLIProxyAPI (CPA) 接入上层统一模型总网关（FreeLLMAPI）、与 OpenRouter BYOK 免抽成通道、低价开源推理商（DeepInfra / Novita / SiliconFlow）以及全栈 Agent 框架（Mastra / LangGraph / MCP）联合构建多级故障降级与成本压降体系，请参阅极客手记专栏：[【实战对话】FreeLLMAPI 统一大模型总网关架构与 Agent 全栈选型指南](../../geek_notes_and_ai_dialogues/stage2_llm_dialogues_and_prompts/22_case_freellmapi_unified_gateway_cpa_openrouter_and_agent_frameworks.md)。
```

