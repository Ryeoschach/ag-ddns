# AG-DDNS

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.22+-007acc?style=flat-square&logo=express)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker)
![Lang](https://img.shields.io/badge/Lang-ZH%20%2F%20EN-e05d44?style=flat-square)

<p align="center">
  <a href="#简体中文">简体中文</a> • 
  <a href="#english">English</a>
</p>

---

## 简体中文

AG-DDNS 是一个轻量级、无依赖的客户端/服务端（C/S）架构动态域名解析（DDNS）管理系统。它不仅提供美观直观的 Web 配置面板，还能够一键导出完全独立、免安装的 Python 或 Bash 脚本。

### 核心功能

*   **极简服务端**：几行命令即可部署，自带精美响应式 Web 仪表盘，可以轻松监控、修改所有任务。
*   **双重运行模式**：
    *   **本地执行模式**：由服务端自动轮询本机公网 IP 并更新 DNS。
    *   **远程代理模式**：轻量级客户端（Client Agent）运行在内网主机上，获取 IP 后安全上报给中心服务端，由服务端完成 DNS 解析更新。
*   **多服务商支持**：全面兼容 **Cloudflare**、**阿里云**、**腾讯云 (DNSPod)**、**华为云**、**HE.net**、**NameSilo**、**No-IP**、**ClouDNS**、**DNS.com**，以及支持自定义 Webhook 回调（Callback）。
*   **免依赖脚本导出**：支持将配置一键导出为纯净的独立脚本（Python 或 Bash），支持自动本地写日志（保存至同级目录 `ddns.log`），适合嵌入路由器、NAS 或直接挂载在 `crontab` 中运行。
*   **极佳的安全防噪**：内置 IP 变动对比缓存，只有 IP 真实变化时才会触发域名服务商 API，同时在代理模式下如果客户端超时未上报，服务端会自动报警记录日志。

---

### 服务端部署

#### 1. 运行环境准备
*   需要 Node.js (v18 或更高版本)

#### 2. 安装与运行
在项目根目录下执行：
```bash
# 安装轻量级依赖
npm install

# 启动服务端（默认端口，优先使用数据库中的设置端口，无设置则为 8080）
npm start

# 指定端口启动服务端
# 方法 A：使用命令行参数启动（支持 --port, -p 或直接跟端口号数字）
node server/server.js -p 9000
node server/server.js 9000

# 方法 B：通过 npm 启动并传参（使用 -- 传参给实际执行的 node 进程）
npm start -- --port 9000
npm start -- 9000

# 方法 C：使用 PORT 环境变量启动
PORT=9000 npm start
```

#### 3. 访问与配置
服务端成功运行后会输出以下日志：
```text
=========================================
 AG-DDNS 服务端启动成功
 端口号:  8080
 面板网址: http://localhost:8080
=========================================
```
1. 在浏览器中打开 `http://localhost:8080`（若为本地运行）。
2. 即可直接访问并使用 Web 控制台配置各项域名解析任务。

#### 4. Docker 部署 (可选)
我们也提供了容器化运行方案。由于程序需要本地保存任务和设置，建议挂载主机卷持久化保存数据。

##### 使用 Docker Compose 运行 (推荐)
直接在项目根目录下执行：
```bash
docker-compose up -d
```
默认会在后台运行，映射端口为 `8080`，所有配置文件与运行记录会保存在当前目录下的 `./data` 目录中。

##### 使用原生 Docker 运行
1. 构建容器镜像：
   ```bash
   docker build -t ag-ddns .
   ```
2. 启动容器：
   ```bash
   docker run -d --name ag-ddns -p 8080:8080 -v $(pwd)/data:/app/server/data ag-ddns
   ```

---

### 客户端代理部署 (Client Agent)

如果你需要解析处于内网、NAT 后面的机器，可以在这些机器上部署这个轻量客户端。

#### 1. 快速初始化
在客户端机器上单独拷贝 `client/client.js` 文件，然后运行一次以自动生成配置模板：
```bash
node client.js
```

#### 2. 修改配置
编辑同级目录下新生成的 `client/config.json`：
```json
{
  "serverUrl": "http://你的服务端IP:8080",
  "clientKey": "在服务端创建任务时分配的 clientKey",
  "recordType": "A",
  "ipSource": "public",
  "ipInterface": "",
  "ipUrl": "",
  "checkInterval": 5
}
```

*   **`ipSource`** 说明：
    *   `public`：自动查询常见公网 IP 接口（如 ipify、ident.me 等）。
    *   `interface`：获取指定的本地网卡 IP（例如 `eth0`、`en0`），适合有直连公网 IPv6 的场景。
    *   `url`：从你自定义的纯文本 API 接口获取 IP。

#### 3. 运行客户端
```bash
# 默认运行（使用 config.json 中配置的 serverUrl）
node client.js

# 指定临时端口覆盖上报的目标服务器端口
# 方法 A：使用命令行参数启动（支持 --port, -p 或直接跟端口号数字）
node client.js -p 9000
node client.js 9000

# 方法 B：使用 PORT 环境变量启动
PORT=9000 node client.js
```

> [!TIP]
> **Linux 下配置为开机自启系统服务**：
> 创建服务文件 `/etc/systemd/system/ddns-agent.service`：
> ```ini
> [Unit]
> Description=AG-DDNS Client Agent
> After=network.target
> 
> [Service]
> Type=simple
> User=nobody
> WorkingDirectory=/path/to/client/dir
> ExecStart=/usr/bin/node client.js
> Restart=on-failure
> 
> [Install]
> WantedBy=multi-user.target
> ```
> 运行命令激活服务：
> `sudo systemctl enable --now ddns-agent.service`

#### 4. 使用 Docker 部署客户端 (可选)
我们为客户端代理也提供了 Docker 支持，适合在群晖 NAS、无 Node.js 环境的软路由等设备上运行。
1. 构建客户端 Docker 镜像：
   ```bash
   docker build -t ag-ddns-client -f client/Dockerfile client
   ```
2. 运行客户端容器（挂载宿主机配置文件以持久化配置及 IP 缓存）：
   在宿主机指定目录先准备好 `config.json`（可拷贝默认配置模版修改），然后运行：
   ```bash
   docker run -d \
     --name ag-ddns-client \
     -v /path/to/host/config.json:/app/config.json \
     -v /path/to/host/ip.cache:/app/ip.cache \
     ag-ddns-client
   ```

---

### 独立导出脚本使用说明

在 Web 面板上配置好任务后，可以直接点击 **导出脚本** 下载 Bash 或 Python 脚本。

1.  **开箱即用**：导出的脚本已经把你的密钥、域名和配置封装好了，不需要安装任何依赖包。
2.  **持久日志**：脚本每次运行都会在同级目录下自动创建或追加写入 `ddns.log`。
3.  **定时任务设置 (Cron)**：
    将导出的脚本（以 Python 脚本为例）复制到目标机器上，并添加定时任务：
    ```bash
    crontab -e
    ```
    添加以下行以实现每 5 分钟执行一次（注意使用绝对路径）：
    ```text
    */5 * * * * /usr/bin/python3 /path/to/ddns_yourdomain.py >/dev/null 2>&1
    ```

---

## English

AG-DDNS is a lightweight, zero-dependency client/server (C/S) dynamic DNS (DDNS) management utility. It features a modern, responsive web dashboard and offers one-click generation of fully standalone Python or Bash scripts.

### Key Features

*   **Simple Server Deployment**: Get up and running in seconds. Manage and monitor all domains from a responsive and elegant Web dashboard.
*   **Dual Mode Architecture**:
    *   **Local Server Execution**: The server periodically resolves its public IP and updates the configured DNS records.
    *   **Remote Client Agent**: A lightweight script runs on the target machine (e.g., behind NAT/routers) and reports its IP address back to the server securely.
*   **Wide Provider Support**: Out-of-the-box support for **Cloudflare**, **Aliyun**, **Tencent Cloud (DNSPod)**, **Huawei Cloud**, **HE.net**, **NameSilo**, **No-IP**, **ClouDNS**, **DNS.com**, and custom Webhook/Callback integrations.
*   **Dependency-Free Exporter**: Export custom Python or Bash scripts containing all necessary settings. The exported scripts run natively (e.g. via crontab) and append execution records to `ddns.log` automatically.
*   **Smart API Saving**: Built-in cache compares current IP to the last successfully updated IP, avoiding redundant calls to DNS API endpoints. In remote client mode, the server logs a connection timeout alert if the client drops offline.

---

### Server Setup

#### 1. Prerequisite
*   Node.js (v18 or higher) installed.

#### 2. Installation & Launch
Run the following commands in the project root:
```bash
# Install lightweight dependencies
npm install

# Start the server (defaults to port in database settings, or 8080)
npm start

# Start the server on a custom port
# Method A: Specify via CLI arguments (supports --port, -p, or positional port number)
node server/server.js -p 9000
node server/server.js 9000

# Method B: Pass arguments via npm start (use -- to pass to the underlying process)
npm start -- --port 9000
npm start -- 9000

# Method C: Specify via PORT environment variable
PORT=9000 npm start
```

#### 3. Accessing the Dashboard
When started successfully, the console will print:
```text
=========================================
 AG-DDNS Server Started Successfully
  Port: 8080
  Dashboard URL: http://localhost:8080
=========================================
```
1. Open `http://localhost:8080` in your web browser.
2. You can directly access and configure your domain DDNS tasks.

#### 4. Docker Deployment (Optional)
We also provide a containerized setup for deployment. To persist database settings and configurations, make sure to mount a host directory as a volume.

##### Using Docker Compose (Recommended)
Run the following command in the project root:
```bash
docker-compose up -d
```
By default, this will run in the background, mapping port `8080` and saving database settings locally inside the `./data` directory on the host.

##### Using Native Docker CLI
1. Build the image:
   ```bash
   docker build -t ag-ddns .
   ```
2. Start the container with port binding and volume persistence:
   ```bash
   docker run -d --name ag-ddns -p 8080:8080 -v $(pwd)/data:/app/server/data ag-ddns
   ```

---

### Client Agent Deployment

For machines behind NAT, home routers, or without direct incoming connections, use the Client Agent.

#### 1. Quick Start
Copy `client/client.js` to the client machine and execute once to generate the config file:
```bash
node client.js
```

#### 2. Edit Settings
Open the newly created `client/config.json` and configure:
```json
{
  "serverUrl": "http://your-server-ip:8080",
  "clientKey": "The unique clientKey assigned on your task page",
  "recordType": "A",
  "ipSource": "public",
  "ipInterface": "",
  "ipUrl": "",
  "checkInterval": 5
}
```

*   **`ipSource` Options**:
    *   `public`: Resolves public IP via standard lookup APIs (e.g., ipify, ident.me).
    *   `interface`: Fetches the IP directly from a local network interface card (e.g., `eth0`, `en0`). Great for native IPv6 setups.
    *   `url`: Fetches IP address from a custom text-only API.

#### 3. Run the Agent
```bash
# Start normally (uses serverUrl from config.json)
node client.js

# Start with a custom port override for the target server url
# Method A: Specify via CLI arguments (supports --port, -p, or positional port number)
node client.js -p 9000
node client.js 9000

# Method B: Specify via PORT environment variable
PORT=9000 node client.js
```

> [!TIP]
> **Running as a systemd service (Linux)**:
> Create `/etc/systemd/system/ddns-agent.service`:
> ```ini
> [Unit]
> Description=AG-DDNS Client Agent
> After=network.target
> 
> [Service]
> Type=simple
> User=nobody
> WorkingDirectory=/path/to/client/dir
> ExecStart=/usr/bin/node client.js
> Restart=on-failure
> 
> [Install]
> WantedBy=multi-user.target
> ```
> Enable and start the service:
> `sudo systemctl enable --now ddns-agent.service`

#### 4. Running Client Agent with Docker (Optional)
We also provide Docker support for the client agent, which is suitable for container environments like Synology NAS or routers without native Node.js support.
1. Build the client Docker image:
   ```bash
   docker build -t ag-ddns-client -f client/Dockerfile client
   ```
2. Start the container (mount host config and cache to persist state):
   Prepare your `config.json` on the host machine first, then run:
   ```bash
   docker run -d \
     --name ag-ddns-client \
     -v /path/to/host/config.json:/app/config.json \
     -v /path/to/host/ip.cache:/app/ip.cache \
     ag-ddns-client
   ```

---

### Standalone Exported Scripts

Download fully configured Bash or Python scripts straight from the Web UI:

1.  **Zero Dependencies**: Run them anywhere with standard shell utilities or Python standard libraries.
2.  **Execution Logs**: Each run appends a log entry to `ddns.log` in the same directory as the script.
3.  **Cron Integration**:
    Upload the script (e.g., Python script) to the host and add a cron entry:
    ```bash
    crontab -e
    ```
    Add this line to execute it every 5 minutes (make sure to use absolute paths):
    ```text
    */5 * * * * /usr/bin/python3 /path/to/ddns_yourdomain.py >/dev/null 2>&1
    ```

---

## License

This project is licensed under the [MIT License](LICENSE).
