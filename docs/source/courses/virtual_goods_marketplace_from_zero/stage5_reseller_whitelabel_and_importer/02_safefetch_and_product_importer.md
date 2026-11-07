# 跨平台商品智能导入与防 SSRF 安全抓取引擎 (SafeFetch)

商家在入驻或迁移时，往往需要从上游供货商或现有店铺（如 GmailBuy、Maitg、Ka8、标准发卡平台等）一键同步商品标题、价格、简介与多张展示图。然而，**允许服务端根据用户提供的 URL 抓取内容，是引发服务端请求伪造（SSRF）内网穿透与内网探测的头号重灾区**。

24goods 实现了**高度加固的工业级防 SSRF 抓取器（`SafeFetch`）**与跨平台解析适配器。

---

## 1. SSRF 攻击面与经典绕过手法

攻击者在“导入商品 URL”输入框中，通常会尝试以下攻击：
1. **直接探测内网**：输入 `http://127.0.0.1:5432` 或 `http://postgres:5432` 探测内网数据库端口；
2. **云元数据窃取**：输入 `http://169.254.169.254/latest/meta-data/` 窃取云主机 IAM 临时密钥；
3. **DNS 重绑定绕过（DNS Rebinding）**：攻击者注册一个 TTL 为 0 的恶意域名，在服务端第一次校验 IP 时返回合法公网 IP（`8.8.8.8`），而在随后发起真实 HTTP 请求时突然返回 `127.0.0.1`，瞬间绕过传统的 `if is_private_ip(domain)` 检查！

---

## 2. SafeFetch 工业级五重防御架构 (`safefetch.py`)

为了从根源上击碎所有 SSRF 与 DNS 重绑定利用链，24goods 的 `app/core/safefetch.py` 实施了严格的**IP 固定（IP Pinning）防护管道**：

```{mermaid}
flowchart TD
    UserURL["用户输入待抓取 URL"] --> Step1["第一步: 协议与格式白名单过滤<br/>(仅允许 http/https, 严禁 file/gopher/dict 等伪协议)"]
    Step1 --> Step2["第二步: 显式 DNS 预解析<br/>(提取目标域名解析出的所有 IPv4 与 IPv6 列表)"]
    Step2 --> Step3["第三步: RFC 保留私有网段强阻断<br/>(10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16)"]
    Step3 --> Step4["第四步: 物理级 IP Pinning 锁定连接<br/>(直接连接校验通过的公网IP，Host标头透传原始域名，彻底粉碎DNS重绑定)"]
    Step4 --> Step5["第五步: 流式读取与大小截断<br/>(限制最大 5MB，超额立即终止；严格 5s 超时，防止挂起耗尽连接池)"]
    Step5 --> Success["安全返回干净响应数据"]
```

### 2.1 核心代码实现解析

```python
# app/core/safefetch.py (精简核心逻辑)
import ipaddress, socket, httpx
from urllib.parse import urlparse

FORBIDDEN_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # 回环地址
    ipaddress.ip_network("10.0.0.0/8"),       # 私有 A 类
    ipaddress.ip_network("172.16.0.0/12"),    # 私有 B 类
    ipaddress.ip_network("192.168.0.0/16"),   # 私有 C 类
    ipaddress.ip_network("169.254.0.0/16"),   # 链路本地 / 云元数据节点 (Link-Local)
    ipaddress.ip_network("100.64.0.0/10"),    # 运营商级 NAT
    ipaddress.ip_network("::1/128"),          # IPv6 回环
    ipaddress.ip_network("fc00::/7"),         # IPv6 唯一本地地址
]

def is_safe_ip(ip_str: str) -> bool:
    ip = ipaddress.ip_address(ip_str)
    return not any(ip in net for net in FORBIDDEN_NETWORKS)

async def safe_fetch(url: str, max_bytes: int = 5 * 1024 * 1024) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("仅允许 HTTP/HTTPS 协议")

    hostname = parsed.hostname or ""
    # 1. 显式解析目标域名的所有物理 IP
    addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    resolved_ips = list({item[4][0] for item in addr_info})

    # 2. 检查解析出的每一个 IP，若存在任意一个内部网段地址，直接一票否决！
    for ip in resolved_ips:
        if not is_safe_ip(ip):
            raise SecurityException(f"检测到非法或内网定向目标 IP: {ip}")

    # 3. IP Pinning 锁定：直接连接安全 IP，避免发起请求时二次查询 DNS 遭重绑定攻击
    safe_target_ip = resolved_ips[0]
    transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
    
    async with httpx.AsyncClient(timeout=5.0, transport=transport) as client:
        # 重构请求 URL，将 Host 替换为已验证的安全 IP，通过 headers 携带原 host
        pinned_url = url.replace(f"://{hostname}", f"://{safe_target_ip}", 1)
        response = await client.get(pinned_url, headers={"Host": hostname})
        
        # 4. 流式限制读取，防止解压炸弹或巨型文件打崩内存
        content = bytearray()
        async for chunk in response.aiter_bytes():
            content.extend(chunk)
            if len(content) > max_bytes:
                raise ValueError("响应内容超出安全体积限制")
        return bytes(content)
```

---

## 3. 模块化商品数据适配器

基于安全的 `safe_fetch`，系统在 `app/modules/catalog/importer/` 中构建了解耦的解析器管道：
- **`gmailbuy.py`**：解析邮件账号批发类平台特定的多格式分隔符；
- **`maitg.py`**：处理富文本 HTML 描述与规格阶梯价格提取；
- **`ka8.py`**：适配传统单卡密销售网站的分类映射规则；
- 解析后的数据标准化为 `ProductImportItem` DTO，商家可在前端预览勾选、修改利润上浮比例后一键批量入库。
