# AppID凭证获取与服务器安全域名白名单配置

小程序运行在微信的封闭安全沙箱中。为了防止恶意脚本外发数据，微信强制实行**“网络请求域名白名单校验机制”**。未经后台报备的域名，小程序客户端将直接拒绝连接。本章详细讲解核心凭证获取与域名合规配置。

---

## 1. 获取核心凭据：AppID 与 AppSecret

登录微信公众平台（`mp.weixin.qq.com`），左侧菜单栏点击【开发】➔【开发管理】➔【开发设置】：

```text
开发者凭据区：
├── AppID (小程序ID)     : wxef6c0e98e6****** (公开可见，客户端配置用)
└── AppSecret (小程序密钥) : 8f7**************************** (绝密！仅存服务端)
```

### 1.1 安全使用铁律
* **AppID**：可以存放在前端工程的 `project.config.json` 中，公开发布；
* **AppSecret**：**绝对不可硬编码在前端小程序代码内！**
  - AppSecret 是换取用户 OpenID 与 SessionKey 的最高权限密码，一旦泄漏，攻击者可在任何机器上伪造你小程序的用户凭据。
  - 必须妥善保存在后端服务器的 `.env` 环境变量或受保护的数据库中；
  - 建议开启【IP 白名单】保护，仅允许你的后端服务器公网 IP 调用微信接口。

---

## 2. 配置服务器合法域名白名单

在【开发设置】➔【服务器域名】板块中，点击“修改”：

```{mermaid}
graph LR
    MiniApp[微信小程序客户端] -->|wx.request| Req[request 合法域名: https://apiwx.tg-cc755.cn]
    MiniApp -->|wx.uploadFile| Up[uploadFile 合法域名: https://apiwx.tg-cc755.cn]
    MiniApp -->|wx.downloadFile| Down[downloadFile 合法域名: https://docs.tg-cc755.cn]
```

### 2.1 域名填报规范与限制
| 域名类别 | 作用范围 | 本项目配置示例 | 填报规则与避坑指南 |
| :--- | :--- | :--- | :--- |
| **request 合法域名** | 支撑 `wx.request` 发起的数据请求（登录、资料、订单） | `https://apiwx.tg-cc755.cn` | ① **协议必须是 HTTPS**，不支持 HTTP；<br>② **不能写 IP 地址**（例如 `http://123.56.xx.xx:8280` 会直接报错）；<br>③ **不能带端口号**（只能默认 443 端口）；<br>④ 域名必须具有工信部 ICP 备案号。 |
| **uploadFile 合法域名** | 用户上传头像、留言反馈附件 | `https://apiwx.tg-cc755.cn` | 通常与 API 接口域名保持一致。 |
| **downloadFile 合法域名** | 下载 Sphinx 静态构建资源、文件 | `https://docs.tg-cc755.cn` | 若有 CDN 加速或独立文档域名，须填入此处。 |

---

## 3. HTTPS 证书要求与 Nginx 反向代理配合

微信底层的网络探测器对 SSL/TLS 证书标准要求极高：
1. **协议支持**：必须支持 TLS 1.2 或 TLS 1.3；
2. **完整证书链**：不能仅配置叶子证书，必须包含中间 CA 证书链（Fullchain）；
3. **安全加密套件**：禁用已废弃的不安全加密套件（如 RC4、MD5）。

### Nginx 反向代理标准配置模板

针对国内云服务器部署 FastAPI 服务的典型 Nginx 配置如下：

```nginx
server {
    listen 80;
    server_name apiwx.tg-cc755.cn;
    # 强制将所有 HTTP 流量 301 重定向至安全 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name apiwx.tg-cc755.cn;

    # SSL 证书文件（由 Certbot/Let's Encrypt 自动颁发或腾讯云申请）
    ssl_certificate /etc/letsencrypt/live/apiwx.tg-cc755.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apiwx.tg-cc755.cn/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 反向代理转发至本地 FastAPI 异步服务端口（如 8280）
    location / {
        proxy_pass http://127.0.0.1:8280;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. 本章小结

安全域名是小程序与外界交互的生命线。确保域名经过 ICP 备案、配置完整的 SSL 证书链并报备至微信公众平台后台，你的开发版和体验版才能在真机上正常发起网络请求。下一章我们将攻克虚拟支付与隐私协议设置两大核心难点。
