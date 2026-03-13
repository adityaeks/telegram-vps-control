const { execCommand } = require("../utils/helper");

/**
 * Cek status satu service systemctl
 */
async function checkService(name) {
  try {
    const out = await execCommand(`systemctl is-active ${name}`);
    return out.trim() === "active" ? "✅ running" : "🔴 stopped";
  } catch {
    return "🔴 stopped";
  }
}

/**
 * Command /server_map
 * Menampilkan arsitektur server secara ringkas
 */
async function serverMapCommand(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Memetakan arsitektur server...");

    // Web Server
    const nginx = await checkService("nginx");
    const apache2 = await checkService("apache2");

    // Database
    const mysql = await checkService("mysql");
    const mariadb = await checkService("mariadb");
    const postgresql = await checkService("postgresql");

    // Process Manager
    let pm2Status = "🔴 stopped";
    try {
      await execCommand(`pm2 list`);
      pm2Status = "✅ running";
    } catch {}

    // Node Apps via PM2
    let pm2Apps = [];
    try {
      const pm2Out = await execCommand(
        `pm2 list --no-color 2>/dev/null | grep -E "online|stopped|errored" | awk '{print $4, $10}'`
      );
      if (pm2Out) {
        pm2Apps = pm2Out.split("\n").filter(Boolean).map((line) => {
          const parts = line.trim().split(/\s+/);
          const appName = parts[0] || "unknown";
          const appStatus = parts[1] === "online" ? "✅ running" : "🔴 stopped";
          return `  ${appName.padEnd(20)}: ${appStatus}`;
        });
      }
    } catch {}

    // Docker containers
    let dockerContainers = [];
    try {
      const dockerOut = await execCommand(
        `docker ps -a --format "{{.Names}}|{{.Status}}" 2>/dev/null`
      );
      if (dockerOut) {
        dockerContainers = dockerOut.split("\n").filter(Boolean).map((line) => {
          const [name, statusRaw] = line.split("|");
          const running = statusRaw && statusRaw.toLowerCase().startsWith("up");
          return `  ${(name || "").padEnd(20)}: ${running ? "✅ running" : "🔴 stopped"}`;
        });
      }
    } catch {}

    // Build sections
    const webSection = [
      nginx !== "🔴 stopped" ? `  nginx       : ${nginx}` : null,
      apache2 !== "🔴 stopped" ? `  apache2     : ${apache2}` : null,
    ]
      .filter(Boolean)
      .join("\n") || "  (tidak ada web server aktif)";

    const dbSection = [
      mysql !== "🔴 stopped" ? `  mysql       : ${mysql}` : null,
      mariadb !== "🔴 stopped" ? `  mariadb     : ${mariadb}` : null,
      postgresql !== "🔴 stopped" ? `  postgresql  : ${postgresql}` : null,
    ]
      .filter(Boolean)
      .join("\n") || "  (tidak ada database aktif)";

    const pm2Section =
      pm2Apps.length > 0
        ? pm2Apps.join("\n")
        : `  pm2         : ${pm2Status}`;

    const dockerSection =
      dockerContainers.length > 0
        ? dockerContainers.join("\n")
        : "  (tidak ada container)";

    const message = `
🗺 *SERVER MAP*

🌐 *Web Server*
\`\`\`
${webSection}
\`\`\`

🗄 *Database*
\`\`\`
${dbSection}
\`\`\`

⚙ *Process Manager*
\`\`\`
  pm2         : ${pm2Status}
\`\`\`

🖥 *Node Apps (PM2)*
\`\`\`
${pm2Section}
\`\`\`

🐳 *Containers (Docker)*
\`\`\`
${dockerSection}
\`\`\`

_${new Date().toLocaleString("id-ID")}_
    `.trim();

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal mengambil server map:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { serverMapCommand };
