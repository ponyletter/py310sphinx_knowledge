# Jev 是什么？从“会聊天的大模型”到“给软件做决策的模型”

> 短视频主题：Jev、System One 与智能体中的结构化决策
> 资料核验与更新：2026-09-21

Jev 不是又一个只面向人的聊天机器人。更准确地说，它是 TypeSafe AI 推出的、面向软件系统决策的模型：输入当前状态和预先定义的问题，输出程序可以直接读取的分类、概率、置信度或评分。

本文面向第一次接触这个概念的读者，先用一条简单的主线说明它解决什么问题，再解释 Noul、Choice、Score 三种问题，以及它和普通大模型、Skill、代码、人工之间的分工。

文中的图均为本课程制作的 AI 辅助教学示意图，不是厂商产品的原始界面或性能承诺。产品能力、版本、价格、权限和平台规则可能变化，实践前应以当前官方资料和真实环境为准。

## 先看结论：Jev 负责“下一步怎么走”

普通大模型通常把问题变成文章、代码、解释或回复；Jev 更像软件里的一个高速判断函数，把状态变成一个固定形状的决定。代码再根据这个决定完成路由、排序、拦截、升级或执行。

```{figure} images/jev_scene01_jev_decision_pipeline.png
:alt: Jev 把当前状态转换成结构化判断，再触发自动放行或转人工
:width: 100%

图：软件流程可以拆成“状态 → 判断 → 动作”；Jev 位于判断这一层。
```

因此，比较 Jev 和普通大模型时，重点不是谁“更会聊天”，而是谁承担理解、谁承担判断、谁承担执行。

## TypeSafe 与 Jev：System One 是什么？

TypeSafe AI 把这类面向软件决策的模型称为 System One，Jev 是它的第一款公开模型。输入可以是一段工单、邮件、操作状态，或智能体上下文；输出不是一段自由文本，而是类型明确的结果。

```{figure} images/jev_scene02_system_one_context.png
:alt: 工单、邮件和智能体状态汇入 TypeSafe System One
:width: 100%

图：System One 关注软件当前面对的状态和问题，而不只是生成一段对人说的话。
```

```{figure} images/jev_scene02_jev_typed_output.png
:alt: Jev 返回 Choice、概率、置信度和 Score 等程序可读取字段
:width: 100%

图：固定字段让后续代码知道应该读取什么，而不必从长文章中猜答案。
```

“结构化”可以先理解成三件事：字段固定、结果形状可预期、程序能够直接消费。置信度表示系统对当前判断有多确定，但不是“正确率保证”。

## 三种问题：Noul、Choice、Score

Jev 的核心问题原语可以先理解成三种提问方式。它们不是让模型自由发挥，而是把模糊判断拆成程序可以处理的固定问题。

```{figure} images/jev_scene03_noul_yes_no.png
:alt: Noul 通过是非分支判断一次操作是否需要人工审核
:width: 100%

图：Noul 是是非判断，例如“这次操作要不要人工审核”。
```

```{figure} images/jev_scene03_choice_routing.png
:alt: Choice 把工单路由到账务、技术或销售
:width: 100%

图：Choice 是多选分类，例如“这张工单应该交给谁”。
```

```{figure} images/jev_scene03_score_risk.png
:alt: Score 按低中高等级评估风险或客户情绪
:width: 100%

图：Score 是等级评分，例如“风险有多高”或“客户情绪有多紧急”。
```

三种问题可以在一次请求中同时提交，代码再把结果组合成后续动作：是否允许、应该选哪个分支、风险是否超过阈值。

## 为什么不直接让普通大模型输出文字？

普通大模型先生成文字，程序还要解析、校验，才能决定下一步。自由文本很灵活，但也可能出现格式漂移、无关段落和字段缺失。

```{figure} images/jev_scene04_typed_result.png
:alt: 从杂乱自由文本到字段固定的类型化结果，再进入代码函数
:width: 100%

图：Jev 的关键不是“不会说话”，而是输出能否稳定落到代码接口。
```

```{figure} images/jev_scene04_threshold_human_gate.png
:alt: 置信度阈值把请求分成自动放行和转人工两条路径
:width: 100%

图：高置信度可以自动走，低置信度进入人工复核；阈值需要由业务风险决定。
```

