# 02. CLIProxyAPI 标准 JSON 凭证规范、Free vs Plus 对比与防封混淆技巧

CLIProxyAPI 采用“基于文件描述符”的凭据解析架构。反代引擎在扫描 `auth-dir` 目录时，依靠 JSON 内部的顶级元字段（如 `type`）识别模型提供商（Provider），并以此动态注册对应的可用模型集。

本节系统解析 Codex 与 Antigravity 凭据规范，对比 Free 免费号与 Plus 会员号的核心差异，揭秘额度查询机制，并传授防止凭证被封的混淆小技巧。

---

## 一、Codex 类型凭据规范（ChatGPT Plus / OpenAI OAuth）

这是生产号池中最核心、最主流的凭证形态，直接承载 `gpt-5.5`、`gpt-image-2` 及各类高阶推理模型。

### 1. 标准结构模板

```json
{
  "type": "codex",
  "email": "user_plus_01@gmail.com",
  "account_id": "dfac342e-8911-44ab-9c12-7890abcdef12",
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "refresh_token": "rt.1.AABHV5z9_xxxxxxxxxxxxxxxxxxxxxx",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "disabled": false,
  "expired": "2026-09-20T14:30:00.000Z",
  "last_refresh": "2026-09-12T10:00:00.000Z"
}
```

### 2. 字段定义与约束规则

| 字段名称 | 类型 | 是否必填 | 核心作用与校验逻辑 |
| :--- | :--- | :--- | :--- |
| `type` | `string` | **必须** | **固定填 `"codex"`**。引擎据此判定使用 OpenAI 客户端并注册 `gpt-5.5`、`gpt-image-2` 等模型。 |
| `refresh_token`| `string` | **必须** | **长效刷新令牌**（以 `rt.` 开头）。必须保证真实有效，引擎后台定时器以此向官方续期。 |
| `email` | `string` | **必须** | 账号绑定邮箱，主要用于日志追踪与多账号隔离。 |
| `account_id` | `string` | **必须** | OpenAI 为该用户分配的唯一 UUID，用于区分工作空间与上下文。 |
| `access_token` | `string` | 可选 | 当前有效的短期 JWT。若缺失，引擎首次启动会自动利用 `refresh_token` 自动换取。 |
| `id_token` | `string` | 可选 | Auth0 身份验证令牌，通常与 `access_token` 伴生下发。 |
| `disabled` | `boolean`| 可选 | 默认为 `false`。若设为 `true`，引擎将把该号暂时踢出调度池，不参与轮询。 |
| `expired` | `string` | 可选 | 当前 `access_token` 的过期时间（ISO 8601 格式字符串）。 |

---

## 二、Free 免费号 vs Plus 会员号技术指标全景对比

| 对比维度 | Free 免费账号 (白嫖/体验号) | Plus 会员账号 (官方正价/礼品卡/Visa海外卡/U卡/拼车) |
| :--- | :--- | :--- |
| **生图能力 (DALL-E / gpt-image-2)** | 🚨 **完全无官方生图额度**<br>*(市面上部分声称 Free 能生图的，多是用网页逆向抓取转 API 形式，极不稳定、延迟高且频繁失效，生产环境极不推荐)* | ⭐️ **支持原生满血生图**<br>支持 `gpt-image-2`、DALL-E 3 高清分辨率批量渲染与多图连续修改 |
| **可用高级模型** | 支持 `gpt-5.6-luna`、基础轻量对话模型 | 完整支持 `gpt-4o`、`gpt-5.5`、深度思考推理模型等 |
| **速率限制 (Rate Limit)** | 时间窗口额度极低，单次对话容易降级 | 享有优先计算队列，高频并发容忍度高 |
| **稳定性与生命周期** | 易受官方风控批量清算封停 | 官方正规扣费背书，存活期以月/年为单位 |
| **推荐生产定位** | 离线开发测试、接口冒烟探测、语法校验 | ⭐️ **商业级应用、微信小程序、AGY 编程助手主力池** |

---

## 三、额度查询的技术真相与 5 小时周期限制

在日常使用中，很多开发者关心：**“为什么不能在 5 小时周期用完之前提前告警？”**

### 1. 官方与 CLIProxyAPI 的现状
- 官方机制：OpenAI 官方与 Codex 体系采用动态的滑动时间窗口（如 3~5 小时周期，或每周总量配额）。
- **无法提前预警的根本原因**：上游官方没有向第三方开放带有实时“剩余可用请求数/Token 百分比”的 Webhook 接口。CLIProxyAPI 作为代理，只有当向官方发起实际请求被上游返回 `HTTP 429 Too Many Requests` 时，才能确切获知该账号已耗尽额度。
- **命令行查询方式**：在 Codex 网页端或终端交互输入 `/usage` 可以手动拉取使用状态，但这也属于事后主动查询，无法作为上游的主动推送通知。

