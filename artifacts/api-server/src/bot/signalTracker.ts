import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { sendToChannel } from "./telegramService";

const BE_THRESHOLD = 3.0;
const DATA_FILE = path.join(process.cwd(), "data", "signals.json");

export type SignalStatus =
  | "OPEN"
  | "BE_SET"
  | "TP1_WIN"
  | "TP2_WIN"
  | "SL_LOSS"
  | "BE_WIN";

export interface TrackedSignal {
  id: string;
  action: "BUY" | "SELL";
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  bePrice: number;
  status: SignalStatus;
  sentAt: number;
  closedAt?: number;
  beNotified: boolean;
  closePips?: number;
}

export interface WinrateStats {
  total: number;
  open: number;
  tp1Win: number;
  tp2Win: number;
  beWin: number;
  slLoss: number;
  winrate: number;
  totalPips: number;
}

let signals: TrackedSignal[] = [];
let loaded = false;

function ensureDataDir(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadSignals(): void {
  if (loaded) return;
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      signals = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch {
    signals = [];
  }
  loaded = true;
}

function saveSignals(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(signals, null, 2));
  } catch (err) {
    logger.error({ err }, "Gagal menyimpan signal tracker");
  }
}

export function registerSignal(
  action: "BUY" | "SELL",
  entry: number,
  sl: number,
  tp1: number,
  tp2: number
): void {
  loadSignals();
  const bePrice =
    action === "BUY" ? entry + BE_THRESHOLD : entry - BE_THRESHOLD;

  const signal: TrackedSignal = {
    id: `${Date.now()}_${action}`,
    action,
    entry,
    sl,
    tp1,
    tp2,
    bePrice,
    status: "OPEN",
    sentAt: Date.now(),
    beNotified: false,
  };

  signals.push(signal);
  saveSignals();
  logger.info(
    { id: signal.id, action, entry, bePrice },
    "Signal terdaftar ke tracker"
  );
}

