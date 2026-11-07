# 真实 Claude 对话实录剖析与人机高频问答复盘

在 24goods（Kesiv）的研发全周期中，人类架构师与 **Claude Code**、**Antigravity** 智能体展开了成百上千轮高强度的工程对话与代码推演。最能体现系统工业级价值的，恰恰是那些在复杂业务冲突、极端硬件瓶颈和生产线上故障时刻的人机实时交互。

本节完整复原并深度拆解了两场具有里程碑意义的历史会话（Session `8d2e5ffb` 与 `5defe2ff`），通过**原始会话纪实 + 深度 Q&A 问答 + 架构决策还原**的形式，呈现真实 AI 辅助全栈工程的全貌。

---

## 一、会话一（`8d2e5ffb`）复盘：从零立项选型、Token 暴涨与 2GB 内存绝地自救

* **会话 ID**：`8d2e5ffb-38d4-4b93-b71d-bba75c0cac53`
* **历史主题**：*China virtual goods marketplace*（面向国内访问优化的安全虚拟商品市场研发）
* **核心事件**：FastAPI 单体架构选型之争、参考 GmailBuy 卡密体验、智能体 Subagent 吞噬 64% Token 治理、单机 2GB 内存陷入 Swap 性能悬崖与 `flock` 锁死事故。

### 场景 1：架构方案 A vs 方案 B 之争与 GmailBuy 交互标杆

在项目立项之初，关于前端渲染方式（Nuxt SSR vs 静态 SPA）与后端选型产生了激烈交锋：

```text
[User]
我想做一个针对国内网络环境极速加载、具备最高安全防御（防卡密泄露、防黑客洗劫、防假支付）、
支持“闲鱼式聊天砍价/即时交付”与“自动卡密发卡”的数字商品交易系统。
参考类似 GmailBuy 这种发卡站的极速卡密交付体验，但比它功能更强、更安全。
你给我出两个架构方案，给出客观对比与建议。

[Claude Code]
分析您的核心诉求：
1. 国内访问极速（免梯子直连、首屏秒开、不依赖易被墙的海外 CDN）；
2. 绝对安全（卡密防脱库、金额防篡改）；
3. 闲鱼式即时协商 + 标准卡密秒发。

方案 A（极简防御型单体）：
- 后端：Python 3.12 + FastAPI + PostgreSQL (强制启用行级安全 RLS) + Redis
- 前端：Vue 3 + Vite + Vant 4（移动端）/ Element Plus（管理后台），纯静态 SPA 构建产物，运行时零 Node.js 进程
- 交付与加密：独立隔离进程 worker 持有卡密私钥，信封加密存储
- 网关：Caddy 2 反向代理 + 本地静态文件分发

方案 B（全栈无服务器 / SSR 流式体系）：
- 框架：Nuxt 3 (SSR + Vue 3) + Nitro 运行时 + Node.js 容器集群
- 数据库：Supabase (PostgreSQL 托管) + Centrifugo (独立 WebSocket 推送集群)
- 优点：SSR 具备天然的 SEO 优势，Centrifugo 支持大规模长连接

[User]
断然否决方案 B。理由：
1. 虚拟商品交易后台是强交互系统，不需要庞大笨重的 SSR SEO；
2. Node.js 运行时在国内网络环境下，冷启动、内存占用高（单个 Nuxt 进程起步 150MB），且极易遭遇海外 npm 镜像污染；
3. Centrifugo 需要额外维护 Go 独立集群，增加运维成本。
采用方案 A。但有一点：必须完全摒弃传统发卡的明文存储逻辑，且参考 GmailBuy，买家输入邮箱或点击支付后，
必须支持无需强制注册就能快速查单、快速交付。
```

> [!NOTE] 架构决策沉淀
> 这次争辩直接催生了专栏阶段一中的 **ADR-009（摒弃 Nuxt SSR 采用纯静态 SPA）** 与 **ADR-010（摒弃 Centrifugo 采用轻量 SSE）**。系统的运行拓扑被彻底锁定在无 Node 运行时的轻量级容器组合上。

---

### 场景 2：智能体 Subagent 吞噬 64% 额度的治理风暴

