import acme from 'acme-client';
import { getSettings, saveSettings, saveCert, getCerts, addLog } from './db.js';
import * as cloudflare from '../shared/providers/cloudflare.js';
import * as aliyun from '../shared/providers/aliyun.js';
import * as dnspod from '../shared/providers/dnspod.js';

const providers = {
  cloudflare,
  aliyun,
  dnspod
};

// 获取 Let's Encrypt 账号私钥，如果没有则自动创建并保存
async function getAccountKey() {
  const settings = await getSettings();
  if (settings.acmeAccountKey) {
    return settings.acmeAccountKey;
  }
  const key = await acme.forge.createPrivateKey();
  const keyPem = key.toString();
  await saveSettings({ acmeAccountKey: keyPem });
  return keyPem;
}

/**
 * 申请或续期 SSL 证书
 */
export async function issueCertificate(cert) {
  const accountKey = await getAccountKey();
  
  const client = new acme.Client({
    directoryUrl: cert.useStaging 
      ? acme.directory.letsencrypt.staging 
      : acme.directory.letsencrypt.production,
    accountKey: accountKey
  });

  // 生成证书私钥及 CSR（支持用逗号分隔的多个 SAN 域名）
  const domains = cert.domain.split(',').map(d => d.trim()).filter(Boolean);
  const [certKey, csr] = await acme.forge.createCsr({
    commonName: domains[0],
    altNames: domains
  });

  try {
    cert.status = 'processing';
    cert.lastMessage = '正在向 Let\'s Encrypt 提交证书订单...';
    await saveCert(cert);
    await addLog(cert.id, cert.domain, 'info', '开始申请 SSL 证书: 向 Let\'s Encrypt 提交订单...');

    const certificate = await client.auto({
      csr,
      email: cert.email || 'admin@ag-ddns.local',
      termsOfServiceAgreed: true,
      challengePriority: ['dns-01'],
      challengeCreateFn: async (authz, challenge, keyAuthorization) => {
        if (challenge.type !== 'dns-01') {
          throw new Error(`仅支持 DNS-01 验证，当前类型为: ${challenge.type}`);
        }
        
        const dnsRecord = `_acme-challenge.${authz.identifier.value}`;
        const recordValue = keyAuthorization;
        
        cert.lastMessage = `正在为域名 ${authz.identifier.value} 创建 TXT 验证记录...`;
        await saveCert(cert);
        await addLog(cert.id, cert.domain, 'info', `正在通过 DNS 接口为 ${authz.identifier.value} 增加 ACME TXT 校验记录...`);
        
        const provider = providers[cert.provider];
        if (!provider) {
          throw new Error(`未找到服务商 ${cert.provider} 的 DNS 适配器`);
        }

        // 调用域名服务商接口创建 TXT 记录
        await provider.createTxtRecord({
          credentials: cert.credentials,
          domain: authz.identifier.value,
          name: dnsRecord,
          value: recordValue,
          ttl: 60
        });

        cert.lastMessage = `已创建 TXT 记录，正在等待 DNS 刷新及生效...`;
        await saveCert(cert);
        const delaySec = cert.dnsDelay ? parseInt(cert.dnsDelay) : 15;
        await addLog(cert.id, cert.domain, 'info', `TXT 记录已创建，正在等待 DNS 全球生效 (延时设定: ${delaySec} 秒)...`);

        // 默认等待 15 秒以确保 DNS 记录在服务商全球生效
        const delayMs = delaySec * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      },
      challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
        const dnsRecord = `_acme-challenge.${authz.identifier.value}`;
        const provider = providers[cert.provider];
        if (provider) {
          cert.lastMessage = `正在清理 ${authz.identifier.value} 的 TXT 验证记录...`;
          await saveCert(cert);
          await addLog(cert.id, cert.domain, 'info', `正在自动清理 ${authz.identifier.value} 的 TXT 验证记录...`);
          try {
            await provider.deleteTxtRecord({
              credentials: cert.credentials,
              domain: authz.identifier.value,
              name: dnsRecord
            });
            await addLog(cert.id, cert.domain, 'success', `${authz.identifier.value} 的 TXT 验证记录已清理成功。`);
          } catch (e) {
            console.error(`清理 TXT 验证记录失败: ${e.message}`);
            await addLog(cert.id, cert.domain, 'error', `自动清理 ${authz.identifier.value} 的 TXT 记录失败: ${e.message}`);
          }
        }
      }
    });

    // 申请成功，解析证书过期时间并保存证书 PEM 和 KEY PEM
    cert.status = 'success';
    cert.lastUpdated = new Date().toISOString();
    
    try {
      const certInfo = acme.crypto.readCertificateInfo(certificate);
      if (certInfo && certInfo.notAfter) {
        cert.expiryDate = certInfo.notAfter.toISOString();
      } else {
        cert.expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      }
    } catch (e) {
      cert.expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    cert.certContent = certificate.toString();
    cert.keyContent = certKey.toString();
    cert.lastMessage = '证书申请成功';
    await saveCert(cert);
    await addLog(cert.id, cert.domain, 'success', `SSL 证书成功签发并保存！到期日: ${cert.expiryDate.split('T')[0]}`);

    return cert;
  } catch (err) {
    cert.status = 'error';
    cert.lastMessage = `申请失败: ${err.message}`;
    await saveCert(cert);
    await addLog(cert.id, cert.domain, 'error', `SSL 证书申请/续期失败: ${err.message}`);
    throw err;
  }
}

/**
 * 定期检查并自动续期证书
 */
export async function checkAndRenewCerts() {
  const certs = await getCerts();
  for (const cert of certs) {
    if (!cert.enabled) continue;
    if (cert.status === 'processing') continue;

    // 检查有效期，如果少于 30 天则自动续期
    if (cert.expiryDate) {
      const expiryMs = new Date(cert.expiryDate).getTime();
      const now = Date.now();
      const remainDays = (expiryMs - now) / (24 * 60 * 60 * 1000);
      
      if (remainDays < 30) {
        console.log(`[SSL 续期] 证书 ${cert.domain} 剩余有效期 ${remainDays.toFixed(1)} 天，触发自动续期...`);
        issueCertificate(cert).catch(e => {
          console.error(`[SSL 续期错误] 自动续期 ${cert.domain} 失败: ${e.message}`);
        });
      }
    }
  }
}