### 2. 商业中转站与大型拼车平台的应对方案
市面上部分成熟的中转站或拼车平台之所以能展示“剩余额度进度条”，通常采用以下两种工程妥协方案：
1. **网关层本地估算令牌桶（Local Counter）**：在自身反代网关层为每个账号设立本地计数器，记录其在过去 5 小时内发起的请求次数。当达到预设经验阈值（例如 40 次）时，系统主动标黄预警或自动切换备用号；
2. **模拟逆向抓取私有接口**：通过模拟浏览器在后台周期性请求 `/backend-api/wham/usage` 等私有未公开接口，解析返回的配额百分比，但该方式存在被官方侦测为异常爬虫的风险。

---

## 四、Codex 凭据防封抗探测小技巧（混淆与伪装）

在长时间多并发调用反向代理时，可以通过以下关键手段提升账号池的安全防护力：

```{mermaid}
flowchart TD
    Req[客户端请求] --> Jitter[1. 注入请求抖动 Jitter<br/>毫秒级随机延迟，打散机械规律]
    Jitter --> HeaderRand[2. 请求头混淆 Header Randomization<br/>动态轮换 UA 与客户端指纹]
    HeaderRand --> StickyIP[3. 出口 IP 粘性绑定 Sticky Session<br/>固定账号走固定代理，防止跨洲异地飘移]
    StickyIP --> Upstream[上游官方接口]
```

1. **请求头动态混淆（Header Randomization）**：
   - 避免向官方端点发送完全千篇一律的固定 User-Agent（如老旧的 `python-requests` 或固定单一浏览器标识）；
   - 在网关转发时，随机轮转现代浏览器的标准请求头（如 Chrome、Edge、Safari 的 `sec-ch-ua`、`Accept-Language`），模拟真实桌面端用户。
2. **出口 IP 粘性绑定（Sticky Session）**：
   - 如果为账号池配置了多个海外出口代理，**严禁同一个账号在一分钟前使用美国西岸 IP、一分钟后突然跳到欧洲节点**；
   - 应当为每个 `.json` 账号固定分配特定的代理出口，保持地域连续性，避免触发异地安全锁定。
3. **请求间隔加入轻微抖动（Jitter）**：
   - 机械化、毫秒级完全固定间隔的并发请求极易被官方防爬虫 AI 标记。在反代内部加入 50~200ms 的随机时间抖动，能够有效模拟人类思维间歇。

---

## 五、Antigravity 类型凭据规范（Google Cloud / AGY 体系）

承载 Google Gemini 及 Antigravity 体系高阶模型的凭证形态。

```json
{
  "type": "antigravity",
  "email": "developer@gmail.com",
  "project_id": "gen-lang-client-0123456789",
  "access_token": "ya29.a0AcM612x...",
  "refresh_token": "1//04Gj98...",
  "expires_in": 3599,
  "timestamp": 1789500000,
  "disabled": false,
  "expired": "2026-09-13T08:00:00.000Z"
}
```

---

## 六、生产实用工具：凭证完整性批量自检脚本

在向生产号池目录批量投递 JSON 文件前，可使用以下内置 Python 脚本进行快速自检：

```python
#!/usr/bin/env python3
"""
check_auth_json.py - 批量校验号池 JSON 格式合法性
运行方式: python3 check_auth_json.py /root/cliproxyapi/auths
"""
import sys
import json
from pathlib import Path

def validate_auth_file(file_path: Path):
    print(f"🔍 正在检查: {file_path.name}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ JSON 语法解析失败: {e}")
        return False

    auth_type = data.get("type")
    if not auth_type:
        print("❌ 缺失必需的 'type' 字段 (如 'codex' 或 'antigravity')")
        return False

    if auth_type == "codex":
        required = ["refresh_token", "email", "account_id"]
    elif auth_type == "antigravity":
        required = ["refresh_token", "email", "project_id"]
    else:
        required = ["refresh_token"]

    missing = [k for k in required if not data.get(k)]
    if missing:
        print(f"❌ 关键字段缺失: {missing}")
        return False

    rt = data.get("refresh_token", "")
    print(f"✅ 格式合格: Provider=[{auth_type}], Email=[{data.get('email')}], RT长度=[{len(rt)}]")
    return True

if __name__ == "__main__":
    target_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "/root/cliproxyapi/auths")
    if not target_dir.exists():
        print(f"目录不存在: {target_dir}")
        sys.exit(1)

    json_files = list(target_dir.glob("*.json"))
    print(f"共发现 {len(json_files)} 个凭据文件，开始检查...\n")
    passed = sum(1 for f in json_files if validate_auth_file(f))
    print(f"\n======================================")
    print(f"检查完成: 合格 {passed} / {len(json_files)}")
```
