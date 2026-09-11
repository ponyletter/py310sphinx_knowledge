# vLLM、Ollama、TGI 怎么选？

它们不是大模型本身，而是把已训练模型加载到电脑或服务器、管理显存和并发，并以接口对外提供推理服务的工具。选型要看本地试验、GPU 生产服务和已有平台资产，而不是追求脱离条件的“最快”。

![模型、推理服务与应用调用的关系](images/scene01_img01_definition_v2.png)

训练让模型获得能力；推理服务负责把模型安全、高效地交付给应用。

![推理服务的加载、显存、批处理和流式返回流程](images/scene02_img01_workflow_v2.png)

上线服务至少要处理模型加载、显存、并发调度和流式输出四项工作。

![Ollama 的本地运行与模型管理](images/scene03_img01_ollama.png)

个人开发、本地知识库、离线试验或低并发内部工具，可先评估 Ollama；认证、限流和高可用通常需要补充体系。

![vLLM 的 GPU 生产推理能力](images/scene03_img02_vllm.png)

GPU 高并发、流式在线服务可优先评估 vLLM，同时承担驱动、容器、网关、扩缩容和故障恢复运维。

![TGI 的 Hugging Face 推理服务定位](images/scene03_img03_tgi.png)

已有 Hugging Face 模型和部署体系可继续评估 TGI；其维护模式意味着新项目应同时评估长期迁移路径。

![三种工具的比较矩阵](images/scene04_img01_comparison_matrix.png)

量化、批处理和接口兼容并不自动得出性能排名；模型、GPU、上下文和并发都会改变结果。

![Ollama 本地场景](images/scene05_img01_ollama_local.png)

本地优先验证下载、模型兼容、硬件占用与开发接口是否满足需求。

![vLLM 在线场景](images/scene05_img02_vllm_online.png)

在线服务应以真实请求压力检查队列、吞吐和尾延迟。

![已有 TGI 平台的场景](images/scene05_img03_tgi_existing.png)

存量平台的迁移决策要计算模型资产、监控、部署和人员成本。

![延迟与吞吐的测试指标](images/scene06_img01_latency_throughput.png)

至少记录首字延迟、生成速度、吞吐、尾延迟和显存占用。

![稳定性与恢复测试](images/scene06_img02_stability_recovery.png)

故障恢复、重试和扩缩容行为同样是生产选择的一部分。

![最终选择总结](images/scene07_img01_selection_summary.png)

本地试验优先 Ollama，GPU 高并发生产优先评估 vLLM，已有 TGI 资产则以迁移与维护成本决定下一步。
