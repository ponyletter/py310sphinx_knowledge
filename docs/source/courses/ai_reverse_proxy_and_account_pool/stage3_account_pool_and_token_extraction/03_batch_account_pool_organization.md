# 03. 多账号分级组织、命名规范与健康巡检

当号池规模从 1 个扩展到 10 个甚至上百个时，杂乱无章的文件命名和缺乏分级策略会导致运维失控。本节制定工业级多账号组织规范与健康管理体系。

---

## 一、文件命名标准与目录规范

```{mermaid}
graph TD
    Root["/root/cliproxyapi/auths/ (号池根目录)"]
    Root --> F1["codex-f11baede-account1@gmail.com-plus.json (主力 Plus 号)"]
    Root --> F2["codex-82ab194c-account2@gmail.com-plus.json (备用 Plus 号)"]
    Root --> F3["codex-98de331a-testuser@gmail.com-free.json (免费体验号)"]
    Root --> F4["antigravity-devteam@gmail.com.json (AGY 专用号)"]
```

### 1. 推荐命名格式
```text
<provider>-<hash/uuid>-<email_prefix>-<tier>.json
```
- **示例解析**：
  - `codex-f11baede-akuncalback9@gmail.com-plus.json`：清晰表明底层为 Codex 协议、关联邮箱、带有 Plus 高阶模型配额。
  - `codex-03ac9188-teamtest@gmail.com-free.json`：表明为免费测试号。

---

## 二、三级号池架构分级策略

为了保障关键业务系统（如已付费用户的请求）永不被限流，建议将号池在逻辑上划分为三个梯队：

```{mermaid}
flowchart TD
    Req["下游应用请求 (如微信小程序)"] --> Router{"路由与分流策略"}
    Router -->|"付费VIP请求 / 表情包合成"| Tier1["第一梯队：主力 Plus 独享池\n(高速响应、高并发、gpt-5.5/gpt-image-2)"]
    Router -->|"普通用户日常对话 / 试探请求"| Tier2["第二梯队：共享与平价号池\n(成本控制、承接中低优先级流量)"]
    Tier1 -->|"发生 429 速率超限或熔断"| Tier3["第三梯队：冷备灾备应急池\n(自动热激活、降级容灾)"]
```

### 1. 第一梯队：主力高可用 Plus 池
- **构成**：由官方正价订阅的纯净独享 Plus 账号组成（包含正规美区苹果礼品卡、海外 Visa/Mastercard 实体卡或高权重虚拟卡/U卡开通）；
- **职责**：专供核心业务，如小程序内付费会员的动图生成（`gpt-image-2`）与高阶复杂提示词解析。

### 2. 第二梯队：常规业务池
- **构成**：性价比高的合规号或多用户分流号；
- **职责**：承接日常轻量对话、客服问答等对耗时与模型版本要求不高的基础请求。

### 3. 第三梯队：冷备容灾池
- **构成**：预备 1~2 个随时可被激活的待命账号；
- **职责**：当主力池某账号突发 429 或需要轮换维护时，无需修改后端代码，直接重命名并放入 `auths/` 目录，引擎热加载秒级无缝顶上。

---

## 三、失效账号隔离与安全备份规程

### 1. 优雅隔离（无需删除文件）
如果某个账号临时需要暂停调用，切勿直接删除文件（避免丢失历史凭据）。直接修改该文件内部的 `disabled` 字段：
```json
{
  "type": "codex",
  "disabled": true,
  ...
}
```
引擎热监听会在数毫秒内感知变更，并在下一次轮询请求中自动跳过该账号。

### 2. 安全备份与严禁提交 Git
````{admonition} 绝禁将号池凭证泄露至公网
:class: caution

1. 号池 JSON 文件包含完整的 `refresh_token` 和私密信息，**严禁将其提交至 GitHub 等任何公网代码仓库**；
2. 项目的 `.gitignore` 中必须严格写入：
   ```gitignore
   auths/*.json
   *.token
   *.key
   ```
3. 定期使用加密压缩归档备份到内网私有存储：
   ```bash
   tar -czf - /root/cliproxyapi/auths | openssl enc -aes-256-cbc -salt -out auths_backup_$(date +%F).tar.gz.enc
   ```
````
