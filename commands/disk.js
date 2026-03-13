const { execCommand } = require("../utils/helper");

/**
 * Command /disk
 * Menampilkan penggunaan disk storage VPS
 */
async function diskCommand(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengecek Disk...");

    const output = await execCommand("df -h --output=source,size,used,avail,pcent,target | tail -n +2");
    const lines = output.split("\n").filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("tmpfs") && !trimmed.startsWith("udev");
    });

    let result = "💾 *DISK STATUS*\n\n";

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        const [filesystem, size, used, avail, usePercent, mountpoint] = parts;
        const percent = parseInt(usePercent);
        const bar = generateBar(percent, 100);
        const emoji = percent > 90 ? "🔴" : percent > 70 ? "🟡" : "🟢";

        result += `${emoji} \`${mountpoint}\`\n`;
        result += `${bar} ${usePercent}\n`;
        result += `Size: \`${size}\` | Used: \`${used}\` | Free: \`${avail}\`\n\n`;
      }
    });

    result += `_Updated: ${new Date().toLocaleString("id-ID")}_`;

    await bot.sendMessage(chatId, result, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Gagal mengecek Disk:\n\`${error.message}\``, {
      parse_mode: "Markdown",
    });
  }
}

/**
 * Dapatkan persen penggunaan disk root "/" (untuk monitoring alert)
 */
async function getDiskUsage() {
  try {
    const output = await execCommand("df / --output=pcent | tail -1");
    return parseInt(output.trim().replace("%", ""));
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

module.exports = { diskCommand, getDiskUsage };
