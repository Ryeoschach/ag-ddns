/**
 * 自定义 Webhook (Callback) 服务商适配器
 */
export async function updateRecord({ credentials, domain, recordType, ip, ttl }) {
  let url = credentials.secret || credentials.token;
  if (!url) {
    throw new Error('回调 Webhook URL 为空。请在凭证中填写完整的 Webhook 地址。');
  }
  
  // 替换占位符：{ip}, {domain}, {recordType}
  url = url.replace(/{ip}/g, encodeURIComponent(ip))
           .replace(/{domain}/g, encodeURIComponent(domain))
           .replace(/{recordType}/g, encodeURIComponent(recordType));
           
  const res = await fetch(url);
  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`Webhook 回调执行失败，状态码 ${res.status}: ${text.substring(0, 100)}`);
  }
  
  return { 
    success: true, 
    ip, 
    updated: true, 
    msg: `Webhook 触发成功。响应内容（前100字符）: ${text.substring(0, 100).trim()}` 
  };
}
