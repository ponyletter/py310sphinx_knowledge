# 20 批量安装、版本发布与灰度回滚

批量的价值是配置可审计、版本一致、故障不连坐，不是批量重复不可逆发送。先把一台设备部署的人工步骤变成幂等任务，再按一台、一组、全量推进。

## 配置模板与秘密分离

Git 保存无口令的 inventory、服务模板、依赖锁和默认规则；凭据由本机私密文件或独立秘密管理注入。每个账号单独数据库密码、会话密钥和路径。主机清单中的管理 IP、用户名是否可公开也要按组织要求处理。

```yaml
# Ansible 编排示意；项目尚未提供这个完整 role
- hosts: monitor_boards
  serial: 1
  any_errors_fatal: true
  tasks:
    - name: Check current service state before rollout
      ansible.builtin.command:
        argv: [systemctl, is-active, xianyu-monitor-worker]
      changed_when: false
```

`serial: 1` 让每批只处理一个主机，官方说明见 [Ansible 执行策略](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_strategies.html)。完整 role 还必须包含活动任务检查、备份、分发固定版本、权限、启动、健康与受控验收；仅以上片段并不完成发布。

## systemd 模板是命名工具，不自动提供隔离

设计中的 `xianyu-monitor-worker@shop-a.service` 可以引用 `EnvironmentFile=/etc/xianyu-monitor/%i.env` 和公共只读程序路径。实例 env 决定显示、Xauthority、数据目录、数据库与 worker_name。模板服务本身还要正确设置 X socket 权限和停止超时。

发布流水线应先只做无输入回放，再更新 canary 账号，最后由店主安排一条真实受控消息。不要把生产客户当作批量压力测试目标。出现不确定发送，停止扩大批次，先核对实际投递。

## 回滚要覆盖四层

程序版本、依赖环境、校准与规则版本、数据库 schema。图片资产也要有 hash；换图时需要重新验证识别阈值与文件对话框。只回滚 Python 文件而保留不兼容迁移不能称为可回滚部署。

**交付**：一个暂停到下一批的 gate，以及恢复上一稳定版本的演练记录。
