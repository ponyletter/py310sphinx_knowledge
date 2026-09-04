# 环境安装指南 (Environment Setup Guide)

本文档介绍如何在 Linux (Ubuntu/Debian) 环境下安装和配置 `py310sphinx_knowledge` 环境。

---

## 1. 系统底层依赖安装 (Linux)

在构建 Sphinx 文档时，通常需要使用 `make` 工具以及图形图表解析引擎 `graphviz`（用于支持 Mermaid / 架构图 / 类图等渲染），如果系统缺失这些工具，需要先在宿主机上执行安装：

```bash
# 更新 apt 软件源并安装基础编译与图表工具
sudo apt-get update && sudo apt-get install -y \
    make \
    graphviz \
    build-essential
```

---

## 2. Conda 虚拟环境创建与配置

本项目基于 **Python 3.10** 环境。可通过以下两种方式之一完成安装与依赖还原：

### 方式 A：通过 `environment.yml` 一键还原环境（推荐）

```bash
# 使用 environment.yml 直接创建并安装所有依赖
conda env create -f environment.yml

# 激活环境
conda activate py310sphinx_knowledge
```

### 方式 B：手动创建环境并通过 `requirements.txt` 安装

```bash
# 1. 创建 Python 3.10 环境
conda create -n py310sphinx_knowledge python=3.10 -y

# 2. 激活环境
conda activate py310sphinx_knowledge

# 3. 安装依赖（支持国内镜像源加速）
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 3. 环境检验

进入环境后执行以下命令验证环境是否正常：

```bash
# 验证 Sphinx 和热重载服务器
sphinx-build --version
sphinx-autobuild --version

# 验证系统工具
make -v
dot -V
```

---

## 4. 快速使用

```bash
# 初始化 Sphinx 文档目录（首次使用）
sphinx-quickstart docs

# 启动本地实时热重载服务（浏览器访问 http://127.0.0.1:8000）
sphinx-autobuild docs/source docs/build/html --host 0.0.0.0 --port 8000
```
