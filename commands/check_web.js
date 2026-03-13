const http = require("http");
const https = require("https");

/**
 * Cek status website: HTTP status code + response time
 * @param {string} domain - domain atau URL (contoh: example.com atau https://example.com)
 * @returns {{ status: number, time: number, ok: boolean }}
 */
function checkWebsite(domain) {
  return new Promise((resolve) => {
    const url =
      domain.startsWith("http://") || domain.startsWith("https://")
        ? domain
        : `https://${domain}`;

    const lib = url.startsWith("https") ? https : http;
    const start = Date.now();

    const req = lib.get(url, { timeout: 10000 }, (res) => {
      const time = Date.now() - start;
      resolve({ status: res.statusCode, time, ok: res.statusCode < 400 });
      res.resume(); // consume response
    });

    req.on("error", () => {
      resolve({ status: 0, time: Date.now() - start, ok: false });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, time: 10000, ok: false });
    });
  });
}

/**
 * Command /check_web <domain>
 * Cek status HTTP website
 */
async function checkWebCommand(bot, chatId, domain) {
  if (!domain) {
    await bot.sendMessage(
      chatId,
      `❓ *Penggunaan:*\n\`/check_web example.com\`\n\nContoh:\n/check_web google.com\n/check_web https://myapp.io`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  await bot.sendMessage(chatId, `⏳ Mengecek *${domain}*...`, {
    parse_mode: "Markdown",
  });

  const result = await checkWebsite(domain);

  let statusEmoji = "✅";
  let statusLabel = "OK";
  if (!result.ok) {
    statusEmoji = result.status === 0 ? "🚨" : "⚠️";
    statusLabel = result.status === 0 ? "UNREACHABLE" : "ERROR";
  }

  const message = `
🌐 *WEBSITE STATUS*

Domain   : \`${domain}\`
Status   : \`${result.status || "N/A"} ${statusLabel}\` ${statusEmoji}
Response : \`${result.time}ms\`

_${new Date().toLocaleString("id-ID")}_
  `.trim();

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

module.exports = { checkWebCommand, checkWebsite };
