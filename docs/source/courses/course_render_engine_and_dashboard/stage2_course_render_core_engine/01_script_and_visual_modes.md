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

## 二、视觉模式二元体系：黑板板书（Whiteboard）vs 全画幅模式（Full-Frame）

在 PR #49、PR #51 以及 PR #53 的架构演进中，针对长视频会话中创作者反馈的“画面左右留白、上下黑边”问题，系统确立了**二元视觉体系（`visual_mode`）**：

| 视觉模式 (`visual_mode`) | 渲染画幅与舞台规范 | 插图排版槽位支持 | 适用内容品类 | 视觉动效与排版特征 |
| :--- | :--- | :--- | :--- | :--- |
| **`whiteboard`**<br>(默认黑板模式，旧称 image-led) | 1880×876 内容舞台<br>(1920×1080 居中) | `single`<br>`dual`<br>`triple`<br>`sequence`<br>`quad` | 计算机技术、系统架构、云原生、数据库等硬核科技科普 | HTML/CSS 在顶部渲染场景大标题、高亮词与副标题胶囊；插图以卡片或多宫格悬浮于黑板舞台上。 |
| **`fullframe`**<br>(PR #53 强制原生全画幅模式) | 1920×1080 原生满幅<br>(无边框全屏铺满) | 仅限制：<br>`single`<br>`sequence` | 国学经典、商业创业、运营逻辑、情感关系、亲子教育 | 画面原生 16:9 全屏展示；搭配 **Ken Burns 微镜头平缓推入（Push-in）**；若遇微量比例偏差自动启用**双重高斯模糊虚化（Blur-Fill）**兜底，严禁粗暴拉伸或主体裁剪。 |

### 1. 黑板模式插图槽位矩阵 (`image_layout`)
当处于 `whiteboard` 模式时，系统依据分镜认知复杂度动态切换槽位：
* **`single`**（1 张全宽图，≈2.15:1）：开场抓人场景（Scene 1）、核心全景架构图、收尾总结卡；为了规避 API 出图左右留白，提示词强行注入 Wide-Band 约束，由打包器自动裁切上下 15% 白边；
* **`dual`**（2 张 1:1 对比图）：前后对比、正反案例、客户端 vs 服务端交互；
* **`triple`**（3 张 2:3 纵向序列图）：三步走流程（如 DNS ➔ 接入 ➔ 代理）、时序调用链；
* **`sequence`**（2~6 张同画幅动态推进图）：状态机流转、同一拓扑逐步叠加标注；
* **`quad`**（4 张 1:1 四宫格图）：四大象限分析、多方案横向矩阵对比。

### 2. 全画幅模式（Full-Frame）工程实现原理
在全画幅模式下，每张图片都是一张独立的完整画卷：
```json
{
  "visual_mode": "fullframe",
  "scenes": [
    {
      "scene_id": 1,
      "image_layout": "single",
      "image_sequence": [
        {"src": "assets/images/scene01_img01.png", "reveal_sentence": 1, "alt": "全画幅核心场景"}
      ]
    }
  ]
}
```
* **标题自绘与审核**：全画幅模式中，图片原生融入场景说明，并通过 `image_text_audit.json` 进行精确事实核验；
* **纯净字幕层**：底层 HTML 仅在画面底部 12% 安全区浮现优雅的短语字幕，带来沉浸式纪录片观感。

---

## 三、黑板插图“免标题（Title-Free）”铁律与图文碰撞门禁

在早期版本中，AI 生图常常会在图片正中央或顶部自行手绘大字标题，导致与 HyperFrames 网页渲染的 HTML 场景大标题发生**严重文字重叠与视觉车祸（Collision）**。

在 PR #50 中，系统确立了**黑板插图免标题铁律**并建立了自动化检查门禁：

```{important}
**免标题法定约束（Title-Free Clause）**：
在 `whiteboard` 模式下，所有分镜插图的提示词末尾，**必须逐图附带以下法定断言**：
`No title, heading or subtitle anywhere in the image.`（或 `画面中不要任何标题、大标题或副标题。`）
凡未携带该断言的生图提示词，构建器直接拒收。
```

### 自动化图文碰撞与事实核验门禁
项目引入了专属门禁脚本 [`scripts/check_visual_text_collisions.py`](file:///root/02project/course-render/scripts/check_visual_text_collisions.py) 与 [`scripts/audit_image_text.py`](file:///root/02project/course-render/scripts/audit_image_text.py)：
1. **渲染舞台碰撞检测**：在无头浏览器渲染第 0 帧时，提取插图有效内容边界与顶部标题文字的像素坐标，如果重叠或安全留白低于 24px，立即触发报警；
2. **免文字留白与高密度核验**：生成的图片不能是一张大白纸只写三个框，必须具备 4~8 个带连线的标注节点、流程走向箭头以及底部小结说明框；
3. **事实核验（Fact-Check Gate）**：`audit_image_text.py` 要求审计每一张图中的价格、日期、版本号、人名地名，标记 `ok`、`fixed` 或 `mismatch`，杜绝 AI 幻觉造成的错误科普。

---

## 四、同行爆款参考与 12-gram 原创度查重门禁

为了支持创作者对标短视频平台上的同行爆款视频，系统支持在项目目录的 `inputs/reference_scripts/` 下上传优秀的同行参考文本。但为了**严防洗稿抄袭与版权风险**，PR #48 上线了严格的原创度查重门禁：

```bash
# 执行原创度比对
python scripts/check_originality.py course_config.json --project-root <project>
```

### 原创度契约原则：
1. **借鉴逻辑结构，重写每个字句**：创作者可以吸收同行视频的开场 Hook 技巧、悬念铺设与认知拆解节奏，但讲稿必须完全用自己的话表达；
2. **12-gram 窗口算法检测**：门禁脚本以连续 12 个汉字为一个滑窗特征切片，比对当前讲稿与参考文本的重合比例；
3. **8% 强行熔断线**：若与任何参考文本的 12-gram 匹配重复率 **> 8%**，校验器直接阻断流水线（Exit Code 1），并在终端高亮标出疑似雷同段落，打回重新构思文案。

---

## 五、Codex 内置生图（Imagegen）与黑板风格提示词工程

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
Constraints: Simplified Chinese labels directly drawn on the chalk art, high contrast, clean readable chalk typography, no watermark, no border frame. No title, heading or subtitle anywhere in the image.
```

### 2. 生图落盘与多图绑定自动化
智能体通过如下流程完成分镜出图：
1. 遍历 `course_config.json` 中的 `scenes` 数组；
2. 依据 `image_layout` 确定本场景需要生成的图片数量与槽位宽高比；
3. 调用底层生图工具生成 1254×1254 或宽版高清图；
4. 自动落盘至项目本地目录：`assets/images/scene01_img01.png`；
5. 在 `course_config.json` 中配置对应的 `reveal_sentence: 1`，将图片推入时刻与讲稿第一句精准对齐。
