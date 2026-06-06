import { SMCResult } from "./smcAnalysis";
import { TradeSignal } from "./signalEngine";

function konteksHarga(smc: SMCResult): string {
  const { currentPrice, lastHH, lastLL, atr } = smc;
  const distFromHH = ((lastHH - currentPrice) / lastHH * 100).toFixed(1);
  const distFromLL = ((currentPrice - lastLL) / currentPrice * 100).toFixed(1);
  return `XAUUSD saat ini diperdagangkan di $${currentPrice.toFixed(2)}, berada ${distFromHH}% di bawah High tertinggi (${lastHH.toFixed(2)}) dan ${distFromLL}% di atas Low terendah (${lastLL.toFixed(2)}). ATR sebesar ${atr.toFixed(2)} menunjukkan volatilitas intraday yang ${atr > 10 ? "tinggi" : "sedang"}.`;
}

function konteksStruktur(smc: SMCResult): string {
  const { trend, bos, choch } = smc;
  const parts: string[] = [];

  if (trend === "bullish") parts.push("Struktur market saat ini bullish dengan rangkaian Higher High dan Higher Low yang terbentuk.");
  else if (trend === "bearish") parts.push("Struktur market saat ini bearish dengan pola Lower High dan Lower Low berurutan.");
  else parts.push("Harga bergerak sideways tanpa arah yang jelas — waspadai setup palsu.");

  if (bos) parts.push(`Konfirmasi Break of Structure (BOS) ${bos.direction === "bullish" ? "bullish" : "bearish"} telah terbentuk di level ${bos.level.toFixed(2)}, memperkuat bias saat ini.`);
  if (choch) parts.push(`Change of Character (CHoCH) ${choch.direction === "bullish" ? "bullish" : "bearish"} terdeteksi di ${choch.level.toFixed(2)}, mengindikasikan potensi pergeseran momentum.`);

  return parts.join(" ");
}

function konteksZona(smc: SMCResult): string {
  const { supplyZones, demandZones } = smc;
  const parts: string[] = [];

  if (supplyZones.length > 0) {
    const z = supplyZones[0];
    parts.push(`Zona supply terdekat berada di ${z.bottom.toFixed(2)}–${z.top.toFixed(2)}`);
  }
  if (demandZones.length > 0) {
    const z = demandZones[0];
    parts.push(`zona demand kunci di ${z.bottom.toFixed(2)}–${z.top.toFixed(2)}`);
  }

  if (parts.length === 0) return "Tidak ada zona supply atau demand signifikan dalam jangkauan harga saat ini — tunggu harga bergerak ke level kunci.";
  return parts.join(" dan ") + ". Kedua area ini merupakan zona reaksi utama yang perlu dipantau.";
}

function konteksSignal(signal: TradeSignal): string {
  if (signal.action === "NO TRADE") {
    return "Tidak ada setup trading yang valid saat ini. Harga belum berada di zona premium dengan konfluens BOS/CHoCH yang memadai. Diperlukan kesabaran — tunggu harga mencapai level kunci sebelum mengambil posisi.";
  }

  const arah = signal.action === "BUY" ? "beli (long)" : "jual (short)";
  const level = signal.confidenceLabel === "VERY HIGH" ? "sangat tinggi" : signal.confidenceLabel === "HIGH" ? "tinggi" : signal.confidenceLabel === "MEDIUM" ? "sedang" : "rendah";
  return `Setup ${arah} dengan tingkat keyakinan ${level} teridentifikasi. Entry di ${signal.entry.toFixed(2)}, stop-loss di ${signal.sl.toFixed(2)} (risiko $4), dengan target TP1 ${signal.tp1.toFixed(2)} dan TP2 ${signal.tp2.toFixed(2)}. Risk-to-reward ${signal.rr.toFixed(1)}:1. Sesuaikan ukuran posisi dengan manajemen risiko.`;
}

export function buildFallbackAnalysis(smc: SMCResult, signal: TradeSignal): string {
  return [
    konteksHarga(smc),
    konteksStruktur(smc),
    konteksZona(smc),
    konteksSignal(signal),
  ].filter(Boolean).join(" ");
}
