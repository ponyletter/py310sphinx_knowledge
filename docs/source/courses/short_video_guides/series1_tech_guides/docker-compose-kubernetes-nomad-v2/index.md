# K8s、Docker Compose、Nomad怎么选？

编排工具的选择取决于运行规模、故障恢复、交付方式和团队运维能力。Docker Compose 适合单机开发和简单服务组合；Kubernetes 面向复杂集群编排；Nomad 提供较轻量的调度路线，也能处理多种工作负载。

```{figure} images/scene01_img01_orchestrator_choice_overview.png
:alt: Docker Compose Kubernetes Nomad 的选择总览
:width: 100%

先看单机还是集群、应用复杂度和团队运维能力。
```

```{figure} images/scene02_img01_compose_single_host.png
:alt: Docker Compose 单机服务组合
:width: 100%

本地开发、演示和单机服务组合，Compose 的配置和心智负担最小。
```

```{figure} images/scene02_img02_kubernetes_cluster.png
:alt: Kubernetes 集群编排
:width: 100%

多节点调度、服务发现、弹性和声明式集群治理是 Kubernetes 的典型价值。
```

```{figure} images/scene02_img03_nomad_scheduler.png
:alt: Nomad 调度不同类型工作负载
:width: 100%

Nomad 是另一条调度路线，应按生态集成、网络、存储和运维方式具体验证。
```

```{figure} images/scene03_img01_three_way_comparison.png
:alt: 三种编排工具比较
:width: 100%

三者不是简单升级关系；复杂度和治理能力会同时增长。
```

```{figure} images/scene04_img01_compose_to_cluster_gap.png
:alt: 从 Compose 到集群编排的能力缺口
:width: 100%

从单机迁往集群时，要补齐网络、存储、配置、监控、权限和发布流程。
```

```{figure} images/scene04_img02_migration_checklist.png
:alt: 编排迁移检查清单
:width: 100%

迁移应先验证最关键服务和故障恢复，而不是一次重写全部配置。
```

```{figure} images/scene05_img01_k3s_lightweight_kubernetes.png
:alt: K3s 作为轻量 Kubernetes 路线
:width: 100%

需要 Kubernetes API 生态但资源更有限时，可评估 K3s 等轻量发行版。
```

```{figure} images/scene05_img02_nomad_mixed_workloads.png
:alt: Nomad 调度容器与非容器混合工作负载
:width: 100%

混合工作负载和团队现有 HashiCorp 生态会影响 Nomad 的适配度。
```

```{figure} images/scene06_img01_compose_scenario.png
:alt: Compose 典型场景
:width: 100%

单机、开发、演示和简单交付：从 Compose 开始。
```

```{figure} images/scene06_img02_kubernetes_scenario.png
:alt: Kubernetes 典型场景
:width: 100%

多服务、多环境、集群弹性和标准化治理：评估 Kubernetes。
```

```{figure} images/scene06_img03_nomad_scenario.png
:alt: Nomad 典型场景
:width: 100%

需要更轻量调度或混合负载：评估 Nomad 的生态与运维边界。
```

```{figure} images/scene07_img01_selection_summary.png
:alt: 编排工具选择总结
:width: 100%

从真实规模和故障恢复需求出发，避免为了“更云原生”提前引入超出团队承受能力的复杂度。
```