在立项后的基础脚手架生成阶段，Claude Code 自动触发了底层 Subagent 机制进行跨文件检索与并行编码，随后人类架构师发现了严重的 Token 消耗异常：

```text
[User]
暂停！我刚查看了控制台日志，刚才仅仅针对目录结构规划和 5 个模块的基础 schema 设计，
后台派生出的 3 个 Subagent 居然消耗了我 64% 的会话 Token 配额！
它们在大量并行读取无关的 node_modules、递归查找依赖树，造成严重浪费。立刻给出优化限制方案！

[Claude Code]
非常抱歉！经排查，刚才在探索已有项目结构时，Subagent 默认启用了深层递归查找与多视角并行推演，
由于未在忽略规则中排除前端构建缓存与虚拟环境，导致上下文急剧膨胀。

改进与治理方案：
1. 立即降级子代理模型：将非核心的检索类 Subagent 模型锁定为轻量快速模型（flash_lite 或 haiku），主决策继续使用顶配模型；
2. 注入全局忽略边界：在工作区根目录强制配置 .claudeignore，排除所有 dist、node_modules、.venv、.git、coverage 等目录；
3. 限制并发子智能体深度：禁止子智能体再次派生下游智能体，单次任务最多仅允许 1 个专注的 Implementer 运行，完成后立即回收会话；
4. 实行“文件级精确指派”：后续每次指令均明确指定文件绝对路径与目标函数，严禁无边界泛搜索。
```

人类工程师随即在规则中写死：**一次任务只允许 1 个工作 Agent 驻留，禁止贪婪递归遍历，彻底阻断 Token 资产流失。**

---

### 场景 3：2GB 内存陷入 Swap 性能悬崖与 `flock` 自锁死事故复盘

在执行后端与前端联调测试时，开发服务器发生了一次恶劣的“假死”事故，整个服务器卡顿失联超过 20 分钟：

```text
[User]
服务器怎么断开 SSH 连接了？！控制台显示 CPU 使用率 100%，Load Average 飙升到了 18.2，
内存在剧烈 Swap 换页（每秒 IO 读写 25MB），整台机器彻底瘫痪！
你刚才到底执行了什么指令？！

[Claude Code]
（系统恢复后排查日志）
现场事故复盘如下：
1. 事故原因：刚才为了验证订单模块和商品模块，并发启动了 2 个后台 Agent，
   其中 Agent-1 在执行 pytest 全量回归测试，RSS 内存峰值飙至 1.05GB；
   同时 Agent-2 在执行前端 vite build 与 vue-tsc 类型检查，开销达 620MB；
   加上开发机物理内存仅有 2GB，系统瞬间触发剧烈 Swap 换页，I/O Stall 超过 40%，系统发生颠簸（Thrashing）；
2. 更严重的人为死锁事故：
   我在执行 scripts/dev.sh up 时，误以为加互斥锁可以保护内存，执行了：
   flock .dev/heavy.lock scripts/dev.sh up
   导致长周期常驻的 uvicorn 后端和 vite 前端子进程继承了该文件锁，
   随后所有排队执行 pytest 和编译的 Agent 全部被永久阻塞在 flock 等待队列中，
   造成长达 30 分钟的全局死锁！

[User]
荒谬！常驻守护进程怎么能挂在互斥锁下运行？
马上提出彻底杜绝此类问题的根本性规则，不允许再发生第二次！
```

经过与人类架构师的反复研讨，最终诞生了指导后续所有开发行为的 **`AGENTS.md §7` 资源硬性配额红线**：

```{mermaid}
flowchart TD
    A["执行重型任务前"] --> B{"检查内存<br/>free -m"}
    B -- "< 300MB" --> C["阻断并报警<br/>执行 scripts/dev.sh down 释放容器"]
    B -- ">= 300MB" --> D{"任务类型判断"}
    D -- "瞬时重型命令<br/>(pytest / vue-tsc / vite build)" --> E["强制包裹互斥锁<br/>flock .dev/heavy.lock cmd"]
    D -- "长周期驻留服务<br/>(dev.sh up / uvicorn / vite)" --> F["严禁挂载 flock<br/>直接独立守护进程启动"]
    E --> G["单测范围受限：<br/>仅测修改单文件，禁止本地跑全量套件"]
    G --> H["全量回归移交 GitHub Actions CI"]
```

