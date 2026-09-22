# 阶段二：大模型深度对话、Agent 协同与使用技巧

本阶段专门用于归档与各类前沿大模型（Claude、Codex、Gemini、DeepSeek、GPT 等）交互过程中产出的**高价值对话、多轮推演记录、有效 Prompt 模板，以及高阶使用技巧与双工具协同工程实践**。

很多复杂工程与架构难题往往在 Agent 的自主推进与多模型交叉验证中得以破局，及时沉淀工作流与方法论能有效构筑个人与团队的“外部数字第二大脑”。

---

## 📑 阶段核心模块全景

| 序号 | 篇目主题 | 核心实战重点与特色 | 实操者 / 标杆模型 | 形式与交付物 |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | [高质量对话记录模板](01_dialogue_template.md) | 标准对话归档规范、背景/提问/推演/落地四步法 | 通用工程模板 | 规范结构卡片 |
| **2.2** | [Claude Code 与 Agent 协同实录](02_claude_code_and_agents.md) | 复杂工程跨模块重构、多文件感知与工具调用（Tool Use） | Claude Code CLI | 交互流转图 + 案例 |
| **2.3** | [实用 Prompt 工程与实战案例](03_prompt_engineering_records.md) | 针对性提示词调优、少样本（Few-shot）与防御性约束 | 提示词工程库 | 可复用 Prompt |
| **2.4** | [主流大模型速度与成本全景横评](04_llm_speed_cost_benchmarks_and_tiered_workflow.md) | Pareto 前沿、吞吐速度对比与分层模型协作架构（Flash / MoE） | Gemini / DeepSeek / Claude / GPT | 实测对比表 + 分层架构 |
| **2.5** | [【案例精选】七天烧 230 亿 Token：50 条 Codex 高阶实践](05_case_linghufeng_23b_tokens_codex_practices.md) | AI Native 心智跃迁、破除省 Token 陷阱、Plan 模式规范、TDD 驱动与失败反例库 | 令狐峰（航海家） | 50 条工程法则 + 体系解构 |
| **2.6** | [【案例精选】Claude Code × Codex 双工具协作与 Mac 目录规范](06_case_yiren_claude_code_codex_collaboration_backup.md) | 仓库为脑工具为手、Mac 标准目录拓扑、软链接统一规范、/pickup 与 /handoff 交接仪式、一支笔防踩踏 | 亦仁（生财有术） | 双工具协同 SOP + 容灾演练 |

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_dialogue_template
02_claude_code_and_agents
03_prompt_engineering_records
04_llm_speed_cost_benchmarks_and_tiered_workflow
05_case_linghufeng_23b_tokens_codex_practices
06_case_yiren_claude_code_codex_collaboration_backup
```

```{important}
**使用建议**：
1. **常规突破性对话**：导出文本并使用 `01_dialogue_template.md` 归档。
2. **高强度高阶开发**：深度参考令狐峰的 **50 条高强度实践法则**（[2.5 章节](05_case_linghufeng_23b_tokens_codex_practices.md)）转变心智；结合亦仁的 **双工具协作与交接 SOP**（[2.6 章节](06_case_yiren_claude_code_codex_collaboration_backup.md)）杜绝代码冲突与账号单点故障。
```
