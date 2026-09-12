# 爬虫是什么？库怎么选？

> 对应短视频主题：爬虫是什么？库怎么选？  
> 资料核验与更新：2026-09-12


用黑板图解方式，简明讲解《爬虫是什么？库怎么选？》。

## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## 爬虫是什么？Python 的爬虫库怎么选？

爬虫是什么？Python 库怎么选？

先把网页想成一座有目录的图书馆。爬虫就是按规则自动取书、找信息、记下结果的程序。

![overview](images/scene01_img01_overview.png)

图解：Python 爬虫全景：从网络请求、DOM 解析到动态渲染与合规抓取的技术版图。

## 爬虫不是“读心术”

从请求到字段

它先发 HTTP 请求，再接收服务器返回的响应。网页内容通常是 HTML，程序要从这棵标签树里找到需要的字段。

页面里的链接，还能把它带到下一页。

![request](images/scene02_img01_request.png)

图解：HTTP 请求的本质：构建请求头、携带 Cookie、处理状态码与重定向。

![parse](images/scene02_img02_parse.png)

图解：数据解析与抽取：从原始 HTML/JSON 中定位标签、提取属性与结构化清洗。

![loop](images/scene02_img03_loop.png)

图解：爬虫核心循环流：URL 队列管理、请求分发、内容解析、数据持久化与去重。

## 三种轻量工具

Python 先学这三种库

urllib 是 Python 自带的标准库，适合简单请求。Requests 把 HTTP 写法变得更顺手。

Beautiful Soup 专门帮助你在 HTML 里定位和提取内容。

![urllib](images/scene03_img01_urllib.png)

图解：标准库 urllib：Python 内置开箱即用，但接口较底层且缺乏高级易用特性。

![requests](images/scene03_img02_requests.png)

图解：Requests 与 HTTPX：优雅的人性化 API、会话持久化与现代异步并发支持。

![bs4](images/scene03_img03_bs4.png)

图解：BeautifulSoup 解析器：基于 DOM 树的直观定位与容错解析最佳选择。

## 页面一复杂，工具就升级

复杂页面怎么选库？

如果要抓很多页，Scrapy 会把调度、下载、解析和保存组织成流水线。如果页面必须执行 JavaScript，Selenium 会驱动真实浏览器。

![scrapy](images/scene04_img01_scrapy.png)

图解：Scrapy 工业级爬虫框架：集成 Twisted 异步引擎、中间件机制与管道数据流。

![selenium](images/scene04_img02_selenium.png)

图解：Selenium 与 Playwright：无头浏览器驱动，彻底攻克现代 SPA 动态渲染页面。

![compare](images/scene04_img03_compare.png)

图解：Python 爬虫核心库能力对比表：在开发速度、运行性能与动态支持间权衡。

## 最后记住三件事

爬虫的边界与选择

能访问不代表可以随便抓。先看 robots.txt，再控制频率和超时，只取真正需要的数据。

把爬虫看成有礼貌的自动访客。

![ethics](images/scene05_img01_ethics.png)

图解：爬虫道德与法律合规边界：遵守 Robots 协议、严格控制请求速率、保护数据隐私。

![summary](images/scene05_img02_summary.png)

图解：爬虫技术选型决策总结：按目标网站类型（静态/接口/动态）与规模合理选型。

## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文的框架完成一次小范围验证，再根据真实反馈调整下一步。

## 参考资料

以下链接来自原始课程研究笔记；动态信息请以其当前页面为准。

- [https://en.wikipedia.org/wiki/Web_crawler](https://en.wikipedia.org/wiki/Web_crawler)
- [https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [https://docs.python.org/3.13/library/urllib.request.html](https://docs.python.org/3.13/library/urllib.request.html)
- [https://requests.readthedocs.io/en/latest/user/quickstart/](https://requests.readthedocs.io/en/latest/user/quickstart/)
- [https://beautiful-soup-4.readthedocs.io/en/latest/](https://beautiful-soup-4.readthedocs.io/en/latest/)
- [https://docs.scrapy.org/en/latest/topics/architecture.html](https://docs.scrapy.org/en/latest/topics/architecture.html)
- [https://www.selenium.dev/documentation/webdriver/](https://www.selenium.dev/documentation/webdriver/)
- [https://datatracker.ietf.org/doc/html/rfc9309](https://datatracker.ietf.org/doc/html/rfc9309)
