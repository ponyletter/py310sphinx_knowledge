# AST 与 DOM 级前 15% 试读截断算法设计

付费内容系统的核心痛点是**“防盗版”**与**“试读转化”**的博弈。如果全篇锁死不给试读，用户缺乏信任度，转化率极低；如果仅用前端 CSS 添加一层模糊遮罩，任何稍微懂一点技术的用户按下 F12 或者抓包就能白嫖全文。本章开源并讲解我们在后端落地的 **DOM 级前 15% 物理截断黑科技**。

---

## 1. 为什么必须在服务端进行物理截断？

```{mermaid}
graph TD
    UserReq[用户请求章节内容] --> Server{是否已订阅/开通VIP?}
    Server -->|是| Full[返回 100% 完整文章 HTML 源码]
    Server -->|否| Cutoff[调用 AST/DOM 截断引擎 仅提取前 15% 内容]
    Cutoff --> Banner[拼接底部渐变虚化遮罩与订阅卡片]
    Banner --> Response[返回残缺 HTML 数据流]
```

### 1.1 传统前端遮罩的致命漏洞
许多初级开发者在实现“试读”时，后端直接返回全篇 HTML，前端通过 CSS 样式加模糊效果：
```css
/* ❌ 极其危险的伪试读方案 */
.content-locked {
  filter: blur(5px);
  max-height: 500px;
  overflow: hidden;
}
```
* **破解成本**：用户只需打开浏览器控制台（Console），将 `.content-locked` 类的样式取消勾选，或者在网络抓包面板中直接查看接口返回的 JSON，即可毫无阻碍地拷贝全部付费专栏，防盗形同虚设。

### 1.2 服务端物理截断的安全性
在后端服务（FastAPI）输出响应之前，文章后半部分 85% 的字符在内存中就被彻底剔除，**网络传输流中根本不包含未解锁内容**。即使黑客反编译小程序或伪造请求，也只能拿到前 15% 的公开试读文本。

---

## 2. 截断的核心难点：保持 HTML 标签平衡

生硬地使用字符串切片（如 `content[:len(content)*0.15]`）会导致灾难性的排版崩溃：
- 如果恰好切断在 `<pre><code>` 代码块中间，会导致后续整个小程序的页面标签失衡；
- 如果切断在 `<table>` 内部，会导致表格错位甚至渲染层崩溃。

必须借助 **BeautifulSoup / HTML AST DOM 树遍历器**，以“段落（Block-level Tag）”为最小原子单位进行安全截断。

---

## 3. 试读截断引擎完整实战源码

以下为提取自生产环境 [`backend/app/parser.py`](file:///root/02project/weixinpy310sphinx_knowledge/backend/app/parser.py) 的核心截断引擎实现：

```python
import os
from bs4 import BeautifulSoup

def get_truncated_article_html(html_file_path: str, trial_ratio: float = 0.15) -> dict:
    """
    读取 Sphinx 构建的 HTML，精准截取前 trial_ratio (默认15%) 试读内容，
    自动修补标签闭合，并追加美观的渐变虚化引导卡片。
    """
    if not os.path.exists(html_file_path):
        return {"title": "文章未找到", "content": "<p>内容正在紧锣密鼓编写中...</p>"}

    with open(html_file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # 1. 提取文章正文核心区域 (适配 Furo / ReadTheDocs 主题 DOM 结构)
    article_node = soup.find('article') or soup.find('div', class_='document')
    if not article_node:
        article_node = soup.find('body')

    title = ""
    title_node = article_node.find(['h1', 'h2'])
    if title_node:
        title = title_node.get_text().strip()

    # 2. 计算文本总长度与 15% 截断阈值
    full_text = article_node.get_text()
    total_len = len(full_text)
    target_len = int(total_len * trial_ratio)

    # 3. 基于 DOM 节点进行安全截取，确保每个 HTML 标签完整闭合
    current_len = 0
    truncated_nodes = []
    
    for child in article_node.children:
        if child.name is None:
            continue
            
        truncated_nodes.append(str(child))
        current_len += len(child.get_text())
        
        # 达到 15% 试读阈值，优雅跳出
        if current_len >= target_len:
            break

    # 4. 追加高转化率的渐变虚化引导卡片
    cutoff_banner = """
    <div style="position: relative; margin-top: 24px; padding-top: 60px; text-align: center;
                background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, #f8fafc 90%);">
        <div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">
            🔒 试读已结束 · 剩余 85% 核心硬核内容待解锁
        </div>
        <div style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
            包含深度实战代码、避坑案例、架构源码解析与进阶实操手册
        </div>
        <div style="display: inline-block; padding: 8px 20px; background: #0284c7; color: #fff;
                    font-size: 13px; font-weight: 500; border-radius: 20px;">
            👑 开通专栏会员 · 全篇畅读
        </div>
    </div>
    """
    
    safe_content = "".join(truncated_nodes) + cutoff_banner

    return {
        "title": title,
        "content": safe_content,
        "is_truncated": True,
        "trial_ratio": trial_ratio
    }
```

---

## 4. 前端接收与展示效果

当普通非会员用户在微信小程序内阅读未购买章节时：
1. 后端接口将 `is_truncated: true` 与截断后的 `content` 下发；
2. 小程序前端通过 `mp-html` 渲染富文本；
3. 界面展示出精美的前 15% 逻辑铺垫，并在文末平滑呈现毛玻璃渐变遮罩与引导开通按钮；
4. 点击开通直接唤起订阅弹窗，完成商业转化的流畅闭环。

---

## 5. 本章小结

安全是商业变现的前提。通过在 Python 服务端构建 DOM 级 AST 试读截断引擎，我们既为新用户提供了“先尝后买”的优质试读体验，又在物理层面彻底锁死了数字版权。至此，第一批次规划的商业模型、微信平台、开发工具与文档知识引擎全部构建完毕！
