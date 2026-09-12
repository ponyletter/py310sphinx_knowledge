# XML 与 JSON：数据交换格式的历史与现状

> 对应短视频主题：XML 与 JSON：数据交换格式的历史与现状  
> 资料核验与更新：2026-09-12


用白板图解 XML、JSON、YAML 与 Protobuf 的历史动因、核心机制和当代工程边界。

## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。
原始研究记录标注的时间为：2026-08-30（Asia/Shanghai）。

## 数据交换格式，为什么一直在变？

XML · JSON · YAML · Protobuf：不是潮流，而是约束

当一份数据要跨程序、跨语言、跨网络移动时，格式就不再只是写法问题。人希望它能读懂，机器希望它稳定，网络希望它足够紧凑，系统还要允许未来继续演进。

XML、JSON、YAML 和 Protobuf，分别把这组矛盾中的不同约束推到了前台。理解它们的关键，不是背谁更新，而是先问数据要被谁读、怎样传和怎样升级。

![hook](images/scene01_img01_hook.png)

图解：数据交换格式演进长卷：从早期标记语言到现代微服务高性能协议的发展脉络。

## XML：把文档结构带上 Web

从 SGML 与 W3C，到元素、属性、命名空间和企业契约

XML 的故事可以从 SGML 和 Web 时代的文档互操作需求讲起。1998 年 XML 1.0 成为 W3C Recommendation，它把可扩展的文档标记裁剪成更适合 Web 的规则。

元素、属性和嵌套树让结构显式可见，而命名空间、DTD 或 XSD 可以继续承担名称隔离与验证任务。SOAP 和 WSDL 这样的企业 Web 服务规范使用 XML 技术构建契约，但这不意味着每份 XML 都必须属于 SOAP 体系。

![xml origin](images/scene02_img01_xml_origin.png)

图解：SGML 到 XML 的诞生：解决跨异构平台与不同语言系统之间的数据通用交换标准。

![xml tree](images/scene02_img02_xml_tree.png)

图解：XML 树状节点与属性结构：命名空间、严格 Schema 校验与高自解释性设计。

## JSON：轻量文本，不等于完整语义

对象、数组与 Web API：语法变轻，协议责任仍在

当 Web 应用需要频繁在浏览器和服务器之间交换对象时，XML 的显式标记显得相对沉重。JSON 借鉴 JavaScript 对象语法，用对象、数组和少量标点表达同样的结构，因此更贴近 Web API 的数据交换。

但 JSON 标准主要定义合法文本的语法，并不替业务规定字段含义、必填规则或版本语义。需要稳定互操作时，可以把 JSON Schema 放在语法之上，明确验证规则和共享的数据约束。

![xml markup cost](images/scene03_img01_xml_markup_cost.png)

图解：XML 的冗余标签代价：标签开销大、解析复杂及在前端浏览器环境下的处理成本。

![json lightweight](images/scene03_img02_json_lightweight.png)

图解：JSON 的轻量化革命：基于键值对象与数组的极简映射，与 Web 运行时天然契合。

## YAML：让结构化数据更适合人来维护

缩进、注释、锚点与 schema：可读性背后的解析边界

YAML 把重点从机器最短表示，转向人类能否快速阅读、编辑和复用配置。它用缩进、注释、多行标量以及锚点和别名减少符号噪声，YAML 1.2 也规定了与 JSON 的官方语法子集关系。

所以 Kubernetes、CI/CD 等配置生态常见 YAML，但缩进、隐式类型、标签和解析器差异也必须被治理。正确的做法不是把 YAML 当成更好看的 JSON，而是明确版本和 schema，并在加载后验证结果。

![yaml config](images/scene04_img01_yaml_config.png)

图解：YAML 的人类友好设计：依靠缩进表达层次、极简视觉噪声，成为云原生配置标准。

![yaml json subset](images/scene04_img02_yaml_json_subset.png)

图解：YAML 与 JSON 的超集关系：在 JSON 数据模型基础上扩展出更具可读性的配置语法。

![yaml edge](images/scene04_img03_yaml_edge.png)

图解：YAML 的设计陷阱与安全边界：缩进敏感、隐式类型歧义与反序列化安全风险。

## Protobuf：用 schema换取线上效率

.proto → protoc → 生成代码 → 字段编号与兼容演进

当服务间通信更在意紧凑传输、解析速度和跨语言接口时，纯文本就不一定是最合适的线上表示。Protobuf 先用 .proto 描述 typed message，再由 protoc 生成多语言代码，让应用围绕同一份 schema 读写消息。

