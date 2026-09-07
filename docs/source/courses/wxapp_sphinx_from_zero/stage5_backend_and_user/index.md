# 第5阶段 FastAPI 资产中台与微信最新用户体系设计

微信小程序的用户体系与传统 Web 网站（账号密码/手机短信）截然不同。随着微信对个人隐私监管的演进，旧版获取头像昵称的方式已被全面废弃。本阶段手把手讲解如何基于 **FastAPI + SQLite** 构建静默登录与 JWT 鉴权体系、落地微信官方最新的头像昵称规范，并设计一套合规、高留存的研学币与积分闭环。

---

## 阶段核心课程

```{toctree}
:maxdepth: 2

01_auth_and_jwt_workflow
02_user_profile_and_avatar_evolution
03_points_token_and_growth_system
```
