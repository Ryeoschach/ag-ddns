// AG-DDNS 控制面板脚本
// 支持中英文语言包和深色/浅色主题（自动跟随系统）

const translations = {
  en: {
    appTitle: "DDNS Dashboard",
    logoSub: "Dynamic DNS Manager",
    themeAuto: "🌓 System",
    themeLight: "☀️ Light",
    themeDark: "🌙 Dark",
    btnNewTask: "New DDNS Task",
    btnSettings: "Settings",
    metricTotal: "Total Tasks",
    metricHealthy: "Active / Healthy",
    metricFailed: "Failed / Offline",
    secTasksTitle: "DDNS Task Management",
    pulseLive: "● Live",
    emptyStateTitle: "No DDNS Tasks Found",
    emptyStateSub: "Click \"New DDNS Task\" to add your first domain configuration.",
    secLogsTitle: "Activity Console Logs",
    btnClearLogs: "Clear Console",
    modalTitleAdd: "Add DDNS Task",
    modalTitleEdit: "Edit DDNS Task",
    lblTaskName: "Task Name",
    phTaskName: "e.g. Home Server IPv4",
    lblOperationMode: "Operation Mode",
    optModeLocal: "Local Mode (Server Updates)",
    optModeRemote: "Remote Client Mode (Agent Reports)",
    helpOperationMode: "Local runs checks on this server. Remote expects an external client agent to report its IP.",
    lblDnsProvider: "DNS Provider",
    lblCfAuthMethod: "Auth Method",
    optCfToken: "API Token (Bearer)",
    optCfGlobal: "Global API Key",
    lblCfZoneId: "Zone ID (Optional)",
    phCfZoneId: "Auto-detected if left empty",
    lblCfToken: "API Token",
    phCfToken: "Enter Cloudflare API Token",
    lblCfEmail: "Account Email",
    phCfEmail: "user@example.com",
    lblCfGlobalKey: "Global API Key",
    phCfGlobalKey: "Enter Global API Key",
    lblAliKeyId: "AccessKey ID",
    lblAliSecret: "AccessKey Secret",
    lblDpId: "Token ID",
    lblDpToken: "Token Value",
    lblDomainName: "Domain Name(s)",
    phDomainName: "e.g. a.example.com, b.example.com",
    lblRecordType: "Record Type",
    lblTtl: "TTL (Seconds)",
    phTtl: "e.g. 600",
    lblCheckInterval: "Check Interval (Minutes)",
    phCheckInterval: "e.g. 5",
    lblIpSource: "IP Source",
    optIpPublic: "Public IP (Auto APIs)",
    optIpInterface: "Local Network Interface",
    optIpUrl: "Custom HTTP URL",
    lblInterfaceName: "Interface Name",
    lblCustomCheckUrl: "Custom Check URL",
    lblClientRegKey: "Remote Client Registration Key",
    lblGenerateOnSave: "Generate on save",
    btnCopyKey: "Copy Key",
    btnResetKey: "Reset Key",
    helpClientKey: "Provide this key to your Node.js agent client config so it can authenticate reports.",
    helpClientKeyText: "In remote mode, you need to install the client agent on the monitored device and configure this clientKey inside its config.json. The client will then automatically report its public IP to this server.",
    helpCertKeyText: "With this dedicated client key, other systems (such as external Nginx servers or Kubernetes clusters) can securely pull and sync this certificate and private key using our API endpoint. Pull API Example:",
    lblEnableTask: "Enable Task",
    lblCfProxied: "Enable Cloudflare CDN Proxy (Proxied)",
    btnCancel: "Cancel",
    btnSaveTask: "Save Task",
    settingsTitle: "System Settings",
    lblDashboardPort: "Dashboard Port",
    helpDashboardPort: "Requires server restart to apply changes.",
    btnSaveSettings: "Save Settings",
    lblSettingScriptInfo: "Custom Script Header Info / License",
    helpSettingScriptInfo: "This custom text will be prepended as comments at the top of generated scripts.",
    exportTitle: "Export Standalone Script",
    exportSub: "Export a self-contained, lightweight, zero-dependency script pre-filled with credentials for domain:",
    tabBash: "Bash Script (.sh)",
    tabPython: "Python Script (.py)",
    btnCopy: "Copy Script",
    btnDownload: "Download File",
    
    // JS 动态翻译字符
    modeLocal: "Local Mode",
    modeAgent: "Agent Mode",
    statusHealthy: "Healthy",
    statusFailed: "Failed",
    statusReady: "Ready",
    statusDisabled: "Disabled",
    statusNever: "Never",
    rowDnsProvider: "DNS Provider",
    rowRecordType: "Record Type",
    rowDnsIp: "DNS IP Address",
    rowCheckInterval: "Check Interval",
    rowLastChecked: "Last Checked",
    rowMessage: "Feedback State",
    unitMins: "mins",
    valNa: "N/A",
    tipRunNow: "Run Check Now",
    tipExport: "Export Standalone Script",
    tipEdit: "Edit Config",
    tipDelete: "Delete Task",
    tipDuplicate: "Duplicate Task",
    confirmDelete: "Are you sure you want to delete DDNS task \"{name}\"?",
    copySuccess: "Copied to clipboard!",
    keyResetSuccess: "Client key reset successfully!",
    confirmTitle: "System Confirmation",
    btnConfirm: "Confirm",
    errRunTask: "Error running task",
    errNetWork: "Network error",
    settingsSaveSuccess: "Settings saved. Port changes will apply upon server restart.",
    tabDdnsTitle: "DDNS Tasks",
    tabCertsTitle: "SSL Certificates",
    secCertsTitle: "SSL Certificates",
    btnNewCert: "New Certificate",
    emptyCertStateTitle: "No Certificates Found",
    emptyCertStateSub: "Click \"New Certificate\" to add your first SSL certificate configuration.",
    certModalTitleAdd: "Add SSL Certificate",
    certModalTitleEdit: "Edit SSL Certificate",
    lblCertDomain: "Domain Names (comma separated)",
    lblCertDnsProvider: "DNS Provider",
    lblCertEmail: "ACME Email Address",
    lblCertDnsDelay: "DNS Propagation Delay (Seconds)",
    lblCertUseStaging: "Use Let's Encrypt Staging",
    lblEnableCert: "Enable Auto-Renewal",
    btnSaveCert: "Save Configuration",
    rowExpiryDate: "Expiry Date",
    tipRenew: "Renew Certificate Now",
    tipDownload: "Download Cert & Key",
    confirmDeleteCert: "Are you sure you want to delete certificate configuration for \"{domain}\"?",
    certSaveSuccess: "Certificate configuration saved.",
    certRenewTriggered: "Certificate renewal task has been manually triggered. Monitor the console for updates.",
    statActive: "Active Certs",
    statExpiring: "Expiring Soon (<30d)",
    statExpired: "Expired Certs",
    lblExpiryTimeline: "Certificate Expiration Timeline",
    loginTitle: "System Authentication",
    lblLoginPassword: "Enter Dashboard Password",
    btnLogin: "Authorize",
    lblDashboardPassword: "Dashboard Password",
    lblDisablePasswordAuth: "Remove password protection (public access)",
    helpDashboardPassword: "Enter a new password to restrict Web UI access, or check the box to remove authentication.",
    sectionNotifications: "Notification Webhooks",
    lblNotifyTelegram: "Telegram Bot Token & Chat ID",
    helpNotifyTelegram: "Telegram bot access token and chat ID. Leave empty to disable.",
    lblNotifyDingTalk: "DingTalk Webhook URL",
    helpNotifyDingTalk: "DingTalk bot access token webhook URL. Leave empty to disable.",
    lblNotifyWeChat: "WeChat Work Webhook URL",
    helpNotifyWeChat: "WeChat Work bot webhook URL. Leave empty to disable.",
    lblNotifyFeishu: "Feishu Webhook URL",
    helpNotifyFeishu: "Feishu bot webhook URL. Leave empty to disable.",
    lblNotifyCustomUrl: "Custom HTTP Webhook URL",
    helpNotifyCustomUrl: "A custom URL that will receive notifications via POST request (JSON payload). Leave empty to disable.",
    optAllTasks: "All Tasks",
    optAllLogTypes: "All Types",
    optLogSuccess: "Success",
    optLogError: "Error",
    optLogInfo: "Info",
    btnDownloadLogs: "Download Logs",
    secIpHistoryTitle: "Recent IP Changes History",
    loginSuccess: "Authorized successfully!",
    logsDownloadSuccess: "Logs downloaded successfully!"
  },
  zh: {
    appTitle: "DDNS 管理面板",
    logoSub: "智能动态域名解析管理器",
    themeAuto: "🌓 跟随系统",
    themeLight: "☀️ 浅色模式",
    themeDark: "🌙 深色模式",
    btnNewTask: "新建 DDNS 任务",
    btnSettings: "全局设置",
    metricTotal: "任务总数",
    metricHealthy: "运行正常 / 健康",
    metricFailed: "运行失败 / 离线",
    secTasksTitle: "DDNS 任务管理",
    pulseLive: "● 实时监测",
    emptyStateTitle: "暂无域名解析任务",
    emptyStateSub: "点击上方“新建 DDNS 任务”按钮添加您的第一个解析配置。",
    secLogsTitle: "运行日志控制台",
    btnClearLogs: "清空日志",
    modalTitleAdd: "添加 DDNS 解析任务",
    modalTitleEdit: "编辑 DDNS 解析任务",
    lblTaskName: "任务名称",
    phTaskName: "例如：群晖NAS IPv4",
    lblOperationMode: "运行模式",
    optModeLocal: "本地模式（服务端定期检测并更新）",
    optModeRemote: "远程客户端模式（远程客户端上报IP）",
    helpOperationMode: "本地模式：由本服务器直接获取自身公网IP进行解析。远程模式：由安装了Agent代理的外部设备上报IP后，再由本服务器调用API更新解析。",
    lblDnsProvider: "DNS 服务商",
    lblCfAuthMethod: "身份验证方式",
    optCfToken: "API 密钥 Token (推荐)",
    optCfGlobal: "全局 Global API Key",
    lblCfZoneId: "Zone ID (选填)",
    phCfZoneId: "不填将通过API自动检测获取",
    lblCfToken: "API Token",
    phCfToken: "请输入 Cloudflare API Token 密钥",
    lblCfEmail: "账户 Email",
    phCfEmail: "user@example.com",
    lblCfGlobalKey: "全局 API Key",
    phCfGlobalKey: "请输入 Global API Key",
    lblAliKeyId: "AccessKey ID",
    lblAliSecret: "AccessKey Secret",
    lblDpId: "Token ID",
    lblDpToken: "Token 密钥",
    lblDomainName: "域名（多个域名用逗号分隔）",
    phDomainName: "例如：a.example.com, b.example.com",
    lblRecordType: "解析记录类型",
    lblTtl: "TTL 缓存生存时间 (秒)",
    phTtl: "默认 600 秒",
    lblCheckInterval: "检查周期 (分钟)",
    phCheckInterval: "默认 5 分钟",
    lblIpSource: "本地 IP 获取源",
    optIpPublic: "公网 API 自动探测",
    optIpInterface: "读取本地物理网卡",
    optIpUrl: "自定义网页提取 URL",
    lblInterfaceName: "网卡接口名称",
    lblCustomCheckUrl: "自定义 IP 检测网页 URL",
    lblClientRegKey: "远程客户端注册密钥 (Client Key)",
    lblGenerateOnSave: "保存后自动生成",
    btnCopyKey: "复制密钥",
    btnResetKey: "重置密钥",
    helpClientKey: "请将此 Key 填入您安装在远程设备上的 node 客户端 agent 配置文件中，以便通过身份验证。",
    helpClientKeyText: "在远程模式下，您需要在被监测的设备上运行客户端代理 (Client Agent)，并在此处获取对应的密钥填入客户端配置文件 config.json 的 clientKey 字段中。保存后，客户端即可向本服务器自动上报其公网 IP 并更新解析。",
    helpCertKeyText: "配置该专属密钥后，其他系统（例如外部 Nginx 节点、Docker 容器或 K8s 集群）可以通过 API 定期拉取并同步此证书和私钥文件。拉取请求示例：",
    lblEnableTask: "启用此 DDNS 任务",
    lblCfProxied: "开启 Cloudflare CDN 代理 (已代理 / 橙色云朵)",
    btnCancel: "取消",
    btnSaveTask: "保存任务",
    settingsTitle: "全局系统设置",
    lblDashboardPort: "控制台端口",
    helpDashboardPort: "修改此端口需要重启 DDNS 服务端生效。",
    btnSaveSettings: "保存设置",
    lblSettingScriptInfo: "自定义脚本介绍/授权信息",
    helpSettingScriptInfo: "此处填写的文字将作为注释前缀自动插入到所有导出的 Python/Bash 脚本文件的最上方。",
    exportTitle: "导出独立运行脚本",
    exportSub: "导出一个完全独立、包含内置凭证且无外部模块依赖的轻量级自动更新脚本：",
    tabBash: "Bash 脚本 (.sh)",
    tabPython: "Python 脚本 (.py)",
    btnCopy: "复制脚本",
    btnDownload: "下载文件",
    
    // JS 动态翻译字符
    modeLocal: "本地模式",
    modeAgent: "客户端模式",
    statusHealthy: "正常",
    statusFailed: "失败",
    statusReady: "就绪",
    statusDisabled: "已禁用",
    statusNever: "从未检测",
    rowDnsProvider: "DNS 服务商",
    rowRecordType: "记录类型",
    rowDnsIp: "当前解析 IP",
    rowCheckInterval: "检测周期",
    rowLastChecked: "上次检查",
    rowMessage: "反馈状态",
    unitMins: "分钟",
    valNa: "无",
    tipRunNow: "立即执行检测更新",
    tipExport: "导出独立脚本",
    tipEdit: "编辑配置",
    tipDelete: "删除任务",
    tipDuplicate: "复制此任务配置",
    confirmDelete: "您确定要删除 DDNS 任务 \"{name}\" 吗？",
    copySuccess: "已成功复制到剪贴板！",
    keyResetSuccess: "密钥重置成功！",
    confirmTitle: "系统确认",
    btnConfirm: "确定",
    errRunTask: "任务执行失败",
    errNetWork: "网络请求异常",
    settingsSaveSuccess: "设置保存成功！端口修改将在重启服务端后生效。",
    tabDdnsTitle: "DDNS 任务",
    tabCertsTitle: "SSL 证书管理",
    secCertsTitle: "SSL 证书管理",
    btnNewCert: "申请/托管 SSL 证书",
    emptyCertStateTitle: "暂无 SSL 证书配置",
    emptyCertStateSub: "点击上方“申请/托管 SSL 证书”按钮添加您的第一个证书申请配置。",
    certModalTitleAdd: "添加 SSL 证书配置",
    certModalTitleEdit: "编辑 SSL 证书配置",
    lblCertDomain: "域名（多个域名用逗号分隔）",
    lblCertDnsProvider: "DNS 服务商",
    lblCertEmail: "ACME 邮箱地址",
    lblCertDnsDelay: "DNS 生效等待时间 (秒)",
    lblCertUseStaging: "使用 Let's Encrypt 测试环境 (Staging)",
    lblEnableCert: "启用自动检查并续期",
    btnSaveCert: "保存配置",
    rowExpiryDate: "过期时间",
    tipRenew: "立即申请/续期证书",
    tipDownload: "下载证书及私钥文件",
    confirmDeleteCert: "您确定要删除域名 \"{domain}\" 的证书配置吗？",
    certSaveSuccess: "证书配置保存成功。",
    certRenewTriggered: "证书申请/续期任务已手动触发，请在面板和日志中关注状态更新。",
    statActive: "有效证书",
    statExpiring: "即将过期 (<30天)",
    statExpired: "已过期证书",
    lblExpiryTimeline: "证书过期时效与寿命进度",
    loginTitle: "系统安全登录",
    lblLoginPassword: "请输入管理面板密码",
    btnLogin: "授权登录",
    lblDashboardPassword: "控制面板登录密码",
    lblDisablePasswordAuth: "清除并禁用密码保护（公开访问）",
    helpDashboardPassword: "输入新密码以限制仪表盘 Web UI 的访问权限，或者勾选上方选项以完全禁用密码保护。",
    sectionNotifications: "通知通道配置",
    lblNotifyTelegram: "Telegram 机器人 Token & Chat ID",
    helpNotifyTelegram: "Telegram 机器人的 API Token 及其关联的聊天 Chat ID，留空则禁用。",
    lblNotifyDingTalk: "钉钉机器人 Webhook URL",
    helpNotifyDingTalk: "钉钉机器人的 Webhook URL，留空则禁用。",
    lblNotifyWeChat: "企业微信 Webhook URL",
    helpNotifyWeChat: "企业微信机器人的 Webhook URL，留空则禁用。",
    lblNotifyFeishu: "飞书机器人 Webhook URL",
    helpNotifyFeishu: "飞书自建机器人的 Webhook URL，留空则禁用。",
    lblNotifyCustomUrl: "自定义 HTTP 接口 Webhook URL",
    helpNotifyCustomUrl: "可配置接收 HTTP POST JSON 数据包的自定义推送 URL 接口，留空则禁用。",
    optAllTasks: "所有任务",
    optAllLogTypes: "所有类型",
    optLogSuccess: "正常/成功",
    optLogError: "异常/失败",
    optLogInfo: "系统信息",
    btnDownloadLogs: "下载运行日志",
    secIpHistoryTitle: "最近公网 IP 变动历史",
    loginSuccess: "授权成功，欢迎回来！",
    logsDownloadSuccess: "日志下载成功！"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. 拦截 fetch 请求以自动注入 JWT Token 并捕获 401 错误
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    if (url.startsWith('/api/') && !url.startsWith('/api/auth/')) {
      const token = localStorage.getItem('ddns_token');
      if (token) {
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    try {
      const res = await originalFetch(url, options);
      if (res.status === 401 && !url.includes('/api/auth/login')) {
        localStorage.removeItem('ddns_token');
        showLoginModal();
        throw new Error('Unauthorized');
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  // 登录相关的 DOM 元素与逻辑
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const loginPassword = document.getElementById('loginPassword');

  function showLoginModal() {
    loginModal.classList.add('active');
    loginPassword.value = '';
    loginPassword.focus();
  }

  function hideLoginModal() {
    loginModal.classList.remove('active');
  }

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const password = loginPassword.value;
    const btnSubmit = document.getElementById('btnLoginSubmit');
    
    btnSubmit.disabled = true;
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = t('btnLogin', 'Authorize') + '...';

    try {
      const res = await originalFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Password incorrect', 'error');
      } else {
        localStorage.setItem('ddns_token', data.token);
        hideLoginModal();
        showToast(t('loginSuccess', 'Authorized successfully'), 'success');
        
        // 成功登录后，重新刷新数据
        fetchTasks();
        fetchCerts();
        fetchLogs();
        fetchIpHistory();
      }
    } catch (err) {
      showToast(t('errNetWork', 'Network error'), 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = originalText;
    }
  };

  // 主题与语言选择下拉框
  const langSelect = document.getElementById('langSelect');
  const themeSelect = document.getElementById('themeSelect');

  // 加载语言（默认自动读取浏览器语言）
  let currentLang = localStorage.getItem('ddns_lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
  
  // 加载主题（默认跟随系统）
  let currentTheme = localStorage.getItem('ddns_theme') || 'system';

  // 获取各种 DOM 元素
  const tasksGrid = document.getElementById('tasksGrid');
  const emptyState = document.getElementById('emptyState');
  const logsConsole = document.getElementById('logsConsole');
  const btnClearLogs = document.getElementById('btnClearLogs');
  
  // 证书管理元素
  const certsGrid = document.getElementById('certsGrid');
  const emptyCertState = document.getElementById('emptyCertState');
  const tabDdns = document.getElementById('tabDdns');
  const tabCerts = document.getElementById('tabCerts');
  const btnNewCert = document.getElementById('btnNewCert');
  const certModal = document.getElementById('certModal');
  const certForm = document.getElementById('certForm');
  const certProvider = document.getElementById('certProvider');
  const certCfAuthType = document.getElementById('certCfAuthType');
  
  // 系统运行状态指标卡片
  const metricTotal = document.getElementById('metricTotal');
  const metricHealthy = document.getElementById('metricHealthy');
  const metricFailed = document.getElementById('metricFailed');
  
  // 弹窗对话框
  const taskModal = document.getElementById('taskModal');
  const settingsModal = document.getElementById('settingsModal');
  const exportModal = document.getElementById('exportModal');
  
  // 开启弹窗的按钮
  const btnNewTask = document.getElementById('btnNewTask');
  const btnSettings = document.getElementById('btnSettings');
  
  // 关闭弹窗的按钮
  document.getElementById('closeTaskModal').onclick = () => closeModal(taskModal);
  document.getElementById('btnCancelTask').onclick = () => closeModal(taskModal);
  document.getElementById('closeSettingsModal').onclick = () => closeModal(settingsModal);
  document.getElementById('btnCancelSettings').onclick = () => closeModal(settingsModal);
  document.getElementById('closeExportModal').onclick = () => closeModal(exportModal);
  
  // 证书弹窗关闭按钮
  document.getElementById('closeCertModal').onclick = () => closeModal(certModal);
  document.getElementById('btnCancelCert').onclick = () => closeModal(certModal);
  
  // 表单元素
  const taskForm = document.getElementById('taskForm');
  const settingsForm = document.getElementById('settingsForm');
  
  // 下拉菜单联动关联元素
  const taskProvider = document.getElementById('taskProvider');
  const cfAuthType = document.getElementById('cfAuthType');
  const taskMode = document.getElementById('taskMode');
  const taskIpSource = document.getElementById('taskIpSource');
  
  // 数据缓存变量
  let allTasks = [];
  let allCerts = [];
  let activeExportTaskId = null;
  let activeExportType = 'bash'; // 或者 'python'
  
  // 执行初始化加载
  applyTheme(currentTheme);
  applyLanguage(currentLang);
  
  async function initApp() {
    try {
      const res = await originalFetch('/api/auth/status');
      const data = await res.json();
      if (data.passwordSet) {
        const token = localStorage.getItem('ddns_token');
        if (!token) {
          showLoginModal();
          return;
        }
      }
      fetchTasks();
      fetchCerts();
      fetchLogs();
      fetchIpHistory();
    } catch (e) {
      console.error('初始化加载失败:', e);
      fetchTasks();
      fetchCerts();
      fetchLogs();
      fetchIpHistory();
    }
  }

  initApp();
  
  // 每 3 秒定期拉取一次任务状态和控制台日志，提供高响应度的自动刷新体验
  setInterval(() => {
    if (!loginModal.classList.contains('active')) {
      fetchTasks(true);
      fetchCerts(true);
      fetchLogs();
      fetchIpHistory();
    }
  }, 3000);
  
  // 绑定事件监听器
  btnNewTask.onclick = () => showTaskModal();
  btnNewCert.onclick = () => showCertModal();
  btnSettings.onclick = () => showSettingsModal();
  btnClearLogs.onclick = clearConsoleLogs;
  
  tabDdns.onclick = () => switchTab('ddns');
  tabCerts.onclick = () => switchTab('certs');

  // 绑定日志过滤器与下载日志事件
  document.getElementById('logFilterTask').onchange = () => fetchLogs();
  document.getElementById('logFilterType').onchange = () => fetchLogs();
  document.getElementById('btnDownloadLogs').onclick = async () => {
    try {
      const taskId = document.getElementById('logFilterTask').value;
      const type = document.getElementById('logFilterType').value;
      
      let query = '?limit=500';
      if (taskId) query += `&taskId=${encodeURIComponent(taskId)}`;
      if (type) query += `&type=${encodeURIComponent(type)}`;

      const res = await fetch(`/api/logs${query}`);
      const logs = await res.json();
      
      const text = logs.map(l => `[${l.timestamp}] [${l.taskName || 'System'}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
      
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ag_ddns_logs_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t('logsDownloadSuccess', 'Logs downloaded successfully!'), 'success');
    } catch (e) {
      showToast(`Download failed: ${e.message}`, 'error');
    }
  };
  
  // 更改服务商/运行模式时，联动隐藏/显示对应表单
  taskProvider.onchange = () => toggleProviderCredentialsFields();
  cfAuthType.onchange = () => toggleCfAuthTypeFields();
  taskMode.onchange = () => toggleModeFields();
  taskIpSource.onchange = () => toggleIpSourceFields();
  
  certProvider.onchange = () => toggleCertProviderCredentialsFields();
  certCfAuthType.onchange = () => toggleCertCfAuthTypeFields();
  
  // 切换语言和主题
  langSelect.onchange = () => applyLanguage(langSelect.value);
  themeSelect.onchange = () => {
    applyTheme(themeSelect.value);
    localStorage.setItem('ddns_theme', themeSelect.value);
  };
  
  // 监听系统主题颜色切换
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeSelect.value === 'system') {
      applyTheme('system');
    }
  });

  // 复制客户端密钥
  document.getElementById('btnCopyKey').onclick = () => {
    const keyVal = document.getElementById('clientKeyVal').innerText;
    const placeholder = t('lblGenerateOnSave', 'Generate on save');
    if (keyVal && keyVal !== 'Generate on save' && keyVal !== '保存后自动生成' && keyVal !== placeholder) {
      navigator.clipboard.writeText(keyVal).then(() => {
        showToast(t('copySuccess', 'Copied to clipboard!'), 'success');
      });
    }
  };

  // 重置 DDNS 任务密钥
  document.getElementById('btnResetTaskKey').onclick = async () => {
    const taskId = document.getElementById('taskId').value;
    if (!taskId) return;
    const confirmed = await showConfirm(currentLang === 'zh' ? '您确定要重置此任务的客户端安全密钥吗？重置后原密钥将失效。' : 'Are you sure you want to reset the client key for this task? The old key will become invalid.');
    if (confirmed) {
      try {
        const res = await fetch(`/api/tasks/${taskId}/reset-key`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('clientKeyVal').innerText = data.clientKey;
          showToast(t('keyResetSuccess', 'Client key reset successfully!'), 'success');
          fetchTasks(); // 刷新列表
        } else {
          showToast(data.error || 'Reset failed', 'error');
        }
      } catch (e) {
        showToast(t('errNetWork', 'Network error'), 'error');
      }
    }
  };

  // 复制证书拉取密钥
  document.getElementById('btnCopyCertKey').onclick = () => {
    const keyVal = document.getElementById('certClientKeyVal').innerText;
    const placeholder = t('lblGenerateOnSave', 'Generate on save');
    if (keyVal && keyVal !== 'Generate on save' && keyVal !== '保存后自动生成' && keyVal !== placeholder) {
      navigator.clipboard.writeText(keyVal).then(() => {
        showToast(t('copySuccess', 'Copied to clipboard!'), 'success');
      });
    }
  };

  // 重置证书拉取密钥
  document.getElementById('btnResetCertKey').onclick = async () => {
    const certId = document.getElementById('certId').value;
    if (!certId) return;
    const confirmed = await showConfirm(currentLang === 'zh' ? '您确定要重置此证书的客户端安全密钥吗？重置后原密钥将失效。' : 'Are you sure you want to reset the client key for this certificate? The old key will become invalid.');
    if (confirmed) {
      try {
        const res = await fetch(`/api/certs/${certId}/reset-key`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('certClientKeyVal').innerText = data.clientKey;
          showToast(t('keyResetSuccess', 'Client key reset successfully!'), 'success');
          fetchCerts(); // 刷新列表
        } else {
          showToast(data.error || 'Reset failed', 'error');
        }
      } catch (e) {
        showToast(t('errNetWork', 'Network error'), 'error');
      }
    }
  };

  // 帮助按钮切换显示说明
  const btnHelpClientKey = document.getElementById('btnHelpClientKey');
  const helpClientKeyBox = document.getElementById('helpClientKeyBox');
  btnHelpClientKey.onclick = () => {
    const isHidden = helpClientKeyBox.style.display === 'none';
    helpClientKeyBox.style.display = isHidden ? 'block' : 'none';
    btnHelpClientKey.innerText = isHidden ? '×' : '?';
  };

  const btnHelpCertKey = document.getElementById('btnHelpCertKey');
  const helpCertKeyBox = document.getElementById('helpCertKeyBox');
  btnHelpCertKey.onclick = () => {
    const isHidden = helpCertKeyBox.style.display === 'none';
    helpCertKeyBox.style.display = isHidden ? 'block' : 'none';
    btnHelpCertKey.innerText = isHidden ? '×' : '?';
  };
  
  // 提交表单
  taskForm.onsubmit = handleTaskSubmit;
  certForm.onsubmit = handleCertSubmit;
  settingsForm.onsubmit = handleSettingsSubmit;
  
  // 导出脚本面板的标签页切换
  const tabBash = document.getElementById('tabBash');
  const tabPython = document.getElementById('tabPython');
  
  tabBash.onclick = () => toggleExportTab('bash');
  tabPython.onclick = () => toggleExportTab('python');
  
  document.getElementById('btnCopyScript').onclick = copyExportedScript;
  document.getElementById('btnDownloadScript').onclick = downloadExportedScript;
  
  // 工具方法
  function showModal(modal) {
    modal.classList.add('active');
  }
  
  function closeModal(modal) {
    modal.classList.remove('active');
  }

  function showConfirm(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const msgEl = document.getElementById('confirmModalMsg');
      const btnCancel = document.getElementById('btnConfirmCancel');
      const btnOK = document.getElementById('btnConfirmOK');
      const closeBtn = document.getElementById('closeConfirmModal');
      
      msgEl.innerText = message;
      
      // Apply translation to static text in confirm modal
      const titleEl = document.getElementById('confirmModalTitle');
      titleEl.innerText = t('confirmTitle', 'System Confirmation');
      btnCancel.innerText = t('btnCancel', 'Cancel');
      btnOK.innerText = t('btnConfirm', 'Confirm');
      
      showModal(modal);
      
      const cleanUp = () => {
        closeModal(modal);
        btnCancel.onclick = null;
        btnOK.onclick = null;
        closeBtn.onclick = null;
      };
      
      btnCancel.onclick = () => {
        cleanUp();
        resolve(false);
      };
      
      closeBtn.onclick = () => {
        cleanUp();
        resolve(false);
      };
      
      btnOK.onclick = () => {
        cleanUp();
        resolve(true);
      };
    });
  }

  function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Choose icon based on type
    let icon = '▲';
    if (type === 'success') icon = '✔';
    else if (type === 'error') icon = '✖';
    else if (type === 'warning') icon = '⚠';

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close">&times;</button>
    `;

    // Handle manual close
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.onclick = () => {
      dismissToast(toast);
    };

    // Auto dismiss
    const dismissTimeout = setTimeout(() => {
      dismissToast(toast);
    }, duration);

    function dismissToast(el) {
      clearTimeout(dismissTimeout);
      el.classList.add('toast-fade-out');
      el.addEventListener('transitionend', () => {
        el.remove();
      });
      // Fallback in case transitionend does not fire
      setTimeout(() => {
        if (el.parentNode) el.remove();
      }, 500);
    }

    toastContainer.appendChild(toast);
  }
  
  // 获取翻译词条的助手方法
  function t(key, defaultVal = '') {
    return (translations[currentLang] && translations[currentLang][key]) || defaultVal;
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('ddns_lang', lang);
    langSelect.value = lang;

    // 遍历并翻译页面上所有带 data-i18n 的静态标签
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key);
      if (translation) {
        if (el.children.length === 0) {
          el.innerText = translation;
        } else {
          el.innerText = translation;
        }
      }
    });

    // 翻译输入框的占位文本 placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const placeholderText = t(key);
      if (placeholderText) {
        el.placeholder = placeholderText;
      }
    });

    // 重新渲染列表以更新语言文本
    renderTasks();
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    themeSelect.value = theme;
    
    if (theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(isSystemDark ? 'theme-dark' : 'theme-light');
    } else {
      document.body.classList.add(`theme-${theme}`);
    }
  }
  
  /**
   * 拉取任务数据并渲染
   */
  async function fetchTasks(silent = false) {
    let data;
    try {
      const res = await fetch('/api/tasks');
      data = await res.json();
    } catch (e) {
      if (!silent) console.error(t('errNetWork', 'Network error'), e);
      return;
    }
    allTasks = data;
    renderTasks();
    updateMetrics();
    updateLogTaskFilter();
  }

  /**
   * 拉取证书数据并渲染
   */
  async function fetchCerts(silent = false) {
    let data;
    try {
      const res = await fetch('/api/certs');
      data = await res.json();
    } catch (e) {
      if (!silent) console.error(t('errNetWork', 'Network error'), e);
      return;
    }
    allCerts = data;
    renderCerts();
  }

  let activeTab = 'ddns'; // 'ddns' or 'certs'

  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'ddns') {
      document.getElementById('tabDdns').classList.add('active');
      document.getElementById('tabCerts').classList.remove('active');
      document.getElementById('ddnsContainer').style.display = 'block';
      document.getElementById('certsContainer').style.display = 'none';
    } else {
      document.getElementById('tabDdns').classList.remove('active');
      document.getElementById('tabCerts').classList.add('active');
      document.getElementById('ddnsContainer').style.display = 'none';
      document.getElementById('certsContainer').style.display = 'block';
      fetchCerts();
    }
  }

  async function triggerRenewCert(id, buttonEl) {
    buttonEl.disabled = true;
    buttonEl.innerText = '⏳';
    
    try {
      const res = await fetch(`/api/certs/${id}/renew`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(t('certRenewTriggered', 'Certificate renewal triggered. Monitor the console for updates.'), 'success');
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (e) {
      showToast(`${t('errNetWork', 'Network error')}: ${e.message}`, 'error');
    } finally {
      buttonEl.disabled = false;
      buttonEl.innerText = '▶';
      fetchCerts();
      fetchLogs();
    }
  }

  async function confirmDeleteCert(id) {
    const cert = allCerts.find(c => c.id === id);
    if (!cert) return;
    const confirmMessage = t('confirmDeleteCert', 'Are you sure you want to delete certificate for "{domain}"?').replace('{domain}', cert.domain);
    const confirmed = await showConfirm(confirmMessage);
    if (confirmed) {
      try {
        const res = await fetch(`/api/certs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchCerts();
          fetchLogs();
        } else {
          showToast('Failed to delete certificate.', 'error');
        }
      } catch (e) {
        showToast(`Error: ${e.message}`, 'error');
      }
    }
  }

  function showCertModal(id = null) {
    certForm.reset();
    document.getElementById('helpCertKeyBox').style.display = 'none';
    document.getElementById('btnHelpCertKey').innerText = '?';
    
    if (id) {
      const cert = allCerts.find(c => c.id === id);
      if (!cert) return;
      
      document.getElementById('certModalTitle').innerText = t('certModalTitleEdit', 'Edit SSL Certificate');
      document.getElementById('certId').value = cert.id;
      document.getElementById('certDomain').value = cert.domain;
      document.getElementById('certProvider').value = cert.provider;
      document.getElementById('certEmail').value = cert.email;
      document.getElementById('certDnsDelay').value = cert.dnsDelay;
      document.getElementById('certUseStaging').checked = cert.useStaging;
      document.getElementById('certEnabled').checked = cert.enabled;
      
      if (cert.provider === 'cloudflare') {
        const hasToken = !!cert.credentials.token;
        certCfAuthType.value = hasToken ? 'token' : 'key';
        document.getElementById('certCfToken').value = cert.credentials.token || '';
        document.getElementById('certCfEmail').value = cert.credentials.email || '';
        document.getElementById('certCfKey').value = cert.credentials.key || '';
        document.getElementById('certCfZoneId').value = cert.credentials.zoneId || '';
      } else {
        document.getElementById('certGenericId').value = cert.credentials.id || '';
        document.getElementById('certGenericSecret').value = cert.credentials.secret || cert.credentials.token || '';
      }

      // 显示证书 Key 并显示重置按钮
      document.getElementById('certClientKeyVal').innerText = cert.clientKey || 'N/A';
      document.getElementById('btnResetCertKey').style.display = 'inline-block';
    } else {
      document.getElementById('certModalTitle').innerText = t('certModalTitleAdd', 'Add SSL Certificate');
      document.getElementById('certId').value = '';
      document.getElementById('certProvider').value = 'cloudflare';
      document.getElementById('certCfAuthType').value = 'token';
      document.getElementById('certDnsDelay').value = 15;
      document.getElementById('certUseStaging').checked = true;
      document.getElementById('certEnabled').checked = true;

      // 设置占位提示并隐藏重置按钮
      document.getElementById('certClientKeyVal').innerText = t('lblGenerateOnSave', 'Generate on save');
      document.getElementById('btnResetCertKey').style.display = 'none';
    }
    
    toggleCertProviderCredentialsFields();
    toggleCertCfAuthTypeFields();
    showModal(certModal);
  }

  async function handleCertSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('certId').value;
    const provider = certProvider.value;
    const credentials = {};
    
    if (provider === 'cloudflare') {
      const isToken = certCfAuthType.value === 'token';
      if (isToken) {
        credentials.token = document.getElementById('certCfToken').value;
      } else {
        credentials.email = document.getElementById('certCfEmail').value;
        credentials.key = document.getElementById('certCfKey').value;
      }
      credentials.zoneId = document.getElementById('certCfZoneId').value;
    } else {
      credentials.id = document.getElementById('certGenericId').value.trim();
      credentials.secret = document.getElementById('certGenericSecret').value.trim();
      credentials.token = document.getElementById('certGenericSecret').value.trim();
    }
    
    const payload = {
      domain: document.getElementById('certDomain').value.trim(),
      provider,
      credentials,
      email: document.getElementById('certEmail').value.trim(),
      dnsDelay: parseInt(document.getElementById('certDnsDelay').value) || 15,
      useStaging: document.getElementById('certUseStaging').checked,
      enabled: document.getElementById('certEnabled').checked
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/certs/${id}` : '/api/certs';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        closeModal(certModal);
        fetchCerts();
        fetchLogs();
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error || 'Failed to save certificate'}`, 'error');
      }
    } catch (err) {
      showToast(`${t('errNetWork', 'Network error')}: ${err.message}`, 'error');
    }
  }

  function toggleCertProviderCredentialsFields() {
    const provider = certProvider.value;
    const isCf = provider === 'cloudflare';
    
    document.getElementById('certCredCf').style.display = isCf ? 'block' : 'none';
    
    const credGeneric = document.getElementById('certCredGeneric');
    if (isCf) {
      credGeneric.style.display = 'none';
      return;
    }
    
    credGeneric.style.display = 'block';
    const idGroup = document.getElementById('certGenericIdGroup');
    const secretGroup = document.getElementById('certGenericSecretGroup');
    const lblId = document.getElementById('lblCertGenericId');
    const lblSecret = document.getElementById('lblCertGenericSecret');
    const inputId = document.getElementById('certGenericId');
    const inputSecret = document.getElementById('certGenericSecret');
    
    idGroup.style.display = 'block';
    secretGroup.style.display = 'block';
    
    const isZh = currentLang === 'zh';
    
    if (provider === 'dnspod') {
      lblId.innerText = isZh ? 'Token ID' : 'Token ID';
      inputId.placeholder = isZh ? '请输入 Token ID' : 'Enter Token ID';
      lblSecret.innerText = isZh ? 'Token Value (密钥)' : 'Token Value';
      inputSecret.placeholder = isZh ? '请输入 Token Value' : 'Enter Token Value';
    } else {
      // aliyun
      lblId.innerText = isZh ? 'AccessKey ID' : 'AccessKey ID';
      inputId.placeholder = isZh ? '请输入 AccessKey ID' : 'Enter AccessKey ID';
      lblSecret.innerText = isZh ? 'AccessKey Secret' : 'AccessKey Secret';
      inputSecret.placeholder = isZh ? '请输入 AccessKey Secret' : 'Enter AccessKey Secret';
    }
  }

  function toggleCertCfAuthTypeFields() {
    const authType = certCfAuthType.value;
    document.getElementById('certCfTokenGroup').style.display = authType === 'token' ? 'block' : 'none';
    document.getElementById('certCfEmailGroup').style.display = authType === 'key' ? 'block' : 'none';
    document.getElementById('certCfKeyGroup').style.display = authType === 'key' ? 'block' : 'none';
  }

  async function downloadCert(id) {
    try {
      const res = await fetch(`/api/certs/${id}/download`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to download certificate');
      }
      
      // Download .crt
      const crtBlob = new Blob([data.cert], { type: 'application/x-pem-file' });
      const crtUrl = URL.createObjectURL(crtBlob);
      const crtLink = document.createElement('a');
      crtLink.href = crtUrl;
      crtLink.download = `${data.domain.replace(/\*/g, 'star')}.crt`;
      document.body.appendChild(crtLink);
      crtLink.click();
      document.body.removeChild(crtLink);
      URL.revokeObjectURL(crtUrl);
      
      // Download .key
      const keyBlob = new Blob([data.key], { type: 'application/x-pem-file' });
      const keyUrl = URL.createObjectURL(keyBlob);
      const keyLink = document.createElement('a');
      keyLink.href = keyUrl;
      keyLink.download = `${data.domain.replace(/\*/g, 'star')}.key`;
      document.body.appendChild(keyLink);
      keyLink.click();
      document.body.removeChild(keyLink);
      URL.revokeObjectURL(keyUrl);
      
    } catch (e) {
      showToast(`Download failed: ${e.message}`, 'error');
    }
  }
  
  /**
   * 拉取服务器日志数据并渲染
   */
  /**
   * 拉取服务器日志数据并渲染
   */
  async function fetchLogs() {
    try {
      const logFilterTask = document.getElementById('logFilterTask');
      const logFilterType = document.getElementById('logFilterType');
      const taskId = logFilterTask ? logFilterTask.value : '';
      const type = logFilterType ? logFilterType.value : '';
      
      let query = '?limit=100';
      if (taskId) query += `&taskId=${encodeURIComponent(taskId)}`;
      if (type) query += `&type=${encodeURIComponent(type)}`;

      const res = await fetch(`/api/logs${query}`);
      const logs = await res.json();
      renderLogs(logs);
    } catch (e) {
      console.error('加载日志失败', e);
    }
  }

  /**
   * 获取并渲染最近的 IP 变更记录
   */
  async function fetchIpHistory() {
    const panel = document.getElementById('ipHistoryPanel');
    const content = document.getElementById('ipHistoryContent');
    if (!panel || !content) return;

    try {
      const res = await fetch('/api/ip-history');
      const data = await res.json();
      if (data.length === 0) {
        panel.style.display = 'none';
        return;
      }
      
      panel.style.display = 'block';
      content.innerHTML = '';
      
      data.forEach(item => {
        const line = document.createElement('div');
        line.style.marginBottom = '0.5rem';
        line.style.borderBottom = '1px dashed rgba(0, 243, 255, 0.1)';
        line.style.paddingBottom = '0.3rem';
        line.style.display = 'flex';
        line.style.justifyContent = 'space-between';
        line.style.alignItems = 'center';
        line.style.flexWrap = 'wrap';
        line.style.gap = '0.5rem';
        
        const info = document.createElement('span');
        info.innerHTML = `<span style="color: var(--console-time); margin-right: 0.5rem;">[${formatDate(item.timestamp)}]</span>` +
                         `<span style="color: var(--neon-pink); font-weight: bold; margin-right: 0.5rem;">[${escapeHtml(item.taskName)}]</span>` +
                         `<span style="color: var(--text-color);">${escapeHtml(item.message)}</span>`;
                         
        const badge = document.createElement('span');
        badge.style.backgroundColor = 'rgba(0, 243, 255, 0.15)';
        badge.style.border = '1px solid var(--neon-cyan)';
        badge.style.color = 'var(--neon-cyan)';
        badge.style.padding = '0.1rem 0.4rem';
        badge.style.fontSize = '0.75rem';
        badge.style.fontFamily = 'var(--font-mono)';
        badge.style.textShadow = '0 0 5px var(--neon-cyan)';
        badge.style.borderRadius = '0';
        badge.innerText = item.ip;
        
        line.appendChild(info);
        line.appendChild(badge);
        content.appendChild(line);
      });
    } catch (e) {
      console.error('加载 IP 历史记录失败', e);
    }
  }

  /**
   * 刷新日志面板的任务过滤器下拉列表
   */
  function updateLogTaskFilter() {
    const taskSelect = document.getElementById('logFilterTask');
    if (!taskSelect) return;
    const currentValue = taskSelect.value;
    
    taskSelect.innerHTML = `<option value="" data-i18n="optAllTasks">${t('optAllTasks', 'All Tasks')}</option>`;
    
    allTasks.forEach(task => {
      const opt = document.createElement('option');
      opt.value = task.id;
      opt.innerText = task.name;
      taskSelect.appendChild(opt);
    });
    
    if (allTasks.some(t => t.id === currentValue)) {
      taskSelect.value = currentValue;
    }
  }
  
  /**
   * 将任务数据渲染到表格卡片中
   */
  function renderTasks() {
    const cards = tasksGrid.querySelectorAll('.task-card');
    cards.forEach(c => c.remove());
    
    if (allTasks.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }
    
    emptyState.style.display = 'none';
    
    allTasks.forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card ${task.enabled ? task.lastStatus : 'disabled'}`;
      
      const lastCheckTime = task.lastChecked ? formatDate(task.lastChecked) : t('statusNever', 'Never');
      
      let statusLabel = t('statusReady', 'Ready');
      if (!task.enabled) {
        statusLabel = t('statusDisabled', 'Disabled');
      } else if (task.lastStatus === 'success') {
        statusLabel = t('statusHealthy', 'Healthy');
      } else if (task.lastStatus === 'error') {
        statusLabel = t('statusFailed', 'Failed');
      }
      
      const domainListHtml = task.domain.split(',')
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => `<span class="domain-item">${escapeHtml(d)}</span>`)
        .join('');

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <h3>${escapeHtml(task.name)}</h3>
            <div class="domain-list">${domainListHtml}</div>
          </div>
          <div style="display:flex; gap: 0.35rem; flex-shrink: 0;">
            <span class="badge badge-mode">${task.mode === 'local' ? t('modeLocal', 'Local') : t('modeAgent', 'Agent')}</span>
            <span class="badge badge-status">${statusLabel}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">${t('rowDnsProvider', 'DNS Provider')}</span>
            <span class="info-value text-capitalize">${task.provider}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('rowRecordType', 'Record Type')}</span>
            <span class="info-value mono">${task.recordType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('rowDnsIp', 'DNS IP Address')}</span>
            <span class="info-value mono">${task.lastIp || t('valNa', 'N/A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('rowCheckInterval', 'Check Interval')}</span>
            <span class="info-value">${task.checkInterval} ${t('unitMins', 'mins')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('rowLastChecked', 'Last Checked')}</span>
            <span class="info-value">${lastCheckTime}</span>
          </div>
          <div class="info-row" style="border:none;">
            <span class="info-label">${t('rowMessage', 'Message')}</span>
            <span class="info-value" style="font-size: 0.75rem; text-align:right; max-width: 70%; word-break:break-all;">${escapeHtml(task.lastMessage || '')}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="footer-actions">
            ${task.enabled && task.mode === 'local' ? `
              <button class="btn-icon run-now" data-id="${task.id}" title="${t('tipRunNow', 'Run Check Now')}">▶</button>
            ` : ''}
            <button class="btn-icon" data-id="${task.id}" data-action="export" title="${t('tipExport', 'Export Script')}">⇣</button>
          </div>
          <div class="footer-actions">
            <button class="btn-icon" data-id="${task.id}" data-action="duplicate" title="${t('tipDuplicate', 'Duplicate Task')}">📋</button>
            <button class="btn-icon" data-id="${task.id}" data-action="edit" title="${t('tipEdit', 'Edit')}">✎</button>
            <button class="btn-icon delete" data-id="${task.id}" data-action="delete" title="${t('tipDelete', 'Delete')}">🗑</button>
          </div>
        </div>
      `;
      
      tasksGrid.appendChild(card);
    });
    
    // 绑定列表每一项卡片的操作按钮事件
    tasksGrid.querySelectorAll('.run-now').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.getAttribute('data-id');
        triggerRunTask(id, e.target);
      };
    });
    
    tasksGrid.querySelectorAll('[data-action="export"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        showExportModal(id);
      };
    });
    
    tasksGrid.querySelectorAll('[data-action="duplicate"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        duplicateTask(id);
      };
    });
    
    tasksGrid.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        showTaskModal(id);
      };
    });
    
    tasksGrid.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        confirmDeleteTask(id);
      };
    });
  }

  function renderCerts() {
    updateCertsSummary();

    const cards = certsGrid.querySelectorAll('.task-card');
    cards.forEach(c => c.remove());
    
    if (allCerts.length === 0) {
      emptyCertState.style.display = 'flex';
      return;
    }
    
    emptyCertState.style.display = 'none';
    
    allCerts.forEach(cert => {
      const card = document.createElement('div');
      card.className = `task-card ${cert.enabled ? cert.status : 'disabled'}`;
      
      const lastUpdateTime = cert.lastUpdated ? formatDate(cert.lastUpdated) : t('statusNever', 'Never');
      const expiryTime = cert.expiryDate ? formatDate(cert.expiryDate) : t('valNa', 'N/A');
      
      let statusLabel = t('statusReady', 'Ready');
      if (!cert.enabled) {
        statusLabel = t('statusDisabled', 'Disabled');
      } else if (cert.status === 'success') {
        statusLabel = t('statusHealthy', 'Healthy');
      } else if (cert.status === 'error') {
        statusLabel = t('statusFailed', 'Failed');
      } else if (cert.status === 'info') {
        statusLabel = t('statusReady', 'Ready');
      }
      
      const domainListHtml = cert.domain.split(',')
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => `<span class="domain-item">${escapeHtml(d)}</span>`)
        .join('');

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            <h3>${escapeHtml(cert.domain.split(',')[0])}</h3>
            <div class="domain-list">${domainListHtml}</div>
          </div>
          <div style="display:flex; gap: 0.35rem; flex-shrink: 0;">
            <span class="badge badge-status">${statusLabel}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">${t('rowDnsProvider', 'DNS Provider')}</span>
            <span class="info-value text-capitalize">${cert.provider}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('lblCertEmail', 'Email')}</span>
            <span class="info-value mono" style="font-size:0.75rem;">${escapeHtml(cert.email)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('rowExpiryDate', 'Expiry Date')}</span>
            <span class="info-value mono text-warning" style="font-size:0.75rem;">${expiryTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t('rowLastChecked', 'Last Updated')}</span>
            <span class="info-value">${lastUpdateTime}</span>
          </div>
          <div class="info-row" style="border:none;">
            <span class="info-label">${t('rowMessage', 'Message')}</span>
            <span class="info-value" style="font-size: 0.75rem; text-align:right; max-width: 70%; word-break:break-all;">${escapeHtml(cert.lastMessage || '')}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="footer-actions">
            ${cert.enabled ? `
              <button class="btn-icon run-now" data-id="${cert.id}" title="${t('tipRenew', 'Renew Now')}">▶</button>
            ` : ''}
            ${cert.certContent && cert.keyContent ? `
              <button class="btn-icon" data-id="${cert.id}" data-action="download" title="${t('tipDownload', 'Download')}">⇣</button>
            ` : ''}
          </div>
          <div class="footer-actions">
            <button class="btn-icon" data-id="${cert.id}" data-action="edit-cert" title="${t('tipEdit', 'Edit')}">✎</button>
            <button class="btn-icon delete" data-id="${cert.id}" data-action="delete-cert" title="${t('tipDelete', 'Delete')}">🗑</button>
          </div>
        </div>
      `;
      
      certsGrid.appendChild(card);
    });
    
    // Bind click handlers for cert card actions
    certsGrid.querySelectorAll('.run-now').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.getAttribute('data-id');
        triggerRenewCert(id, e.target);
      };
    });
    
    certsGrid.querySelectorAll('[data-action="download"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        downloadCert(id);
      };
    });
    
    certsGrid.querySelectorAll('[data-action="edit-cert"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        showCertModal(id);
      };
    });
    
    certsGrid.querySelectorAll('[data-action="delete-cert"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        confirmDeleteCert(id);
      };
    });
  }

  function updateCertsSummary() {
    if (allCerts.length === 0) {
      document.getElementById('certsSummaryPanel').style.display = 'none';
      return;
    }
    
    document.getElementById('certsSummaryPanel').style.display = 'flex';
    
    let activeCount = 0;
    let warningCount = 0;
    let expiredCount = 0;
    
    const timelineGrid = document.getElementById('expiryTimelineGrid');
    timelineGrid.innerHTML = '';
    
    allCerts.forEach(cert => {
      if (cert.status !== 'success' || !cert.expiryDate) {
        return;
      }
      
      const expiryMs = new Date(cert.expiryDate).getTime();
      const now = Date.now();
      const remainDays = (expiryMs - now) / (24 * 60 * 60 * 1000);
      
      if (remainDays <= 0) {
        expiredCount++;
      } else if (remainDays < 30) {
        warningCount++;
        activeCount++;
      } else {
        activeCount++;
      }
      
      // Calculate progress percentage (assume 90-day validity for ACME certificates)
      const maxLifespan = 90;
      const percentage = Math.max(0, Math.min(100, (remainDays / maxLifespan) * 100));
      
      let barColor = 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))';
      let statusText = currentLang === 'zh' ? `${Math.ceil(remainDays)} 天剩余` : `${Math.ceil(remainDays)} days remaining`;
      
      if (remainDays <= 0) {
        barColor = 'var(--error-color)';
        statusText = currentLang === 'zh' ? '已过期' : 'Expired';
      } else if (remainDays < 10) {
        barColor = 'linear-gradient(90deg, var(--neon-pink), var(--error-color))';
      } else if (remainDays < 30) {
        barColor = 'linear-gradient(90deg, var(--neon-yellow), #ff9900)';
      }
      
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.innerHTML = `
        <div class="timeline-meta">
          <span class="timeline-domain">${escapeHtml(cert.domain)}</span>
          <span class="timeline-days">${statusText}</span>
        </div>
        <div class="timeline-progress-bar">
          <div class="timeline-progress-fill" style="width: ${percentage}%; background: ${barColor};"></div>
        </div>
      `;
      timelineGrid.appendChild(item);
    });
    
    document.getElementById('statActiveCerts').innerText = activeCount;
    document.getElementById('statWarningCerts').innerText = warningCount;
    document.getElementById('statExpiredCerts').innerText = expiredCount;
    
    // If no timeline items were rendered, display a message
    if (timelineGrid.children.length === 0) {
      timelineGrid.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted)">${currentLang === 'zh' ? '暂无成功申请的证书数据时效线。' : 'No active certificate expiration timeline available.'}</div>`;
    }
  }
  
  /**
   * 更新顶部指标卡片数值
   */
  function updateMetrics() {
    metricTotal.innerText = allTasks.length;
    
    const healthy = allTasks.filter(t => t.enabled && t.lastStatus === 'success').length;
    metricHealthy.innerText = healthy;
    
    const failed = allTasks.filter(t => t.enabled && t.lastStatus === 'error').length;
    metricFailed.innerText = failed;
  }
  
  /**
   * 渲染日志信息到控制台盒子中
   */
  function renderLogs(logs) {
    if (logs.length === 0) {
      logsConsole.innerHTML = `<div style="color:var(--text-muted)">Console initialized. Waiting for activity...</div>`;
      return;
    }
    
    logsConsole.innerHTML = logs.map(log => {
      const timeStr = formatDateShort(log.timestamp);
      return `<div class="console-line ${log.type}">
         <span class="time">[${timeStr}]</span>
         <span class="task">[${escapeHtml(log.taskName)}]</span>
         <span class="message">${escapeHtml(log.message)}</span>
      </div>`;
    }).join('');
  }
  
  // 清空控制台显示（仅前端清空，不影响数据库）
  function clearConsoleLogs() {
    logsConsole.innerHTML = `<div style="color:var(--text-muted)">Console cleared.</div>`;
  }
  
  /**
   * 手动触发检测并更新 DNS 记录
   */
  async function triggerRunTask(id, buttonEl) {
    buttonEl.disabled = true;
    buttonEl.innerText = '⏳';
    
    try {
      const res = await fetch(`/api/tasks/${id}/run`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // 更新成功
      } else {
        showToast(`${t('errRunTask', 'Error running task')}: ${data.error}`, 'error');
      }
    } catch (e) {
      showToast(`${t('errNetWork', 'Network error')}: ${e.message}`, 'error');
    } finally {
      buttonEl.disabled = false;
      buttonEl.innerText = '▶';
      fetchTasks();
      fetchLogs();
    }
  }
  
  /**
   * 删除解析任务
   */
  async function confirmDeleteTask(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    const confirmMessage = t('confirmDelete', 'Are you sure you want to delete task "{name}"?').replace('{name}', task.name);
    const confirmed = await showConfirm(confirmMessage);
    if (confirmed) {
      try {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchTasks();
          fetchLogs();
        } else {
          showToast('Failed to delete task.', 'error');
        }
      } catch (e) {
        showToast(`Error: ${e.message}`, 'error');
      }
    }
  }
 
  /**
   * 快捷复制复制该解析任务配置
   */
  async function duplicateTask(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
 
    const suffix = currentLang === 'zh' ? '_复制' : '_copy';
    const payload = {
      ...task,
      id: undefined,
      name: `${task.name}${suffix}`,
      lastIp: '',
      lastChecked: '',
      lastStatus: 'info',
      lastMessage: 'Task duplicated',
      clientKey: undefined // 服务端将自动生成新的 clientKey
    };
 
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
 
      if (res.ok) {
        fetchTasks();
        fetchLogs();
      } else {
        const data = await res.json();
        showToast(`Failed to duplicate task: ${data.error}`, 'error');
      }
    } catch (e) {
      showToast(`${t('errNetWork', 'Network error')}: ${e.message}`, 'error');
    }
  }
  
  /**
   * 任务配置表单隐藏/显示联动逻辑
   */
  function toggleProviderCredentialsFields() {
    const provider = taskProvider.value;
    const isCf = provider === 'cloudflare';
    
    document.getElementById('credCloudflare').style.display = isCf ? 'block' : 'none';
    
    const credGeneric = document.getElementById('credGeneric');
    if (isCf) {
      credGeneric.style.display = 'none';
      return;
    }
    
    credGeneric.style.display = 'block';
    const idGroup = document.getElementById('genericIdGroup');
    const secretGroup = document.getElementById('genericSecretGroup');
    const lblId = document.getElementById('lblGenericId');
    const lblSecret = document.getElementById('lblGenericSecret');
    const inputId = document.getElementById('genericId');
    const inputSecret = document.getElementById('genericSecret');
    
    // 默认显示隐藏配置
    idGroup.style.display = 'block';
    secretGroup.style.display = 'block';
    
    const isZh = currentLang === 'zh';
    
    if (provider === 'he' || provider === 'namesilo') {
      idGroup.style.display = 'none';
      lblSecret.innerText = isZh ? 'API / DDNS 密钥 Key' : 'API / DDNS Key';
      inputSecret.placeholder = isZh ? '请输入解析密钥' : 'Enter API Key or DDNS Key';
    } else if (provider === 'callback') {
      idGroup.style.display = 'none';
      lblSecret.innerText = isZh ? '自定义 Webhook URL' : 'Custom Webhook URL';
      inputSecret.placeholder = isZh ? '例如: https://api.com/update?ip={ip}' : 'e.g. https://api.com/update?ip={ip}';
    } else if (provider === 'dnspod') {
      lblId.innerText = isZh ? 'Token ID' : 'Token ID';
      inputId.placeholder = isZh ? '请输入 Token ID' : 'Enter Token ID';
      lblSecret.innerText = isZh ? 'Token Value (密钥)' : 'Token Value';
      inputSecret.placeholder = isZh ? '请输入 Token Value' : 'Enter Token Value';
    } else if (provider === 'noip' || provider === 'cloudns') {
      lblId.innerText = isZh ? '用户名 Username' : 'Username';
      inputId.placeholder = isZh ? '请输入用户名' : 'Enter Username';
      lblSecret.innerText = isZh ? '密码 Password' : 'Password';
      inputSecret.placeholder = isZh ? '请输入密码' : 'Enter Password';
    } else {
      // aliyun, huaweidns, dnscom, tencentcloud, edgeone
      lblId.innerText = isZh ? 'AccessKey ID' : 'AccessKey ID';
      inputId.placeholder = isZh ? '请输入 AccessKey ID' : 'Enter AccessKey ID';
      lblSecret.innerText = isZh ? 'AccessKey Secret' : 'AccessKey Secret';
      inputSecret.placeholder = isZh ? '请输入 AccessKey Secret' : 'Enter AccessKey Secret';
    }
  }
  
  function toggleCfAuthTypeFields() {
    const authType = cfAuthType.value;
    document.getElementById('cfTokenGroup').style.display = authType === 'token' ? 'block' : 'none';
    document.getElementById('cfEmailGroup').style.display = authType === 'key' ? 'block' : 'none';
    document.getElementById('cfKeyGroup').style.display = authType === 'key' ? 'block' : 'none';
  }
  
  function toggleModeFields() {
    const mode = taskMode.value;
    document.getElementById('localIpSourceGroup').style.display = mode === 'local' ? 'block' : 'none';
    document.getElementById('remoteClientInfoGroup').style.display = mode === 'remote-client' ? 'block' : 'none';
  }
  
  function toggleIpSourceFields() {
    const source = taskIpSource.value;
    document.getElementById('ipInterfaceGroup').style.display = source === 'interface' ? 'block' : 'none';
    document.getElementById('ipUrlGroup').style.display = source === 'url' ? 'block' : 'none';
  }
  
  /**
   * 打开新建/编辑任务的弹窗并赋初值
   */
  function showTaskModal(id = null) {
    taskForm.reset();
    document.getElementById('helpClientKeyBox').style.display = 'none';
    document.getElementById('btnHelpClientKey').innerText = '?';
    
    if (id) {
      // 编辑任务模式
      const task = allTasks.find(t => t.id === id);
      if (!task) return;
      
      document.getElementById('modalTitle').setAttribute('data-i18n', 'modalTitleEdit');
      document.getElementById('modalTitle').innerText = t('modalTitleEdit', 'Edit DDNS Task');
      document.getElementById('taskId').value = task.id;
      document.getElementById('taskName').value = task.name;
      document.getElementById('taskMode').value = task.mode;
      document.getElementById('taskProvider').value = task.provider;
      document.getElementById('taskDomain').value = task.domain;
      document.getElementById('taskRecordType').value = task.recordType;
      document.getElementById('taskTtl').value = task.ttl;
      document.getElementById('taskInterval').value = task.checkInterval;
      document.getElementById('taskIpSource').value = task.ipSource;
      document.getElementById('taskIpInterface').value = task.ipInterface;
      document.getElementById('taskIpUrl').value = task.ipUrl;
      document.getElementById('taskEnabled').checked = task.enabled;
      
      // 根据服务商读取已有的凭证并填充表单
      if (task.provider === 'cloudflare') {
        const hasToken = !!task.credentials.token;
        cfAuthType.value = hasToken ? 'token' : 'key';
        document.getElementById('cfToken').value = task.credentials.token || '';
        document.getElementById('cfEmail').value = task.credentials.email || '';
        document.getElementById('cfKey').value = task.credentials.key || '';
        document.getElementById('cfZoneId').value = task.credentials.zoneId || '';
        document.getElementById('cfProxied').checked = !!task.proxied;
      } else {
        document.getElementById('genericId').value = task.credentials.id || '';
        document.getElementById('genericSecret').value = task.credentials.secret || task.credentials.token || '';
      }
      
      // 显示客户端 Key并显示重置按钮
      document.getElementById('clientKeyVal').innerText = task.clientKey || 'N/A';
      document.getElementById('btnResetTaskKey').style.display = 'inline-block';
    } else {
      // 新建任务模式
      document.getElementById('modalTitle').setAttribute('data-i18n', 'modalTitleAdd');
      document.getElementById('modalTitle').innerText = t('modalTitleAdd', 'Add DDNS Task');
      document.getElementById('taskId').value = '';
      document.getElementById('taskMode').value = 'local';
      document.getElementById('taskProvider').value = 'cloudflare';
      document.getElementById('cfAuthType').value = 'token';
      document.getElementById('taskRecordType').value = 'A';
      document.getElementById('taskTtl').value = 600;
      document.getElementById('taskInterval').value = 5;
      document.getElementById('taskIpSource').value = 'public';
      document.getElementById('taskEnabled').checked = true;
      document.getElementById('cfProxied').checked = false;
      document.getElementById('clientKeyVal').innerText = t('lblGenerateOnSave', 'Generate on save');
      document.getElementById('btnResetTaskKey').style.display = 'none';
    }
    
    // 手动触发一次表单显示状态
    toggleProviderCredentialsFields();
    toggleCfAuthTypeFields();
    toggleModeFields();
    toggleIpSourceFields();
    
    showModal(taskModal);
  }
  
  /**
   * 提交保存任务配置
   */
  async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('taskId').value;
    const provider = taskProvider.value;
    const credentials = {};
    
    // 从表单读取对应服务商的凭证
    if (provider === 'cloudflare') {
      const isToken = cfAuthType.value === 'token';
      if (isToken) {
        credentials.token = document.getElementById('cfToken').value;
      } else {
        credentials.email = document.getElementById('cfEmail').value;
        credentials.key = document.getElementById('cfKey').value;
      }
      credentials.zoneId = document.getElementById('cfZoneId').value;
    } else {
      credentials.id = document.getElementById('genericId').value.trim();
      credentials.secret = document.getElementById('genericSecret').value.trim();
      credentials.token = document.getElementById('genericSecret').value.trim();
    }
    
    const payload = {
      name: document.getElementById('taskName').value,
      mode: taskMode.value,
      provider,
      credentials,
      domain: document.getElementById('taskDomain').value.trim(),
      recordType: document.getElementById('taskRecordType').value,
      ttl: parseInt(document.getElementById('taskTtl').value) || 600,
      checkInterval: parseInt(document.getElementById('taskInterval').value) || 5,
      ipSource: taskIpSource.value,
      ipInterface: document.getElementById('taskIpInterface').value.trim(),
      ipUrl: document.getElementById('taskIpUrl').value.trim(),
      enabled: document.getElementById('taskEnabled').checked,
      proxied: provider === 'cloudflare' ? document.getElementById('cfProxied').checked : false
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/tasks/${id}` : '/api/tasks';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        closeModal(taskModal);
        fetchTasks();
        fetchLogs();
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error || 'Failed to save task'}`, 'error');
      }
    } catch (err) {
      showToast(`${t('errNetWork', 'Network error')}: ${err.message}`, 'error');
    }
  }
  
  /**
   * 打开系统全局设置弹窗
   */
  async function showSettingsModal() {
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      document.getElementById('settingPort').value = settings.port || 8080;
      document.getElementById('settingScriptInfo').value = settings.scriptInfo || '';
      document.getElementById('settingPassword').value = '';
      document.getElementById('settingDisablePassword').checked = false;
      
      // 加载通知渠道设置
      document.getElementById('settingNotifyTelegramToken').value = settings.notifyTelegramToken || '';
      document.getElementById('settingNotifyTelegramChatId').value = settings.notifyTelegramChatId || '';
      document.getElementById('settingNotifyDingTalk').value = settings.notifyDingTalk || '';
      document.getElementById('settingNotifyWeChat').value = settings.notifyWeChat || '';
      document.getElementById('settingNotifyFeishu').value = settings.notifyFeishu || '';
      document.getElementById('settingNotifyCustomUrl').value = settings.notifyCustomUrl || '';

      showModal(settingsModal);
    } catch (e) {
      showToast('Failed to load system settings', 'error');
    }
  }
  
  async function handleSettingsSubmit(e) {
    e.preventDefault();
    const disablePassword = document.getElementById('settingDisablePassword').checked;
    const newPass = document.getElementById('settingPassword').value;

    const payload = {
      port: parseInt(document.getElementById('settingPort').value) || 8080,
      scriptInfo: document.getElementById('settingScriptInfo').value,
      
      // 通知渠道设置
      notifyTelegramToken: document.getElementById('settingNotifyTelegramToken').value.trim(),
      notifyTelegramChatId: document.getElementById('settingNotifyTelegramChatId').value.trim(),
      notifyDingTalk: document.getElementById('settingNotifyDingTalk').value.trim(),
      notifyWeChat: document.getElementById('settingNotifyWeChat').value.trim(),
      notifyFeishu: document.getElementById('settingNotifyFeishu').value.trim(),
      notifyCustomUrl: document.getElementById('settingNotifyCustomUrl').value.trim()
    };

    if (disablePassword) {
      payload.password = '';
    } else if (newPass !== '') {
      payload.password = newPass;
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        closeModal(settingsModal);
        showToast(t('settingsSaveSuccess', 'Settings saved. Port changes will apply upon server restart.'), 'success');
        
        if (disablePassword) {
          localStorage.removeItem('ddns_token');
        } else if (newPass !== '') {
          localStorage.removeItem('ddns_token');
          setTimeout(() => {
            showLoginModal();
          }, 1000);
        }
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (err) {
      showToast(`${t('errNetWork', 'Network error')}: ${err.message}`, 'error');
    }
  }
  
  /**
   * 打开脚本导出弹窗
   */
  async function showExportModal(id) {
    activeExportTaskId = id;
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('exportDomainName').innerText = task.domain;
    activeExportType = 'bash';
    tabBash.classList.add('active');
    tabPython.classList.remove('active');
    
    showModal(exportModal);
    loadExportScript();
  }
  
  async function toggleExportTab(type) {
    activeExportType = type;
    if (type === 'bash') {
      tabBash.classList.add('active');
      tabPython.classList.remove('active');
    } else {
      tabPython.classList.add('active');
      tabBash.classList.remove('active');
    }
    loadExportScript();
  }
  
  async function loadExportScript() {
    const codeArea = document.getElementById('scriptCodeArea');
    codeArea.className = activeExportType === 'bash' ? 'language-bash' : 'language-python';
    codeArea.innerText = 'Generating standalone script...';
    
    try {
      const res = await fetch(`/api/tasks/${activeExportTaskId}/export?type=${activeExportType}`);
      if (res.ok) {
        const content = await res.text();
        codeArea.innerText = content;
      } else {
        const err = await res.json();
        codeArea.innerText = `Error: ${err.error}`;
      }
    } catch (e) {
      codeArea.innerText = `Failed to download script details: ${e.message}`;
    }
  }
  
  function copyExportedScript() {
    const code = document.getElementById('scriptCodeArea').innerText;
    navigator.clipboard.writeText(code).then(() => {
      showToast(t('copySuccess', 'Copied to clipboard!'), 'success');
    });
  }
  
  function downloadExportedScript() {
    if (!activeExportTaskId) return;
    const task = allTasks.find(t => t.id === activeExportTaskId);
    if (!task) return;
    
    const ext = activeExportType === 'bash' ? 'sh' : 'py';
    const link = document.createElement('a');
    link.href = `/api/tasks/${activeExportTaskId}/export?type=${activeExportType}`;
    link.download = `ddns_${task.domain}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 时间格式化工具方法
  function formatDate(isoString) {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  
  function formatDateShort(isoString) {
    const d = new Date(isoString);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  
  function pad(num) {
    return num.toString().padStart(2, '0');
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