export async function checkActiveSignals(currentPrice: number): Promise<void> {
  loadSignals();

  const active = signals.filter(
    (s) => s.status === "OPEN" || s.status === "BE_SET"
  );
  if (active.length === 0) return;

  let changed = false;

  for (const sig of active) {
    const prev = sig.status;

    if (sig.action === "BUY") {
      if (sig.status === "OPEN" && currentPrice >= sig.bePrice) {
        sig.status = "BE_SET";
        sig.beNotified = false;
        changed = true;
        logger.info({ id: sig.id }, "BUY signal: BE tercapai");
        await notify(
          `✅ <b>BREAKEVEN SET — BUY XAUUSD</b>\n\n` +
            `💰 Harga: <b>${currentPrice.toFixed(2)}</b>\n` +
            `🎯 Entry asal: ${sig.entry.toFixed(2)}\n` +
            `📌 BE Price: ${sig.bePrice.toFixed(2)} (+$3 / 30 poin)\n\n` +
            `✂️ <b>Partial Close disarankan sekarang!</b>\n` +
            `SL dipindah ke entry (${sig.entry.toFixed(2)}) → posisi aman.\n\n` +
            `⭐ Trade ini dihitung <b>WIN</b> meski market berbalik arah.`
        );
        sig.beNotified = true;
      }

      if (currentPrice >= sig.tp1 && sig.status !== "TP1_WIN" && sig.status !== "TP2_WIN") {
        const pips = +(currentPrice - sig.entry).toFixed(2);
        sig.status = currentPrice >= sig.tp2 ? "TP2_WIN" : "TP1_WIN";
        sig.closedAt = Date.now();
        sig.closePips = pips;
        changed = true;
        const label = sig.status === "TP2_WIN" ? "TP2 🏆" : "TP1 ✅";
        logger.info({ id: sig.id, status: sig.status }, "BUY signal WIN");
        await notify(
          `🏆 <b>${label} TERCAPAI — BUY XAUUSD</b>\n\n` +
            `💰 Harga: <b>${currentPrice.toFixed(2)}</b>\n` +
            `🎯 Entry: ${sig.entry.toFixed(2)} → Target: ${sig.status === "TP2_WIN" ? sig.tp2.toFixed(2) : sig.tp1.toFixed(2)}\n` +
            `📈 Profit: <b>+$${pips.toFixed(2)}</b>\n\n` +
            `🎉 Selamat! Trade berhasil!`
        );
      } else if (
        currentPrice <= sig.sl &&
        sig.status === "OPEN"
      ) {
        sig.status = "SL_LOSS";
        sig.closedAt = Date.now();
        sig.closePips = +(sig.sl - sig.entry).toFixed(2);
        changed = true;
        logger.info({ id: sig.id }, "BUY signal: SL hit → LOSS");
        await notify(
          `❌ <b>STOP LOSS HIT — BUY XAUUSD</b>\n\n` +
            `💰 Harga: <b>${currentPrice.toFixed(2)}</b>\n` +
            `🛑 SL tercapai: ${sig.sl.toFixed(2)}\n` +
            `📉 Loss: <b>-$4</b>\n\n` +
            `💪 Tetap disiplin! Satu loss tidak menentukan segalanya.\n` +
            `📊 Cek /winrate untuk statistik keseluruhan.`
        );
      } else if (
        currentPrice <= sig.entry &&
        sig.status === "BE_SET"
      ) {
        sig.status = "BE_WIN";
        sig.closedAt = Date.now();
        sig.closePips = BE_THRESHOLD;
        changed = true;
        logger.info({ id: sig.id }, "BUY signal: Kembali ke entry setelah BE → BE WIN");
        await notify(
          `🛡️ <b>BREAKEVEN WIN — BUY XAUUSD</b>\n\n` +
            `💰 Harga kembali ke: <b>${currentPrice.toFixed(2)}</b>\n` +
            `📌 BE sudah di-set sebelumnya @ ${sig.bePrice.toFixed(2)}\n` +
            `✅ Hasil: <b>WIN +$3 (30 poin)</b> dari partial close\n\n` +
            `⭐ Risk-free trade berhasil dijaga!`
        );
      }
    } else {
      if (sig.status === "OPEN" && currentPrice <= sig.bePrice) {
        sig.status = "BE_SET";
        sig.beNotified = false;
        changed = true;
        logger.info({ id: sig.id }, "SELL signal: BE tercapai");
        await notify(
          `✅ <b>BREAKEVEN SET — SELL XAUUSD</b>\n\n` +
            `💰 Harga: <b>${currentPrice.toFixed(2)}</b>\n` +
            `🎯 Entry asal: ${sig.entry.toFixed(2)}\n` +
            `📌 BE Price: ${sig.bePrice.toFixed(2)} (-$3 / 30 poin)\n\n` +
            `✂️ <b>Partial Close disarankan sekarang!</b>\n` +
            `SL dipindah ke entry (${sig.entry.toFixed(2)}) → posisi aman.\n\n` +
            `⭐ Trade ini dihitung <b>WIN</b> meski market berbalik arah.`
        );
        sig.beNotified = true;
      }

      if (currentPrice <= sig.tp1 && sig.status !== "TP1_WIN" && sig.status !== "TP2_WIN") {
        const pips = +(sig.entry - currentPrice).toFixed(2);
        sig.status = currentPrice <= sig.tp2 ? "TP2_WIN" : "TP1_WIN";
        sig.closedAt = Date.now();
        sig.closePips = pips;
        changed = true;
        const label = sig.status === "TP2_WIN" ? "TP2 🏆" : "TP1 ✅";
        logger.info({ id: sig.id, status: sig.status }, "SELL signal WIN");
        await notify(
          `🏆 <b>${label} TERCAPAI — SELL XAUUSD</b>\n\n` +
            `💰 Harga: <b>${currentPrice.toFixed(2)}</b>\n` +
            `🎯 Entry: ${sig.entry.toFixed(2)} → Target: ${sig.status === "TP2_WIN" ? sig.tp2.toFixed(2) : sig.tp1.toFixed(2)}\n` +
            `📈 Profit: <b>+$${pips.toFixed(2)}</b>\n\n` +
            `🎉 Selamat! Trade berhasil!`
        );
      } else if (
        currentPrice >= sig.sl &&
        sig.status === "OPEN"
      ) {
        sig.status = "SL_LOSS";
        sig.closedAt = Date.now();
        sig.closePips = +(sig.entry - sig.sl).toFixed(2);
        changed = true;
        logger.info({ id: sig.id }, "SELL signal: SL hit → LOSS");
        await notify(
          `❌ <b>STOP LOSS HIT — SELL XAUUSD</b>\n\n` +
            `💰 Harga: <b>${currentPrice.toFixed(2)}</b>\n` +
            `🛑 SL tercapai: ${sig.sl.toFixed(2)}\n` +
            `📉 Loss: <b>-$4</b>\n\n` +
            `💪 Tetap disiplin! Satu loss tidak menentukan segalanya.`
        );
      } else if (
        currentPrice >= sig.entry &&
        sig.status === "BE_SET"
      ) {
        sig.status = "BE_WIN";
        sig.closedAt = Date.now();
        sig.closePips = BE_THRESHOLD;
        changed = true;
        logger.info({ id: sig.id }, "SELL signal: Kembali ke entry setelah BE → BE WIN");
        await notify(
          `🛡️ <b>BREAKEVEN WIN — SELL XAUUSD</b>\n\n` +
            `💰 Harga kembali ke: <b>${currentPrice.toFixed(2)}</b>\n` +
            `📌 BE sudah di-set sebelumnya @ ${sig.bePrice.toFixed(2)}\n` +
            `✅ Hasil: <b>WIN +$3 (30 poin)</b> dari partial close\n\n` +
            `⭐ Risk-free trade berhasil dijaga!`
        );
      }
    }
  }

  if (changed) saveSignals();
}

