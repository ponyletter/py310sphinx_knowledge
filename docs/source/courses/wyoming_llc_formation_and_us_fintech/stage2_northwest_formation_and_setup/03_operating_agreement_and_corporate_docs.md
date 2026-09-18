# 2.3 公司运营协议（Operating Agreement）解读与核心法定文件归档

> **核心导语：** 恭喜你拿到了 LLC 的注册文件！但在你去申请税号（EIN）或去银行开户之前，有一份必须由你亲自签署并妥善保管的核心法律文件——公司运营协议（Operating Agreement）（运营协议）。没有它，没有任何一家银行会给你开户。

---

## 什么是 公司运营协议（Operating Agreement） (运营协议)？

公司运营协议（Operating Agreement） 是定义你的 LLC 如何运营、所有权归属以及财务管理规则的内部合同。

**重要认知：**
- **它不需要提交给州政府**。这是你的内部商业文件。
- **它是极其关键的法律凭证**。当你去 Mercury、Relay 或 Stripe 开户时，这是证明“你拥有这家公司且有权开户”的唯一凭证。
- **它是资产保护的基础**。如前所述，它是维持 LLC “公司面纱”以实现个人与公司债务隔离的核心。

---

## 核心文件层级与作用图

了解你手里的文件分别扮演什么角色：

```{mermaid}
flowchart TD
    State[怀俄明州政府签发] --> AO["Articles of Organization<br/>(组织条款 - 公司出生证明)"]
    
    Internal[公司内部生成文件] --> OA["Operating Agreement<br/>(运营协议 - 规则与所有权)"]
    Internal --> IR["Initial Resolution<br/>(初始决议 - 授权与开户权)"]
    
    AO --> Bank["银行开户 & Stripe 申请"]
    OA --> Bank
    IR --> Bank
    
    classDef state fill:#e3f2fd,stroke:#2196f3;
    classDef internal fill:#f3e5f5,stroke:#9c27b0;
    classDef action fill:#e8f5e9,stroke:#4caf50;
    
    State:::state
    AO:::state
    Internal:::internal
    OA:::internal
    IR:::internal
    Bank:::action
```

---

## 运营协议审查与签署要点

如果你使用的是 Northwest 提供的默认模板，请重点检查并填写以下部分：

1. **Member / Ownership Percentage (所有权比例)**：
   - 确保写着你的名字（拼音），并且所有权比例为 **100%**。
2. **Capital Contribution (初始出资)**：
   - 填入一个合理的初始金额（比如 \$1,000 或 \$100）。这笔钱后续应该从你的个人账户转入你的 Mercury 商业账户中，作为公司的启动资金。
3. **Management (管理权)**：
   - 确认是 **Member-Managed**。
4. **签字 (Signature)**：
   - 打印出来，用黑色水笔签上你护照上的拼音拼写，并签署日期。然后**扫描存为 PDF**。

```{admonition} 电子签名可用吗？
:class: note
对于开银行账户，通常可以使用标准字体生成的电子签名（如 DocuSign），但为了避免某些严格合规审查的麻烦，强烈建议**手写签名后扫描**。
```

---

## 股东初始决议（Initial Resolution） (初始决议案)

这是 Northwest 随附的另一份重要文件。它通常声明了两件事：
1. 谁被正式任命为公司的成员/经理。
2. 授权该成员/经理去任何银行开立商业账户。

同样，请在上面手写签名并扫描归档。

---

## 建立公司的云端档案库

建议在 Google Drive、Dropbox 或 OneDrive 中建立一个专门的公司档案夹，结构如下：

```text
📁 NovaTech LLC_Corporate_Docs/
  ├── 📄 01_Articles_of_Organization.pdf (州政府盖章件)
  ├── 📄 02_Operating_Agreement_Signed.pdf (你签过字的)
  ├── 📄 03_Initial_Resolution_Signed.pdf
  └── 📄 04_EIN_Confirmation_Letter.pdf (后续申请的税号文件)
```

**妥善保管这些文件**，在接下来的美国商业之旅中，你将无数次用到它们。
