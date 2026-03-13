module.exports = {
  // Isi dengan Bot Token dari BotFather
  token: process.env.BOT_TOKEN || "8675027051:AAHm0lM5m8mm7LBHiPwoF6H_W5bOlxWbo-Q",

  // Isi dengan Telegram User ID kamu (untuk whitelist)
  // Cara cek: kirim pesan ke @userinfobot di Telegram
  allowedUsers: [1090421300],

  // Threshold alert otomatis
  alertThreshold: {
    cpu: 80,   // Kirim alert jika CPU > 80%
    ram: 85,   // Kirim alert jika RAM > 85%
    disk: 90,  // Kirim alert jika Disk > 90%
  },

  // Interval monitoring alert (dalam milidetik)
  // Default: 5 menit = 5 * 60 * 1000
  monitorInterval: 5 * 60 * 1000,
};
