import express from 'express';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import {
  getTasks,
  getTask,
  saveTask,
  deleteTask,
  getLogs,
  addLog,
  getSettings,
  saveSettings,
  getCerts,
  getCert,
  saveCert,
  deleteCert,
  verifyPassword
} from './db.js';
import { generateBash, generatePython } from './exporter.js';
import { issueCertificate, checkAndRenewCerts } from './acme.js';
import { sendNotification, testNotification } from './notify.js';

// 导入服务商适配器
import * as cloudflare from '../shared/providers/cloudflare.js';
import * as aliyun from '../shared/providers/aliyun.js';
import * as dnspod from '../shared/providers/dnspod.js';
import * as huaweidns from '../shared/providers/huaweidns.js';
import * as he from '../shared/providers/he.js';
import * as namesilo from '../shared/providers/namesilo.js';
import * as noip from '../shared/providers/noip.js';
import * as cloudns from '../shared/providers/cloudns.js';
import * as dnscom from '../shared/providers/dnscom.js';
import * as callback from '../shared/providers/callback.js';

const providers = {
  cloudflare,
  aliyun,
  dnspod,
  huaweidns,
  he,
  namesilo,
  noip,
  cloudns,
  dnscom,
  callback
};

const app = express();
app.use(express.json());

// 内存中生成的 JWT 签名密钥
const JWT_SECRET = crypto.randomBytes(64).toString('hex');

function base64UrlEncode(str) {
  return Buffer.from(str, 'utf8').toString('base64url');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 }));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (signature !== expectedSignature) return null;
    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    if (decodedPayload.exp < Date.now()) return null;
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

// 鉴权中间件
async function authMiddleware(req, res, next) {
  const settings = await getSettings();
  if (!settings.password) {
    return next();
  }

  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: '登录失效，请重新登录' });
  }

  req.user = payload;
  next();
}

// 登录与状态接口（无需鉴权）
app.get('/api/auth/status', async (req, res) => {
  const settings = await getSettings();
  res.json({ passwordSet: !!settings.password });
});

app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }
  const settings = await getSettings();
  if (!settings.password) {
    return res.json({ success: true, token: '', message: '未设置密码，直接访问' });
  }
  const isMatch = await verifyPassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: '密码错误，请重新输入' });
  }
  const token = generateToken({ user: 'admin' });
  res.json({ success: true, token });
});

// 对管理 API 应用鉴权中间件
app.use('/api/tasks', authMiddleware);
app.use('/api/certs', authMiddleware);
app.use('/api/logs', authMiddleware);
app.use('/api/settings', authMiddleware);

// 托管 Web 界面静态文件
const PUBLIC_DIR = path.resolve('server/public');
app.use(express.static(PUBLIC_DIR));

const IP_SERVICES = {
  A: [
    'http://ip.3322.net',
    'https://ddns.oray.com/checkip',
    'https://myip.ipip.net',
    'https://api.ipify.org',
    'https://icanhazip.com',
    'https://ident.me'
  ],
  AAAA: [
    'https://speed.neu6.edu.cn/getIP.php',
    'https://api6.ipify.org',
    'https://icanhazip.com',
    'https://ident.me'
  ]
};

/**
 * 通过公共网页接口获取本机公网 IP
 */
async function fetchPublicIp(recordType, customUrl = null) {
  let ipRegex;
  if (recordType === 'AAAA') {
    ipRegex = /([0-9a-fA-F:]+:[0-9a-fA-F:]+)/;
  } else if (recordType === 'A') {
    ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  } else {
    ipRegex = /.+/; // 匹配任何字符串以用于 CNAME/TXT 记录
  }

  if (customUrl) {
    try {
      const res = await fetch(customUrl, { signal: AbortSignal.timeout(6000) });
      const text = await res.text();
      const match = text.match(ipRegex);
      if (match) return match[0];
    } catch (e) {
      throw new Error(`自定义 IP 查询接口错误 (${customUrl}): ${e.message}`);
    }
  }

  const urls = IP_SERVICES[recordType];
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const text = await res.text();
      const match = text.match(ipRegex);
      if (match) return match[0];
    } catch (e) {
      // 尝试下一个地址
    }
  }
  throw new Error(`无法获取当前的公网 ${recordType} 地址`);
}

