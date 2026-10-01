# Tushare 怎么拿数据画图？Python 金融数据零基础入门

> 短视频主题：Tushare 怎么拿数据画图？Python 金融数据零基础入门
> 资料核验与更新：2026-10-01

Tushare 可以理解成一个金融数据接口集合：程序提出问题，接口返回表格，pandas 负责整理，最后再用图表检查结论。本文面向第一次接触 Python 金融数据的成人读者，沿着视频中的一条链路，解释 Token、常见接口、DataFrame、均线、收益率和可视化各自负责什么。

文中的图均为本课程制作的 AI 辅助教学示意图，不是 Tushare、pandas 或 Matplotlib 的原始产品界面，也不代表任何数据质量、收益或投资结果承诺。

## 阅读边界

本文只讲学习、研究和回测前准备的基础工作流，不提供买卖建议。Tushare 接口的权限、积分、调用频率、字段口径和更新时间可能变化，实践时应以当前官方接口文档为准。Token 是访问凭证，不应写入公开代码或提交到公共仓库。

## 先看完整链路：问题如何变成一张图？

零基础时，不要先背一串代码。先把输入和输出想清楚：左边是一个可回答的问题，例如“某只股票最近二十日的价格趋势是什么”；中间依次经过 Token、接口和 DataFrame；右边才是折线图或其他图表。

```{figure} images/tushare/scene01_img01_overview.png
:alt: 从研究问题到 Token、Tushare API、DataFrame 和折线图的完整数据链路
:width: 100%

图：AI 辅助教学图。Tushare 负责提供接口，pandas 表格负责承接结果，图表用于检查和解释数据。
```

这条链路的优点是每一步都能解释和复查：拿不到数据时看 Token 和权限，表格异常时看字段和清洗，图形异常时回到日期和数据口径。

## Token 与 Python 连接：先拿凭证，再写程序

Token 类似访问数据的钥匙。官方文档给出的入口是登录 Tushare 后进入个人中心的账号与 Token 页面；如果刷新 Token，旧凭证会失效，所以不要把它当成普通文本随意分享。

```{figure} images/tushare/scene02_img01_token.png
:alt: 登录 Tushare 个人中心查看和复制账号 Token，并提醒不要公开分享
:width: 100%

图：AI 辅助教学图。Token 只表示访问凭证，不代表已经拥有所有接口权限。
```

实际代码更适合从环境变量读取 Token，而不是直接把密钥写进 `.py` 文件。这样做不能替代权限管理，但能减少误提交的风险。

```{figure} images/tushare/scene02_img02_python.png
:alt: Python 从环境变量读取 TUSHARE_TOKEN，再通过 ts.pro_api 连接 Tushare API
:width: 100%

图：AI 辅助教学图。画面中的 `TUSHARE_TOKEN` 是占位示意，不是真实凭证；代码名称以官方 SDK 文档为准。
```

安装、导入、设置 Token 和创建 `pro_api` 是连接阶段的四个动作。若报错与权限或积分有关，应先查看对应接口说明，不要马上把问题归咎于 Python 语法。

## 常见接口：按问题选择数据

`stock_basic` 适合回答“有哪些股票、代码是什么、属于什么行业、什么时候上市”。它更像一张基础名册，适合在研究开始时取一次并保存下来复用。

```{figure} images/tushare/scene03_img01_stock_basic.png
:alt: stock_basic 返回股票代码、名称、行业和上市日期等基础信息
:width: 100%

图：AI 辅助教学图。基础信息表的字段要结合官方接口定义理解，不要只按字段名字猜含义。
```

`daily` 适合回答“某只股票一段时间的日线行情怎样变化”。开盘、最高、最低、收盘和成交量是常见字段，日期范围决定了你看到的窗口。

```{figure} images/tushare/scene03_img02_daily.png
:alt: daily 日线行情包含开高低收、成交量和日期范围
:width: 100%

图：AI 辅助教学图。日线接口解决的是行情数据获取，不自动完成分析结论。
```

`daily_basic` 可以补充换手率、量比、市盈率和市净率等每日指标。它和 `daily` 的职责不同，是否能调用、能调用多少，仍要查看当前权限和积分规则。

```{figure} images/tushare/scene03_img03_daily_basic.png
:alt: daily_basic 提供换手率、PE、PB 等每日指标并提示权限与积分
:width: 100%

图：AI 辅助教学图。接口越多不等于分析越好，先从一个明确问题和一个合适接口开始。
```

## DataFrame：先整理证据，再计算指标

Tushare 返回的结果通常会进入 pandas `DataFrame`。可以先把它想成一张带列名的二维表：每行是一条记录，每列是一个字段。`trade_date`、`close` 和 `vol` 这样的列名，决定了后续清洗和绘图从哪里取值。

