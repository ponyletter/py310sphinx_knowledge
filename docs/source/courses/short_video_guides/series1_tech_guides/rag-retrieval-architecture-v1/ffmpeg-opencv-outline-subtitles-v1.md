# FFmpeg 是什么？为什么？怎么用？

> 短视频主题：FFmpeg 是什么？为什么？怎么用？——OpenCV 与描边字幕
> 资料核验与更新：2026-09-23

FFmpeg 可以先理解成一条音视频处理流水线：它把媒体文件读进来，完成解码、滤镜、编码和封装，再输出一个新的文件。本页面向成人零基础读者，沿着一条视频从输入到输出的路径，解释 FFmpeg 的位置、OpenCV 的分工，以及 `drawtext` 和 ASS 如何做可读的描边字幕。

文中的图均为本课程制作的 AI 辅助教学示意图，不是 FFmpeg、OpenCV 或其他项目的官方界面，也不代表特定机器上的编码性能承诺。它们用于解释数据流、职责边界和选择路径。

## 阅读边界

本页根据视频项目的研究笔记、结构计划、术语清单和最终字幕整理。命令参数、编码器、后端和字体能力会随平台、安装方式与版本变化；实践时应以当前官方文档、`ffmpeg -filters` 输出和本地环境测试为准。本文不把 FFmpeg、OpenCV 或 ASS 做绝对性能排名，而是解释它们各自负责哪一段工作。

## 先看一条链路：FFmpeg 站在哪里？

第一次接触 FFmpeg 时，可以先不背一长串参数。把视频想成一份装着视频流和音频流的媒体文件：FFmpeg 负责把它拆开、处理，再重新写成输出文件。

```{figure} images/ffmpeg_scene01_overview.png
:alt: FFmpeg 从媒体输入经过解封装、解码、滤镜、编码和重新封装到输出文件，同时连接 OpenCV 逐帧处理和描边字幕
:width: 100%

图：本课程 AI 辅助教学示意图；FFmpeg 把媒体输入、处理和输出串成一条流水线。
```

这张图里，OpenCV 的位置是“逐帧看和改”，描边字幕的位置是“在合适的处理阶段叠加文字”。因此，FFmpeg 不只是一个转码命令，也不是 OpenCV 的替代品；它更像负责媒体进出的骨架。

## FFmpeg 不只是一个命令：工具、库和滤镜

命令行是最容易开始的入口。例如 `-i` 指定输入，`-vf` 连接视频滤镜，最后写出输出文件名。命令背后还对应底层媒体库和滤镜图，所以同一套能力既可以在终端中使用，也可以被 Python 或其他程序调用。

```{figure} images/ffmpeg_scene02_toolbox.png
:alt: FFmpeg 命令行工具箱展示媒体文件、输入参数、滤镜和输出文件
:width: 100%

图：本课程 AI 辅助教学示意图；命令行是进入 FFmpeg 媒体能力的入口。
```

再把三个常见名词放在一起：容器像装视频流和音频流的盒子；编码器负责压缩和还原；滤镜是中间的处理步骤，例如缩放、裁剪和叠字。容器不是编码器，滤镜也不是文件格式，它们在流水线里承担不同职责。

```{figure} images/ffmpeg_scene02_media_layers.png
:alt: 容器、编码器和滤镜分别处理视频流与音频流的媒体层示意图
:width: 100%

图：本课程 AI 辅助教学示意图；容器、编码器和滤镜不是同一个概念。
```

## OpenCV 和 FFmpeg：一个管媒体，一个管像素

OpenCV 和 FFmpeg 经常一起出现，是因为它们擅长的层次不同。OpenCV 的 `VideoCapture` 可以打开视频并读取帧；每一帧可以作为 `Mat` 像素矩阵，交给检测、分析或绘制逻辑。

```{figure} images/ffmpeg_scene03_opencv_role.png
:alt: OpenCV 读取视频帧、转换为 Mat 图像帧、检测分析并写回处理后的帧
:width: 100%

图：本课程 AI 辅助教学示意图；OpenCV 的重点是逐帧视觉处理。
```

FFmpeg 负责另一侧：打开文件、解封装、解码，并把处理后的帧重新编码输出。也就是说，它处理的是媒体 I/O 和编码链路，不只是“把图像画出来”。

```{figure} images/ffmpeg_scene03_ffmpeg_role.png
:alt: FFmpeg 对视频流和音频流执行解封装、解码、滤镜、编码和输出
:width: 100%

图：本课程 AI 辅助教学示意图；FFmpeg 管媒体流的读入、处理和输出。
```

两者组合时，典型路径是：FFmpeg 后端读入视频，OpenCV 在内存中处理 `Mat` 帧，再把帧交回 FFmpeg 编码输出。OpenCV 的 `CAP_FFMPEG` 可以在支持的环境中指定 FFmpeg 视频 I/O 后端，但实际可用性仍取决于本机构建和安装。

```{figure} images/ffmpeg_scene03_opencv_ffmpeg_bridge.png
:alt: FFmpeg 后端读入视频、OpenCV 处理 Mat 帧、再由 FFmpeg 编码输出的协作流水线
:width: 100%

图：本课程 AI 辅助教学示意图；OpenCV 与 FFmpeg 是同一条流水线上的两种分工。
```

## 从一条命令开始：再按任务接 Python 或 OpenCV

零基础入门时，先记住输入、滤镜、编码、输出这条主干。下面这张图把一个缩放命令拆成几个可以观察的节点：

