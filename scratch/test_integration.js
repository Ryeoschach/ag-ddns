// DDNS Integration Test

const PORT = 8092; // Use port 8092 for testing to avoid conflicts

// Set custom port in settings before launching
import { promises as fs } from 'fs';
import path from 'path';

const DB_DIR = path.resolve('server/data');
const DB_FILE = path.join(DB_DIR, 'db.json');

async function setupTestDb() {
  await fs.mkdir(DB_DIR, { recursive: true });
  const testDb = {
    tasks: [],
    logs: [],
    settings: {
      port: PORT,
      dashboardToken: 'TEST_TOKEN'
    }
  };
  await fs.writeFile(DB_FILE, JSON.stringify(testDb, null, 2), 'utf-8');
}

async function runTests() {
  await setupTestDb();
  console.log('Test database prepared. Starting server on port ' + PORT);

  // Dynamically import server.js to run it in process
  await import('../server/server.js');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n--- Starting Integration Test ---');
  
  // 1. Create a remote-client task via HTTP POST
  const createTaskPayload = {
    name: 'Integration Test Task',
    provider: 'cloudflare',
    domain: 'client1.test.com, client2.test.com',
    recordType: 'A',
    mode: 'remote-client',
    checkInterval: 5,
    ttl: 120,
    proxied: true,
    credentials: {
      token: 'fake-token-123'
    }
  };

  console.log('1. Creating remote-client DDNS task...');
  const createRes = await fetch(`http://localhost:${PORT}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createTaskPayload)
  });
  
  if (!createRes.ok) {
    throw new Error('Failed to create task: ' + (await createRes.text()));
  }
  
  const createdTask = await createRes.json();
  console.log('[PASS] Task created. ID: ' + createdTask.id + ', ClientKey: ' + createdTask.clientKey + ', Proxied: ' + createdTask.proxied);

  // 2. Fetch all tasks to verify
  console.log('\n2. Verifying task appears in task list...');
  const listRes = await fetch(`http://localhost:${PORT}/api/tasks`);
  const tasksList = await listRes.json();
  if (tasksList.length !== 1 || tasksList[0].id !== createdTask.id) {
    throw new Error('Task list verification failed');
  }
  if (tasksList[0].proxied !== true) {
    throw new Error('Task proxied field was not true');
  }
  console.log('[PASS] Task list contains the created task and correct proxied state.');

  // 3. Simulating Remote Client Reporting IP
  console.log('\n3. Simulating Client Agent reporting IP change...');
  const reportPayload = {
    clientKey: createdTask.clientKey,
    ip: '192.168.1.100'
  };
  
  // Note: the server will try to update Cloudflare because the task is enabled and uses fake credentials,
  // which will fail! So we expect a 500 error, but we want to verify that the task state is updated to 'error'
  // and the error message matches Cloudflare api failure, indicating the client request went all the way through!
  const reportRes = await fetch(`http://localhost:${PORT}/api/client/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportPayload)
  });

  console.log(`Report status: ${reportRes.status}`);
  const reportResult = await reportRes.json();
  console.log('Report result details: ' + JSON.stringify(reportResult));

  // 4. Verify task state has updated
  console.log('\n4. Checking task status after report...');
  const checkRes = await fetch(`http://localhost:${PORT}/api/tasks`);
  const updatedTasks = await checkRes.json();
  const updatedTask = updatedTasks[0];
  
  console.log('Task last status: ' + updatedTask.lastStatus);
  console.log('Task last message: ' + updatedTask.lastMessage);
  console.log('Task last IP: ' + updatedTask.lastIp);

  if (updatedTask.lastIp !== '192.168.1.100') {
    throw new Error('Task IP was not updated to 192.168.1.100');
  }
  if (updatedTask.lastStatus !== 'error' || (!updatedTask.lastMessage.includes('Cloudflare') && !updatedTask.lastMessage.includes('fetch failed'))) {
    throw new Error('Task did not record the expected Cloudflare update error');
  }
  console.log('[PASS] Client report successfully updated task state with IP and provider call error.');

  // 5. Verify log creation
  console.log('\n5. Checking activity logs...');
  const logsRes = await fetch(`http://localhost:${PORT}/api/logs`);
  const logs = await logsRes.json();
  console.log('Latest logs: ', logs.slice(0, 2));
  if (logs.length === 0 || (!logs[0].message.includes('failed') && !logs[0].message.includes('失败'))) {
    throw new Error('Logs do not contain the failure log');
  }
  console.log('[PASS] Activity logs correctly recorded the client update failure.');

  console.log('\n--- All Integration Tests Passed! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Failed: ', err);
  process.exit(1);
});
