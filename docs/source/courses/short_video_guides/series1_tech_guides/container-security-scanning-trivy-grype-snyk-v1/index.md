# 容器安全扫描：三工具怎么选？

容器扫描的目标不是得到一张漏洞清单，而是建立从镜像、依赖、SBOM 证据到流水线门禁和修复闭环的安全流程。Trivy、Grype 与 Snyk 的重点不同，应按团队的扫描范围、制品证据和修复协作来选择。

```{figure} images/scene01_img01_scope_overview.png
:alt: 容器安全扫描范围总览
:width: 100%

先定义要扫描镜像、文件系统、依赖、IaC 还是运行时，再选择工具。
```

```{figure} images/scene02_img01_scan_surface_sbom.png
:alt: 扫描表面和 SBOM 的关系
:width: 100%

SBOM 记录制品包含什么，是漏洞匹配、审计和后续追溯的重要证据。
```

```{figure} images/scene03_img01_trivy_coverage.png
:alt: Trivy 的多表面扫描能力
:width: 100%

需要较广扫描覆盖时，可评估 Trivy，并根据项目选择真正需要的扫描项。
```

```{figure} images/scene04_img01_grype_artifact_scan.png
:alt: Grype 对制品和漏洞数据库的扫描
:width: 100%

Grype 适合围绕制品与漏洞匹配建立扫描流程。
```

```{figure} images/scene04_img02_syft_sbom_flow.png
:alt: Syft 生成 SBOM 并交给 Grype 扫描
:width: 100%

Syft 生成 SBOM、Grype 使用它进行漏洞分析，是可追溯制品证据的一条常见组合。
```

```{figure} images/scene04_img03_sbom_evidence.png
:alt: SBOM 作为供应链证据
:width: 100%

SBOM 需要和制品版本、签名或发布记录关联，才可在事件发生时定位影响范围。
```

```{figure} images/scene05_img01_snyk_dev_surfaces.png
:alt: Snyk 覆盖开发阶段多个安全表面
:width: 100%

重视开发者体验、依赖修复建议和团队协作闭环时，可评估 Snyk。
```

```{figure} images/scene05_img02_snyk_fix_policy_loop.png
:alt: 修复和策略闭环
:width: 100%

扫描价值取决于漏洞能否被分派、修复、复测并按策略关闭。
```

```{figure} images/scene05_img03_policy_gate.png
:alt: 流水线策略门禁
:width: 100%

门禁应按严重度、可利用性、暴露面和修复期限设置，避免一刀切阻塞交付。
```

```{figure} images/scene06_img01_three_way_comparison.png
:alt: Trivy Grype Snyk 比较
:width: 100%

覆盖面、SBOM 证据和修复协作是三类工具的主要判断轴。
```

```{figure} images/scene07_img01_pipeline_gates.png
:alt: 容器安全流水线门禁
:width: 100%

在构建、发布和部署阶段设置适当检查，而不是只在最后上线前扫描一次。
```

```{figure} images/scene08_img01_runtime_defense_selection.png
:alt: 运行时防护与扫描工具的边界
:width: 100%

镜像扫描无法替代运行时防护、最小权限、网络隔离和持续监控。
```
