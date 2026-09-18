# GPU、NPU、CPU：先讲清楚是什么，再讲怎么选

> 短视频主题：GPU、NPU、CPU 的概念区别
> 资料核验与更新：2026-09-18

CPU、GPU 和 NPU 都是处理器，但它们解决的问题不同。面向第一次接触这些名词的读者，可以先记住一条主线：CPU 负责通用控制，GPU 擅长大规模并行，NPU 专门加速神经网络推理。它们通常不是互相替代，而是在同一台设备里协同工作。

文中的图均为本课程制作的 AI 辅助教学示意图，不是芯片厂商的原始结构图，也不代表某个具体型号的性能承诺。图的作用是帮助读者建立“任务—处理器—结果”的直观联系。

## 阅读边界

本文只解释三类处理器的基本职责、适合的任务和选择边界，不比较具体品牌、型号、价格或跑分。不同设备的硬件规模、驱动、框架和功耗策略都会影响最终表现；实际选型应以目标软件和设备规格为准。

## 先看本质：三种处理器各管什么

先不要把 CPU、GPU、NPU 理解成“三种更快或更慢的电脑”。它们更像一支分工不同的团队：CPU 能处理各种复杂指令并管理系统；GPU 把大量相似计算拆开并行完成；NPU 把神经网络中反复出现的计算交给专用硬件路径。

```{figure} images/scene01_img01_overview.png
:alt: 一个用户任务分成 CPU、GPU、NPU 三条处理路径并汇聚到结果
:width: 100%

图：同一个任务可以被拆成不同类型的工作，关键不是芯片名字，而是任务形态。
```

对零基础读者，最实用的判断方式是先问“这件事需要什么计算”：如果步骤和分支变化很多，先看 CPU；如果有大量相似计算，关注 GPU；如果是在运行已经适配的人工智能模型，再看 NPU 是否能参与。

```{figure} images/scene02_img01_cpu_role.png
:alt: CPU 执行复杂指令并协调操作系统和其他硬件
:width: 100%

图：CPU 的关键词是通用、控制和协调，而不是只处理某一种固定计算。
```

## CPU：通用控制与系统协调

CPU 是中央处理器，擅长执行复杂指令、管理操作系统、处理输入输出，并协调其他硬件。打开软件、读取文件、安排任务、处理异常和做出分支判断，都常常需要 CPU 参与。

CPU 的优势是灵活。它不要求所有工作都长得一样，因此适合处理顺序强、变化多、需要及时做决定的程序。代价是：当同一种计算需要重复执行成千上万次时，只靠少量通用核心可能不如专用并行硬件高效。

```{figure} images/scene05_img01_cpu_orchestration.png
:alt: CPU 接收输入、安排流程并把任务调度给不同处理器
:width: 100%

图：在真实设备中，CPU 往往先接收任务、管理系统流程，再把合适的工作交给 GPU 或 NPU。
```

所以“CPU 更强”不能简单理解成所有任务都更快。它的核心价值是通用性和控制能力，是整个系统的组织者。

## GPU：把相似计算大规模并行化

GPU 最初服务于图形显示，但它的关键能力可以推广到很多任务：把同一种或相似的计算拆给大量计算单元，同时处理很多数据。图像像素、视频帧、矩阵和张量，往往都能找到这种并行机会。

```{figure} images/scene02_img02_gpu_role.png
:alt: GPU 把相似计算拆给大量计算单元并行完成
:width: 100%

图：GPU 的优势来自吞吐量；任务越规整、越能铺开，并行收益通常越明显。
```

例如把照片处理成高清图时，大量像素可能需要类似的计算。GPU 可以同时处理许多像素或矩阵块，因此适合三维渲染、视频处理、科学计算和许多机器学习任务。

```{figure} images/scene03_img01_same_task.png
:alt: 同一张照片分别经过 CPU 控制、GPU 并行和 NPU 推理三条工作路径
:width: 100%

图：同一个“照片变高清”任务里，CPU、GPU、NPU 负责的是不同工作形态。
```

但 GPU 并不是所有工作都占优。大量分支、频繁同步或数据规模很小的任务，可能无法充分利用并行单元；最终效果还取决于软件是否把任务正确交给 GPU。

## NPU：专门服务神经网络推理

