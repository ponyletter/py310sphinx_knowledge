# 智能体团队怎么分工？

> 对应短视频主题：智能体团队怎么分工？  
> 资料核验与更新：2026-09-12


用老板、专员和验收的比喻，讲清子智能体、智能体团队、经理模式、任务交接、并行执行，以及高级模型调用其他模型时真正需要的边界和检查。

## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## 智能体团队：到底谁来分工？

一个总负责人，多个专员，再加一道验收。

想象你是项目负责人，桌上同时来了研究、写代码、做测试三件事。一个人全包，当然可以，但很快就会被来回切换拖慢。智能体，也就是能观察、调用工具并完成目标的软件角色，可以像一名会用工具的专员。

智能体团队，是让多个专员各自负责一块，再由一个总负责人安排顺序、传递信息和验收结果。所以它像老板带团队：老板不亲自写每一行代码，但要说清目标、分配工作、处理冲突，最后检查交付。

![team board](images/scene01_img01_team_board.png)

图解：多智能体团队协作模型：明确共同目标、职责分工与统一验收闭环。

## 子智能体：总智能体的临时专员

重点不在名字，而在谁保留最终控制权。

子智能体，通常是总智能体为了完成一个局部任务，临时请来的专员。它做完研究、扫描代码或生成测试建议，再把结果交回总智能体；总智能体仍然负责下一步。

智能体团队关注的是整体协作：可以有多个长期角色，也可以有一个经理、几个工人和一个评审。一句话区分：子智能体更像一次外包任务，团队更像一套持续运转的组织。

![subagent](images/scene02_img01_subagent.png)

图解：主 Agent 与子智能体（Subagent）的任务分派与结果返回机制。

![team](images/scene02_img02_team.png)

图解：多角色协同架构：研究、实现与测试三大专员并行作业与统一交付。

## 经理模式：总智能体只管指挥与验收

把专员当工具调用，最终答案仍由经理整合。

最容易理解的架构叫经理模式：一个总智能体保留用户对话和最终输出。它把研究、实现、测试这些专员暴露成可调用的工具，按需要并行或串行安排。

专员的上下文可以被限制在自己的任务里，返回结构化结果，而不是把所有聊天记录都塞进每个模型。最后经理要做的不只是拼接答案，还要检查证据、运行结果和验收标准；不通过，就退回重做。

![manager](images/scene03_img01_manager.png)

图解：Manager Agent 调度中枢：统一目标定义、任务拆分与各专员调用关系。

![workers](images/scene03_img02_workers.png)

图解：并发执行机制：研究、编码与测试专员在各自工作区内并行处理。

![review](images/scene03_img03_review.png)

图解：阶段验收流转：比对交付物与验收标准，合格放行，失败则回退重做。

## 高级模型能指挥低级模型吗？可以，但要接好接口

模型级别不是组织能力，协议、权限和验收才是。

高级模型当然可以指挥较便宜或较快的模型，前提是它们有稳定的调用接口，并能返回可检查的结果。在本地，终端复用器只是管理多个终端窗口的工具：它能方便并行观察，但它本身不会替你分工和判断质量。

例如，上层编码助手可以通过脚本或子进程调用另一个命令行模型的无交互模式，让它负责一个明确的小任务，再读回文字或结构化结果。更稳的做法是给每个模型独立目录、明确输入输出格式、最小权限和超时；不要只开五个终端，然后期待它们自动形成团队。

![handoff](images/scene04_img01_handoff.png)

图解：模型分级协同：高阶推理模型负责规划约束，轻量模型负责快速执行。

![tmux](images/scene04_img02_tmux.png)

图解：终端复用与多实例并行监控（以 tmux 等多面板并发观察为例）。

![codex gemini](images/scene04_img03_codex_gemini.png)

图解：跨模型与跨 CLI 协作链：指令分发、子进程调用与结构化结果回收。

## 推理行动循环像一个人边做边想

团队协作则把思考、执行和复核拆给不同角色。

推理行动循环，意思是一个智能体观察信息、想一步、调用工具，再根据结果继续循环。它像一个能力很强的人边查边做，路径灵活，适合目标清楚但步骤难以提前写完的任务。

人类团队则会把工作拆开：研究员先查资料，工程师实现，测试员挑错，负责人决定是否交付。多智能体团队可以模拟这种分工，但还没有自动拥有人的常识、责任感和跨角色沟通默契。

![react loop](images/scene05_img01_react_loop.png)

图解：单个 Agent 的 ReAct 循环：观察环境、推理决策、采取行动与环境反馈。

![human team](images/scene05_img02_human_team.png)

图解：人类专业团队协作映射：各专业角色分工、交接复核与最终责任交付。

## 真正像团队的关键：任务拆开，结果验收

先从低风险、可测量、可回滚的工作开始。

如果你要自己搭一支智能体团队，先写清每个角色的输入、输出、权限和完成标准。再决定哪些任务并行，哪些任务必须等前一步通过；把失败重试、人工审批和日志记录放进流程。

适合多智能体的，通常是可以拆分、彼此相对独立，而且结果能被测试或比较的工作。不适合的，是目标含糊、权限很大、出错代价很高，却没有人负责最后验收的工作。

记住：多智能体不是把一个模型复制很多份，而是把协作关系设计出来，再用验收把它关进边界里。

![acceptance](images/scene06_img01_acceptance.png)

图解：多 Agent 团队落地准则：明确输入边界、输出可验证、最小权限与渐进自治。

## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文的框架完成一次小范围验证，再根据真实反馈调整下一步。

## 参考资料

以下链接来自原始课程研究笔记；动态信息请以其当前页面为准。

- [https://openai.github.io/openai-agents-python/multi_agent/](https://openai.github.io/openai-agents-python/multi_agent/)
- [https://openai.github.io/openai-agents-python/agents/；https://openai.github.io/openai-agents-python/handoffs/](https://openai.github.io/openai-agents-python/agents/；https://openai.github.io/openai-agents-python/handoffs/)
- [https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html)
- [https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/headless.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/headless.md)
- [https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/cli-reference.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/cli-reference.md)
- [https://github.com/google-gemini/gemini-cli/blob/main/docs/core/subagents.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/core/subagents.md)
- [https://www.cheasy.de/tmux.pdf](https://www.cheasy.de/tmux.pdf)
