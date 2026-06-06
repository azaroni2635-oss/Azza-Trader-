import cron from "node-cron";
import { fetchCandles } from "./priceService";
import { analyzeSMC } from "./smcAnalysis";
import { generateSignal } from "./signalEngine";
import { getAIAnalysis } from "./ollamaService";
import { buildSignalMessage, sendToChannel, sendToChat } from "./telegramService";
import { registerSignal, checkActiveSignals } from "./signalTracker";
import { checkAndNotifyAlerts } from "./alertService";
import { logger } from "../lib/logger";

let isRunning = false;
let lastSignalAction = "NO TRADE";
let lastSignalTime = 0;

export async function runScan(
  targetChatId?: number | string
): Promise<{ sent: boolean; signal: string; price: number }> {
  if (isRunning && !targetChatId) {
    logger.info("Scan sedang berjalan, lewati");
    return { sent: false, signal: "BUSY", price: 0 };
  }

  isRunning = true;

  try {
    logger.info("Memulai scan XAUUSD...");
    const candles = await fetchCandles("15m", "5d");
    if (candles.length < 30) throw new Error("Data candle tidak mencukupi");

    const smc = analyzeSMC(candles);
    logger.info({ price: smc.currentPrice, trend: smc.trend }, "Analisa SMC selesai");

    if (!targetChatId) {
      await checkActiveSignals(smc.currentPrice);
      await checkAndNotifyAlerts(smc.currentPrice);
    }

    const signal = generateSignal(smc);
    logger.info({ action: signal.action, confidence: signal.confidence }, "Sinyal dihasilkan");

    const now = Date.now();
    const cooldownMs = 60 * 60 * 1000;
    const isSameSignal =
      signal.action === lastSignalAction && signal.action !== "NO TRADE";
    const inCooldown = now - lastSignalTime < cooldownMs && isSameSignal;

    const aiAnalysis = await getAIAnalysis(smc, signal);
    const message = buildSignalMessage(smc, signal, aiAnalysis);

    if (targetChatId) {
      await sendToChat(targetChatId, message);
      return { sent: true, signal: signal.action, price: smc.currentPrice };
    }

    const shouldSend = !inCooldown || signal.action === "NO TRADE";
    if (shouldSend) {
      await sendToChannel(message);
      if (signal.action !== "NO TRADE") {
        registerSignal(
          signal.action,
          signal.entry,
          signal.sl,
          signal.tp1,
          signal.tp2
        );
        lastSignalAction = signal.action;
        lastSignalTime = now;
      }
      logger.info({ action: signal.action }, "Pesan Telegram terkirim");
    } else {
      logger.info({ action: signal.action }, "Sinyal sama dalam cooldown, tidak dikirim");
    }

    return { sent: shouldSend, signal: signal.action, price: smc.currentPrice };
  } catch (err) {
    logger.error({ err }, "Error saat scan");
    throw err;
  } finally {
    isRunning = false;
    if (global.gc) global.gc();
  }
}

export function startScheduler(): void {
  logger.info("Scheduler XAUUSD dimulai (setiap 15 menit)");
  runScan().catch((err) => logger.error({ err }, "Scan awal gagal"));
  cron.schedule("*/15 * * * *", async () => {
    try {
      await runScan();
    } catch (err) {
      logger.error({ err }, "Scan terjadwal gagal");
    }
  });
}
