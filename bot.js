const TelegramBot = require("node-telegram-bot-api");
const config = require("./config");
const { isAllowed, denyAccess } = require("./middleware/auth");

// Commands
const { cpuCommand } = require("./commands/cpu");
const { ramCommand } = require("./commands/ram");
const { diskCommand } = require("./commands/disk");
const { uptimeCommand } = require("./commands/uptime");
const { restartService } = require("./commands/restart");
const { dockerPs, dockerRestart, dockerLogs } = require("./commands/docker");
const { deployCommand, deployAskMode, runDeploy } = require("./commands/deploy");
const { logNginx, logPm2, logAccess } = require("./commands/logs");
const { startMonitoring, stopMonitoring, isMonitoringActive } = require("./services/monitor");

// ── NEW FEATURES ──
const { serverReportCommand } = require("./commands/server_report");
const { serverMapCommand } = require("./commands/server_map");
const { checkWebCommand } = require("./commands/check_web");
const { updateServerCommand } = require("./commands/update_server");
const { cpuGraphCommand } = require("./commands/cpu_graph");
const { startCpuCollector } = require("./services/cpu_collector");
const {
  startSshMonitoring,
  stopSshMonitoring,
  isSshMonitoringActive,
  checkSshNow,
} = require("./services/ssh_monitor");
const {
  addWebsite,
  removeWebsite,
  listWebsites,
  startWebMonitoring,
  stopWebMonitoring,
  isWebMonitoringActive,
  runWebChecks,
} = require("./services/web_monitor");

// Inisialisasi bot
const bot = new TelegramBot(config.token, { polling: true });

console.log("🚀 VPS Control Bot is running...");
console.log(`📋 Allowed users: ${config.allowedUsers.length > 0 ? config.allowedUsers.join(", ") : "SEMUA (mode dev)"}`);

// Auto-start CPU collector untuk fitur /cpu_graph
startCpuCollector();
console.log("[CPU COLLECTOR] Auto-started untuk /cpu_graph");

// ─────────────────────────────────────────────────
// HELPER: Auth check wrapper
// ─────────────────────────────────────────────────
function withAuth(handler) {
  return async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAllowed(userId)) {
      console.warn(`[AUTH] User ${userId} mencoba akses bot - DITOLAK`);
      return denyAccess(bot, chatId);
    }

    try {
      await handler(msg, match, chatId);
    } catch (err) {
      console.error(`[ERROR] Command error:`, err);
      bot.sendMessage(chatId, `❌ Terjadi error tidak terduga:\n\`${err.message}\``, {
        parse_mode: "Markdown",
      });
    }
  };
}

// ─────────────────────────────────────────────────
// COMMAND: /start
// ─────────────────────────────────────────────────
bot.onText(/\/start/, withAuth(async (msg, match, chatId) => {
  const name = msg.from.first_name || "User";
  const message = `
🚀 *VPS Control Bot Active!*

Halo, *${name}*! Selamat datang di VPS Control Bot.

📋 *Daftar Command:*

📊 *Monitoring:*
/cpu - Cek penggunaan CPU
/ram - Cek penggunaan RAM
/disk - Cek storage disk
/uptime - Cek uptime server
/status - Cek semua sekaligus
/server\_report - Laporan lengkap server
/server\_map - Arsitektur server
/cpu\_graph - Grafik CPU 10 menit

🔧 *Service Control:*
/restart\_nginx - Restart Nginx
/restart\_mysql - Restart MySQL
/restart\_pm2 - Restart PM2

🛠 *Maintenance:*
/update\_server - Update packages server

🐳 *Docker:*
/docker\_ps - List containers
/docker\_restart <name> - Restart container
/docker\_logs <name> - Lihat log container

🚀 *Automation:*
/deploy - Deploy aplikasi

📋 *Logs:*
/log\_nginx - Log error Nginx
/log\_pm2 - Log PM2
/log\_access - Log access Nginx

🌐 *Website Monitor:*
/web\_add <domain> - Tambah website monitor
/web\_remove <domain> - Hapus website monitor
/web\_list - Daftar website monitor
/web\_check - Cek semua website sekarang
/web\_start - Aktifkan auto website monitor
/web\_stop - Nonaktifkan website monitor
/check\_web <domain> - Cek satu website

🛡 *Security:*
/ssh\_monitor\_start - Aktifkan SSH attack detector
/ssh\_monitor\_stop - Nonaktifkan SSH detector
/ssh\_check - Cek SSH attack sekarang

🔔 *Alert:*
/monitor\_start - Aktifkan auto alert resource
/monitor\_stop - Nonaktifkan auto alert
/monitor\_status - Status monitoring
/check\_now - Cek alert manual

ℹ️ Bot berjalan dan siap menerima perintah!
  `.trim();

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}));

