const { execCommand } = require("../utils/helper");

/**
 * Command /deploy
 * Tampilkan daftar project di server sebagai inline keyboard
 */
async function deployCommand(bot, chatId) {
  const baseDir = process.env.DEPLOY_PATH || "/var/www/html";

  try {
    await bot.sendMessage(chatId, `⏳ Mengambil daftar project di \`${baseDir}\`...`, {
      parse_mode: "Markdown",
    });

    const output = await execCommand(`ls -d ${baseDir}/*/`);
    const folders = output
      .split("\n")
      .map(f => f.trim().replace(/\/$/, ""))
      .filter(f => f.length > 0);

    if (folders.length === 0) {
      return bot.sendMessage(chatId, `❌ Tidak ada folder ditemukan di \`${baseDir}\`.`, {
        parse_mode: "Markdown",
      });
    }

    const keyboard = folders.map(folderPath => {
      const folderName = folderPath.split("/").pop();
      return [{ text: `📁 ${folderName}`, callback_data: `deploy_pick:${folderPath}` }];
    });

    keyboard.push([{ text: "❌ Batal", callback_data: "deploy_pick:cancel" }]);

    await bot.sendMessage(
      chatId,
      `🚀 *Deploy Project*\n\nPilih project yang ingin di-deploy dari \`${baseDir}\`:`,
      {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Gagal list folder:\n\`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

/**
 * Tampilkan pilihan mode deploy setelah project dipilih
 */
async function deployAskMode(bot, chatId, messageId, projectPath) {
  const folderName = projectPath.split("/").pop();

  const keyboard = [
    [{ text: "⚡ Git Pull + Restart saja", callback_data: `deploy_run:simple:${projectPath}` }],
    [{ text: "📦 Git Pull + npm install + Restart", callback_data: `deploy_run:npm:${projectPath}` }],
    [{ text: "🎼 Git Pull + composer install + Restart", callback_data: `deploy_run:composer:${projectPath}` }],
    [{ text: "↩️ Kembali", callback_data: "deploy_back" }],
  ];

  await bot.editMessageText(
    `🚀 *Deploy: ${folderName}*\n\nPilih mode deploy:`,
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard },
    }
  );
}

/**
 * Jalankan proses deploy sesuai mode yang dipilih
 * mode: 'simple' | 'npm' | 'composer'
 */
async function runDeploy(bot, chatId, projectPath, mode = "simple") {
  const folderName = projectPath.split("/").pop();

  try {
    await bot.sendMessage(
      chatId,
      `🚀 *Mulai Deploy: ${folderName}*\nMode: \`${mode}\`\nPath: \`${projectPath}\``,
      { parse_mode: "Markdown" }
    );

    // Step 1: Git Pull
    await bot.sendMessage(chatId, "📥 Step 1: Git Pull...");
    const gitOutput = await execCommand(`cd "${projectPath}" && git pull`);
    await bot.sendMessage(
      chatId,
      `✅ Git Pull selesai:\n\`\`\`\n${gitOutput.slice(0, 500)}\n\`\`\``,
      { parse_mode: "Markdown" }
    );

    // Step 2: Install dependencies (opsional berdasarkan mode)
    if (mode === "npm") {
      await bot.sendMessage(chatId, "📦 Step 2: npm install...");
      const npmOutput = await execCommand(`cd "${projectPath}" && npm install --production 2>&1`);
      await bot.sendMessage(
        chatId,
        `✅ npm install selesai:\n\`\`\`\n${npmOutput.slice(0, 400)}\n\`\`\``,
        { parse_mode: "Markdown" }
      );
    } else if (mode === "composer") {
      await bot.sendMessage(chatId, "🎼 Step 2: composer install...");
      const composerOutput = await execCommand(
        `cd "${projectPath}" && composer install --no-dev --optimize-autoloader 2>&1`
      );
      await bot.sendMessage(
        chatId,
        `✅ Composer selesai:\n\`\`\`\n${composerOutput.slice(0, 400)}\n\`\`\``,
        { parse_mode: "Markdown" }
      );
    } else {
      await bot.sendMessage(chatId, "⏭️ Step 2: Skip install.");
    }

    // Step 3: Restart service
    await bot.sendMessage(chatId, "🔄 Step 3: Restart service...");
    let restartOutput;
    try {
      restartOutput = await execCommand(`cd "${projectPath}" && pm2 restart all 2>&1`);
    } catch {
      try {
        // Fallback: coba php artisan serve atau reload nginx
        restartOutput = await execCommand(`sudo systemctl reload nginx 2>&1`);
      } catch {
        restartOutput = "Tidak ada service yang direstart.";
      }
    }

    await bot.sendMessage(
      chatId,
      `🎉 *Deploy Selesai!*\n\n\`\`\`\n${restartOutput.slice(0, 300)}\n\`\`\`\n\n_${new Date().toLocaleString("id-ID")}_`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ *Deploy Gagal!*\n\nPath: \`${projectPath}\`\nError: \`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { deployCommand, deployAskMode, runDeploy };
