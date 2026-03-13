# 🚀 Telegram VPS Control Bot

Bot Telegram untuk **mengontrol dan memonitor VPS langsung dari Telegram** tanpa perlu login SSH setiap saat.

Dengan bot ini kamu bisa:

* Mengecek **CPU**
* Mengecek **RAM**
* Mengecek **Disk**
* Mengecek **Uptime server**
* Restart service seperti **nginx**
* Monitoring server dari **HP**

---

# 📌 Konsep Sistem

Alur kerja bot:

```
Telegram User
     │
     ▼
Telegram Bot API
     │
     ▼
Bot Program (Node.js di VPS)
     │
     ▼
Execute Linux Command
     │
     ▼
Result → Kirim ke Telegram
```

Bot akan menerima command dari Telegram, menjalankan command Linux di VPS, lalu mengirim hasilnya kembali.

---

# 🧰 Tech Stack

* Node.js
* node-telegram-bot-api
* Linux shell command
* PM2 (process manager)

---

# 📂 Struktur Project

```
vps-telegram-bot
│
├── bot.js
├── config.js
├── commands
│   ├── cpu.js
│   ├── ram.js
│   ├── disk.js
│   ├── uptime.js
│   └── restart.js
│
├── package.json
└── README.md
```

Penjelasan:

| File         | Fungsi              |
| ------------ | ------------------- |
| bot.js       | File utama bot      |
| config.js    | Menyimpan token bot |
| commands     | Folder command bot  |
| package.json | dependency project  |

---

# ⚙️ Setup Project

## 1. Clone Repository

```
git clone https://github.com/username/vps-telegram-bot.git
cd vps-telegram-bot
```

---

## 2. Install Dependencies

```
npm install
```

Library utama:

```
node-telegram-bot-api
```

---

## 3. Buat Bot Telegram

Buka Telegram lalu cari **BotFather**

Command:

```
/start
/newbot
```

Ikuti langkahnya lalu kamu akan mendapat **BOT TOKEN**

Contoh:

```
123456789:ABCDEFxxxxxxxxxxxx
```

---

## 4. Config Bot

Edit file:

```
config.js
```

Isi dengan:

```
module.exports = {
  token: "BOT_TOKEN_KAMU",
  allowedUser: 123456789
}
```

`allowedUser` digunakan agar hanya kamu yang bisa memakai bot.

---

# ▶️ Menjalankan Bot

Jalankan bot dengan:

```
node bot.js
```

Jika berhasil akan muncul:

```
Bot is running...
```

---

# 🔄 Menjalankan Bot 24 Jam

Install PM2:

```
npm install pm2 -g
```

Start bot:

```
pm2 start bot.js
```

Auto start saat VPS reboot:

```
pm2 startup
pm2 save
```

---

# 🤖 Command Bot

Daftar command yang tersedia:

| Command        | Fungsi                 |
| -------------- | ---------------------- |
| /start         | Mengaktifkan bot       |
| /cpu           | Melihat penggunaan CPU |
| /ram           | Melihat penggunaan RAM |
| /disk          | Melihat storage VPS    |
| /uptime        | Melihat uptime server  |
| /restart_nginx | Restart nginx          |

---

# 📊 Contoh Output

### Command

```
/ram
```

Output:

```
RAM STATUS

Total: 2GB
Used: 1GB
Free: 1GB
```

---

### Command

```
/uptime
```

Output:

```
Server Uptime

6 days 18 hours
Load Average: 0.09
```

---

# 🔐 Security

Bot menggunakan **user whitelist** agar tidak semua orang bisa menjalankan command server.

```
if (msg.from.id !== allowedUser) {
   return bot.sendMessage(chatId,"Access Denied");
}
```

Ini sangat penting karena bot menjalankan **command langsung di server**.

---

# 📈 Pengembangan Selanjutnya

Fitur yang bisa ditambahkan:

### 1. Monitoring Alert

Bot mengirim pesan jika:

* CPU > 80%
* RAM hampir habis
* Disk penuh

Contoh:

```
⚠️ VPS ALERT
CPU: 92%
RAM: 88%
```

---

### 2. Docker Control

Command tambahan:

```
/docker_ps
/docker_restart container
```

---

### 3. Deploy Website

Bot dapat menjalankan deployment:

```
/deploy
```

Script yang dijalankan:

```
git pull
npm install
pm2 restart app
```

---

### 4. Log Monitoring

Command:

```
/logs nginx
```

Bot akan mengirim log server.

---

# 💡 Use Case

Bot ini berguna untuk:

* Monitoring VPS dari HP
* Restart service cepat
* Debug server tanpa login SSH
* Automation deployment

---

# 🧑‍💻 Author

Project ini dibuat untuk kebutuhan **VPS automation dan monitoring**.

Feel free untuk mengembangkan project ini lebih lanjut.

---

# ⭐ Future Vision

Project ini bisa dikembangkan menjadi:

* VPS control panel
* DevOps automation bot
* Server monitoring system
* SaaS monitoring service
