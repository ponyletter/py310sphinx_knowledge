# 微信官方权威资料库、核心接口直达与合规速查全景图

在微信小程序的全栈开发与商业化落地过程中，切忌依赖二手博客或陈旧教程。微信生态的接口协议、版本规范和审核规则每月都在动态更新，**紧跟官方第一手文档**是保证产品不踩坑、不卡审的核心底线。

本章系统梳理全网最权威、最核心的**微信官方权威技术文档、接口索引与合规直达导航**，供开发和提审时随时检索查阅。

---

## 1. 微信运营规范与审核驳回判定权威信源

| 官方权威文档 | 核心查阅要点与适用场景 | 官方直达链接 |
| :--- | :--- | :--- |
| **《微信小程序平台运营规范》** | 平台行为红线、诱导分享处罚、过度营销限制、用户权益保障准则。 | [点击直达官方规范](https://developers.weixin.qq.com/miniprogram/product/service/) |
| **《微信小程序平台运营规范常见拒绝情形》** | **【必读提审宝典】**：详述 3.2 页面内容规范、3.4 隐私收集红线、类目不符等被拒最高发条款。 | [常见拒绝情形直达](https://developers.weixin.qq.com/miniprogram/product/reject.html#_3-2-%E5%B0%8F%E7%A8%8B%E5%BA%8F%E9%A1%B5%E9%9D%A2%E5%86%85%E5%AE%B9%E5%AE%A1%E6%A0%B8%E8%A7%84%E8%8C%83) |
| **《服务类目与资质要求一览表》** | 个人主体允许开通的全部免资质类目（如【工具-图片处理】）、企业主体专属资质清单。 | [类目资质一览表](https://developers.weixin.qq.com/miniprogram/product/material/) |
| **《小程序信用分运营规则》** | 小程序信用分扣减机制、违规限流与申诉恢复通道。 | [信用分规则直达](https://developers.weixin.qq.com/miniprogram/product/credit.html) |

---

## 2. 内容安全 API 官方开发指南与接口手册

微信对 UGC（用户自行生成内容）的发布实施强制内容安全过滤，必须在服务端集成以下两大原生 API：

### 2.1 文本内容安全：`security.msgSecCheck`
* **官方权威文档**：[msgSecCheck 官方接口文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.msgSecCheck.html)
* **接口功能**：检查一段文本是否含有违法违规、涉政、涉黄、暴恐或广告垃圾信息；
* **接口版本**：推荐采用 `version=2` 的同步检测机制，入参包含 `openid`、`scene`（场景值）、`content`；
* **核心返回值**：
  - `result.suggest == "pass"`：合规通过；
  - `result.suggest == "risky"` / `errcode == 87014`：命中敏感内容违规拦截；
* **提审合规文案强制要求**：
  - 客户端弹窗或 Toast **仅需提示“所发布内容含违规信息即可”**，严禁展示敏感词具体内容或返回底层堆栈。

### 2.2 多媒体/图片内容安全：`security.mediaCheckAsync`
* **官方权威文档**：[mediaCheckAsync 官方接口文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.mediaCheckAsync.html)
* **接口功能**：对用户上传的头像、照片、Canvas 涂鸦生成的图片、以及最终渲染的动图执行异步视觉内容安全检测；
* **回调处理**：微信服务端将在数秒内通过 Webhook 回调推送检测结果至开发者的服务端接入 URL。

---

## 3. 微信开放能力、场景值与原生组件

### 3.1 微信小程序官方场景值清单
* **官方权威文档**：[小程序场景值全景列表](https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html)
* **核心高频商业化场景值**：
  - **`1173`**：**聊天素材打开小程序**（用户在单聊或群聊长按图片/素材，点击“使用小程序打开”）；
  - **`1007`**：单聊会话中点击用户分享的卡片；
  - **`1008`**：群聊会话中点击用户分享的卡片；
  - **`1089`**：微信微信下拉聊天顶部的「我的小程序」列表打开；
  - **`1001`**：发现栏小程序主入口打开。

### 3.2 聊天素材原生支持配置：`supportedMaterials`
* 在 `app.json` 中配置原生素材支持协议，向微信注册可被长按打开的文件类型：
  ```json
  "supportedMaterials": [
    {
      "materialType": "image",
      "name": "制作动态表情包",
      "path": "pages/index/index"
    }
  ]
  ```

### 3.3 原生免资质客服组件
* **官方组件文档**：[Button 组件开放能力 open-type="contact"](https://developers.weixin.qq.com/miniprogram/dev/component/button.html)
* **合规价值**：个人主体无资质开设论坛或留言板，使用原生 `<button open-type="contact">` 可以实现 100% 官方合规的单向客服通道，直接打通微信电脑端客服工作台（`mpkf.weixin.qq.com`）。

---

## 4. 微信虚拟支付 2.0 (XPay) 官方文档

| 资料名称 | 核心内容 | 官方直达链接 |
| :--- | :--- | :--- |
| **《个人主体虚拟支付接入指引》** | 个人开发者快速开通小额道具直购、研学支持与微信代收代付通道。 | [个人主体接入指引](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/business-capabilities/virtual-payment/person.html) |
| **《小程序虚拟支付 2.0 开发者文档》** | 米大师支付签名算法（paySig / signature）、发货 Webhook 通知规范。 | [虚拟支付 2.0 官方文档](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/business-capabilities/virtual-payment/virtual-payment-about.html) |
| **《米大师商户管理平台》** | 现网/沙箱 OfferId 管理、AppKey 重置、结算银行卡流水核对。 | [米大师商户平台](https://midas.qq.com/) |

---

## 5. 用户隐私保护指引与接口合规声明

自微信 2023 年下半年强制实行《小程序用户隐私保护指引》以来，任何涉及剪贴板、位置、相机、相册读取的 API 都必须前置授权：

* **官方权威指南**：[小程序用户隐私保护指引开发者指引](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/)
* **必须在后台填报并生效的常见 API**：
  - `wx.chooseMedia` / `wx.chooseImage`：收集用户相册或相机图片；
  - `wx.saveImageToPhotosAlbum`：将生成的动态表情包保存至系统相册；
  - `wx.setClipboardData` / `wx.getClipboardData`：复制/读取邀请码与兑换码；
* **接口唤起前置验证**：
  在客户端调用上述 API 前，推荐监听 `wx.onNeedPrivacyAuthorization` 并弹出原生隐私授权弹窗，确保无缝兼容微信各端基础库。

---

## 6. 本章小结

收藏并熟读本章列出的第一手官方规范，不仅能让你在产品架构阶段就牢牢锁定“合规安全港”，更能在版本提审被拒时，直接援引官方条款与审核团队进行有据有节的沟通申诉，实现产品的高效迭代与长期稳定变现。
