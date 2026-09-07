# 三大主界面全栈开发与 mp-html 富文本渲染集成

微信小程序采用**双线程架构**：负责逻辑计算的 JavaScript 运行在 JSCore 线程中，负责 UI 渲染的 WXML/WXSS 运行在 Webview 线程中，两者通过系统底层桥接通信。本章详解三大主界面的工程架构与 `mp-html` 高性能富文本渲染器的集成技巧。

---

## 1. 核心页面路由与工程拓扑

在 [`miniapp/app.json`](file:///root/02project/weixinpy310sphinx_knowledge/miniapp/app.json) 中，我们定义了结构清晰的路由与 TabBar：

```json
{
  "pages": [
    "pages/index/index",         // 1. 专栏精选推荐与引导页
    "pages/catalog/catalog",     // 2. 课程阶段目录与前置订阅看板
    "pages/article/article",     // 3. 文章沉浸式富文本阅读页
    "pages/user/user",           // 4. 个人中心资产看板与服务抽屉
    "pages/feedback/feedback"    // 5. 意见反馈与技术定制工单
  ],
  "tabBar": {
    "color": "#64748b",
    "selectedColor": "#0284c7",
    "list": [
      { "pagePath": "pages/index/index", "text": "专栏精选", "iconPath": "images/tab_home.png", "selectedIconPath": "images/tab_home_active.png" },
      { "pagePath": "pages/user/user", "text": "我的研学", "iconPath": "images/tab_user.png", "selectedIconPath": "images/tab_user_active.png" }
    ]
  }
}
```

---

## 2. 核心页面设计亮点与交互心智

### 2.1 首页：留存与高转化设计
- **“添加到我的小程序”智能浮条**：在用户首次进入时，顶部展示带箭头的气泡提示：`⭐ 喜欢本知识库？点击右上角“···”添加到我的小程序`，关闭后通过本地 Storage 记录，不再打扰用户，大幅提升二级留存；
- **会员专栏特权卡片**：展示专栏副标题、核心亮点、已订阅有效天数或研学币特惠标价，点击直接跳转目录。

### 2.2 目录页：模式 A 与模式 B 的条件渲染
在 [`miniapp/pages/catalog/catalog.wxml`](file:///root/02project/weixinpy310sphinx_knowledge/miniapp/pages/catalog/catalog.wxml) 中，根据用户是否开通专栏切换不同的头部看板：
- **未开通用户（模式 A）**：展示“特惠研读”、“当前余额”以及直观的“全套4大阶段实战，前2节精选试读”特性标签，底部提供一键开通大按钮；
- **已订阅用户（模式 B）**：展示尊贵的金黄色 VIP 徽章，标注“特权有效，剩余 364 天”，给用户强烈的尊贵感与拥有感。

---

## 3. mp-html 富文本渲染器深度集成实战

Sphinx 导出的 HTML 包含丰富的 `<pre><code>`、`<table>`、`<blockquote>` 和图片标签，普通原生组件根本无法胜任。

### 3.1 引入自定义组件
在 [`pages/article/article.json`](file:///root/02project/weixinpy310sphinx_knowledge/miniapp/pages/article/article.json) 中注册：

```json
{
  "usingComponents": {
    "mp-html": "../../components/mp-html/index"
  },
  "navigationBarTitleText": "专栏研读"
}
```

### 3.2 页面渲染与特性配置
在 WXML 模板中：

```html
<view class="article-container">
  <!-- 核心标题 -->
  <view class="article-title">{{article.title}}</view>
  
  <!-- 高性能富文本渲染 -->
  <mp-html 
    content="{{article.content}}" 
    selectable="{{true}}"
    scroll-table="{{true}}"
    tag-style="{{customTagStyle}}"
    lazy-load="{{true}}"
  />
</view>
```

- `selectable="true"`：允许用户在手机长按复制技术命令与代码片段；
- `scroll-table="true"`：遇到复杂的数据对比大表格时，自动允许左右平滑滑动，防止撑破页面布局；
- `lazy-load="true"`：大图懒加载，极大节省首屏加载网络带宽。

### 3.3 移动端定制样式注入 (`tag-style`)
在 Page JS 中定义覆盖样式：

```javascript
data: {
  customTagStyle: {
    pre: 'background-color: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 8px; font-size: 13px; overflow-x: auto;',
    code: 'color: #0284c7; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace;',
    blockquote: 'border-left: 4px solid #0284c7; background-color: #f8fafc; padding: 8px 12px; color: #475569; margin: 12px 0;'
  }
}
```

代码块瞬间呈现深邃高级的深色暗黑极客风格，阅读体验直逼 Medium 与专业的技术文档站点。

---

## 4. 本章小结

清晰的页面路由分工搭配天花板级别的 `mp-html` 渲染引擎，让小程序在视觉呈现和阅读交互上达到了媲美原生 App 的专业水准。但在开发这些交互的过程中，我们遭遇了四大极其诡异的编译器与运行时深坑，下一章我们将全盘复盘这些排雷实录。
