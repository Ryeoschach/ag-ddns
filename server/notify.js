import { getSettings } from './db.js';

/**
 * 统一推送通知接口
 * @param {string} title 通知标题
 * @param {string} message 通知详细内容
 */
export async function sendNotification(title, message) {
  let settings;
  try {
    settings = await getSettings();
  } catch (err) {
    console.error('获取配置信息以进行通知失败:', err.message);
    return;
  }

  const tasks = [];

  // 1. Telegram Bot 推送
  if (settings.notifyTelegramToken && settings.notifyTelegramChatId) {
    tasks.push((async () => {
      try {
        const url = `https://api.telegram.org/bot${settings.notifyTelegramToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.notifyTelegramChatId,
            text: `⚠️ *${title}*\n\n${message}`,
            parse_mode: 'Markdown'
          })
        });
        if (!res.ok) {
          throw new Error(`Telegram API status ${res.status}`);
        }
      } catch (e) {
        console.error('Telegram 通知推送失败:', e.message);
      }
    })());
  }

  // 2. 钉钉机器人推送
  if (settings.notifyDingTalk) {
    tasks.push((async () => {
      try {
        const res = await fetch(settings.notifyDingTalk, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msgtype: 'markdown',
            markdown: {
              title: title,
              text: `### ⚠️ ${title}\n\n${message}`
            }
          })
        });
        if (!res.ok) {
          throw new Error(`DingTalk status ${res.status}`);
        }
      } catch (e) {
        console.error('钉钉机器人通知推送失败:', e.message);
      }
    })());
  }

  // 3. 企业微信群机器人推送
  if (settings.notifyWeChat) {
    tasks.push((async () => {
      try {
        const res = await fetch(settings.notifyWeChat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msgtype: 'markdown',
            markdown: {
              content: `### ⚠️ <font color="warning">${title}</font>\n\n${message}`
            }
          })
        });
        if (!res.ok) {
          throw new Error(`WeChat Work status ${res.status}`);
        }
      } catch (e) {
        console.error('企业微信群机器人通知推送失败:', e.message);
      }
    })());
  }

  // 4. 飞书机器人推送
  if (settings.notifyFeishu) {
    tasks.push((async () => {
      try {
        const res = await fetch(settings.notifyFeishu, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msg_type: 'post',
            content: {
              post: {
                zh_cn: {
                  title: title,
                  content: [
                    [{ tag: 'text', text: message }]
                  ]
                }
              }
            }
          })
        });
        if (!res.ok) {
          throw new Error(`Feishu status ${res.status}`);
        }
      } catch (e) {
        console.error('飞书通知推送失败:', e.message);
      }
    })());
  }

  // 5. 自定义 HTTP Webhook 推送 (POST JSON)
  if (settings.notifyCustomUrl) {
    tasks.push((async () => {
      try {
        const res = await fetch(settings.notifyCustomUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'alert',
            title: title,
            message: message,
            timestamp: new Date().toISOString()
          })
        });
        if (!res.ok) {
          throw new Error(`Custom webhook status ${res.status}`);
        }
      } catch (e) {
        console.error('自定义 Webhook 通知推送失败:', e.message);
      }
    })());
  }

  if (tasks.length > 0) {
    await Promise.all(tasks).catch(() => {});
  }
}

/**
 * 测试通知通道配置（直接返回各个通道的测试结果报告）
 * @param {object} customSettings 待测试的配置对象（由前端表单实时传入）
 * @returns {Promise<object>} 返回各个通道的发送结果，如 { Telegram: { success: true }, DingTalk: { success: false, error: '...' } }
 */
export async function testNotification(customSettings) {
  const settings = customSettings;
  const results = {};

  async function runTest(name, fn) {
    try {
      await fn();
      results[name] = { success: true };
    } catch (e) {
      results[name] = { success: false, error: e.message };
    }
  }

  const tasks = [];

  // 1. Telegram Bot
  if (settings.notifyTelegramToken && settings.notifyTelegramChatId) {
    tasks.push(runTest('Telegram', async () => {
      const url = `https://api.telegram.org/bot${settings.notifyTelegramToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.notifyTelegramChatId,
          text: `⚠️ *AG-DDNS 配置测试*\n\n这是一条测试您的 Telegram Bot 通道配置的消息。`,
          parse_mode: 'Markdown'
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
    }));
  }

  // 2. 钉钉机器人
  if (settings.notifyDingTalk) {
    tasks.push(runTest('DingTalk', async () => {
      const res = await fetch(settings.notifyDingTalk, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            title: 'AG-DDNS 配置测试',
            text: `### ⚠️ AG-DDNS 配置测试\n\n这是一条测试您的 钉钉机器人 通道配置的消息。`
          }
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json().catch(() => ({}));
      if (data.errcode !== undefined && data.errcode !== 0) {
        throw new Error(`DingTalk Error ${data.errcode}: ${data.errmsg}`);
      }
    }));
  }

  // 3. 企业微信群机器人
  if (settings.notifyWeChat) {
    tasks.push(runTest('WeChat', async () => {
      const res = await fetch(settings.notifyWeChat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            content: `### ⚠️ <font color="warning">AG-DDNS 配置测试</font>\n\n这是一条测试您的 企业微信群机器人 通道配置的消息。`
          }
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json().catch(() => ({}));
      if (data.errcode !== undefined && data.errcode !== 0) {
        throw new Error(`WeChat Error ${data.errcode}: ${data.errmsg}`);
      }
    }));
  }

  // 4. 飞书机器人
  if (settings.notifyFeishu) {
    tasks.push(runTest('Feishu', async () => {
      const res = await fetch(settings.notifyFeishu, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'post',
          content: {
            post: {
              zh_cn: {
                title: 'AG-DDNS 配置测试',
                content: [
                  [{ tag: 'text', text: '这是一条测试您的 飞书机器人 通道配置的消息。' }]
                ]
              }
            }
          }
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json().catch(() => ({}));
      if (data.code !== undefined && data.code !== 0) {
        throw new Error(`Feishu Error ${data.code}: ${data.msg}`);
      }
      if (data.StatusCode !== undefined && data.StatusCode !== 0) {
        throw new Error(`Feishu Error ${data.StatusCode}: ${data.StatusMessage}`);
      }
    }));
  }

  // 5. 自定义 HTTP Webhook 推送 (POST JSON)
  if (settings.notifyCustomUrl) {
    tasks.push(runTest('CustomURL', async () => {
      const res = await fetch(settings.notifyCustomUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          title: 'AG-DDNS 配置测试',
          message: '这是一条测试您的 自定义 HTTP Webhook 通道配置的消息。',
          timestamp: new Date().toISOString()
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
    }));
  }

  if (tasks.length === 0) {
    return { error: '未填报任何需要测试的通知通道信息' };
  }

  await Promise.all(tasks);
  return results;
}
