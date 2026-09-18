# 3.1 雇主识别号（EIN）概述与 Form SS-4 全字段逐行填报指南

> **核心导语：** 雇主身份识别号码（EIN）是联邦税务局（IRS）为企业分配的唯一标识符，对于非美国居民创始人而言，它是开启美国商业账户（如 Mercury、Stripe 等）的必备钥匙。本节将带你全面了解 EIN，并手把手教你如何精准填写 SS-4 申请表格。

---

## 什么是 EIN？

EIN（Employer Identification Number）是联邦税号，类似于公司版本的社会安全号码（SSN）。它是美国税务局（IRS）用来识别纳税实体的九位数字。

### 为什么必须申请 EIN？

对于非美国居民注册的 怀俄明州 LLC，EIN 是不可或缺的：
- **开立银行账户**：Mercury、Relay 等美国数字银行严格要求提供 EIN 证明。
- **开通支付网关**：Stripe、PayPal 等支付处理商需要 EIN 来进行商户验证。
- **合规税务申报**：即使作为“非直接持有实体（被忽略实体（Disregarded Entity，税收穿透实体））”，每年向 IRS 提交 5472 和 1120 表格时也必须使用 EIN。

### 为什么非美国居民不能在线申请？

IRS 确实提供在线申请 EIN 的系统，但在第一步验证中，系统强制要求“责任方（Responsible Party）”提供 SSN 或 ITIN。因此，没有美国身份的国际创始人无法使用在线通道，只能通过**传真**或**邮寄**的方式提交 Form SS-4。

---

## Form SS-4 全字段填写指南 (共 18 行)

填写 SS-4 表格时必须极度仔细，任何与 公司组织章程（Articles of Organization） 不一致的地方都会导致申请被拒或延误。

```{admonition} 关键提示
:class: tip
请使用英文大写字母填写，确保清晰可读。如果使用 PDF 编辑器填写，请直接在电脑上输入后打印签名。
```

以下是逐行填写指南：

| 行号 | 字段名称 | 填写说明与示例 |
| :--- | :--- | :--- |
| **Line 1** | Legal name of entity | 必须与州政府批准的 公司组织章程（Articles of Organization） 上的名称**完全一致**。例如：`TECH GLOBAL LLC` |
| **Line 2** | Trade name of business | 留空（除非有具体的 DBA 名称）。 |
| **Line 3** | Executor, administrator | 留空。 |
| **Line 4a-4b** | Mailing address | 公司的邮寄地址。通常填写你的注册代理人（如 Northwest）提供的商业地址。 |
| **Line 5a-5b** | Street address | 如果与 4a-4b 相同，则留空。 |
| **Line 6** | County and state | 公司所在的县和州。例如：`Laramie County, WY` |
| **Line 7a** | Name of responsible party | 责任方全名。必须与你的护照拼音一致。例如：`SAN ZHANG` |
| **Line 7b** | SSN, ITIN, or EIN | **极其重要：请用大写字母填写 `FOREIGN`**。（切勿留空，也千万不要填 0） |
| **Line 8a** | Is this application for an LLC? | 勾选 `Yes`。 |
| **Line 8b** | Number of LLC members | 填写 `1`（如果你是单一成员 LLC）。 |
| **Line 8c** | LLC organized in US? | 勾选 `Yes`。 |
| **Line 9a** | Type of entity | **极其重要：勾选 `Other (specify)`，然后在后面的横线上填写 `Foreign-owned U.S. Disregarded Entity`**。 |
| **Line 9b** | State/country if corporation | 留空。 |
| **Line 10** | Reason for applying | 勾选 `Started new business (specify type)`，并在横线上简述业务，如 `E-COMMERCE` 或 `SOFTWARE DEVELOPMENT`。 |
| **Line 11** | Date business started | 填写 公司组织章程（Articles of Organization） 上的批准日期，注意美国格式：`MM/DD/YYYY`。 |
| **Line 12** | Closing month of accounting year | 填写 `December`（通常以 12 月作为自然财年结束）。 |
| **Line 13** | Highest number of employees | 全部填写 `0`（Agricultural/Household/Other）。 |
| **Line 14** | Do you expect employment tax? | 勾选 `No`。 |
| **Line 15** | First date wages paid | 留空。 |
| **Line 16** | Principal activity | 选择最接近的一项，如 `Other (specify)`，填写具体内容，例如 `ONLINE RETAIL`。 |
| **Line 17** | Indicate principal line of mdse | 简要描述销售的商品或服务。 |
| **Line 18** | Has applicant ever applied? | 勾选 `No`（如果该公司从未申请过 EIN）。 |

### 第三方委托 (Third Party Designee)

如果你打算在 Fiverr 上找代办人（后续章节会详细说明），你需要填写这一部分，授权他们代表你向 IRS 沟通并接收 EIN。如果是 DIY 申请，留空。

### 签名区

在表格最下方：
- **Name and title**：打印你的名字和头衔（如 `SAN ZHANG, MANAGING MEMBER`）。
- **Signature**：**必须手写签名**（可以用 iPad 电子笔手写后合并，或打印手写后扫描）。
- **Applicant's telephone number**：填入你的联系电话（加国家号，如 `+86...`）。
- **Applicant's fax number**：填入用来接收 EIN 的传真号码。

---

```{admonition} 避坑警告
:class: warning
Line 7b 的 `FOREIGN` 和 Line 9a 的 `Foreign-owned U.S. Disregarded Entity` 是区分非美国居民 LLC 的核心标识，千万不能填错！
```