// ─────────────────────────────────────────────────
// COMMAND: /list - Daftar semua command
// ─────────────────────────────────────────────────
bot.onText(/\/list/, withAuth(async (msg, match, chatId) => {
  const message = `
📋 *DAFTAR COMMAND VPS BOT*

📊 *Monitoring*
/cpu — Penggunaan CPU
/ram — Penggunaan RAM
/disk — Storage disk
/uptime — Uptime server
/status — Semua status sekaligus
/server\_report — Laporan lengkap server
/server\_map — Arsitektur server
/cpu\_graph — Grafik CPU 10 menit

🔧 *Service Control*
/restart\_nginx — Restart Nginx
/restart\_mysql — Restart MySQL
/restart\_pm2 — Restart PM2

🛠 *Maintenance*
/update\_server — Update packages server

🐳 *Docker*
/docker\_ps — List containers
/docker\_restart \<name\> — Restart container
/docker\_logs \<name\> — Log container

🚀 *Automation*
/deploy — Deploy aplikasi

📄 *Logs*
/log\_nginx — Error log Nginx
/log\_pm2 — Log PM2
/log\_access — Access log Nginx

🌐 *Website Monitor*
/check\_web \<domain\> — Cek satu website
/web\_add \<domain\> — Tambah ke watchlist
/web\_remove \<domain\> — Hapus dari watchlist
/web\_list — Daftar website dimonitor
/web\_check — Cek semua website sekarang
/web\_start — Aktifkan auto monitor
/web\_stop — Nonaktifkan auto monitor

🛡 *Security*
/ssh\_monitor\_start — Aktifkan SSH attack detector
/ssh\_monitor\_stop — Nonaktifkan SSH detector
/ssh\_check — Cek SSH attack sekarang

🔔 *Monitoring Alert*
/monitor\_start — Aktifkan auto alert resource
/monitor\_stop — Nonaktifkan auto alert
/monitor\_status — Status monitoring
/check\_now — Cek alert sekarang

ℹ️ *Info*
/list — Tampilkan daftar ini
/start — Pesan sambutan
  `.trim();

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}));

// ─────────────────────────────────────────────────
// COMMAND: /status - Ringkasan semua sekaligus
// ─────────────────────────────────────────────────
bot.onText(/\/status/, withAuth(async (msg, match, chatId) => {
  await bot.sendMessage(chatId, "⏳ Mengecek seluruh status server...");
  await cpuCommand(bot, chatId);
  await ramCommand(bot, chatId);
  await diskCommand(bot, chatId);
  await uptimeCommand(bot, chatId);
}));

// ─────────────────────────────────────────────────
// MONITORING COMMANDS
// ─────────────────────────────────────────────────
bot.onText(/\/cpu/, withAuth(async (msg, match, chatId) => {
  await cpuCommand(bot, chatId);
}));

bot.onText(/\/ram/, withAuth(async (msg, match, chatId) => {
  await ramCommand(bot, chatId);
}));

bot.onText(/\/disk/, withAuth(async (msg, match, chatId) => {
  await diskCommand(bot, chatId);
}));

bot.onText(/\/uptime/, withAuth(async (msg, match, chatId) => {
  await uptimeCommand(bot, chatId);
}));

// ─────────────────────────────────────────────────
// SERVICE CONTROL COMMANDS
// ─────────────────────────────────────────────────
bot.onText(/\/restart_nginx/, withAuth(async (msg, match, chatId) => {
  await restartService(bot, chatId, "nginx");
}));

bot.onText(/\/restart_mysql/, withAuth(async (msg, match, chatId) => {
  await restartService(bot, chatId, "mysql");
}));

