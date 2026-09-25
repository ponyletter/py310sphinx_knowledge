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

## 四、独立 3:4 封面设计系统（Cover Studio & `cover_spec.json`）

短视频平台（如小红书、抖音、微信视频号）对封面比例有严格要求（3:4 竖版为王）。在 PR #32、PR #33、PR #47 的演进中，封面排版与生图逻辑彻底解耦为独立的工程引擎：

```bash
# 独立构建封面
python scripts/make_cover.py course_config.json --project-root <project>
```

```{mermaid}
flowchart TD
    Config["course_config.json<br/>(title/subtitle/art_prop)"] --> Spec["生成独立规范: cover_spec.json"]
    Spec --> Engine["make_cover.py 渲染引擎"]
    
    subgraph 视觉图层合成流水线
        Engine --> Bg["背景生成: 主题象征道具<br/>(AI生成无文字干净背景)"]
        Engine --> Figure["人物/形象图层: --figure character|image|none<br/>(Q版库 / 自定义抠图 / 纯板书)"]
        Engine --> Halo["自适应光晕层 (Character Halo):<br/>外轮廓羽化与背景柔和剥离"]
        Engine --> Typography["排版渲染: 标题+高亮词+副标胶囊+清单点+系列徽标"]
    end
    
    Typography --> Eval["平静度检测 (Quiet Zone Score)"]
    Eval -->|文字或人物区域过杂乱| Retry["自动重新生图背景 (最多重试2次)"]
    Eval -->|检测合格| Out["输出: covers/cover-3x4.png (1080×1440)"]
    Out --> History["保留版本: covers/history/cover-N.png"]
```

### 封面引擎核心技术突破：
1. **独立规范文件与人工锁定（`locked_by_user` / PR #47）**：
   * 封面配置独立落盘为 `cover_spec.json`，任何后续排版微调无需重新调用生图 API；
   * 如果用户在 Web 控制台或 Cover Studio 中微调过标题、字号、位置，文件会自动标记 `"locked_by_user": true`。后续批量构建脚本在更新视频时，**绝对不会覆盖用户人工确认的封面**（除非显式传入 `--force`）。
2. **安静区评分与自动重试（Quiet Zone Retries / PR #33）**：
   * AI 生成的道具背景如果恰好在标题文字区域或人物面部区域存在杂乱线条，脚本会自动计算该区域的边缘噪点高频分值；
   * 自动重新生成背景（最多 2 次），自动筛选并保留最干净的背景版本（分值记录于 `cover_manifest.json` 中的 `quiet_scores`）。
3. **自适应人像柔光轮廓（Character Halo）**：
   * 自动为人像边缘提取 Alpha 遮罩并扩展 12~18px 的半透明柔光，保证人物在暗色、复杂或高反差背景下依然边缘清晰利落。
4. **多形态人物形象（`figure` 参数）**：
   * `character`（默认）：绑定 Q 版人物姿态库；
   * `image`（`--figure-image <path>`）：支持任意第三方图片（如品牌 Logo、讲师真实自拍卡片）；
   * `none`：纯板书文字封面，道具充满下半区。

---

## 五、用户专属人物形象库全流程（`make_character.py` / PR #44）

在长会话 `5cc61a5d` 中，创作者提出了“直接使用自用个性化头像（如自用卡通头像）并在全套课件中统一样貌与动作”的需求。PR #44 实现了全自动用户形象库工程：

```bash
# 基于用户单张自拍/头像构建专属 Q 版姿态库
python scripts/make_character.py --photo inputs/profile/avatar.jpeg --out assets/brand/custom/
```

### 1. 专属形象资产树
执行完毕后，在专属形象库目录下自动生成标准资产：
* `q_master.png`：标准正面大头主形象（透明通道 PNG）；
* 5 种核心教学动作姿态（预先生成并本地缓存）：
  * `smile.png`：标准微笑开场（默认）；
  * `thinking.png`：手托下巴思考（用于痛点提问场景）；
  * `surprised.png`：惊讶/警示（用于 Bug、踩坑与风险警示场景）；
  * `pointing.png`：手指黑板核心架构（用于重点讲解）；
  * `laptop.png`：操作电脑办公（用于实战编码展示）。

### 2. 课程多租户挂载
任意微课项目只需在生成封面时指定形象库：
```bash
python scripts/make_cover.py course_config.json --character-dir assets/brand/custom/
```
生成的封面将彻底告别随机换脸，全网所有视频保持 100% 统一的创作者个人 IP 视觉符号。

---

## 六、片尾行动号召与收尾控制合约（CTA Outro Contract / PR #46）

为了适配纯知识沉淀型微课与营销转化型短视频的不同诉求，PR #46 实现了完全可配置的片尾合约：

```json
{
  "cta_outro": {
    "enabled": false,
    "actions": ["＋ 关注", "⭐️ 收藏"],
    "avatar": "inputs/profile/end_logo.png",
    "avatar_shape": "circle"
  },
  "ending": {
    "final_hold_seconds": 0.8
  },
  "intro_sting": {"enabled": true, "volume": 0.8},
  "outro_sting": {"enabled": true, "volume": 0.8},
  "background_music": {"enabled": false, "volume": 0.12}
}
```

### 核心调控点：
1. **静默知识收尾 (`enabled: false`)**：不弹出花哨的“点赞关注”动画，最后一个场景讲完后平滑定格保持 0.8 秒（`final_hold_seconds`），给观众留出消化思考空间，尽显专业沉稳；
2. **定制品牌转化 (`enabled: true`)**：支持圆形（`circle`）或方形讲师头像，灵活组合引导动作按钮；
3. **音效解耦**：开场过渡音效（`intro_sting`）、闭幕音效（`outro_sting`）与背景音乐（`background_music`）均支持音量与开关独立配置。

---

## 七、全生命周期质量门禁（Validator Gates）

在视频渲染前后，[`validate_course_package.py`](file:///root/02project/course-render/scripts/validate_course_package.py) 执行严格的工业级门禁检查：

1. **图文碰撞拦截 (`check_visual_text_collisions.py`)**：检测分镜位图是否与顶部标题发生物理像素撞车；
2. **事实核验与免标题审计 (`audit_image_text.py`)**：检查 `image_text_audit.json`，确保每张图无手绘标题，且所有数据、版本号有据可查；
3. **原创度校验 (`check_originality.py`)**：对标同行爆款参考，确保 12-gram 重合率 <= 8%；
4. **时间轴完整性 (`build_sentence_timeline.py`)**：检测 WAV 音频哈希是否匹配，严禁过期时间戳混入打包；
5. **音频质量门禁**：首尾帧黑屏检测，音轨静音段探测与波形削波防爆音检测。

未通过门禁的课件直接阻断交付，杜绝劣质半成品流出。
