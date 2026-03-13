const { execCommand } = require("../utils/helper");

/**
 * Command /docker_ps
 * Menampilkan daftar container Docker yang berjalan
 */
async function dockerPs(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Mengecek Docker containers...");

    const output = await execCommand(
      'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"'
    );

    if (!output || output.trim() === "NAMES\tSTATUS\tPORTS") {
      return bot.sendMessage(chatId, "📦 Tidak ada container Docker yang berjalan.", {
        parse_mode: "Markdown",
      });
    }

    await bot.sendMessage(chatId, `🐳 *DOCKER CONTAINERS*\n\n\`\`\`\n${output}\n\`\`\`\n\n_Updated: ${new Date().toLocaleString("id-ID")}_`, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("Cannot connect")) {
      return bot.sendMessage(chatId, "❌ Docker tidak terinstall atau tidak berjalan di server ini.");
    }
    await bot.sendMessage(chatId, `❌ Error Docker:\n\`${error.message}\``, {
      parse_mode: "Markdown",
    });
  }
}

/**
 * Command /docker_restart <container>
 * Restart container Docker tertentu
 */
async function dockerRestart(bot, chatId, containerName) {
  if (!containerName) {
    return bot.sendMessage(
      chatId,
      "⚠️ Usage: `/docker_restart <nama_container>`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    await bot.sendMessage(chatId, `⏳ Merestart container *${containerName}*...`, {
      parse_mode: "Markdown",
    });

    await execCommand(`docker restart ${containerName}`);

    await bot.sendMessage(
      chatId,
      `✅ Container *${containerName}* berhasil direstart!\n\n_${new Date().toLocaleString("id-ID")}_`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal restart container *${containerName}*:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

/**
 * Command /docker_logs <container>
 * Menampilkan log container Docker terbaru
 */
async function dockerLogs(bot, chatId, containerName) {
  if (!containerName) {
    return bot.sendMessage(
      chatId,
      "⚠️ Usage: `/docker_logs <nama_container>`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    await bot.sendMessage(chatId, `⏳ Mengambil logs *${containerName}*...`, {
      parse_mode: "Markdown",
    });

    const output = await execCommand(`docker logs --tail=30 ${containerName} 2>&1`);

    const truncated = output.length > 3500 ? "...(truncated)\n" + output.slice(-3500) : output;

    await bot.sendMessage(
      chatId,
      `📋 *Docker Logs: ${containerName}*\n\n\`\`\`\n${truncated}\n\`\`\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal mengambil logs *${containerName}*:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { dockerPs, dockerRestart, dockerLogs };
