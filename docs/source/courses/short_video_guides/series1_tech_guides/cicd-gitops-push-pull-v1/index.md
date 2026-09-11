# CI/CD 推还是拉？GitOps怎么做

CI 负责构建和验证制品；CD 负责把已验证制品交付到环境。GitOps 的关键是把 Git 作为期望状态，让集群控制器持续比对并协调实际状态，而不是让外部流水线拥有无限生产权限。

```{figure} images/scene01_overview_ci_vs_gitops-hook-white-v3.png
:alt: CI CD 与 GitOps 的总览
:width: 100%

先区分构建验证与部署协调，才能理解推模式和拉模式的边界。
```

```{figure} images/scene02_delivery_vs_deployment-white-v3.png
:alt: 持续交付与持续部署的区别
:width: 100%

持续交付保留上线决定；持续部署在满足门禁后自动进入生产，风险边界不同。
```

```{figure} images/scene02_traditional_ci_pipeline-white-v3.png
:alt: 传统 CI CD 流水线
:width: 100%

传统流水线通常从代码、测试、制品到部署连续推进，需单独设计生产权限与回滚。
```

```{figure} images/scene03_git_as_desired_state-white-v3.png
:alt: Git 作为集群期望状态
:width: 100%

GitOps 把经过审查的声明式配置作为期望状态来源。
```

```{figure} images/scene04_push_pull_comparison-white-v3.png
:alt: 推模式与拉模式比较
:width: 100%

推模式由外部流水线直接操作环境；拉模式由集群内控制器拉取已批准状态，各自的凭据与审计边界不同。
```

```{figure} images/scene05_drift_and_rollback-white-v3.png
:alt: 配置漂移与回滚
:width: 100%

发现实际状态漂移时，应通过受审查的 Git 变更回滚或修正，而不是临时修改后遗忘。
```

```{figure} images/scene05_reconciliation_loop-white-v3.png
:alt: GitOps 协调循环
:width: 100%

控制器持续比较期望和实际状态，并在授权范围内协调差异。
```

```{figure} images/scene06_ci_build_boundary-white-v3.png
:alt: CI 构建边界
:width: 100%

CI 应负责可重复构建、测试、扫描和制品证据，而非默认直接接管生产。
```

```{figure} images/scene06_gitops_deploy_boundary-white-v3.png
:alt: GitOps 部署边界
:width: 100%

GitOps 负责根据 Git 状态协调部署，但不能替代制品质量验证。
```

```{figure} images/scene06_security_and_limits-white-v3.png
:alt: GitOps 安全边界
:width: 100%

最小权限、审批、密钥保护和审计日志仍是生产自动化的必要条件。
```

```{figure} images/scene07_decision_tree-white-v3.png
:alt: GitOps 选择决策树
:width: 100%

先看环境数量、配置复杂度、审查需求和集群治理能力，再决定是否引入 GitOps。
```

```{figure} images/scene07_safety_gate-white-v1.png
:alt: 上线安全门禁
:width: 100%

高风险变更必须保留测试、审批、健康检查和可回滚门禁。
```
