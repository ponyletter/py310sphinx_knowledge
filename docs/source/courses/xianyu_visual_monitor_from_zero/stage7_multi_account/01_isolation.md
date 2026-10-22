# 19 多账号第一步：隔离资源，而非复制进程

当前源码的 `settings`、活动校准、`system_state`、客户与任务均按单实例组织，数据库行没有完整的 account_id 租户边界。仅修改 `XVM_WORKER_NAME` 并启动十个 worker，不能得到十账号系统。

## 两条扩展路线

|路线|数据与进程边界|改造量|建议阶段|
|---|---|---|---|
|实例隔离|每账号独立 DB／账号、数据目录、env、显示、Chrome profile、worker 和 Web 端口|服务模板和部署编排；仍须验证所有锁和路径|少量账号试点|
|共享多租户|表、索引、任务、锁、缓存、权限和审计都带 account_id|较大，需要迁移与越权测试|有明确运维需求后|

实例隔离也可以共用一套只读代码和 Conda，但绝不能共用登录 profile 或可写数据目录；文件锁、latest.png、run 目录都必须隔离。多个应用库可以放在同一个现有 MySQL 容器，不用一个账号就新装一套数据库。

```yaml
# 未来部署清单示例，不是当前程序支持的 CLI 参数
accounts:
  shop-a:
    display: ':21'
    chrome_profile: /home/xy-shop-a/chrome-profile
    env_file: /etc/xianyu-monitor/shop-a.env
    database: xvm_shop_a
    data_dir: /var/lib/xianyu-monitor/shop-a
    worker_name: shop-a
    web_port: 8081
  shop-b:
    display: ':22'
    chrome_profile: /home/xy-shop-b/chrome-profile
    env_file: /etc/xianyu-monitor/shop-b.env
    database: xvm_shop_b
    data_dir: /var/lib/xianyu-monitor/shop-b
    worker_name: shop-b
    web_port: 8082
```

为每一实例生成完整 env，再校准和人工登录。禁止从模板复制 Cookie 或把甲账号的登录目录当作乙账号共享会话。

## 多租户数据库迁移检查

唯一索引从全局键转为账号范围键；API 查询和后台授权强制限定租户；`system_state`、运行设置、校准、lease 和诊断路径都隔离；跨账号作业不可领取。必须做“账号 A 的管理员不能读写 B”的回归测试，而不只是登录两个浏览器。

**交付**：两账号资源清单和故障隔离测试，确认 A 的 F5、暂停、配置修改与进程崩溃不会影响 B。