NPU 是神经网络处理器，针对神经网络中的矩阵乘法、卷积等常见算子做专用加速。这里的“推理”可以简单理解为：模型已经训练好，设备拿输入去计算结果，例如识别人脸、翻译语音、生成背景虚化效果或唤醒语音助手。

```{figure} images/scene02_img03_npu_role.png
:alt: NPU 针对神经网络和本地人工智能推理做专用加速
:width: 100%

图：NPU 的关键词是神经网络算子、本地推理和专用加速。
```

NPU 的价值通常不是“比所有处理器都快”，而是在支持的模型和算子上，用较低功耗持续完成人工智能计算。这对摄像头背景虚化、实时翻译、语音唤醒和端侧视觉理解等场景很有意义。

```{figure} images/scene04_img01_npu_ops.png
:alt: NPU 对矩阵乘法和卷积等神经网络算子进行专用加速
:width: 100%

图：NPU 把反复出现的神经网络计算做成更专一的硬件路径。
```

专用也意味着边界。软件框架、驱动和模型算子都需要适配；如果程序没有支持 NPU，任务可能仍由 CPU 或 GPU 执行。换句话说，买到 NPU 不等于所有 AI 软件都会自动加速。

```{figure} images/scene04_img02_npu_boundary.png
:alt: NPU 是否发挥作用还取决于软件适配和模型支持
:width: 100%

图：NPU 的优势必须和软件适配一起理解，专用不等于万能。
```

## 三者如何协同，以及普通用户怎么选

真实设备里，三者通常是接力关系，而不是三选一。CPU 可以接收输入、调度流程和处理系统交互；GPU 接手图像、视频或其他吞吐型并行计算；NPU 运行已经适配的神经网络；最后 CPU 把结果交回应用。

```{figure} images/scene05_img02_gpu_handoff.png
:alt: CPU 调度后把图像或视频中的大规模并行计算交给 GPU
:width: 100%

图：GPU 更像吞吐型计算引擎，适合大量相似计算同时展开。
```

选择时可以按三步走：第一，看自己的任务；第二，看目标软件是否支持对应硬件；第三，看功耗和续航目标。日常办公、操作系统和复杂控制先看 CPU；三维渲染、视频处理和大规模并行任务更看 GPU；本地语音、视觉或其他神经网络推理，并且在意续航，再看 NPU。

```{figure} images/scene06_img01_selection_tree.png
:alt: 按日常办公、图形处理和本地人工智能推理选择处理器
:width: 100%

图：选处理器不是背诵“谁更快”，而是把任务形态和硬件特长对应起来。
```

```{figure} images/scene05_img03_npu_inference.png
:alt: NPU 运行已适配的神经网络并把推理结果回传应用
:width: 100%

图：NPU 的实际收益来自模型适配、低功耗运行和完整的软件链路。
```

如果是训练大模型或运行大型并行模型，GPU 往往更重要；但这仍然不是脱离软件的绝对结论。模型框架、算子支持、显存、内存带宽和驱动都会改变结果。

## 小结

一句话记住：CPU 管通用，GPU 管并行，NPU 管神经网络推理。CPU 负责把系统组织起来，GPU 擅长把相似工作同时铺开，NPU 则在适配的人工智能模型上追求专用和省电。

真正选购电脑或做开发时，不要只看一个芯片名。先问任务是什么，再确认软件是否支持，最后把速度、兼容性和功耗放在一起判断。

## 参考资料

- [Intel：CPU 与 GPU 的区别](https://www.intel.com/content/www/us/en/products/docs/processors/cpu-vs-gpu.html) —— 介绍 CPU 的通用处理与 GPU 的并行处理差异。
- [Intel：从 CPU 到专用加速器的处理器基础](https://www.intel.com/content/www/us/en/newsroom/tech101/client-computing/processor-guidebook-the-basics-from-cpus-to-asics.html) —— 解释不同处理器面向的工作负载。
- [NVIDIA CUDA Programming Guide：Introduction](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/introduction.html) —— 说明 GPU 并行计算和线程组织的基本概念。
- [Microsoft Learn：NPU devices](https://learn.microsoft.com/en-us/windows/ai/npu-devices/) —— 介绍 Windows 设备中的 NPU、软件支持和本地 AI 场景。
- [Microsoft Support：All about Neural Processing Units](https://support.microsoft.com/en-us/windows/experience/compatibility/all-about-neural-processing-units-npus) —— 说明 NPU 的用途、边界和与 CPU/GPU 的协同关系。
