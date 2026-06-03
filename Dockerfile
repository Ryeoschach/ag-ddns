FROM node:18-alpine

WORKDIR /app

# 仅拷贝依赖配置文件以使用 Docker 缓存
COPY package*.json ./

# 安装生产环境依赖
RUN npm ci --omit=dev

# 拷贝核心服务和共享模块代码
COPY server/ ./server/
COPY shared/ ./shared/

# 暴露默认端口
EXPOSE 8080

# 默认运行模式
ENV NODE_ENV=production

# 启动服务端
CMD ["node", "server/server.js"]