字段编号会进入 wire format，新字段可以在兼容规则下加入，因此它适合稳定演进的服务间协议。代价是线上二进制不适合直接人工阅读，完整解释通常依赖对应的 .proto 文件，gRPC 只是常见搭配而不是 Protobuf 本身。

![proto schema codegen](images/scene05_img01_proto_schema_codegen.png)

图解：Protocol Buffers 强契约机制：通过 IDL 契约文件结合代码生成器保障跨语言一致性。

![proto wire evolution](images/scene05_img02_proto_wire_evolution.png)

图解：Protobuf 二进制压缩编码与字段向前兼容机制：Varint 编码与极致吞吐性能。

## 今天的现状：四条路线并存

文档交换、Web API、配置维护、服务间传输，各有自己的边界

把四种格式放回工程现场，就会看到 XML 更像文档和复杂契约路线，JSON 更像开放 Web 数据交换路线。YAML 把可维护性放在配置前台，Protobuf 则把 schema、代码生成和紧凑编码放在服务间通信前台。

这不是一条从旧到新的直线，而是人类可读、Web 交换、强 schema 和高吞吐等约束轴上的不同落点。因此格式的现状不是谁淘汰谁，而是谁在什么边界内最合适。

![document api config](images/scene06_img01_document_api_config.png)

图解：三大核心应用场景划分：面向文档用 XML、面向通用 API 用 JSON、面向服务配置用 YAML。

![constraint axis](images/scene06_img02_constraint_axis.png)

图解：数据格式权衡光谱：在人类可读性（易调试）与机器传输效率（极致吞吐）间权衡。

![coexistence map](images/scene06_img03_coexistence_map.png)

图解：现代微服务架构中的格式协同：外部暴露 JSON、内网微服务使用 Protobuf、部署编排使用 YAML。

## 选格式先问四件事

谁来读？怎么传？要不要 schema？如何演进？

如果核心是文档结构、命名空间和复杂企业契约，可以优先评估 XML 及其验证生态。如果核心是公网接口、浏览器通信和轻量文本交换，JSON 往往是自然起点，但重要语义要配套 schema 或协议。

如果核心是人来维护的配置，YAML 提供可读性；如果核心是内部 RPC 和稳定 schema，Protobuf 更值得进入候选。最后记住四个问题：谁来读、怎么传、要不要 schema、如何演进，格式选择就会从潮流判断变成工程判断。

![takeaway](images/scene07_img01_takeaway.png)

图解：数据交换格式选型总结：按场景边界、读写频率、带宽要求与契约严格度进行科学选型。

## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文的框架完成一次小范围验证，再根据真实反馈调整下一步。

## 参考资料

> 📌 **查阅提示**：点击下方超链接可直接复制对应网址，粘贴至手机或电脑浏览器中即可查阅官方完整技术文档与规范。

- [【官方资料】English Wikipedia: XML](https://en.wikipedia.org/wiki/XML)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】English Wikipedia: JSON](https://en.wikipedia.org/wiki/JSON)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】English Wikipedia: YAML](https://en.wikipedia.org/wiki/YAML)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】English Wikipedia: Protocol Buffers](https://en.wikipedia.org/wiki/Protocol_Buffers)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】English Wikipedia: Data exchange](https://en.wikipedia.org/wiki/Data_exchange)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】W3C XML 1.0 Fifth Edition](https://www.w3.org/TR/xml/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】W3C 1998 XML 1.0 Recommendation 公告](https://www.w3.org/Press/1998/XML10-REC)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】IETF RFC 8259](https://www.rfc-editor.org/info/rfc8259)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】Ecma-404 JSON 2nd edition](https://ecma-international.org/publications-and-standards/standards/ecma-404/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】YAML 1.2.2 Specification](https://yaml.org/spec/1.2.2/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】Protocol Buffers Overview](https://protobuf.dev/overview/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】Protocol Buffers Programming Guides](https://protobuf.dev/programming-guides/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】Protocol Buffers Encoding](https://protobuf.dev/programming-guides/encoding/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】W3C SOAP 1.2](https://www.w3.org/TR/soap12/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】W3C XML Core / Namespaces](https://www.w3.org/XML/Core/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】JSON Schema Specification](https://json-schema.org/specification)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】YAML 1.2 Specification](https://yaml.org/spec/1.2.0/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
- [【官方资料】Protocol Buffers Editions Overview](https://protobuf.dev/editions/overview/)  
  *说明：官方权威技术规范与开发者实现参考手册。*
