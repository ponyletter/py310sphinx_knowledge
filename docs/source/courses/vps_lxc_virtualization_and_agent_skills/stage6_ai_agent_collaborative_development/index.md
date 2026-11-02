# 阶段六：基于 Claude Code 与 AGY 智能体驱动的工业级研发

> **复盘多模型兼容 AI Skill 的架构演进，深入基于 Claude Code 与 Antigravity (AGY) 的自然语言运维推演，建立集成真实 LXD 与 Mihomo 的 GitHub Actions CI 质量门禁。**

---

## 阶段导读

在传统的软件工程中，编写一套复杂的运维系统需要经历繁重的需求分析、写脚手架、单元测试与手工部署验证。而在大模型时代，**人类工程师与代码智能体（Claude Code / Antigravity CLI）形成了全新的结对编程生产范式**：

1. 人类提出业务痛点与网络边界约束；
2. 智能体查阅代码与官方 RFC，自动化编写最小可重现复现用例；
3. 智能体发起 GitHub PR，全套单元测试与端到端 CI 自动化执行；
4. 真实服务器测试验证，打磨出兼具 **OpenAI GPTs、Anthropic Claude、Google Gemini / AGY** 全兼容的开源通用 Skill。

本阶段将全方位复盘这一现代智能体驱动的工业级研发流程。

---

## 核心架构拓扑

```{mermaid}
flowchart TD
    Human["人类工程师<br/>(提出架构需求与踩坑现象)"] --> Agent["代码智能体 (Claude Code / AGY)<br/>(深入底层内核排错 / 编码 / 提 PR)"]
    
    subgraph SkillPackage["统一智能体技能资产 (Skill Matrix)"]
        Meta["SKILL.md 元数据定义"]
        ClaudeAdapt["claude/ 适配层"]
        GeminiAdapt["gemini/ (AGY) 适配层"]
        OpenAIAdapt["openai/ 适配层"]
        CorePy["scripts/ 核心 Python 引擎"]
    end

    Agent --> SkillPackage
    SkillPackage --> CI["GitHub Actions 自动化门禁<br/>(真实 LXD 实例 + 3X-UI 部署 + Mihomo 验证)"]
    CI --> Live["生产 VPS 节点一键安全交付"]
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_multi_agent_skill_architecture
02_ci_regression_and_production_sop
```
