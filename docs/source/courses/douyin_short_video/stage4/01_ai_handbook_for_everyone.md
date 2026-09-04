# 必学课程：人人能懂的AI小白书

面向非技术创作者的人工智能通识与全流程实战提效全景手册，帮助创作者跨越技术门槛，享受代码驱动、多模态智能与开源生态的生产力红利。

---

## 第 1 章 AI 基础认知与工具全矩阵

### 1.1 生成式人工智能（AIGC）的底层逻辑
* **大语言模型 (LLM)**：基于海量人类语料预训练的高维概率接龙模型。输入提示词越清晰、边界约束越严谨，输出质量越优。
* **多模态演进 (Multimodal)**：文本生成、图像生成、语音克隆、精确对齐与视频生成的统一智能编排。

### 1.2 创作者主流 AI 工具全矩阵

#### 1. 文本、脚本与去“AI味”技能
* **主流大模型**：ChatGPT (GPT-4o) / Claude 3.5 Sonnet / DeepSeek / Kimi / 豆包。
* **去 AI 味与提示词 Skill 工作流**：
  * 使用开源提示词技能（Prompt Skills / 去 AI 味工作流），强制模型消除“总而言之”、“令人惊叹”、“宛如”、“在当今快节奏的社会中”等八股套话，转换为具有喘息感、口语短句和真实生活口吻的自然语言。
* **专业级文生图与图解工具**：
  * **chatgpt-images-2-0**：通过代码或 Web 界面直接生成符合特定格式的技术示意图、信息图解与配图。
  * **Midjourney / Stable Diffusion**：艺术级画面生成与风格微调。
  * **即梦 (Dreamina)**：抖音官方生图工具，契合国内审美与短视频封面比例。

#### 2. 语音合成与声音克隆（TTS）
* **开源本地可跑（有显卡即可本地部署）**：
  * **Index-TTS (index2tts)**：高拟真音色克隆与情感表达，本地即开即用。
  * **GPT-SoVITS**：只需 5 秒样本即可完成高精度声音克隆，支持零样本学习。
  * **Fish Speech**：基于现代架构的高速语音合成引擎。
  * **CosyVoice**（阿里开源）：多语言与极佳的韵律控制。
* **企业级云端 API 服务**：
  * **火山引擎 / 豆包语音 API (Volcengine TTS)**：抖音官方同源音色，支持情绪标签、停顿标记与极高并发。
  * **ElevenLabs**：全球顶级拟真人声，情感起伏与语气细节行业标杆。
  * **MiniMax 开放平台**：海量特色音色与逼真表现力，支持开发者 API 高速调用。
  * **微软 Azure Speech TTS**：晓晓、云希等经典国民配音音色，稳定性极强，原生支持 `WordBoundary` 精准词边界。

#### 3. 语音识别 (ASR) 与 CTC 强制对齐 (Forced Alignment)
* **本地精准时间戳生态**：
  * **Faster-Whisper**：本地高效离线转录，提取字幕初稿。
  * **[MMS-300M Forced Aligner](https://huggingface.co/MahmoudAshraf/mms-300m-1130-forced-aligner)**：通过 CTC 算法实现音频与文本的毫秒级字符强对齐。配合本地 TTS（如 Index-TTS），实现**自动加图解动效、转场 SFX、Outro/Intro 与 BGM 的全自动时间轨合成**。

#### 4. 代码驱动的视频渲染生态（Skills & Code Video）
* **Remotion**：用 React + Web 技术编写视频，图解数据变动、流程图动画全自动化渲染；其自带的 **Tokens Captions** 设计支持单词级动画逐字染色与音画高度同步。
* **HyperFrames**：现代化板书动画与技术图解渲染框架。
* **Video-use**：批量视频切片与自动化流水线组合工具。

#### 5. AI 内容新赛道简析：AI 短剧与动态视觉
* 近年来由 Midjourney / Stable Diffusion 生成一致性角色分镜，配合 Runway / 可灵 (Kling) / Pika 渲染短视频镜头的“AI 短剧”赛道正在迅速崛起，其背后的自动化分镜脚本与图生视频工作流，与技术图解制作在工程本质上具有极高相通性。

---

## 第 2 章 创作者工具发现与技术交流生态（如何找最新工具）

技术与工具迭代极快，优秀的内容创作者必须具备持续获取一手生产力工具的能力：

* **GitHub 开源生态追踪**：
  * 关注 `Trending` 趋势榜（尤其是 Python / TypeScript 标签下的多媒体自动化项目）。
  * 关注音视频处理、TTS、字幕对齐相关的核心主题（Topic: `video-generation`, `tts`, `captions`, `remotion`）。
* **同行技术社群与创作者圈子**：
  * 加入高质量的前端视频代码交流群、AIGC 自动化视频流水线讨论群，第一时间跟进最新显卡部署优化方案、模型微调经验与防封禁安全规则。

---

## 📚 权威参考来源与延伸阅读
1. **[蝉妈妈 - 抖音行业与达人数据看板 (https://www.chanmama.com/douyin/)](https://www.chanmama.com/douyin/)**：短视频数据大盘与爆款分析。
2. **[HuggingFace: MMS-300M Forced Aligner 强对齐模型](https://huggingface.co/MahmoudAshraf/mms-300m-1130-forced-aligner)**：CTC 词级别精确对齐技术。
3. **[Remotion 官方 Captions 与 Tokens 文档](https://www.remotion.dev/docs/captions/)**：基于 Tokens 的精准逐字字幕染色实现。
4. **[ElevenLabs 官方文档](https://elevenlabs.io/docs)**：全球顶级语音合成与克隆 API。
5. **[火山引擎语音大模型与 TTS API](https://www.volcengine.com/product/tts)**：抖音官方同源语音合成服务。
6. **[GPT-SoVITS 开源项目](https://github.com/RVC-Boss/GPT-SoVITS)**：强大的开源少样本声音克隆工具。
