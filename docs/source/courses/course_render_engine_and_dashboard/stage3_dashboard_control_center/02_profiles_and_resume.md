# 3.2 专属人像音色画像、实时状态机与断点会话修复

## 一、用户专属形象与音色画像（Profile 体系）

在多讲师或团队协作场景下，不同创作者希望生成的视频拥有自己的**“声音”**与**“面部形象”**。在 Commit `cd4a38c` 中，系统上线了“我的形象与声音（User Profile）”体系：

```{mermaid}
flowchart LR
    User["创作者个人中心"] -->|上传一张清晰正面照| Img["自拍原图"]
    User -->|上传/网页在线录音10~20秒| Audio["干音样本"]
    
    Img --> Worker1["后台调用 make_character.py"]
    Worker1 --> AvatarLib["专属Q版透明图库: assets/brand/q/<br/>(微笑/思考/惊讶/自信姿态)"]
    
    Audio --> Worker2["FFmpeg 预处理转码"]
    Worker2 --> VoiceRef["专属声学克隆参考: 24kHz Mono WAV<br/>(自动静音切除、归一化)"]
    
    AvatarLib & VoiceRef --> Job["后续该用户创建的所有微课任务<br/>自动挂载专属人物库与专属音色"]
```

### 核心特性：
1. **一次录入，永久复用**：用户无需在每次制作课件时重复上传自拍照或录音样本，系统持久化存储并自动应用；
2. **免外包设计成本**：`make_character.py` 自动分析自拍照特征，转化为风格统一的黑板风卡通 Q 版人像，并自动生成不同姿态的透明 PNG 资产；
3. **单次任务覆盖（Override）**：如果某一次任务需要特邀讲师或临时变声，可在任务表单中临时上传独立音频，单次优先级高于个人画像。

---

## 二、8 阶段可视化状态机与实时日志流（SSE）

由于视频渲染属于长周期异步任务，如果前端仅仅显示一个 Loading 转圈，用户极易产生焦虑甚至误判服务假死。

系统设计了面向用户的全透明 **8 阶段可视化步骤条**：

$$\text{已规划} \longrightarrow \text{文案策划} \longrightarrow \text{插图绘制} \longrightarrow \text{声音克隆} \longrightarrow \text{字幕对齐} \longrightarrow \text{封面排版} \longrightarrow \text{视频渲染} \longrightarrow \text{质检验收}$$

### 实时日志推流（Server-Sent Events）
前端页面通过 SSE（Server-Sent Events）单向长连接订阅 `/api/jobs/{id}/events`：
* **结构化事件**：当检测到 `course_config.json` 创建时，触发前端步骤条推进到“插图绘制”；
* **终端日志抽屉**：点击任务卡片可展开黑色终端窗口，实时滚屏查看 FFmpeg 编码帧率、Faster-Whisper 对齐准确度以及生图状态；
* **断线自动重连**：网络偶发波动时，SSE 会携带 `Last-Event-ID` 自动恢复连接，日志无缝接续。

---

## 三、草稿审核人机协同机制（Draft Audit & Re-generate）

在长会话 `5cc61a5d` 中，创作者提出了关键的人机协作痛点：**完全由 AI 自主生成的文案有时缺乏创作者个人的独特经历或行业深度洞察；但如果在视频渲染完之后再改，重跑 TTS 和排版又浪费时间**。

为此，中台引入了**草稿审核门禁机制（Draft Audit Stage）**：

```{mermaid}
flowchart TD
    Start["发起生成任务 (勾选: 开启草稿审核)"] --> Plan["智能体完成剧本策划与大纲构建"]
    Plan --> Draft["输出: subtitle_draft.md"]
    Draft --> Pause["状态机挂起: 等待创作者审核 (Status: awaiting_audit)"]
    
    Pause --> UI["Web 控制台弹出 Markdown 双栏富文本编辑器"]
    UI --> Edit["创作者注入个人见解 / 实战踩坑案例 / 语气微调"]
    Edit --> Submit["点击: 审核通过并接续渲染"]
    
    Submit --> Sync["自动更新 course_config.json 中的讲稿数组"]
    Sync --> Downstream["下游流水线继续: 插图生成 ➔ 语音合成 ➔ 字幕对齐 ➔ 渲染"]
```

### 核心收益：
1. **注入灵魂**：创作者不必从零写稿，但在核心认知点上可以迅速打上自己的个人经验烙印；
2. **零返工损耗**：在生图与语音克隆前完成最终定稿，彻底避免了“图画好了、音录完了才发现文案有错”的高昂算力浪费。

---

## 四、Session ID 持久化与断点原地修复（Resume 机制）

在复杂的课件生成过程中，偶尔会出现某些小瑕疵（例如某个术语生词发音不准、某一张插图的文字有歧义、或者字幕未能通过质量门禁）。

在传统流水线中，修改哪怕一个字也必须“推倒重来”，浪费大量的生图与算力成本。而基于智能体会话体系，中台实现了**“原位无缝唤醒修复”**：

### 1. 机制原理
* 当任务首次启动时，中台记录下其全局唯一的 `session_id`（保存于 SQLite 数据库）；
* 当课件因门禁未通过或用户提出修改意见时，中台不新建任务，而是直接调用断点续修命令：

```bash
cd /d "C:\Workspace\course-render-results\mysql-tx-v1"
codex exec resume <session_id> "修改第三个场景中关于脏读的解释，重新合成该场景音频并重新渲染"
```

### 2. 阶段嗅探与资产保全（Stage Sniffing）
为了避免智能体在续修时“画蛇添足”地重画已经合格的图片，系统内置了**阶段资产嗅探（Stage Sniffing）**：
* 若检测到 `assets/images/scene01.png` 已经存在且校验通过，提示词明确要求“跳过该场景生图，只针对修改场景操作”；
* 若检测到 `audio/course_voice.wav` 且文本未变动，直接复用既有波形，仅重跑 `build_sentence_timeline.py` 刷新字幕轴；
* **带来的工程优势**：智能体完全保留了前序的构思逻辑与提示词上下文，原本需要 15 分钟的流程在 1~2 分钟内即可完成精准修复交付。