/**
 * 获取指定网卡的 IP 地址
 */
function getInterfaceIp(interfaceName, recordType) {
  const interfaces = os.networkInterfaces();
  const list = interfaces[interfaceName];
  if (!list) {
    throw new Error(`未找到系统网卡 "${interfaceName}"`);
  }
  const family = recordType === 'AAAA' ? 'IPv6' : 'IPv4';
  for (const info of list) {
    if (info.family === family) {
      if (family === 'IPv6' && info.address.startsWith('fe80:')) {
        continue; // 过滤链路本地地址
      }
      return info.address;
    }
  }
  throw new Error(`在网卡 "${interfaceName}" 上未找到 ${family} 地址`);
}

/**
 * 任务执行核心逻辑
 */
async function runDdnsTask(task, force = false) {
  const provider = providers[task.provider];
  if (!provider) {
    throw new Error(`未知的服务商适配器 "${task.provider}"`);
  }

  let ip = '';
  try {
    // 1. 根据配置来源获取当前的真实 IP
    if (task.ipSource === 'public') {
      ip = await fetchPublicIp(task.recordType);
    } else if (task.ipSource === 'url') {
      ip = await fetchPublicIp(task.recordType, task.ipUrl);
    } else if (task.ipSource === 'interface') {
      ip = getInterfaceIp(task.ipInterface, task.recordType);
    } else {
      throw new Error(`无效的 IP 来源配置: ${task.ipSource}`);
    }

    if (!ip) throw new Error('解析出的 IP 为空');

    // 2. DNS 记录本地缓存，避免无意义的解析商 API 调用
    if (!force && task.lastIp === ip && task.lastStatus === 'success') {
      task.lastChecked = new Date().toISOString();
      task.lastMessage = `IP 未变化 (${ip})，已跳过解析商 API 提交`;
      await saveTask(task);
      return;
    }

    // 记录解析出的 IP
    task.lastIp = ip;

    // 3. 调用接口更新域名解析（支持以逗号分割的多个域名）
    const domains = task.domain.split(',').map(d => d.trim()).filter(Boolean);
    let updatedAny = false;
    const errors = [];
    const msgs = [];

    for (const d of domains) {
      try {
        const result = await provider.updateRecord({
          credentials: task.credentials,
          domain: d,
          recordType: task.recordType,
          ip,
          ttl: task.ttl,
          proxied: task.proxied
        });
        if (result.updated) {
          updatedAny = true;
        }
        msgs.push(`${d}: ${result.msg}`);
      } catch (err) {
        errors.push(`${d} 失败: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    // 4. 更新任务状态数据
    task.lastChecked = new Date().toISOString();
    task.lastStatus = 'success';
    task.lastMessage = msgs.join('; ') || '更新成功';
    await saveTask(task);

    if (updatedAny) {
      await addLog(task.id, task.name, 'success', `IP 成功更新为 ${ip} (${task.lastMessage})`);
      sendNotification(
        'DDNS 域名解析更新成功通知',
        `任务名称: ${task.name}\n域名: ${task.domain}\n服务商: ${task.provider}\n解析类型: ${task.recordType}\n更新方式: 本地模式\n新 IP 地址: ${ip}\n反馈信息: ${task.lastMessage}`
      ).catch(() => {});
    } else {
      // IP 没有变化时无需重复写入日志，避免日志爆炸
    }
  } catch (err) {
    task.lastChecked = new Date().toISOString();
    task.lastStatus = 'error';
    task.lastMessage = err.message;
    await saveTask(task);
    await addLog(task.id, task.name, 'error', `更新失败: ${err.message}`);
    sendNotification(
      'DDNS 域名解析更新失败告警',
      `任务名称: ${task.name}\n域名: ${task.domain}\n服务商: ${task.provider}\n解析类型: ${task.recordType}\n更新方式: 本地模式\n报错信息: ${err.message}`
    ).catch(() => {});
    throw err;
  }
}

/**
 * 任务手动触发接口
 */
app.post('/api/tasks/:id/run', async (req, res) => {
  const task = await getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '未找到该任务' });
  }
  try {
    await runDdnsTask(task, true);
    res.json({ success: true, message: '域名解析任务已手动触发并执行成功', task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CRUD 任务管理 API
 */
app.get('/api/tasks', async (req, res) => {
  const tasks = await getTasks();
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const { name, provider, credentials, domain, recordType, mode, ipSource, ipUrl, ipInterface, checkInterval, ttl, enabled, proxied } = req.body;
  
  if (!name || !provider || !domain || !recordType) {
    return res.status(400).json({ error: '缺少必填的任务参数' });
  }

  const newTask = {
    name,
    provider,
    credentials,
    domain,
    recordType,
    mode: mode || 'local',
    ipSource: ipSource || 'public',
    ipUrl: ipUrl || '',
    ipInterface: ipInterface || '',
    checkInterval: parseInt(checkInterval) || 5,
    ttl: parseInt(ttl) || 600,
    enabled: enabled !== false,
    proxied: !!proxied,
    lastIp: '',
    lastChecked: '',
    lastStatus: 'info',
    lastMessage: '任务创建成功',
    // 为客户端上报模式生成唯一的密钥
    clientKey: 'key_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  };

  const saved = await saveTask(newTask);
  await addLog(saved.id, saved.name, 'info', `任务已创建，运行模式: ${saved.mode}`);
  res.json(saved);
});

app.put('/api/tasks/:id', async (req, res) => {
  const existing = await getTask(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '未找到该任务' });
  }

  const updated = {
    ...existing,
    ...req.body,
    id: req.params.id // 确保 ID 不被更改
  };

  const saved = await saveTask(updated);
  await addLog(saved.id, saved.name, 'info', '任务配置已更新');
  res.json(saved);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const existing = await getTask(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '未找到该任务' });
  }
  await deleteTask(req.params.id);
  res.json({ success: true });
});

/**
 * 重置 DDNS 任务密钥
 */
app.post('/api/tasks/:id/reset-key', async (req, res) => {
  const task = await getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '未找到该任务' });
  }
  task.clientKey = 'key_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const saved = await saveTask(task);
  await addLog(saved.id, saved.name, 'info', '重置了客户端注册密钥 (Client Key)');
  res.json({ success: true, clientKey: saved.clientKey });
});

/**
 * 脚本导出接口
 */
app.get('/api/tasks/:id/export', async (req, res) => {
  const task = await getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '未找到该任务' });
  }

  const type = req.query.type; // 'bash' 脚本或 'python' 脚本
  let scriptContent = '';
  let filename = '';

  const settings = await getSettings();
  if (type === 'bash') {
    scriptContent = generateBash(task, settings);
    filename = `ddns_${task.domain}.sh`;
    res.setHeader('Content-Type', 'text/x-shellscript');
  } else if (type === 'python') {
    scriptContent = generatePython(task, settings);
    filename = `ddns_${task.domain}.py`;
    res.setHeader('Content-Type', 'text/x-python');
  } else {
    return res.status(400).json({ error: '无效的脚本类型，仅支持 bash 或 python' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(scriptContent);
});

/**
 * 客户端上报 API
 */
app.post('/api/client/report', async (req, res) => {
  const { clientKey, ip } = req.body;
  if (!clientKey || !ip) {
    return res.status(400).json({ error: '缺少 clientKey 或 ip 参数' });
  }

  const tasks = await getTasks();
  const task = tasks.find(t => t.clientKey === clientKey);
  if (!task) {
    return res.status(401).json({ error: '无效的客户端安全密钥' });
  }

  if (!task.enabled) {
    return res.status(400).json({ error: '该动态解析任务已被禁用' });
  }

  try {
    const provider = providers[task.provider];
    if (!provider) throw new Error(`未找到该服务商的适配器: "${task.provider}"`);

    // DNS 记录本地缓存，避免无意义的解析商 API 调用
    if (task.lastIp === ip && task.lastStatus === 'success') {
      task.lastChecked = new Date().toISOString();
      task.lastMessage = `客户端上报: IP 未变化 (${ip})，已跳过解析商 API 提交`;
      await saveTask(task);
      return res.json({ success: true, message: 'IP 未发生变化，跳过更新', ip, updated: false });
    }

    // 记录客户端上报的 IP
    task.lastIp = ip;

    // 更新 DNS 记录（支持以逗号分割的多个域名）
    const domains = task.domain.split(',').map(d => d.trim()).filter(Boolean);
    let updatedAny = false;
    const errors = [];
    const msgs = [];

    for (const d of domains) {
      try {
        const result = await provider.updateRecord({
          credentials: task.credentials,
          domain: d,
          recordType: task.recordType,
          ip,
          ttl: task.ttl,
          proxied: task.proxied
        });
        if (result.updated) {
          updatedAny = true;
        }
        msgs.push(`${d}: ${result.msg}`);
      } catch (err) {
        errors.push(`${d} 失败: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    // 更新数据库中的任务状态
    task.lastChecked = new Date().toISOString();
    task.lastStatus = 'success';
    task.lastMessage = `客户端上报: ${msgs.join('; ')}`;
    await saveTask(task);

    if (updatedAny) {
      await addLog(task.id, task.name, 'success', `客户端上报 IP ${ip}。DNS 解析已成功更新。`);
      sendNotification(
        'DDNS 域名解析更新成功通知',
        `任务名称: ${task.name}\n域名: ${task.domain}\n服务商: ${task.provider}\n上报 IP: ${ip}\n更新方式: 远程客户端模式\n新 IP 地址: ${ip}\n反馈信息: ${task.lastMessage}`
      ).catch(() => {});
    }

    res.json({ success: true, message: '上报处理完毕', ip, updated: updatedAny });
  } catch (err) {
    task.lastChecked = new Date().toISOString();
    task.lastStatus = 'error';
    task.lastMessage = `客户端上报了 IP ${ip}，但在执行 DNS 更新时失败: ${err.message}`;
    await saveTask(task);
    await addLog(task.id, task.name, 'error', `客户端上报更新失败: ${err.message}`);
    sendNotification(
      'DDNS 域名解析更新失败告警',
      `任务名称: ${task.name}\n域名: ${task.domain}\n服务商: ${task.provider}\n上报 IP: ${ip}\n更新方式: 远程客户端模式\n报错信息: ${err.message}`
    ).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

/**
 * 日志与设置接口
 */
app.get('/api/logs', async (req, res) => {
  const { type, taskId, limit } = req.query;
  const dbLogs = await getLogs(500);
  
  let filteredLogs = dbLogs;
  if (taskId) {
    filteredLogs = filteredLogs.filter(l => l.taskId === taskId);
  }
  if (type) {
    filteredLogs = filteredLogs.filter(l => l.type === type);
  }
  
  const parsedLimit = parseInt(limit) || 100;
  res.json(filteredLogs.slice(0, parsedLimit));
});

app.get('/api/ip-history', async (req, res) => {
  const dbLogs = await getLogs(500);
  const ipChangeLogs = dbLogs.filter(l => 
    l.type === 'success' && 
    (l.message.includes('IP 成功更新') || l.message.includes('上报 IP') || l.message.includes('更新为'))
  );
  
  const history = ipChangeLogs.map(l => {
    const ipMatch = l.message.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/) || 
                    l.message.match(/([0-9a-fA-F:]+:[0-9a-fA-F:]+)/);
    const ip = ipMatch ? ipMatch[0] : 'Unknown';
    
    return {
      id: l.id,
      taskId: l.taskId,
      taskName: l.taskName,
      ip: ip,
      timestamp: l.timestamp,
      message: l.message
    };
  });
  
  res.json(history.slice(0, 10));
});

app.get('/api/settings', async (req, res) => {
  const settings = await getSettings();
  const safeSettings = { ...settings };
  delete safeSettings.password;
  res.json(safeSettings);
});

app.post('/api/settings', async (req, res) => {
  await saveSettings(req.body);
  res.json({ success: true });
});

app.post('/api/settings/test-notify', async (req, res) => {
  try {
    const results = await testNotification(req.body);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 证书管理 API
 */
app.get('/api/certs', async (req, res) => {
  const certs = await getCerts();
  let modified = false;
  for (const cert of certs) {
    if (!cert.clientKey) {
      cert.clientKey = 'key_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      await saveCert(cert);
      modified = true;
    }
  }
  res.json(certs);
});

app.post('/api/certs', async (req, res) => {
  const { domain, provider, credentials, email, dnsDelay, enabled, useStaging } = req.body;
  if (!domain || !provider || !credentials) {
    return res.status(400).json({ error: '缺少必填的证书参数' });
  }

  const newCert = {
    domain,
    provider,
    credentials,
    email: email || '',
    dnsDelay: parseInt(dnsDelay) || 15,
    enabled: enabled !== false,
    useStaging: !!useStaging,
    status: 'info',
    lastMessage: '已保存证书配置，尚未申请',
    lastUpdated: '',
    expiryDate: '',
    certContent: '',
    keyContent: '',
    clientKey: 'key_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  };

  const saved = await saveCert(newCert);
  await addLog(saved.id, saved.domain, 'info', `创建了域名 ${saved.domain} 的证书申请配置`);
  res.json(saved);
});

app.put('/api/certs/:id', async (req, res) => {
  const existing = await getCert(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '未找到该证书配置' });
  }

  const updated = {
    ...existing,
    ...req.body,
    id: req.params.id
  };

  const saved = await saveCert(updated);
  await addLog(saved.id, saved.domain, 'info', `修改了域名 ${saved.domain} 的证书申请配置`);
  res.json(saved);
});

app.delete('/api/certs/:id', async (req, res) => {
  const existing = await getCert(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '未找到该证书配置' });
  }
  await deleteCert(req.params.id);
  await addLog(req.params.id, existing.domain, 'info', `删除了域名 ${existing.domain} 的证书申请配置`);
  res.json({ success: true });
});

app.post('/api/certs/:id/renew', async (req, res) => {
  const cert = await getCert(req.params.id);
  if (!cert) {
    return res.status(404).json({ error: '未找到该证书配置' });
  }

  // 异步执行申请流程，防止接口因 DNS 验证超时
  issueCertificate(cert).catch(err => {
    console.error(`手动触发申请证书失败 (${cert.domain}): ${err.message}`);
  });

  res.json({ success: true, message: '证书申请与续期任务已手动触发，请在面板中关注更新状态。' });
});

app.get('/api/certs/:id/download', async (req, res) => {
  const cert = await getCert(req.params.id);
  if (!cert || !cert.certContent || !cert.keyContent) {
    return res.status(404).json({ error: '证书尚未申请成功，无法下载' });
  }

  res.json({
    domain: cert.domain,
    cert: cert.certContent,
    key: cert.keyContent
  });
});

/**
 * 重置 SSL 证书密钥
 */
app.post('/api/certs/:id/reset-key', async (req, res) => {
  const cert = await getCert(req.params.id);
  if (!cert) {
    return res.status(404).json({ error: '未找到该证书配置' });
  }
  cert.clientKey = 'key_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const saved = await saveCert(cert);
  await addLog(saved.id, saved.domain, 'info', '重置了证书的客户端注册密钥 (Client Key)');
  res.json({ success: true, clientKey: saved.clientKey });
});

/**
 * 客户端证书上报与拉取接口
 */
app.post('/api/client/certs', async (req, res) => {
  const { clientKey, domain } = req.body;
  if (!clientKey) {
    return res.status(400).json({ error: '缺少 clientKey 参数' });
  }

  const certs = await getCerts();
  const domainsToMatch = domain ? domain.split(',').map(d => d.trim()).filter(Boolean) : [];

  // 1. 优先尝试直接用 clientKey 匹配证书本身的 key
  let matchedCert = certs.find(c => c.clientKey === clientKey && c.status === 'success');

  // 如果用证书专属 key 匹配到了，但客户端又传了 domain 参数，确认一下域名是否符合（防错）
  if (matchedCert && domainsToMatch.length > 0) {
    const certDoms = matchedCert.domain.split(',').map(d => d.trim()).filter(Boolean);
    const domainOk = domainsToMatch.some(d => certDoms.includes(d));
    if (!domainOk) {
      matchedCert = null; // 域名不匹配，清空
    }
  }

  // 2. 如果没匹配到，尝试兼容老模式：匹配 DDNS 任务的 clientKey，再找出该任务下域名的证书
  if (!matchedCert) {
    const tasks = await getTasks();
    const task = tasks.find(t => t.clientKey === clientKey);
    if (task) {
      matchedCert = certs.find(c => {
        if (c.status !== 'success') return false;
        const certDoms = c.domain.split(',').map(d => d.trim()).filter(Boolean);
        if (domainsToMatch.length > 0) {
          return domainsToMatch.some(d => certDoms.includes(d));
        }
        const taskDoms = task.domain.split(',').map(d => d.trim()).filter(Boolean);
        return taskDoms.some(d => certDoms.includes(d));
      });
    }
  }

  if (!matchedCert) {
    return res.status(401).json({ error: '无效的安全密钥或未找到匹配的 SSL 证书' });
  }

  res.json({
    success: true,
    domain: matchedCert.domain,
    lastUpdated: matchedCert.lastUpdated,
    expiryDate: matchedCert.expiryDate,
    cert: matchedCert.certContent,
    key: matchedCert.keyContent
  });
});

let lastCertCheck = 0;

/**
 * 定时检查轮询任务
 */
async function scheduleCheck() {
  const tasks = await getTasks();
  for (const task of tasks) {
    if (!task.enabled) continue;

    const now = Date.now();
    const lastCheckedMs = task.lastChecked ? new Date(task.lastChecked).getTime() : 0;
    const intervalMs = task.checkInterval * 60 * 1000;

    if (task.mode === 'local') {
      if (now - lastCheckedMs >= intervalMs) {
        // 到了检查本地任务的时间
        runDdnsTask(task).catch(() => {});
      }
    } else if (task.mode === 'remote-client') {
      // 检查客户端状态：如果超过 2.5 个轮询周期没有上报，就发出超时警告并推送通知
      const timeoutMs = intervalMs * 2.5;
      if (lastCheckedMs > 0 && now - lastCheckedMs >= timeoutMs && task.lastStatus !== 'error') {
        task.lastStatus = 'error';
        task.lastMessage = `客户端连接超时（未在预定周期内收到上报数据）`;
        await saveTask(task);
        await addLog(task.id, task.name, 'error', `客户端连接超时，已超过 ${task.checkInterval * 2.5} 分钟未收到任何上报数据。`);
        
        sendNotification(
          '远程客户端代理离线超时告警',
          `任务名称: ${task.name}\n域名: ${task.domain}\n状态: 离线超时\n周期设定: ${task.checkInterval}分钟\n最后活跃时间: ${task.lastChecked ? new Date(task.lastChecked).toLocaleString() : '从无上报'}`
        ).catch(() => {});
      }
    }
  }

  // 每次轮询检查自动续期证书（acme.js 内部有基于到期天数与退避计时的快速过滤，不会引发多余 API 消耗）
  checkAndRenewCerts().catch(err => {
    console.error('自动续期证书扫描失败:', err.message);
  });
}

// 每 30 秒执行一次轮询检查
setInterval(scheduleCheck, 30000);

function getArg(opt) {
  const idx = process.argv.indexOf(opt);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

// 初始化数据库并启动服务
async function start() {
  const settings = await getSettings();
  
  // 优先使用命令行参数（--port / -p / 位置参数纯数字）或环境变量指定的端口，如果没有才读取数据库配置或使用默认的 8080
  const positionalPort = process.argv.slice(2).find(arg => !isNaN(parseInt(arg)) && String(parseInt(arg)) === arg);
  const cmdPort = getArg('--port') || getArg('-p') || positionalPort || process.env.PORT;
  const port = (cmdPort && !isNaN(parseInt(cmdPort))) ? parseInt(cmdPort) : (settings.port || 8080);
  
  const serverInstance = app.listen(port, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(` AG-DDNS 服务端启动成功`);
    console.log(` 端口号:  ${port}`);
    console.log(` 面板网址: http://localhost:${port}`);
    console.log(`=========================================`);
  });

  serverInstance.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[错误] 端口号 ${port} 已被其它程序占用，启动失败！`);
      console.log(`       您可以指定其它端口重新启动，例如: npm start --port ${port + 1}\n`);
    } else {
      console.error(`\n[错误] 服务端启动失败: ${err.message}\n`);
    }
    process.exit(1);
  });
}

start().catch(console.error);
