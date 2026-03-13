const { checkWebsite } = require("../commands/check_web");

// Daftar website yang dimonitor: { domain, lastStatus, alertSent }
const watchList = [];

let webMonitorActive = false;
let webIntervalId = null;
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 menit

/**
 * Tambah domain ke watchlist
 */
function addWebsite(domain) {
  const exists = watchList.find((w) => w.domain === domain);
  if (!exists) {
    watchList.push({ domain, lastStatus: null, alertSent: false });
    return true;
  }
  return false; // sudah ada
}

/**
 * Hapus domain dari watchlist
 */
function removeWebsite(domain) {
  const idx = watchList.findIndex((w) => w.domain === domain);
  if (idx !== -1) {
    watchList.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Daftar domain yang dimonitor
 */
function listWebsites() {
  return [...watchList];
}

/**
 * Mulai monitoring website
 */
function startWebMonitoring(bot, chatId, intervalMs = DEFAULT_INTERVAL_MS) {
  if (webMonitorActive) return false;

  webMonitorActive = true;
  console.log(`[WEB MONITOR] Dimulai. Interval: ${intervalMs / 1000}s`);

  webIntervalId = setInterval(async () => {
    await runWebChecks(bot, chatId);
  }, intervalMs);

  return true;
}

/**
 * Stop monitoring website
 */
function stopWebMonitoring() {
  if (webIntervalId) {
    clearInterval(webIntervalId);
    webIntervalId = null;
    webMonitorActive = false;
    return true;
  }
  return false;
}

/**
 * Status monitoring website
 */
function isWebMonitoringActive() {
  return webMonitorActive;
}

/**
 * Jalankan pengecekan semua website di watchlist
 */
async function runWebChecks(bot, chatId) {
  for (const site of watchList) {
    try {
      const result = await checkWebsite(site.domain);
      const wasDown = site.lastStatus === "down";

      if (!result.ok) {
        // Website down
        if (!site.alertSent) {
          site.alertSent = true;
          site.lastStatus = "down";
          const time = new Date().toLocaleTimeString("id-ID");

          await bot.sendMessage(
            chatId,
            `
🚨 *WEBSITE DOWN ALERT*

Domain : \`${site.domain}\`
Status : \`${result.status || "UNREACHABLE"}\`
Time   : \`${time}\`
            `.trim(),
            { parse_mode: "Markdown" }
          );
        }
      } else {
        // Website up
        if (wasDown) {
          // Baru recovered
          await bot.sendMessage(
            chatId,
            `
✅ *WEBSITE RECOVERED*

Domain   : \`${site.domain}\`
Response : \`${result.time}ms\`

_Website kembali normal._
            `.trim(),
            { parse_mode: "Markdown" }
          );
        }
        site.alertSent = false;
        site.lastStatus = "up";
      }
    } catch (err) {
      console.error(`[WEB MONITOR] Error cek ${site.domain}:`, err.message);
    }
  }
}

module.exports = {
  addWebsite,
  removeWebsite,
  listWebsites,
  startWebMonitoring,
  stopWebMonitoring,
  isWebMonitoringActive,
  runWebChecks,
};
