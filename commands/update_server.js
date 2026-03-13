const { execCommand } = require("../utils/helper");

/**
 * Command /update_server
 * Jalankan sudo apt update && sudo apt upgrade -y
 * dan laporkan hasilnya ke Telegram
 */
async function updateServerCommand(bot, chatId) {
  try {
    await bot.sendMessage(
      chatId,
      "⏳ *Menjalankan update server...*\n\n_Ini mungkin membutuhkan beberapa menit._",
      { parse_mode: "Markdown" }
    );

    // Step 1: apt update
    let updateOut = "";
    try {
      updateOut = await execCommand(
        `sudo apt-get update -y 2>&1 | tail -5`
      );
    } catch (e) {
      updateOut = e.message;
    }

    // Step 2: apt upgrade
    let upgradeOut = "";
    let packagesUpdated = 0;
    let securityUpdates = 0;
    let kernelUpdate = false;

    try {
      upgradeOut = await execCommand(
        `sudo apt-get upgrade -y --simulate 2>&1`
      );

      // Hitung packages yang akan diupgrade
      const pkgMatch = upgradeOut.match(/(\d+) upgraded/);
      if (pkgMatch) packagesUpdated = parseInt(pkgMatch[1]);

      // Cek security updates
      const secMatch = upgradeOut.match(/(\d+) security/i);
      if (secMatch) securityUpdates = parseInt(secMatch[1]);

      // Cek kernel update
      if (upgradeOut.toLowerCase().includes("linux-image")) kernelUpdate = true;

      // Jalankan upgrade sesungguhnya
      await execCommand(`sudo apt-get upgrade -y 2>&1 | tail -3`);
    } catch (e) {
      upgradeOut = e.message;
    }

    const message = `
📦 *SERVER UPDATE*

✅ *Update selesai!*

\`\`\`
Packages updated : ${packagesUpdated}
Security updates : ${securityUpdates}
Kernel update    : ${kernelUpdate ? "yes" : "no"}
\`\`\`

_${new Date().toLocaleString("id-ID")}_
    `.trim();

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal menjalankan update:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { updateServerCommand };
