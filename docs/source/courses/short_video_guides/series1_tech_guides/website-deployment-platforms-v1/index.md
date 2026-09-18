# 网站部署平台怎么选？从 Vercel 到 CloudBase 的六类平台对比

> 短视频主题：网站部署平台怎么选？从 Vercel 到 CloudBase 的六类平台对比
> 资料核验与更新：2026-09-19

选择网站部署平台，不能只看谁免费，或者谁能最快发布。先判断项目是纯静态网页、需要构建和预览的现代前端，还是还需要 API、数据库、后台任务与长期运行环境；再结合用户地区、预算上限和运维责任做决定。本文面向第一次接触部署的中文读者，用一条“店面—后厨—夜班”的比喻，把八个常见产品归纳成六类决策入口。

文中的教学图是本课程制作的 AI 辅助示意图，不是厂商原始控制台截图，也不代表厂商的性能、价格或服务承诺。它们用于解释职责边界、请求路径和选型方法。

## 阅读边界

本文依据本课程的研究笔记、课程配置和官方资料整理。免费额度、价格、可用地域、备案要求、运行时限制和产品名称都可能变化；上线前应回到对应厂商的当前官方文档和真实控制台核对。本文不替具体项目做唯一推荐，也不把“国内访问”简单等同于某个固定区域或固定套餐。

## 先判断项目形态：网页是门面，后台才是分水岭

可以先把一个网站想成一家店：网页是门面，API（应用程序编程接口）和数据库是后厨，后台任务像夜班。部署平台真正的区别，是它替你管理到哪一层，以及哪些责任仍然留在你身上。

```{figure} images/scene01_img01_deployment_map.png
:alt: 用户请求经过网页、接口、数据库和后台任务，并分流到六类部署平台
:width: 100%

图：先把项目拆成网页交付、接口运行、数据存储和后台任务，再观察平台覆盖的边界。本图为课程 AI 辅助教学示意图。
```

如果只有 HTML、CSS、JavaScript 文件，静态托管通常已经足够；如果还要登录、订单、数据库或定时任务，就必须继续看函数、容器、持久化存储和后台服务。这个判断比先比较“谁的免费额度更大”更重要。

## 第一类：纯静态托管，文件交付最简单

静态网站可以理解为已经准备好的文件。服务器不需要为每个用户临时执行复杂代码，只要把这些文件交给浏览器展示即可。博客、文档、作品集和项目主页经常属于这一类。

```{figure} images/scene02_img01_github_pages.png
:alt: GitHub Pages 从代码仓库发布 HTML CSS JavaScript 静态网站
:width: 100%

图：GitHub Pages 的核心是从仓库发布静态文件，并可绑定自定义域名；它本身不是一个通用后端运行环境。本图为课程 AI 辅助教学示意图。
```

GitHub Pages 的优点是简单、免费入口清晰，而且和 GitHub 仓库天然连接。边界也很明确：不能直接替你运行后端接口或数据库。如果项目只是文档、博客或展示页，越少的运行组件往往意味着越少的运维问题。

## 第二类：现代前端与全栈网页，重点是构建和预览

当项目使用 React、Next.js、Vue 或类似框架时，发布前通常要经历安装依赖、构建文件、生成页面和绑定域名。Vercel 与 Netlify 的优势，就在于把代码仓库、自动构建、预览地址和生产发布串起来。

```{figure} images/scene02_img02_vercel_netlify.png
:alt: Vercel 与 Netlify 连接代码仓库并自动构建现代前端项目
:width: 100%

图：Vercel 和 Netlify 更适合重视开发体验、预览部署和团队协作的前端项目。本图为课程 AI 辅助教学示意图。
```

这里的 Preview URL，也就是预览地址，可以理解为“改动上线前的临时网址”：每次提交或合并请求先生成一个可检查的版本，团队确认后再进入生产环境。

```{figure} images/scene02_img03_preview_pipeline.png
:alt: 代码提交后生成预览地址，检查后再进入生产环境
:width: 100%

图：预览环境把“写代码”和“直接影响线上用户”隔开，适合多人协作和需要回看改动的项目。本图为课程 AI 辅助教学示意图。
```

Vercel 和 Netlify 也能提供函数与数据服务，但复杂后台、常驻进程、重型计算和独立数据库通常需要额外设计或接入其他服务。因此，开发体验好不等于所有基础设施都已经包含。

