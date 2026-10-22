# 09 精确像素缓存、CPU 绑核与图片匹配

OCR 缓存键由模式和裁剪的精确像素构成。光标闪烁或一像素变化都会产生新键；这与“看起来差不多就复用”不同。缓存只加快重复读取，无法消除第一次读取的成本。

```{literalinclude} ../_code/ocr/pool.py
:language: python
:pyobject: OcrPool.recognize
:linenos:
:caption: 逐字段缓存与同批重复裁剪合并
```

RK3588 有大小核。案例将 OCR 子进程约束在 CPUs 4–7，使用 4 个 ONNX Runtime 线程；这是该板的实测调度结果，不是所有 ARM 板的通用 CPU 编号。线程参数影响并行执行，官方说明见 [ONNX Runtime thread management](https://onnxruntime.ai/docs/performance/tune-performance/threading.html)。

## 图片匹配为何从十几秒降至约一秒

旧实现逐一检查 80–360 像素宽度，每个宽度做 LANCZOS 缩图、灰度相关、右侧位置限制和颜色检查。新版先在半分辨率估计有希望的尺度，再从强峰逐步搜索精确得分，并缓存缩略图。若相关峰未通过颜色校验，会扩大检查范围，最坏路径仍可能慢。

```{literalinclude} ../_code/vision/reply_image.py
:language: python
:pyobject: find_outgoing_image
:linenos:
:caption: 粗筛、精确得分爬升与保守回退
```

“每个候选使用原校验”不构成对所有图像全局等价的数学证明；候选选择仍依赖启发式。应保留穷举 oracle，在真实可见帧核对框和得分。实测数字与命令见[基准课](../stage6_operations/02_benchmark.md)。

增量安全 OCR 读取改变的横向带，正命中、较大变化等退回全区读取；它同样需要真实帧对照，不能只依赖合成样例推断所有界面都一致。

**交付**：同时包含缓存／首次读取、正匹配／无图片、冷缓存／热缓存的性能表。把精度与速度分列。