这不意味着 Jev 永远正确。更准确的说法是：它不生成自由文本，因此不会出现传统文本生成中的格式漂移；分类、评分和风险判断仍可能错误，生产系统必须设置阈值、人工复核和失败处理。

## 它和普通大模型、Skill 分别负责什么？

可以把一个智能体想成几种不同的岗位，而不是一个模型包打天下：

```{figure} images/jev_scene05_chat_model_role.png
:alt: 普通大模型理解复杂目标并生成文章代码或回复
:width: 100%

图：普通大模型擅长理解复杂目标、写代码、解释问题和生成回复。
```

```{figure} images/jev_scene05_skill_module_role.png
:alt: Skill 作为任务说明书告诉智能体怎样完成工作
:width: 100%

图：Skill 更像一份可复用的任务说明，规定做法和步骤。
```

```{figure} images/jev_scene05_jev_decision_role.png
:alt: Jev 把请求分流到继续、换工具或人工处理
:width: 100%

图：Jev 像智能体里的决策器，判断当前请求属于哪一类、是否继续、调用哪个工具。
```

- 普通大模型：理解目标、生成解释和回复。
- Skill：规定智能体应该怎样完成任务。
- Jev：判断当前分支、权限、风险和工具选择。
- 代码：真正执行动作并记录结果。
- 人工：接住低置信度、高风险或失败情况。

## 放进智能体后，Jev 具体做什么？

一个智能体可以先让普通大模型理解用户的复杂目标，再让 Jev 并行判断风险、意图和优先级。结果可以触发路由、排序、拦截或升级。

```{figure} images/jev_scene06_agent_route_actions.png
:alt: Jev 输出风险意图优先级并驱动智能体路由排序
:width: 100%

图：结构化结果可以把请求送到合适的模型、工具或工作队列。
```

```{figure} images/jev_scene06_agent_safety_handoff.png
:alt: Jev 拦截危险浏览器操作并把不确定客服请求升级给人工
:width: 100%

图：高风险必须拦，不确定就升级；安全任务才进入执行器。
```

典型场景包括：工具调用前的风险判断、客服分流、邮件优先级、内容审核、浏览器操作拦截、发票处理和安全事件升级。最后由代码执行动作，并保存输入、判断、阈值和结果，形成可追踪的工作流。

## 最后记住：Jev 是决策器，不是聊天替代品

```{figure} images/jev_scene07_summary_decision_loop.png
:alt: 普通大模型理解、Jev 判断、代码执行、结果记录和人工复核组成闭环
:width: 100%

图：Jev 把“是否执行、选哪个分支、风险多大”变成软件可以直接消费的决定。
```

TypeSafe 官方称 Jev 仍处于早期使用阶段。公开模型目录中的 `jev-1.13` 页面当前显示 32K 上下文，并展示输入每百万令牌约 0.042 美元、输出为 0 美元的参考价格；这是第三方平台展示，不等同于 TypeSafe 官方直接报价，使用前应核对最新官方计费和权限。

一句话总结：普通大模型负责理解复杂目标，Skill 规定做法，Jev 负责结构化判断，代码负责执行，人工负责接住不确定性。

## 参考资料

> 📌 **查阅提示**：点击下方链接可直接查看官方资料；版本、价格和接入权限以当前页面为准。

- [TypeSafe 官方博客：Introducing System One Models and Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
  *说明：介绍 System One、Jev、结构化决策和 RLCD 定位。*
- [TypeSafe 官方主页](https://typesafe.ai/)
  *说明：介绍 System One 面向软件决策、概率/置信度和阈值决策的定位。*
- [TypeSafe 官方 Evals / Workflows](https://evals.typesafe.ai/)
  *说明：展示 Noul、Choice、Score 三种问题原语及其工作流用法。*
- [TypeSafe 官方 MCA](https://typesafe.ai/legal/mca)
  *说明：提供控制台与 API 接入语境。*
- [OpenRouter：typesafe/jev-1.13](https://openrouter.ai/typesafe/jev-1.13/api)
  *说明：第三方模型目录中的上下文与参考价格，可能变化。*
