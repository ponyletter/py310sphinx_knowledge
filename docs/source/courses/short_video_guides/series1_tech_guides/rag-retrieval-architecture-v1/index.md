# TikHub API + Obsidian：FTS5 与向量双轨 RAG 怎么搭？

> 对应短视频主题：TikHub API + Obsidian 本地 RAG：FTS5 与向量双轨降级
> 资料核验与更新：2026-09-22

这篇图文复盘一条适合本地知识库的完整链路：TikHub API 负责把社交媒体公开数据带进来，Obsidian 负责把结果保存成可编辑、可备份的 Markdown 源文件，SQLite FTS5 与向量检索分别负责“找得准”和“找得像”，RAGFlow 再把解析、切块、检索、重排和回答编排起来。重点不是把组件越堆越多，而是先理解每一层负责什么，以及向量路径不可用时怎样保留一条可解释的本地搜索路径。

文中的图片均为本课程制作的 AI 辅助教学示意图，不是 TikHub、Obsidian 或 RAGFlow 的原始产品界面，也不构成性能、价格或平台能力承诺。

## 阅读边界

本文面向第一次接触这组工具的读者，解释数据入口、本地源头、双轨检索、编排层和降级路径。TikHub 官方页面列出的平台、API 与 MCP 工具数量会随产品更新；本文只采用研究日可访问的官方定位，不把动态数字当作永久承诺。TikHub 也提示，数据如何使用、存储和处理需要由终端用户自行判断；本文不讨论绕过平台规则、抓取私人数据或具体采集脚本。

## 先看总链路：API 结果还不是知识库

如果只把 API 返回的 JSON 直接交给模型，后面很快会遇到三个问题：原始字段难以维护，精确编号不容易核对，回答也难以回到来源。更稳妥的思路，是先把每条结果整理成一份带元数据的 Markdown 笔记，再为同一份笔记建立不同的检索入口。

```{figure} images/tikhub_scene01_overview.png
:alt: TikHub API 数据进入 Obsidian，再经过 FTS5 与向量检索生成带来源回答
:width: 100%

图：从 TikHub API 到本地 Obsidian Vault，再到 FTS5、向量检索与 RAGFlow 的可追溯主链路。本图为 AI 辅助教学示意图。
```

可以把它想成整理资料：TikHub 像数据入口，Obsidian 像本地档案柜，FTS5 和向量索引像档案柜上装的两种查找工具。入口负责带来资料，但不会自动替你完成知识治理。

## TikHub 取数，Obsidian 存真

TikHub 的官方定位是社交媒体数据基础设施，提供面向多个平台的 API、数据集和 MCP 工具。对本地知识库来说，最重要的不是记住某个动态数量，而是把接口结果规范成稳定的字段：平台、作者、发布时间、原链接、原始编号，以及正文或摘要。

```{figure} images/tikhub_scene02_api.png
:alt: TikHub 将社交平台公开内容整理成结构化 API 结果
:width: 100%

图：TikHub 处在数据入口位置，把平台内容组织成带平台、作者、时间和原始编号的结构化结果。本图为 AI 辅助教学示意图。
```

Obsidian 的 Vault 本质上是本地文件系统中的文件夹，笔记主体以 Markdown 纯文本保存。这意味着源知识可以直接打开、备份、迁移，也能被其他脚本或工具读取；它不是一个只能通过某个在线服务访问的黑盒。

```{figure} images/tikhub_scene02_obsidian.png
:alt: Obsidian Vault 保存可编辑、可备份和可迁移的本地 Markdown 笔记
:width: 100%

图：Obsidian 作为本地知识源，保存原始字段、正文摘要和来源路径；后续索引都从这份可检查的 Markdown 出发。本图为 AI 辅助教学示意图。
```

因此，第一条实践口诀是：先把 API 结果写成规范 Markdown，再谈检索。这样即使后面的向量服务暂时不可用，原文和来源仍然在本地。

## FTS5 找准，向量找像

同一份 Markdown 可以切成适合检索的小段，同时生成两种索引。SQLite FTS5 是全文检索模块，擅长按原文关键词、短语、前缀、字段和布尔条件查找，适合视频编号、作者名、标签、日期和 API 字段这类“必须对得上字”的问题。

```{figure} images/tikhub_scene03_fts5.png
:alt: SQLite FTS5 通过 MATCH、关键词和字段命中精确内容
:width: 100%

图：FTS5 更像查字典或查编号，返回命中片段、排序结果和可解释的原文位置。本图为 AI 辅助教学示意图。
```

向量检索走的是另一条路：先把文本转换成向量坐标，再按相似度寻找意思接近的片段。所以用户换一种说法提问时，向量路径可能仍能找到相关内容，但它依赖嵌入模型和向量索引是否可用。

```{figure} images/tikhub_scene03_vector.png
:alt: 文本切块经过向量嵌入后按语义相似度检索
:width: 100%

图：向量检索关注语义相近，而不是每个词必须完全相同；它适合主题问题，但仍需要来源和权限边界。本图为 AI 辅助教学示意图。
```

不要把二者理解成谁取代谁：FTS5 解决“原文有没有这个词”，向量解决“是不是在说同一件事”。真实知识库通常需要两种能力。

## 同一个问题怎样走两条检索路

遇到明确编号或原始字段时，优先让 FTS5 做精确命中；遇到“有没有讲过类似方法”这类主题问题时，再让向量检索扩大语义覆盖。两条路可以并行，先各自召回候选，再合并、去重并保留每条结果的来源路径。