## 第三类：边缘运行，Cloudflare Pages 与 Workers 要分开看

“边缘运行”指的是把部分请求处理逻辑放到更靠近用户的网络节点。它可能降低某些请求的距离，但也会带来运行时、调试方式和产品组合方面的学习成本。

```{figure} images/scene03_img01_pages_delivery.png
:alt: Cloudflare Pages 从代码仓库或直接上传发布静态网站
:width: 100%

图：Cloudflare Pages 偏向网站交付、静态资源和前端项目，也能组合 Pages Functions。本图为课程 AI 辅助教学示意图。
```

Cloudflare Pages 更像网页交付入口；Cloudflare Workers 则是更广的边缘运行平台，可以承载 API、定时任务、队列、工作流和轻量数据服务。不能把 Pages 和 Workers 当作完全相同的产品。

```{figure} images/scene03_img02_workers_edge_runtime.png
:alt: Cloudflare Workers 在边缘节点运行 API 定时任务队列和轻量数据服务
:width: 100%

图：Workers 把运行逻辑放到边缘网络，能力更宽，但产品边界和配置方式也更需要学习。本图为课程 AI 辅助教学示意图。
```

Cloudflare 的优点是全球网络和能力组合；代价是产品较多，Pages、Workers、Functions、D1、KV、R2 等概念需要逐一分清。选择它时，应该先写清楚自己要交付网页，还是要在边缘执行逻辑。

## 第四类：国内与微信生态，CloudBase 重在云服务组合

面向国内用户，访问地域、中文控制台、备案、账号体系和云产品配套都可能影响最终体验。CloudBase 提供静态托管、云函数、云数据库、云存储、身份认证和容器化应用等组合能力，尤其适合微信生态或希望在同一云环境里完成多项配置的团队。

```{figure} images/scene04_img01_cloudbase_stack.png
:alt: CloudBase 组合静态托管云函数云数据库云存储和身份认证
:width: 100%

图：CloudBase 的价值在于把多种云能力放在相近的控制边界内，减少初期拼接多个服务的工作。本图为课程 AI 辅助教学示意图。
```

不过，能力多并不意味着可以直接上线。真实项目还要核对地域、备案、费用、身份认证方式、数据库限制和具体产品的可用范围。

```{figure} images/scene04_img02_region_compliance.png
:alt: 部署到国内时核对地域备案费用和产品限制
:width: 100%

图：面向国内用户选择云服务时，地域、备案、成本和产品限制需要在部署前逐项确认。本图为课程 AI 辅助教学示意图。
```

如果项目包含小程序、微信登录或腾讯云上的其他服务，CloudBase 的生态协同可能更有吸引力；如果只是一个公开文档站，就不必为了“能力更多”而承担额外复杂度。

```{figure} images/scene04_img03_wechat_entry.png
:alt: 微信小程序和国内业务通过本地云生态连接用户与后端服务
:width: 100%

图：微信入口、业务接口和云服务组合在同一生态中协作，但仍要单独确认权限、地域和费用边界。本图为课程 AI 辅助教学示意图。
```

## 第五类：托管式通用应用平台，Render 负责更多运行组件

当项目需要 Web 服务、后台 Worker、定时任务、容器或数据库时，Render 这类通用应用平台比纯前端托管更合适。Web 服务处理外部请求，Background Worker 在后台持续处理任务，Cron 则按时间触发工作。

```{figure} images/scene05_img01_render_managed.png
:alt: Render 组合 Web Static Background Worker Cron 和 Postgres 应用服务
:width: 100%

图：Render 偏托管式应用，把常见的 Web、静态、后台和定时服务拆成可组合的运行单元。本图为课程 AI 辅助教学示意图。
```

它的优点是少操心一部分服务器配置；边界是区域、持久化磁盘、数据库、出网流量、休眠和套餐限制仍需核对。托管式不等于不需要备份、监控和成本控制。

## 第六类：区域化或模板化容器平台，Fly.io 与 Railway 更靠近运行环境

Fly.io 更强调把应用放到指定区域运行，并提供更接近底层的 Machines、网络和卷控制。它适合在意区域位置、容器运行方式或更细基础设施控制的团队。

