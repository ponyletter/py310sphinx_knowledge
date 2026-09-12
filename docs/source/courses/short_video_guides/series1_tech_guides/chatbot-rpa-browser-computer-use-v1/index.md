# 四类自动化工具怎么选

> 对应短视频主题：四类自动化工具怎么选  
> 资料核验与更新：2026-09-12


自动化工具不应按“谁更聪明”比较，而应看观察方式、执行范围和安全边界：聊天机器人回答与协助，RPA 执行稳定规则流程，浏览器智能体处理网页任务，Computer Use 则面向跨应用的电脑操作。

```{figure} images/scene01_img01_overview.png
:alt: 四类自动化工具的能力与边界总览
:width: 100%

先按任务范围选工具，而不是把所有自动化任务都交给同一类 Agent。
```

```{figure} images/scene02_img01_roadmap.png
:alt: 自动化从对话、规则流程到浏览器和电脑操作的能力路线
:width: 100%

能力范围越大，观察、验证、权限控制和故障恢复也越重要。
```


## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## 四种工具的适用边界

```{figure} images/scene03_img01_chatbot.png
:alt: 聊天机器人适合解释、问答、草拟和协助
:width: 100%

聊天机器人适合语言任务和辅助决策，不应假设它已经完成外部系统操作。
```

```{figure} images/scene03_img02_rpa.png
:alt: RPA 按固定规则操作结构稳定的业务流程
:width: 100%

输入、界面和规则稳定的重复流程，适合 RPA；频繁变化的界面会提高维护成本。
```

```{figure} images/scene04_img01_browser_agent.png
:alt: 浏览器智能体观察网页并完成受限网页操作
:width: 100%

网页任务需要识别页面状态、导航和表单，但仍应限制可访问站点与操作范围。
```

```{figure} images/scene04_img02_computer_use.png
:alt: Computer Use 在可见电脑界面中跨应用执行操作
:width: 100%

Computer Use 扩大到跨应用界面操作，也相应扩大了误操作和敏感信息暴露风险。
```

## 任何自动化都应有观察—行动—验证闭环

```{figure} images/scene05_img01_observe.png
:alt: 自动化执行前观察当前页面和任务状态
:width: 100%

先确认当前状态，避免按照过期假设继续执行。
```

```{figure} images/scene05_img02_act.png
:alt: 自动化在受限范围内执行下一步动作
:width: 100%

每次行动都应最小化，并限制在已授权的工具、网站和数据范围内。
```

```{figure} images/scene05_img03_verify.png
:alt: 自动化验证结果并处理失败或需要人工介入的情况
:width: 100%

完成点击不等于任务成功；必须检查结果并在异常时停止或转人工。
```

## 安全边界不能省略

```{figure} images/scene06_img01_injection.png
:alt: 网页与文档中的提示注入可能误导自动化系统
:width: 100%

外部网页和文档可能包含诱导指令，不能把页面内容自动当作可信任务指令。
```

```{figure} images/scene06_img02_guardrails.png
:alt: 权限、域名、数据和高风险操作需要护栏
:width: 100%

权限分级、域名白名单、敏感数据隔离和高风险操作确认是必要护栏。
```

```{figure} images/scene06_img03_audit_rollback.png
:alt: 自动化保留审计记录并支持回滚和人工接管
:width: 100%

日志、审计、可回滚设计和人工接管，让自动化失败时仍保持可恢复。
```

```{figure} images/scene07_img01_summary.png
:alt: 四类自动化工具的最终选择总结
:width: 100%

固定流程用 RPA，网页任务用受限浏览器智能体，跨应用操作才评估 Computer Use；始终保留验证和人工边界。
```


## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文梳理的选型维度与边界原则完成一次小范围工程验证，再根据真实系统反馈调整下一步决策。

## 参考资料

以下链接来自官方权威技术文档与开源规范；动态规则请以其当前页面为准。

- [Anthropic Computer Use API Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use)
- [Playwright Browser Automation](https://playwright.dev/)
- [Microsoft Power Automate RPA Architecture](https://learn.microsoft.com/en-us/power-automate/)
- [OpenAI Operator / Browser Tooling](https://platform.openai.com/docs/guides/tools)
