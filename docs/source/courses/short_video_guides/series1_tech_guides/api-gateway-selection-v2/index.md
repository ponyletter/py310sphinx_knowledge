# 八类网关怎么选？

> 资料核验与更新：2026-09-12

Traefik、HAProxy、Envoy、Kong、APISIX、Spring Cloud Gateway、Gravitee、YesApi Pro 都可能出现在请求入口附近，但解决的问题不同。选型先看自己需要的是稳定转发、云原生入口、API 策略、接口产品化，还是接口开发协作。

```{figure} images/scene01_img01_layer_choice_overview_v3_no_title.png
:alt: 八类网关按转发、入口、策略和平台能力分层
:width: 100%

先把对象放回各自层次，避免把代理、网关和管理平台放在同一把尺上比较。
```

```{figure} images/scene02_img01_layered_ecosystem_map.png
:alt: 请求入口生态中的负载均衡、服务代理、API 网关和管理平台
:width: 100%

HAProxy 偏稳定转发，Traefik 与 Envoy偏云原生入口和服务代理，Kong、APISIX、Spring Cloud Gateway偏 API 策略，Gravitee 与 YesApi Pro 偏管理或协作。
```


## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## 一次请求经历什么

```{figure} images/scene03_img01_request_path_pipeline.png
:alt: 客户端请求经 TLS、路由、认证、限流、后端和观测的路径
:width: 100%

典型请求会经历入口监听、TLS、路由、认证、限流或改写、健康后端与观测；并非每个产品都内建所有步骤。
```

## 三类基础入口

```{figure} images/scene04_img01_proxy_entry_comparison.png
:alt: HAProxy、Traefik 和 Envoy 的入口职责比较
:width: 100%

高连接数和稳定转发看 HAProxy；容器自动发现和快速入口看 Traefik；复杂服务治理与网格环境看 Envoy。
```

选择时还要计算证书轮换、配置发布、服务发现和可观测性带来的长期运维成本。

## 三类 API 策略网关

```{figure} images/scene05_img01_kong_plugin_gateway.png
:alt: Kong 通过插件执行 API 认证、限流和路由治理
:width: 100%

需要插件化 API 策略、声明式配置或混合云治理时，可评估 Kong。
```

```{figure} images/scene05_img02_apisix_dynamic_gateway.png
:alt: APISIX 的动态路由和插件化网关能力
:width: 100%

需要动态路由、热更新插件和较强流量治理时，可评估 APISIX。
```

```{figure} images/scene05_img03_spring_gateway_filters.png
:alt: Spring Cloud Gateway 使用路由谓词和过滤器扩展网关
:width: 100%

Java 与 Spring 团队希望在熟悉的运行时内扩展路由和过滤器时，可评估 Spring Cloud Gateway。
```

## 当需求转向 API 产品化

```{figure} images/scene06_img01_gravitee_api_management.png
:alt: Gravitee 提供开发者门户、订阅和 API 生命周期管理
:width: 100%

需要接口目录、开发者门户、订阅与生命周期治理时，评估 Gravitee 这类 API 管理平台。
```

```{figure} images/scene06_img02_yesapi_collaboration_platform.png
:alt: YesApi Pro 面向接口文档、调试、协作和开放平台
:width: 100%

若主要问题是接口设计、文档、调试和协作，可评估 YesApi Pro；它不应直接替代底层代理。
```

## 运维清单和最终判断

```{figure} images/scene07_img01_operations_checklist.png
:alt: 证书、声明式配置、观测、控制面与运维成本检查清单
:width: 100%

选型时必须检查证书与密钥、配置审查回滚、日志指标链路和高可用组件。
```

```{figure} images/scene07_img02_control_data_plane_boundary.png
:alt: 控制面负责配置分发，数据面负责实际转发的边界
:width: 100%

控制面与数据面分离能提升治理能力，也会增加部署与故障排查复杂度。
```

```{figure} images/scene08_img01_scenario_decision_tree.png
:alt: 按需求选择八类网关的场景决策树
:width: 100%

从需求层次、团队栈和运维能力逐层缩小候选集。
```

```{figure} images/scene09_img01_selection_summary.png
:alt: 八类网关的最终选型总结
:width: 100%

需求越简单，越不要为了完整治理平台引入不必要的复杂度。
```


## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文梳理的选型维度与边界原则完成一次小范围工程验证，再根据真实系统反馈调整下一步决策。

## 参考资料

- [Traefik Gateway API](https://doc.traefik.io/traefik/reference/routing-configuration/kubernetes/gateway-api/)
- [HAProxy Documentation](https://www.haproxy.com/documentation/)
- [Envoy](https://www.envoyproxy.io/docs/envoy/latest/)
- [Kong Gateway](https://docs.konghq.com/gateway/latest/)
- [Apache APISIX](https://apisix.apache.org/docs/)
