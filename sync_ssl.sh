#!/bin/bash
# ----------------- 配置信息 -----------------
API_URL="http://localhost:8001/api/client/certs"
CLIENT_KEY="key_260xuqbup97mpz4apmn"
DOMAIN="*.cyfee.com"
CERT_DIR="/etc/nginx/ssl"
CERT_PATH="$CERT_DIR/server.crt"
KEY_PATH="$CERT_DIR/server.key"
# -------------------------------------------

mkdir -p "$CERT_DIR"

# 1. 发起 POST 请求获取最新证书 JSON
RESPONSE=$(curl -s --fail -X POST -H "Content-Type: application/json" \
  -d "{\"clientKey\":\"$CLIENT_KEY\",\"domain\":\"$DOMAIN\"}" \
  "$API_URL")

# 2. 检查网络请求是否成功
if [ $? -ne 0 ] || [ -z "$RESPONSE" ]; then
  echo "Error: 无法从服务器获取证书数据，请检查服务状态或 API 链接。" >&2
  exit 1
fi

# 3. 解析证书和私钥 (使用 printf %s 安全输出，避免 echo 转义导致 jq 解析报错)
CERT=$(printf '%s\n' "$RESPONSE" | jq -r '.cert' 2>/dev/null)
KEY=$(printf '%s\n' "$RESPONSE" | jq -r '.key' 2>/dev/null)

# 4. 校验解析结果
if [ -z "$CERT" ] || [ "$CERT" = "null" ] || [ -z "$KEY" ] || [ "$KEY" = "null" ]; then
  echo "Error: 证书数据解析失败。服务器响应内容为:" >&2
  printf '%s\n' "$RESPONSE" >&2
  exit 1
fi

# 5. 写入到本地证书文件
printf '%s\n' "$CERT" > "$CERT_PATH"
printf '%s\n' "$KEY" > "$KEY_PATH"

echo "Success: SSL 证书已成功拉取并保存至 $CERT_PATH !"

# 6. 重载 Nginx 服务 (可根据系统环境调整)
if command -v nginx >/dev/null 2>&1; then
  nginx -s reload
  echo "Success: Nginx 服务已成功重载！"
else
  echo "Warning: 未检测到 nginx 命令，跳过重载操作。"
fi
