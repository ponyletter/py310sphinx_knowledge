# RAG 不是只靠向量库：缓存、关键词、重排序与模型网关怎么组合？

> 对应短视频主题：RAG 不是只靠向量库：缓存、关键词、重排序与模型网关怎么组合？
> 资料核验与更新：2026-09-13

很多人第一次接触 RAG（检索增强生成）时，会把它理解成“把文档切块，转成向量，再存进向量数据库”。这只是召回链路的一部分。向量检索擅长找语义相近的内容，但产品编号、法规条款、专有名词、权限和版本号往往需要精确匹配与额外治理。下面按视频中的八个画面，先讲清楚每个组件是什么，再说明它们如何组合。

> 配图说明：本文图片为本课程 AI 辅助绘制的教学插图，不是厂商原始截图或官方图表；图中术语用于解释关系，技术事实以参考资料为准。

## 向量库不是完整 RAG

“切块入库”解决的是知识如何被保存和召回，并没有自动解决检索准确性、权限隔离、答案缓存、模型路由和来源追溯。向量召回可能找到意思相近的段落，却漏掉一个必须完全一致的编号或条款，因此关键词索引仍然重要。

```{figure} images/scene01_img01_misconception.png
:alt: 黑板上写着切块入库不等于完整 RAG，并列出缺少的检索、缓存、权限和来源环节
:width: 100%

AI 辅助教学插图：把“切块入库”与完整 RAG 的缺口放在同一张图上。
```

判断一个 RAG 是否可靠，第一问不是“有没有向量库”，而是答案能否在正确权限下回到可核对的原文。这个判断标准也决定了后续组件不能只看单点性能。

## 一条问题如何走完整路线

一条更稳妥的请求路径可以记成：权限过滤 → 精确缓存 → 关键词检索与向量检索并行 → 合并候选 → 重排序 → 交给大模型的少量原文 → 带来源的答案。权限过滤要在缓存和检索前就生效，避免把别人的命中结果泄露出来。

```{figure} images/scene02_img01_flow.png
:alt: RAG 从权限过滤开始，经过精确缓存、关键词检索、向量检索、重排序和模型网关后返回带来源答案的流程图
:width: 100%

AI 辅助教学插图：从用户问题到可追溯答案的完整 RAG 路线。
```

模型网关位于调用治理层：它可以统一接入不同模型，负责路由、预算、限流、故障转移和调用记录；它不负责知识切分，也不等同于知识图谱。把职责分开，排错时才知道问题究竟出在数据、检索还是生成。

## 关键词、向量与重排序

关键词检索像查字典：输入中出现的字符串、编号和条款号可以被精确命中，适合型号、错误码和法规引用等场景。

```{figure} images/scene03_img01_keyword.png
:alt: 关键词检索示意图，查询中的产品编号和法规条款被精确匹配到文档片段
:width: 100%

AI 辅助教学插图：关键词索引突出精确字符串匹配。
```

它的优点是可解释、可控，但只靠字面重合可能漏掉同义表达。查询换一种说法时，结果未必仍然相关。

向量检索更像理解意思：它把问题和文档映射到向量空间，寻找语义相近的片段，适合自然语言提问和同义改写。

```{figure} images/scene03_img02_semantic.png
:alt: 语义向量检索示意图，问题与含义相近但用词不同的文档片段在向量空间靠近
:width: 100%

AI 辅助教学插图：向量召回关注语义相似，而不是完全相同的字面。
```

工程上常做混合召回：先把关键词和向量各自找到的候选合并，再交给重排序模型按当前问题重新打分。这样既保留精确匹配，也利用语义理解。

```{figure} images/scene04_img01_rerank.png
:alt: 重排序示意图，多个关键词和向量候选经过重排序后留下少量高相关证据片段
:width: 100%

AI 辅助教学插图：重排序从候选集合中挑出真正应该交给大模型的内容。
```

重排序不是再次扫描整个知识库，而是处理已经召回的候选集合。例如先拿到 20 段，再筛成 3 段证据；候选质量和排序模型都会影响最终答案。

## 缓存分层：快不等于越权

缓存要按“可复用的对象”分层，而不是把所有结果混成一层。第一层是精确缓存：同一问题、同一权限和同一知识版本下，已经验证过的答案可以直接复用。

```{figure} images/scene05_img01_exact_cache.png
:alt: 精确缓存示意图，相同问题命中经过权限和版本校验的已验证答案
:width: 100%

AI 辅助教学插图：精确缓存命中的是完整问题的已验证结果。
```

第二层是语义缓存：意思足够接近的问题可以复用结果，但相似度阈值、租户边界和答案时效都要经过验证。

```{figure} images/scene05_img02_semantic_cache.png
:alt: 语义缓存示意图，相似问题经过相似度阈值和权限校验后复用答案
:width: 100%

AI 辅助教学插图：语义缓存允许近似复用，但必须保留安全边界。
```

