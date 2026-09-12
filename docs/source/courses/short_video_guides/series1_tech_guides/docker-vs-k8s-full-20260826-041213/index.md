# 有了 Docker，为什么还非要 K8s 不可？两者到底是不是竞争关系？

> 对应短视频主题：有了 Docker，为什么还非要 K8s 不可？两者到底是不是竞争关系？  
> 资料核验与更新：2026-09-12


从容器镜像、单机运行到集群调度和自愈，一次讲清 Docker 与 Kubernetes 为什么常常配合使用，以及什么时候根本不必上 K8s。

## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。
原始研究记录标注的时间为：2026-08-26。
本页配图为依据正文新绘的 AI 辅助教学示意图；它们并非原始课程包内的素材，也不代表原始成片画面。

## Docker 管容器，K8s 管一群容器

先分清包装与集群管理，问题就简单了一半。

![单个容器与容器集群的职责对照](images/scene01_docker_k8s_scope.png)

Docker 最擅长的，是把应用、依赖和配置做成标准镜像，再启动为隔离的容器。它解决了在我电脑上能跑，换台机器却跑不起来的问题。

Kubernetes，常简称 K8s，是管理许多容器和许多机器的系统。所以 Docker 更像标准货箱，K8s 更像持续安排货箱位置和运行状态的调度系统。

## 一台机器好管，多台机器就会失控

规模扩大后，启动容器只是运维工作的第一步。

![单机管理和多机调度的差异](images/scene02_single_vs_cluster.png)

只有一台服务器和几个容器时，Docker 加 Compose 往往已经够用。当机器变多，团队必须决定每个容器放在哪里，还要避免某台机器被塞满。

容器崩溃或整台机器掉线后，还要及时在有容量的机器上补回副本。发布新版本时，也要逐步替换旧容器，不能让所有副本同时停机。

## K8s 的核心，是持续纠偏

你声明想要的状态，控制系统不断修正现实。

![期望状态与实际状态的持续纠偏](images/scene03_k8s_reconciliation.png)

K8s 的核心叫期望状态，也就是你想让系统始终保持的样子。例如你声明网页服务需要三个副本，控制系统就持续观察实际到底有几个。

如果一个副本消失，K8s 会创建新的副本，并把它安排到合适的节点。这种控制循环，把许多依赖人工值守的动作变成了可重复的自动纠偏。

## 规模变大后，需要一套集群工具箱

K8s 把常见的分布式运维问题做成统一能力。

![集群规模下的调度、网络与服务治理工具](images/scene04_k8s_toolbox.png)

调度会根据处理器和内存需求，把容器放到资源合适的节点。服务发现和负载均衡，为不断变化的容器副本提供相对稳定的访问入口。

滚动发布会分批替换副本，让新旧版本在受控过程中完成交接。水平扩缩容，就是根据负载增加或减少副本，而不是手工逐台启动容器。

## 不是竞争关系，而是不同层级

真正需要比较的，是同一层里的替代方案。

![容器运行与集群编排处在不同层级](images/scene05_layered_roles.png)

Docker 构建出的标准容器镜像，仍然可以交给 Kubernetes 集群运行。K8s 在节点上通过容器运行时接口，调用兼容的运行时真正启动容器。

Kubernetes 一点二四移除内置的 Docker 适配层，并不等于 Docker 镜像不能用了。因此 Docker Engine 与 K8s 多数时候不是同层竞争，而是开发打包与集群管理的配合。

真正和 K8s 更接近竞争的，是 Docker Swarm、其他编排器或托管应用平台。

## 别为先进而上，要看问题规模

K8s 是复杂度投资，不是技术等级考试。

![按实际规模选择 Docker 与 Kubernetes](images/scene06_scale_decision.png)

如果只有少量服务、单台服务器和可接受的停机风险，Docker 加 Compose 通常更简单。不想管理集群时，还可以选择平台即服务或托管容器产品。

当多节点、多副本、频繁发布、弹性和故障恢复变成日常问题，K8s 的统一控制才开始值回成本。即使使用托管 K8s，团队仍要承担网络、权限、存储、监控和升级带来的复杂度。

结论是两者通常协作而非竞争，是否上 K8s 应由真实运维痛点决定。

## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文的框架完成一次小范围验证，再根据真实反馈调整下一步。

## 参考资料

以下链接来自原始课程研究笔记；动态信息请以其当前页面为准。

- [https://en.wikipedia.org/wiki/Docker_(software](https://en.wikipedia.org/wiki/Docker_(software)
- [https://en.wikipedia.org/wiki/Kubernetes](https://en.wikipedia.org/wiki/Kubernetes)
- [https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)
- [https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)
- [https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/](https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/)
- [https://docs.docker.com/compose/how-tos/production/](https://docs.docker.com/compose/how-tos/production/)
- [https://docs.docker.com/engine/swarm/key-concepts/](https://docs.docker.com/engine/swarm/key-concepts/)
- [https://kubernetes.io/docs/concepts/overview/](https://kubernetes.io/docs/concepts/overview/)
- [https://kubernetes.io/docs/concepts/overview/working-with-objects/](https://kubernetes.io/docs/concepts/overview/working-with-objects/)
- [https://kubernetes.io/docs/concepts/architecture/controller/](https://kubernetes.io/docs/concepts/architecture/controller/)
- [https://kubernetes.io/docs/concepts/architecture/](https://kubernetes.io/docs/concepts/architecture/)
- [https://kubernetes.io/docs/setup/production-environment/](https://kubernetes.io/docs/setup/production-environment/)
- [https://kubernetes.io/blog/2022/02/17/dockershim-faq/](https://kubernetes.io/blog/2022/02/17/dockershim-faq/)
