# AI 接口 HTTPS 证书怎么选与自动续期？

> 对应短视频主题：AI 接口 HTTPS 证书如何选择与自动续期？
> 资料核验与更新：2026-09-14

给 AI 接口、小程序或网页配置 HTTPS 时，最容易踩的坑不是“有没有加密”，而是证书到底由谁看、证书链是否完整，以及续期后服务是否真的加载了新证书。本页把视频中的判断过程整理成一条零基础也能跟上的路线：先确认访问路径，再选择证书，最后完成自动续期、部署和验证。

> 配图说明：本文图片为本课程 AI 辅助绘制的教学插图，不是厂商原始截图或官方图表；图中标签用于解释关系，具体平台行为以参考资料和实际环境为准。

## 阅读边界

本文讨论公开访问的 AI 接口、网页和微信小程序后台的服务器证书选择，不展开企业内部 CA、客户端证书（mTLS）、证书透明度策略或复杂的多级负载均衡。示例默认使用域名访问，服务器支持 TLS 1.2 及以上，并且管理员能够操作 DNS、Web 服务和证书部署目录。

## 先看访问路径，再选证书

证书不是只看“还能用多少天”。先问一个问题：客户端会直接看到源站，还是所有请求都先经过 Cloudflare？如果客户端直接连接源站，就需要浏览器、微信小程序、命令行工具都能信任的公共证书；如果域名始终走 Cloudflare 代理，源站还需要一张让 Cloudflare 信任的证书。

```{figure} images/scene01_img01_path_choice.png
:alt: 访问路径分成 Cloudflare 边缘到源站和客户端直接到源站两条路线，并分别指向不同证书选择
:width: 100%

AI 辅助教学插图：证书选择首先由实际访问路径决定。
```

这样理解可以避免一个常见误区：有效期很长，不代表所有客户端都信任；能加密 Cloudflare 到源站的证书，也不一定能让普通客户端直接访问源站。

## 微信小程序为什么更严格

微信小程序访问后台时，服务器域名需要先在平台后台配置，接口地址使用 HTTPS，不能把公网 IP 或未备案域名当作长期生产入口。客户端还会检查证书是否有效、域名是否匹配、系统是否信任证书链，以及服务端是否支持合适的 TLS 版本。

```{figure} images/scene02_img01_mini_program_domain.png
:alt: 微信小程序通过已配置的 HTTPS 服务器域名访问 AI 接口，公网 IP 和未配置域名被排除在外
:width: 100%

AI 辅助教学插图：小程序访问接口前，域名和 HTTPS 都是平台约束的一部分。
```

证书链可以把它想成“信任接力”：服务器发出站点证书和必要的中间证书，客户端再沿着链找到自己信任的根证书。只部署站点证书、漏掉中间证书时，有些浏览器看似正常，换到手机或小程序环境却可能失败。

```{figure} images/scene02_img02_trust_chain_tls.png
:alt: 客户端沿站点证书、中间证书和根证书建立信任链，并检查域名和 TLS 版本
:width: 100%

AI 辅助教学插图：HTTPS 连接不只检查加密，还要检查域名、证书链和 TLS 版本。
```

因此，开发者工具里临时关闭“跳过域名校验”只能帮助调试，不能证明真实手机和正式版本一定能访问。

## Cloudflare Origin CA 的适用边界

Cloudflare Origin CA 证书的定位很明确：加密 Cloudflare 边缘节点到源站这一段连接。只要 DNS 代理保持开启，并且 Cloudflare 的 SSL/TLS 模式使用 Full（strict），它可以成为源站证书的便捷选择。

```{figure} images/scene03_img01_cloudflare_origin.png
:alt: Cloudflare 边缘节点使用 Origin CA 证书与源站建立加密连接，客户端先连接 Cloudflare
:width: 100%

AI 辅助教学插图：Origin CA 主要服务于 Cloudflare 到源站的链路。
```

它的边界也同样重要：Origin CA 不是面向普通浏览器和微信小程序直接访问源站的公共信任证书。如果暂停代理、改成 DNS 直连或让客户端绕过 Cloudflare，客户端可能出现不信任提示。

```{figure} images/scene03_img02_direct_client_warning.png
:alt: 客户端绕过 Cloudflare 直接访问源站时，Origin CA 证书可能触发不受信任提示
:width: 100%

AI 辅助教学插图：一旦访问路径改变，原本适用的 Origin CA 方案也可能失效。
```

还要记住，Origin CA 到期目前不会替你发送到期提醒。即使证书有效期较长，也应该把证书名称、覆盖域名、到期时间和负责人放进自己的清单和监控。

## 公共证书与 ACME 自动续期

如果接口要被浏览器、微信小程序、命令行工具和其他系统直接信任，通常选择 Let’s Encrypt 等公共证书，并交给支持 ACME 协议的工具自动完成验证、签发和续期。ACME 的核心思想是：工具证明你控制这个域名，证书机构再签发证书。

