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
const { deployCommand, runDeploy } = require("./commands/deploy");
const { logNginx, logPm2, logAccess } = require("./commands/logs");
const { startMonitoring, stopMonitoring, isMonitoringActive } = require("./services/monitor");

// Inisialisasi bot
const bot = new TelegramBot(config.token, { polling: true });

console.log("🚀 VPS Control Bot is running...");
console.log(`📋 Allowed users: ${config.allowedUsers.length > 0 ? config.allowedUsers.join(", ") : "SEMUA (mode dev)"}`);

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

🔧 *Service Control:*
/restart\\_nginx - Restart Nginx
/restart\\_mysql - Restart MySQL
/restart\\_pm2 - Restart PM2

🐳 *Docker:*
/docker\\_ps - List containers
/docker\\_restart <name> - Restart container
/docker\\_logs <name> - Lihat log container

🚀 *Automation:*
/deploy - Deploy aplikasi

📋 *Logs:*
/log\\_nginx - Log error Nginx
/log\\_pm2 - Log PM2
/log\\_access - Log access Nginx

🔔 *Alert:*
/monitor\\_start - Aktifkan auto alert
/monitor\\_stop - Nonaktifkan auto alert
/monitor\\_status - Status monitoring
/check\\_now - Cek alert manual

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

🔧 *Service Control*
/restart\_nginx — Restart Nginx
/restart\_mysql — Restart MySQL
/restart\_pm2 — Restart PM2

🐳 *Docker*
/docker\_ps — List containers
/docker\_restart \<name\> — Restart container
/docker\_logs \<name\> — Log container

🚀 *Automation*
/deploy — Deploy aplikasi (git pull → install → restart)

📄 *Logs*
/log\_nginx — Error log Nginx
/log\_pm2 — Log PM2
/log\_access — Access log Nginx

🔔 *Monitoring Alert*
/monitor\_start — Aktifkan auto alert
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
  const data = query.data;

  // Selalu answer callback agar loading spinner hilang
  await bot.answerCallbackQuery(query.id);

  // Auth check
  if (!isAllowed(userId)) {
    return bot.sendMessage(chatId, "🚫 Access Denied.");
  }

  // Handle deploy callback: format "deploy:/path/to/project"
  if (data.startsWith("deploy:")) {
    const projectPath = data.replace("deploy:", "");

    if (projectPath === "cancel") {
      // Edit pesan lama jadi notif batal
      await bot.editMessageText("❌ Deploy dibatalkan.", {
        chat_id: chatId,
        message_id: query.message.message_id,
      });
      return;
    }

    // Edit pesan keyboard jadi konfirmasi
    await bot.editMessageText(
      `🚀 Memulai deploy *${projectPath.split("/").pop()}*...`,
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "Markdown",
      }
    );

    await runDeploy(bot, chatId, projectPath);
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
  if (text && text.startsWith("/") && !text.match(/^\/(start|list|status|cpu|ram|disk|uptime|restart_nginx|restart_mysql|restart_pm2|docker_ps|docker_restart|docker_logs|deploy|log_nginx|log_pm2|log_access|monitor_start|monitor_stop|monitor_status|check_now)/)) {
    if (!isAllowed(msg.from.id)) return;
    bot.sendMessage(
      chatId,
      `❓ Command tidak dikenali: \`${text}\`\n\nKetik /start untuk melihat daftar command.`,
      { parse_mode: "Markdown" }
    );
  }
});
