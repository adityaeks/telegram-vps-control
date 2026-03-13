const fs = require("fs");

const LOG_PATH = "/var/log/auth.log";
const TAIL_LINES = 200;
const BRUTE_FORCE_THRESHOLD = 10; // attempts dalam window
const TIME_WINDOW_SEC = 120; // 2 menit

let sshAlertActive = false;
let sshIntervalId = null;
// Track IP yang sudah dikirim alertnya
const alertedIPs = new Set();

/**
 * Parse auth.log dan temukan IP dengan banyak login gagal
 * @returns {Array<{ ip: string, attempts: number }>}
 */
async function detectBruteForce() {
  try {
    const { execCommand } = require("../utils/helper");

    // Ambil tail saja agar cepat
    let logContent = "";
    try {
      logContent = await execCommand(
        `tail -n ${TAIL_LINES} ${LOG_PATH} 2>/dev/null || journalctl -u ssh --no-pager -n ${TAIL_LINES} 2>/dev/null`
      );
    } catch {
      return [];
    }

    if (!logContent) return [];

    const lines = logContent.split("\n");
    const now = Date.now();
    const ipCounts = {};

    for (const line of lines) {
      // Match "Failed password" atau "Invalid user" + IP
      const match = line.match(
        /(?:Failed password|Invalid user|authentication failure).*?from\s+(\d+\.\d+\.\d+\.\d+)/i
      );
      if (!match) continue;

      const ip = match[1];
      if (!ipCounts[ip]) ipCounts[ip] = 0;
      ipCounts[ip]++;
    }

    // Filter hanya yang melebihi threshold
    return Object.entries(ipCounts)
      .filter(([, count]) => count >= BRUTE_FORCE_THRESHOLD)
      .map(([ip, attempts]) => ({ ip, attempts }));
  } catch {
    return [];
  }
}

/**
 * Mulai monitoring SSH brute force
 */
function startSshMonitoring(bot, chatId, intervalMs = 2 * 60 * 1000) {
  if (sshAlertActive) return false;

  sshAlertActive = true;
  console.log(`[SSH MONITOR] Dimulai. Interval: ${intervalMs / 1000}s`);

  sshIntervalId = setInterval(async () => {
    try {
      const attacks = await detectBruteForce();
      for (const { ip, attempts } of attacks) {
        if (!alertedIPs.has(ip)) {
          alertedIPs.add(ip);
          const time = new Date().toLocaleTimeString("id-ID");
          await bot.sendMessage(
            chatId,
            `
⚠️ *SSH ATTACK DETECTED*

IP       : \`${ip}\`
Attempts : \`${attempts}\`
Time     : \`${time}\`

_Bot otomatis mendeteksi percobaan brute force._
            `.trim(),
            { parse_mode: "Markdown" }
          );
        }
      }

      // Hapus IP dari blacklist jika sudah tidak muncul lagi
      for (const ip of alertedIPs) {
        const stillAttacking = attacks.find((a) => a.ip === ip);
        if (!stillAttacking) alertedIPs.delete(ip);
      }
    } catch (err) {
      console.error("[SSH MONITOR] Error:", err.message);
    }
  }, intervalMs);

  return true;
}

/**
 * Stop monitoring SSH
 */
function stopSshMonitoring() {
  if (sshIntervalId) {
    clearInterval(sshIntervalId);
    sshIntervalId = null;
    sshAlertActive = false;
    alertedIPs.clear();
    return true;
  }
  return false;
}

/**
 * Status monitoring SSH
 */
function isSshMonitoringActive() {
  return sshAlertActive;
}

/**
 * Manual check sekarang
 */
async function checkSshNow(bot, chatId) {
  const attacks = await detectBruteForce();
  if (attacks.length === 0) {
    await bot.sendMessage(chatId, "✅ Tidak ada aktivitas SSH mencurigakan saat ini.");
    return;
  }

  const lines = attacks
    .map(({ ip, attempts }) => `  ${ip.padEnd(20)}: ${attempts}x attempt`)
    .join("\n");

  await bot.sendMessage(
    chatId,
    `
⚠️ *SSH ATTACK DETECTED*

\`\`\`
${lines}
\`\`\`

_${new Date().toLocaleString("id-ID")}_
    `.trim(),
    { parse_mode: "Markdown" }
  );
}

module.exports = {
  startSshMonitoring,
  stopSshMonitoring,
  isSshMonitoringActive,
  checkSshNow,
};
