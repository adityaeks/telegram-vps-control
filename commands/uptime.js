const { execCommand } = require("../utils/helper");

/**
 * Command /uptime
 * Menampilkan uptime server dan load average
 */
async function uptimeCommand(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengecek Uptime...");

    const [uptimeOut, loadOut, usersOut] = await Promise.all([
      execCommand("cat /proc/uptime"),
      execCommand("cat /proc/loadavg"),
      execCommand("who | wc -l"),
    ]);

    // Parse uptime dari /proc/uptime (dalam detik)
    const uptimeSeconds = parseFloat(uptimeOut.split(" ")[0]);
    const uptimeFormatted = formatUptime(uptimeSeconds);

    // Parse load average
    const loadParts = loadOut.trim().split(/\s+/);
    const load1 = loadParts[0];
    const load5 = loadParts[1];
    const load15 = loadParts[2];

    const activeUsers = parseInt(usersOut.trim());

    // Hitung jumlah CPU core untuk context load average
    let cpuCores = 1;
    try {
      const coresOut = await execCommand("nproc");
      cpuCores = parseInt(coresOut.trim()) || 1;
    } catch {
      // ignore
    }

    const load1Status = parseFloat(load1) > cpuCores ? "🔴" : parseFloat(load1) > cpuCores * 0.7 ? "🟡" : "🟢";

    const message = `
⏱️ *SERVER UPTIME*

🕐 Uptime: \`${uptimeFormatted}\`

📈 Load Average:
${load1Status} 1 min:  \`${load1}\`
   5 min:  \`${load5}\`
   15 min: \`${load15}\`

💡 CPU Cores: \`${cpuCores}\`
👥 Active Users: \`${activeUsers}\`

_Updated: ${new Date().toLocaleString("id-ID")}_
    `.trim();

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Gagal mengecek Uptime:\n\`${error.message}\``, {
      parse_mode: "Markdown",
    });
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);

  return parts.join(" ") || "Baru saja";
}

module.exports = { uptimeCommand };
