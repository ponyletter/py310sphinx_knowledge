# Figma 入门：从画布到协作

> 对应短视频主题：Figma 基础介绍、基础操作、组件与组件库、原型制作、团队协作
> 资料核验与更新：2026-09-22（随视频研究记录核验）

Figma 可以先理解为一张面向产品设计的协作画布：界面对象放在画布上，页面和图层负责组织结构，组件负责复用，原型负责把静态画面连成可点击路径，评论和权限则让反馈留在文件里。对第一次接触它的人，最重要的不是先记住所有菜单，而是先看清这条关系链：**搭结构 → 复用 → 连接 → 分享迭代**。

## 阅读边界

本文面向成人零基础读者，采用稳定概念解释 Figma 的工作方式，不依赖某个版本的像素级界面位置。Figma 的菜单、权限名称以及设计—代码—AI 相关能力可能随账号、地区和版本变化；涉及新能力时，以当前账号中实际显示的选项为准。文中图片均为本课程制作的 AI 辅助教学示意图，不是 Figma 原始产品截图，也不构成对具体功能开放范围的承诺。

## 1. 先把 Figma 看成协作画布

如果只把 Figma 当成“导出图片的软件”，就会漏掉它最有价值的部分。一个想法可以进入同一个设计文件，在里面组织页面、摆放界面对象、连接原型，并让团队把反馈留在具体位置。

```{figure} images/figma_scene01_canvas_workflow.png
:alt: 想法进入 Figma 设计画布，再连接到原型、团队评论和可分享体验
:width: 100%

图：Figma 的基本工作流是从想法进入设计画布，再走向可点击原型、团队评论和可分享体验。本图为 AI 辅助教学示意图。
```

因此，Figma 的“画布”不是一张孤立的图片，而是一个可以持续更新的共同上下文。后面的组件、原型和评论都围绕同一份设计关系展开。

## 2. 打开文件，先认清三块区域

第一次打开文件时，可以先不急着做漂亮的视觉细节。先找到左侧的页面、图层和资源，中间的画布，以及右侧的设计和原型属性；这三个区域对应的是“结构—对象—属性”的基本阅读顺序。

```{figure} images/figma_scene02_editor_map.png
:alt: Figma 编辑器中的页面图层资源、画布和设计原型属性区域
:width: 100%

图：用左侧结构、中间画布、右侧属性三个区域建立 Figma 文件的第一张地图。本图为 AI 辅助教学示意图。
```

接着建立一个 Frame，也就是画面框架。可以把它理解为屏幕或设备的边界；在边界里放入文字、形状和图片，才有了第一版界面。

```{figure} images/figma_scene02_first_operations.png
:alt: 新建 Frame、放入内容、拖动画布和缩放的 Figma 基础操作顺序
:width: 100%

图：基础操作先建立边界，再放内容、移动画布和调整视野；先结构，后细节。本图为 AI 辅助教学示意图。
```

移动视野时可以按住 Space 拖动画布，用 Ctrl 加滚轮缩放。快捷键会随系统和版本有细节差异，但操作目标不变：先建立能看懂的结构，再处理样式。

## 3. 组件与组件库：把重复界面变成积木

按钮、导航和卡片经常会在多个页面反复出现。每次复制后单独修改，很快就会出现多个相似但不一致的版本。更稳定的方式是创建主组件，再在其他位置使用它的实例。

```{figure} images/figma_scene03_component_instance.png
:alt: Figma 主组件 Component 与多个实例 Instance 的复用关系
:width: 100%

图：主组件是可管理的来源，实例是放入画布的复用对象。本图为 AI 辅助教学示意图。
```

组件也不应该只是一个不能变化的“死图”。组件属性可以把文字、显示隐藏、状态等可变部分集中起来，同一个界面积木就能适应不同场景。

```{figure} images/figma_scene03_component_properties.png
:alt: 组件属性集中管理文字、显示隐藏和状态
:width: 100%

图：组件属性把可变部分集中成配置，让同一积木拥有多种状态。本图为 AI 辅助教学示意图。
```

当组件、样式和变量需要被多个文件复用时，可以把它们发布到组件库。其他文件使用库中的对象，主组件更新后，使用者可以查看并接受更新。

```{figure} images/figma_scene03_component_library.png
:alt: 组件库发布到多个文件并接受主组件更新
:width: 100%

图：组件库把复用范围从单个画布扩展到多个文件，并保留更新关系。本图为 AI 辅助教学示意图。
```

