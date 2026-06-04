/**
 * 阿里云 (Alidns) DNS 服务商适配器
 */
import crypto from 'crypto';

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

function percentEncode(str) {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(str)
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~');
}

function sign(params, accessKeySecret) {
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');
  
  const stringToSign = `GET&${percentEncode('/')}&${percentEncode(canonicalizedQueryString)}`;
  const key = `${accessKeySecret}&`;
  
  return crypto
    .createHmac('sha1', key)
    .update(stringToSign)
    .digest('base64');
}

async function requestAliyun(credentials, action, params) {
  const sysParams = {
    Format: 'JSON',
    Version: '2015-01-09',
    AccessKeyId: credentials.id,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    SignatureVersion: '1.0',
    SignatureNonce: Math.random().toString(36).substring(2) + Date.now().toString(),
    Action: action,
    ...params
  };

  const signature = sign(sysParams, credentials.secret);
  sysParams.Signature = signature;

  const urlParams = Object.keys(sysParams)
    .map(key => `${percentEncode(key)}=${percentEncode(sysParams[key])}`)
    .join('&');

  const url = `https://alidns.aliyuncs.com/?${urlParams}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.Code && data.Message) {
    throw new Error(`阿里云 API 错误 (${data.Code}): ${data.Message}`);
  }
  return data;
}

export async function updateRecord({ credentials, domain, recordType, ip, ttl }) {
  if (!credentials.id || !credentials.secret) {
    throw new Error('阿里云需要 AccessKey ID (id) 和 AccessKey Secret (secret)');
  }
  
  const { apex, subDomain } = splitDomain(domain);
  
  // 1. 获取已有的 DNS 解析列表，查找是否已经存在该记录
  const listData = await requestAliyun(credentials, 'DescribeDomainRecords', {
    DomainName: apex,
    RRKeyWord: subDomain,
    TypeKeyWord: recordType
  });
  
  // 精确匹配主机记录名称（例如 subDomain）
  const records = listData.DomainRecords && listData.DomainRecords.Record || [];
  const record = records.find(r => r.RR === subDomain && r.Type === recordType);
  
  if (record) {
    // 如果 IP 没有发生改变则跳过更新
    if (record.Value === ip) {
      return { success: true, ip, updated: false, msg: 'IP has not changed' };
    }
    // 更新 DNS 记录
    await requestAliyun(credentials, 'UpdateDomainRecord', {
      RecordId: record.RecordId,
      RR: subDomain,
      Type: recordType,
      Value: ip,
      TTL: ttl || 600
    });
  } else {
    // 新建 DNS 记录
    await requestAliyun(credentials, 'AddDomainRecord', {
      DomainName: apex,
      RR: subDomain,
      Type: recordType,
      Value: ip,
      TTL: ttl || 600
    });
  }

  return { success: true, ip, updated: true, msg: record ? 'Record updated' : 'Record created' };
}

export async function createTxtRecord({ credentials, domain, name, value, ttl }) {
  const { apex, subDomain } = splitDomain(name);
  await requestAliyun(credentials, 'AddDomainRecord', {
    DomainName: apex,
    RR: subDomain,
    Type: 'TXT',
    Value: value,
    TTL: ttl || 600
  });
  return true;
}

export async function deleteTxtRecord({ credentials, domain, name }) {
  const { apex, subDomain } = splitDomain(name);
  const listData = await requestAliyun(credentials, 'DescribeDomainRecords', {
    DomainName: apex,
    RRKeyWord: subDomain,
    TypeKeyWord: 'TXT'
  });
  const records = listData.DomainRecords && listData.DomainRecords.Record || [];
  for (const record of records) {
    if (record.RR === subDomain && record.Type === 'TXT') {
      await requestAliyun(credentials, 'DeleteDomainRecord', {
        RecordId: record.RecordId
      });
    }
  }
  return true;
}
