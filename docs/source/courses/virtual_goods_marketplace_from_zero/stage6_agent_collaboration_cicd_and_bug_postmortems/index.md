# 阶段六：AI Agent 协同开发规范、低资源机优化与 Bug 攻防实录

> **掌握面向人类与 Claude Code / AI 智能体的工程铁律（AGENTS.md）、单机 2GB 低配主机的防 OOM 资源编排锁、GitHub Actions 全自动 CI 门禁与生产级重大 Bug 战报复盘。**

---

## 阶段导读

在 AI Agent 辅助编程成为主流生产力的当下，开发效率实现了十倍飞跃，但也引入了全新的**工程治理挑战**：
- 如果没有给智能体（Claude Code、Antigravity 等）设置钢铁般的安全规范与资源边界，大模型极易写出未经校验的危险代码、擅自引入重型依赖，甚至在并发运行多个测试套件时直接将服务器的内存打爆瘫痪；
- 此外，在真实并发业务推进中，**“支付重放攻击”、“购物车手续费多商品向上取整舍入差”、“切换支付渠道 409 锁死”** 等经典工程坑点，绝非简单的“CRUD”所能覆盖。

本阶段带你复盘 24goods 项目在整个研发迭代过程中的**工程规范演进（AGENTS.md）、低配机（2GB RAM）防崩限流机制、全自动化 CI 门禁**，并公开我们在真实推演中踩过的深坑与完整修复策略。

---

## 核心知识点图谱

```{mermaid}
flowchart LR
    A["面向 Agent 的工程规范<br/>(AGENTS.md 11大安全不变量/规范PR流程)"] --> B["低配机资源预算模型<br/>(2 vCPU / 2GB RAM / flock heavy.lock 互斥)"]
    B --> C["全自动化 CI 门禁流水线<br/>(Ruff+Pytest+Trivy+Gitleaks+E2E Smoke)"]
    C --> D["生产级 Bug 攻防战报一<br/>(购物车逐行向上取整舍入差 vs 前端总算)"]
    D --> E["生产级 Bug 攻防战报二<br/>(支付渠道切换 FeeChannelMismatch 409锁死解法)"]
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_agents_md_and_low_resource_dev_rules
02_cicd_pipeline_and_real_world_bugs
```
