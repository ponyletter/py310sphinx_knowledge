# 微信静默登录全流程与无感 JWT 鉴权体系

微信小程序之所以体验丝滑，其核心在于**“静默无感登录”**——用户打开小程序无需输入账号密码或短信验证码，系统即可自动识别用户身份。本章详细拆解从客户端 `wx.login` 到服务端 JWT 签发的完整闭环。

---

## 1. 微信登录底层时序全景图

微信官方为了保护用户 OpenID（用户在该小程序下的唯一标识）不被伪造，设计了**双向对称核验流程**：

```{mermaid}
sequenceDiagram
    autonumber
    actor User as 用户手机端
    participant MiniApp as 小程序前端
    participant Backend as FastAPI 后端
    participant WeChat as 微信官方服务器

    User->>MiniApp: 打开小程序
    MiniApp->>WeChat: 调用 wx.login() 获取临时 code (5分钟有效，只能用1次)
    WeChat-->>MiniApp: 返回 code
    MiniApp->>Backend: POST /api/auth/login (携带 code)
    Backend->>WeChat: GET sns/jscode2session?appid=APPID&secret=SECRET&js_code=CODE
    WeChat-->>Backend: 返回 openid 与 session_key
    Backend->>Backend: 查库/建用户，签发 JWT Token
    Backend-->>MiniApp: 返回 JWT Token
    MiniApp->>MiniApp: wx.setStorageSync 写入本地，后续请求通过 Authorization Header 携带
```

---

## 2. 后端核心鉴权实现 (FastAPI + PyJWT)

在 [`backend/app/routers/auth.py`](file:///root/02project/weixinpy310sphinx_knowledge/backend/app/routers/auth.py) 中，登录与鉴权的核心实现如下：

### 2.1 通过 code 换取 openid
```python
import requests
from fastapi import APIRouter, HTTPException, Body
from app.config import settings

def code2session(js_code: str) -> dict:
    """向微信官方网关发起 code 换取 openid 请求"""
    url = "https://api.weixin.qq.com/sns/jscode2session"
    params = {
        "appid": settings.WECHAT_APPID,
        "secret": settings.WECHAT_SECRET,
        "js_code": js_code,
        "grant_type": "authorization_code"
    }
    resp = requests.get(url, params=params, timeout=5)
    data = resp.json()
    if "errcode" in data and data["errcode"] != 0:
        raise HTTPException(status_code=400, detail=f"微信登录失败: {data.get('errmsg')}")
    return data  # 包含 openid 与 session_key
```

### 2.2 JWT Token 签发与过期时间设置
```python
import jwt
import datetime

JWT_SECRET = settings.JWT_SECRET_KEY
JWT_ALGORITHM = "HS256"

def create_access_token(openid: str, expires_days: int = 30) -> str:
    """生成 30 天免登录的高性能无状态 JWT"""
    payload = {
        "sub": openid,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=expires_days)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> str:
    """解析并校验 Token，过期或被篡改则抛出异常"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
```

---

## 3. 前端网络层封装与 401/404 自动静默重试

在移动端网络环境下，用户的本地 Token 可能会过期，或者管理员在后台重置了数据库导致用户 OpenID 在库中丢失（返回 404）。前端如果直接弹窗报错，用户体验极差。

在 [`miniapp/utils/api.js`](file:///root/02project/weixinpy310sphinx_knowledge/miniapp/utils/api.js) 中，我们设计了**自愈式拦截重试机制**：

```javascript
const app = getApp();

function request(url, options = {}, isRetry = false) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : `${app.globalData.apiBase}${url}`;
    const header = options.header || {};
    
    // 自动挂载 Authorization 请求头
    if (app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`;
    }

    wx.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      success: (res) => {
        // 当收到 401 (未授权) 或 404 (用户在库中被删除重置)，触发强制重新静默登录
        if ((res.statusCode === 401 || res.statusCode === 404) && !isRetry) {
          app.ensureLogin(true).then(() => {
            // 重新用新获得的 Token 重试原请求
            request(url, options, true).then(resolve).catch(reject);
          }).catch(reject);
          return;
        }

        if (res.data && res.data.code === 0) {
          resolve(res.data.data);
        } else {
          reject(new Error(res.data.detail || res.data.msg || '请求失败'));
        }
      },
      fail: (err) => reject(err)
    });
  });
}
```

---

## 4. 本章小结

静默登录是微信小程序与传统 Web 应用的核心差异。通过 `code2session` 换取不可篡改的 `openid`，配合 30 天有效期的 JWT，以及前端网络层的 401/404 自动自愈重试拦截器，整个系统做到了用户“零感知、零注册、永远在线”的极致流畅体验。下一章我们将解析微信用户资料与头像昵称获取规范的演进与实操。
