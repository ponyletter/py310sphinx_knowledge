# 2.1 智能分镜策划与黑板插图视觉工程

## 一、课程结构与智能编剧契约

在 `course-render` 体系中，微课脚本不是简单的口播文案，而是必须满足严格认知递进规律的结构化工程。每一门微课由两个核心文件驱动：
1. **`subtitle_draft.md`**：讲师脚本文档，明确场景目标、问答式开场（Hook）、图文揭示绑定（`reveal_sentence`）与一句话总结卡（Takeaway）；
2. **`course_config.json`**：符合严格 JSON Schema 的机器可执行配置文件。

### 场景结构黄金法则：
* **首场景（Hook 场景）**：必须是独立开场，标题必须提出直击痛点的疑问或核心术语，配备一张全画幅高冲击力宽图（2.15:1），在 5 秒内抓住注意力；
* **核心解释场景（3~5 个认知切片）**：每个场景仅专注一个知识单元（如 DNS 解析、缓存命中、读写分离），必须包含标题、单处高亮字词（`<em>`）、副标题说明与讲稿；
* **收尾场景（Summary 场景）**：必须是独立的一句话决策总结，配备全景总结宽图，给出行动指南或结论，杜绝虎头蛇尾。

---

## 二、视觉模式（Visual Modes）与自适应插图槽位

视频舞台画幅标准为 **1920×1080**（有效内容渲染区为 1880×876）。为了在视觉上彻底告别单调，系统设计了多套与认知复杂度相匹配的视觉插图槽位：

| 布局模式 (`image_layout`) | 插图数量 | 生成推荐分辨率 | 适用教学场景 |
| :--- | :--- | :--- | :--- |
| **`single`** | 1 张全宽图 | `1536×1024` 或更宽（≈2.15:1） | 开场抓人场景（Scene 1）、核心全景架构图、收尾总结卡 |
| **`dual`** | 2 张对比图 | `1024×1024`（1:1 正方形） | 前后对比、正反案例、客户端 vs 服务端交互 |
| **`triple`** | 3 张序列图 | `1024×1536`（2:3 纵向比例） | 三步走流程（如 DNS ➔ 接入 ➔ 代理）、时序调用链 |
| **`sequence`** | 2~6 张动态推进图 | `1536×1024` 相同画幅 | 状态机流转、同一拓扑逐步叠加标注 |
| **`quad`** | 4 张四宫格图 | `1024×1024` | 四大象限分析、多方案横向矩阵对比 |

```{note}
**免空白与高密度法则**：
渲染校验器内置了插图比例惩罚逻辑：如果生成的位图内容比例与对应槽位偏差超过 1.6 倍，或画面过于空旷稀疏，校验器会直接打回并要求重画。教学黑板画必须画满元素、带箭头标注和关键中文说明。
```

---

## 三、Codex 内置生图（Imagegen）与黑板风格提示词工程

在 `course-render` 中，插图生成优先使用智能体宿主内置的 `imagegen` 工具，无需在本地环境中暴露外部 API 密钥即可直接出图。

### 1. 真实黑板粉笔手绘风格提示词模版
为了获得纯正的微课板书质感，提示词严格遵循统一的结构骨架：

```text
Use case: scientific-educational
Asset type: blackboard explainer illustration
Primary request: 绘制一张讲解 [主题名称，如：MySQL 事务并发冲突] 的黑板粉笔手绘板书。
Scene/backdrop: Authentic black chalkboard background with subtle chalk dust texture, pure dark board.
Subject: [主体概念，如：两条事务时间线并发读写同一个账户余额的场景].
Style/medium: Hand-drawn chalk illustration style, colored chalk accents (chalk white, chalk yellow, chalk cyan), no 3D photorealism.
Composition/framing: Clear visual diagram, labeled nodes, numbered sequence arrows (1 -> 2 -> 3), boxed summary note at the bottom.
Text (verbatim): "事务A (Read Committed)" "事务B (Update)" "脏读风险区"
Constraints: Simplified Chinese labels directly drawn on the chalk art, high contrast, clean readable chalk typography, no watermark, no border frame.
```

### 2. 生图落盘与多图绑定自动化
智能体通过如下流程完成分镜出图：
1. 遍历 `course_config.json` 中的 `scenes` 数组；
2. 依据 `image_layout` 确定本场景需要生成的图片数量与槽位宽高比；
3. 调用底层生图工具生成 1254×1254 或宽版高清图；
4. 自动落盘至项目本地目录：`assets/images/scene01_img01.png`；
5. 在 `course_config.json` 中配置对应的 `reveal_sentence: 1`，将图片推入时刻与讲稿第一句精准对齐。