---

## 二、会话二（`5defe2ff`）复盘：review-v5.1 实战、CI 提速、日本物理机部署与 Issue #23 修复

* **会话 ID**：`5defe2ff-9a02-464e-bbcc-12cf0a2d3237`
* **历史主题**：*24goods_web review-v5.1 items 1, 2, 6*（议价改价机制审查、多链 USDT 网关与生产实测）
* **核心事件**：自建 BEpusdt 多链钱包接入（X Layer 专有 XKO 前缀）、GitHub Actions CI 耗时从 14 分钟压缩至 2 分 40 秒、日本 IIJ 物理机 LXD 容器 (`c4-desktop`) 生产部署、现场排查 Issue #23 手续费舍入差与 409 渠道锁死 Bug。

### 场景 1：多链 USDT 接入与 OKX 专有 `XKO` 前缀适配

在 review-v5.1 中，平台需要支持免任何手续费的加密货币收单方案：

```text
[User]
现在接入自建的 BEpusdt 网关，需要支持三条链路：Arbitrum One、X Layer、TRC20。
注意！OKX 的 X Layer 网络在欧易站内互转时，提供了一种免 Gas 费的专属地址前缀：XKO 开头。
系统在展示给买家支付时，必须严谨区分。

[Claude Code]
已完成 BEpusdt 适配器开发。请确认充值归集配置：
1. Arbitrum One（以太坊二层）：原生 EVM 格式，0x 开头；
2. X Layer（OKX 二层）：
   - 链上转账地址：0xe2dc319ed904b2f798f262e3274b0f0c60e0653c
   - OKX 站内免手续费互转专有格式：XKOe2dc319ed904b2f798f262e3274b0f0c60e0653c
3. TRON 网络（TRC20）：高识别度 T 开头 Base58 地址。

在前端 收银台弹窗中，当检测到买家选用 X Layer 时，界面同时渲染二维码与明确提示：
“支持 OKX 站内免费互转（选择 XKO 内部转账模式），或使用 Web3 钱包通过 Arbitrum One 转账”。
并在收到 BEpusdt Webhook 通知时，进行双向哈希校验与防重放入账。
```

---

### 场景 2：GitHub Actions CI 构建慢如蜗牛的深度治理

在代码频繁推送到 GitHub 时，人类架构师对 CI 流水线的龟速提出了严厉批评：

```text
[User]
GitHub Actions 的 CI 跑一次居然要耗费 12 到 15 分钟！
每次推送一个小提交，全团队都在等待 CI 跑完才能合并，严重拖慢迭代节奏。
去排查瓶颈到底出在哪，给出极致提速方案！

[Claude Code]
（深入分析 .github/workflows/ci.yml 执行时序图）
诊断出三大主要耗时热点：
1. Python 依赖解析与安装：每次都在无缓存裸机上使用 pip install -e '.[dev]'，
   重新下载并编译 cryptography、asyncpg 等底层 C 扩展，耗时 3 分 40 秒；
2. Docker 镜像构建无缓存：deploy/web.Dockerfile 与 backend.Dockerfile 在 GitHub Runner 
   上每次都从第一步 RUN pip 和 pnpm build 全量执行，无法命中宿主机缓存，耗时 5 分 10 秒；
3. 串行阻塞：后端测试、前端 App 构建、Admin 管理后台构建串行执行。

优化落地措施：
1. 采用超高速 Python 包管理器 uv 替代传统 pip：
   uv venv && uv pip install -e '.[dev]'
   依赖安装时间从 220 秒暴降至 4.2 秒！
2. 引入 GitHub Actions 专用 Docker Buildx 缓存后端：
   cache-from: type=gha
   cache-to: type=gha,mode=max
   未变动的系统底包与 Node 依赖层实现 100% 缓存秒级命中！
3. 并行化 Job 矩阵：将 backend-test、frontend-web、frontend-admin 拆解为并行并发任务。

[效果验证]
整体流水线端到端执行耗时从 14 分 12 秒直接降至 2 分 41 秒，提速超过 500%！
```

