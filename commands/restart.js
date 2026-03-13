const { execCommand } = require("../utils/helper");

/**
 * Command: restart service (nginx, mysql, pm2)
 */
async function restartService(bot, chatId, service) {
  const serviceMap = {
    nginx: {
      command: "sudo systemctl restart nginx",
      label: "Nginx",
      checkCommand: "systemctl is-active nginx",
    },
    mysql: {
      command: "sudo systemctl restart mysql",
      label: "MySQL",
      checkCommand: "systemctl is-active mysql",
    },
    mariadb: {
      command: "sudo systemctl restart mariadb",
      label: "MariaDB",
      checkCommand: "systemctl is-active mariadb",
    },
    pm2: {
      command: "pm2 restart all",
      label: "PM2",
      checkCommand: "pm2 status",
    },
  };

  const svc = serviceMap[service];
  if (!svc) {
    return bot.sendMessage(chatId, `❌ Service \`${service}\` tidak dikenali.`, {
      parse_mode: "Markdown",
    });
  }

  try {
    await bot.sendMessage(chatId, `⏳ Merestart *${svc.label}*...`, {
      parse_mode: "Markdown",
    });

    await execCommand(svc.command);

    // Verifikasi status setelah restart
    let status = "unknown";
    try {
      status = await execCommand(svc.checkCommand);
      status = status.split("\n")[0].trim();
    } catch {
      status = "running";
    }

    const isActive = status === "active" || status.includes("online") || status.includes("running");
    const emoji = isActive ? "✅" : "⚠️";

    await bot.sendMessage(
      chatId,
      `${emoji} *${svc.label} Restarted*\n\nStatus: \`${status}\`\n\n_${new Date().toLocaleString("id-ID")}_`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal restart *${svc.label}*:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { restartService };