async function notify(text: string): Promise<void> {
  try {
    await sendToChannel(text);
  } catch (err) {
    logger.error({ err }, "Gagal kirim notifikasi winrate");
  }
}

export function getStats(): WinrateStats {
  loadSignals();
  const closed = signals.filter((s) =>
    ["TP1_WIN", "TP2_WIN", "SL_LOSS", "BE_WIN"].includes(s.status)
  );

  const tp1Win = signals.filter((s) => s.status === "TP1_WIN").length;
  const tp2Win = signals.filter((s) => s.status === "TP2_WIN").length;
  const beWin = signals.filter((s) => s.status === "BE_WIN").length;
  const slLoss = signals.filter((s) => s.status === "SL_LOSS").length;
  const open = signals.filter(
    (s) => s.status === "OPEN" || s.status === "BE_SET"
  ).length;

  const totalWins = tp1Win + tp2Win + beWin;
  const winrate =
    closed.length > 0
      ? Math.round((totalWins / closed.length) * 100)
      : 0;

  const totalPips = signals
    .filter((s) => s.closePips !== undefined)
    .reduce((acc, s) => {
      if (s.status === "SL_LOSS") return acc - 4;
      return acc + (s.closePips ?? 0);
    }, 0);

  return {
    total: signals.length,
    open,
    tp1Win,
    tp2Win,
    beWin,
    slLoss,
    winrate,
    totalPips: +totalPips.toFixed(2),
  };
}

export function getRecentSignals(limit = 10): TrackedSignal[] {
  loadSignals();
  return [...signals].sort((a, b) => b.sentAt - a.sentAt).slice(0, limit);
}

export function buildWinrateMessage(): string {
  const s = getStats();
  const recent = getRecentSignals(5);

  const statusEmoji: Record<SignalStatus, string> = {
    OPEN: "🔵",
    BE_SET: "🟡",
    TP1_WIN: "🟢",
    TP2_WIN: "⭐",
    SL_LOSS: "🔴",
    BE_WIN: "🛡️",
  };

  const statusLabel: Record<SignalStatus, string> = {
    OPEN: "Terbuka",
    BE_SET: "BE Set ✅",
    TP1_WIN: "TP1 Profit",
    TP2_WIN: "TP2 Profit",
    SL_LOSS: "SL Loss",
    BE_WIN: "BE Win (30p)",
  };

  let msg =
    `📊 <b>STATISTIK WINRATE — AZZA TRADER</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📈 <b>Total Signal:</b> ${s.total}\n` +
    `🔵 <b>Masih Open:</b> ${s.open}\n\n` +
    `✅ <b>TP1 Win:</b> ${s.tp1Win} trade\n` +
    `🏆 <b>TP2 Win:</b> ${s.tp2Win} trade\n` +
    `🛡️ <b>BE Win (30 poin):</b> ${s.beWin} trade\n` +
    `❌ <b>SL Loss:</b> ${s.slLoss} trade\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎯 <b>WINRATE: ${s.winrate}%</b>\n` +
    `💰 <b>Net P/L: ${s.totalPips >= 0 ? "+" : ""}$${s.totalPips}</b>\n\n`;

  if (recent.length > 0) {
    msg += `📋 <b>5 Signal Terakhir:</b>\n`;
    for (const r of recent) {
      const date = new Date(r.sentAt).toLocaleDateString("id-ID");
      msg += `${statusEmoji[r.status]} ${r.action} ${r.entry.toFixed(2)} — ${statusLabel[r.status]} (${date})\n`;
    }
  } else {
    msg += `📋 <i>Belum ada riwayat signal.</i>\n`;
  }

  msg +=
    `\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `ℹ️ <i>BE Win = SL hit setelah partial close & set BE +30 poin</i>`;

  return msg;
}
