# 密钥管理：四种方案怎么选？

密钥管理要区分两条问题：Git 中怎样安全保存配置，运行时怎样按身份获取、轮换和撤销密钥。不同方案的控制边界不同。

![第 1 张核心教学图](images/scene01_img01_two_secret_questions.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 2 张核心教学图](images/scene02_img01_kubernetes_secret_resource.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 3 张核心教学图](images/scene02_img02_base64_etcd_risk.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 4 张核心教学图](images/scene03_img01_sops_encrypted_gitops.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 5 张核心教学图](images/scene03_img02_sealed_secrets_cluster_key.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 6 张核心教学图](images/scene04_img01_eso_sync_to_k8s.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 7 张核心教学图](images/scene04_img02_cloud_secret_services.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 8 张核心教学图](images/scene05_img01_vault_identity_dynamic_lease_audit.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 9 张核心教学图](images/scene06_img01_four_way_comparison_matrix.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 10 张核心教学图](images/scene07_img01_rotation_provider_sync.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 11 张核心教学图](images/scene07_img02_application_reload_restart.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 12 张核心教学图](images/scene08_img01_selection_guardrails.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

## 小结

从需求、团队能力、运维成本和可恢复性出发选择方案。先用最小可验证样例确认边界，再扩大到生产环境。

