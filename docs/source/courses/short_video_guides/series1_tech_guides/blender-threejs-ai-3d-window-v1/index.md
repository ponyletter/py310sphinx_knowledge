# Blender三维：AI为何可见？

> 资料核验与更新：2026-09-12

Blender 和 Three.js 不是同类工具：Blender 是三维创作与自动化工作台，Three.js 是浏览器中的实时三维展示层，glTF/GLB 则把资产从创作工具交付给运行时。它们共同把 AI 的自然语言意图、空间处理、脚本、资产导出和结果纠错变成可见的三维成果。

```{figure} images/scene01_img01_overview.png
:alt: 从自然语言意图到 Blender 创作、资产导出和 Three.js 展示的总览
:width: 100%

三维工作流能直观看到 AI 是否理解对象、空间、材质、镜头和交付结果。
```


## 阅读边界

本文依据原始课程的研究笔记、课程结构和发布文案整理。涉及产品、模型、版本、平台规则、价格或资格等可能变化的信息，实践前应以当前官方资料和实际环境为准。

## Blender：创作与自动化工作台

```{figure} images/scene02_img01_blender_creation.png
:alt: Blender 的建模、材质、灯光、动画和模拟能力
:width: 100%

Blender 覆盖建模、材质、灯光、动画、模拟、渲染与合成等创作环节。
```

```{figure} images/scene02_img02_blender_python.png
:alt: Blender Python API 可创建对象、调整材质和设置场景
:width: 100%

Python API 让脚本能够修改许多界面可修改的数据；AI 需要选择何时操作界面、何时用脚本。
```

```{figure} images/scene02_img03_blender_render_review.png
:alt: 通过渲染结果观察并纠正三维场景
:width: 100%

一次完成操作不代表成功，必须通过渲染或视图观察比例、材质、灯光和镜头问题。
```

## Three.js：浏览器运行时展示层

```{figure} images/scene03_img01_threejs_runtime.png
:alt: Three.js 在浏览器中组织场景、相机、渲染器和画布
:width: 100%

Three.js 负责网页运行时的场景、相机、渲染与加载，不替代前期三维创作。
```

```{figure} images/scene03_img02_threejs_interaction.png
:alt: Three.js 提供旋转、缩放、动画和网页交互
:width: 100%

交互和动画让用户在浏览器中检查模型，而资产质量仍由前期整理决定。
```

## 用 glTF/GLB 接力

```{figure} images/scene04_img01_pipeline_main.png
:alt: Blender 导出 glTF 或 GLB 并由 Three.js 加载的资产交付链
:width: 100%

Blender 制作并整理资产，glTF/GLB 负责运行时交付，Three.js 负责加载和交互展示。
```

glTF/GLB 描述节点、变换、网格、材质、相机和动画；它是交付格式，不是保留全部 Blender 创作信息的工程文件。

## AI 三维能力需要观察—纠错闭环

```{figure} images/scene05_img01_ai_capability_loop.png
:alt: AI 三维任务中的观察、定位差异、调整参数和再次验证闭环
:width: 100%

空间理解、层级、坐标、材质、灯光、镜头、动画和导出设置都需要被结果验证。
```

## 常见失败边界

```{figure} images/scene06_img01_blender_failure_points.png
:alt: Blender 中对象命名、比例、原点、材质和镜头的常见失败点
:width: 100%

Blender 资产的命名、层级、比例、原点、材质节点和镜头都可能造成失败。
```

```{figure} images/scene06_img02_gltf_transfer_failure.png
:alt: glTF 和 GLB 导出传递中的变换、资源和动画失败点
:width: 100%

导出前必须验证变换、资源打包和动画命名是否适合运行时。
```

```{figure} images/scene06_img03_threejs_runtime_limits.png
:alt: Three.js 运行时无法替代建模、绑定和资产整理的边界
:width: 100%

Three.js 加载成功也不表示资产适合交互；运行时不能补回缺失的创作整理。
```

```{figure} images/scene07_img01_summary.png
:alt: Blender、glTF GLB 和 Three.js 构成 AI 三维展示链的总结
:width: 100%

不要用厂商宣传替代评测：具体模型能力应按版本、任务、提示词、硬件和失败样例进行可复现实验。
```


## 小结

把问题拆成目标、约束、证据和验证四部分，通常比直接寻找唯一答案更可靠。先用本文梳理的选型维度与边界原则完成一次小范围工程验证，再根据真实系统反馈调整下一步决策。

## 参考资料

- [Blender Documentation](https://docs.blender.org/)
- [Blender Python API](https://docs.blender.org/api/current/)
- [Three.js: Creating a scene](https://threejs.org/manual/en/creating-a-scene.html)
- [Khronos glTF](https://www.khronos.org/gltf/)
