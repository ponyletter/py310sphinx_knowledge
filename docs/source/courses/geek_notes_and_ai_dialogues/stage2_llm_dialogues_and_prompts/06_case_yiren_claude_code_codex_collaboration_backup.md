# 2.6 【案例精选】Claude Code × Codex 双工具协作、交叉审查与 Mac 目录工程规范（亦仁）

> **案例档案卡片**
>
> - **实战导师**：亦仁（生财有术创始人、资深 AI 协同实战派）
> - **核心议题**：Mac 项目目录架构最佳实践、Claude Code 与 Codex 双工具协同流、交叉审查机制、无损交接仪式（/pickup 与 /handoff）与容灾接管
> - **核心理念**：“把记忆留在仓库，工具只是手，仓库才是脑。”
> - **原文链接**：
>   - [生财有术原帖：Claude Code 和 Codex 双工具协作与互相备份](https://scys.com/articleDetail/xq_topic/82255421451551242)
>   - [生财有术原帖：Codex、Claude Code 项目文件夹放在 Mac 哪个位置更合理](https://scys.com/articleDetail/xq_topic/55522511185424544)
>   - [案例总览索引：whenreset.com.cn/codex](https://whenreset.com.cn/codex/index.html)

---

## 一、核心总纲：“仓库为脑，工具为手”的去依赖哲学

许多开发者在使用 AI 辅助编程时，最常犯的错误是**把上下文和业务逻辑深深绑定在某一个特定的 AI 客户端会话中**。一旦遇到账号封禁、模型限流、网络故障或官方突发调整，整个研发流程瞬间陷入瘫痪。

亦仁提出的双工具协作体系，确立了一条最根本的工程铁律：

```{important}
**核心总纲：仓库为王，记忆留在本地**
- **工具只是可替换的“手”**：Claude Code、Codex、Cursor、Antigravity 都是随时可以被杀掉、随时可以换掉的执行终端；
- **仓库才是不可替代的“脑”**：所有的业务需求、架构设计、测试用例、未竟清单必须 100% 固化在本地 Git 代码库中。
```

```{mermaid}
flowchart TD
    subgraph Storage["本地代码仓库 (唯一的真实记忆与事实中枢)"]
        Repo["Git 代码树 (Working Tree)"]
        Doc["AGENTS.md / CLAUDE.md (工程规范与禁忌)"]
        Log["WORKLOG.md (实时交接单与状态快照)"]
    end

    subgraph ToolA["执行手 A：Claude Code"]
        CA["深思架构 / 重构 / 交叉审查"]
    end

    subgraph ToolB["执行手 B：Codex / Agent"]
        CB["极速实现 / 批量单测 / 替代热备"]
    end

    Storage <-->|/pickup 读取状态 \n /handoff 写入交接| ToolA
    Storage <-->|/pickup 读取状态 \n /handoff 写入交接| ToolB
```

---

## 二、地基工程：Mac 目录规划与工具配置隔离

很多开发者在 Mac 上跑 AI 工具经常遇到“权限报错”、“iCloud 同步死锁”、“环境变量污染”，根源在于没有理顺 Mac 的文件系统层级。

### 1. 常见三大“灾难级”目录放置习惯

1. **直接扔在桌面（`~/Desktop`）或下载（`~/Downloads`）**：
   - 极易误操作删除，且 macOS 的“桌面与文档 iCloud 同步”会导致巨型项目产生极其严重的同步冲突。
2. **放在 iCloud 同步盘路径下**：
   - **绝对灾难**！`node_modules`、`.venv`、`.git` 会生成数以万计的小文件，导致 iCloud 持续满载上传，Mac 疯狂发热掉电，文件频繁被加 `.icloud` 占位后缀导致编译失败。
3. **把全局配置和项目代码混在一起**：
   - 工具的全局身份凭证泄露进项目 Git，或项目局部虚拟环境污染了系统全局 Python。

### 2. Mac 标准化开发目录拓扑结构

推荐在用户家目录下建立严格隔离的三层结构：

```text
/Users/<username>/
├── .claude/                     # Claude Code 全局配置、认证 Token、全局工具
├── .codex/                      # Codex 全局缓存与系统提示词
├── Developer/ (或 Projects/)     # 核心项目根目录（明确排除在 iCloud 之外）
│   ├── active/                  # 正在主力推进的生产/商业项目
│   │   ├── wechat-portrait/     # 商业小程序项目
│   │   └── xhs-agent-station/   # 小红书自动化工作站
│   ├── experiments/             # 短平快验证、PoC 原型、极客实验 (Spikes)
│   │   └── test-gemini-stream/
│   └── archive/                 # 已交付归档、不再频繁修改的历史项目
```

---

## 三、双工具统一规范：软链接（Symlink）消除规则分叉

不同工具对项目级规范文件的默认命名不同：
- **Claude Code**：默认深度优先读取根目录下的 `CLAUDE.md`；
- **Codex / 其他 Agent**：通常读取 `AGENTS.md` 或 `CODEX.md`。

如果同时维护两份文件，很容易出现“在一边修改了规范，另一边还是旧规则”的分歧灾难。

### 最佳工程实践：单点维护 + 符号软链接

在项目根目录下，以 `AGENTS.md` 作为唯一规范母本，然后使用 Linux/macOS 原生命令创建软链接：

```bash
# 在项目根目录下建立软链接
ln -s AGENTS.md CLAUDE.md
```

无论哪一个工具进入工作区，看到的都是完全同步、同一份物理节点上的最新规则文件。

### `AGENTS.md` 必备的核心规范模块

一个健全的工程规范文件应当简明扼要，包含以下关键板块：

```markdown
# 项目工程规范与智能体须知 (AGENTS.md)

## 1. 基础命令 (Commands)
- 构建: `npm run build` 或 `python -m build`
- 测试: `pytest -v tests/` 或 `npm test`
- 代码风格检查: `ruff check .` 或 `npm run lint`

## 2. 核心架构与技术栈 (Stack & Architecture)
- 前端: Next.js 15 (App Router), Tailwind CSS, TypeScript
- 后端: FastAPI (Python 3.10), SQLite (Dev) / Postgres (Prod)

## 3. 严格禁止事项 (Negative Constraints)
- ❌ 绝对禁止在未运行现有测试的情况下提交代码
- ❌ 严禁直接改动 `migrations/` 目录下已应用的数据库变更文件
- ❌ 严禁使用 `git push --force`

## 4. 提交规范 (Git Commit Convention)
- 每次提交必须标注工具名，如：`feat(auth): add jwt token validation [claude]`
```

---

## 四、双工具交接仪式：`/pickup` 与 `/handoff` SOP

双工具协作最怕的是“前一个工具留了半拉子半成品，下一个工具接手完全摸不着头脑，直接胡乱覆盖”。

通过固化两个标准化仪式，可以实现跨工具、跨会话的“无损心智交接”：

```{mermaid}
sequenceDiagram
    participant Human as 开发者
    participant ToolA as Claude Code (工具 A)
    participant Repo as 本地 Git + WORKLOG.md
    participant ToolB as Codex (工具 B)

    Note over ToolA: 完成阶段性功能开发
    Human->>ToolA: 输入 /handoff 收工指令
    ToolA->>Repo: 提交代码 + 生成/更新 WORKLOG.md (记录完成项、阻碍与下一步)
    Note over ToolA: 安全退出会话

    Note over ToolB: 启动新工具或灾备接管
    Human->>ToolB: 输入 /pickup 接手指令
    ToolB->>Repo: 自查 git status / diff + 读取 WORKLOG.md + 跑基线测试
    ToolB-->>Human: 汇报现场全貌：“基线测试通过，准备执行下一步：xxx”
    Human->>ToolB: 确认无误，开始推进！
```

### 1. 收工交接指令：`/handoff`

当准备切换工具或关闭电脑结束今日工作时，向当前 AI 发送 `/handoff` 指令：

> **开发者指令模板**：
> “执行 `/handoff`。请整理当前状态并在项目根目录生成或更新 `WORKLOG.md`。必须包含：
> 1. 本次会话完成的变更清单与 Git 提交哈希；
> 2. 尚未跑通或还在修改中的文件与测试；
> 3. 当前遇到的技术阻碍与待决事项；
> 4. 建议下一个接手的工具第一步执行的具体任务。”

生成的 `WORKLOG.md` 范例：

```markdown
# 现场交接记录单 (WORKLOG.md)
更新时间: 2026-09-22 18:30 (由 Claude Code 生成)

## 1. 已完成事项
- [x] 完成了微信支付回调验签逻辑 (`services/payment.ts`)
- [x] 补充了 4 个边界测试用例 (`tests/test_payment.py`)，全绿通过 (Git: a8f9c2d)

## 2. 正在进行与阻塞点
- [ ] 退款接口目前返回 403 权限不足，需要检查微信商户平台 API 证书路径
- 阻碍: 本地缺少测试商户退款证书，已通过环境变量 `MOCK_REFUND=true` 临时跳过

## 3. 下一步建议动作
- 接手后第一步：先跑 `pytest tests/test_payment.py` 验证基线；
- 第二步：实现退款状态的本地数据库轮询任务 (`tasks/refund_polling.py`)。
```

### 2. 接手启动指令：`/pickup`

新会话启动或切换为另一个工具（如 Codex）时，第一条指令发送 `/pickup`：

> **开发者指令模板**：
> “执行 `/pickup`。请自查当前工作区：
> 1. 运行 `git status` 与 `git diff` 确认是否有未提交的修改；
> 2. 仔细阅读项目根目录的 `AGENTS.md` 与 `WORKLOG.md`；
> 3. 运行项目现有测试套件验证基线健康状态；
> 4. 向我简报当前项目现状，并给出你建议开始推进的第一项工作。”

通过这一进一出的标准化仪式，**两套工具完全共享上下文，彻底摆脱了对单次聊天记录的依赖**。

---

## 五、Git 纪律与多工具防踩踏机制

双工具甚至多 Agent 协作时，最大的工程灾难是“两个 AI 同时修改同一批文件导致冲突炸裂”。

### 1. 铁律一：“一支笔原则”（One Pen Rule）

在同一个本地工作副本（Working Directory）中，**同一时刻只允许一个 AI 工具具备写权限**。严禁同时在两个终端窗口中对同一目录运行两个能够自主编辑文件的 Agent。

### 2. 铁律二：利用 `git worktree` 实现物理隔离并行

如果你确实需要让两个工具**同时并行推进不同任务**（例如 Claude 负责做重构，Codex 负责写新功能测试），绝不能在同一个目录并发，必须使用 Git 官方的高级特性：`git worktree`：

```bash
# 在主目录保留稳定分支
cd ~/Projects/my-app

# 为 Codex 开启一个独立的物理工作区与新分支
git worktree add ../my-app-codex-test -b feature/codex-tests

# 此时：
# 终端 1 在 ~/Projects/my-app 运行 Claude Code
# 终端 2 在 ~/Projects/my-app-codex-test 运行 Codex
# 两者完全独立，拥有各自干净的文件状态，互不踩踏！
```

功能完成后，各自提交分支并推送到远程仓库，通过标准 Pull Request（PR）方式进行代码合并。

### 3. 铁律三：小步提交与“工具数字指纹”

严禁让 AI 工具一口气改完 20 个文件后再由人类一次性提交。强制要求 AI 每跑通一个小功能就做一次局部原子提交，并在 Commit 信息末尾显式标注工具标签：

```bash
git commit -m "refactor(router): optimize route matching algorithm [claude-code]"
git commit -m "test(router): add 12 regression tests for route params [codex]"
```

在后续追溯 Git Log 时，能够清晰看出哪段代码出自哪位“AI 雇工”，对质量复盘极有价值。

---

## 六、双工具四大实战杀手锏打法

| 打法模式 | 角色分配 | 核心优势与适用场景 |
| :--- | :--- | :--- |
| **1. 温备与热切换 (High Availability)** | 平级互备 | 一旦主力工具触发配额上限、网络中断或封号，5 分钟内无缝平移至备用工具，保证工期不受损。 |
| **2. 交叉审查 (Cross-Model Review)** | 工具 A 编写，工具 B 审查 | **强推模式**。不同大模型的训练数据分布与推理偏向不同，让 Codex 审查 Claude 写的代码，能快速查出死锁、边界泄露和逻辑盲区。 |
| **3. 计划-执行分工 (Architect vs Builder)** | Claude 规划架构，Codex 批量落地 | 利用 Claude 极深的多步推理能力在 `AGENTS.md` 中拆分接口定义，利用 Codex 高吞吐极速生成大量样板代码与单测。 |
| **4. 疑难死锁“第二意见” (Second Opinion)** | 主力卡住，呼叫增援 | 当工具 A 连续尝试 3 次仍无法修好某个复杂 Bug 时，切给工具 B 换个完全不同的思考角度，往往一针见血。 |

---

## 七、突发封号与不可用：15 分钟极速灾难恢复演练

如果在项目关键交付期，主力账号突然遭遇风控封禁或配额熔断，按照以下 4 步即可在 15 分钟内满血复活：

1. **Step 1：检查本地代码完整性**（1 分钟）
   - 本地 Git 确认最后一次提交状态，确保所有已完成的改动均有 Commit 记录。
2. **Step 2：唤醒备用工具**（2 分钟）
   - 打开终端，切换到备用工具（如从 Claude Code 切至 Codex 或 Cursor CLI）。
3. **Step 3：触发 `/pickup` 接管仪式**（5 分钟）
   - 备用工具自动读取 `AGENTS.md` + `WORKLOG.md`，执行测试套件确认代码基线全部正常。
4. **Step 4：继续冲刺交付**（7 分钟）
   - 备用工具根据 `WORKLOG.md` 中的“下一步建议动作”直接启动编码，客户和外界完全感知不到后方发生了工具与账号的剧烈切换。

---

## 八、延伸阅读与实战索引

- [2.5 【案例精选】七天烧 230 亿 Token：50 条 Codex 高阶实践、AI Native 心智与自动化闭环（令狐峰）](05_case_linghufeng_23b_tokens_codex_practices.md)
- [2.4 主流大模型速度与成本全景横评：从 Pareto 前沿到分层协作架构](04_llm_speed_cost_benchmarks_and_tiered_workflow.md)
- [生财有术原帖：Claude Code 和 Codex 双工具协作与互相备份](https://scys.com/articleDetail/xq_topic/82255421451551242)
- [生财有术原帖：Codex、Claude Code 项目文件夹放在 Mac 哪个位置更合理](https://scys.com/articleDetail/xq_topic/55522511185424544)
- [案例聚合导航：whenreset.com.cn/codex](https://whenreset.com.cn/codex/index.html)
