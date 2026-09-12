# 小程序富文本怎么选？

> 对应短视频主题：小程序富文本怎么选？  
> 资料核验与更新：2026-09-12

在小程序里展示文章，不是简单地把 HTML 字符串塞进一个组件。内容是否受控、是否包含代码和表格、是否来自外部输入、项目是否需要长期维护，都会改变答案。

本篇比较微信原生 `rich-text`、`mp-html`、`wxParse` 和 `towxml`。目标不是宣布“唯一最好”，而是根据内容边界做一个可复核的选择。


## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## 先用四个边界定义问题

```{figure} images/scene01_rich_text_choice_overview.png
:alt: 原生 rich-text、mp-html、wxParse 和 towxml 的四个比较边界
:width: 100%

先比较标签能力、复杂内容、安全与性能责任、维护状态。
```

开始选型前，分别回答：

1. 内容是不是受控的基础 HTML，还是来自编辑器、用户或外部站点？
2. 是否需要代码高亮、复杂表格、视频、图片预览、锚点等页面级能力？
3. 能否承担依赖升级、兼容测试、资源域名和输入安全维护？
4. 项目是新项目，还是必须兼容一套历史渲染方案？

## 原生 `rich-text`：适合受控的基础内容

```{figure} images/scene02_native_rich_text.png
:alt: 原生 rich-text 适合基础标签和受控内容
:width: 100%

原生组件依赖少、路径短，但不是完整的浏览器 HTML 环境。
```

微信原生 `rich-text` 支持字符串或节点数组形式的 `nodes`，但只支持部分受信任的标签与属性；它不是完整网页渲染器，也不应被当作安全过滤器。对于结构简单、来源可控的正文，它的接入成本低；若内容需要复杂代码块、互动表格或多媒体体验，能力边界会很快显现。

```{figure} images/scene02_mp_html.png
:alt: 复杂富文本能力对原生 rich-text 的挑战
:width: 100%

复杂文章的表格、代码、媒体与交互需求，往往超出基础组件的舒适区。
```

## `mp-html`：面向复杂文章的渲染能力

```{figure} images/scene03_mp_html_detail.png
:alt: mp-html 渲染技术文章中的表格和代码高亮等复杂内容
:width: 100%

复杂技术文章可评估 mp-html，但要把升级、兼容和安全纳入维护预算。
```

`mp-html` 提供表格、图片预览、链接处理、锚点、代码高亮等丰富能力，并有按需启用的相关插件。它适合知识库、教程和富媒体内容，但“功能更丰富”不等于“零成本”：组件升级、插件组合、基础库兼容、资源加载和性能都要用你的内容和目标设备来验证。

## `wxParse`：历史项目的兼容对象

```{figure} images/scene03_wxparse_legacy.png
:alt: wxParse 是历史项目中可能遇到的富文本方案，仓库已停止维护
:width: 100%

wxParse 可以帮助理解或维护存量项目，不应作为新项目的默认起点。
```

```{figure} images/scene04_wxparse_maintenance_timeline.png
:alt: wxParse 停止维护后应对存量项目进行兼容和迁移评估
:width: 100%

维护状态是选型事实：遇到旧项目时先做兼容、风险与迁移评估。
```

wxParse 的仓库已明确标注停止维护。因此它仍可能是旧项目里的现实约束，却不适合作为新项目默认选择。处理存量项目时，先核对依赖、基础库兼容、已知 bug、内容规模和迁移成本；不要为了“统一技术栈”在未验证的情况下重写。

## `towxml`：转换路径与构建验证

```{figure} images/scene03_towxml_conversion.png
:alt: towxml 将 HTML 或 Markdown 转换为 WXML 的路径
:width: 100%

towxml 的价值在于转换能力与扩展性；接入前需要验证构建流程和当前版本边界。
```

Towxml 提供 HTML、Markdown 转 WXML 的路径，也覆盖代码高亮、表格、图片等能力。它更适合已有对应技术积累、且愿意维护构建与版本验证的团队。尤其在文档标记、构建方式和目标平台存在差异时，应先完成小样验证。

## 安全不属于任何一个渲染组件

```{figure} images/scene05_sanitization_pipeline.png
:alt: 外部富文本进入小程序前需要经过标签和属性白名单清洗
:width: 100%

不可信内容必须先按标签、属性和业务需求清洗。
```

清洗之后，还需要分别检查用户点击的链接、页面样式和外部资源是否落在允许范围内。

```{figure} images/scene05_security_gates.png
:alt: 外链协议、样式字段和资源域名需要通过安全检查
:width: 100%

链接协议、样式字段和图片视频资源域名都应进入校验规则。
```

内容规模持续增大时，还要用真实设备观察解析、布局与资源加载带来的运行成本。

```{figure} images/scene05_runtime_maintenance.png
:alt: 内容复杂度上升会带来运行和维护成本
:width: 100%

内容越复杂，越要在真实设备、真实内容规模下检查性能与维护成本。
```

无论使用哪种方案，外部输入都应在进入组件前经过业务化的清洗：只允许需要的标签和属性；验证 `href`、`src` 等 URL 的协议；限制样式字段；约束图片、视频等资源域名；并设置合理的内容长度和资源数量边界。组件负责显示，不代替你的输入信任策略。

## 一张决策树给出起点

```{figure} images/scene06_selection_decision_tree.png
:alt: 四种小程序富文本方案的选型决策树
:width: 100%

从内容复杂度、维护状态和转换需求出发选择初始方案。
```

决策树给出的是候选起点，最终仍要回到项目的实际内容样本和维护能力。

```{figure} images/scene06_choice_summary.png
:alt: 原生 rich-text、mp-html、wxParse、towxml 的最终选型总结
:width: 100%

选型结论应是可验证的起点，而不是脱离项目的绝对排名。
```

可以先用这条经验法则建立候选集：

- **简单且受控的内容**：优先评估原生 `rich-text`；
- **复杂技术文章、表格、代码和富媒体内容**：评估 `mp-html`，并承担依赖与安全维护；
- **存量项目已经使用 wxParse**：先做兼容和迁移评估，不把它作为新项目默认方案；
- **需要 HTML/Markdown 转换、团队接受构建与版本验证**：评估 `towxml`。

最终请用一份接近真实的文章样本验证：包含长文、宽表格、代码块、多图、外链和异常输入，并在目标基础库与真机上完成测试。


## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文梳理的选型维度与边界原则完成一次小范围工程验证，再根据真实系统反馈调整下一步决策。

## 参考资料

> 📌 **查阅提示**：点击下方超链接可直接复制对应网址，粘贴至手机或电脑浏览器中即可查阅官方完整技术文档与规范。

- [【官方资料】微信小程序 rich-text 文档](https://developers.weixin.qq.com/miniprogram/dev/component/rich-text.html)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】mp-html 项目仓库](https://github.com/jin-yufeng/mp-html)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】wxParse 项目仓库](https://github.com/icindy/wxParse)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】Towxml 项目仓库](https://github.com/sbfkcel/towxml)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】OWASP XSS 防护备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)  
  *说明：官方权威技术规范与开发者实现参考手册。*
