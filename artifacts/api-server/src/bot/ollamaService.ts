import axios from "axios";
import { SMCResult } from "./smcAnalysis";
import { TradeSignal } from "./signalEngine";
import { buildFallbackAnalysis } from "./fallbackAnalysis";
import { logger } from "../lib/logger";

const OLLAMA_URL = process.env["OLLAMA_URL"] ?? "";
const MODEL = "gemma3:4b";
const TIMEOUT = 30000;

function buildPrompt(smc: SMCResult, signal: TradeSignal): string {
  const { currentPrice, trend, bos, choch, supplyZones, demandZones, atr, lastHH, lastLL } = smc;

  return `Kamu adalah analis trading XAUUSD profesional dari AZZA TRADER, menggunakan konsep Smart Money Concepts (SMC).

Data market saat ini:
- Harga: $${currentPrice.toFixed(2)}
- ATR(14): ${atr.toFixed(2)}
- Tren HTF: ${trend === "bullish" ? "Bullish" : trend === "bearish" ? "Bearish" : "Ranging/Sideways"}
- HH Terakhir: ${lastHH.toFixed(2)} | LL Terakhir: ${lastLL.toFixed(2)}
- BOS: ${bos ? `${bos.direction === "bullish" ? "Bullish" : "Bearish"} @ ${bos.level.toFixed(2)}` : "Tidak ada"}
- CHoCH: ${choch ? `${choch.direction === "bullish" ? "Bullish" : "Bearish"} @ ${choch.level.toFixed(2)}` : "Tidak ada"}
- Zona Supply: ${supplyZones.map(z => `[${z.bottom.toFixed(2)}-${z.top.toFixed(2)}]`).join(", ") || "Tidak ada di sekitar harga"}
- Zona Demand: ${demandZones.map(z => `[${z.bottom.toFixed(2)}-${z.top.toFixed(2)}]`).join(", ") || "Tidak ada di sekitar harga"}
- Sinyal: ${signal.action}
${signal.action !== "NO TRADE" ? `- Entry: ${signal.entry.toFixed(2)} | SL: ${signal.sl.toFixed(2)} | TP1: ${signal.tp1.toFixed(2)} | TP2: ${signal.tp2.toFixed(2)} | Keyakinan: ${signal.confidenceLabel} (${signal.confidence}%)` : ""}

Tulis analisa market dalam Bahasa Indonesia, 3-4 kalimat. Jelaskan: konteks harga saat ini, level kunci yang perlu diperhatikan, dan bias market. ${signal.action !== "NO TRADE" ? `Validasi secara singkat setup ${signal.action} yang ditemukan.` : "Jelaskan mengapa tidak ada setup trading yang valid."} Langsung, profesional, tanpa bullet point. Maksimal 100 kata.`;
}

async function tryOllama(smc: SMCResult, signal: TradeSignal): Promise<string | null> {
  if (!OLLAMA_URL) return null;

  try {
    const { data } = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: MODEL,
        prompt: buildPrompt(smc, signal),
        stream: false,
        options: { temperature: 0.3, num_predict: 150, num_ctx: 1024 },
      },
      { timeout: TIMEOUT }
    );
    const text = (data?.response ?? "").trim();
    if (!text) return null;
    logger.info("Analisa AI dari Ollama");
    return text;
  } catch (err: any) {
    logger.warn({ code: err?.code ?? "unknown" }, "Ollama tidak tersedia, beralih ke analisa bawaan");
    return null;
  }
}

export async function getAIAnalysis(smc: SMCResult, signal: TradeSignal): Promise<string> {
  const ollamaResult = await tryOllama(smc, signal);
  if (ollamaResult) return ollamaResult;

  logger.info("Menggunakan analisa rule-based berbahasa Indonesia");
  return buildFallbackAnalysis(smc, signal);
}