## 4. 制作原型：把静态画面连成流程

原型不是最终代码，而是先把用户路径变成可点击、可播放和可讨论的体验。最小的原型关系很简单：先选中一个热点，例如按钮，再把连接线拖到目标 Frame。

```{figure} images/figma_scene04_hotspot_connection.png
:alt: Figma 原型中的热点 Hotspot 连接到目标 Frame
:width: 100%

图：热点是触发区域，连接线把它和目标画面联系起来，点击后就能进入下一画面。本图为 AI 辅助教学示意图。
```

一个文件可以有多个 Flow，每个 Flow 有自己的起点。例如，登录、浏览和提交可以分别成为不同的演示路径，不必把所有页面硬塞成一条线。

```{figure} images/figma_scene04_flows.png
:alt: 一个 Figma 文件中的多个 Flow 流程和各自起点
:width: 100%

图：多个 Flow 可以在同一文件中分别表达不同的用户路径。本图为 AI 辅助教学示意图。
```

播放原型时，重点是验证用户是否能走通这条路径：哪里应该点击，下一步应该看到什么，反馈是否足够清楚。之后再把原型分享给团队测试和讨论。

```{figure} images/figma_scene04_play_test.png
:alt: Figma 原型播放后用于分享、测试、讨论用户路径
:width: 100%

图：原型播放把连接关系变成可分享、可测试和可讨论的用户路径。本图为 AI 辅助教学示意图。
```

## 5. 团队协作：让反馈留在文件里

协作的重点不是把截图导出后到处传，而是让文件成为共同现场。分享链接可以配合查看、编辑等权限使用；权限决定成员可以做什么，不能把权限和席位概念混为一谈。

```{figure} images/figma_scene05_permissions.png
:alt: Figma 共同文件通过查看、编辑、分享链接和权限进行协作
:width: 100%

图：共同文件连接成员和权限，分享前先确认对方需要查看还是编辑。本图为 AI 辅助教学示意图。
```

评论可以钉在画布、原型或具体区域，并通过提及同事把反馈交给明确的人。这样反馈不会脱离上下文，修改也更容易回到下一版设计。

```{figure} images/figma_scene05_comments.png
:alt: Figma 画布评论、提及同事和反馈迭代
:width: 100%

图：评论跟着设计对象保留，反馈、修改和下一版之间形成可追踪的迭代关系。本图为 AI 辅助教学示意图。
```

Figma 官方也在推进设计、代码和 AI 之间的共同上下文。这个方向值得关注，但具体能力可能按账号和版本逐步开放，因此学习时应以当前工作区实际可用的功能为准。

```{figure} images/figma_scene05_design_code_ai.png
:alt: Figma 中设计、代码和 AI 逐渐连接到共同上下文的方向示意
:width: 100%

图：设计、代码和 AI 的连接是当前官方方向示意；能力开放范围以账号和版本为准。本图为 AI 辅助教学示意图。
```

## 小结

零基础上手 Figma，可以只记住四步：

1. 用页面、Frame 和图层搭出结构。
2. 把重复界面提炼成组件，并在需要时发布到组件库。
3. 用热点、连接和 Flow 做出可点击原型。
4. 分享文件、设置权限、收集评论，再根据反馈迭代。

```{figure} images/figma_scene06_four_steps.png
:alt: Figma 从搭结构、复用组件、连接原型到分享迭代的四步路径
:width: 100%

图：一张画布，四步上手：先搭结构，再复用组件；连接原型，最后分享迭代。本图为 AI 辅助教学示意图。
```

先把关系连起来，再把细节做漂亮，这就是 Figma 入门时最有用的工作顺序。

## 参考资料

- [Figma 官方首页：协作画布、设计、代码与 AI](https://www.figma.com/)
- [Figma Design 文件导航](https://help.figma.com/hc/en-us/articles/30925881896727-FD4B-Navigate-Figma-Design-files)
- [Figma 组件属性](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)
- [Figma 组件库指南](https://help.figma.com/hc/en-us/articles/360041051154-Guide-to-libraries-in-Figma)
- [Figma 原型指南](https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma)
- [Figma 分享与权限指南](https://help.figma.com/hc/en-us/articles/1500007609322-Guide-to-sharing-and-permissions)
- [Figma：Code on the Figma Canvas](https://www.figma.com/blog/code-on-the-figma-canvas/)
