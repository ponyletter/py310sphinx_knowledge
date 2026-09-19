# 2.2 Claude Code 与智能体（Agent）协同实录

> **核心导语：** 记录在使用 Claude Code、Antigravity (AGY) 或自主 Agent 执行大型重构、自动化运维与多文件协作时的精彩交互实录。

---

## 📌 任务背景（占位待补充）

- **任务目标**：复杂工程的跨模块重构与自动化调试
- **协同工具**：Claude Code CLI / AGY Subagents
- **上下文规模**：多文件感知与工具调用（Tool Use）

---

## 🤖 关键交互流转展示

```{mermaid}
flowchart TD
    User["人类开发者 (指令发起)"] --> Agent["Claude Code / 调度智能体"]
    Agent --> Tool1["代码分析检索工具"]
    Agent --> Tool2["自动化测试 / 构建验证"]
    Tool1 --> Plan["生成执行方案"]
    Tool2 --> Final["交付最终代码"]
```

---

## 📝 关键 Prompt 与反思

此处留白，待随时粘贴具体 Agent 任务的提示词设计与执行效果复盘。
