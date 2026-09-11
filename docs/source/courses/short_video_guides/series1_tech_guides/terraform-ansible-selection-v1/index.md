# 基础设施自动化怎么选？

Terraform 用声明式状态管理云资源，Ansible 通过 Playbook 配置主机与发布应用。两者常常组合，而不是互相替代。

![第 1 张核心教学图](images/scene01_lifecycle_overview.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 2 张核心教学图](images/scene02_terraform_plan_state.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 3 张核心教学图](images/scene03_ansible_playbook_workflow.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 4 张核心教学图](images/scene04_terraform_ansible_matrix.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 5 张核心教学图](images/scene05_terraform_to_ansible_handoff.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

![第 6 张核心教学图](images/scene06_selection_decision_tree.png)

这张图补充本节的关键关系；应结合项目实际负载、权限边界与运行环境验证，而不是脱离条件套用结论。

## 小结

从需求、团队能力、运维成本和可恢复性出发选择方案。先用最小可验证样例确认边界，再扩大到生产环境。