---

### 场景 3：双环境拓扑——本地开发/测试机与日本 IIJ 物理机生产部署

会话深入探讨了系统的真实部署拓扑：

```text
[User]
说明一下我们目前的双环境拓扑。我本地有台测试开发机跑 demo.kesiv.com；
另外在生产环境，使用的是位于日本 IIJ 机房的物理宿主机（公网 IP 141.98.198.150:2204），
在上面通过 LXD 开设了容器 c4-desktop（内网 IP 10.0.43.40），生产域名为 shop.kesiv.com。
请整理上线流程与关键防护措施。

[Claude Code]
生产拓扑与上线规程梳理如下：

1. 物理机与容器网络拓扑：
   - 日本 IIJ 宿主机 (141.98.198.150) -> SSH 映射端口 2204 -> 容器 c4-desktop (10.0.43.40)；
   - 容器内部署 Docker 容器编排系统，Caddy 监听容器内 8088 端口；
   - Cloudflare 开启 Authenticated Origin Pull (AOP) 双向 TLS 认证，
     只有带 Cloudflare 专用客户端证书的请求才允许访问 8088 端口，防止源站 IP 泄露遭受直接 DDoS。

2. 生产发布标准工作流（scripts/prod.sh）：
   - 第一步：同步最新提交代码：./scripts/prod.sh sync
   - 第二步：生产环境变量自检：
     * 绝不可缺少 APP_SETTINGS_KEY（用于 AES-GCM 加密数据库中的敏感管理配置）；
     * 确保 delivery 容器的 cardvault 私钥仅保存在本地 deploy/env/delivery.env，
       且与 api 容器的公钥严格对应；
   - 第三步：拉取最新镜像并零停机滚动更新：./scripts/prod.sh deploy
   - 第四步：触发全链路生产端到端烟雾测试：./scripts/prod.sh smoke
```

---

### 场景 4：高能现场——Issue #23 手续费计算不一致与渠道锁死 Bug 攻防

这是整个开发周期中最具代表性的复杂业务 Bug，人类工程师与 Claude Code 联手攻克的过程极具启发性：

```text
[User]
线上测试暴雷！查看 Issue #23：
买家在购物车加购了多件阶梯价格商品，结算页面显示总计 10.00 元；
但在买家先选择“微信支付”后突然反悔，切换为“支付宝”时，系统报错返回 HTTP 409 Conflict，
提示：“Order locked by active payment”！
更诡异的是，后台计算的手续费跟收银台展示的居然相差了 1 分钱，导致订单状态机卡死！
立即排查！

[Claude Code]
（调取代码与复现测试）
发现两大致命设计缺陷：

缺陷一：409 支付渠道锁死问题
- 根因：在 orders/service.py 中，当买家首次点击“微信支付”创建支付意向单时，
  系统将 order.status 置为 PENDING_PAYMENT，并在 payments 表写入了一条处于 INIT 状态的记录；
- 当买家切换为支付宝重新提交时，后端逻辑校验为：
  if order.status != OrderStatus.CREATED: raise HTTPException(409, "Order cannot change payment channel")
  这就剥夺了买家在未真正付款前“反悔切换支付通道”的合法权利！
- 修复方案：引入“预支付意向软过期与作废通道机制”。
  只要支付单尚未收到网关的 PENDING 确认或成功流水，买家发起新渠道请求时，
  在同一数据库事务中将旧的 INIT 支付流水置为 ABANDONED，释放锁并允许重建支付凭证。

缺陷二：1 分钱手续费计算天花板不一致（舍入差漏洞）
- 根因：
  前端购物车对手续费的计算是“逐行计算后加总”：
  item1_fee = round_up(item1_price * rate)
  item2_fee = round_up(item2_price * rate)
  total_fee = item1_fee + item2_fee
  而收银台后端计算却是“总价一次性计算”：
  total_fee = round_up((item1_price + item2_price) * rate)
  由于浮点数向无穷大舍入（ROUND_CEILING），两件单价微小的商品相加后向上取整，
  与分别向上取整后再相加，在特定数值下必然相差 0.01 元！
- 这导致支付渠道发起时提交的实付金额与收银台金额不匹配，触发了防篡改校验崩溃。
- 修复方案：全栈统一采用 Banker's Rounding（四舍六入五成双）或统一锁定为“整单合计基数单次向下截断/取整”，
  严禁任何模块在行级别过早介入舍入。

[User]
修复代码提交，编写严格针对 Issue #23 的单元测试，包含并发切换渠道测试和临界分值用例，推送到分支验证！
```

