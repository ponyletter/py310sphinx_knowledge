# Supabase、Vercel、GitHub 怎么搭：从代码到上线的一条小白链路

> 短视频主题：Supabase、Vercel、GitHub 怎么搭：从代码到上线的一条小白链路
> 资料核验与更新：2026-09-23

如果你第一次做网站，可以先记住一句话：GitHub 管代码版本，Vercel 管构建和发布，Supabase 管数据、登录、文件与权限。三者不是互相替代，而是把“代码—上线—后端”接成一条链路。本文面向成人零基础读者，先讲清楚每个平台是什么，再讲容量、配置、安全和选型。

文中的图均为本课程制作的 AI 辅助教学示意图，不是 Supabase、Vercel 或 GitHub 的原始界面截图，也不代表平台的性能承诺；它们用于解释角色、数据流和安全边界。

## 阅读边界

本文依据课程研究笔记、结构计划、发布文案和官方资料整理。免费套餐、上传限制、部署行为、密钥命名和产品界面可能变化，实践前应以当前官方文档和真实项目设置为准。文中的“适合小项目”是基于职责边界和上手成本的工程判断，不等于任何规模下都无需升级。

## 先讲清楚：三个平台分别做什么

把一个网站想成一家小店：GitHub 像保存每次改动的代码仓库；Vercel 像接到代码后自动打包、发布和回退的发布流水线；Supabase 像放数据、账号、图片附件并负责访问规则的后端服务。这样看，三者解决的是三个不同问题。

```{figure} images/scene01_full_stack_hook.png
:alt: GitHub、Vercel、Supabase 从代码到上线和数据服务的三方职责关系图
:width: 100%

图 1：GitHub 保存版本，Vercel 发布应用，Supabase 提供数据与后端能力。
```

第一次做项目时，不要把“部署”理解成把所有东西塞进一个平台。前端页面和 API 可以由 Vercel 发布，数据表和用户登录由 Supabase 提供，代码则统一回到 GitHub 管理。职责分开，出问题时也更容易定位。

## Supabase：先看数据库、文件和权限三层

Supabase 的核心不是一个模糊的“后端盒子”，而是几类能力组合：PostgreSQL 负责结构化数据，Storage 负责图片和附件，Data API 让应用读写数据，Auth 负责登录，RLS（Row Level Security，行级安全）负责判断某个用户能不能看或改某一行。

```{figure} images/scene02_api_auth_rls.png
:alt: Supabase 的 Data API、Auth 和 RLS 共同组成数据访问与身份权限层
:width: 100%

图 2：Supabase 把数据接口、登录和逐行权限放在同一条后端链路里。
```

对小白来说，RLS 可以先理解为“数据库门口的逐行门禁”：登录成功不代表能看所有数据，策略还可以规定“只能看自己的记录”“管理员可以看团队记录”。只要表会被浏览器或 API 访问，就要把授权规则当成正式配置，而不是最后再补的装饰。

容量问题要分成三个数字看，不能混成一句“500 MB 存储”。Free 计划的每个项目通常有 500 MB PostgreSQL database size；文件存储额度是 1 GB；Free 项目的单文件上传上限是 50 MB。数据库实际大小还包含数据、索引和物化视图等，超过边界可能进入只读状态。

```{figure} images/scene02_postgres_500mb.png
:alt: Supabase Free 项目的 PostgreSQL 数据库 500 MB 容量边界示意图
:width: 100%

图 3：500 MB 指数据库容量，不是把图片和附件也算进同一个数字。
```

因此，“50 MB PostgreSQL 数据库”是一个需要纠正的说法：50 MB 对应的是 Free 项目的单文件上传上限。数据库、文件总量、单文件限制是三个不同的抽屉，选型时要分别监控。

```{figure} images/scene02_storage_1gb_50mb.png
:alt: Supabase Storage 的 1 GB 文件存储额度与 50 MB 单文件上传上限对照图
:width: 100%

图 4：1 GB 是文件存储总额度，50 MB 是 Free 单文件上传上限。
```

一个实用的起步方式是：把头像、图片和附件放 Storage，把订单、用户资料和状态放 PostgreSQL；大文件、视频素材或长期归档不要默认塞进 Free 项目，先确认上传限制、备份方式和升级成本。

## Vercel + GitHub：推送代码后发生什么

连接 GitHub 仓库后，Vercel 可以监听分支和 Pull Request。普通分支或 PR 通常生成 Preview Deployment（预览部署），方便先看一个临时线上版本；合并到 Production Branch（生产分支）后，才更新正式生产部署。这里的“自动”指触发关系，不承诺固定几秒完成，实际速度还会受构建、依赖和队列影响。

```{figure} images/scene03_github_vercel_workflow.png
:alt: GitHub 推送代码后由 Vercel 构建并生成 Preview 或 Production 部署的流程
:width: 100%

图 5：分支推送适合预览，生产分支合并后更新正式版本，并可回退旧部署。
```

推荐的零基础流程是：先在 GitHub 建仓库，再把 Vercel 项目连接到这个仓库；日常改动走分支和 Pull Request，先检查 Preview，再合并到生产分支。这样，GitHub 保留谁改了什么，Vercel 保留每次构建和部署结果。

## 具体配置：公开变量可以公开，秘密密钥绝不能进浏览器

应用通常需要 Supabase URL 和一个给前端使用的 publishable key（可发布密钥）。它们可以通过环境变量提供给应用，但“能放在浏览器”不等于“没有安全要求”：真正的访问控制仍然依赖 Auth、数据库 grants 和 RLS。

```{figure} images/scene04_public_server_keys.png
:alt: Supabase publishable key 可用于浏览器，而 secret key 只能留在服务端的边界图
:width: 100%

图 6：浏览器只接触公开入口；高权限 secret key 和服务端连接信息必须留在服务端。
```

