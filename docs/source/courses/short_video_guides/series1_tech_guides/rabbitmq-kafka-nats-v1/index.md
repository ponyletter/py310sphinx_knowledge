# RabbitMQ、Kafka、NATS 怎么选？

消息系统应先按消息形态选择：可靠任务、可回放事件流，还是低延迟实时通信。不要先按吞吐数字下结论；要看确认语义、顺序、保留、消费模式和故障恢复。

![第 1 张核心教学图](images/scene01_img01_message_architecture_v2.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 2 张核心教学图](images/scene02_img01_competing_consumers_wide_v3.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 3 张核心教学图](images/scene03_img01_pubsub_broadcast_wide_v3.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 4 张核心教学图](images/scene03_img01_rabbitmq_routing_v2.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 5 张核心教学图](images/scene04_img01_buffer_failure_wide_v3.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 6 张核心教学图](images/scene04_img01_kafka_partition_log_v2.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 7 张核心教学图](images/scene06_img01_rabbitmq_reliability_wide_v3.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 8 张核心教学图](images/scene07_img01_four_dimension_matrix_v2.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 9 张核心教学图](images/scene08_img01_asyncio_queue_boundary_v2.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 10 张核心教学图](images/scene08_img01_nats_core_wide_v3.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 11 张核心教学图](images/scene09_img01_nats_jetstream_wide_v3.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 12 张核心教学图](images/scene09_img01_selection_tree_v2.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

## 小结

从需求、团队能力、运维成本和可恢复性出发选择方案。先用最小可验证样例确认边界，再扩大到生产环境。

