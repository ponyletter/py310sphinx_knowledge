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
| **2.7** | [【案例精选】一个人指挥一群 Codex：多窗口 Worktree 并行工程流](07_case_lixiangjun_codex_worktree_multiwindow.md) | 主控拆解 Spec/Task、串行打地基、三套独立界面 Worktree 并发、防顺手改与专门集成窗口 | 李香君（资深工程师） | 拆/隔/并/收 四步工作流 |
| **2.8** | [【案例精选】业务流程做成 AI 员工：8 步法与 4 层工业化架构](08_case_lushuye_build_ai_agent_employee_8steps.md) | Agent/Skill/知识库/CLI-MCP 四层架构、八步法制作 SOP、语义归模型与机械归脚本、去记忆回归验证 | 鹿书野（B站好物深海圈教练） | AI 员工制作八步法 + 飞书控制台 |
| **2.9** | [【案例精选】微信群 AI 助理：重要消息抓取与观点蒸馏实战](09_case_xuanyuan_wechat_group_ai_agent.md) | wx-cli 本地只读、macOS 重签名授权、人工决策门禁、免打扰群摘要与深度对话商业观点蒸馏 | 轩辕（生财首届航海家） | 助理预处理 SOP + 脱敏提炼模型 |
| **2.10** | [【案例精选】从后端研发到大航海领队：运营 SOP 沉淀为 24 项全能 Skill](10_case_awei_codex_community_lead_skill.md) | dahanghai-volunteer-ops 体系、生财 MCP + 飞书 CLI、任务五要素破假闭环、34 款上岸海报 Skill、3:6:1 评分法 | 阿喂（10年后端的领队） | 24 项领队 Skill + 防御写入 SOP |
| **2.11** | [【案例精选】海量精华帖产品化：生财 MCP + Codex 架构拆解 SOP](11_case_jason_shengcai_mcp_to_website_sop.md) | 生财大盘需求雷达、SOP 翻译为系统架构、FastAPI 四层架构与离线 Mock、防 100 个子 Agent 失控死锁 | Jason、mar（AI在读博士） | SOP 软件化全流程 + 避坑指南 |
| **2.12** | [【案例精选】一人公司 AI Agent 文件管理白皮书：四框架与安全治理](12_case_zhouzhi_one_person_company_agent_files_whitepaper.md) | 万物皆文件哲学、四框架选型决策树（CC/Codex/OpenClaw/Hermes）、CLAUDE.md 200 行法则、PreToolUse 拦截 | #周知2.0（AI超级个体） | OPC Agent 文件白皮书 + Hook 防线 |
| **2.13** | [【案例精选】企业级 AI 员工体系与 AI 中心建设实战](13_case_yiren_shengcai_ai_employee_system.md) | 生产关系重组、管理 Agent 的 Agent 治理层（架构师/运维官/审核官）、统一 Codex+飞书、TokenRank 竞技大盘 | 亦仁（生财有术创始人） | AI 中心落地架构 + 组织改造心法 |

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
07_case_lixiangjun_codex_worktree_multiwindow
08_case_lushuye_build_ai_agent_employee_8steps
09_case_xuanyuan_wechat_group_ai_agent
10_case_awei_codex_community_lead_skill
11_case_jason_shengcai_mcp_to_website_sop
12_case_zhouzhi_one_person_company_agent_files_whitepaper
13_case_yiren_shengcai_ai_employee_system
```

```{important}
**使用建议**：
1. **常规突破性对话**：导出文本并使用 `01_dialogue_template.md` 归档。
2. **高强度高阶开发**：深度参考令狐峰的 **50 条高强度实践法则**（[2.5 章节](05_case_linghufeng_23b_tokens_codex_practices.md)）转变心智；结合亦仁的 **双工具协作与交接 SOP**（[2.6 章节](06_case_yiren_claude_code_codex_collaboration_backup.md)）与李香君的 **Worktree 多窗口并发**（[2.7 章节](07_case_lixiangjun_codex_worktree_multiwindow.md)）杜绝代码冲突与账号单点故障。
3. **数字员工与企业治理**：参考鹿书野的 **业务流程做成 Agent 八步法**（[2.8 章节](08_case_lushuye_build_ai_agent_employee_8steps.md)）沉淀确定性资产；遵照周知 2.0 的 **Agent 文件白皮书**（[2.12 章节](12_case_zhouzhi_one_person_company_agent_files_whitepaper.md)）构筑安全 Hook 防线；结合亦仁的 **企业 AI 员工与 AI 中心实战**（[2.13 章节](13_case_yiren_shengcai_ai_employee_system.md)）完成团队生产关系重组。
```
