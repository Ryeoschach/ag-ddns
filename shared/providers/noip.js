/**
 * No-IP DNS 服务商适配器
 */
export async function updateRecord({ credentials, domain, recordType, ip, ttl }) {
  const username = credentials.id;
  const password = credentials.secret || credentials.token;
  
  if (!username || !password) {
    throw new Error('No-IP 需要提供用户名和密码/Token');
  }
  
  const url = `https://dynupdate.no-ip.com/nic/update?hostname=${encodeURIComponent(domain)}&myip=${encodeURIComponent(ip)}`;
  
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const headers = {
    'Authorization': authHeader,
    'User-Agent': 'AG-DDNS/1.0'
  };
  
  const res = await fetch(url, { headers });
  const text = await res.text();
  
  if (text.includes('nochg') || text.includes('good')) {
    return { success: true, ip, updated: text.includes('good'), msg: `No-IP: ${text.trim()}` };
  }
  throw new Error(`No-IP 更新失败: ${text.trim()}`);
}