bot.onText(/\/restart_pm2/, withAuth(async (msg, match, chatId) => {
  await restartService(bot, chatId, "pm2");
}));

// ─────────────────────────────────────────────────
// DOCKER COMMANDS
// ─────────────────────────────────────────────────
bot.onText(/\/docker_ps/, withAuth(async (msg, match, chatId) => {
  await dockerPs(bot, chatId);
}));

bot.onText(/\/docker_restart(?:\s+(.+))?/, withAuth(async (msg, match, chatId) => {
  const containerName = match[1] ? match[1].trim() : null;
  await dockerRestart(bot, chatId, containerName);
}));

bot.onText(/\/docker_logs(?:\s+(.+))?/, withAuth(async (msg, match, chatId) => {
  const containerName = match[1] ? match[1].trim() : null;
  await dockerLogs(bot, chatId, containerName);
}));

// ─────────────────────────────────────────────────
// AUTOMATION
// ─────────────────────────────────────────────────
bot.onText(/\/deploy/, withAuth(async (msg, match, chatId) => {
  await deployCommand(bot, chatId);
}));

// ─────────────────────────────────────────────────
// LOG COMMANDS
// ─────────────────────────────────────────────────
bot.onText(/\/log_nginx/, withAuth(async (msg, match, chatId) => {
  await logNginx(bot, chatId);
}));

bot.onText(/\/log_pm2/, withAuth(async (msg, match, chatId) => {
  await logPm2(bot, chatId);
}));

bot.onText(/\/log_access/, withAuth(async (msg, match, chatId) => {
  await logAccess(bot, chatId);
}));

// ─────────────────────────────────────────────────
// PHASE 1 — SERVER INSIGHT
// ─────────────────────────────────────────────────
bot.onText(/\/server_report/, withAuth(async (msg, match, chatId) => {
  await serverReportCommand(bot, chatId);
}));

bot.onText(/\/server_map/, withAuth(async (msg, match, chatId) => {
  await serverMapCommand(bot, chatId);
}));

// ─────────────────────────────────────────────────
// PHASE 2 — WEBSITE MONITORING
// ─────────────────────────────────────────────────
bot.onText(/\/check_web(?:\s+(.+))?/, withAuth(async (msg, match, chatId) => {
  const domain = match[1] ? match[1].trim() : null;
  await checkWebCommand(bot, chatId, domain);
}));

bot.onText(/\/web_add(?:\s+(.+))?/, withAuth(async (msg, match, chatId) => {
  const domain = match[1] ? match[1].trim() : null;
  if (!domain) {
    return bot.sendMessage(chatId, "❓ Penggunaan: `/web_add example.com`", { parse_mode: "Markdown" });
  }
  const added = addWebsite(domain);
  await bot.sendMessage(
    chatId,
    added
      ? `✅ *${domain}* ditambahkan ke watchlist.`
      : `ℹ️ *${domain}* sudah ada di watchlist.`,
    { parse_mode: "Markdown" }
  );
}));

bot.onText(/\/web_remove(?:\s+(.+))?/, withAuth(async (msg, match, chatId) => {
  const domain = match[1] ? match[1].trim() : null;
  if (!domain) {
    return bot.sendMessage(chatId, "❓ Penggunaan: `/web_remove example.com`", { parse_mode: "Markdown" });
  }
  const removed = removeWebsite(domain);
  await bot.sendMessage(
    chatId,
    removed
      ? `🗑 *${domain}* dihapus dari watchlist.`
      : `❓ *${domain}* tidak ada di watchlist.`,
    { parse_mode: "Markdown" }
  );
}));

bot.onText(/\/web_list/, withAuth(async (msg, match, chatId) => {
  const sites = listWebsites();
  if (sites.length === 0) {
    return bot.sendMessage(chatId, "📋 Watchlist kosong. Tambahkan dengan `/web_add example.com`", { parse_mode: "Markdown" });
  }
  const lines = sites.map((s) => `• \`${s.domain}\` — ${s.lastStatus === "down" ? "🔴 down" : s.lastStatus === "up" ? "✅ up" : "❓ belum dicek"}`).join("\n");
  await bot.sendMessage(chatId, `🌐 *Website Watchlist:*\n\n${lines}`, { parse_mode: "Markdown" });
}));

