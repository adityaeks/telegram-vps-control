const { execCommand } = require("../utils/helper");

/**
 * Command /deploy
 * Jalankan deployment: git pull → install → restart
 */
async function deployCommand(bot, chatId, projectPath) {
  // Gunakan projectPath dari config atau default ke current dir
  const path = projectPath || process.env.DEPLOY_PATH || "/var/www/html/app";

  try {
    await bot.sendMessage(chatId, `🚀 *Memulai Deployment...*\n\nPath: \`${path}\``, {
      parse_mode: "Markdown",
    });

    // Step 1: Git Pull
    await bot.sendMessage(chatId, "📥 Step 1/3: Git Pull...");
    const gitOutput = await execCommand(`cd ${path} && git pull`);
    await bot.sendMessage(chatId, `✅ Git Pull selesai:\n\`\`\`\n${gitOutput.slice(0, 500)}\n\`\`\``, {
      parse_mode: "Markdown",
    });

    // Step 2: Install dependencies
    await bot.sendMessage(chatId, "📦 Step 2/3: npm install...");
    const npmOutput = await execCommand(`cd ${path} && npm install --production 2>&1`);
    await bot.sendMessage(chatId, `✅ npm install selesai:\n\`\`\`\n${npmOutput.slice(0, 300)}\n\`\`\``, {
      parse_mode: "Markdown",
    });

    // Step 3: PM2 Restart
    await bot.sendMessage(chatId, "🔄 Step 3/3: PM2 restart...");
    const pm2Output = await execCommand(`cd ${path} && pm2 restart all 2>&1 || pm2 start . 2>&1`);
    await bot.sendMessage(
      chatId,
      `✅ *Deployment Selesai!*\n\n\`\`\`\n${pm2Output.slice(0, 300)}\n\`\`\`\n\n_${new Date().toLocaleString("id-ID")}_`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ *Deployment Gagal!*\n\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { deployCommand };
