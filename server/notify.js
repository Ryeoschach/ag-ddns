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
