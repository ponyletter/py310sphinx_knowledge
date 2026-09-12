# AI编程Agent要怎么管？

> 对应短视频主题：AI编程Agent要怎么管？  
> 资料核验与更新：2026-09-12

AI 编程 Agent 不只是把自然语言补成代码。它可以读取代码库、调用命令、修改文件、执行测试，并提交一个可审阅的差异或草稿 PR。能力越接近“完成一个软件任务”，程序员越需要管理目标、权限、质量证据和风险，而不是把责任交出去。


## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## 从写代码，转向管理一个可审阅的工作闭环

```{figure} images/scene01_img01.png
:alt: 程序员为 AI 编程 Agent 设定目标、约束并审阅结果
:width: 100%

Agent 可以执行任务，但目标、权限和最终责任仍由人控制。
```

一个成熟的委托不只是“帮我实现功能”。它应包含任务边界、相关代码位置、验收条件、可访问的工具和不能触碰的区域。

```{figure} images/scene01_img02.png
:alt: AI 编程 Agent 产出代码差异、日志和测试证据供人工审阅
:width: 100%

可审阅的差异、日志和测试结果，比单纯的一段生成代码更有工程价值。
```

## Agent 与聊天、补全有什么不同

```{figure} images/scene02_img01.png
:alt: 从代码补全和问答升级为可调用工具的编程 Agent
:width: 100%

补全和问答主要输出建议；Agent 还能把建议推进为一组受约束的行动。
```

工具调用让 Agent 可以读取仓库、检索文档、运行命令和执行测试，但也因此扩大了权限与审计需求。

```{figure} images/scene02_img02.png
:alt: 编程 Agent 读取仓库、调用工具、修改代码并运行测试的工作流
:width: 100%

行动链越长，越应明确每一步允许做什么、如何留下证据、何时停止。
```

## 把任务拆成可验证的交付物

```{figure} images/scene03_img01.png
:alt: Agent 接收明确缺陷或需求并定位相关代码
:width: 100%

从边界清晰的缺陷、测试补充或文档更新开始，最容易建立可靠流程。
```

需求明确后，Agent 可以先提出计划或最小改动范围，而不是直接大规模重构。

```{figure} images/scene03_img02.png
:alt: Agent 修改代码并保留可审阅的差异
:width: 100%

代码修改应以清晰 diff 的形式交付，便于人类检查意图是否被误解。
```

差异本身仍不足以证明正确；测试、日志和复现步骤应成为同一份交付的一部分。

```{figure} images/scene03_img03.png
:alt: Agent 运行测试并返回日志和结果证据
:width: 100%

测试结果是质量证据，不是跳过人工审查的通行证。
```

## Workflow 与 Agent 应混合使用

```{figure} images/scene04_img01.png
:alt: 预定义 workflow 和动态 Agent 的不同控制方式
:width: 100%

固定且低风险的步骤适合 workflow；需要调查和选择工具的任务才需要 Agent 的动态决策。
```

对重复、稳定的流程，预定义 workflow 往往更可控，例如格式检查、单元测试、构建和扫描。对需要读代码、追踪线索、比较方案的任务，Agent 的动态探索更有价值。

```{figure} images/scene04_img02.png
:alt: Agent 在隔离环境与最小权限约束下执行任务
:width: 100%

隔离环境和最小权限限制了 Agent 的影响范围。
```

不要把“能运行命令”理解为“应该拥有所有命令权限”。令牌、生产数据、发布权限和不可逆迁移都应处于更严格的隔离与审批之下。

```{figure} images/scene04_img03.png
:alt: 扫描、人工审批和可回滚机制共同约束 Agent 交付
:width: 100%

扫描、审批和回滚机制使自动化保持在可恢复的工程边界内。
```

## 效率会放大已有工程能力

```{figure} images/scene05_img01.png
:alt: AI 编程工具放大测试、文档和工程流程的优势与弱点
:width: 100%

AI 更像放大器：好的测试和规范会被放大，模糊需求和薄弱流程也会被放大。
```

当仓库缺少测试、需求含糊、架构边界不清时，Agent 也更容易生成看似合理却难维护的改动。

```{figure} images/scene05_img02.png
:alt: 未经验证的代码可能引入安全漏洞和维护成本
:width: 100%

速度不能替代安全、正确性和长期维护的验证。
```

因此需要保留静态检查、依赖扫描、测试门禁和人工代码审阅。

```{figure} images/scene05_img03.png
:alt: 团队通过规范和质量门禁管理 AI 生成代码
:width: 100%

质量门禁应面向所有改动，而不只针对 AI 生成的改动。
```

## 哪些任务适合委托

```{figure} images/scene06_img01.png
:alt: 明确缺陷、测试、文档和重复重构适合先交给 Agent
:width: 100%

边界明确、验收可自动化的任务，是委托 Agent 的良好起点。
```

模糊需求、缺少测试的旧系统、核心架构选择、数据迁移和生产发布，不应因为 Agent 可用就自动委托。

```{figure} images/scene06_img02.png
:alt: 核心架构、数据迁移和高风险发布需要人工主导
:width: 100%

高影响或不可逆任务需要人类主导决策，并把 Agent 限定为辅助角色。
```

最终的工作方式是：人定义目标和风险边界，Agent 完成受约束的调查与实现，人用证据审阅并决定是否合并。

```{figure} images/scene06_img03.png
:alt: 人类设定目标约束并验证 Agent 结果的协作闭环
:width: 100%

程序员的角色从纯手工编码，延伸为目标、约束、验证和风险承担的负责人。
```


## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文梳理的选型维度与边界原则完成一次小范围工程验证，再根据真实系统反馈调整下一步决策。

## 参考资料

- [OpenAI Codex](https://openai.com/index/introducing-codex/)
- [GitHub Copilot coding agent](https://github.blog/news-insights/product-news/github-copilot-meet-the-new-coding-agent/)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [DORA 2025 report](https://dora.dev/research/2025/dora-report/)
