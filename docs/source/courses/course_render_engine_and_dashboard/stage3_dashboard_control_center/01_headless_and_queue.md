# 3.1 无头驱动架构与并发任务队列调度

## 一、解耦设计哲学：无侵入的无头智能体调度

在很多 AI 应用开发中，开发者容易犯的一个错误是：**将业务业务逻辑强行硬编码进核心智能体技能脚本中**。这会导致技能无法脱离 Web 界面独立运行，破坏 CLI 可测试性与平台兼容性。

`course-render-dashboard` 采用了高度解耦的**无侵入设计哲学**：
1. **技能仓库（`course-render`）保持 100% 独立纯粹**：它只负责作为一个标准的 Codex Skill，可以在任何机器的终端通过普通交互对话或命令行运行；
2. **中台（`course-render-dashboard`）充当“作业监护人”**：中台负责接收前端表单、组装结构化 Prompt，并通过无头命令驱动底层技能：

```bash
codex exec -C "C:\Workspace\course-render-results\mysql-tx-v1" \
  --json \
  -m gpt-5.6-luna \
  -c model_reasoning_effort="xhigh" \
  --dangerously-bypass-approvals-and-sandbox \
  "调用 course-render 技能生成视频: ..."
```

中台通过监听智能体输出的 JSON-RPC 事件流，以及轮询目录下的阶段标志文件（`course_config.json` ➔ `images` ➔ `course_voice.wav` ➔ `renders/output.mp4`），精准获知当前的流水线进度。

---

## 二、先来先服务（FCFS）排队算法与并发控制

微课视频的完整生成需要消耗显著的计算资源（文本策划约 1~2 分钟，插图生成约 3~5 分钟，语音合成与视频渲染约 5~10 分钟）。如果数十个用户同时提交任务，必须具备严密的排队与限流机制。

在 Commit `da656bb` 中，中台实现了基于先来先服务（First-Come First-Served）的异步作业调度器：

```{mermaid}
sequenceDiagram
    participant User as 客户端用户
    participant API as FastAPI 接口层
    participant Queue as 内存任务队列 (FCFS)
    participant Worker as 背景执行 Worker (最大并发=5)
    participant GPU as 硬件互斥层 (gpu_lock)

    User->>API: 提交新微课生成请求 (Topic/分类/时长)
    API->>Queue: 入队并分配 Job ID (记录创建时间戳)
    API-->>User: 返回已提交状态与排队位置 (例如: 第 2 位等待中)
    
    loop 轮询可执行槽位
        Worker->>Queue: 申请空闲执行槽位 (当前运行数 < 5)
        Queue-->>Worker: 分配优先级最高的最早任务
    end

    Worker->>Worker: 创建隔离目录并拉起 codex exec
    Note over Worker,GPU: CPU 任务完全并行执行
    Worker->>GPU: 进入配音阶段，申请跨进程 GPU 锁
    GPU-->>Worker: 获取锁，执行 IndexTTS 合成
    Worker->>GPU: 释放 GPU 锁
    Worker->>Worker: 渲染视频并执行最终门禁校验
    Worker-->>User: 任务完成，通知交付成果物
```

### 队列核心特性：
* **全局最大并发控制**：默认全局限制 5 个活跃作业同时运行（可在管理后台热配置，无需重启服务）；
* **用户级配额保护**：管理员可设定单用户最大并发数（如普通成员同时最多跑 1 个），防止单个用户提交海量任务霸占队列；
* **排队透明度**：未开始执行的任务在前端直观展示：`当前排队位置：第 2 位 | 等待原因：全局并发已满 (5/5)`。

---

## 三、安全 Slug 与防覆盖目录自增机制

为了保证任务多次运行、重复测试或不同用户使用相似标题时绝对不发生“文件覆盖灾难”，中台内置了安全目录自增分配器：

```python
import re
from pathlib import Path
from pypinyin import lazy_pinyin

def generate_safe_slug(topic: str) -> str:
    """提取中英文拼音，过滤非法字符，生成干净的短横线 slug"""
    clean_text = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fa5]+', '-', topic).strip('-')
    pinyin_list = lazy_pinyin(clean_text)
    slug = "-".join(pinyin_list).lower()
    return slug or "course"

def allocate_versioned_directory(base_dir: Path, topic: str) -> tuple[str, Path]:
    """
    检查磁盘物理路径，如果 mysql-tx-v1 已存在，自动递增为 mysql-tx-v2、-v3
    绝对不覆盖历史生成工程
    """
    slug = generate_safe_slug(topic)
    base_dir.mkdir(parents=True, exist_ok=True)
    
    version = 1
    while True:
        candidate_slug = f"{slug}-v{version}"
        target_path = base_dir / candidate_slug
        if not target_path.exists():
            target_path.mkdir(parents=True)
            return candidate_slug, target_path
        version += 1
```

所有中间音频、分镜插图、字幕对齐文件与最终渲染视频都严格封闭在 `C:\Workspace\course-render-results\<candidate_slug>\` 独立沙箱中，彻底实现了工程资产的完整隔离。