```{figure} images/scene05_img02_fly_regions.png
:alt: Fly.io 把应用和数据卷放在选择的区域运行并强调底层控制
:width: 100%

图：Fly.io 的区域化和数据卷能力带来更多控制，同时也让备份、复制和故障恢复责任更明确地落到使用者身上。本图为课程 AI 辅助教学示意图。
```

Railway 更适合通过模板快速组合应用、数据库和其他服务，启动体验通常比较直接；但模板生成的数据库、持久化卷和安全配置，并不自动等同于完整托管。备份、灾备、监控、升级和费用观察仍然要自己负责。

```{figure} images/scene05_img03_railway_templates.png
:alt: Railway 用模板快速组合服务，但数据库备份安全和监控仍需负责
:width: 100%

图：模板降低了开始部署的门槛，却没有替项目自动完成所有生产运维。本图为课程 AI 辅助教学示意图。
```

这里可以记住一个朴素规律：运行自由度越大，责任越靠近自己。需要容器和后台任务时，不能只比较首页上的启动速度，还要把数据卷、备份、出网流量和故障恢复写进方案。

## 用五个问题做最后选择

与其背平台排名，不如按项目实际约束筛选：第一，项目是纯静态，还是需要 API 和数据库？第二，用户主要在哪里？第三，要不要常驻进程、后台任务或自定义容器？第四，预算要看请求、计算、数据库、存储和出网中的哪些部分？第五，备份、监控、升级和故障恢复由谁负责？

```{figure} images/scene06_img01_selection_tree.png
:alt: 根据项目形态用户位置后台任务运行自由度预算和运维责任选择部署平台
:width: 100%

图：选择树把平台判断还原成五个问题，而不是把某个平台宣传成适合所有项目。本图为课程 AI 辅助教学示意图。
```

可以把结论压缩成一句话：纯静态优先看 GitHub Pages；现代前端和全栈网页比较 Vercel、Netlify；边缘能力看 Cloudflare；国内和微信生态重点看 CloudBase；需要通用运行环境、后台任务或数据库时，再比较 Render、Fly.io 与 Railway。最终仍要结合真实用户地区、功能需求、成本上限和备份责任决定。

## 小结

部署平台不是单纯的“免费或收费”选择，而是项目形态、运行自由度和运维边界的组合选择。先判断网页、接口、数据和后台任务分别需要什么，再确认用户地区、成本与责任边界，平台就不容易选错。

## 参考资料

> 📌 **查阅提示**：平台能力、价格、地域和配额会变化；点击下方链接查看当前官方资料。

- [【Vercel 官方文档】部署概览](https://vercel.com/docs/deployments/overview) 与 [Functions](https://vercel.com/docs/functions)
  *说明：部署环境、预览地址、生产发布和按需运行服务端代码。*
- [【Cloudflare 官方文档】Pages](https://developers.cloudflare.com/pages/) 与 [Workers](https://developers.cloudflare.com/workers/)
  *说明：静态网站交付、边缘运行、API、定时任务、队列和数据服务的产品边界。*
- [【Netlify 官方文档】Functions](https://docs.netlify.com/build/functions/overview/)
  *说明：函数与站点构建、部署预览和临时运行环境的关系。*
- [【腾讯云 CloudBase 官方文档】静态托管快速开始](https://docs.cloudbase.net/en/hosting/quick-start) 与 [HTTP API 概览](https://docs.cloudbase.net/en/http-api/basic/overview)
  *说明：静态托管、前端构建、云函数、数据库、存储和身份认证能力。*
- [【GitHub 官方文档】GitHub Pages 是什么](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
  *说明：从仓库发布 HTML、CSS、JavaScript 静态网站。*
- [【Render 官方文档】服务类型](https://render.com/docs/service-types) 与 [Web Services](https://render.com/docs/web-services)
  *说明：Web、Static、Background Worker、Cron、Postgres 和部署配置。*
- [【Fly.io 官方文档】应用概览](https://fly.io/docs/apps/overview/) 与 [Volumes](https://fly.io/docs/volumes/overview/)
  *说明：区域化运行、Machines、数据卷和备份复制责任。*
- [【Railway 官方文档】数据库](https://docs.railway.com/databases)
  *说明：模板化数据库服务、持久化和用户侧备份安全责任。*
