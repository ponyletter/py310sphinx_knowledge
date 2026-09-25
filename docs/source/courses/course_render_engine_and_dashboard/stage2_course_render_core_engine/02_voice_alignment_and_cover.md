# 2.2 连贯配音、毫秒级字幕对齐、独立封面与质量门禁

## 一、IndexTTS 2.5 连贯配音与克隆调优

高质量技术微课最忌讳“逐句断续拼接”带来的语调机械感与呼吸断裂。`course-render` 采用全课连贯合成模式（`course-continuous`）：

```json
"voice_generation": {
  "mode": "course-continuous",
  "max_retries": 2
}
```

### 核心调优特性：
1. **全局声学参考保持**：全课所有句子基于同一个讲师干音参考文件（`assets/voice/index-tts25-myvoice.wav`），声学特征与音色高度一致；
2. **标点与停顿保留**：讲稿保留完整的中文逗号、句号与问号，引导声学模型自然生成停顿与抑扬顿挫；
3. **生僻词与发音注音**：支持通过 `<原文|发音>` 注解标记（例如 `<Cloudflare|克劳德菲尔>` 或数字注音），在合成前精确修正多音字读音。

---

## 二、Faster-Whisper / CTC 强制对齐与短语字幕切分

### 1. 强制对齐与视觉体验偏置（Eye-reading Offset）
语音生成完成后，系统调用 Faster-Whisper 或 MMS CTC 获取字词级物理时间戳，并使用 `SequenceMatcher` 将讲师真实剧本与时间戳进行双向对齐。

为了符合人眼的阅读舒适感，对齐流水线会自动施加**视觉时间偏置**：
* **前置预滚（Pre-roll）**：`-0.10s`，字幕比发音提前 100 毫秒出现，给人眼预先扫读的反应时间；
* **后置尾延（Tail-padding）**：`+0.15s`，声音结束后字幕保留 150 毫秒，防止眨眼瞬间画面变空。

### 2. 标点与语法保护规则
字幕短语切割遵循严格的排版美学：
* 单条字幕字符数保持在 8~16 字，硬上限不超过 26 字；
* **严禁首字为助词**：字幕开头绝不允许出现 `的`、`地`、`得`；
* **原子保护**：数字、英文缩写、专有名词与固定短语禁止跨行跨句强行切断。

---

## 三、跨进程显卡安全互斥锁（`gpu_lock.py`）

当多个微课作业在同一台工作站并发执行时，IndexTTS 和语音对齐如果同时启动 CUDA 推理，会导致显存剧烈争抢引发 CUDA Out-Of-Memory (OOM) 崩溃。

项目通过 [`gpu_lock.py`](file:///root/02project/course-render/scripts/gpu_lock.py) 实现了机器级的安全文件锁：

```python
# scripts/gpu_lock.py 核心原理示意
from filelock import FileLock
import os

LOCK_FILE = os.path.expanduser("~/.cache/course-render/gpu.lock")

def machine_gpu_lock():
    os.makedirs(os.path.dirname(LOCK_FILE), exist_ok=True)
    # 当任务 A 占用 GPU 时，任务 B 处于阻塞等待状态，任务 A 释放后自动接管
    return FileLock(LOCK_FILE, timeout=600)
```

通过这一机制：
* 文本策划、插图生成、HTML 组装等 CPU 密集型任务实现**完全并发**；
* 语音合成、CTC 深度学习对齐等 GPU 密集型任务实现**无缝排队**，从根本上保证了系统的长周期无人值守稳定性。

---

## 四、独立 3:4 封面设计系统（Cover Studio）

短视频平台（如小红书、抖音、微信视频号）对封面比例有严格要求（3:4 竖版为王）。在 PR #51 中，封面逻辑被重构为独立的规范引擎：

```{mermaid}
flowchart TD
    Config["course_config.json<br/>(title/subtitle/art_prop)"] --> Spec["生成规范: cover_spec.json"]
    Spec --> Engine["make_cover.py 渲染引擎"]
    
    subgraph 视觉图层合成
        Engine --> Bg["背景生成: 主题象征道具<br/>(AI生成无文字背景)"]
        Engine --> Avatar["讲师Q版人像: assets/brand/q/<br/>(预先锁定的透明卡通人像)"]
        Engine --> Halo["自适应光晕层: 人物与背景柔和分离"]
        Engine --> Typography["排版渲染: 标题+胶囊副标+系列角标"]
    end
    
    Typography --> Eval["平静度检测 (Quiet Zone Score)"]
    Eval -->|文字区域过杂乱| Retry["自动重新生图 (最多重试2次)"]
    Eval -->|检测合格| Out["输出: covers/cover-3x4.png (1080×1440)"]
```

### 封面核心亮点：
1. **讲师形象锁定**：人物不通过 AI 随机生成，而是从已录入的 Q 版矢量库（`assets/brand/q/`）中调取，保证每节课人物完全一致；
2. **文字区域平静度重试**：AI 生成的背景图如果恰好在标题位置有杂乱线条，脚本会自动计算该区域的噪点分值，自动重新生成，直至文字背景干净清爽。

---

## 五、全生命周期质量门禁（Validator Gates）

在视频渲染前后，[`validate_course_package.py`](file:///root/02project/course-render/scripts/validate_course_package.py) 执行严格的工业级门禁检查：

1. **图文碰撞拦截**：检查插图是否有大面积空白，或与字幕渲染区发生坐标重叠；
2. **原创度校验 (`check_originality.py`)**：检测讲稿是否过度雷同或抄袭模板；
3. **时间轴完整性**：检查全课时长是否在 2~4 分钟黄金区间，确保结尾 CTA 停留不少于 1.5 秒；
4. **音频门禁**：检测首尾帧是否存在黑屏、音轨是否存在静音或过载爆音。

未通过门禁的课件直接阻断交付，杜绝劣质半成品流出。
