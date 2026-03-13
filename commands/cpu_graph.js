const { getCpuHistory } = require("../services/cpu_collector");

/**
 * Buat ASCII bar chart dari history CPU
 * @param {Array<{time: Date, value: number}>} history
 * @returns {string}
 */
function buildAsciiGraph(history) {
  if (history.length === 0) return "(belum ada data — tunggu beberapa detik)";

  const HEIGHT = 8; // baris tinggi chart
  const BAR_CHAR = "█";
  const EMPTY_CHAR = "░";

  const values = history.map((h) => h.value);
  const max = Math.max(...values, 1);

  const lines = [];

  // Baris dari atas ke bawah
  for (let row = HEIGHT; row >= 1; row--) {
    const threshold = (row / HEIGHT) * max;
    let line = row === HEIGHT ? `${String(max.toFixed(0)).padStart(3)}% ` : "     ";
    if (row === Math.round(HEIGHT / 2)) {
      line = `${String(Math.round(max / 2)).padStart(3)}% `;
    }
    if (row === 1) line = ` 0%  `;

    for (let i = 0; i < values.length; i++) {
      line += values[i] >= threshold ? BAR_CHAR : EMPTY_CHAR;
    }
    lines.push(line);
  }

  // X axis label (waktu)
  const labelLine = "     " + history.map((h, i) => {
    if (i === 0 || i === history.length - 1) {
      return h.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return "";
  }).join("");

  // Simpler time label: start dan end
  const startTime = history[0].time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const endTime = history[history.length - 1].time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  lines.push(`     ${startTime.padEnd(Math.max(values.length - 5, 1))}${endTime}`);

  return lines.join("\n");
}

/**
 * Command /cpu_graph
 * Tampilkan grafik ASCII penggunaan CPU 10 menit terakhir
 */
async function cpuGraphCommand(bot, chatId) {
  const history = getCpuHistory();

  if (history.length < 2) {
    await bot.sendMessage(
      chatId,
      "⏳ *Data CPU belum cukup*\n\nBot baru mulai mengumpulkan data. Tunggu beberapa detik dan coba lagi.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const graph = buildAsciiGraph(history);
  const latest = history[history.length - 1].value;
  const avg = (history.reduce((s, h) => s + h.value, 0) / history.length).toFixed(1);
  const peak = Math.max(...history.map((h) => h.value)).toFixed(1);

  const message = `
📊 *CPU Usage — Last ~10 Minutes*

\`\`\`
${graph}
\`\`\`

📈 Summary
• Latest : \`${latest}%\`
• Average: \`${avg}%\`
• Peak   : \`${peak}%\`

_Samples: ${history.length} | Interval: 30s_
_${new Date().toLocaleString("id-ID")}_
  `.trim();

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

module.exports = { cpuGraphCommand };
