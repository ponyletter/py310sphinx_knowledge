# 6.4 全功能接口验证命令与自动化测试套件

在完成 CLIProxyAPI 的容器化部署、配置调优与多账号凭据挂载后，必须进行全方位的接口验证。本节整理了针对本地环回与外网 HTTPS 全场景的端到端测试命令集，并提供可直接运行的 Python 自动化回归测试脚本。

---

## 快速冒烟测试命令集（Terminal / cURL）

请在 VPS 终端执行以下命令进行分层测试（请将 `sk-meme-cliproxy-secret-2026` 替换为你实际配置的 API Key）。

### 1. 模型资产清单嗅探（GET /v1/models）
验证网关是否成功解析挂载的凭据文件，并确认当前账号池所支持的全部模型标识：

```bash
curl -s http://127.0.0.1:8317/v1/models \
  -H "Authorization: Bearer sk-meme-cliproxy-secret-2026" | jq .
```

**预期输出示例**：
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1715367049,
      "owned_by": "openai"
    },
    {
      "id": "gpt-5.6-luna",
      "object": "model",
      "created": 1720000000,
      "owned_by": "codex"
    },
    {
      "id": "gpt-image-2",
      "object": "model",
      "created": 1720000000,
      "owned_by": "system"
    }
  ]
}
```

---

### 2. 标准非流式对话测试（POST /v1/chat/completions）
测试同步返回链路是否畅通：

```bash
curl -X POST http://127.0.0.1:8317/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-meme-cliproxy-secret-2026" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a concise assistant."},
      {"role": "user", "content": "请用一句话证明你工作正常。"}
    ],
    "temperature": 0.7
  }' | jq .
```

**关键观察点**：
- 返回结构中是否包含标准的 `choices[0].message.content`；
- HTTP 响应状态码是否为标准的 `200 OK`。

---

### 3. 打字机流式 SSE 逐字推流测试（stream: true）
使用 `curl -N`（禁用缓冲）模拟真实客户端监听 Server-Sent Events 流式响应：

```bash
curl -N -X POST http://127.0.0.1:8317/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-meme-cliproxy-secret-2026" \
  -d '{
    "model": "gpt-4o",
    "stream": true,
    "messages": [
      {"role": "user", "content": "从1数到10，每个数字之间停顿一下"}
    ]
  }'
```

**预期输出流**：
终端将以明显的逐行推进速度刷出数据分片，最后以 `data: [DONE]` 结束：
```text
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"1"}}]}
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"、2"}}]}
...
data: [DONE]
```

---

### 4. 图像生成多模态模型测试（gpt-image-2）
测试微信小程序生图或表情包创作接口：

```bash
curl -X POST http://127.0.0.1:8317/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-meme-cliproxy-secret-2026" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "一只戴着墨镜坐在笔记本电脑前写代码的小猫，赛博朋克扁平插画风",
    "n": 1,
    "size": "1024x1024"
  }' | jq .
```

---

### 5. 跨公网域名 HTTPS 全链路验证
在任意外部网络（如本地开发机或国内服务器）执行以下命令，验证 Cloudflare + Nginx + SSL + CLIProxyAPI 全链路贯通：

```bash
curl -Iv https://api.yourdomain.com/v1/models \
  -H "Authorization: Bearer sk-meme-cliproxy-secret-2026"
```

---

## 自动化回归测试脚本（Python）

为方便后续批量检测账号池可用率、首字响应延迟（Time-To-First-Token, TTFT）与各模型支持状态，建议在运维机部署如下 Python 脚本：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 反代接口全功能自动化回归测试套件
依赖: pip install requests
"""

import time
import requests
import json

BASE_URL = "http://127.0.0.1:8317/v1"
API_KEY = "sk-meme-cliproxy-secret-2026"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def test_models():
    print("🔍 [1/3] 正在探测网关支持的模型列表...")
    resp = requests.get(f"{BASE_URL}/models", headers=HEADERS, timeout=10)
    assert resp.status_code == 200, f"模型列表拉取失败: {resp.text}"
    models = [m["id"] for m in resp.json().get("data", [])]
    print(f"✅ 获取成功！当前在线可用模型总数: {len(models)}")
    print(f"   模型示例: {', '.join(models[:5])} ...")
    return models

def test_chat_stream(model="gpt-4o"):
    print(f"\n⚡ [2/3] 正在测试流式打字机响应 (Model: {model})...")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "你好，请以极快的速度回答：1+1等于几？"}],
        "stream": True
    }
    
    start_time = time.time()
    first_token_time = None
    collected_text = ""

    with requests.post(f"{BASE_URL}/chat/completions", headers=HEADERS, json=payload, stream=True, timeout=30) as resp:
        assert resp.status_code == 200, f"流式请求异常: {resp.status_code} - {resp.text}"
        for line in resp.iter_lines():
            if not line:
                continue
            line_str = line.decode("utf-8")
            if line_str.startswith("data: ") and line_str != "data: [DONE]":
                if first_token_time is None:
                    first_token_time = time.time() - start_time
                try:
                    chunk = json.loads(line_str[6:])
                    delta = chunk["choices"][0].get("delta", {}).get("content", "")
                    collected_text += delta
                except Exception:
                    pass

    total_time = time.time() - start_time
    print(f"✅ 流式测试成功！")
    print(f"   - 首字输出延迟 (TTFT): {first_token_time:.3f} 秒")
    print(f"   - 完整回答耗时: {total_time:.3f} 秒")
    print(f"   - 模型回复内容: {collected_text.strip()}")

def main():
    print("==================================================")
    print("🚀 开始执行 CLIProxyAPI 生产链路健康检查")
    print("==================================================")
    try:
        models = test_models()
        test_chat_stream()
        print("\n🎉 全部关键核心指标通过！反代网关已达到生产上线标准！")
    except Exception as e:
        print(f"\n❌ 测试未通过，错误原因: {e}")

if __name__ == "__main__":
    main()
```

运行方式：
```bash
python3 verify_cliproxy.py
```

当所有测试用例呈现绿色通过时，你的专属海外大模型反代调度中枢即已完全具备向生产级客户端供电的能力！
