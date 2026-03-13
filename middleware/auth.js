const config = require("../config");

/**
 * Middleware: cek apakah user diizinkan
 * Returns true jika user ada di allowedUsers list
 */
function isAllowed(userId) {
  // Jika allowedUsers kosong, bot terbuka untuk semua (mode dev)
  if (!config.allowedUsers || config.allowedUsers.length === 0) {
    console.warn("[AUTH] ⚠️  allowedUsers kosong! Bot terbuka untuk semua user.");
    return true;
  }
  return config.allowedUsers.includes(userId);
}

/**
 * Kirim pesan "Access Denied" ke user yang tidak diizinkan
 */
function denyAccess(bot, chatId) {
  return bot.sendMessage(
    chatId,
    "🚫 *Access Denied*\n\nKamu tidak memiliki izin untuk menggunakan bot ini.",
    { parse_mode: "Markdown" }
  );
}

module.exports = { isAllowed, denyAccess };
