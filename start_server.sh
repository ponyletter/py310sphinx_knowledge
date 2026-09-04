#!/bin/bash
# 启动 Sphinx 实时预览服务（默认: 127.0.0.1:8269）
HOST="${SPHINX_HOST:-127.0.0.1}"
PORT="${SPHINX_PORT:-8269}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 优先使用项目 conda 环境中的可执行文件
if [ -x "/root/miniconda3/envs/py310sphinx_knowledge/bin/sphinx-autobuild" ]; then
    AUTOBUILD="/root/miniconda3/envs/py310sphinx_knowledge/bin/sphinx-autobuild"
else
    AUTOBUILD="sphinx-autobuild"
fi

echo "正在启动 Sphinx 预览服务..."
echo "访问地址: http://${HOST}:${PORT}/"
exec "$AUTOBUILD" docs/source docs/build/html --host "$HOST" --port "$PORT" "$@"