```{figure} images/ffmpeg_scene04_cli_command.png
:alt: FFmpeg 使用 -i 指定输入、-vf 连接滤镜、编码器处理后输出视频文件
:width: 100%

图：本课程 AI 辅助教学示意图；先读懂 `-i` 和 `-vf`，再扩展其他参数。
```

可以把示例理解成参数骨架：`ffmpeg -i input.mp4 -vf scale=1280:-2 output.mp4`。真正运行时，输入文件、输出容器、编码器和滤镜可按本机环境调整；不要把示例中的文件名当成固定要求。

需要批量处理多个文件时，可以让 Python 的 `subprocess` 传入参数列表，让 FFmpeg 进程执行实际媒体操作。这样脚本负责循环、命名、错误处理和任务编排，FFmpeg 负责每次媒体转换。

```{figure} images/ffmpeg_scene04_python_subprocess.png
:alt: Python 脚本通过参数列表启动 FFmpeg 进程并生成输出视频，适合批量自动化
:width: 100%

图：本课程 AI 辅助教学示意图；Python 适合批量自动化，但没有替代 FFmpeg 的媒体能力。
```

如果任务是逐帧检测、绘制框、画文字或分析像素，就让 OpenCV 参与进来。`VideoCapture` 对应打开和读取，`VideoWriter` 对应把处理后的帧写回；后端可以在支持时使用 `CAP_FFMPEG`。

```{figure} images/ffmpeg_scene04_opencv_backend.png
:alt: OpenCV 使用 VideoCapture 和 CAP_FFMPEG 读取帧，处理后通过写入视频输出
:width: 100%

图：本课程 AI 辅助教学示意图；逐帧视觉任务才需要把 OpenCV 放到流水线中。
```

## 描边字幕：drawtext 还是 ASS？

只有少量固定文字时，FFmpeg 的 `drawtext` 滤镜通常更直接。`fontfile` 指定字体文件，`fontcolor` 指定文字颜色，`borderw` 控制描边宽度，`bordercolor` 控制描边颜色。描边的目的不是装饰，而是让字幕在复杂背景上保持可读。

```{figure} images/ffmpeg_scene05_drawtext_outline.png
:alt: FFmpeg drawtext 通过 fontfile、fontcolor、borderw 和 bordercolor 生成可读的描边字幕
:width: 100%

图：本课程 AI 辅助教学示意图；固定短句可以先用 `drawtext` 解决。
```

当字幕有很多条、不同时间轴和多种样式时，把字幕写进 ASS 脚本会更容易管理，再通过 `subtitles` 滤镜交给 FFmpeg。ASS 的 `Outline` 和 `OutlineColour` 分别描述描边宽度和颜色；`force_style` 可用于覆盖或统一样式，但具体效果仍需结合字体、字号和渲染环境检查。

```{figure} images/ffmpeg_scene05_ass_subtitles.png
:alt: ASS 字幕脚本包含时间轴、Outline、OutlineColour 和 force_style，并由 FFmpeg subtitles 滤镜渲染
:width: 100%

图：本课程 AI 辅助教学示意图；多条时间轴和复杂样式更适合用 ASS 管理。
```

这不是“哪个工具永远更好”的问题，而是字幕复杂度的选择题：少量固定字先用滤镜，多条时间轴先用字幕脚本。无论采用哪条路，最终都要在目标分辨率和真实背景上检查可读性。

## 最后按任务选路径

可以把全片压缩成三个判断：只转码或加滤镜，先看 FFmpeg；需要逐帧识别和绘制，用 OpenCV 加 FFmpeg；需要管理时间轴和复杂字幕样式，用 ASS 加 FFmpeg。

```{figure} images/ffmpeg_scene06_decision_summary.png
:alt: 按只转码加滤镜、逐帧识别绘制、复杂字幕时间轴三类任务选择 FFmpeg、OpenCV 和 ASS
:width: 100%

图：本课程 AI 辅助教学示意图；最终心智模型是“输入 → 处理 → 输出”，再按任务组合工具。
```

## 小结

FFmpeg 是音视频处理工具与库的集合，核心价值是把媒体输入、解码、滤镜、编码和输出连成可组合的流水线。OpenCV 关注像素和逐帧视觉逻辑；Python 负责批量编排；ASS 负责多条字幕时间轴和样式。理解这些职责边界之后，FFmpeg 就不再是需要死记参数的黑盒，而是一条可以逐步观察、逐步扩展的处理链。

## 参考资料

- [FFmpeg 官方文档](https://www.ffmpeg.org/documentation.html)：ffmpeg、ffprobe 与 FFmpeg 库文档总入口。
- [FFmpeg 官方滤镜文档](https://ffmpeg.org/ffmpeg-filters.html)：`drawtext`、`subtitles`、`force_style` 及相关参数。
- [FFmpeg 官方 Doxygen](https://ffmpeg.org/doxygen/8.1/index.html)：libavformat、libavcodec、libavfilter 等组件说明。
- [OpenCV Video I/O 概览](https://docs.opencv.org/4.x/d0/da7/videoio_overview.html)：VideoCapture、VideoWriter 和 FFmpeg 后端的关系。
- [OpenCV VideoCapture](https://docs.opencv.org/4.x/d8/dfe/classcv_1_1VideoCapture.html)：读取视频文件、图像序列、摄像头及后端选择。
- [OpenCV VideoWriter](https://docs.opencv.org/4.x/dd/d9e/classcv_1_1VideoWriter.html)：把处理后的帧写出为视频文件。