secret key、service role key 或服务端数据库连接字符串不能写进 `NEXT_PUBLIC_*` 变量，也不能提交到 GitHub。即使仓库是私有的，也应把密钥放进 Vercel 的环境变量设置，并在泄露后立即轮换。

Vercel 通常把环境区分为 Local、Preview、Production。不要只配置本地 `.env` 就以为线上也有同样值；预览部署和生产部署可能需要不同的数据库、回调地址或第三方密钥。

```{figure} images/scene04_vercel_envs.png
:alt: Vercel Local、Preview、Production 三套环境变量范围示意图
:width: 100%

图 7：本地、预览、生产可以使用不同配置，避免测试数据和正式数据混在一起。
```

最小配置检查清单可以这样写：确认 Supabase URL 正确；浏览器只使用 publishable key；服务端 secret 只在服务端读取；Preview 和 Production 分别检查变量；最后在 GitHub 搜索一次是否误提交密钥。

## 把三者连成闭环：代码、运行时和逐行权限

一次用户请求可能是这样的：用户访问 Vercel 上的页面，页面使用公开配置请求 Supabase；Supabase 先根据登录身份和 RLS 判断当前用户可以访问哪些行；如果需要高权限操作，则由服务端 API 使用 secret 完成，而不是把 secret 发给浏览器。

```{figure} images/scene05_supabase_rls.png
:alt: Vercel 应用请求 Supabase 后由 RLS 按用户和数据行执行授权的流程
:width: 100%

图 8：Vercel 负责运行应用，Supabase 负责数据和逐行授权，GitHub 负责版本来源。
```

这也是为什么“部署成功”不等于“安全完成”。代码能打开，只说明构建和发布通过；数据是否能被越权读取，要靠 RLS 策略、测试账号和真实请求验证。对新手，至少要测试普通用户、另一个用户和管理员三种身份。

## 怎么选：先用小项目验证，接近边界再升级

个人工具、内容站、管理后台和小型 SaaS，通常可以先用这套组合验证产品：代码放 GitHub，前端和 API 由 Vercel 发布，数据和登录由 Supabase 提供。这样初始运维工作少，能把时间花在功能和用户反馈上。

```{figure} images/scene06_upgrade_signals.png
:alt: 个人工具、内容站和小型 SaaS 从免费起步到容量与团队边界的升级信号
:width: 100%

图 9：免费起步的重点是验证需求，同时持续观察数据库、文件、构建和协作边界。
```

升级信号包括：数据库接近 500 MB；文件总量或单文件需求持续超过限制；项目需要更可靠的备份和恢复；免费项目的暂停或部署限制影响业务；团队需要更严格的分支保护、审核和环境隔离。不要等到线上故障后才第一次看额度和日志。

最后，可以用四个问题做第一轮选型：数据是表格还是大文件？权限是否需要按用户或团队隔离？部署是否需要每个 PR 都有预览？团队是否能承担更多运维？如果答案都比较简单，这套组合适合先跑起来；如果数据量、合规、长任务或高并发成为核心约束，再单独替换某一层。

```{figure} images/scene07_final_decision_tree.png
:alt: 根据项目类型、数据容量、权限和团队协作判断是否采用 Supabase、Vercel、GitHub 组合的决策树
:width: 100%

图 10：先验证产品，再根据真实的容量、权限、备份和协作信号升级，而不是一开始追求最复杂架构。
```

## 小结

把三者记成一句话：GitHub 管版本，Vercel 管发布，Supabase 管数据与权限。Supabase 的三个数字要分清：数据库 500 MB、文件存储 1 GB、Free 单文件上传 50 MB。浏览器可以使用 publishable key，但 secret key 必须留在服务端；自动部署可以加快反馈，但 RLS 和环境变量配置决定了数据是否安全。

如果你刚开始做项目，先选一个真实的小功能，用一条分支—预览—生产链路跑通，再记录数据库大小、文件使用量、构建时间、权限测试和备份需求。选型不是先宣布哪个平台最好，而是让每一层的职责和边界都能被验证。

## 参考资料

> 📌 **查阅提示**：平台套餐、限制和产品界面会更新；下方链接优先使用官方资料，实践时请以当前页面为准。

- [【Supabase 官方】Pricing](https://supabase.com/pricing)
  *说明：Free 计划的数据库、文件存储和上传限制以当前官方页面为准。*
- [【Supabase 官方】Understanding Database and Disk Size](https://supabase.com/docs/guides/platform/database-size)
  *说明：解释 PostgreSQL 实际数据库大小，以及超过 Free 边界后的行为。*
- [【Supabase 官方】Storage Upload Limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
  *说明：解释文件大小限制和 bucket 级别的边界。*
- [【Supabase 官方】Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
  *说明：介绍 RLS、grants、policies 和服务端高权限密钥的关系。*
- [【Supabase 官方】API Keys](https://supabase.com/docs/guides/getting-started/api-keys)
  *说明：区分 publishable key、secret key 和服务端使用边界。*
- [【Supabase 官方】Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
  *说明：展示 URL、公开密钥和浏览器/服务端客户端的环境变量配置。*
- [【Vercel 官方】Deploying Git Repositories](https://vercel.com/docs/git)
  *说明：介绍 Git 仓库、分支推送、预览部署、生产部署和回退。*
- [【Vercel 官方】Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)
  *说明：介绍 GitHub 分支和 Pull Request 与 Preview Deployment 的关系。*
- [【Vercel 官方】Environment Variables](https://vercel.com/docs/environment-variables)
  *说明：介绍 Local、Preview、Production 环境变量的区分。*
- [【GitHub 官方】Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
  *说明：介绍 Pull Request 审核和状态检查等生产分支保护机制。*
