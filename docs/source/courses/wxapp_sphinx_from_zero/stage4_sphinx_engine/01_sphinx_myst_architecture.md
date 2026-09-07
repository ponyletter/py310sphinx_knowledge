# Sphinx 文档体系工程化与 MyST Markdown 增强

在技术内容沉淀中，单一的 Markdown 文件往往面临缺少目录树（TOC）、跨文档链接失效、代码无高亮与无法一键导出 HTML/PDF 的困境。本章讲解如何用 **Sphinx + MyST-Parser** 打造现代化工程级知识库。

---

## 1. Sphinx 文档工程标准目录结构

一个规范的 Sphinx 知识库工程结构如下：

```text
py310sphinx_knowledge/
├── docs/
│   ├── Makefile                  # Linux/macOS 一键自动化构建脚本
│   ├── make.bat                  # Windows 构建批处理文件
│   └── source/                   # 文档源码目录
│       ├── conf.py               # Sphinx 核心引擎配置文件
│       ├── index.md              # 知识库顶级总入口大纲
│       ├── _static/              # 静态资源（自定义 CSS/JS、图片）
│       └── courses/              # 专栏分类子目录
│           └── douyin_short_video/
│               ├── index.md      # 课程主页 (定义 stage 1~4 的 toctree)
│               ├── stage1/
│               └── stage2/
```

---

## 2. 核心配置文件 `conf.py` 深度解析

`conf.py` 控制着 Sphinx 的全部构建逻辑。以下是支持全量 Markdown 语法的高性能配置模板：

```python
import os
import sys

# 1. 项目基本信息
project = '创作学院知识库'
copyright = '2026, 创作工坊团队'
author = 'mykael'
release = 'v1.0.0'

# 2. 核心扩展插件加载
extensions = [
    'myst_parser',              # 赋予 Sphinx 解析现代 Markdown 的能力
    'sphinx.ext.autodoc',       # 自动生成 Python 代码文档
    'sphinx.ext.napoleon',      # 支持 Google/NumPy 风格注释
    'sphinx.ext.mathjax',       # 渲染 LaTeX 数学公式
    'sphinx_copybutton',        # 代码块一键复制按钮
]

# 3. 增强版 Markdown (MyST) 语法特性开启
myst_enable_extensions = [
    "colon_fence",              # 支持 ::: 语法书写提示警告块
    "deflist",                  # 定义列表
    "dollarmath",               # 行内 $ 和块级 $$ 数学公式
    "fieldlist",                # 字段列表
    "html_image",               # 允许直接解析 <img> 标签
    "tasklist",                 # 支持 - [x] 待办清单
]

# 4. 选用现代自适应主题 (Furo)
html_theme = 'furo'
html_static_path = ['_static']
html_css_files = ['custom.css']  # 注入移动端优化自定义样式
```

---

## 3. 多级 `toctree` 树形大纲组织规范

Sphinx 的灵魂是 `toctree`（Table of Contents Tree）。通过多层嵌套，可以将庞杂的知识体系拆解为结构严密的“知识树”：

```markdown
# 知识库顶级入口 (docs/source/index.md)

欢迎查阅创作学院官方知识库。

```{toctree}
:maxdepth: 2
:caption: 核心实战专栏

courses/douyin_short_video/index
courses/wxapp_sphinx_from_zero/index
```
```

在子课程中，再次嵌套小节的大纲树：

```markdown
# 课程总览 (courses/wxapp_sphinx_from_zero/index.md)

```{toctree}
:maxdepth: 2

stage1_commercial_and_benchmarks/index
stage2_wechat_mp_platform/index
stage3_devtools_and_setup/index
stage4_sphinx_engine/index
```
```

---

## 4. 移动端 CSS 自适应排版优化

Sphinx 默认主要针对桌面端浏览器排版。为了在手机微信内拥有原生级阅读体验，我们在 `_static/custom.css` 中注入专为移动端设计的样式补丁：

```css
/* 针对手机窄屏的核心适配规则 */
@media screen and (max-width: 768px) {
  /* 优化正文字体与舒适行高 */
  body, p, li {
    font-size: 16px !important;
    line-height: 1.75 !important;
    letter-spacing: 0.02em;
    color: #2c3e50;
  }

  /* 代码块防止撑破屏幕，开启横向平滑滚动 */
  pre, code {
    font-size: 13.5px !important;
    max-width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
    border-radius: 8px;
  }

  /* 表格自适应容器 */
  table {
    display: block;
    width: 100% !important;
    overflow-x: auto;
    border-collapse: collapse;
  }

  /* 提示警告块 (Admonition) 扁平化圆角处理 */
  .admonition {
    border-radius: 10px !important;
    padding: 12px 16px !important;
    margin: 16px 0 !important;
  }
}
```

---

## 5. 一键自动化构建验证

进入 `docs/` 目录，执行自动化构建：

```bash
make html
```

Sphinx 会在几秒钟内将所有 Markdown 源文件解析并编译为完整的静态 HTML 站点，输出至 `docs/build/html/` 目录下。该目录不仅可以在浏览器中直接预览，更将作为下一章我们试读截断引擎的底层数据源！
