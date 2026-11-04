# 阶段二：大模型深度对话、Agent 协同与使用技巧

本阶段专门用于归档与各类前沿大模型（Claude、Codex、Gemini、DeepSeek、GPT 等）交互过程中产出的**高价值对话、多轮推演记录、有效 Prompt 模板，以及高阶使用技巧与双工具协同工程实践**。

很多复杂工程与架构难题往往在 Agent 的自主推进与多模型交叉验证中得以破局，及时沉淀工作流与方法论能有效构筑个人与团队的“外部数字第二大脑”。

---

## 📑 阶段核心模块全景

| 序号 | 篇目主题 | 核心实战重点与特色 | 实操者 / 标杆模型 | 形式与交付物 |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | [高质量对话记录模板](01_dialogue_template.md) | 标准对话归档规范、背景/提问/推演/落地四步法 | 通用工程模板 | 规范结构卡片 |
| **2.2** | [Claude Code 与 Agent 协同实录](02_claude_code_and_agents.md) | 复杂工程跨模块重构、多文件感知与工具调用（Tool Use） | Claude Code CLI | 交互流转图 + 案例 |
| **2.3** | [实用 Prompt 工程与实战案例](03_prompt_engineering_records.md) | 针对性提示词调优、少样本（Few-shot）与防御性约束 | 提示词工程库 | 可复用 Prompt |
| **2.4** | [主流大模型速度与成本全景横评](04_llm_speed_cost_benchmarks_and_tiered_workflow.md) | Pareto 前沿、吞吐速度对比与分层模型协作架构（Flash / MoE） | Gemini / DeepSeek / Claude / GPT | 实测对比表 + 分层架构 |
| **2.5** | [【案例精选】七天烧 230 亿 Token：50 条 Codex 高阶实践](05_case_linghufeng_23b_tokens_codex_practices.md) | AI Native 心智跃迁、破除省 Token 陷阱、Plan 模式规范、TDD 驱动与失败反例库 | 令狐峰（航海家） | 50 条工程法则 + 体系解构 |
| **2.6** | [【案例精选】Claude Code × Codex 双工具协作与 Mac 目录规范](06_case_yiren_claude_code_codex_collaboration_backup.md) | 仓库为脑工具为手、Mac 标准目录拓扑、软链接统一规范、/pickup 与 /handoff 交接仪式、一支笔防踩踏 | 亦仁（生财有术） | 双工具协同 SOP + 容灾演练 |
| **2.7** | [【案例精选】一个人指挥一群 Codex：多窗口 Worktree 并行工程流](07_case_lixiangjun_codex_worktree_multiwindow.md) | 主控拆解 Spec/Task、串行打地基、三套独立界面 Worktree 并发、防顺手改与专门集成窗口 | 李香君（资深工程师） | 拆/隔/并/收 四步工作流 |
| **2.8** | [【案例精选】业务流程做成 AI 员工：8 步法与 4 层工业化架构](08_case_lushuye_build_ai_agent_employee_8steps.md) | Agent/Skill/知识库/CLI-MCP 四层架构、八步法制作 SOP、语义归模型与机械归脚本、去记忆回归验证 | 鹿书野（B站好物深海圈教练） | AI 员工制作八步法 + 飞书控制台 |
| **2.9** | [【案例精选】微信群 AI 助理：重要消息抓取与观点蒸馏实战](09_case_xuanyuan_wechat_group_ai_agent.md) | wx-cli 本地只读、macOS 重签名授权、人工决策门禁、免打扰群摘要与深度对话商业观点蒸馏 | 轩辕（生财首届航海家） | 助理预处理 SOP + 脱敏提炼模型 |
| **2.10** | [【案例精选】从后端研发到大航海领队：运营 SOP 沉淀为 24 项全能 Skill](10_case_awei_codex_community_lead_skill.md) | dahanghai-volunteer-ops 体系、生财 MCP + 飞书 CLI、任务五要素破假闭环、34 款上岸海报 Skill、3:6:1 评分法 | 阿喂（10年后端的领队） | 24 项领队 Skill + 防御写入 SOP |
| **2.11** | [【案例精选】海量精华帖产品化：生财 MCP + Codex 架构拆解 SOP](11_case_jason_shengcai_mcp_to_website_sop.md) | 生财大盘需求雷达、SOP 翻译为系统架构、FastAPI 四层架构与离线 Mock、防 100 个子 Agent 失控死锁 | Jason、mar（AI在读博士） | SOP 软件化全流程 + 避坑指南 |
| **2.12** | [【案例精选】一人公司 AI Agent 文件管理白皮书：四框架与安全治理](12_case_zhouzhi_one_person_company_agent_files_whitepaper.md) | 万物皆文件哲学、四框架选型决策树（CC/Codex/OpenClaw/Hermes）、CLAUDE.md 200 行法则、PreToolUse 拦截 | #周知2.0（AI超级个体） | OPC Agent 文件白皮书 + Hook 防线 |
| **2.13** | [【案例精选】企业级 AI 员工体系与 AI 中心建设实战](13_case_yiren_shengcai_ai_employee_system.md) | 生产关系重组、管理 Agent 的 Agent 治理层（架构师/运维官/审核官）、统一 Codex+飞书、TokenRank 竞技大盘 | 亦仁（生财有术创始人） | AI 中心落地架构 + 组织改造心法 |
| **2.14** | [【案例精选】Claude Skill 从原理到实战：公众号自动撰写与发布](14_case_tianwei_claude_skill_official_wechat_automation.md) | Skill与MCP解剖（菜谱vs冰箱）、DeepSeek V3 兼容反代、skill-creator 一句话构建、MCP-Exa + Nanobanana + 官方草稿箱直连 | 田威（生财创作者） | Skill 标准工程 + 全自动生产链 |
| **2.15** | [【实战对话】加密支付卡全景横评与 RedotPay 链上充值避坑指南](15_case_crypto_payment_cards_and_redotpay_onchain_guide.md) | 主流加密支付卡横评矩阵、RedotPay 交易量破局逻辑、OKX 提币 Solana/USDT0 网络选型、内部记账与链上 Gas 原理及合规风控 | 大模型推演对话整理 | 综合对比表 + 流程架构图 + 避坑指南 |
| **2.16** | [【架构推演】从本地 Claude Code 到分布式 Agent 控制台：远程 Web 控制、持久化会话、R2 资产管道与弹性沙箱架构](16_case_remote_claude_code_web_agent_control_plane_and_sandbox.md) | Headless Agent Runtime 改造、断线事件重放、开源生态横评（Happy/Agents-Anywhere/CloudCLI）、R2 预签名大文件管道、2C2G 控制面与云端沙箱（E2B/Modal/Cloud Sessions） | 大模型深度架构推演 | 架构拓扑图 + 开源横评表 + 时序交互图 |
| **2.17** | [【实战对话】特惠年付 VPS 深度选购指南：硬性门槛、现货核验、Windows 适配、线路实测与自动化比价提示词](17_case_annual_deal_vps_selection_and_live_verification_guide.md) | 年付真假现货甄别、续费同价/涨价陷阱、三网回程直连优化（CN2 GIA/9929/CMIN2）、换 IP 资费矩阵、Windows 适配四层级与自动化比价 System Prompt | 大模型实时探针比价实录 | 评测矩阵表 + 好价基准线 + 线路图谱 + 结构化提示词 |
| **2.18** | [【实战对话】Claude 订阅与成品账号全景选购指南：Org ID 直充原理、App Store 映射内幕、成品号横评与 Visa 支付风控](18_case_claude_subscription_orgid_recharge_and_account_guide.md) | Organization ID 直充技术底层（Apple StoreKit 映射）、付款与使用 IP 风控实测、成品账号市场横评（GamsGo/G2G/Z2U）、Visa 刷卡成功率及防封防骗指南 | 大模型深度调研与支付推演 | 充值时序图 + 平台横评表 + 账号决策树 |
| **2.19** | [【实战对话】eSIM 转实体卡生态、全球漫游免翻流量与香港 Club Sim 全流程保号实战指南](19_case_esim_physical_cards_global_roaming_and_clubsim_guide.md) | 国行 iPhone 解锁方案（ESTK/9eSIM/XeSIM/BeeSIM）、国际漫游 GTP 隧道免翻直连原理、海外低成本保号卡矩阵（Club Sim/3HK/Ultra PayGo）与 Club Sim 365天购买保号规则实测 | 数字移民基建推演与实测 | 硬件横评表 + 漫游时序图 + 保号实测 SOP |
| **2.20** | [【实战指南】Claude Pro / Max 订阅决策、付款两层法、防封风控与被拒分诊冷却全景手册](20_case_claude_pro_max_subscription_anti_ban_and_payment_triage_guide.md) | 选档科学模型 (被迫停工时间算法/Claude Code 消耗量级)、付款两层架构 (发卡行场景准入 vs 卡与环境三维一致)、绑卡被拒分诊表与严格冷却策略 (静置1h/冷却24h/禁连点锁)、降低异常信号哲学与企业分卡隔离治理 | 支付风控工程推演与工单实战 | 选档速查表 + 两层排查图 + 被拒分诊表 + 英文申诉SOP |
| **2.21** | [【实战对话】DUIX 开源数字人全景落地：官网 Key 与免费积分、Docker 本地部署、踩坑排错与 course-render 课程视频 FFmpeg 圆形画中画无痕合成](21_case_duix_avatar_cli_docker_deployment_and_course_video_synthesis.md) | 硅基智能生态选型 (云端API vs Docker本地推理)、RESTful接口规范 (`/easy/submit` & `/easy/query`)、`moov atom not found` I/O竞态排错与探针校验、音频时间轴错位与 `-shortest` 截断陷阱规避、FFmpeg 圆形羽化遮罩 (`geq/crop/scale/overlay`) 与微课左下角画中画视觉美学 | 开源数字人实战与音视频工程 | 架构时序图 + 排错速查表 + 生产级合成脚本 |
| **2.22** | [【实战对话】FreeLLMAPI 统一大模型总网关架构：CPA 订阅聚合、OpenRouter 深度比价与 BYOK 免费路由、低价推理商横评与独立 Agent 全栈选型指南](22_case_freellmapi_unified_gateway_cpa_openrouter_and_agent_frameworks.md) | 统一模型网关设计 (Single Source of Truth, 唯一域名与Key)、CPA 订阅凭证隔离 (Codex/Claude Code OAuth)、OpenRouter 5.5% 费率拆解与 BYOK 每月 $25,000 免费路由通道、低价推理商梯队 (DeepInfra/Novita/SiliconFlow/Groq/Cerebras/Cloudflare)、警惕黑灰产私人中转与降级陷阱，以及独立 Agent 框架全景横评 (Vercel AI SDK/Mastra/LangGraph/LlamaIndex/MCP) | 架构推演与独立开发全栈选型 | 四层架构拓扑 + 路由决策流水线 + 价格横评表 + 选型决策树 |
| **2.23** | [【实战对话】海外 VPS 节点极速搭建与分流排错实战：3X-UI 运维、BBR 加速、Cloudflare CDN 复活甲拯救被阻断 IP、VLESS-WS-TLS 443 改造、移动优选 IP 与 ACL4SSR Clash 智能分流订阅全景指南](23_case_vps_3xui_v2rayn_clash_verge_cloudflare_cdn_and_acl4ssr_routing_guide.md) | 3X-UI 凭证 Bcrypt 哈希解析与重置、移动宽带 IP 阻断排错、Let's Encrypt ECC 自动化签发、Cloudflare CDN 小云朵复活甲、VLESS-WS-TLS 443 改造、移动优选 IP 延迟压降，以及 Subconverter 在线管道与 ACL4SSR / Loyalsoldier 国内分流规则实战 | 大模型实时运维排障与节点重构实录 | 网络拓扑图 + 协议决策树 + 数据库注入脚本 + ACL4SSR 订阅 |
| **2.24** | [【实战对话】多节点 VPS 集群工程实战：GreenCloud 与 ByteVirt 3X-UI 部署、Cloudflare 443 CDN 复活、移动/联通优选 IP 与 ACL4SSR 多节点全景分流聚合](24_case_multi_vps_cluster_greencloud_bytevirt_3xui_cf_cdn_and_clean_ip.md) | RackNerd/GreenCloud/ByteVirt 多节点集群容灾、3X-UI v3.8 与 v3.11 SQLite 底层列结构兼容、标准 443 端口与 Reality 2083 无损迁移、移动优选 IP 与联通优选 IP 定向调度、多节点 Subconverter 聚合与 ACL4SSR 零损耗分流实录 | 多机房网络运维与节点矩阵工程 | 拓扑流向图 + 节点配置矩阵 + 兼容脚本 + Clash 聚合订阅 |
| **2.25** | [【实战对话】从 Clash Verge 订阅死局到单机 4 容器黄金拓扑：跨模型 Agent 协同、流量守卫与本地规则生成全景复盘](25_case_lxc_virtualization_and_agent_mesh_evolution.md) | 在线转换工具内核滞后排查、后量子 ML-KEM-768 握手攻克、按量计费住宅流量防偷跑、Cloudflare 优选 IP 端口陷阱、容器 BBR 开机自愈、机型与系统推荐基准，以及 Linux 可复用命令速查 | 跨大模型长程协同与工程排错实录 | 痛点问答卡片 + 故障映射表 + 选购基准 + 一键命令字典 |
| **2.26** | [【实战对话】特惠海外 VPS 论坛淘金、机房线路横评与双 ISP 静态住宅真假鉴别 6 步法](26_case_vps_procurement_forum_trading_and_isp_scamalytics_guide.md) | 奥格登 Ogden UT 内陆 vs 美西沿海访问优先级、AMD 9950X 跑分实测、美区 TikTok 坚决避开家宽 NAT 原理、前置中转与落地代理拓扑、四大论坛（NodeSeek/LINUX DO/LET）二手收机溢价鉴别、Socks5 验货 6 步法与 Scamalytics 欺诈分提取 | 大模型深度采购与风控推演实录 | 机房优先级表 + 论坛收机指南 + 验货 6 步法 + uv 工具链 |
| **2.27** | [【实战对话】软路由 PassWall 内存爆仓 OOM 救活、VPS 假被封真断连排错与 ImmortalWrt 出海部署实录](27_case_openwrt_passwall_oom_fix_vps_gfw_diagnosis_sop.md) | 小米 AX3000T (256MB) 路由 Xray 内存爆仓 OOM 秒级救活命令、GOMEMLIMIT=60MiB 锁死调优、冗余组件精简、搬瓦工 VPS 假性被墙排错 SOP（ICMP 正常铁证未被墙，免密改 SSH 端口救活）、ImmortalWrt vs iStoreOS 出海选型与官方源清单 | 软路由排障与网络防穿帮实录 | OOM 救活命令 + GOMEMLIMIT 脚本 + 假被墙排错 SOP + 固件选型表 |
| **2.28** | [【实战对话】iOS / 跨端客户端分流异化排查：Streisand 与 Shadowrocket 逆向规则解构、国内大厂（闲鱼/抖音）DNS 漂移与卡顿根治、域名嗅探与 Split DNS 全景落地](28_case_ios_streisand_shadowrocket_clash_split_routing_and_app_lag_diagnosis.md) | Streisand / Shadowrocket 逆向解构（Apple bplist00 解密）、粗粒度规则导致国内大厂 App（闲鱼/抖音）跨洋走美西 CDN 延迟暴涨与异地风控死因、HTTPDNS 纯 IP 直连逃逸排错、域名嗅探（TLS/QUIC Sniffing）精准命中、Happy Eyeballs IPv6 双栈黑洞根治，以及跨端 Split DNS 统一治理 | 移动端网络分流排障与协议逆向实录 | 逆向解码脚本 + 致死链路图 + 四步根治 SOP + 日志验证命令 |

