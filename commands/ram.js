const { execCommand } = require("../utils/helper");

/**
 * Command /ram
 * Menampilkan penggunaan RAM saat ini
 */
async function ramCommand(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengecek RAM...");

    const output = await execCommand("free -m");
    const lines = output.split("\n");
    const memLine = lines[1].trim().split(/\s+/);

    const total = parseInt(memLine[1]);
    const used = parseInt(memLine[2]);
    const free = parseInt(memLine[3]);
    const available = parseInt(memLine[6]) || free;

    const percentage = ((used / total) * 100).toFixed(1);
    const bar = generateBar(used, total);

    const message = `
🧠 *RAM STATUS*

📊 Usage: \`${percentage}%\`
${bar}

Total:     \`${total} MB (${(total / 1024).toFixed(1)} GB)\`
Used:      \`${used} MB\`
Free:      \`${free} MB\`
Available: \`${available} MB\`

_Updated: ${new Date().toLocaleString("id-ID")}_
    `.trim();

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Gagal mengecek RAM:\n\`${error.message}\``, {
      parse_mode: "Markdown",
    });
  }
}

/**
 * Dapatkan nilai RAM usage dalam persen (untuk monitoring alert)
 */
async function getRamUsage() {
  try {
    const output = await execCommand("free -m");
    const lines = output.split("\n");
    const memLine = lines[1].trim().split(/\s+/);
    const total = parseInt(memLine[1]);
    const used = parseInt(memLine[2]);
    return parseFloat(((used / total) * 100).toFixed(1));
  } catch {
    return 0;
  }
}

function generateBar(used, total, size = 10) {
  const percentage = Math.min((used / total) * 100, 100);
  const filled = Math.round((percentage / 100) * size);
  const empty = size - filled;
  return "[" + "█".repeat(filled) + "░".repeat(empty) + "]";
}

module.exports = { ramCommand, getRamUsage };
