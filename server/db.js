import { promises as fs } from 'fs';
import path from 'path';

const DB_DIR = path.resolve('server/data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// 默认的初始数据状态
const defaultDb = {
  tasks: [],
  logs: [],
  certs: [],
  settings: {
    port: 8080
  }
};

let dbCache = null;

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function loadDb() {
  if (dbCache) return dbCache;
  
  await ensureDir(DB_DIR);
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
  } catch (err) {
    // 如果数据库文件不存在或损坏，使用默认值初始化
    dbCache = JSON.parse(JSON.stringify(defaultDb));
    await saveDb();
  }
  return dbCache;
}

async function saveDb() {
  if (!dbCache) return;
  await ensureDir(DB_DIR);
  const tempPath = `${DB_FILE}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(dbCache, null, 2), 'utf-8');
  await fs.rename(tempPath, DB_FILE);
}

export async function getSettings() {
  const db = await loadDb();
  return db.settings;
}

export async function saveSettings(settings) {
  const db = await loadDb();
  db.settings = { ...db.settings, ...settings };
  await saveDb();
}

export async function getTasks() {
  const db = await loadDb();
  return db.tasks;
}

export async function getTask(id) {
  const db = await loadDb();
  return db.tasks.find(t => t.id === id);
}

export async function saveTask(task) {
  const db = await loadDb();
  if (!task.id) {
    task.id = 'task_' + Math.random().toString(36).substring(2, 11);
    db.tasks.push(task);
  } else {
    const idx = db.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      db.tasks[idx] = { ...db.tasks[idx], ...task };
    } else {
      db.tasks.push(task);
    }
  }
  await saveDb();
  return task;
}

export async function deleteTask(id) {
  const db = await loadDb();
  db.tasks = db.tasks.filter(t => t.id !== id);
  // 同时清理该任务关联的日志
  db.logs = db.logs.filter(l => l.taskId !== id);
  await saveDb();
}

export async function addLog(taskId, taskName, type, message) {
  const db = await loadDb();
  const log = {
    id: 'log_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
    taskId,
    taskName,
    type, // 日志类型：'success' (成功) | 'error' (失败) | 'info' (普通)
    message,
    timestamp: new Date().toISOString()
  };
  
  db.logs.unshift(log);
  
  // 限制日志最多 500 条，防止文件无限变大
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  
  await saveDb();
  return log;
}

export async function getLogs(limit = 100) {
  const db = await loadDb();
  return db.logs.slice(0, limit);
}

export async function getCerts() {
  const db = await loadDb();
  if (!db.certs) db.certs = [];
  return db.certs;
}

export async function getCert(id) {
  const db = await loadDb();
  if (!db.certs) db.certs = [];
  return db.certs.find(c => c.id === id);
}

export async function saveCert(cert) {
  const db = await loadDb();
  if (!db.certs) db.certs = [];
  if (!cert.id) {
    cert.id = 'cert_' + Math.random().toString(36).substring(2, 11);
    db.certs.push(cert);
  } else {
    const idx = db.certs.findIndex(c => c.id === cert.id);
    if (idx !== -1) {
      db.certs[idx] = { ...db.certs[idx], ...cert };
    } else {
      db.certs.push(cert);
    }
  }
  await saveDb();
  return cert;
}

export async function deleteCert(id) {
  const db = await loadDb();
  if (!db.certs) db.certs = [];
  db.certs = db.certs.filter(c => c.id !== id);
  await saveDb();
}
