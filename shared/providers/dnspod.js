/**
 * DNSPod 服务商适配器（使用旧版 API.cn 接口）
 */

function getApexDomain(domain) {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  const isSecondLevelTld = parts[parts.length - 2].match(/^(com|net|org|gov|edu|co)$/i) && parts[parts.length - 1].length === 2;
  if (isSecondLevelTld && parts.length > 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function splitDomain(domain) {
  const apex = getApexDomain(domain);
  let subDomain = '@';
  if (domain !== apex) {
    subDomain = domain.substring(0, domain.length - apex.length - 1);
  }
  return { apex, subDomain };
}

async function requestDnspod(action, params) {
  const body = new URLSearchParams(params).toString();
  const url = `https://dnsapi.cn/${action}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'AG-DDNS/1.0.0 (admin@ag-ddns.local)'
    },
    body
  });
  
  const data = await res.json();
  if (!data.status || data.status.code !== '1') {
    // 状态码 '10' 表示没有记录，这对于获取列表来说是可以接受的（意味着我们需要创建新记录）
    if (action === 'Record.List' && data.status && data.status.code === '10') {
      return { records: [] };
    }
    throw new Error(`DNSPod API 错误: ${data.status ? data.status.message : '未知返回结果'}`);
  }
  return data;
}

export async function updateRecord({ credentials, domain, recordType, ip, ttl }) {
  if (!credentials.id || !credentials.token) {
    throw new Error('DNSPod 需要 Token ID (id) 和 Token Key (token)');
  }
  
  const login_token = `${credentials.id},${credentials.token}`;
  const { apex, subDomain } = splitDomain(domain);
  
  // 1. 获取已有的 DNS 解析记录
  const listData = await requestDnspod('Record.List', {
    login_token,
    format: 'json',
    domain: apex,
    sub_domain: subDomain,
    record_type: recordType
  });
  
  const record = listData.records && listData.records[0];
  const commonParams = {
    login_token,
    format: 'json',
    domain: apex,
    sub_domain: subDomain,
    record_type: recordType,
    record_line: '默认',
    value: ip,
    ttl: ttl || 600 // DNSPod 默认 TTL 为 600 秒
  };

  if (record) {
    // 如果 IP 没变就跳过更新
    if (record.value === ip) {
      return { success: true, ip, updated: false, msg: 'IP has not changed' };
    }
    // 更新记录
    await requestDnspod('Record.Modify', {
      ...commonParams,
      record_id: record.id
    });
  } else {
    // 新建记录
    await requestDnspod('Record.Create', commonParams);
  }

  return { success: true, ip, updated: true, msg: record ? 'Record updated' : 'Record created' };
}

export async function createTxtRecord({ credentials, domain, name, value, ttl }) {
  if (!credentials.id || !credentials.token) {
    throw new Error('DNSPod 需要 Token ID (id) 和 Token Key (token)');
  }
  const login_token = `${credentials.id},${credentials.token}`;
  const { apex, subDomain } = splitDomain(name);

  await requestDnspod('Record.Create', {
    login_token,
    format: 'json',
    domain: apex,
    sub_domain: subDomain,
    record_type: 'TXT',
    record_line: '默认',
    value,
    ttl: ttl || 600
  });
  return true;
}

export async function deleteTxtRecord({ credentials, domain, name }) {
  if (!credentials.id || !credentials.token) {
    throw new Error('DNSPod 需要 Token ID (id) 和 Token Key (token)');
  }
  const login_token = `${credentials.id},${credentials.token}`;
  const { apex, subDomain } = splitDomain(name);

  const listData = await requestDnspod('Record.List', {
    login_token,
    format: 'json',
    domain: apex,
    sub_domain: subDomain,
    record_type: 'TXT'
  });

  const records = listData.records || [];
  for (const record of records) {
    if (record.name === subDomain && record.type === 'TXT') {
      await requestDnspod('Record.Remove', {
        login_token,
        format: 'json',
        domain: apex,
        record_id: record.id
      });
    }
  }
  return true;
}
