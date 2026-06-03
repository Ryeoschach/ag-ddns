/**
 * HE.net (Hurricane Electric) DNS 服务商适配器
 */
export async function updateRecord({ credentials, domain, recordType, ip, ttl }) {
  const password = credentials.secret || credentials.token;
  if (!password) {
    throw new Error('HE.net 需要提供 DDNS 密钥或密码');
  }
  
  const url = `https://dyn.dns.he.net/nic/update?hostname=${encodeURIComponent(domain)}&myip=${encodeURIComponent(ip)}`;
  
  const authHeader = 'Basic ' + Buffer.from(`${domain}:${password}`).toString('base64');
  const headers = {
    'Authorization': authHeader,
    'User-Agent': 'AG-DDNS/1.0'
  };
  
  const res = await fetch(url, { headers });
  const text = await res.text();
  
  if (text.includes('nochg') || text.includes('good')) {
    return { success: true, ip, updated: text.includes('good'), msg: `HE.net: ${text.trim()}` };
  }
  throw new Error(`HE.net 更新失败: ${text.trim()}`);
}
