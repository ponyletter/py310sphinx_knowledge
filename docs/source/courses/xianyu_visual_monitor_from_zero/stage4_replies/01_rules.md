# 10 规则优先级、审核和首次欢迎

规则支持关键词任意／全部命中、exact／contains／regex、排除词、范围、优先级、冷却和模板。首次欢迎使用 `trigger_type=first_contact`，不是拿一个空关键词当作普通匹配。

```json
[
  {
    "name": "问候文图", "enabled": false, "priority": 100,
    "match_type": "contains", "match_mode": "any",
    "patterns": ["你好", "您好"], "exclude_patterns": [],
    "template": "您好，需求和问题描述可参考下图。",
    "cooldown_seconds": 60, "scope": "all", "allow_sensitive": false,
    "requires_review": false, "trigger_type": "keyword", "send_image": true
  }
]
```

将示例保存成 UTF-8 JSON，先在规则测试器预览，再用 `xianyu-monitor import-rules rules.json` 导入。命令默认将导入规则停用；`--keep-enabled` 会保留 JSON 的启用值，不会把 false 自动改为 true。默认图片路径和图片发送开关是运行设置，不是这个 JSON 里的字段。

## 自动模式为何仍可能待审核

全局开关只是条件之一。规则 `requires_review=true`、敏感词、否定、附件、截断、客户身份或观测置信度不足、回复暂停，都可能阻止自动发送。应读原因码，不应把所有 review 批量批准。

案例中问候规则发送文字＋图片，在售、物流、资料规则只发文字，价格类保留审核。首次欢迎与关键词命中要经同一规划器选择，避免首次咨询重复发送两份欢迎图。

## 冷却与每日上限

同规则冷却和客户日上限是不同限制。测试时同一规则连续触发可能被 `cooldown_active` 跳过，这是预期行为。不要为测试把全局限制永久清零，应先核对任务原因与时间。

**练习**：给“你好”“不需要教程”“多少钱”“[图片]”分别写预期动作和理由，验证规则命中不等于允许发送。
