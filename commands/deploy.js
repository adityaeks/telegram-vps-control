const { execCommand } = require("../utils/helper");

// Simpan session deploy per user (chatId -> folderPath)
const deploySession = {};

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

    // List folder di baseDir
    const output = await execCommand(`ls -d ${baseDir}/*/`);
    const folders = output
      .split("\n")
      .map(f => f.trim().replace(/\/$/, "")) // hapus trailing slash
      .filter(f => f.length > 0);

    if (folders.length === 0) {
      return bot.sendMessage(chatId, `❌ Tidak ada folder ditemukan di \`${baseDir}\`.`, {
        parse_mode: "Markdown",
      });
    }

    // Buat inline keyboard — tiap folder jadi satu tombol
    const keyboard = folders.map(folderPath => {
      const folderName = folderPath.split("/").pop(); // ambil nama folder saja
      return [
        {
          text: `📁 ${folderName}`,
          callback_data: `deploy:${folderPath}`,
        },
      ];
    });

    // Tambah tombol Cancel di bawah
    keyboard.push([{ text: "❌ Batal", callback_data: "deploy:cancel" }]);

    await bot.sendMessage(
      chatId,
      `🚀 *Deploy Project*\n\nPilih project yang ingin di-deploy dari \`${baseDir}\`:`,
      {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  } catch (error) {
    // Kalau ls gagal (misal di Windows lokal), fallback ke input manual
    await bot.sendMessage(
      chatId,
      `❌ Gagal list folder:\n\`${error.message}\`\n\nCoba gunakan:\n/deploy\\_path /var/www/html/nama-project`,
      { parse_mode: "Markdown" }
    );
  }
}

/**
 * Jalankan proses deploy ke folder yang dipilih
 */
async function runDeploy(bot, chatId, projectPath) {
  try {
    await bot.sendMessage(
      chatId,
      `🚀 *Memulai Deployment...*\n\nPath: \`${projectPath}\``,
      { parse_mode: "Markdown" }
    );

    // Step 1: Git Pull
    await bot.sendMessage(chatId, "📥 Step 1/3: Git Pull...");
    const gitOutput = await execCommand(`cd "${projectPath}" && git pull`);
    await bot.sendMessage(
      chatId,
      `✅ Git Pull selesai:\n\`\`\`\n${gitOutput.slice(0, 500)}\n\`\`\``,
      { parse_mode: "Markdown" }
    );

    // Step 2: Install dependencies (cek package.json dulu)
    await bot.sendMessage(chatId, "📦 Step 2/3: Install dependencies...");
    try {
      const hasPkg = await execCommand(`test -f "${projectPath}/package.json" && echo "yes"`);
      if (hasPkg.trim() === "yes") {
        const npmOutput = await execCommand(
          `cd "${projectPath}" && npm install --production 2>&1`
        );
        await bot.sendMessage(
          chatId,
          `✅ npm install selesai:\n\`\`\`\n${npmOutput.slice(0, 300)}\n\`\`\``,
          { parse_mode: "Markdown" }
        );
      } else {
        await bot.sendMessage(chatId, "⏭️ Skip: tidak ada package.json");
      }
    } catch {
      await bot.sendMessage(chatId, "⏭️ Skip install (tidak ada package.json atau bukan Node project)");
    }

    // Step 3: PM2 Restart
    await bot.sendMessage(chatId, "🔄 Step 3/3: Restart service...");
    let pm2Output;
    try {
      pm2Output = await execCommand(`cd "${projectPath}" && pm2 restart all 2>&1`);
    } catch {
      pm2Output = "PM2 tidak ditemukan, skip restart.";
    }

    await bot.sendMessage(
      chatId,
      `🎉 *Deployment Selesai!*\n\n\`\`\`\n${pm2Output.slice(0, 300)}\n\`\`\`\n\n_${new Date().toLocaleString("id-ID")}_`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ *Deployment Gagal!*\n\nPath: \`${projectPath}\`\nError: \`${error.message}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { deployCommand, runDeploy };
