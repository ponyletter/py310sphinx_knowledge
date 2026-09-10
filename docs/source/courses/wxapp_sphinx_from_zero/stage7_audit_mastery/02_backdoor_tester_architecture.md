# 审核员“暗门测试通道”架构设计（绝密实战）

在有付费门槛的小程序审核中，开发者面临一个**“世纪死结”**：
- **审核员的要求**：审核人员必须免付费、深度验收所有章节内容与交互闭环，如果点进去都锁死要充值，会以*“核心功能无法完整体验”*为由直接驳回；
- **开发者的担忧**：如果界面上堂而皇之地摆一个“测试账号登录”或“一键领取 VIP”按钮，正式版发布后普通用户一眼就能看见，商业变现直接被全员白嫖破产！

如何既能让审核员丝滑验收，又能 100% 确保线上商业安全？我们设计了**“版本号文本暗门 + 手动凭据 + 后端动态熔断”**的三重保险架构。

---

## 1. 暗门通道全景架构设计

```{mermaid}
graph TD
    User["用户进入个人中心底部"] --> Tap["轻触底部版本号文字：数创库 · 知识库 v1.0.0"]
    Tap --> Modal["唤起低调的测试登录弹窗"]
    Modal --> Input["账号密码默认完全留空，必须手动输入"]
    Input -->|"输入测试账号密码"| API["POST /api/auth/test_login"]
    API --> Switch{"后端开关 ENABLE_AUDIT_LOGIN"}
    Switch -->|"开启状态 (审核期间)"| Grant["分配专属测试 Token：100研学币 + 1年专栏VIP"]
    Switch -->|"关闭状态 (过审上线后)"| Reject["直接返回 403 Forbidden 彻底断绝通道"]
```

---

## 2. 前端隐蔽暗门入口设计

### 2.1 入口位置选择
在 `miniapp/pages/user/user.wxml` 中，将点击事件绑定在最底部的版权说明文本上：

```html
<!-- 页面底部版本号 (视觉上是静态版权，点击触发审核暗门) -->
<view class="app-version-footer" bindtap="onTapVersion">
  <text class="version-text">数创库 · 知识库 v1.0.0</text>
</view>
```

对应低调的灰色 CSS 样式：
```css
.app-version-footer {
  text-align: center;
  padding: 30rpx 0 40rpx;
}
.version-text {
  font-size: 24rpx;
  color: #94a3b8; /* 低对比度灰色，普通用户完全忽视 */
}
```

### 2.2 防白嫖设计：手动输入凭证
在弹窗组件中，**严禁放置任何“一键填充”或默认写入账号密码的代码**：
```html
<view class="edit-modal-mask" wx:if="{{showTestLoginModal}}">
  <view class="edit-modal-box">
    <view class="edit-modal-header">
      <text class="edit-modal-title">🔑 审核测试专享登录</text>
      <text class="edit-modal-close" bindtap="closeTestLoginModal">✕</text>
    </view>
    <view class="edit-modal-body">
      <view class="form-row">
        <text class="form-label">测试账号</text>
        <!-- 默认 value 为空字符串，必须手动输入 -->
        <input class="form-input" placeholder="输入测试账号" value="{{testUsername}}" bindinput="onInputTestUsername" />
      </view>
      <view class="form-row">
        <text class="form-label">测试密码</text>
        <input class="form-input" password placeholder="输入测试密码" value="{{testPassword}}" bindinput="onInputTestPassword" />
      </view>
      <button class="btn-save-profile" loading="{{testLoggingIn}}" bindtap="handleTestLogin">立即登录验证</button>
    </view>
  </view>
</view>
```

即使有好奇的普通用户无意中点出了弹窗，不知道内部测试密码也无法登录。

---

## 3. 后端动态熔断开关与权限派发

在 `backend/app/routers/auth.py` 中，构建受开关控制的专用测试端点：

```python
from app.config import settings

@router.post("/auth/test_login")
def test_login(payload: Dict[str, Any] = Body(...)):
    """审核员专属测试登录通道（受动态开关控制）"""
    # 1. 核心安全防护：若全局开关关闭，直接 403 熔断！
    if not getattr(settings, "ENABLE_AUDIT_LOGIN", False):
        raise HTTPException(status_code=403, detail="审核测试通道已关闭")

    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()

    # 2. 严格核对专属提审凭据
    if username != "audit_tester" or password != "wx2026test":
        raise HTTPException(status_code=400, detail="测试账号或密码不正确")

    test_openid = "openid_audit_special_tester_2026"

    # 3. 自动派发测试资产：100 研学币、500 积分，预开通 1 年专栏 VIP 畅读
    now = datetime.datetime.now()
    exp_str = (now + datetime.timedelta(days=365)).strftime('%Y-%m-%d %H:%M:%S')

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (openid, nickname, avatar_url, balance, score, bio)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(openid) DO UPDATE SET balance = 100.0, score = 500
        ''', (test_openid, '审核测试员', '', 100.0, 500, '微信官方审核专属测试账号'))
        
        # 预先开通 1 年专栏畅读权限，供审核员深度验收全篇小节
        cursor.execute('''
            INSERT INTO purchases (openid, course_id, order_id, expire_time)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(openid, course_id) DO UPDATE SET expire_time = excluded.expire_time
        ''', (test_openid, 'douyin_short_video', 'AUDIT_PRE_PURCHASE_001', exp_str))
        conn.commit()

    token = create_access_token(test_openid)
    return {
        "code": 0,
        "data": {
            "token": token,
            "openid": test_openid,
            "nickname": "审核测试员",
            "balance": 100.0,
            "score": 500
        }
    }
```

---

## 4. 上线后的“一秒熔断”

一旦微信审核通过并正式发布版本后：
1. 登录云服务器，编辑 `.env` 文件：
   ```ini
   ENABLE_AUDIT_LOGIN=False
   ```
2. 重启 FastAPI 进程（秒级重载）。
3. 此时后端该接口永久返回 403，任何外部尝试均失效，暗门通道被彻底关闭，确保商业化运营无懈可击！

---

## 5. 本章小结

“暗门设计”巧妙地在**“平台的严苛验收要求”**与**“商业系统的防盗安全”**之间架起了一座桥梁。下一章我们将提供提交审核时直接可抄的标准填报材料，助你一次性通关。
