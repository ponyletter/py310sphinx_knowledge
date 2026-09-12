# 02. CLIProxyAPI 标准 JSON 凭证格式与字段深度解析

CLIProxyAPI 采用“基于文件描述符”的凭据解析架构。反代引擎在扫描 `auth-dir` 目录时，依靠 JSON 内部的顶级元字段（如 `type`）识别模型提供商（Provider），并以此动态注册对应的可用模型集。

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

## 二、Antigravity 类型凭据规范（Google Cloud / AGY 体系）

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

- **关键差异**：包含 `project_id`（对应 Google Cloud 项目标识）；`type` 必须为 `"antigravity"`。

---

## 三、生产实用工具：凭证完整性批量自检脚本

在向生产号池目录批量投递 JSON 文件前，建议使用以下内置 Python 脚本进行快速语法与关键字段体检：

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