```{figure} images/scene04_img01_acme_flow.png
:alt: ACME 客户端提交域名申请，完成控制权验证后获得公共 HTTPS 证书并进入自动续期流程
:width: 100%

AI 辅助教学插图：ACME 把域名验证、签发和续期串成自动化流程。
```

最常见的两种验证方式各有适用场景。HTTP-01 要求验证文件能从域名的 80 端口访问；DNS-01 则要求在 `_acme-challenge` 下发布 TXT 记录，适合无法开放 80 端口、需要通配符证书或希望通过 DNS 服务商 API 自动化的场景。

```{figure} images/scene04_img02_http01_dns01.png
:alt: HTTP-01 通过 80 端口的验证文件证明域名控制权，DNS-01 通过 _acme-challenge TXT 记录完成验证
:width: 100%

AI 辅助教学插图：HTTP 文件验证和 DNS 记录验证是两条不同的域名控制权证明路径。
```

以 acme.sh 为例，生产部署时不要直接把它的内部工作目录当作 Web 服务读取的证书路径。更稳妥的做法是用安装命令把证书复制到固定目录，并在续期成功后执行 Nginx、Caddy 或其他 Web 服务的平滑加载。

```{figure} images/scene04_img03_renew_reload.png
:alt: 证书续期成功后复制到固定部署目录，再触发 Web 服务平滑加载并进入下一轮监控
:width: 100%

AI 辅助教学插图：自动续期只有完成部署和重新加载，线上服务才真正使用新证书。
```

## 部署路径与私钥保护

证书文件和私钥的职责不同：证书可以交给服务读取，私钥必须限制权限，不能提交到 Git，也不要通过聊天记录或日志传播。把生产路径固定下来，可以让服务配置、备份、权限和监控各自有明确对象。

```{figure} images/scene05_img01_fixed_deploy_path.png
:alt: 公共证书、私钥和中间证书被部署到固定系统目录，并由 Web 服务按权限读取
:width: 100%

AI 辅助教学插图：固定部署目录让证书更新、服务配置和权限管理更可控。
```

续期钩子至少要验证三件事：新证书已经写入固定位置，服务已经重新加载，外部访问已经拿到新证书。任何一步缺失，都可能出现“文件更新了但线上仍是旧证书”。

## 验证：从文件到真实客户端

验证不要只看证书文件的修改时间。可以用 `openssl s_client` 检查主题、链和握手细节，用 `curl` 检查实际域名响应，并确认访问时带上正确的 SNI 主机名。命令行成功后，再回到微信开发者工具、体验版和真实手机分别测试。

```{figure} images/scene06_img01_openssl_curl.png
:alt: 运维人员使用 openssl 和 curl 检查 HTTPS 握手、证书有效期、证书链和实际响应
:width: 100%

AI 辅助教学插图：命令行验证关注证书细节和线上实际响应，而不是只看本地文件。
```

检查结果至少应覆盖域名匹配、有效期、完整链、TLS 版本和 HTTP 响应；如果是多层代理，还要确认检查到的是预期那一层证书。

```{figure} images/scene06_img02_chain_hostname.png
:alt: HTTPS 验证清单包含域名匹配、有效期、完整证书链和 TLS 版本四项检查
:width: 100%

AI 辅助教学插图：证书核验是多个条件同时成立，而不是只看一个绿色锁标志。
```

最后关闭开发工具中的跳过校验选项，分别测试开发版、体验版和真实手机。这样才能把本机缓存、代理差异、平台域名白名单和真实证书链问题区分开。

```{figure} images/scene06_img03_wechat_real_test.png
:alt: 微信小程序在关闭跳过域名校验后，依次进行开发版、体验版和真实手机测试
:width: 100%

AI 辅助教学插图：最终验证必须覆盖真实客户端，而不只是在开发环境中通过。
```

## 小结

可以用下面的最小决策法记忆：

1. 始终经过 Cloudflare 代理：考虑 Origin CA，并使用 Full（strict），同时自行监控到期时间。
2. 客户端可能直连源站：选择 Let’s Encrypt 等公共证书，用 ACME 和 HTTP-01 或 DNS-01 自动续期。
3. 任何方案都要固定部署路径、保护私钥、续期后平滑加载，并用 `openssl`、`curl` 和真实微信环境验证。

一句话总结：Origin CA 解决 Cloudflare 到源站的信任，公共 ACME 证书解决客户端普遍信任；可靠性来自“选对访问路径 + 自动部署 + 到期监控 + 真实验证”的完整闭环。

## 参考资料

- [腾讯云：微信小程序服务器域名配置与 HTTPS 要求](https://intl.cloud.tencent.com/zh/document/product/1219/61745)
- [Cloudflare：Origin CA certificates](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
- [Cloudflare：Full (strict) SSL/TLS mode](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
- [Let’s Encrypt：Challenge Types](https://letsencrypt.org/docs/challenge-types/)
- [RFC 8555：Automatic Certificate Management Environment (ACME)](https://datatracker.ietf.org/doc/html/rfc8555.html)
- [acme.sh 官方项目](https://github.com/acmesh-official/acme.sh)
- [curl 官方文档](https://curl.se/docs/manpage.html)
