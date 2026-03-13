const { execCommand } = require("../utils/helper");

/**
 * Command /log_nginx
 * Menampilkan 50 baris terakhir log error Nginx
 */
async function logNginx(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengambil log Nginx...");

    const output = await execCommand("sudo tail -n 50 /var/log/nginx/error.log 2>&1");
    const truncated = output.length > 3500
      ? "...(menampilkan 3500 karakter terakhir)\n" + output.slice(-3500)
      : output;

    if (!output.trim()) {
      return bot.sendMessage(chatId, "📋 Log Nginx kosong atau tidak ada error.");
    }

    await bot.sendMessage(
      chatId,
      `📋 *NGINX ERROR LOG (50 baris terakhir)*\n\n\`\`\`\n${truncated}\n\`\`\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal membaca log Nginx:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

/**
 * Command /log_pm2
 * Menampilkan log PM2 terbaru
 */
async function logPm2(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengambil log PM2...");

    const output = await execCommand("pm2 logs --nostream --lines 50 2>&1");
    const truncated = output.length > 3500
      ? "...(menampilkan 3500 karakter terakhir)\n" + output.slice(-3500)
      : output;

    if (!output.trim()) {
      return bot.sendMessage(chatId, "📋 Log PM2 kosong.");
    }

    await bot.sendMessage(
      chatId,
      `📋 *PM2 LOGS (50 baris terakhir)*\n\n\`\`\`\n${truncated}\n\`\`\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal membaca log PM2:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

/**
 * Command /log_access
 * Menampilkan access log Nginx terbaru
 */
async function logAccess(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengambil access log...");

    const output = await execCommand("sudo tail -n 30 /var/log/nginx/access.log 2>&1");
    const truncated = output.length > 3500 ? output.slice(-3500) : output;

    await bot.sendMessage(
      chatId,
      `📋 *NGINX ACCESS LOG (30 baris terakhir)*\n\n\`\`\`\n${truncated}\n\`\`\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal membaca access log:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { logNginx, logPm2, logAccess };
