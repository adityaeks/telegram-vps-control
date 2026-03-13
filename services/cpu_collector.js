const { getCpuUsage } = require("../commands/cpu");

// Simpan history CPU selama 10 menit (1 sample per 30 detik = 20 samples)
const SAMPLE_INTERVAL_MS = 30 * 1000; // 30 detik
const MAX_SAMPLES = 20; // 10 menit

/** @type {Array<{ time: Date, value: number }>} */
const cpuHistory = [];

let collectorId = null;
let collectorActive = false;

/**
 * Mulai pengumpulan data CPU
 */
function startCpuCollector() {
  if (collectorActive) return;
  collectorActive = true;

  // Langsung ambil sample pertama
  collectSample();

  collectorId = setInterval(collectSample, SAMPLE_INTERVAL_MS);
  console.log("[CPU COLLECTOR] Dimulai.");
}

/**
 * Stop pengumpulan data CPU
 */
function stopCpuCollector() {
  if (collectorId) {
    clearInterval(collectorId);
    collectorId = null;
    collectorActive = false;
  }
}

async function collectSample() {
  try {
    const value = await getCpuUsage();
    cpuHistory.push({ time: new Date(), value });
    // Jaga agar tidak melebihi MAX_SAMPLES
    if (cpuHistory.length > MAX_SAMPLES) cpuHistory.shift();
  } catch {}
}

/**
 * Dapatkan history CPU saat ini
 */
function getCpuHistory() {
  return [...cpuHistory];
}

module.exports = { startCpuCollector, stopCpuCollector, getCpuHistory };
