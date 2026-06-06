import { getBot } from "./botInstance";
import { TradeSignal } from "./signalEngine";
import { SMCResult } from "./smcAnalysis";

const CHANNEL_CHAT_ID = process.env["TELEGRAM_CHAT_ID"] ?? "";

function emojiKeyakinan(label: TradeSignal["confidenceLabel"]): string {
  const map: Record<TradeSignal["confidenceLabel"], string> = {
    LOW: "🔴", MEDIUM: "🟡", HIGH: "🟢", "VERY HIGH": "⭐",
  };
  return map[label] ?? "⚪";
}

function emojiTren(trend: SMCResult["trend"]): string {
  if (trend === "bullish") return "📈";
  if (trend === "bearish") return "📉";
  return "↔️";
}

export function buildSignalMessage(smc: SMCResult, signal: TradeSignal, aiAnalysis: string): string {
  const now = new Date().toUTCString().replace("GMT", "UTC");
  const ek = emojiKeyakinan(signal.confidenceLabel);
  const et = emojiTren(smc.trend);
  const tren = smc.trend === "bullish" ? "Bullish" : smc.trend === "bearish" ? "Bearish" : "Sideways";

  if (signal.action === "NO TRADE") {
    return `🔍 <b>XAUUSD — HASIL SCAN AZZA TRADER</b>
📅 ${now}

💰 <b>Harga:</b> $${smc.currentPrice.toFixed(2)}
${et} <b>Tren:</b> ${tren.toUpperCase()}
${smc.bos ? `📌 <b>BOS:</b> ${smc.bos.direction === "bullish" ? "Bullish" : "Bearish"} @ ${smc.bos.level.toFixed(2)}` : "📌 <b>BOS:</b> Tidak ada"}
${smc.choch ? `🔄 <b>CHoCH:</b> ${smc.choch.direction === "bullish" ? "Bullish" : "Bearish"} @ ${smc.choch.level.toFixed(2)}` : "🔄 <b>CHoCH:</b> Tidak ada"}

🚫 <b>SINYAL: NO TRADE</b>

📊 <b>Level Kunci:</b>
${smc.supplyZones.slice(0, 2).map(z => `🔴 Supply: ${z.bottom.toFixed(2)} – ${z.top.toFixed(2)}`).join("\n") || "🔴 Supply: Tidak ada zona terdekat"}
${smc.demandZones.slice(0, 2).map(z => `🟢 Demand: ${z.bottom.toFixed(2)} – ${z.top.toFixed(2)}`).join("\n") || "🟢 Demand: Tidak ada zona terdekat"}

🤖 <b>Analisa AI:</b>
<i>${aiAnalysis}</i>

⚠️ <i>Belum ada konfluens BOS/CHoCH + Supply Demand yang valid. Tunggu setup yang tepat.</i>

👉 /tanya untuk tanya strategi | /belajar untuk edukasi`;
  }

  const dir = signal.action === "BUY" ? "🟢" : "🔴";
  const arah = signal.action === "BUY" ? "⬆️ BELI" : "⬇️ JUAL";

  return `${dir} <b>XAUUSD — SINYAL ${signal.action === "BUY" ? "BUY" : "SELL"} ${arah}</b>
📅 ${now}

💰 <b>Harga Saat Ini:</b> $${smc.currentPrice.toFixed(2)}
${et} <b>Tren:</b> ${tren.toUpperCase()}

📊 <b>SETUP TRADING:</b>
├ 🎯 Entry:  <b>${signal.entry.toFixed(2)}</b>
├ 🛑 SL:     <b>${signal.sl.toFixed(2)}</b> (risiko $4)
├ ✅ TP1:    <b>${signal.tp1.toFixed(2)}</b> (+$8)
└ 🏆 TP2:    <b>${signal.tp2.toFixed(2)}</b> (+$12)

📐 Risk:Reward = <b>1:${signal.rr.toFixed(1)}</b>
${ek} Keyakinan: <b>${signal.confidenceLabel}</b> (${signal.confidence}%)

🔑 <b>Alasan:</b>
${signal.reasons.map(r => `• ${r}`).join("\n")}

${smc.bos ? `📌 BOS: ${smc.bos.direction === "bullish" ? "Bullish" : "Bearish"} @ ${smc.bos.level.toFixed(2)}` : ""}
${smc.choch ? `🔄 CHoCH: ${smc.choch.direction === "bullish" ? "Bullish" : "Bearish"} @ ${smc.choch.level.toFixed(2)}` : ""}

🤖 <b>Analisa AI:</b>
<i>${aiAnalysis}</i>

⚠️ <i>SL tetap $4 | Selalu sesuaikan ukuran lot dengan manajemen risiko</i>
👉 /tanya untuk konsultasi | /belajar untuk edukasi`;
}

export async function sendToChannel(text: string): Promise<void> {
  if (!CHANNEL_CHAT_ID) throw new Error("TELEGRAM_CHAT_ID tidak di-set");
  await getBot().sendMessage(CHANNEL_CHAT_ID, text, { parse_mode: "HTML" });
}

export async function sendToChat(chatId: number | string, text: string): Promise<void> {
  await getBot().sendMessage(chatId, text, { parse_mode: "HTML" });
}
