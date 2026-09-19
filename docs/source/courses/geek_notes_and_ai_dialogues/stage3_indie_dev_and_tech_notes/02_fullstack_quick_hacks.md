# 3.2 全栈开发与云原生运维速查备忘录

> **核心导语：** 汇集 Linux 运维、Docker 部署、Nginx 反代与前端打包的高频命令行与配置范例。

---

## 📌 常用生产级命令速查（占位待充实）

### 1. Docker 容器清理与维护
```bash
# 清理悬空镜像与未使用的网络
docker system prune -f
```

### 2. Nginx 反代配置要点
```nginx
# WebSocket 协议升级与缓冲关闭
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_buffering off;
```

---

## 📝 经验随笔留白

待补充日常开发积累的各类单行脚本与配置技巧。
