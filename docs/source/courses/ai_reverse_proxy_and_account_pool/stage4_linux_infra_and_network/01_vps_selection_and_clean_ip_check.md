# 01. 海外 VPS 选型精要与 IP 纯净度检测实操

为反向代理选择 VPS 时，不能单纯只看 CPU 核心数和内存大小，**核心指标是 IP 的纯净度与地理位置合规性**。

---

## 一、海外机房地域选型推荐

```{mermaid}
flowchart LR
    subgraph Regions["推荐首选节点"]
        US["🇺🇸 美国西海岸 (硅谷/洛杉矶)\n网络带宽充裕，对OpenAI原生支持最好"]
        SG["🇸🇬 新加坡 / 🇯🇵 日本东京\n亚太低延迟，兼顾国内中转与海外调用"]
        EU["🇩🇪 德国法兰克福\n欧洲合规枢纽，抗滥用风控能力稳定"]
    end
```

| 地区与线路 | 核心优势 | 潜在短板 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **美国西海岸 (洛杉矶/西雅图)** | 官方主服务器所在地，OpenAI 各类新功能（如全新图片模型）首发覆盖。 | 国内直接连接物理延迟偏高（约 150~180ms）。 | ⭐️ **号池反代首选主力机**。 |
| **日本东京 / 新加坡** | 对国内生产服务器延迟低（约 50~80ms），API 交互敏捷。 | 部分机房 IP 容易被滥用爬虫污染，需仔细甄别。 | 适合作为中继分发节点。 |

---

## 二、原生 IP (Native IP) vs 广播 IP (Broadcast IP)

- **原生 IP**：IP 地址在 WHOIS 数据库中的注册注册地、所属自治域（ASN）与机房物理机架地理位置 100% 严格一致。风控通过率最高。
- **广播 IP**：机房通过 BGP 协议将注册在其他国家或地区的 IP 段强行广播到当前机房。此类 IP 常被 Cloudflare 和 OpenAI 的风控雷达标记为“异常漫游”，极易触发人机验证或直接抛出 `Access Denied 403`。

---

## 三、生产实用体检：一键网络与解锁检测脚本

在购买海外 VPS 后的第一时间内，务必登录终端运行以下专业体检脚本：

### 1. OpenAI 接口原生解锁检测
```bash
# 快速检测当前 VPS 是否能够直接连通 OpenAI 鉴权服务
curl -s -o /dev/null -w "%{http_code}\n" https://auth0.openai.com/
# 若返回 200 或 403，说明路由可达；若直接卡死超时 (000)，说明受到阻断

# 详细测试 OpenAI 网页与 CDN 连通性
bash <(curl -sL https://github.com/missuo/OpenAI-Checker/raw/main/openai.sh)
```
- **健康标准**：输出应显示 `Yes (Supported)`，支持直接向 ChatGPT 发起请求。

### 2. IP 欺诈分与类型检测
```bash
# 查询当前 VPS 的出口 IP 详情
curl -s https://ipinfo.io/json | python3 -m json.tool
```
- 检查返回结果中的 `org`（运营商）、`country`（国家代码）是否正确。
- 登录 [Scamalytics 欺诈分查询官网](https://scamalytics.com/)，输入该 IP：
  - **Fraud Score < 15**：极佳原生纯净 IP；
  - **Fraud Score 15~40**：良好；
  - **Fraud Score > 60**：高危脏 IP，建议立即联系服务商更换 IP 或退款。
