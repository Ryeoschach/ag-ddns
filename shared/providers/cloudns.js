/**
 * ClouDNS 服务商适配器 (暂未实现本地 Node 直连更新，请导出脚本使用)
 */
export async function updateRecord({ credentials, domain, recordType, ip, ttl }) {
  return {
    success: true,
    ip,
    updated: false,
    msg: 'ClouDNS 暂不支持在中心服务端直连更新。请导出并使用生成的 Python 或 Bash 脚本！'
  };
}
