const { execCommand } = require("../utils/helper");

/**
 * Command /cpu
 * Menampilkan penggunaan CPU saat ini
 */
async function cpuCommand(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengecek CPU...");

    const output = await execCommand(`top -bn1 | grep "Cpu(s)"`);

    // Parsing output top: "Cpu(s):  3.0 us,  0.3 sy, ..."
    const match = output.match(/(\d+\.?\d*)\s*us/);
    const userCpu = match ? parseFloat(match[1]) : 0;

    const idleMatch = output.match(/(\d+\.?\d*)\s*id/);
    const idle = idleMatch ? parseFloat(idleMatch[1]) : 0;
    const totalUsed = (100 - idle).toFixed(1);

    const bar = generateBar(totalUsed, 100);

    const message = `
💻 *CPU STATUS*

📊 Usage: \`${totalUsed}%\`
${bar}

User: \`${userCpu}%\`
Idle: \`${idle}%\`

_Updated: ${new Date().toLocaleString("id-ID")}_
    `.trim();

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Gagal mengecek CPU:\n\`${error.message}\``, {
      parse_mode: "Markdown",
    });
  }
}

/**
 * Dapatkan nilai CPU usage (untuk monitoring alert)
 */
async function getCpuUsage() {
  try {
    const output = await execCommand(`top -bn1 | grep "Cpu(s)"`);
    const idleMatch = output.match(/(\d+\.?\d*)\s*id/);
    const idle = idleMatch ? parseFloat(idleMatch[1]) : 0;
    return parseFloat((100 - idle).toFixed(1));
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

module.exports = { cpuCommand, getCpuUsage };
