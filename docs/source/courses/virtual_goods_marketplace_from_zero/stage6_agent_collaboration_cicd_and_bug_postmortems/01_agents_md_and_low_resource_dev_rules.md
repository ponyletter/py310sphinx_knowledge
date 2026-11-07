# 面向 AI 智能体的工程规范 (AGENTS.md) 与低资源机配额准则

在 24goods 的整个研发过程中，多位代码智能体（Claude Code / Antigravity / Sonnet）与人类工程师深度混编作业。如何确保多智能体协同不跑偏、不破坏核心安全逻辑、不把开发机搞死？答案就在根目录下的 **`AGENTS.md`**。

---

## 1. 为什么需要仓库级的 `AGENTS.md`？

普通开发者往往在聊天窗口向 AI 灌输冗长的 System Prompt。但这存在三大致命弊端：
1. **记忆衰退**：随着上下文会话变长，AI 很容易遗忘早期的安全约定；
2. **多 Agent 状态分裂**：当两个 Agent（如一个负责改写后端、一个负责改写前端）并行工作时，缺乏统一的版本真理源；
3. **安全隐患**：AI 可能会为了“省事”而引入不安全的第三方未审计库，或使用 `eval` / `shell=True` / 拼接 SQL。

我们将整个项目的规则沉淀在代码仓库根目录的 `AGENTS.md`，并在其中确立了**智能体角色的分工协作模型**：
- **Orchestrator（总调度者）**：负责规划阶段目标、拆解 Task、审查 PR 并执行合并；
- **Implementer（模块实现者）**：在独立的 Git Worktree 中针对单个模块编写代码与单元测试；
- **Security-Reviewer（安全审计者）**：只读模式，针对涉及 `cardvault`、密码学、认证与 RLS 的 PR 执行严格复审；
- **Payment-Auditor（支付审计者）**：专门审查涉及金额、账本与网关通知的代码。

---

## 2. 低配主机（2 vCPU / 2GB 内存）的防崩流控实践

很多独立开发者使用的是低配云服务器（如 2 核 2G 内存、2.5GB 虚拟内存 Swap）。在开发过程中，如果两个 AI Agent 同时启动 `pytest` 全量测试、`vue-tsc` 类型检查以及 `vite build` 静态打包，**内存峰值会瞬间突破 1.5GB 导致系统剧烈 Swap，CPU 占用 100%，SSH 彻底断联卡死 10 分钟**。

针对这一极端资源受限环境，我们制定并写入了极度严苛的**《低资源配额准则》**：

### 准则 1：全量回归测试移交云端 CI，禁止在本地全跑
- 本地开发机**严禁**直接敲击 `pytest` 运行全量 50 多个测试套件；
- 本地只允许运行当前修改的文件：`pytest -q tests/test_xxx.py`，耗时控制在 3 秒以内；
- 全量全回归测试、CodeQL、Trivy 容器漏洞扫描全部交给 GitHub Actions 云端 Runner（免费且配置高）执行，以云端 CI 绿灯作为合流准则。

### 准则 2：重型命令文件排他锁 (`flock`)
对于消耗内存密集的单次构建命令，必须在互斥锁下排队串行执行：

```bash
# 凡是 pytest、vue-tsc、vitest、vite build 等重型编译命令，必须加排他文件锁：
flock .dev/heavy.lock pytest -q tests/test_orders.py

# 铁律例外：长周期驻留服务（如 uvicorn、dev-server）绝对禁止在 flock 下启动！
# 否则它将永远占有文件锁，导致其他编译与测试进程全部无限期挂起阻塞。
```

### 准则 3：内存动态熔断水位线
在执行可能消耗内存的任务前，智能体被要求自动检查系统可用内存：
```bash
free -m
# 若 available 内存低于 300MB，严禁启动任何新编译，必须先执行 scripts/dev.sh down 释放暂存容器
```

### 准则 4：图片解码单槽信号量 (`_image_slot`)
在处理用户商品展示图上传时，一张 4000 万像素的手机原生 RGBA 照片在被 Pillow 解压到内存时，瞬时开销高达 160MB。如果并发上传几张，2GB 内存主机瞬间触发 Linux OOM Killer。
我们在 `app/modules/uploads/service.py` 中强制施加了全局单槽异步信号量：
```python
_image_slot = asyncio.Semaphore(1)  # 全局同一时刻仅允许解码并压缩一张图片！
async with _image_slot:
    return await anyio.to_thread.run_sync(process_image, data)
```
通过极其微小的排队延迟（通常仅耗时 100ms），彻底杜绝了并发内存击穿。
