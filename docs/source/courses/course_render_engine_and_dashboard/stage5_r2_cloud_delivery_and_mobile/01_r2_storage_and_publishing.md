# 5.1 成果物交付规范、Cloudflare R2 云存储与全平台发布闭环

## 一、工业级微课成果物交付规范

在全流程自动化渲染完毕后，每个工程目录中会产生数十个过程文件（`subtitle_draft.md`、分场景音频分片、Whisper 词时间戳、HTML 模板等）。为了避免向创作者交付杂乱无章的工程半成品，系统将交付物精简为**“不可或缺的三大交付物”**：

| 文件路径 | 规格参数 | 用途与平台适配 |
| :--- | :--- | :--- |
| **`renders/<slug>.mp4`** | 1920×1080, 30fps, H.264/AAC, 连贯音频 | 抖音、B站、视频号、小红书横屏或高清宽幅视频主文件 |
| **`covers/cover-3x4.png`** | 1080×1440 (3:4 竖版), PNG | 移动端黄金比例封面，内置统一 Q 版人物与清晰标题 |
| **`video_copy.txt`** | UTF-8 纯文本，严格固定四行结构 | 创作者直接复制粘贴至发布后台的文案资料 |

### `video_copy.txt` 规范格式：
```text
Cloudflare怎么接？免费够用吗？
用一条请求链路讲清 Cloudflare 的 DNS、反向代理与 CDN 边界，并演示网站接入的关键步骤。方案以官方页面为准。
#Cloudflare #网站开发 #CDN加速 #网络安全 #建站技巧
首评：你的网站目前是直连还是开启了橙云代理？如果有升级经验，最值得推荐的功能是哪一个？
```

---

## 二、Cloudflare R2 对象存储集成与边缘免缓存穿透

创作者通常使用手机随时随地查看任务进展并发布视频。如果让手机从开发机直接下载几十兆的 MP4 视频，会严重拖慢家庭上行带宽，并且微信/QQ 传输文件会发生严重的二度压缩和画质损耗。

系统通过集成 **Cloudflare R2**（免出网流量费用、全球 Anycast 高速 CDN）实现了秒级多端交付：

```{mermaid}
flowchart LR
    Pipeline["渲染引擎输出成果三件套"] --> Hook["Post-Render 上传钩子"]
    Hook --> S3["R2 Client (boto3 / AWS S3 兼容协议)"]
    S3 --> R2["Cloudflare R2 Bucket (course-render)"]
    R2 --> Edge["自定义公网 CDN 域名: https://r2.example.com"]
    Edge --> Mobile["创作者手机端浏览器 (一键下载无压缩无损素材)"]
```

### 1. 自动化上传实现核心代码 (`dashboard/r2.py`)
```python
import boto3
from botocore.config import Config
from pathlib import Path

def upload_deliverable_to_r2(local_file: Path, target_key: str, content_type: str) -> str:
    s3_client = boto3.client(
        's3',
        endpoint_url="https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com",
        aws_access_key_id="<R2_ACCESS_KEY_ID>",
        aws_secret_access_key="<R2_SECRET_ACCESS_KEY>",
        config=Config(signature_version='s3v4')
    )
    
    # 关键点：设置 Cache-Control 避免 Cloudflare 边缘强缓存
    extra_args = {
        'ContentType': content_type,
        'CacheControl': 'public, max-age=0, must-revalidate'
    }
    
    s3_client.upload_file(str(local_file), "course-render", target_key, ExtraArgs=extra_args)
    return f"https://r2.example.com/{target_key}"
```

### 2. 避免边缘缓存背刺（Commit `5a76a63` 演进）
在早期版本中，如果某任务因小瑕疵重新渲染并覆盖上传同名文件，Cloudflare 边缘节点可能会命中强缓存，导致创作者手机下载到的依然是旧版废弃视频。通过配置 `CacheControl: public, max-age=0, must-revalidate`，彻底杜绝了边缘缓存不更新的问题。

---

## 三、合规治理与 AI 生成内容标识自动化

依照《互联网信息服务深度合成管理规定》及《人工智能生成合成内容标识办法》，所有使用 AI 算法生成音视频的自媒体内容，发布时必须履行提示义务。

系统在多个层次完成了**自动化合规支持**：
1. **显式文本声明**：在生成的 `video_copy.txt` 简介末尾，自动附带声明：“*本视频声音与插图由 AI 辅助合成制作，内容仅供科普参考*”；
2. **发布状态追踪（Publication Tracking）**：在 Web 仪表盘中，任务卡片包含专属的发布管理板块，创作者可标记：
   * 发布平台（小红书 / 抖音 / 视频号 / B站）
   * 发布状态（草稿箱 / 待发布 / 已发布 / 放弃发布）
   * 记录发布后的线上 URL 链接，形成完整的内容归档台账。