---

## 三、人机高频技术问答汇总（Q&A 决策手册）

以下整理了在两次核心会话期间，人类架构师与智能体高频推演的技术 Q&A，供开发者深度借鉴：

### Q1：为什么不用 WebAssembly (Wasm) 或纯前端在浏览器直接解密卡密？
* **人类质疑**：既然要保护服务器安全，买家购买后，把加密卡密直接扔给前端浏览器，让浏览器执行解密，服务器不就彻底免责了吗？
* **Claude 深度剖析**：这是典型的“伪安全”设计。
  1. 解密必须持有私钥。如果私钥在前端，逆向工程师可以直接扒出 JS 内存中的私钥，瞬间破解全库；
  2. 如果私钥由买家输入，买家根本没有公私钥概念，体验灾难；
  3. 我们的方案是**“物理隔离信封加密”**：API 业务服务器只有公钥（只能封印，无法解密）；独立的 Delivery Worker 运行在无外网的独立物理环境并持有私钥，仅在核验订单已全额付款后，在内存中瞬时解封并单向推给买家 SSE 通道，**全生命周期不落任何临时文件或明文数据库字段**。

---

### Q2：为什么拒绝在 PostgreSQL 存储过程中直接写死业务逻辑？
* **人类质疑**：把订单状态流转、扣减库存全写成 Postgres PL/pgSQL 存储过程，执行性能不是比 Python 更快吗？
* **Claude 深度剖析**：
  1. 存储过程难以进行现代化的单元测试、代码审查与 Git 版本 Diff；
  2. 智能体难以有效维护和重构复杂的 SQL 过程；
  3. 我们采用**“职责划分清晰的防御矩阵”**：
     - **业务流转由 Python ORM + 状态机严格控制**；
     - **底层由 PostgreSQL 触发器和 RLS 充当“最后的保底铁门”**（如复式记账账本校验 $\sum=0$、租户 ID 强制绑定）。即使应用层代码出现致命逻辑 Bug，底层数据库引擎也会直接抛出 Check Violation 阻断非法写操作。

---

### Q3：为什么支付网关通知坚决不信任 `return_url`，只认异步 `notify_url`？
* **人类质疑**：买家付完款直接跳转到 `return_url`，这时直接给用户发货不是速度最快吗？
* **Claude 深度剖析**：
  - `return_url` 是经过买家浏览器 302 重定向发起的 GET 请求，**攻击者可以任意伪造 URL 参数（如修改 `trade_status=TRADE_SUCCESS`、篡改订单号）直接请求系统**；
  - 平台的履约铁律是：**`return_url` 仅用于前端跳转展示“等待支付结果”的过渡页面；真正的履约发货仅且仅当收到网关服务器直连的 POST `notify_url`，并通过“签名验证 + 金额全等校验 + 官方主动二次反查验证”三重关卡后才可触发！**

---

## 阶段小结

通过本篇对 `8d2e5ffb` 与 `5defe2ff` 真实历史会话的显微镜式复盘，我们可以清晰地看到：
一个优秀的企业级工程从来不是 AI 一键生成的“玩具 Demo”，而是在人类工程师清晰的边界把控（架构定型、资源红线、业务防线）与智能体超强代码执行力、深度排错能力的紧密碰撞下，一步一个脚印淬炼出来的工业级杰作。

在下一节中，我们将进一步下潜到底层运维实战，剖析 **LXD 容器化改造、Docker 嵌套虚拟化踩坑与超低内存机器调优手册**。