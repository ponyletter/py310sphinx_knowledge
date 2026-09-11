# Ingress、网关、Istio怎么选？

> 更新于：2026-09-12

三者都可能处在外部请求进入服务的路径上，但不在同一层：Ingress 是 Kubernetes 的 HTTP/HTTPS 路由规则；API 网关是在代理之上执行认证、限流和 API 策略的运行层；Istio Ingress Gateway 是服务网格边缘、把请求带入网格的入口代理。

```{figure} images/scene01_img01_entry_layers.png
:alt: Ingress、API 网关和 Istio Gateway 的入口层次
:width: 100%

先区分规则、API 策略层和服务网格边缘入口，才能避免把三者当作同一种产品。
```

## Ingress：规则不是执行者

```{figure} images/scene02_img01_ingress_rule.png
:alt: Ingress 描述域名、路径、TLS 与后端服务
:width: 100%

Ingress 声明主机、路径、TLS 和后端 Service 的映射关系。
```

只有创建 Ingress 不会自动接住流量；需要 Controller 把规则翻译成真正的数据面配置。

```{figure} images/scene02_img02_controller_execution.png
:alt: Ingress Controller 读取规则并配置入口代理
:width: 100%

Ingress Controller 才是读取规则、配置代理并实际处理请求的执行者。
```

## API 网关与网格入口的分工

```{figure} images/scene03_img01_three_layer_ruler.png
:alt: 规则声明、API 策略和服务网格入口的三层比较
:width: 100%

API 网关补充认证、授权、限流、改写与版本治理；Istio Gateway 则连接外部入口与网格内治理。
```

API 网关主要面向南北向流量。Istio 服务网格还治理服务之间的东西向流量，例如身份、mTLS、重试、熔断和流量分配；一个 Ingress Gateway 不是整个服务网格。

```{figure} images/scene04_img01_api_policy_chain.png
:alt: API 网关在请求路径中执行认证、限流和改写
:width: 100%

策略治理发生在把外部请求转发到后端之前。
```

```{figure} images/scene04_img02_north_south_governance.png
:alt: API 网关处理外部南北向请求的治理链路
:width: 100%

南北向治理关心外部调用者如何被认证、限制和路由。
```

## 已使用 Istio 时的入口链路

```{figure} images/scene05_img01_external_to_mesh.png
:alt: 外部负载均衡器经 Istio Ingress Gateway 进入服务网格
:width: 100%

典型链路是外部负载均衡器到 Istio Ingress Gateway，再由路由规则进入网格服务。
```

进入网格后，服务间调用仍由网格策略和代理共同治理。

```{figure} images/scene05_img02_east_west_mesh.png
:alt: Istio 服务网格内部的东西向流量治理
:width: 100%

东西向流量与入口流量的治理目标不同，不能只靠一个入口网关概括。
```

## 常见实现怎样选

```{figure} images/scene06_img01_ingress_nginx.png
:alt: Ingress NGINX 以规则、注解和配置映射实现 HTTP 入口
:width: 100%

简单 HTTP 入口、成熟 Controller 生态：优先评估 Ingress-NGINX。
```

复杂注解和模板会提高维护成本；配置变化也需理解生成配置与重载的实际边界。

```{figure} images/scene06_img02_apisix_ingress.png
:alt: APISIX Ingress 提供动态路由和插件治理能力
:width: 100%

需要动态路由、认证、限流和插件治理：评估 APISIX Ingress，同时承担更多组件复杂度。
```

已经采用 Istio 时，入口应与网格的身份、路由和可观测性体系共同设计。

```{figure} images/scene06_img03_istio_ingress_gateway.png
:alt: Istio Ingress Gateway 将外部请求接入服务网格
:width: 100%

已使用服务网格：优先把 Istio Ingress Gateway 作为统一边缘入口进行评估。
```

## Gateway API 是标准接口，不是单一网关产品

```{figure} images/scene07_img01_gateway_api_roles.png
:alt: GatewayClass、Gateway 与 HTTPRoute 分离基础设施和应用路由角色
:width: 100%

Gateway API 通过角色分离改善多团队协作与可移植性。
```

它仍需要具体 Controller 或实现提供数据面能力。

```{figure} images/scene07_img02_standard_to_controller.png
:alt: Gateway API 标准资源由具体控制器实现为实际入口能力
:width: 100%

标准接口与实际执行者应分开理解。
```

```{figure} images/scene08_img01_selection_summary.png
:alt: Ingress、API 网关、Istio Gateway 和 Gateway API 的选择总结
:width: 100%

先判断是简单入口、API 策略、网格入口还是长期标准化协作，再选择实现。
```

## 参考

- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Kubernetes Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/)
- [Istio Ingress](https://istio.io/latest/docs/tasks/traffic-management/ingress/)
- [Apache APISIX Ingress](https://apisix.apache.org/docs/ingress-controller/overview/)
