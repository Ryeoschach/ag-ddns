/**
 * Cloudflare DNS 服务商适配器
 */

// 提取根域名（例如 sub.example.com -> example.com）
function getApexDomain(domain) {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  // 匹配常见的双后缀域名，如 .com.cn, .edu.cn 等
  const isSecondLevelTld = parts[parts.length - 2].match(/^(com|net|org|gov|edu|co)$/i) && parts[parts.length - 1].length === 2;
  if (isSecondLevelTld && parts.length > 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function getHeaders(credentials) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (credentials.token) {
    headers['Authorization'] = `Bearer ${credentials.token}`;
  } else if (credentials.email && credentials.key) {
    headers['X-Auth-Email'] = credentials.email;
    headers['X-Auth-Key'] = credentials.key;
  } else {
    throw new Error('Cloudflare 需要 API Token 或者 Email + Global API Key');
  }
  return headers;
}

// 根据域名获取 Zone ID
async function getZoneId(domain, headers) {
  const apex = getApexDomain(domain);
  const url = `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(apex)}`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!data.success || !data.result || data.result.length === 0) {
    throw new Error(`无法获取 Cloudflare Zone ID, 域名 ${apex}: ${JSON.stringify(data.errors)}`);
  }
  return data.result[0].id;
}

export async function updateRecord({ credentials, domain, recordType, ip, ttl, proxied }) {
  const headers = getHeaders(credentials);
  const zoneId = credentials.zoneId || await getZoneId(domain, headers);
  
  // 1. 获取现有的 DNS 记录
  const listUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=${recordType}&name=${encodeURIComponent(domain)}`;
  const listRes = await fetch(listUrl, { headers });
  const listData = await listRes.json();
  
  if (!listData.success) {
    throw new Error(`查询 Cloudflare DNS 记录失败: ${JSON.stringify(listData.errors)}`);
  }
  
  const record = listData.result && listData.result[0];
  const payload = {
    type: recordType,
    name: domain,
    content: ip,
    ttl: ttl || 120, // 默认 120 秒
    proxied: (recordType === 'A' || recordType === 'AAAA' || recordType === 'CNAME') ? !!proxied : false
  };

  let updateRes;
  if (record) {
    // 如果 IP 没有发生改变则跳过更新
    if (record.content === ip) {
      return { success: true, ip, updated: false, msg: 'IP has not changed' };
    }
    // 2. 更新现有的 DNS 记录
    const updateUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`;
    updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
  } else {
    // 2. 创建新的 DNS 记录
    const createUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
    updateRes = await fetch(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  }

  const updateData = await updateRes.json();
  if (!updateData.success) {
    throw new Error(`保存 Cloudflare DNS 记录失败: ${JSON.stringify(updateData.errors)}`);
  }

  return { success: true, ip, updated: true, msg: record ? 'Record updated' : 'Record created' };
}
