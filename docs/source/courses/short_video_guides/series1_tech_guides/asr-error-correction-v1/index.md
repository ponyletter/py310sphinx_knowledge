# ASR错字，怎么纠正？

ASR把声音变成文字，但数字、标点、同音词和方言都会让原始结果失真。这条视频带你看懂错误从哪来，以及规则、神经网络和人工复核怎样配合。

## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## ASR 是什么？先看声音到文字

它不是录音机，而是在多个候选文字里做判断。

ASR错字，怎么纠正？先把这个问题说完整：自动语音识别，就是把人说的话转换成文字。它听到的不是字，而是声音里的音素、停顿和上下文，再从候选文字里选出最可能的一串。

所以原始输出更像一份听写草稿，后面还需要格式化、纠错和语义优化。

![asr overview](images/scene01_img01_asr_overview.png)

图解：这张图展示“声音波形→耳朵/声学特征→候选文字→原始转写”的连续教学流程，局部标签写“声音”“声学特征”“候选文字”“原始转写”“自动语音识别（ASR）”，用蓝色表示输入、黄色表示判断、绿色表示输出。

![asr blackbox](images/scene01_img02_asr_blackbox.png)

图解：这张图展示一个透明感的黑盒，左侧进入声音，盒内有多个候选词条，右侧输出一行未经校对的文字并标出“听写草稿”，局部说明“不是录音机”“要结合上下文”。

## ASR 内部：四步把声音猜成句子

每一步都可能把误差带到下一步。

第一步把连续声音切成可计算的声学特征，第二步判断这些声音更像哪些发音单位。第三步用语言上下文给候选词排序，第四步再输出文字和时间戳。

因此数字、产品名和人名会因为词表太少而错，连读、噪声和口音会让声音本身变难。

![pipeline](images/scene02_img01_pipeline.png)

图解：四段纵向流水线，标签为“1 声学特征”“2 发音单位”“3 语言上下文”“4 文字与时间戳”，每段有简洁图示和箭头，显示误差会向后传递。

![context](images/scene02_img02_context.png)

图解：同一声音对应三个候选词，左边写“声音证据”，右边写“上下文排序”，最后突出正确候选；标注“词表”“领域词”“前后文”。

## 原始输出常见问题：先做错误分型

不同错误，要用不同修复手段。

第一类是数字和专有名词，比如版本号、公司名、地名，声音短，候选却很多。第二类是标点缺失和断句错误，字可能都对，但读起来没有层次，搜索和摘要也会受影响。

第三类是同音词混淆，比如“背景”和“北京”，单看发音难分，必须把上下文一起看。

![entities](images/scene03_img01_entities.png)

图解：数字、版本号、公司名、地名四种专名从声波进入候选列表，错误词划线、正确词用黄线，标签“数字”“专有名词”“词表太少”。

![punctuation](images/scene03_img02_punctuation.png)

图解：一行无标点转写经过停顿检测和连接词分析，变成有逗号、句号、问号的两句，标签“停顿”“连接词”“标点恢复”“断句”。

![homophone](images/scene03_img03_homophone.png)

图解：左侧同一发音分叉为“背景”和“北京”，中间写“只听音不够”，右侧用上下文句子分别导向两个词，标注“语境判断”。

## 规则匹配 vs 神经网络：谁来改

工程上常见的答案不是二选一，而是分层协作。

规则匹配适合固定词表和确定格式，比如把常见误写统一换成产品名，快、稳、好追溯。神经网络更擅长看整句语义，能补标点、重排断句，也能在多个同音词里选更合理的那个。

但模型可能过度润色，所以更稳的做法是先用规则守住术语，再让模型做语义优化，最后对关键内容人工复核。

![rules](images/scene04_img01_rules.png)

图解：规则匹配像一扇固定门，输入“UML 一点一”经过领域词表，输出“UML 1.1”，标注“快”“稳”“可追溯”“固定问题”。

![neural](images/scene04_img02_neural.png)

图解：神经网络看完整句，上下文气泡围绕候选词，补出标点并选择同音词，标注“看整句”“语义”“可能过度润色”。

![hybrid](images/scene04_img03_hybrid.png)

图解：三段混合工作流“规则守术语→模型做语义→人工复核”，关键结果进入绿色勾选，标注“分层协作”。

## 三个典型案例：从“能看”到可发布

纠错不是把句子写漂亮，而是把事实保住、把意思说清。

案例一，数字和专名先查词表，比如“UML 一点一”不能被改成听起来相近的普通词。案例二，先按停顿和连接词补标点，再检查主语、动作和结果有没有被断开。

案例三，同音词不能只靠相似字音，要用领域词表、句法和上下文联合判断；不确定时宁可标记待审。

![cases](images/scene05_img01_cases.png)

图解：三行典型案例对照，分别是“专名：UML 1.1”“断句：主语—动作—结果”“同音：背景/北京”，每行显示“原始→修复→检查”。

![semantic](images/scene05_img02_semantic.png)

图解：左侧“能看”的原始长句，经过“标点”“术语”“语义”三步整理，右侧是清晰短句，底部写“先保事实，再修形式”。

## 方言怎么处理？把数据和策略补齐

没有代表性的语音数据，模型就很难稳定覆盖真实口音。

方言处理的第一步，是收集目标地区、说话速度、设备和噪声都真实的语音，并配上人工转写。第二步先评估错误类型，再决定加领域词表、短语提示、发音数据，还是训练更贴近场景的定制模型。

最后把原始转写、纠错结果和人工抽检分开记录：ASR负责提供证据，编辑负责确认事实，文本优化负责让人读得顺。

![dialect summary](images/scene06_img01_dialect_summary.png)

图解：方言策略全景，四个节点“真实语音数据→人工转写→领域适配→评估迭代”，旁边标注“地区、速度、设备、噪声”。

![final check](images/scene06_img02_final_check.png)

图解：上线前检查清单，四个绿色勾选“事实保真”“术语正确”“断句自然”“人工抽检”，底部口诀“方言靠数据，纠错靠分层，发布靠验证”。

## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文的框架完成一次小范围验证，再根据真实反馈调整下一步。

## 参考资料

以下链接来自原始课程研究笔记；动态信息请以其当前页面为准。

- [https://en.wikipedia.org/wiki/Speech_recognition](https://en.wikipedia.org/wiki/Speech_recognition)
- [https://en.wikipedia.org/wiki/Word_error_rate](https://en.wikipedia.org/wiki/Word_error_rate)
- [https://www.ibm.com/think/topics/speech-recognition](https://www.ibm.com/think/topics/speech-recognition)
- [https://public.dhe.ibm.com/software/pervasive/info/products/Introduction_to_Speech_Recognition.pdf](https://public.dhe.ibm.com/software/pervasive/info/products/Introduction_to_Speech_Recognition.pdf)
- [https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview)
- [https://learn.microsoft.com/azure/ai-services/speech-service/improve-accuracy-phrase-list](https://learn.microsoft.com/azure/ai-services/speech-service/improve-accuracy-phrase-list)
- [https://learn.microsoft.com/en-ie/azure/ai-services/speech-service/how-to-custom-speech-test-and-train](https://learn.microsoft.com/en-ie/azure/ai-services/speech-service/how-to-custom-speech-test-and-train)
- [https://arxiv.org/abs/2111.10746](https://arxiv.org/abs/2111.10746)
- [https://arxiv.org/abs/2104.10747](https://arxiv.org/abs/2104.10747)
- [https://arxiv.org/abs/2111.08400](https://arxiv.org/abs/2111.08400)
- [https://arxiv.org/abs/2308.03423](https://arxiv.org/abs/2308.03423)
