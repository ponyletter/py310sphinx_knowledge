# AI 原生工具与内容自动化生态

为技术科普、板书图解以及自动化脚本工作流提供开发与生产力工具栈支持。

---

## 1. 语音合成、克隆 (TTS) 与精准对齐 (CTC Forced Alignment)

### 1.1 开源本地部署工具（有显卡即用）
* **Index-TTS (index2tts)**：拟真人声与克隆工具，本地快速推理。
* **[GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS)**：开源少样本声音克隆神器，只需 5 秒即可复刻个人声线。
* **[CosyVoice](https://github.com/FunAudioLLM/CosyVoice)**：阿里通义实验室开源的多语言语音生成模型。
* **[Faster-Whisper](https://github.com/SYSTRAN/faster-whisper)**：高性能本地 ASR 语音识别引擎，快速提取文案和生成 SRT 字幕。
* **[MMS-300M Forced Aligner](https://huggingface.co/MahmoudAshraf/mms-300m-1130-forced-aligner)**：基于 CTC 的毫秒级精确字符对齐，方便全自动组合**旁白 + 转场 SFX + Outro/Intro + 全程 BGM**。
* **[FunASR](https://github.com/alibaba-damo-academy/FunASR)**：中文语音转文字与时间戳标定。

### 1.2 企业级云端 API 服务
* **[火山引擎语音大模型 / 豆包语音 API](https://www.volcengine.com/product/tts)**：抖音官方同源技术，支持情感调节与超大并发。
* **[ElevenLabs](https://elevenlabs.io/)**：国际顶级逼真人声音频生成 API。
* **[MiniMax 开放平台](https://www.minimaxi.com/)**：高拟真表现力语音合成 API。
* **[微软 Azure Cognitive Speech TTS](https://azure.microsoft.com/en-us/products/ai-services/text-to-speech)**：经典音色（晓晓、云希等），原生支持 `WordBoundary` 词边界事件。

---

## 2. 视觉设计、图解与代码驱动视频 (Skills & Video-as-Code)

* **[稿定设计 (Gaoding)](https://www.gaoding.com/)**：小白友好的短视频封面、背景图、九宫格视觉排版工具。
* **chatgpt-images-2-0**：代码驱动与网页生成的高清技术架构与信息图解。
* **[Remotion](https://www.remotion.dev/)**：使用 React 纯代码编写与渲染视频，其 **Tokens Captions** 设计支持单词级逐字动画。
* **HyperFrames**：专为板书、技术图解打造的代码动效视频框架。
* **Video-use**：自动化视频流水线脚本。
* **草稿箱与批量化安全协议**：采用剪映草稿协议 (`draft_info.json`) 或官方草稿箱上传，规避第三方直传接口封禁风险。

---

## 3. 音视频底层处理与提示工程

* **[FFmpeg 官方文档](https://ffmpeg.org/documentation.html)**：底层音视频编解码与切片标准工具。
* **[MoviePy Python 库](https://zulko.github.io/moviepy/)**：Python 脚本化剪辑工具。
* **[OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)**：提示工程黄金法则。
* **开源去 AI 味文案技能 (De-AI Style Skills)**：去除机械化八股套话，强化真实人声呼吸感。
