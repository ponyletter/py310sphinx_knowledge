# 个人小程序虚拟支付，先查哪5项？

先查资格，再写代码。虚拟支付资格不自动等于所有商品、终端、订阅能力和额度都开放；个人、企业与个体工商户的规则也不能互相套用。

![五项检查总览](images/scene01_overview.png)

把主体、类目、认证备案、终端能力和支付履约拆开核验，可以避免“页面能开但业务不能上线”。

![虚拟支付边界](images/scene02_boundary.png)

当前规则、后台状态和审核结果才是最终依据，旧文章中的资格说法不可直接沿用。

![虚拟商品与数字权益](images/scene02_virtual_products.png)

虚拟商品通常交付数字内容、会员、额度或功能解锁；具体可售范围仍须以官方页面为准。

![开通前检查](images/scene03_checks.png)

主体认证、备案、服务类目和后台能力是先决条件，不是支付按钮可以绕过的问题。

![企业主体边界](images/scene04_enterprise.png)

企业页面的条件和能力不能反推到个人主体。

![个体工商户边界](images/scene04_individual_business.png)

个体工商户也有独立条件与结算口径，应按对应官方页面检查。

![主体差异](images/scene04_subjects.png)

不要只问“能不能开通”，还要问具体主体、类目和商品是否匹配。

![能力分离](images/scene05_capability_separation.png)

一次性支付、终端开放、订阅与限额是彼此独立的检查项。

![外部支付路径边界](images/scene05_external_route.png)

商品、支付和履约应在允许的交易路径中保持一致，不能把站内交易绕到未获准的外部路径。

![服务端边界](images/scene06_backend_boundary.png)

订单创建、支付结果、权益发放、退款和对账必须由服务端闭环，而不能只信任前端提示。

![支付生命周期](images/scene06_lifecycle.png)

回调可能延迟或丢失，应保留查单、幂等、异常处理和对账机制。

![最终决策树](images/scene07_decision_tree.png)

先完成五项核验，再做最小支付闭环和真机验证，最后才扩大商品与运营范围。
