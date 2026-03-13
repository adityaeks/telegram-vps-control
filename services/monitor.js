const config = require("../config");
const { getCpuUsage } = require("../commands/cpu");
const { getRamUsage } = require("../commands/ram");
const { getDiskUsage } = require("../commands/disk");

let alertActive = false;
let intervalId = null;

// Lacak apakah alert sudah dikirim (hindari spam alert)
const alertSent = {
  cpu: false,
  ram: false,
  disk: false,
};

/**
 * Mulai sistem monitoring alert otomatis
 * @param {TelegramBot} bot
 * @param {number} chatId - Chat ID untuk mengirim alert
 */
function startMonitoring(bot, chatId) {
  if (alertActive) {
    return false; // Sudah berjalan
  }

  alertActive = true;
  const interval = config.monitorInterval || 5 * 60 * 1000;

  console.log(`[MONITOR] Monitoring dimulai. Interval: ${interval / 1000}s. Target: chatId ${chatId}`);

  intervalId = setInterval(async () => {
    try {
      await checkAndAlert(bot, chatId);
    } catch (err) {
      console.error("[MONITOR] Error:", err.message);
    }
  }, interval);

  return true;
}

/**
 * Stop sistem monitoring
 */
function stopMonitoring() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    alertActive = false;
    Object.keys(alertSent).forEach(k => alertSent[k] = false);
    return true;
  }
  return false;
}

/**
 * Cek semua metric dan kirim alert jika melebihi threshold
 */
async function checkAndAlert(bot, chatId) {
  const threshold = config.alertThreshold || { cpu: 80, ram: 85, disk: 90 };

  const [cpu, ram, disk] = await Promise.all([
    getCpuUsage(),
    getRamUsage(),
    getDiskUsage(),
  ]);

  const alerts = [];

  // CPU alert
  if (cpu > threshold.cpu) {
    if (!alertSent.cpu) {
      alerts.push(`🔴 CPU Usage: *${cpu}%* (threshold: ${threshold.cpu}%)`);
      alertSent.cpu = true;
    }
  } else {
    alertSent.cpu = false; // Reset jika sudah normal
  }

  // RAM alert
  if (ram > threshold.ram) {
    if (!alertSent.ram) {
      alerts.push(`🟡 RAM Usage: *${ram}%* (threshold: ${threshold.ram}%)`);
      alertSent.ram = true;
    }
  } else {
    alertSent.ram = false;
  }

  // Disk alert
  if (disk > threshold.disk) {
    if (!alertSent.disk) {
      alerts.push(`🔴 Disk Usage: *${disk}%* (threshold: ${threshold.disk}%)`);
      alertSent.disk = true;
    }
  } else {
    alertSent.disk = false;
  }

  // Kirim alert jika ada
  if (alerts.length > 0) {
    const message = `
⚠️ *VPS ALERT!*

Server kamu mengalami beban tinggi:

${alerts.join("\n")}

CPU:  \`${cpu}%\`
RAM:  \`${ram}%\`
Disk: \`${disk}%\`

_${new Date().toLocaleString("id-ID")}_
    `.trim();

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  }
}

/**
 * Cek status monitoring saat ini
 */
function isMonitoringActive() {
  return alertActive;
}

module.exports = { startMonitoring, stopMonitoring, isMonitoringActive, checkAndAlert };
