# 技术图解短视频生产工程规范与契约手册

本规范提炼自生产级开源项目 **[blackboard-bilingual-course-video](https://github.com/ponyletter/blackboard-bilingual-course-video)** 的实际开发与出片经验，定义了面向技术科普、板书图解短视频的**生产契约（Production Contracts）**。

---

## 1. 认知原型与叙事矩阵契约 (Narrative Matrix)

每一期视频必须在策划之初明确其属于 **6 大认知原型** 之一，杜绝图表的机械轮换：

1. **概念机制拆解课 (Concept Deep-Dive)**：以直觉物理隐喻开场，经由时序泳道流与核心代码，最终收束于能力边界与全局图景。严禁空洞的对比表。
2. **多产品对比选型课 (Product Comparison)**：全景选型光谱 $\rightarrow$ 机制对照 $\rightarrow$ 横向评估矩阵 $\rightarrow$ 选型决策树。每个被比较工具必须在至少 2 个场景中同台竞技。
3. **反常识动机揭秘课 (Paradox Motivation)**：单体美好假象 $\rightarrow$ 级联雪崩因果图 $\rightarrow$ 自愈解耦闭环 $\rightarrow$ 复杂度与收益天平。
4. **技术演进替代课 (Evolution Shift)**：旧代际性能瓶颈 $\rightarrow$ 演进梯度坐标轴 $\rightarrow$ 新旧对比矩阵 $\rightarrow$ 迁移图谱。
5. **故障排查诊断课 (Troubleshooting)**：故障现场指标 $\rightarrow$ 排查决策树 $\rightarrow$ 根因修复补丁 $\rightarrow$ 长期防范。
6. **架构经济学决策课 (Economics Decision)**：显性成本对比 $\rightarrow$ 隐性运维与故障成本 $\rightarrow$ 临界点判定 $\rightarrow$ 选型清单。

---

## 2. 语音与字幕对齐工程契约 (Voice & Caption Contract)

* **连续生成优先 (Continuous Voice First)**：
  * 全片音频优先采用 `course-continuous` 一体化生成，杜绝按句切片后拼接导致的语速、底噪与气口突变。
* **强制字符对齐 (CTC Forced Aligner)**：
  * 使用 MMS-300M 等 CTC 强对齐模型作为字级时间戳标准，字幕与音效触发均以此为绝对依据。
* **双轨分离与最小标注 (Dual-Track Text)**：
  * 字幕展示源 (`text`) 保持纯正规范中文与必要缩写；
  * 语音生成源 (`tts_text`) 仅在实际听审报错时注入局部多音字拼音（如 `<命中|MING4 ZHONG4>`）或 CMU 英文音标。
* **短语化字幕切分 (Phrase Captions)**：
  * 单屏字幕长度严格控制在 **8 ~ 16 字**，硬上限 26 字，至多两行。
  * **硬性过滤**：绝不允许断句碎片以“的、地、得”开头，必须完整包裹核心修饰短语。

---

## 3. 画面视觉与分层架构契约 (Visual Layering Contract)

* **首帧主题清晰硬门禁 (First-Frame Clarity Gate)**：
  * 第一幕居中标题必须含有明确的标准技术名词或具体问题，通过“首帧脱敏盲测”（仅看标题即可理解全篇主题）。
* **问句标题“先读问题”门禁**：
  * 问句标题的视频，首句旁白必须先念出或自然重述该问句，禁止视听脱节。
* **职责分层原则**：
  * **全局框架层 (HyperFrames / Remotion)**：拥有全局标题 (`title_html`)、支持副标题、学习进度条与字幕浮层。
  * **图解内容层 (Core Graphics)**：拥有局部架构框、流程箭头、代码窗口、参数标注与结论文字。
  * 严禁无字纯装饰插画，每张核心图片均应具备明确的信息图解与教学指引意义。

---

## 4. 交付与发布安全契约 (Delivery & Safety)

* **标准交付包结构**：
  * 校验合格的成品 `output.mp4`；
  * 全套可复现的工程项目源码（HTML/React/JSON）；
  * 独立连续语音轨 `course_voice.wav`；
  * 毫秒级对齐时间戳 `sentence_timeline.json`；
  * 规范视频发布文案 `video_copy.txt`（包含标题、话题标签、简介）；
  * 9宫格与横幅适配封面。
* **安全发布流程**：
  * 自动化生成的素材优先导入**剪映草稿工程 (`draft_info.json`)** 或官方平台草稿箱，由人工复核后通过**官方定时发布**排期上线。