bot.onText(/\/web_check/, withAuth(async (msg, match, chatId) => {
  const sites = listWebsites();
  if (sites.length === 0) {
    return bot.sendMessage(chatId, "📋 Watchlist kosong.");
  }
  await bot.sendMessage(chatId, "⏳ Mengecek semua website...");
  await runWebChecks(bot, chatId);
  await bot.sendMessage(chatId, "✅ Pengecekan selesai.");
}));

bot.onText(/\/web_start/, withAuth(async (msg, match, chatId) => {
  const started = startWebMonitoring(bot, chatId);
  if (started) {
    await bot.sendMessage(chatId, "✅ *Website monitoring aktif!*\n\nBot akan cek website setiap 5 menit.", { parse_mode: "Markdown" });
  } else {
    await bot.sendMessage(chatId, "ℹ️ Website monitoring sudah aktif.");
  }
}));

bot.onText(/\/web_stop/, withAuth(async (msg, match, chatId) => {
  const stopped = stopWebMonitoring();
  if (stopped) {
    await bot.sendMessage(chatId, "🔕 *Website monitoring dinonaktifkan.*", { parse_mode: "Markdown" });
  } else {
    await bot.sendMessage(chatId, "ℹ️ Website monitoring tidak sedang aktif.");
  }
}));

// ─────────────────────────────────────────────────
// PHASE 3 — SERVER MAINTENANCE
// ─────────────────────────────────────────────────
bot.onText(/\/update_server/, withAuth(async (msg, match, chatId) => {
  await updateServerCommand(bot, chatId);
}));

// ─────────────────────────────────────────────────
// PHASE 4 — SECURITY MONITORING
// ─────────────────────────────────────────────────
bot.onText(/\/ssh_monitor_start/, withAuth(async (msg, match, chatId) => {
  const started = startSshMonitoring(bot, chatId);
  if (started) {
    await bot.sendMessage(chatId, "🛡 *SSH Attack Detector aktif!*\n\nBot akan alert jika terdeteksi brute force SSH.", { parse_mode: "Markdown" });
  } else {
    await bot.sendMessage(chatId, "ℹ️ SSH monitor sudah aktif.");
  }
}));

bot.onText(/\/ssh_monitor_stop/, withAuth(async (msg, match, chatId) => {
  const stopped = stopSshMonitoring();
  if (stopped) {
    await bot.sendMessage(chatId, "🔕 *SSH Attack Detector dinonaktifkan.*", { parse_mode: "Markdown" });
  } else {
    await bot.sendMessage(chatId, "ℹ️ SSH monitor tidak sedang aktif.");
  }
}));

bot.onText(/\/ssh_check/, withAuth(async (msg, match, chatId) => {
  await bot.sendMessage(chatId, "⏳ Mengecek SSH log...");
  await checkSshNow(bot, chatId);
}));

// ─────────────────────────────────────────────────
// PHASE 5 — VISUAL MONITORING
// ─────────────────────────────────────────────────
bot.onText(/\/cpu_graph/, withAuth(async (msg, match, chatId) => {
  await cpuGraphCommand(bot, chatId);
}));

// ─────────────────────────────────────────────────
// MONITORING ALERT CONTROL
// ─────────────────────────────────────────────────
bot.onText(/\/monitor_start/, withAuth(async (msg, match, chatId) => {
  const started = startMonitoring(bot, chatId);
  if (started) {
    await bot.sendMessage(
      chatId,
      `✅ *Monitoring Alert Aktif!*\n\nBot akan mengirim alert jika:\n• CPU > ${config.alertThreshold.cpu}%\n• RAM > ${config.alertThreshold.ram}%\n• Disk > ${config.alertThreshold.disk}%\n\nInterval: setiap ${config.monitorInterval / 60000} menit`,
      { parse_mode: "Markdown" }
    );
  } else {
    await bot.sendMessage(chatId, "ℹ️ Monitoring sudah aktif sebelumnya.");
  }
}));

