# A 命令速查与本地课程构建

## 在现有板子上查看状态

```bash
cd /root/02project/01xianyumonitor
git status --short
git rev-parse --short HEAD
systemctl is-active xianyu-monitor-web xianyu-monitor-worker
systemctl show xianyu-monitor-worker -p ExecStart -p WorkingDirectory
ss -ltnp | grep ':8080'
tmux attach -t xianyu-monitor
journalctl -u xianyu-monitor-worker --since '10 minutes ago' --no-pager
```

## 检查配置、采集与离线识别

以下文件路径是示意，先创建私密目录。截图、OCR 结果及诊断即使有脱敏功能，也应在检查后才对外共享。

```bash
install -d -m 0700 /root/xvm-private
XVM_ENV_FILE=/etc/xianyu-monitor/monitor.env \
 /root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor check-config
XVM_ENV_FILE=/etc/xianyu-monitor/monitor.env \
 /root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor capture-once \
 --out /root/xvm-private/frame.png
XVM_ENV_FILE=/etc/xianyu-monitor/monitor.env \
 /root/miniconda3/envs/xianyu-monitor/bin/xianyu-monitor analyze-image \
 /root/xvm-private/frame.png --profile /root/xvm-private/profile.json --pane
```

`capture-once` 不点击；`analyze-image` 不发送，但可能输出识别原文；`benchmark` 只输出耗时和一致性。`smtp-test` 默认检查连接，`smtp-test --send` 会真正发送邮件。`import-rules`、`load-calibration` 和 `migrate` 会修改数据库，执行前先理解作用。

命令参数以冻结 `cli.py` 的 `build_parser` 为准，不存在的 `--account` 或 `--compare-det` 不应写进当前启动脚本。

## 本地 Sphinx 文档环境

```powershell
Set-Location 'C:\02media\04mycoding\py310sphinx_knowledge'
& 'C:\01soft\12conda\envs\py310sphinx_knowledge_base\python.exe' -m sphinx `
  -b html --keep-going docs/source docs/build/html
& 'C:\01soft\12conda\envs\py310sphinx_knowledge_base\python.exe' -m http.server `
  8269 --bind 127.0.0.1 --directory docs/build/html
```

访问 `/courses/xianyu_visual_monitor_from_zero/index.html`。第二条是前台静态预览命令，按 Ctrl+C 停止；它不会部署板子服务，也不会启动闲鱼自动回复。

源码通过 `literalinclude` 引入冻结文件，导航通过 `toctree` 管理，相关机制见 [Sphinx directives](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html)。文件改变后重新构建，不能直接编辑生成的 HTML 当作课程源文档。
