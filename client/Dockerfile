FROM node:18-alpine

WORKDIR /app

# 拷贝客户端代理脚本
COPY client.js .

# 启动客户端代理。可以通过挂载主机目录来持久化配置 config.json 和 IP 缓存 ip.cache
CMD ["node", "client.js"]
