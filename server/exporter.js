/**
 * 脚本导出模块，用来生成不需要任何依赖的 Python/Bash 独立运行脚本
 */

// 过滤转义 Bash 脚本中的参数值
function escapeBash(val) {
  if (val === null || val === undefined) return '';
  return val.toString().replace(/'/g, "'\\''");
}

// 过滤转义 Python 脚本中的参数值
function escapePython(val) {
  if (val === null || val === undefined) return '';
  return val.toString().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * 生成独立的 Python 脚本
 */
export function generatePython(task, settings = {}) {
  const { domain, recordType, provider, credentials, ttl, proxied } = task;
  const targetTtl = ttl || 600;
  
  const customInfo = settings.scriptInfo || '';
  let customHeader = '';
  if (customInfo) {
    customHeader = customInfo.split('\n').map(line => `# ${line}`).join('\n') + '\n\n';
  }
  
  let providerCode = '';
  
  if (provider === 'cloudflare') {
    const credToken = credentials.token ? `'${escapePython(credentials.token)}'` : 'None';
    const credEmail = credentials.email ? `'${escapePython(credentials.email)}'` : 'None';
    const credKey = credentials.key ? `'${escapePython(credentials.key)}'` : 'None';
    const credZone = credentials.zoneId ? `'${escapePython(credentials.zoneId)}'` : 'None';
    const cfProxied = (recordType === 'A' || recordType === 'AAAA' || recordType === 'CNAME') && proxied ? 'True' : 'False';
    
    providerCode = `
# Cloudflare 接口配置
CF_TOKEN = ${credToken}
CF_EMAIL = ${credEmail}
CF_KEY = ${credKey}
CF_ZONE_ID = ${credZone}
CF_PROXIED = ${cfProxied}

def get_headers():
    headers = {"Content-Type": "application/json"}
    if CF_TOKEN:
        headers["Authorization"] = f"Bearer {CF_TOKEN}"
    elif CF_EMAIL and CF_KEY:
        headers["X-Auth-Email"] = CF_EMAIL
        headers["X-Auth-Key"] = CF_KEY
    else:
        raise Exception("Cloudflare 需要提供 Token 或者 Email+Key")
    return headers

def get_apex_domain(domain):
    parts = domain.split('.')
    if len(parts) <= 2: return domain
    is_second_level = parts[-2].lower() in ["com", "net", "org", "gov", "edu", "co"] and len(parts[-1]) == 2
    if is_second_level and len(parts) > 2:
        return '.'.join(parts[-3:])
    return '.'.join(parts[-2:])

def get_zone_id(domain, headers):
    if CF_ZONE_ID:
        return CF_ZONE_ID
    apex = get_apex_domain(domain)
    url = f"https://api.cloudflare.com/client/v4/zones?name={urllib.parse.quote(apex)}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode('utf-8'))
        if not data.get("success") or not data.get("result"):
            raise Exception(f"无法获取 Zone ID: {data.get('errors')}")
        return data["result"][0]["id"]

def update_ddns(ip):
    headers = get_headers()
    zone_id = get_zone_id(DOMAIN, headers)
    
    # 查询域名下现有的解析记录
    list_url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?type={RECORD_TYPE}&name={urllib.parse.quote(DOMAIN)}"
    req = urllib.request.Request(list_url, headers=headers)
    record = None
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode('utf-8'))
        if not data.get("success"):
            raise Exception(f"查询 DNS 记录失败: {data.get('errors')}")
        if data.get("result"):
            record = data["result"][0]
            
    payload = {
        "type": RECORD_TYPE,
        "name": DOMAIN,
        "content": ip,
        "ttl": TTL,
        "proxied": CF_PROXIED
    }
    
    body = json.dumps(payload).encode('utf-8')
    
    if record:
        if record["content"] == ip:
            log_info(f"IP {ip} 相比上次没有变化，跳过更新。")
            return True
        log_info(f"正在更新已有的 DNS 记录 {record['id']} 为 {ip}...")
        url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record['id']}"
        req = urllib.request.Request(url, data=body, headers=headers, method='PUT')
    else:
        log_info(f"正在创建新的 DNS 记录 {DOMAIN} 为 {ip}...")
        url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"
        req = urllib.request.Request(url, data=body, headers=headers, method='POST')
        
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode('utf-8'))
        if not data.get("success"):
            raise Exception(f"保存记录失败: {data.get('errors')}")
        log_info("Cloudflare DNS 记录更新成功。")
    return True
`;
  } else if (provider === 'dnspod') {
    providerCode = `
# DNSPod 接口配置
DP_ID = '${escapePython(credentials.id)}'
DP_TOKEN = '${escapePython(credentials.token)}'

def get_apex_domain(domain):
    parts = domain.split('.')
    if len(parts) <= 2: return domain
    is_second_level = parts[-2].lower() in ["com", "net", "org", "gov", "edu", "co"] and len(parts[-1]) == 2
    if is_second_level and len(parts) > 2:
        return '.'.join(parts[-3:])
    return '.'.join(parts[-2:])

def split_domain(domain):
    apex = get_apex_domain(domain)
    sub = '@'
    if domain != apex:
        sub = domain[:-len(apex)-1]
    return apex, sub

def request_dnspod(action, params):
    url = f"https://dnsapi.cn/{action}"
    payload = {
        "login_token": f"{DP_ID},{DP_TOKEN}",
        "format": "json",
        **params
    }
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AG-DDNS/1.0.0"
    })
    with urllib.request.urlopen(req) as res:
        res_data = json.loads(res.read().decode('utf-8'))
        status = res_data.get("status", {})
        if status.get("code") != "1":
            if action == "Record.List" and status.get("code") == "10":
                return {"records": []}
            raise Exception(f"DNSPod 接口错误 ({status.get('code')}): {status.get('message')}")
        return res_data

def update_ddns(ip):
    apex, sub = split_domain(DOMAIN)
    
    # 获取已有的 DNS 解析记录
    list_data = request_dnspod("Record.List", {
        "domain": apex,
        "sub_domain": sub,
        "record_type": RECORD_TYPE
    })
    
    records = list_data.get("records", [])
    record = records[0] if records else None
    
    params = {
        "domain": apex,
        "sub_domain": sub,
        "record_type": RECORD_TYPE,
        "record_line": "默认",
        "value": ip,
        "ttl": TTL
    }
    
    if record:
        if record["value"] == ip:
            log_info(f"IP {ip} 相比上次没有变化，跳过更新。")
            return True
        log_info(f"正在更新已有的 DNSPod 记录 {record['id']} 为 {ip}...")
        request_dnspod("Record.Modify", {
            **params,
            "record_id": record["id"]
        })
    else:
        log_info(f"正在创建新的 DNSPod 记录 {DOMAIN} 为 {ip}...")
        request_dnspod("Record.Create", params)
        
    log_info("DNSPod DNS 记录更新成功。")
    return True
`;
  } else if (provider === 'aliyun') {
    providerCode = `
# 阿里云接口配置
ALI_KEY_ID = '${escapePython(credentials.id)}'
ALI_SECRET = '${escapePython(credentials.secret)}'

import hmac
import hashlib
import base64
from datetime import datetime
import random

def percent_encode(val):
    s = str(val)
    res = urllib.parse.quote(s, safe='')
    res = res.replace('+', '%20').replace('*', '%2A').replace('%7E', '~')
    return res

def aliyun_sign(params):
    sorted_keys = sorted(params.keys())
    qs = '&'.join([f"{percent_encode(k)}={percent_encode(params[k])}" for k in sorted_keys])
    string_to_sign = f"GET&{percent_encode('/')}&{percent_encode(qs)}"
    key = (ALI_SECRET + '&').encode('utf-8')
    h = hmac.new(key, string_to_sign.encode('utf-8'), hashlib.sha1)
    return base64.b64encode(h.digest()).decode('utf-8')

def request_aliyun(action, params):
    sys_params = {
        "Format": "JSON",
        "Version": "2015-01-09",
        "AccessKeyId": ALI_KEY_ID,
        "SignatureMethod": "HMAC-SHA1",
        "Timestamp": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        "SignatureVersion": "1.0",
        "SignatureNonce": str(random.random()) + str(int(time.time() * 1000)),
        "Action": action,
        **params
    }
    
    sys_params["Signature"] = aliyun_sign(sys_params)
    
    url_parts = [f"{percent_encode(k)}={percent_encode(sys_params[k])}" for k in sys_params]
    url = f"https://alidns.aliyuncs.com/?{'&'.join(url_parts)}"
    
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode('utf-8'))
            return res_data
    except urllib.error.HTTPError as e:
        err_data = json.loads(e.read().decode('utf-8'))
        raise Exception(f"阿里云接口错误 ({err_data.get('Code')}): {err_data.get('Message')}")

def get_apex_domain(domain):
    parts = domain.split('.')
    if len(parts) <= 2: return domain
    is_second_level = parts[-2].lower() in ["com", "net", "org", "gov", "edu", "co"] and len(parts[-1]) == 2
    if is_second_level and len(parts) > 2:
        return '.'.join(parts[-3:])
    return '.'.join(parts[-2:])

def split_domain(domain):
    apex = get_apex_domain(domain)
    sub = '@'
    if domain != apex:
        sub = domain[:-len(apex)-1]
    return apex, sub

def update_ddns(ip):
    apex, sub = split_domain(DOMAIN)
    
    # 获取已有的 DNS 解析列表
    list_data = request_aliyun("DescribeDomainRecords", {
        "DomainName": apex,
        "RRKeyWord": sub,
        "TypeKeyWord": RECORD_TYPE
    })
    
    records = list_data.get("DomainRecords", {}).get("Record", [])
    record = None
    for r in records:
        if r.get("RR") == sub and r.get("Type") == RECORD_TYPE:
            record = r
            break
            
    if record:
        if record["Value"] == ip:
            log_info(f"IP {ip} 相比上次没有变化，跳过更新。")
            return True
        log_info(f"正在更新阿里云解析记录 {record['RecordId']} 为 {ip}...")
        request_aliyun("UpdateDomainRecord", {
            "RecordId": record["RecordId"],
            "RR": sub,
            "Type": RECORD_TYPE,
            "Value": ip,
            "TTL": TTL
        })
    else:
        log_info(f"正在创建新的阿里云解析记录 {DOMAIN} 为 {ip}...")
        request_aliyun("AddDomainRecord", {
            "DomainName": apex,
            "RR": sub,
            "Type": RECORD_TYPE,
            "Value": ip,
            "TTL": TTL
        })
        
    log_info("阿里云 DNS 解析记录更新成功。")
    return True
`;
  }

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
${customHeader}# 本脚本由 AG-DDNS 自动导出生成。
# 这是一个独立的、零依赖的 Python 脚本。

import urllib.request
import urllib.parse
import urllib.error
import json
import os
import sys
import time
from datetime import datetime

# 基础参数配置
DOMAIN = '${escapePython(domain)}'
RECORD_TYPE = '${escapePython(recordType)}'
TTL = ${targetTtl}
CACHE_FILE = "/tmp/ddns_cache_${escapePython(domain)}.ip"

# 脚本所在目录及日志配置
SCRIPT_DIR = os.path.dirname(os.path.abspath(sys.argv[0]))
LOG_FILE = os.path.join(SCRIPT_DIR, "ddns.log")

def log_info(msg):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_line = f"[{timestamp}] [INFO] {msg}"
    print(log_line)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_line + '\\n')
    except Exception:
        pass

def log_err(msg):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_line = f"[{timestamp}] [ERROR] {msg}"
    print(log_line, file=sys.stderr)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_line + '\\n')
    except Exception:
        pass

# 自定义公网 IP 检测接口
IP_SERVICES = {
  "A": [
    "http://ip.3322.net",
    "https://ddns.oray.com/checkip",
    "https://myip.ipip.net",
    "https://api.ipify.org",
    "https://icanhazip.com",
    "https://ident.me"
  ],
  "AAAA": [
    "https://speed.neu6.edu.cn/getIP.php",
    "https://api6.ipify.org",
    "https://icanhazip.com",
    "https://ident.me"
  ]
}

import re

def get_current_ip():
    urls = IP_SERVICES.get(RECORD_TYPE, IP_SERVICES["A"])
    if RECORD_TYPE == "AAAA":
        ip_regex = r"[0-9a-fA-F:]+:[0-9a-fA-F:]+"
    elif RECORD_TYPE == "A":
        ip_regex = r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    else:
        ip_regex = r".+" # 匹配任意字符串
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=6) as response:
                text = response.read().decode('utf-8').strip()
                match = re.search(ip_regex, text)
                if match:
                    return match.group(0)
        except Exception as e:
            log_err(f"从接口 {url} 获取 IP 失败: {e}")
    return None

