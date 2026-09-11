# Conda 隔离环境、服务端部署与 Git 协同流

全栈开发的核心要求是**“环境一致性”**与**“版本协同”**。如果本地能跑而后端报错，或者代码版本混乱，会带来巨大的排错消耗。本章详解基于 Miniconda 的 Python 3.10 隔离环境构建、FastAPI 生产启动与 Git 双端协同工作流。

---

## 1. Conda 隔离环境构建与依赖锁定

在 Linux 服务器（如 Ubuntu/CentOS/Debian）上，系统自带的 Python 往往被系统组件依赖，随意安装第三方库极易导致系统崩溃。必须使用 Conda 创建专用的沙箱隔离环境：

```bash
# 1. 创建名为 py310sphinx_knowledge 的 Python 3.10 纯净环境
conda create -n py310sphinx_knowledge python=3.10 -y

# 2. 激活环境
conda activate py310sphinx_knowledge

# 3. 安装后端核心基础依赖
pip install fastapi uvicorn[standard] pyjwt requests pydantic python-multipart
pip install sphinx myst-parser furo beautifulsoup4
```

### 1.1 依赖清单持久化 (`requirements.txt`)
在工程根目录下生成标准的依赖锁：

```text
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pyjwt>=2.8.0
requests>=2.31.0
pydantic>=2.4.0
python-multipart>=0.0.6
sphinx>=7.2.0
myst-parser>=2.0.0
furo>=2023.9.10
beautifulsoup4>=4.12.0
```

任何新环境只需执行 `pip install -r requirements.txt` 即可 100% 还原依赖生态。

---

## 2. 后端服务端口规划与 tmux 进程守护

在生产环境中，我们将不同功能的微服务分配到独立的高位端口，避免端口冲突：

```text
生产端口规划拓扑：
├── 8280 端口 : FastAPI 异步接口集群 (提供用户、资产、鉴权、订单数据)
├── 8269 端口 : Sphinx 文档静态 HTTP 预览服务
└── 443  端口 : Nginx 统一对外入口 (负责 SSL 卸载并反向代理转发至 8280/8269)
```

### 2.1 使用 tmux 实现 7x24 小时后台持久化运行
使用 SSH 远程连接服务器时，一旦断开终端，前台进程就会被系统自动杀死。使用 `tmux` 可以创建持久守护会话：

```bash
# 创建并进入名为 weixin_api 的后台会话
tmux new-session -s weixin_api

# 启动高并发 FastAPI 生产实例 (2个 Worker 进程，监听 8280)
/root/miniconda3/envs/py310sphinx_knowledge/bin/uvicorn backend.app.main:app \
  --host 0.0.0.0 \
  --port 8280 \
  --workers 2

# 按下快捷键 Ctrl+B 然后按 D 退出会话（服务在后台平稳运行）
```

---

## 3. Git 双端版本协同流（开发者工具 vs 云服务器）

前端小程序与后端 API 的发布周期存在根本差异：
- **前端代码**：每一次改动，都需要在微信公众平台重新提交审核，审核耗时数小时到数天；
- **后端代码**：只要部署在服务器上，一旦重启秒级生效，**无需微信审核**！

```{mermaid}
graph LR
    Dev[微信开发者工具 本地编码] -->|Git Commit & Push| GitHub[GitHub 远程主仓库 main]
    GitHub -->|Git Pull| Server[国内生产服务器 YOUR_SERVER_IP]
    Server -->|平滑重载| Backend[FastAPI 接口秒级生效]
    Dev -->|工具内点击上传| MPAdmin[微信公众平台 提审上线]
```

### 3.1 微信开发者工具内置 Git 的妙用
在开发者工具右上角点击 **【版本管理】(Version Management)**：
1. **工作区状态可视化**：所有改动的文件以差异对比（Diff）清晰列出；
2. **快捷提交**：填写 Commit 描述直接提交至本地暂存；
3. **拉取与推送**：点击工具栏的“抓取”和“推送”，无缝与 GitHub / Gitee 云端仓库同步，彻底告别繁琐的命令行操作。

---

## 4. 本章小结

建立了标准化的 Conda 隔离环境、清晰的高位端口划分与顺畅的 Git 协作流，我们就为整个知识库系统打下了坚固的底层工程骨架。从下一阶段开始，我们将正式进入核心研发——用 Sphinx 打造高颜值文档，并用 AST 算法实现前 15% 试读截断！
