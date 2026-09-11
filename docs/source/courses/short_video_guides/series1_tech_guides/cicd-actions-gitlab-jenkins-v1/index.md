# CI/CD怎么选？三条流水线

CI/CD 的核心不是工具名称，而是让一次代码提交经过测试、构建、镜像、部署和回滚的可审查流程。GitHub Actions、GitLab CI/CD 与 Jenkins 的区别，主要来自代码托管位置、团队控制面和自建运维能力。

```{figure} images/scene01_img01_cicd_overview.png
:alt: 从提交代码到测试构建部署和反馈的 CI CD 总览
:width: 100%

流水线把提交、验证、交付和反馈连成可重复过程。
```

```{figure} images/scene02_img01_pipeline_flow.png
:alt: CI CD 执行代码拉取、测试、构建镜像和部署的流程
:width: 100%

每一步都应有明确输入、输出和失败处理，不能只追求自动触发。
```

```{figure} images/scene02_img02_tag_registry_rollback.png
:alt: 镜像标签、Registry 与回滚版本管理
:width: 100%

可追溯的标签和 Registry 让部署版本可定位、可回滚。
```

```{figure} images/scene02_img03_ssh_cloud_k8s_deploy.png
:alt: 流水线经 SSH 云平台或 Kubernetes 部署应用
:width: 100%

部署目标不同，凭据、权限和失败恢复策略也不同。
```

```{figure} images/scene03_img01_github_actions.png
:alt: GitHub Actions 与 GitHub 仓库事件集成
:width: 100%

代码主要在 GitHub 时，Actions 的事件与仓库集成通常最直接。
```

```{figure} images/scene03_img02_gitlab_cicd.png
:alt: GitLab CI CD 与 GitLab 项目、Runner 和流水线集成
:width: 100%

团队已使用 GitLab 时，GitLab CI/CD 可把代码、审查、Runner 和发布流程放在同一平台。
```

```{figure} images/scene04_img01_jenkins_architecture.png
:alt: Jenkins 控制器、Agent 和插件构成的自建流水线架构
:width: 100%

Jenkins 提供高度自定义能力，也要求团队维护控制器、Agent、插件和安全更新。
```

```{figure} images/scene04_img02_jenkins_private_custom.png
:alt: Jenkins 适合私有环境和深度定制集成的场景
:width: 100%

私有网络、特殊工具链或深度定制需求明确时，再评估 Jenkins 的运维投入是否值得。
```

```{figure} images/scene05_img01_three_way_matrix.png
:alt: GitHub Actions、GitLab CI CD 与 Jenkins 的选择矩阵
:width: 100%

先按代码托管、控制权、集成与维护成本比较三条路线。
```

```{figure} images/scene06_img01_runner_resources.png
:alt: Runner 或执行器的资源隔离和任务容量管理
:width: 100%

执行器资源、并发和隔离直接决定流水线稳定性与成本。
```

```{figure} images/scene06_img02_production_guardrails.png
:alt: 生产部署需要审批、环境分层和回滚护栏
:width: 100%

生产发布应设置环境分层、审批、健康检查和回滚，而不是让每次提交直接覆盖线上。
```

```{figure} images/scene06_img03_secrets_scope.png
:alt: CI CD 凭据按环境和任务最小范围授权
:width: 100%

密钥必须按最小权限、环境和任务范围管理，避免日志和第三方步骤泄露。
```

```{figure} images/scene07_img01_selection_tree.png
:alt: CI CD 三条流水线的最终选择树
:width: 100%

GitHub 项目优先验证 Actions，GitLab 项目优先验证 GitLab CI/CD；只有强自建与定制需求才投入 Jenkins。
```
