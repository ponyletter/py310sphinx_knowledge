# 阶段三：账号池构建、凭据规范与防封混淆

欢迎进入《阶段三：账号池构建、凭据规范与防封混淆》。

有了正规账号与会员权限后，如何将这些散装账号转化为**可供程序自动化调度、并发调用、并且能持续自动续期的“工业级凭据资产”**？

在现代大模型反代架构中，**工业级号池完全基于 OAuth 2.0 授权凭据（JSON 文件体系）运作**。本阶段深入剖析 Access Token 与 Refresh Token 的全生命周期，详解标准 JSON 凭据结构，全方位对比 Free 免费号与 Plus 会员号的技术权限差异（生图额度与模型支持），揭秘 5 小时速率限制查询的技术真相，并传授请求头随机化、出口 IP 粘性绑定与抖动延时等防封抗探测核心技巧。

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_token_lifecycle_and_extraction
02_json_auth_format_standard
03_batch_account_pool_organization
```