```{figure} images/tikhub_scene04_exact.png
:alt: 视频编号、标签和原始字段问题进入 FTS5 精确检索
:width: 100%

图：明确的编号、标签或字段问题，先走 FTS5，便于解释为什么命中这条笔记。本图为 AI 辅助教学示意图。
```

如果问题表达得更自然、更口语，向量路径可以补足同义说法；最后再把关键词、语义和元数据合并排序，而不是把最高相似度结果直接当成答案。

```{figure} images/tikhub_scene04_hybrid.png
:alt: 关键词、向量和元数据合并排序后返回带来源结果
:width: 100%

图：混合检索把精确匹配和语义相似结果合并，再把命中片段与来源一起交给回答层。本图为 AI 辅助教学示意图。
```

这就是“找得准 + 找得像”的双轨思路：精确查询保住字段可靠性，语义查询改善自然语言覆盖，混合结果还要继续经过权限、版本和来源检查。

## RAGFlow 编排，FTS5 负责降级

RAGFlow 更适合放在编排层：它可以参与文档解析、文本切块、全文与向量混合检索、重排以及生成回答。它的作用是把复杂流程组织起来，不是替代 Obsidian 里的本地源文件，也不应该让本地 FTS5 失去作用。

```{figure} images/tikhub_scene05_ragflow.png
:alt: RAGFlow 编排解析、切块、混合检索、重排和生成回答
:width: 100%

图：RAGFlow 位于流程编排层，连接本地 Markdown、双轨检索、重排和带来源回答。本图为 AI 辅助教学示意图。
```

当向量模型不可用、向量索引尚未更新，或者本地设备暂时不适合运行嵌入时，可以先回退到 FTS5。降级的目标不是保证语义召回完全相同，而是让系统仍然能够给出基于原文的、可解释的结果，并明确返回命中片段和笔记路径。

```{figure} images/tikhub_scene05_fallback.png
:alt: 向量不可用时回退到 FTS5 并保留命中片段和来源路径
:width: 100%

图：向量路径发生故障时，Fallback 回到 FTS5 精确搜索；回答仍需带命中片段、平台、时间和笔记路径。本图为 AI 辅助教学示意图。
```

这条降级路径也提醒我们：RAG 的可靠性不只看模型会不会生成答案，还要看系统是否能解释答案来自哪里、使用了哪一版知识、经过了哪条检索路径。

## 一套适合第一次搭建的顺序

第一次搭建时，不必同时解决所有复杂问题。可以按四步推进：先用 TikHub 取数；再把结果规范成 Obsidian Markdown；接着先把 FTS5 精确搜索做稳定，再增加向量索引；最后接入 RAGFlow，把解析、混合检索、重排和回答串起来。

```{figure} images/tikhub_scene06_recipe.png
:alt: TikHub 取数、Obsidian 存真、FTS5 找准与向量找像、RAGFlow 编排的四步搭配口诀
:width: 100%

图：从本地源头开始，逐步增加双轨检索和编排层；向量暂不可用时仍可回到 FTS5。本图为 AI 辅助教学示意图。
```

每条 API 结果至少保留平台、作者、时间、原链接、原始编号和笔记路径。这样无论走 FTS5、向量还是混合检索，最终回答都能回到可核对的资料，而不是只留下一个看似流畅的生成文本。

## 小结

可以把整套搭配浓缩成一句话：TikHub 负责取数，Obsidian 负责存真，FTS5 负责找准，向量负责找像，RAGFlow 负责编排，向量不可用时回到 FTS5。

对于第一版实现，建议先让本地 Markdown、字段规范和 FTS5 搜索稳定，再增加向量与 RAGFlow。每次回答都保留来源、路径和检索方式，系统才更容易调试、迁移和复盘。

## 参考资料

- [TikHub 官方介绍](https://tikhub.io/about)：社交媒体数据基础设施、平台/API/MCP 定位与使用责任说明。
- [TikHub 官方主页](https://tikhub.io/)：API、MCP、数据集与 RAG 数据层入口。
- [TikHub MCP 官方页面](https://tikhub.io/mcp)：跨平台工具与 MCP 接入方式。
- [TikHub API 官方文档](https://docs.tikhub.io/)：接口、参数和返回结构说明。
- [Obsidian Vault 官方文档](https://obsidian.md/help/vault)：Vault 是本地文件系统中的文件夹。
- [Obsidian 数据存储说明](https://obsidian.md/help/data-storage)：Markdown 纯文本、Vault 子目录与配置目录。
- [Obsidian Vault API](https://docs.obsidian.md/Plugins/Vault)：读取与管理 Vault 内文件的开发接口。
- [SQLite FTS5 官方文档](https://www.sqlite.org/fts5.html)：全文检索、MATCH、rank、snippet 与 highlight。
- [RAGFlow RAG 基础文档](https://github.com/infiniflow/ragflow/blob/main/docs/basics/rag.md)：全文、向量、重排与元数据过滤的检索路径。
- [RAGFlow 检索测试文档](https://github.com/infiniflow/ragflow/blob/main/docs/guides/dataset/run_retrieval_test.md)：关键词相似度、向量余弦相似度与混合评分。
- [RAGFlow Indexer 文档](https://github.com/infiniflow/ragflow/blob/main/docs/guides/agent/ingestion_pipeline/configure_indexer_component.md)：全文、Embedding 与 Hybrid 的职责区别。