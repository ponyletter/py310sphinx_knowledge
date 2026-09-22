# 2.6 【案例精选】Claude Code × Codex 双工具协作、交叉审查与 Mac 目录工程规范（亦仁）

> **案例档案卡片**
>
> - **实战导师**：亦仁（生财有术创始人、资深 AI 协同实战派）
> - **适用场景**：Claude Code 与 Codex 混用、CLI / IDE / 桌面端 / 云端多端切换、任一账号突遭限流或封号防范
> - **一句话总纲**：“把‘项目记忆、任务状态、协作规则’全部落在本地仓库文件里；**工具只是可替换的‘手’，仓库才是‘脑’**。”
> - **方案核验**：截至 2026-07-23，关键技术结论均已对照 Anthropic 与 OpenAI 官方文档核实
> - **原文链接**：
>   - [生财有术原帖：Claude Code 和 Codex 双工具协作与互相备份](https://scys.com/articleDetail/xq_topic/82255421451551242)
>   - [生财有术原帖：Codex、Claude Code 项目文件夹放在 Mac 哪个位置更合理](https://scys.com/articleDetail/xq_topic/55522511185424544)
>   - [案例总览索引：whenreset.com.cn/codex](https://whenreset.com.cn/codex/index.html)

---

## 一、一页结论（30 秒速览版）

**核心问题本质**：各大 AI 工具的聊天记录均锁在各自的云端或私有格式里，一旦账号被封禁或触发限流，所有的交互上下文全部丢失。因此，**绝对不能让任何关键状态只存活在聊天记录里**。

只需做好以下三件事，即使任何一个工具突然封号，也能在 **5 分钟内换另一个工具无损接手**：

1. **一套记忆文件，全工具通吃**：
   - 项目规则只写一份（`CLAUDE.md`），通过符号链接生成 `AGENTS.md`，Claude Code、Codex、Cursor、TRAE 等全工具都能自动读取；
   - 补齐 Codex 无法向上查找父级目录的漏洞，让 Codex 也能吃到全局规则。
2. **开工与收工两条命令**：
   - 安装 `/pickup`（接手先看现场再动手）与 `/handoff`（收工或换工具前把现场写成交接单）；
   - 两个工具共用同一套 Markdown 命令定义，交接像交接班一样自然。
3. **严格的 Git 纪律**：
   - 小步原子提交（带工具署名标签）+ 同一分支同一时刻只允许一个工具具备写权限；
   - Git 本身就是全世界最稳定、可溯源的断点续传器。

```{tip}
**额外红利：交叉审查（Cross-Model Review）**
两个工具都在手上，不只是互为冷备——谁写的代码让另一家去审查，是工程成本最低、收益最确定的代码质量提升手段。
```

---

## 二、设计思路：为什么“仓库为王”？

三个残酷的现实约束决定了本方案的架构形态：

| 现实约束 | 工程推论 |
| :--- | :--- |
| **1. 任一账号可能突遭封号或限流**，聊天记录随时可能无法访问 | 核心架构、业务决策、任务状态必须落盘到本地仓库文件，严禁依赖任何单一云端 |
| **2. 工具多端混用**（CLI / IDE / 客户端），甚至多人多工具协同 | 协作锚点必须是工具无关的通用载体：**Markdown 规范文件 + Git 提交树** |
| **3. 工具迭代极快**，专有功能（Hooks / Skills / Cloud 沙箱）随时变更 | 核心流水线只依赖两家的“最大公约数”：**读取 Markdown 规则、执行 Shell 终端、读写本地文件** |

整套工程体系由下至上划分为三层：

```
┌─────────────────────────────────────────────────────────────┐
│                    应急层：封号与不可用接管 SOP (10分钟恢复) │
├─────────────────────────────────────────────────────────────┤
│                    日常层：开工 /pickup、收工 /handoff 仪式  │
├─────────────────────────────────────────────────────────────┤
│                    地基层：统一记忆文件与 Mac 目录拓扑规范   │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、Mac 项目目录工程规范与配置隔离

很多开发者在 Mac 上跑 AI 工具经常遇到权限报错、Mac 疯狂发热、文件丢失，根源在于目录结构设计存在硬伤。

### 1. 常见三大“灾难级”目录放置习惯

1. **直接放在桌面（`~/Desktop`）或下载（`~/Downloads`）**：
   - 极易在日常清理时误删；且 macOS 默认的“桌面与文稿 iCloud 同步”会带来严重隐患。
2. **放在 iCloud 同步盘路径下（绝对灾难！）**：
   - 现代软件工程包含成千上万的小文件（如 `node_modules/`、`.venv/`、`.git/`、`build/`）。iCloud 会持续对其建立索引和后台上传；
   - **后果**：Mac CPU 满载、风扇狂转、电池剧烈掉电；更可怕的是 macOS 为了省空间会自动把部分代码文件转为 `.icloud` 占位云文件，导致本地编译构建直接诡异崩溃！
3. **全局配置与项目配置混杂**：
   - 把全局 API 密钥写在项目内，容易随 Git 误推外泄；或者项目环境污染系统 Python。

### 2. 标准 Mac 开发目录层级规划

推荐在用户家目录下建立严格隔离的拓扑结构：

```text
/Users/<username>/
├── .claude/                     # Claude Code 全局配置、认证 Token、自定义 commands
├── .codex/                      # Codex 全局配置 config.toml、prompts 与缓存
├── .gitignore_global            # 全机通用忽略清单（必须加入 WORKLOG.md）
└── Projects/ (或 Developer/)    # 核心项目根目录（明确排除在 iCloud 之外）
    ├── CLAUDE.md                # 个人全局通用规则（真身）
    ├── active/                  # 正在主力推进的生产与商业项目
    │   ├── wechat-miniprogram/  # 小程序项目
    │   └── content-station/     # 内容工作站
    ├── experiments/             # 短平快验证、PoC 原型、极客实验 (Spikes)
    └── archive/                 # 已交付归档、不再频繁修改的历史项目
```

---

## 四、地基层：一套记忆文件，全工具通吃（一次性 10 分钟搭好）

### 1. 两家工具读取规则的底层事实

| 维度 | Claude Code | Codex |
| :--- | :--- | :--- |
| **认什么文件** | 只读 `CLAUDE.md`（官方明确不直接读 `AGENTS.md`，推荐用符号链接或 `@AGENTS.md` 导入兼容） | 只读 `AGENTS.md`（可在配置中添加 fallback 读取 `CLAUDE.md`） |
| **查找范围** | **从当前目录一路向上逐级查找**（因此 `~/Projects/CLAUDE.md` 天然生效）；子目录按需加载 | **全局 `~/.codex/AGENTS.md` + 从 Git 仓库根向下找**（不会看仓库外面的上级目录） |
| **全局个人层** | `~/.claude/CLAUDE.md` | `~/.codex/AGENTS.md` |

```{important}
**关键盲区发现**：
如果采用 `~/Projects/CLAUDE.md` 作为全局规则，Claude Code 往上级找能自然读到；但 Codex 是从 Git 仓库根目录向下找，**永远不会读取上级 `~/Projects/` 目录**！这意味着你的全局红线（禁止修改敏感配置、不直接 push 主分支等）Codex 一直处于“裸奔”没读到的状态。必须进行补漏！
```

### 2. 补漏三步（复制直接执行）

```bash
# ==============================================================================
# 第 1 步：让 Codex 也能读取全局记忆
# 把 Codex 全局指令文件直接软链接到 ~/Projects/CLAUDE.md，一份规则两家共用
# ==============================================================================
mkdir -p ~/.codex
ln -sf ~/Projects/CLAUDE.md ~/.codex/AGENTS.md

# ==============================================================================
# 第 2 步：给 Codex 上双保险
# 在 ~/.codex/config.toml 中配置：项目里找不到 AGENTS.md 时，自动 fallback 读 CLAUDE.md
# ==============================================================================
cat << 'EOF' >> ~/.codex/config.toml
project_doc_fallback_filenames = ["CLAUDE.md"]
EOF

# ==============================================================================
# 第 3 步：每个项目仓库根目录的标准三件套（新项目照做，老项目补齐）
# ==============================================================================
touch CLAUDE.md              # 真身：项目专用规则（可用 /init 让工具生成初稿）
ln -s CLAUDE.md AGENTS.md    # 软链接：一份内容两个名字，Claude/Codex/Cursor 全认
mkdir -p docs/plans          # 大任务计划文档目录（进 Git，供团队与多工具查阅）
```

> **说明**：真身用 `CLAUDE.md` 还是 `AGENTS.md` 均可，关键是保持全局一致。建议统一以 `CLAUDE.md` 为真身，`AGENTS.md` 为链接，日常编辑只改 `CLAUDE.md`。

### 3. 规则文件里该写什么与不该写什么

- **一定要写**：构建/测试命令、目录核心结构、代码规范、绝对红线（敏感凭证、分支提交纪律）、双工具分工提示（如“审查类任务优先交给非作者工具”）；
- **绝对别写**：长篇教程、随时频繁变动的内容（放入 `docs/` 目录下按需引用）；
- **长度控制在 200 行以内**：两家官方实测表明，规则过长会导致注意力稀释并降低遵循度。规则是“上下文参考”而非“强制硬约束”，越具体越管用（例如：“统一使用 2 空格缩进”远好于“代码格式要规范”）。

---

## 五、日常层：开工 `/pickup`、收工 `/handoff`（核心习惯）

这是双工具体系中日常价值最高的部分：**把“换工具、换会话”变成无缝的交接班**。

### 1. 交接机制：一份交接单 + 两条通用命令

- **交接单**：仓库根目录 `WORKLOG.md`，最新记录永远在最上方。**该文件绝对不进 Git**（属于个人开发过程的现场快照，不打扰团队、不污染 PR），加入全局 Git 忽略清单。
- **两条命令**：Claude Code 读取 `~/.claude/commands/`，Codex 读取 `~/.codex/prompts/`。通过软链接让两边共用同一套 Markdown 定义。

### 2. 一次性安装配置脚本（复制整段执行）

```bash
# 1. 将交接单加入全局 gitignore（全机生效，永不进 git）
echo "WORKLOG.md" >> ~/.gitignore_global
git config --global core.excludesfile ~/.gitignore_global

# 2. 创建命令目录
mkdir -p ~/.claude/commands ~/.codex/prompts

# 3. 写入 /handoff 命令（收工/换工具前用）
cat > ~/.claude/commands/handoff.md <<'EOF'
---
description: 收工/换工具前，把现场写成交接单
---
把当前工作状态写成一份交接单，插到仓库根目录 WORKLOG.md 的最上方（文件不存在就创建）。
格式要求严格如下：
## <当前日期 时间> · <你是哪个工具/模型>
- 分支/提交：当前分支名称、最新一条 commit 哈希及信息、未提交改动的简述
- 本次目标：一句话说明本次任务
- 已完成：列表，必须带上关键文件相对路径
- 进行中：具体到"哪个文件、改到哪一步"
- 下一步：接手者要做的第一件事
- 坑与结论：这次踩过的坑、已确认的技术结论，避免下家重走弯路
- 验证方式：跑什么命令、看什么结果算通过
写完后：如有未提交的代码改动，询问我是否先打一个 WIP 提交，不要自作主张。
EOF

# 4. 写入 /pickup 命令（开工/接手时用）
cat > ~/.claude/commands/pickup.md <<'EOF'
---
description: 开工/接手，先看现场再动手
---
你正在接手一项可能由另一个工具（Claude Code 或 Codex）做到一半的工作。按顺序执行：
1. 先跑 git status 和 git log --oneline -10，看清现场（可能有别的工具或同事的改动）
2. 读仓库根目录 WORKLOG.md 最上面一条交接单（没有该文件就跳过）
3. 若 docs/plans/ 下有相关计划文档，读一下当前进度
4. 用不超过 5 句话向我汇报：现在在哪、上一家做到哪、你打算下一步做什么
5. 等我确认后再动手，不要直接开改
EOF

# 5. 建立软链接，让 Codex 同步拥有这两个命令
ln -sf ~/.claude/commands/handoff.md ~/.codex/prompts/handoff.md
ln -sf ~/.claude/commands/pickup.md ~/.codex/prompts/pickup.md
```

### 3. 命令使用时机对照

| 时机场景 | 执行动作与原则 |
| :--- | :--- |
| **每次开工 / 接手另一工具的活** | 输入 `/pickup`，听完 AI 的 5 句话现场汇报后，人类确认再放行——严格落实“先对齐再动手”。 |
| **收工、上下文将满、即将限流、换工具** | 输入 `/handoff`，让 AI 自动生成当前进度快照。 |
| **突然封号或断网来不及 `/handoff`** | 手动打开 `WORKLOG.md` 快速手写两行（“正在改什么”、“下一步干嘛”），比什么都不留强十倍。 |

### 4. 真实 `WORKLOG.md` 交接单范例

```markdown
## 2026-07-23 18:30 · Claude Code
- 分支/提交：feat/login-refactor @ a1b2c3d，工作区干净
- 本次目标：把登录态校验从页面层收敛到中间件
- 已完成：middleware/auth.ts 新建；pages/login.vue 移除旧校验
- 进行中：composables/useUser.ts 改到一半，token 刷新逻辑还没接
- 下一步：接手者先跑 pnpm dev，复现"刷新页面丢登录态"，再继续 useUser.ts
- 坑与结论：token 在 localStorage 不在 Cookie；SSR 阶段读不到，只能客户端挂载后校验
- 验证方式：pnpm dev 后登录 → 刷新页面不掉登录 → pnpm test 全绿
```

### 5. 大任务加一层：计划文档（Plan-first）

面对超过两个文件的复杂任务，禁止直接开写：
- 先让工具产出 `docs/plans/<任务名>.md`（明确：目标、拆步、涉及文件、验收方式）；
- 人类确认批准后再开始执行，每完成一步在文件里打勾 `[x]`；
- **该文件必须纳入 Git**，这样任何工具接手，看 plan 就知道全局主线进度，比翻找聊天记录可靠一万倍。

---

## 六、Git 纪律与多工具防踩踏机制

在“不直接 push 主分支、push 前核对 HEAD、动手前 git status”的基础上，必须严格遵守多工具专用纪律：

1. **“一支笔原则”（One Pen Rule）**：
   - 同一时刻、同一分支，**只允许一个工具处于写状态**。第二个工具要么以只读模式运行（审查、答疑），要么去别的分支。
2. **并行就用 `git worktree`**：
   - 让两个工具同时开发不同任务时，使用 Git 原生 Worktree 开启物理隔离工作区：
     ```bash
     # 在项目中为 Codex 开启一个独立的物理目录与分支
     git worktree add ../my-app-codex-worker -b feat/codex-worker-task
     ```
   - 终端 1 在原目录跑 Claude Code，终端 2 在新建工作区跑 Codex，物理路径隔离，互不踩踏，最终走 Pull Request 合并。
3. **小步原子提交 + 工具署名**：
   - 每完成一个可验证的微小步骤就 commit，并在信息中显式带上工具署名：
     ```bash
     git commit -m "feat(auth): add jwt refresh logic [cc]"
     git commit -m "test(auth): add 10 boundary tests [codex]"
     ```
   - 保证断点续传有迹可循，即使账号突遭封禁，最大损失也仅仅是最后半小时未提交的代码。

---

## 七、双工具四种配合打法（1+1>2）

### 打法一：主备互换（温备容灾，默认状态）

平时主力用一个，备用工具保持“温备”状态：**每周至少让备用工具干一次小活（如跑一次审查）**，确保登录态有效、配置正常、手感不生疏。真遇到故障时，切换才能真正做到 5 分钟内完成。

### 打法二：交叉审查（性价比最高，强烈建议形成习惯）

**谁写的代码，让另一家进行只读审查**。同一个大模型很容易顺着自己的思维产生“确认偏误（Confirmation Bias）”，换一个模型盲区不同，审查质量大幅提高。

```bash
# 场景 A：Claude Code 写完 → 让 Codex 非交互单行审查
codex exec "你是严格的代码评审员。评审 git diff main...HEAD 的全部改动，重点：逻辑漏洞、边界条件、安全隐患、更简单的写法。中文输出，按严重程度排序，可直接合并就明说"

# 场景 B：Codex 写完 → 让 Claude Code 非交互单行审查
claude -p "你是严格的代码评审员。评审 git diff main...HEAD 的全部改动，重点：逻辑漏洞、边界条件、安全隐患、更简单的写法。中文输出，按严重程度排序，可直接合并就明说"
```

### 打法三：计划-执行分工（Architect vs Builder）

社区共识：“**Claude Code 是优秀的探索者，Codex 是高效的执行者**”：
- 需求模糊、架构讨论、排查疑难杂症：用 Claude Code 边聊边探索；
- 任务清晰、接口冻结、批量代码实现：写入 `docs/plans/`，交给 Codex 快速精准执行。

### 打法四：疑难死锁“第二意见”（Second Opinion）

当一个工具在某个 Bug 上卡住超过 30 分钟无进展：将“问题描述 + 已尝试过的失败方案 + 原始报错日志”打包，直接抛给另一家工具。换模型等于换一个脑子，往往能够瞬间打破死循环。

### 进阶打法：互相注册为 MCP 工具

两套工具支持通过 MCP（Model Context Protocol）协议互联：
```bash
# 将 Codex 注册进 Claude Code
claude mcp add codex -- codex mcp-server

# 反向在 ~/.codex/config.toml 中挂载 claude mcp serve
```
让 Claude 在干活时能够原生调用 Codex 询问意见。

---

## 八、多端选型矩阵：本地为王，云端为辅

| 客户端形态 | 会话与配置存放位置 | 适用定位与实战建议 |
| :--- | :--- | :--- |
| **Claude Code (CLI / IDE / 桌面 App)** | 本机 `~/.claude/`，可用 `claude --continue` 或 `claude --resume` 互相接续 | **主战场**。重度编码、长程任务、需要 MCP 与本地完整系统权限的核心场景 |
| **Codex (CLI / IDE 插件)** | 本机 `~/.codex/`，可用 `codex resume --last` 恢复上次会话 | **主战场**。与 Claude CLI 对等的本地开发主力 |
| **两家网页 / 云端沙箱** (`claude.ai/code`、ChatGPT Codex) | 云端沙箱容器，独立隔离环境 | 深度绑定 GitHub。若企业代码部署在自建 Gitlab/Codeup 则无法直接连接，不作主力；仅用于跑独立非敏感的小 PoC |
| **手机 / 桌面聊天客户端** | 官方云端 | 出门看进度、构思思路、写文案；不用于进行本地代码库的重度交付 |

> **多端总原则**：**换端不换锚点**——无论在哪一个终端，开工 `/pickup`、收工 `/handoff`、状态留在仓库，这三点永远不变。

---

## 九、封号与不可用应急 SOP

### 平时五防（做到了，封号只是换个命令的事）

1. **状态全在仓库**：规则在 `CLAUDE.md`、主线在 `docs/plans/`、现场在 `WORKLOG.md`、代码在 Git。
2. **双工具常年双活**：备用工具每周至少唤醒一次。
3. **认证双通道**：两家均提供“网页订阅”与“API 按量计费”两条独立通道。为两家账号均充值少量 API 余额作为应急备用（Key 存入 `~/Projects/.env.global`，严禁进 Git）。
4. **账号卫生**：使用官方客户端、严禁多人拼号、保持网络节点稳定、避免单账号发起不合理的超高并发。
5. **掌握本地会话文件位置**：
   - Claude Code 会话存放在：`~/.claude/projects/`（本地 JSONL 格式）
   - Codex 会话存放在：`~/.codex/sessions/`（本地 JSONL 格式）
   - 封号只会注销云端登录态，**绝对不会删除本地文件**；只要重要资产落盘，随时可以提取。

### 事发五步（10 分钟内恢复干活）

1. **第 1 步：查现场**（1 分钟）
   - 终端运行 `git status` 与 `git log --oneline -5`，确认未提交的代码量。
2. **第 2 步：补交接**（2 分钟）
   - 若断网或封号导致来不及跑 `/handoff`，手动在 `WORKLOG.md` 最上方写两行（“刚才在做什么”、“下一步做什么”）。
3. **第 3 步：抢救旧会话（可选开源工具）**（2 分钟）
   - 可利用开源工具 `continues`，解析本地 Claude Code 会话并喂给 Codex 继续对话：
     ```bash
     # 安装与交互式会话接管 (需 Node >= 22.5)
     npm install -g continues
     continues  # 交互式挑选：哪个旧会话 -> 交给哪个新工具继续
     ```
4. **第 4 步：新工具接手**（3 分钟）
   - 打开备用工具，输入 `/pickup`，听取现场汇报，确认无误后批准开工。
5. **第 5 步：事后处理**（2 分钟）
   - 走官方渠道提交申诉；在此期间备用工具直接转为主力，业务开发节奏完全不受干扰。

---

## 十、30 分钟落地清单与速查对照表

### 30 分钟系统上线检查清单

- [ ] **Step 1**：执行 `mkdir -p ~/.codex && ln -sf ~/Projects/CLAUDE.md ~/.codex/AGENTS.md`，打通 Codex 全局规则；
- [ ] **Step 2**：在 `~/.codex/config.toml` 中增加 `project_doc_fallback_filenames = ["CLAUDE.md"]`；
- [ ] **Step 3**：复制运行第四节的安装脚本，配置好 `/handoff`、`/pickup` 及全局 gitignore；
- [ ] **Step 4**：为存量主力项目补齐 `ln -s CLAUDE.md AGENTS.md` 软链接与 `docs/plans/` 目录；
- [ ] **Step 5**：启动 Claude Code 输入 `/context`，检查 Memory files 列表中是否已包含当前项目与全局规则；
- [ ] **Step 6**：启动 Codex 直接发问：“你读取到了哪些规则文件？”，确认全局和项目规则均已识别；
- [ ] **Step 7（演练一次）**：用主力工具做一次小修改 $\rightarrow$ 输入 `/handoff` $\rightarrow$ 切换到备用工具输入 `/pickup` $\rightarrow$ 验证备用工具能否准确说出上一步进展与下一步计划。

### 附录 A：Claude Code 与 Codex 对照速查表

| 事项 | Claude Code | Codex |
| :--- | :--- | :--- |
| **项目规则文件** | `CLAUDE.md`（当前目录向上逐级查找） | `AGENTS.md`（全局 `~/.codex/` + Git 根向下；可配 fallback 读 `CLAUDE.md`） |
| **全局个人配置目录** | `~/.claude/` | `~/.codex/`（主配置为 `config.toml`） |
| **自定义指令** | `~/.claude/commands/*.md` $\rightarrow$ `/命令名` | `~/.codex/prompts/*.md` $\rightarrow$ `/命令名` |
| **MCP 接入方式** | `claude mcp add ...` 或项目级 `.mcp.json` | `codex mcp add ...` 或 `config.toml` 的 `[mcp_servers]` |
| **恢复上次会话** | `claude --continue`（最近一个）/ `claude --resume`（挑选） | `codex resume --last` / `codex resume`（挑选） |
| **会话本地存储** | `~/.claude/projects/` (JSONL) | `~/.codex/sessions/` (JSONL) |
| **单行非交互执行** | `claude -p "任务指令"` | `codex exec "任务指令"` |

### 附录 B：为什么不用“共享聊天记录”做主交接？

部分开发者曾尝试把两个工具的历史会话直接拼合共享。实践证明这不可行：
1. 各家上下文格式私有，频繁变动；
2. 历史对话充斥大量试错和噪音。**100 行冗长对话记录，远不如 10 行经过提炼的 `WORKLOG.md` 交接单**。人类团队交接班也是看交接班日志，而不是回放 8 小时的监控录像。

---

## 十一、延伸阅读与实战索引

- [2.5 【案例精选】七天烧 230 亿 Token：50 条 Codex 高阶实践、AI Native 心智与自动化闭环（令狐峰）](05_case_linghufeng_23b_tokens_codex_practices.md)
- [2.4 主流大模型速度与成本全景横评：从 Pareto 前沿到分层协作架构](04_llm_speed_cost_benchmarks_and_tiered_workflow.md)
- [生财有术原帖：Claude Code 和 Codex 双工具协作与互相备份](https://scys.com/articleDetail/xq_topic/82255421451551242)
- [生财有术原帖：Codex、Claude Code 项目文件夹放在 Mac 哪个位置更合理](https://scys.com/articleDetail/xq_topic/55522511185424544)
- [案例聚合导航：whenreset.com.cn/codex](https://whenreset.com.cn/codex/index.html)
