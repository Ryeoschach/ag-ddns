/**
 * AG-DDNS 客户端代理
 * 定期检查本机 IP，并上报给中心服务器。
 */

import { promises as fs, existsSync } from 'fs';
import path from 'path';
import os from 'os';

// 智能判断配置文件存放路径：
// 如果当前工作目录下有 client 目录，且 client.js 不在当前目录下（说明是在项目根目录运行），则保存在 client/ 子目录下；
// 否则（在 client 目录下运行、独立部署、或 Docker 环境下），直接保存在当前工作目录下。
const useSubdir = existsSync(path.resolve('client')) && !existsSync(path.resolve('client.js'));
const CONFIG_PATH = useSubdir ? path.resolve('client/config.json') : path.resolve('config.json');
const CACHE_PATH = useSubdir ? path.resolve('client/ip.cache') : path.resolve('ip.cache');

const defaultConfig = {
  serverUrl: 'http://localhost:8080',
  clientKey: 'YOUR_CLIENT_KEY_FROM_SERVER_DASHBOARD',
  recordType: 'A', // 'A' (IPv4 地址) 或 'AAAA' (IPv6 地址)
  ipSource: 'public', // 'public' (公网获取) | 'interface' (网卡获取) | 'url' (自定义网址获取)
  ipInterface: '', // 比如 'eth0' 或 'en0'（当从网卡获取 IP 时填写）
  ipUrl: '', // 比如 'https://api.ipify.org'（当使用自定义网址获取 IP 时填写）
  checkInterval: 5 // 每隔多少分钟检查一次
};

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

async function ensureConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // 写入默认配置文件并提示用户
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    console.log(`================================================================`);
    console.log(`[INFO] 已在以下路径创建默认配置文件:`);
    console.log(`       ${CONFIG_PATH}`);
    console.log(`[INFO] 请先编辑该文件，填写服务器地址、客户端密钥及检查间隔，然后重新运行。`);
    console.log(`================================================================`);
    process.exit(0);
  }
}

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
      throw new Error(`自定义 URL 检查失败: ${e.message}`);
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
      // 尝试下一个接口
    }
  }
  throw new Error(`无法获取公网 IP 地址`);
}

function getInterfaceIp(interfaceName, recordType) {
  const interfaces = os.networkInterfaces();
  const list = interfaces[interfaceName];
  if (!list) {
    throw new Error(`系统中未找到网卡 "${interfaceName}"`);
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

async function getCachedIp() {
  try {
    return (await fs.readFile(CACHE_PATH, 'utf-8')).trim();
  } catch (e) {
    return null;
  }
}

async function saveCachedIp(ip) {
  try {
    await fs.writeFile(CACHE_PATH, ip, 'utf-8');
  } catch (e) {
    // 忽略缓存写入错误
  }
}

async function checkAndReport(config) {
  const timeStr = new Date().toISOString();
  console.log(`[${timeStr}] 开始进行 DDNS 检查...`);
  
  let currentIp = '';
  try {
    if (config.ipSource === 'public') {
      currentIp = await fetchPublicIp(config.recordType);
    } else if (config.ipSource === 'url') {
      currentIp = await fetchPublicIp(config.recordType, config.ipUrl);
    } else if (config.ipSource === 'interface') {
      currentIp = getInterfaceIp(config.ipInterface, config.recordType);
    } else {
      throw new Error(`无效的 IP 来源配置: ${config.ipSource}`);
    }

    if (!currentIp) throw new Error('解析出的 IP 为空');
    
    console.log(`[${timeStr}] 当前解析出的 IP: ${currentIp}`);

    const cachedIp = await getCachedIp();
    if (cachedIp === currentIp) {
      console.log(`[${timeStr}] IP 相比上次没有变化 (${cachedIp})，跳过上报。`);
      return;
    }

    // 上报给服务器
    const reportUrl = `${config.serverUrl.replace(/\/$/, '')}/api/client/report`;
    console.log(`[${timeStr}] 正在向服务器上报新 IP: ${reportUrl}...`);
    
    const res = await fetch(reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: config.clientKey,
        ip: currentIp
      }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      console.log(`[${timeStr}] DDNS 上报更新成功。服务器返回: ${data.message}`);
      await saveCachedIp(currentIp);
    } else {
      throw new Error(data.error || '服务器拒绝了上报');
    }
  } catch (err) {
    console.error(`[${timeStr}] 发生错误: ${err.message}`);
  }
}

function getArg(opt) {
  const idx = process.argv.indexOf(opt);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

async function main() {
  console.log('================================================================');
  console.log(' AG-DDNS 客户端代理已启动');
  console.log('================================================================');
  
  const config = await ensureConfig();
  
  const positionalPort = process.argv.slice(2).find(arg => !isNaN(parseInt(arg)) && String(parseInt(arg)) === arg);
  const cmdPort = getArg('--port') || getArg('-p') || positionalPort || process.env.PORT;
  if (cmdPort && !isNaN(parseInt(cmdPort))) {
    try {
      const urlObj = new URL(config.serverUrl);
      urlObj.port = cmdPort;
      config.serverUrl = urlObj.toString().replace(/\/$/, '');
      console.log(`[INFO] 命令行指定/环境变量端口覆盖，服务器上报地址已更新为: ${config.serverUrl}`);
    } catch (e) {
      console.error(`[警告] 无法将端口 "${cmdPort}" 应用到服务器地址 "${config.serverUrl}": ${e.message}`);
    }
  }

  // 允许使用命令行参数（--interval / -i）或环境变量（INTERVAL / CHECK_INTERVAL）指定或覆盖检测及通报时间间隔
  const cmdInterval = getArg('--interval') || getArg('-i') || process.env.INTERVAL || process.env.CHECK_INTERVAL;
  if (cmdInterval && !isNaN(parseInt(cmdInterval))) {
    config.checkInterval = parseInt(cmdInterval);
    console.log(`[INFO] 命令行指定/环境变量覆盖，检测与上报间隔已更新为: ${config.checkInterval} 分钟`);
  }
  
  if (!config.clientKey || config.clientKey === defaultConfig.clientKey) {
    console.error('[错误] 请先在 client/config.json 中配置您的 clientKey。');
    process.exit(1);
  }

  // 启动时先执行一次检查
  await checkAndReport(config);

  // 开启定时检查任务
  const intervalMs = config.checkInterval * 60 * 1000;
  setInterval(() => checkAndReport(config), intervalMs);
  console.log(`[INFO] 定时任务配置成功，每隔 ${config.checkInterval} 分钟检查一次。`);
}

main().catch(console.error);