第三层是检索缓存：缓存关键词、向量召回或重排序的候选，文档更新时可以按版本使其失效。

```{figure} images/scene05_img03_retrieval_cache.png
:alt: 检索缓存示意图，关键词和向量候选按知识版本缓存并在更新时失效
:width: 100%

AI 辅助教学插图：检索缓存复用的是中间候选，不是未经复核的最终答案。
```

三层缓存的共同边界是：租户、权限、知识版本和失效策略不能因为“命中缓存”就被跳过。缓存主要优化延迟与成本，不能替代访问控制和证据核验。

## pgvector、Milvus 与知识层选型

如果系统已经以 PostgreSQL 为主，并且事务、行级权限过滤和业务数据联查很重要，可以先评估 pgvector。它把向量能力放在熟悉的关系数据库里，迁移和治理路径通常更直接。

```{figure} images/scene06_img01_pgvector.png
:alt: pgvector 示意图，PostgreSQL 表中的业务字段与向量列一起参与查询和权限过滤
:width: 100%

AI 辅助教学插图：pgvector 适合已有 PostgreSQL 体系的渐进式接入。
```

当向量规模较大，需要多向量字段、专门的混合检索或更强的向量基础设施时，可以评估 Milvus。

```{figure} images/scene06_img02_milvus.png
:alt: Milvus 示意图，独立的向量服务承载大规模向量、多向量和混合检索请求
:width: 100%

AI 辅助教学插图：Milvus 面向更专门的向量检索规模与能力。
```

这不是“谁永远更好”的排名：数据量、团队经验、部署复杂度、权限模型和运维预算才是选型约束。知识治理和关系分析又是另一条轴。本课所说的 LLMWiki pattern，更像可持续维护、可版本化、可人工审阅的 Markdown 知识层。

```{figure} images/scene07_img01_llmwiki.png
:alt: LLMWiki 示意图，版本化的 Markdown 页面由人工审阅并持续维护为知识层
:width: 100%

AI 辅助教学插图：LLMWiki pattern 强调可读、可审阅和可追踪的知识页面。
```

GraphRAG 则适合实体关系、跨文档关联和全局主题分析：先抽取实体与关系，再用图结构帮助回答跨段落、跨文档的问题。

```{figure} images/scene07_img02_graphrag.png
:alt: GraphRAG 示意图，多个文档中的实体通过关系边连接并支持跨文档主题分析
:width: 100%

AI 辅助教学插图：GraphRAG 适合需要关系结构和全局视角的问题。
```

图谱构建、抽取和更新的成本更高；如果问题只是查一个段落，普通混合检索可能更经济。先确认问题是否真的需要关系推理，再决定是否引入图谱。

## 让答案回到原始来源

把缓存、关键词、向量、重排序和模型网关串起来，最终目标是“少量、相关、可追溯”的证据，而不是把更多文本塞给 LLM。来源回链、知识版本和权限上下文，决定了答案能否被复核。

```{figure} images/scene08_img01_summary.png
:alt: RAG 组合总结图，缓存、关键词、向量、重排序和模型网关各司其职并回到原始来源
:width: 100%

AI 辅助教学插图：组件各自负责擅长的部分，最终汇聚为可追溯答案。
```

对零基础读者，可以先记住一句话：RAG 的核心不是“有没有向量库”，而是能否让每个组件各司其职，并让答案回到原始来源。

## 小结

一条可落地的最小心智模型是：

`权限 → 精确缓存 → 关键词 + 向量 → 合并候选 → 重排序 → 少量原文 → LLM → 来源`

关键词负责精确，向量负责语义，重排序负责筛选，缓存负责复用，模型网关负责调用治理；LLMWiki pattern 和 GraphRAG 分别解决知识维护与关系分析问题。先讲清楚“是什么”，再根据数据规模、权限、更新频率和问题类型“怎么选”。

## 参考资料

- [Azure AI Search：Hybrid Search Overview](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview)
- [Azure AI Search：Hybrid Search Ranking](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking)
- [Azure AI Search：Semantic Ranking](https://learn.microsoft.com/en-us/azure/search/semantic-search-overview)
- [pgvector 官方 README](https://github.com/pgvector/pgvector/blob/master/README.md)
- [Milvus：Full Text Search](https://milvus.io/docs/full-text-search.md)
- [Milvus：Multi-Vector Search](https://milvus.io/docs/multi-vector-search.md)
- [Cloudflare AI Gateway 官方文档](https://developers.cloudflare.com/ai-gateway/)
- [Microsoft GraphRAG Overview](https://microsoft.github.io/graphrag/index/overview/)
- [Microsoft GraphRAG 官方 README](https://github.com/microsoft/graphrag/blob/main/README.md)