def check_cache(ip):
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                cached_ip = f.read().strip()
                if cached_ip == ip:
                    return True
        except Exception:
            pass
    return False

def save_cache(ip):
    try:
        with open(CACHE_FILE, 'w') as f:
            f.write(ip)
    except Exception as e:
        log_err(f"警告：保存 IP 缓存文件失败: {e}")

${providerCode}

def main():
    log_info(f"开始执行 DDNS 状态检测 {DOMAIN} ({RECORD_TYPE})...")
    ip = get_current_ip()
    if not ip:
        log_err("错误：未获取到当前的公网 IP 地址。")
        sys.exit(1)
        
    log_info(f"当前的公网 IP 地址: {ip}")
    
    if check_cache(ip):
        log_info("IP 相比上次没有变化，跳过更新。")
        sys.exit(0)
        
    try:
        if update_ddns(ip):
            save_cache(ip)
            log_info("DDNS 记录更新成功。")
    except Exception as e:
        log_err(f"更新 DDNS 记录发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
}

/**
 * 生成独立的 Bash 脚本
 */
export function generateBash(task, settings = {}) {
  const { domain, recordType, provider, credentials, ttl, proxied } = task;
  const targetTtl = ttl || 600;
  
  const customInfo = settings.scriptInfo || '';
  let customHeader = '';
  if (customInfo) {
    customHeader = customInfo.split('\n').map(line => `# ${line}`).join('\n') + '\n\n';
  }
  
  let providerCode = '';
  
  if (provider === 'cloudflare') {
    const credToken = credentials.token ? escapeBash(credentials.token) : '';
    const credEmail = credentials.email ? escapeBash(credentials.email) : '';
    const credKey = credentials.key ? escapeBash(credentials.key) : '';
    const credZone = credentials.zoneId ? escapeBash(credentials.zoneId) : '';
    const cfProxied = (recordType === 'A' || recordType === 'AAAA' || recordType === 'CNAME') && proxied ? 'true' : 'false';
    
    providerCode = `
# Cloudflare 接口配置
CF_TOKEN="${credToken}"
CF_EMAIL="${credEmail}"
CF_KEY="${credKey}"
CF_ZONE_ID="${credZone}"
CF_PROXIED="${cfProxied}"

get_headers() {
  if [ -n "$CF_TOKEN" ]; then
    echo "Authorization: Bearer $CF_TOKEN"
  else
    echo "X-Auth-Email: $CF_EMAIL"
    echo "X-Auth-Key: $CF_KEY"
  fi
}

get_apex_domain() {
  local domain="$1"
  # 提取根域名的简易解析逻辑
  echo "$domain" | awk -F. '{
    n=NF
    if (n <= 2) {
      print $0
    } else {
      # 检查是否是双后缀域名，如 .com.cn
      s=$(n-1)
      if (s == "com" || s == "net" || s == "org" || s == "gov" || s == "edu" || s == "co") {
        print $(n-2)"."$(n-1)"."$n
      } else {
        print $(n-1)"."$n
      }
    }
  }'
}

get_zone_id() {
  if [ -n "$CF_ZONE_ID" ]; then
    echo "$CF_ZONE_ID"
    return
  fi
  local apex=$(get_apex_domain "$DOMAIN")
  local headers_val=$(get_headers)
  local response
  response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$apex" \\
    -H "Content-Type: application/json" \\
    -H "$headers_val")
    
  local zone_id
  zone_id=$(echo "$response" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)
  if [ -z "$zone_id" ]; then
    log_err "无法获取 Zone ID。Cloudflare API 响应内容: $response"
    exit 1
  fi
  echo "$zone_id"
}

update_ddns() {
  local ip="$1"
  local zone_id=$(get_zone_id)
  local headers_val=$(get_headers)
  
  # 查询现有的 DNS 记录
  local list_response
  list_response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?type=$RECORD_TYPE&name=$DOMAIN" \\
    -H "Content-Type: application/json" \\
    -H "$headers_val")
    
  local record_id
  local record_ip
  record_id=$(echo "$list_response" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)
  record_ip=$(echo "$list_response" | grep -o '"content":"[^"]*' | head -n 1 | cut -d'"' -f4)
  
  if [ "$record_ip" = "$ip" ]; then
    log_info "IP $ip 相比上次没有变化，跳过更新。"
    return 0
  fi
  
  local payload
  payload=$(cat <<EOF
{
  "type": "$RECORD_TYPE",
  "name": "$DOMAIN",
  "content": "$ip",
  "ttl": $TTL,
  "proxied": $CF_PROXIED
}
EOF
)

  local res
  if [ -n "$record_id" ]; then
    log_info "正在更新已有的 Cloudflare 记录 $record_id 为 $ip..."
    res=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$record_id" \\
      -H "Content-Type: application/json" \\
      -H "$headers_val" \\
      -d "$payload")
  else
    log_info "正在创建新的 Cloudflare 记录..."
    res=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \\
      -H "Content-Type: application/json" \\
      -H "$headers_val" \\
      -d "$payload")
  fi
  
  local success
  success=$(echo "$res" | grep -o '"success":[^,]*' | head -n 1 | cut -d':' -f2)
  if [ "$success" = "true" ]; then
    log_info "Cloudflare DNS 解析记录更新成功。"
    return 0
  else
    log_err "更新 DNS 记录失败: $res"
    return 1
  fi
}
`;
  } else if (provider === 'dnspod') {
    const credId = credentials.id ? escapeBash(credentials.id) : '';
    const credToken = credentials.token ? escapeBash(credentials.token) : '';
    
    providerCode = `
# DNSPod 接口配置
DP_ID="${credId}"
DP_TOKEN="${credToken}"

get_apex_domain() {
  local domain="$1"
  echo "$domain" | awk -F. '{
    n=NF
    if (n <= 2) {
      print $0
    } else {
      s=$(n-1)
      if (s == "com" || s == "net" || s == "org" || s == "gov" || s == "edu" || s == "co") {
        print $(n-2)"."$(n-1)"."$n
      } else {
        print $(n-1)"."$n
      }
    }
  }'
}

split_domain() {
  local domain="$1"
  local apex=$(get_apex_domain "$domain")
  local sub="@"
  if [ "$domain" != "$apex" ]; then
    # 从域名末尾剥离根域名
    sub=\${domain%.$apex}
  fi
  echo "$apex $sub"
}

request_dnspod() {
  local action="$1"
  shift
  local params=("$@")
  
  local data="login_token=$DP_ID,$DP_TOKEN&format=json"
  for param in "\${params[@]}"; do
    data="$data&$param"
  done
  
  curl -s -X POST "https://dnsapi.cn/$action" \\
    -H "Content-Type: application/x-www-form-urlencoded" \\
    -A "AG-DDNS/1.0.0" \\
    -d "$data"
}

update_ddns() {
  local ip="$1"
  local domain_parts=($(split_domain "$DOMAIN"))
  local apex="\${domain_parts[0]}"
  local sub="\${domain_parts[1]}"
  
  # 列出已有的解析记录
  local list_response
  list_response=$(request_dnspod "Record.List" "domain=$apex" "sub_domain=$sub" "record_type=$RECORD_TYPE")
  
  local status_code
  status_code=$(echo "$list_response" | grep -o '"code":"[^"]*' | head -n 1 | cut -d'"' -f4)
  
  # 如果返回码不是 1 且不是 10 (表示记录不存在)，则报错
  if [ "$status_code" != "1" ] && [ "$status_code" != "10" ]; then
    local status_msg=$(echo "$list_response" | grep -o '"message":"[^"]*' | head -n 1 | cut -d'"' -f4)
    log_err "DNSPod Error ($status_code): $status_msg"
    return 1
  fi
  
  local record_id
  local record_ip
  if [ "$status_code" = "1" ]; then
    record_id=$(echo "$list_response" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)
    record_ip=$(echo "$list_response" | grep -o '"value":"[^"]*' | head -n 1 | cut -d'"' -f4)
  fi
  
  if [ "$record_ip" = "$ip" ]; then
    log_info "IP $ip 相比上次没有变化，跳过更新。"
    return 0
  fi
  
  local res
  if [ -n "$record_id" ]; then
    log_info "正在更新已有的 DNSPod 记录 $record_id 为 $ip..."
    res=$(request_dnspod "Record.Modify" "domain=$apex" "sub_domain=$sub" "record_type=$RECORD_TYPE" "record_line=默认" "value=$ip" "ttl=$TTL" "record_id=$record_id")
  else
    log_info "正在创建新的 DNSPod 记录 $DOMAIN 为 $ip..."
    res=$(request_dnspod "Record.Create" "domain=$apex" "sub_domain=$sub" "record_type=$RECORD_TYPE" "record_line=默认" "value=$ip" "ttl=$TTL")
  fi
  
  local final_code
  final_code=$(echo "$res" | grep -o '"code":"[^"]*' | head -n 1 | cut -d'"' -f4)
  if [ "$final_code" = "1" ]; then
    log_info "DNSPod DNS 解析记录更新成功。"
    return 0
  else
    local final_msg=$(echo "$res" | grep -o '"message":"[^"]*' | head -n 1 | cut -d'"' -f4)
    log_err "DNSPod modification failed: $final_msg"
    return 1
  fi
}
`;
  } else if (provider === 'aliyun') {
    const credId = credentials.id ? escapeBash(credentials.id) : '';
    const credSecret = credentials.secret ? escapeBash(credentials.secret) : '';
    
    providerCode = `
# 阿里云接口配置
ALI_KEY_ID="${credId}"
ALI_SECRET="${credSecret}"

percent_encode() {
  local string="\${1}"
  local strlen=\${#string}
  local encoded=""
  local pos c o
  for (( pos=0 ; pos<strlen ; pos++ )); do
     c=\${string:$pos:1}
     case "$c" in
        [-_.~a-zA-Z0-9] ) encoded="\${encoded}\${c}" ;;
        * ) printf -v o '%%%02X' "'$c"
            encoded="\${encoded}\${o}" ;;
     esac
  done
  echo "\${encoded}"
}

aliyun_sign() {
  local params_query="$1"
  local string_to_sign="GET&$(percent_encode "/")&$(percent_encode "$params_query")"
  local key="$ALI_SECRET&"
  
  if command -v openssl >/dev/null 2>&1; then
    echo -n "$string_to_sign" | openssl dgst -sha1 -hmac "$key" -binary | base64
  else
    # 备用方案：使用 Python 进行签名计算
    python3 -c "import hmac, hashlib, base64; print(base64.b64encode(hmac.new(b'$key', b'$string_to_sign', hashlib.sha1).digest()).decode('utf-8'))"
  fi
}

request_aliyun() {
  local action="$1"
  shift
  local params=("$@")
  
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local nonce="\${RANDOM}\$(date +%s%N)"
  
  # 声明参数数组以进行排序
  local -a query_parts
  query_parts+=("AccessKeyId=$ALI_KEY_ID")
  query_parts+=("Action=$action")
  query_parts+=("Format=JSON")
  query_parts+=("SignatureMethod=HMAC-SHA1")
  query_parts+=("SignatureNonce=$nonce")
  query_parts+=("SignatureVersion=1.0")
  query_parts+=("Timestamp=$timestamp")
  query_parts+=("Version=2015-01-09")
  
  for p in "\${params[@]}"; do
    query_parts+=("$p")
  done
  
  # 对请求参数按字母表顺序排序
  local sorted_query
  sorted_query=$(printf "%s\\n" "\${query_parts[@]}" | sort | tr '\\n' '&' | sed 's/&$//')
  
  # 构建经过 UrlEncode 转义的签名请求字符串
  local sorted_encoded=""
  local first=true
  local sorted_arr
  IFS='&' read -r -a sorted_arr <<< "$sorted_query"
  for kv in "\${sorted_arr[@]}"; do
    local k="\${kv%%=*}"
    local v="\${kv#*=}"
    local ek=$(percent_encode "$k")
    local ev=$(percent_encode "$v")
    if [ "$first" = true ]; then
      sorted_encoded="$ek=$ev"
      first=false
    else
      sorted_encoded="$sorted_encoded&$ek=$ev"
    fi
  done
  
  local signature=$(aliyun_sign "$sorted_encoded")
  local esig=$(percent_encode "$signature")
  
  local url="https://alidns.aliyuncs.com/?$sorted_encoded&Signature=$esig"
  curl -s "$url"
}

get_apex_domain() {
  local domain="$1"
  echo "$domain" | awk -F. '{
    n=NF
    if (n <= 2) {
      print $0
    } else {
      s=$(n-1)
      if (s == "com" || s == "net" || s == "org" || s == "gov" || s == "edu" || s == "co") {
        print $(n-2)"."$(n-1)"."$n
      } else {
        print $(n-1)"."$n
      }
    }
  }'
}

split_domain() {
  local domain="$1"
  local apex=$(get_apex_domain "$domain")
  local sub="@"
  if [ "$domain" != "$apex" ]; then
    sub=\${domain%.$apex}
  fi
  echo "$apex $sub"
}

update_ddns() {
  local ip="$1"
  local domain_parts=($(split_domain "$DOMAIN"))
  local apex="\${domain_parts[0]}"
  local sub="\${domain_parts[1]}"
  
  # 获取已有的解析记录
  local list_response
  list_response=$(request_aliyun "DescribeDomainRecords" "DomainName=$apex" "RRKeyWord=$sub" "TypeKeyWord=$RECORD_TYPE")
  
  # 通过正则匹配查询结果是否报错
  local err_code=$(echo "$list_response" | grep -o '"Code":"[^"]*' | head -n 1 | cut -d'"' -f4)
  if [ -n "$err_code" ]; then
    local err_msg=$(echo "$list_response" | grep -o '"Message":"[^"]*' | head -n 1 | cut -d'"' -f4)
    log_err "Aliyun API Error ($err_code): $err_msg"
    return 1
  fi
  
  # 从查询结果中提取记录 ID 和记录值
  local record_id=$(echo "$list_response" | grep -o '"RecordId":"[^"]*' | head -n 1 | cut -d'"' -f4)
  local record_ip=$(echo "$list_response" | grep -o '"Value":"[^"]*' | head -n 1 | cut -d'"' -f4)
  
  if [ "$record_ip" = "$ip" ]; then
    log_info "IP $ip 相比上次没有变化，跳过更新。"
    return 0
  fi
  
  local res
  if [ -n "$record_id" ]; then
    log_info "正在更新阿里云解析记录 $record_id 为 $ip..."
    res=$(request_aliyun "UpdateDomainRecord" "RecordId=$record_id" "RR=$sub" "Type=$RECORD_TYPE" "Value=$ip" "TTL=$TTL")
  else
    log_info "正在创建新的阿里云解析记录 $DOMAIN 为 $ip..."
    res=$(request_aliyun "AddDomainRecord" "DomainName=$apex" "RR=$sub" "Type=$RECORD_TYPE" "Value=$ip" "TTL=$TTL")
  fi
  
  local fail_code=$(echo "$res" | grep -o '"Code":"[^"]*' | head -n 1 | cut -d'"' -f4)
  if [ -z "$fail_code" ]; then
    log_info "阿里云 DNS 解析记录更新成功。"
    return 0
  else
    local fail_msg=$(echo "$res" | grep -o '"Message":"[^"]*' | head -n 1 | cut -d'"' -f4)
    log_err "Aliyun DDNS update failed ($fail_code): $fail_msg"
    return 1
  fi
}
`;
  }

  return `#!/bin/bash
${customHeader}# 本脚本由 AG-DDNS 自动导出生成。
# 这是一个独立的、零依赖的 Bash 脚本。

# 基础参数配置
DOMAIN="${escapeBash(domain)}"
RECORD_TYPE="${escapeBash(recordType)}"
TTL=${targetTtl}
CACHE_FILE="/tmp/ddns_cache_${escapeBash(domain)}.ip"

# 脚本所在目录及日志配置
SCRIPT_DIR=\$(cd "\$(dirname "\${BASH_SOURCE[0]:-\$0}")" && pwd)
LOG_FILE="\${SCRIPT_DIR}/ddns.log"

log_info() {
  local timestamp=\$(date +"%Y-%m-%d %H:%M:%S")
  local log_line="[\$timestamp] [INFO] \$1"
  echo "\$log_line"
  echo "\$log_line" >> "\$LOG_FILE" 2>/dev/null || true
}

log_err() {
  local timestamp=\$(date +"%Y-%m-%d %H:%M:%S")
  local log_line="[\$timestamp] [ERROR] \$1"
  echo "\$log_line" >&2
  echo "\$log_line" >> "\$LOG_FILE" 2>/dev/null || true
}

# 自定义公网 IP 检测接口
IP_SERVICES_A=(
  "http://ip.3322.net"
  "https://ddns.oray.com/checkip"
  "https://myip.ipip.net"
  "https://api.ipify.org"
  "https://icanhazip.com"
  "https://ident.me"
)

IP_SERVICES_AAAA=(
  "https://speed.neu6.edu.cn/getIP.php"
  "https://api6.ipify.org"
  "https://icanhazip.com"
  "https://ident.me"
)

get_current_ip() {
  local urls=()
  local ip_pattern=""
  if [ "$RECORD_TYPE" = "AAAA" ]; then
    urls=("\${IP_SERVICES_AAAA[@]}")
    ip_pattern="[0-9a-fA-F]\\{1,4\\}:[0-9a-fA-F:]\\+"
  elif [ "$RECORD_TYPE" = "A" ]; then
    urls=("\${IP_SERVICES_A[@]}")
    ip_pattern="[0-9]\\{1,3\\}\\.[0-9]\\{1,3\\}\\.[0-9]\\{1,3\\}\\.[0-9]\\{1,3\\}"
  else
    urls=("\${IP_SERVICES_A[@]}")
    ip_pattern=".\\+"
  fi
  
  for url in "\${urls[@]}"; do
    local response=\$(curl -s -m 6 "\$url")
    local ip=\$(echo "\$response" | grep -o "\$ip_pattern" | head -n 1)
    if [ -n "\$ip" ]; then
      echo "\$ip"
      return 0
    fi
  done
  return 1
}

check_cache() {
  local ip="$1"
  if [ -f "$CACHE_FILE" ]; then
    local cached_ip=\$(cat "\$CACHE_FILE" | tr -d '[:space:]')
    if [ "\$cached_ip" = "\$ip" ]; then
      return 0 # 缓存 IP 一致，跳过更新
    fi
  fi
  return 1 # 需要更新
}

save_cache() {
  local ip="$1"
  echo "\$ip" > "\$CACHE_FILE" 2>/dev/null || true
}

${providerCode}

# 核心运行逻辑入口
log_info "开始执行 DDNS 状态检测 \$DOMAIN (\$RECORD_TYPE)..."

CURRENT_IP=\$(get_current_ip)
if [ -z "\$CURRENT_IP" ]; then
  log_err "错误：未获取到当前的公网 IP 地址。"
  exit 1
fi

log_info "当前的公网 IP 地址: \$CURRENT_IP"

if check_cache "\$CURRENT_IP"; then
  log_info "IP 相比上次没有变化，跳过更新。"
  exit 0
fi

if update_ddns "\$CURRENT_IP"; then
  save_cache "\$CURRENT_IP"
  log_info "DDNS 记录更新成功。"
  exit 0
else
  log_err "更新 DDNS 记录失败。"
  exit 1
fi
`;
}