bot.onText(/\/monitor_stop/, withAuth(async (msg, match, chatId) => {
  const stopped = stopMonitoring();
  if (stopped) {
    await bot.sendMessage(chatId, "🔕 *Monitoring Alert Dinonaktifkan.*", {
      parse_mode: "Markdown",
    });
  } else {
    await bot.sendMessage(chatId, "ℹ️ Monitoring tidak sedang aktif.");
  }
}));

bot.onText(/\/monitor_status/, withAuth(async (msg, match, chatId) => {
  const active = isMonitoringActive();
  const status = active ? "🟢 *AKTIF*" : "🔴 *TIDAK AKTIF*";
  await bot.sendMessage(
    chatId,
    `📡 *Status Monitoring:* ${status}\n\nThreshold:\n• CPU: ${config.alertThreshold.cpu}%\n• RAM: ${config.alertThreshold.ram}%\n• Disk: ${config.alertThreshold.disk}%`,
    { parse_mode: "Markdown" }
  );
}));

bot.onText(/\/check_now/, withAuth(async (msg, match, chatId) => {
  const { checkAndAlert } = require("./services/monitor");
  await bot.sendMessage(chatId, "⏳ Mengecek metric sekarang...");
  await checkAndAlert(bot, chatId);
  await bot.sendMessage(chatId, "✅ Pengecekan selesai. Tidak ada alert jika semua metric normal.");
}));

// ─────────────────────────────────────────────────
// CALLBACK QUERY HANDLER (Inline Keyboard)
// ─────────────────────────────────────────────────
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;
  const data = query.data;

  // Selalu answer callback agar loading spinner hilang
  await bot.answerCallbackQuery(query.id);

  // Auth check
  if (!isAllowed(userId)) {
    return bot.sendMessage(chatId, "🚫 Access Denied.");
  }

  // Step 1: User pilih project → tampilkan pilihan mode
  if (data.startsWith("deploy_pick:")) {
    const projectPath = data.replace("deploy_pick:", "");

    if (projectPath === "cancel") {
      await bot.editMessageText("❌ Deploy dibatalkan.", { chat_id: chatId, message_id: messageId });
      return;
    }

    await deployAskMode(bot, chatId, messageId, projectPath);
  }

  // Step 2: User pilih mode → jalankan deploy
  // format: deploy_run:<mode>:<projectPath>
  else if (data.startsWith("deploy_run:")) {
    const parts = data.replace("deploy_run:", "").split(":");
    const mode = parts[0]; // simple | npm | composer
    const projectPath = parts.slice(1).join(":"); // path bisa ada ':' di dalamnya

    await bot.editMessageText(
      `🚀 Deploy *${projectPath.split("/").pop()}* dimulai...`,
      { chat_id: chatId, message_id: messageId, parse_mode: "Markdown" }
    );

    await runDeploy(bot, chatId, projectPath, mode);
  }

  // Tombol kembali → tampilkan ulang daftar project
  else if (data === "deploy_back") {
    await bot.editMessageText("↩️ Kembali ke pilihan project...", {
      chat_id: chatId,
      message_id: messageId,
    });
    await deployCommand(bot, chatId);
  }
});

// ─────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────
bot.on("polling_error", (error) => {
  console.error("[POLLING ERROR]", error.code, error.message);
});

bot.on("error", (error) => {
  console.error("[BOT ERROR]", error.message);
});

// Pesan jika command tidak dikenali
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Hanya respon jika dimulai dengan "/" tapi bukan command yang dikenali
  if (text && text.startsWith("/") && !text.match(/^\/(start|list|status|cpu|ram|disk|uptime|restart_nginx|restart_mysql|restart_pm2|docker_ps|docker_restart|docker_logs|deploy|log_nginx|log_pm2|log_access|monitor_start|monitor_stop|monitor_status|check_now|server_report|server_map|check_web|web_add|web_remove|web_list|web_check|web_start|web_stop|update_server|ssh_monitor_start|ssh_monitor_stop|ssh_check|cpu_graph)/)) {
    if (!isAllowed(msg.from.id)) return;
    bot.sendMessage(
      chatId,
      `❓ Command tidak dikenali: \`${text}\`\n\nKetik /start untuk melihat daftar command.`,
      { parse_mode: "Markdown" }
    );
  }
});