---

## 阶段目录导航

```{toctree}
:maxdepth: 1

01_dialogue_template
02_claude_code_and_agents
03_prompt_engineering_records
04_llm_speed_cost_benchmarks_and_tiered_workflow
05_case_linghufeng_23b_tokens_codex_practices
06_case_yiren_claude_code_codex_collaboration_backup
07_case_lixiangjun_codex_worktree_multiwindow
08_case_lushuye_build_ai_agent_employee_8steps
09_case_xuanyuan_wechat_group_ai_agent
10_case_awei_codex_community_lead_skill
11_case_jason_shengcai_mcp_to_website_sop
12_case_zhouzhi_one_person_company_agent_files_whitepaper
13_case_yiren_shengcai_ai_employee_system
14_case_tianwei_claude_skill_official_wechat_automation
15_case_crypto_payment_cards_and_redotpay_onchain_guide
16_case_remote_claude_code_web_agent_control_plane_and_sandbox
17_case_annual_deal_vps_selection_and_live_verification_guide
18_case_claude_subscription_orgid_recharge_and_account_guide
19_case_esim_physical_cards_global_roaming_and_clubsim_guide
20_case_claude_pro_max_subscription_anti_ban_and_payment_triage_guide
21_case_duix_avatar_cli_docker_deployment_and_course_video_synthesis
22_case_freellmapi_unified_gateway_cpa_openrouter_and_agent_frameworks
23_case_vps_3xui_v2rayn_clash_verge_cloudflare_cdn_and_acl4ssr_routing_guide
24_case_multi_vps_cluster_greencloud_bytevirt_3xui_cf_cdn_and_clean_ip
25_case_lxc_virtualization_and_agent_mesh_evolution
26_case_vps_procurement_forum_trading_and_isp_scamalytics_guide
27_case_openwrt_passwall_oom_fix_vps_gfw_diagnosis_sop
28_case_ios_streisand_shadowrocket_clash_split_routing_and_app_lag_diagnosis
29_case_customer_network_error_vless_gfw_blocking_types_and_residential_latency_diagnosis
30_case_transpacific_evening_peak_udp_qos_relay_architecture_and_client_compatibility
```

