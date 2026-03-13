const { execCommand } = require("../utils/helper");

/**
 * Command /server_report
 * Menampilkan laporan lengkap server dalam satu command
 */
async function serverReportCommand(bot, chatId) {
  try {
    await bot.sendMessage(chatId, "⏳ Menyusun laporan server...");

    // CPU
    let cpu = "N/A";
    try {
      const cpuOut = await execCommand(`top -bn1 | grep "Cpu(s)"`);
      const idleMatch = cpuOut.match(/(\d+\.?\d*)\s*id/);
      const idle = idleMatch ? parseFloat(idleMatch[1]) : 0;
      cpu = (100 - idle).toFixed(1) + "%";
    } catch {}

    // RAM
    let ramUsed = "N/A", ramTotal = "N/A";
    try {
      const ramOut = await execCommand(`free -m | grep Mem`);
      const parts = ramOut.trim().split(/\s+/);
      const totalMB = parseInt(parts[1]);
      const usedMB = parseInt(parts[2]);
      ramUsed = usedMB >= 1024 ? (usedMB / 1024).toFixed(1) + "GB" : usedMB + "MB";
      ramTotal = totalMB >= 1024 ? (totalMB / 1024).toFixed(1) + "GB" : totalMB + "MB";
    } catch {}

    // Disk
    let diskUsed = "N/A", diskTotal = "N/A";
    try {
      const diskOut = await execCommand(`df -h / | tail -1`);
      const parts = diskOut.trim().split(/\s+/);
      diskUsed = parts[2];
      diskTotal = parts[1];
    } catch {}

    // Uptime
    let uptime = "N/A";
    try {
      uptime = await execCommand(`uptime -p`);
      uptime = uptime.replace("up ", "");
    } catch {}

    // Services
    const services = ["nginx", "mysql", "pm2"];
    const serviceLines = [];
    for (const svc of services) {
      let status = "❓ unknown";
      try {
        if (svc === "pm2") {
          await execCommand(`pm2 list`);
          status = "✅ running";
        } else {
          const out = await execCommand(`systemctl is-active ${svc}`);
          status = out.trim() === "active" ? "✅ running" : "🔴 stopped";
        }
      } catch {
        status = "🔴 stopped";
      }
      serviceLines.push(`  ${svc.padEnd(8)}: ${status}`);
    }

    // Docker containers
    let dockerLines = [];
    try {
      const dockerOut = await execCommand(
        `docker ps -a --format "{{.Names}}|{{.Status}}" 2>/dev/null`
      );
      if (dockerOut) {
        dockerLines = dockerOut.split("\n").map((line) => {
          const [name, statusRaw] = line.split("|");
          const running = statusRaw && statusRaw.toLowerCase().startsWith("up");
          return `  ${(name || "").padEnd(14)}: ${running ? "✅ running" : "🔴 stopped"}`;
        });
      }
    } catch {}

    const dockerSection =
      dockerLines.length > 0
        ? `\n🐳 *Containers*\n\`\`\`\n${dockerLines.join("\n")}\n\`\`\``
        : "\n🐳 *Containers*\n`Docker tidak tersedia`";

    const message = `
🖥 *SERVER REPORT*

📊 *Resource Usage*
\`\`\`
CPU  : ${cpu}
RAM  : ${ramUsed} / ${ramTotal}
Disk : ${diskUsed} / ${diskTotal}
\`\`\`

⏱ *Uptime*
\`${uptime}\`

🔧 *Services*
\`\`\`
${serviceLines.join("\n")}
\`\`\`
${dockerSection}

_${new Date().toLocaleString("id-ID")}_
    `.trim();

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal membuat server report:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { serverReportCommand };
