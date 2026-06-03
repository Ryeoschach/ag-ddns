import { generateBash, generatePython } from '../server/exporter.js';

const mockTasks = [
  {
    id: 'task_cf',
    name: 'Cloudflare IPv4',
    provider: 'cloudflare',
    domain: 'test1.example.com, test2.example.com',
    recordType: 'A',
    ttl: 120,
    proxied: true,
    credentials: {
      token: 'cf-test-token',
      zoneId: 'cf-zone-id-123'
    }
  },
  {
    id: 'task_ali',
    name: 'Aliyun IPv6',
    provider: 'aliyun',
    domain: 'dns.example.org',
    recordType: 'AAAA',
    ttl: 600,
    credentials: {
      id: 'LTAI123456',
      secret: 'aliyun-secret-key-abc'
    }
  },
  {
    id: 'task_dp',
    name: 'DNSPod IPv4',
    provider: 'dnspod',
    domain: 'dns.example.cn',
    recordType: 'A',
    ttl: 600,
    credentials: {
      id: 'dp-id-123',
      token: 'dp-token-abc'
    }
  }
];

function runTest() {
  console.log('--- Starting Standalone Exporter Tests ---');
  
  mockTasks.forEach(task => {
    console.log(`\nTesting exporter for: ${task.name} (${task.provider})`);
    
    // 1. Generate Bash Script
    const bashScript = generateBash(task);
    if (!bashScript || !bashScript.includes(task.domain) || !bashScript.includes(task.recordType)) {
      throw new Error(`Bash script generation failed for ${task.provider}: missing domain or recordType`);
    }
    console.log(`[PASS] Bash script generated successfully (${bashScript.length} chars)`);
    
    // Check provider-specific values
    if (task.provider === 'cloudflare' && !bashScript.includes('cf-test-token')) {
      throw new Error('Bash Cloudflare script missing token');
    }
    if (task.provider === 'cloudflare' && !bashScript.includes('CF_PROXIED="true"')) {
      throw new Error('Bash Cloudflare script missing dynamic CF_PROXIED config');
    }
    if (task.provider === 'aliyun' && !bashScript.includes('LTAI123456')) {
      throw new Error('Bash Aliyun script missing AccessKeyId');
    }
    if (task.provider === 'dnspod' && !bashScript.includes('dp-id-123')) {
      throw new Error('Bash DNSPod script missing Login Token ID');
    }
    
    // 2. Generate Python Script
    const pythonScript = generatePython(task);
    if (!pythonScript || !pythonScript.includes(task.domain) || !pythonScript.includes(task.recordType)) {
      throw new Error(`Python script generation failed for ${task.provider}: missing domain or recordType`);
    }
    console.log(`[PASS] Python script generated successfully (${pythonScript.length} chars)`);
    
    // Check provider-specific values
    if (task.provider === 'cloudflare' && !pythonScript.includes('cf-test-token')) {
      throw new Error('Python Cloudflare script missing token');
    }
    if (task.provider === 'cloudflare' && !pythonScript.includes('CF_PROXIED = True')) {
      throw new Error('Python Cloudflare script missing dynamic CF_PROXIED config');
    }
    if (task.provider === 'aliyun' && !pythonScript.includes('LTAI123456')) {
      throw new Error('Python Aliyun script missing AccessKeyId');
    }
    if (task.provider === 'dnspod' && !pythonScript.includes('dp-id-123')) {
      throw new Error('Python DNSPod script missing Login Token ID');
    }
  });
  
  console.log('\n--- All Exporter Tests Passed Successfully! ---');
}

runTest();
