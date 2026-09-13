# 海外大模型反代与高可用号池工程实战

> **从 0 到 1 构建私有 AI 中转网关、正规订阅采买、拼车红利与多机容灾全景指南**

---

## 专栏背景与核心价值

在面向国内业务系统（如企业 Web 应用、内容生成服务、移动端、智能体开发及本地 IDE）接入 ChatGPT、Claude、Gemini 等海外顶级大模型时，开发者通常面临一系列棘手的“基础设施与商业风控壁垒”：

1. **跨境网络阻断与流式延迟**：国内服务器直连海外官方端点极易受抖动与阻断干扰，长推理容易遭遇超时掐断；
2. **账号风控与大面积连坐清算**：劣质机房 IP、黑卡代充或共享被盗号极易触发官方风控封停；
3. **单账号并发配额瓶颈**：单号面临严苛的 3~5 小时速率限制（RPM/TPM），多子智能体并发时大面积报 429 错误；
4. **第三方中转站数据隐患与掺水**：很多低价中转站存在模型降级替换（掺水）、截留业务源码与工作现场敏感数据倒卖的隐患；
5. **信息不透明与灰产信息差**：缺乏对发卡网、号商供应链、倍率计算与真实合租机制的认知，屡屡交“学费”。

本专栏基于工业级生产实践，提供一套**自主可控、100% 真实满血、高可用抗封锁**的海外 AI 账号池与反向代理体系化建设方案：从行业黑话剖析、正规礼品卡/拼车采买、账号凭据提取，到 Docker 容器编排、SSH 纯加密隧道、多 VPS 节点容灾、桌面端工具接入以及全链路监控排错。

---

## 阶段架构概览

```{mermaid}
flowchart TD
    S1["阶段一：地下灰产、行业黑话与生态全景<br/>(供应链分工/倍率计价公式/不可能三角/发卡探测)"]
    S2["阶段二：正规采买、拼车红利与海外支付<br/>(苹果礼品卡/Gamsgo程序员红利/U卡/代充防背刺)"]
    S3["阶段三：账号池构建、凭据规范与防封混淆<br/>(OAuth全流程/JSON标准/Free vs Plus/请求混淆)"]
    S4["阶段四：海外 Linux 节点选型与环境加固<br/>(原生干净IP检测/TCP BBR加速/Docker CE安全加固)"]
    S5["阶段五：跨境通信管道：SSH 加密隧道 vs HTTPS<br/>(纯加密隧道/灰橙云取舍/ACME ECC证书/Nginx流式调优)"]
    S6["阶段六：CLIProxyAPI 核心网关部署与动态调度<br/>(容器编排/config.yaml密码机制/Web可视化控制台/排除Free模型/动态调度)"]
    S7["阶段七：桌面客户端、多机 SSH 容灾与故障排查<br/>(ToAPI Proxy/Claude Code与AGY集成/多VPS容灾/故障反推)"]

    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
```

---

## 阶段目录导航

```{toctree}
:maxdepth: 2
:caption: 课程阶段导航

stage1_terminology_and_ecology/index
stage2_official_purchase_and_avoid_pitfalls/index
stage3_account_pool_and_token_extraction/index
stage4_linux_infra_and_network/index
stage5_domain_cloudflare_and_ssl/index
stage6_cliproxyapi_deployment_and_scheduling/index
stage7_agy_and_miniapp_integration/index
```