```{figure} images/tushare/scene04_img01_dataframe.png
:alt: pandas DataFrame 用 trade_date、close、vol 等列承接金融数据
:width: 100%

图：AI 辅助教学图。把表格看懂，比一开始写复杂策略更重要。
```

清洗的顺序可以很朴素：把交易日期转成日期类型，按日期排序，检查缺失值和重复行。之后再计算滚动均线和收益率，避免把乱序或缺失数据直接画成看似漂亮的图。

```{figure} images/tushare/scene04_img02_cleaning.png
:alt: 日期转换、排序、缺失值检查、rolling 二十日均线和 pct_change 收益率计算流程
:width: 100%

图：AI 辅助教学图。`rolling(20)` 是滚动二十个观察值，`pct_change` 用于观察相邻数据的百分比变化。
```

均线和收益率是分析工具，不是自动产生买卖信号的按钮。它们帮助你描述趋势和变化，不能替代数据验证、策略评测或投资判断。

## 图表：一个问题匹配一种视角

如果问题是“价格趋势是否变化”，折线图比堆满数字的表格更直观。可以把收盘价和二十日均线放在同一张图里，但要明确两条线各自代表什么。

```{figure} images/tushare/scene05_img01_line.png
:alt: 收盘价与 MA20 二十日均线的折线图用于观察价格趋势
:width: 100%

图：AI 辅助教学图。折线图更适合表达随时间变化的趋势，不等于预测未来价格。
```

如果问题变成“哪些日期成交更活跃”，成交量柱状图通常更合适。它把每个日期的数量放在同一个垂直尺度上，方便比较高低。

```{figure} images/tushare/scene05_img02_volume.png
:alt: 成交量柱状图用于比较不同日期的成交规模
:width: 100%

图：AI 辅助教学图。柱状图回答的是成交量比较问题，不应和价格趋势混成一个含义。
```

如果问题是“收益率通常落在哪个区间”，直方图能帮助观察分布；如果问题是“两个变量是否一起变化”，散点图更合适。pandas 的 `plot()` 适合快速出图，Matplotlib 适合继续控制标题、坐标轴和标注。

```{figure} images/tushare/scene05_img03_distribution.png
:alt: 收益率直方图和散点图分别观察分布与变量关系
:width: 100%

图：AI 辅助教学图。先写清楚问题，再选择图表类型，避免把所有指标塞进一张图。
```

## 适用场景与边界：数据接口不等于交易系统

Tushare 很适合学习金融数据、做研究分析、准备教学演示、制作个人看板，以及为回测准备数据。每个场景都应该保留原始数据、查询条件和处理步骤，方便以后复查。

```{figure} images/tushare/scene06_img01_usecases.png
:alt: Tushare 的研究分析、教学演示、回测前准备和个人看板使用场景
:width: 100%

图：AI 辅助教学图。四类场景共享数据准备能力，但对时效、稳定性和验证要求不同。
```

它不等于实时交易系统，也不替你完成投资判断。正式使用前至少要检查数据口径、交易日、权限限制、更新时间和自己的验证方法。

```{figure} images/tushare/scene06_img02_boundary.png
:alt: 使用 Tushare 前检查数据口径、交易日和权限限制，并强调不等于买卖信号
:width: 100%

图：AI 辅助教学图。数据能被取到，不代表结论已经被证明。
```

## 小结

可以把本课压缩成四步：先保管 Token，再选择接口；先清洗 DataFrame，再用图表验证。零基础时，先用一个明确问题和一个接口做通，再逐步增加字段和指标。代码不需要一开始就复杂，但每一步都应该能说明输入、输出和限制。

```{figure} images/tushare/scene07_img01_summary.png
:alt: 保管 Token、选择接口、清洗 DataFrame、用图验证组成四步闭环
:width: 100%

图：AI 辅助教学图。最稳的起点是一个具体问题，例如“某只股票最近二十日的价格趋势是什么”。
```

## 参考资料

- [Tushare 官方：Token 获取与管理](https://tushare.pro/document/1?doc_id=39)
- [Tushare 官方：Python SDK](https://tushare.pro/document/1?doc_id=131)
- [Tushare 官方：安装与版本](https://tushare.pro/document/1?doc_id=7)
- [Tushare 官方：股票基础信息 stock_basic](https://tushare.pro/document/1?doc_id=25)
- [Tushare 官方：日线行情 daily](https://tushare.pro/document/2?doc_id=27)
- [Tushare 官方：每日指标 daily_basic](https://tushare.pro/document/2?doc_id=32)
- [pandas 官方：DataFrame API](https://pandas.pydata.org/docs/reference/frame.html)
- [pandas 官方：可视化用户指南](https://pandas.pydata.org/docs/user_guide/visualization.html)
- [Matplotlib 官方用户指南](https://matplotlib.org/stable/users/index)