```{important}
**使用建议**：
1. **常规突破性对话**：导出文本并使用 `01_dialogue_template.md` 归档。
2. **高强度高阶开发**：深度参考令狐峰的 **50 条高强度实践法则**（[2.5 章节](05_case_linghufeng_23b_tokens_codex_practices.md)）转变心智；结合亦仁的 **双工具协作与交接 SOP**（[2.6 章节](06_case_yiren_claude_code_codex_collaboration_backup.md)）与李香君的 **Worktree 多窗口并发**（[2.7 章节](07_case_lixiangjun_codex_worktree_multiwindow.md)）杜绝代码冲突与账号单点故障。
3. **数字员工与企业治理**：参考鹿书野的 **业务流程做成 Agent 八步法**（[2.8 章节](08_case_lushuye_build_ai_agent_employee_8steps.md)）沉淀确定性资产；遵照周知 2.0 的 **Agent 文件白皮书**（[2.12 章节](12_case_zhouzhi_one_person_company_agent_files_whitepaper.md)）构筑安全 Hook 防线；结合亦仁的 **企业 AI 员工与 AI 中心实战**（[2.13 章节](13_case_yiren_shengcai_ai_employee_system.md)）完成团队生产关系重组。
4. **自然语言流水线**：参考田威的 **Claude Skill 极简实战**（[2.14 章节](14_case_tianwei_claude_skill_official_wechat_automation.md)），用“菜谱+冰箱”思维与 `skill-creator` 一句话快速搭建专属全自动业务流水线。
5. **跨境出海与 AI 订阅支付**：参考 **加密卡全景横评与充值指南**（[2.15 章节](15_case_crypto_payment_cards_and_redotpay_onchain_guide.md)），科学选型支付卡、核准链上网络手续费并严格遵守合规安全准则。
6. **分布式 Agent 基础设施搭建**：参考 **从本地 Claude Code 到分布式控制台与弹性沙箱架构**（[2.16 章节](16_case_remote_claude_code_web_agent_control_plane_and_sandbox.md)），使用 2C2G 轻量控制面配合 R2 与云端沙箱调度重型任务。
7. **海外高性价比 VPS 捡漏与比价**：参考 **特惠年付 VPS 深度选购指南与比价提示词**（[2.17 章节](17_case_annual_deal_vps_selection_and_live_verification_guide.md)），利用硬性门槛过滤幽灵现货，核验三网优化回程（CN2 GIA/9929/CMIN2）与换 IP 资费，并一键调用专业比价 Prompt。
8. **Claude 订阅与成品号安全选型**：参考 **Claude 订阅、Org ID 直充与成品账号选购指南**（[2.18 章节](18_case_claude_subscription_orgid_recharge_and_account_guide.md)），弄清 App Store 映射底层，严格区分掉订阅与封号风险，拒绝外泄 sessionKey。
9. **海外通信与低成本长期保号**：参考 **eSIM 转实体卡与香港 Club Sim 保号实战指南**（[2.19 章节](19_case_esim_physical_cards_global_roaming_and_clubsim_guide.md)），利用可复写 eUICC 实体卡解锁国行 iPhone，结合国际 GTP 漫游隧道与 365 天购买日保号规则，安全低成本持有全球数字身份。
10. **Claude 高阶会员与支付风控**：参考 **Claude Pro / Max 订阅决策、付款两层法与防封全景手册**（[2.20 章节](20_case_claude_pro_max_subscription_anti_ban_and_payment_triage_guide.md)），掌握被迫停工时间选档模型，遵循发卡行准入与三维一致两层法排查，遇拒付严格执行静置 1h/冷却 24h，杜绝短时连续点击撞库。
11. **微课真人数字人与视频画中画**：参考 **DUIX 开源数字人部署与 course-render 视频合成**（[2.21 章节](21_case_duix_avatar_cli_docker_deployment_and_course_video_synthesis.md)），利用 Docker 离线运行 `duix-avatar-gen-video` 规避云端资费与隐私泄露，通过 PowerShell 状态校验规避 `moov atom not found` 竞态，提取完整课件时间轴音频，并用 FFmpeg 抗锯齿圆形羽化滤镜将讲师头像无痕贴合于微课左下角。
12. **统一 AI 模型网关与 Agent 架构选型**：参考 **FreeLLMAPI 统一网关、CPA 订阅聚合与 Agent 全栈选型**（[2.22 章节](22_case_freellmapi_unified_gateway_cpa_openrouter_and_agent_frameworks.md)），将 FreeLLMAPI 作为唯一总入口，通过 CPA 榨取订阅额度，利用 OpenRouter BYOK 享受免费路由与终极兜底，搭配 DeepInfra/Novita/SiliconFlow 压降日常推理成本，并在 TypeScript（Mastra/Vercel AI SDK）与 Python（LangGraph/LlamaIndex）中完成 Agent 运行层与模型底座的完全解耦。
13. **节点自建、阻断自救与智能分流**：参考 **海外 VPS 节点极速搭建、Cloudflare CDN 复活甲与 ACL4SSR Clash 智能分流全景指南**（[2.23 章节](23_case_vps_3xui_v2rayn_clash_verge_cloudflare_cdn_and_acl4ssr_routing_guide.md)），当海外便宜 VPS IP 遭移动宽带阻断时，善用 Cloudflare Anycast 小云朵免费复活，协议坚决绑定 VLESS-WS-TLS 443 端口并搭配移动优选 IP，通过 ACL4SSR 转换管道无缝接入 Clash Verge Rev，彻底实现国内网站零损耗直连与境外业务高速代理。
14. **容器化多开、后量子握手与本地规则生成**：参考 **从 Clash Verge 订阅死局到单机 4 容器黄金拓扑**（[2.25 章节](25_case_lxc_virtualization_and_agent_mesh_evolution.md)），彻底抛弃易出故障的第三方在线转换，采用自研本地 Python 引擎生成原生 YAML，实施按量住宅节点隔离与 Split DNS，配合开机自检与阶梯流量守卫，实现单机高密度稳定运行；系统化工程学习请移步专栏 **《现代 VPS 极客运维：LXC 容器虚拟化、AI Agent Skill 与全协议流编排实战》**。
15. **机房线路选型、论坛二手淘金与住宅验货**：参考 **特惠海外 VPS 论坛淘金、机房线路横评与双 ISP 静态住宅真假鉴别 6 步法**（[2.26 章节](26_case_vps_procurement_forum_trading_and_isp_scamalytics_guide.md)），弄清美西内陆（奥格登 Ogden WebNX）与沿海海缆机房的直连优先级，掌握 NodeSeek/LINUX DO 溢价辨析与二手过户红线，严禁在 TikTok 运营中使用动态家宽 NAT，并使用标准化 `curl` 6 步测试命令一键提取 IPinfo 时区、TCP 握手延迟、TikTok `ttwid` Cookie 与 Scamalytics 欺诈分。
16. **软路由内存防爆、假性被墙救活与出海选型**：参考 **软路由 PassWall 内存爆仓 OOM 救活、VPS 假被封真断连排错与 ImmortalWrt 出海部署实录**（[2.27 章节](27_case_openwrt_passwall_oom_fix_vps_gfw_diagnosis_sop.md)），掌握小米 AX3000T (256MB) 路由因 Xray 爆内存触发 OOM 的秒级救活命令（`/etc/init.d/passwall stop && /etc/init.d/firewall restart`），通过注入 `GOMEMLIMIT=60MiB` 与停用冗余组件彻底防爆内存；遇 VPS 断连坚决执行 ICMP Ping 验证（Ping 通铁证未被墙），通过厂商 Web Shell 零成本改端口救活；出海业务首选 ImmortalWrt 固件以确保网络栈与驱动完整性。
17. **iOS 移动端分流异常、大厂 App 卡顿与协议逆向**：参考 **iOS / 跨端客户端分流异化排查：Streisand 与 Shadowrocket 逆向规则解构、国内大厂（闲鱼/抖音）DNS 漂移与卡顿根治、域名嗅探与 Split DNS 全景落地**（[2.28 章节](28_case_ios_streisand_shadowrocket_clash_split_routing_and_app_lag_diagnosis.md)），利用 Python 逆向解密 `streisand://` 的 Apple bplist 路由，剖析海外 DNS 导致国内 CDN（阿里/字节）跨国 Anycast 调度漂移与 HTTPDNS 逃逸死因，通过配置本地阿里权威 DNS（`223.5.5.5`）与海外 DoH 的 Split DNS 架构、开启 TLS/QUIC 域名嗅探（Traffic Sniffing）以及关闭移动端 IPv6 避免 Happy Eyeballs 超时，彻底消灭闲鱼与抖音的白屏转圈与异地风控。
18. **客户报错初判、GFW 阻断三型与中转住宅 400ms 延迟真相**：参考 **客户网络 Error 初判排障金字塔：从设备自省、VPS 厂商宕机、GFW 三类阻断多维探测到中转住宅 400ms 延迟真相实录**（[2.29 章节](29_case_customer_network_error_vless_gfw_blocking_types_and_residential_latency_diagnosis.md)），掌握客户反馈“网络 Error”时的秒回安抚与 3 步自省话术，利用厂商 noVNC 网页终端直救母机，通过 `tcp.ping.pe` 与 `itdog.cn` 精准判定端口封锁、DPI 指纹重置或 IP 全局拉黑并针对性处置，用海底光纤物理极限与中转住宅五段耗时模型彻底破解“400ms 延迟过高”的认知误区，破除全局测速灾难，并通过 1GB Swap 与 `GOMEMLIMIT=180MiB` 彻底根治低配小内存 VPS 突发 OOM 崩溃。
19. **晚高峰 UDP QoS 丢包、后量子兼容陷阱与 Realm 四层中继**：参考 **跨洋晚高峰 UDP QoS 劣化实测、后量子参数兼容陷阱、Realm 四层中继与通用客户端分流架构实录**（[2.30 章节](30_case_transpacific_evening_peak_udp_qos_relay_architecture_and_client_compatibility.md)），掌握利用服务端 `tcpdump` 抓包实锤晚高峰国内出口（CMI）跨洋 UDP 丢包的证据链，彻底破除 `support-x25519mlkem768` 与 `minClientVer` 导致的客户端全网 `-1` 兼容死局，通过“地理临近日本高速直连中继 + Realm L4 转发 + 美国原生 ISP 落地”将延迟压降至 60ms 并实现 0 丢包，同时结合 Cloudflare CDN 443 WS TLS 边缘终结构建全天候容灾双轨架构。
```
