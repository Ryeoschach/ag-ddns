import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_DIR = path.resolve('server/data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const KEY_FILE = path.join(DB_DIR, 'secret.key');

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
let encryptionKey = null;

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function getEncryptionKey() {
  if (encryptionKey) return encryptionKey;
  await ensureDir(DB_DIR);
  try {
    const keyData = await fs.readFile(KEY_FILE);
    if (keyData.length === 32) {
      encryptionKey = keyData;
      return encryptionKey;
    }
  } catch (err) {
    // Ignore error and generate
  }
  encryptionKey = crypto.randomBytes(32);
  await fs.writeFile(KEY_FILE, encryptionKey);
  return encryptionKey;
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(cipherText, key) {
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('解密凭证失败:', err.message);
    return null;
  }
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function verifyPassword(password) {
  const settings = await getSettings();
  if (!settings.password) {
    return true;
  }
  const hashed = hashPassword(password);
  return settings.password === hashed;
}

export async function setPassword(password) {
  const hashed = password ? hashPassword(password) : '';
  await saveSettings({ password: hashed });
}

async function loadDb() {
  if (dbCache) return dbCache;
  
  await ensureDir(DB_DIR);
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    
    // 自动解密已加密的 credentials 字段
    const key = await getEncryptionKey();
    if (dbCache.tasks) {
      for (const task of dbCache.tasks) {
        if (task.credentials && typeof task.credentials === 'string') {
          const decrypted = decrypt(task.credentials, key);
          if (decrypted) {
            try {
              task.credentials = JSON.parse(decrypted);
            } catch (e) {
              console.error('解析任务解密凭证失败:', task.id);
            }
          }
        }
      }
    }
    if (dbCache.certs) {
      for (const cert of dbCache.certs) {
        if (cert.credentials && typeof cert.credentials === 'string') {
          const decrypted = decrypt(cert.credentials, key);
          if (decrypted) {
            try {
              cert.credentials = JSON.parse(decrypted);
            } catch (e) {
              console.error('解析证书解密凭证失败:', cert.id);
            }
          }
        }
      }
    }
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
  
  // 克隆数据库以避免在内存中污染 dbCache 为加密字符串
  const dbCopy = JSON.parse(JSON.stringify(dbCache));
  const key = await getEncryptionKey();
  
  if (dbCopy.tasks) {
    for (const task of dbCopy.tasks) {
      if (task.credentials && typeof task.credentials === 'object') {
        const plainText = JSON.stringify(task.credentials);
        task.credentials = encrypt(plainText, key);
      }
    }
  }
  if (dbCopy.certs) {
    for (const cert of dbCopy.certs) {
      if (cert.credentials && typeof cert.credentials === 'object') {
        const plainText = JSON.stringify(cert.credentials);
        cert.credentials = encrypt(plainText, key);
      }
    }
  }

  const tempPath = `${DB_FILE}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(dbCopy, null, 2), 'utf-8');
  await fs.rename(tempPath, DB_FILE);
}

export async function getSettings() {
  const db = await loadDb();
  return db.settings;
}

export async function saveSettings(settings) {
  const db = await loadDb();
  const updatedSettings = { ...settings };
  if (updatedSettings.password !== undefined) {
    if (updatedSettings.password) {
      updatedSettings.password = hashPassword(updatedSettings.password);
    } else {
      updatedSettings.password = '';
    }
  } else {
    updatedSettings.password = db.settings.password || '';
  }
  db.settings = { ...db.settings, ...updatedSettings };
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
