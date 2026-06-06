import { SMCResult, Zone } from "./smcAnalysis";

export interface TradeSignal {
  action: "BUY" | "SELL" | "NO TRADE";
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  rr: number;
  confidence: number;
  confidenceLabel: "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";
  reasons: string[];
  zone: Zone | null;
}

const FIXED_SL_DOLLARS = 4;

export function generateSignal(smc: SMCResult): TradeSignal {
  const { currentPrice, trend, bos, choch, supplyZones, demandZones, atr } = smc;
  const reasons: string[] = [];
  let score = 0;

  const nearestDemand = demandZones.sort((a, b) =>
    Math.abs(currentPrice - a.top) - Math.abs(currentPrice - b.top)
  )[0];

  const nearestSupply = supplyZones.sort((a, b) =>
    Math.abs(currentPrice - a.bottom) - Math.abs(currentPrice - b.bottom)
  )[0];

  const priceTolerance = atr * 0.5;

  let signal: "BUY" | "SELL" | "NO TRADE" = "NO TRADE";
  let zone: Zone | null = null;

  const atDemand = nearestDemand &&
    currentPrice >= nearestDemand.bottom - priceTolerance &&
    currentPrice <= nearestDemand.top + priceTolerance;

  const atSupply = nearestSupply &&
    currentPrice >= nearestSupply.bottom - priceTolerance &&
    currentPrice <= nearestSupply.top + priceTolerance;

  if (atDemand) {
    score += nearestDemand.strength;
    reasons.push(`Price at Demand Zone [${nearestDemand.bottom.toFixed(2)}-${nearestDemand.top.toFixed(2)}] (strength: ${nearestDemand.strength}/5)`);
    zone = nearestDemand;

    if (trend === "bullish") { score += 2; reasons.push("HTF Trend: Bullish ✅"); }
    if (bos?.direction === "bullish") { score += 3; reasons.push(`BOS Bullish confirmed @ ${bos.level.toFixed(2)}`); }
    if (choch?.direction === "bullish") { score += 2; reasons.push(`CHoCH Bullish @ ${choch.level.toFixed(2)}`); }

    if (score >= 4) signal = "BUY";
  }

  if (atSupply && signal === "NO TRADE") {
    score = nearestSupply.strength;
    reasons.push(`Price at Supply Zone [${nearestSupply.bottom.toFixed(2)}-${nearestSupply.top.toFixed(2)}] (strength: ${nearestSupply.strength}/5)`);
    zone = nearestSupply;

    if (trend === "bearish") { score += 2; reasons.push("HTF Trend: Bearish ✅"); }
    if (bos?.direction === "bearish") { score += 3; reasons.push(`BOS Bearish confirmed @ ${bos.level.toFixed(2)}`); }
    if (choch?.direction === "bearish") { score += 2; reasons.push(`CHoCH Bearish @ ${choch.level.toFixed(2)}`); }

    if (score >= 4) signal = "SELL";
  }

  if (signal === "NO TRADE") {
    return {
      action: "NO TRADE",
      entry: currentPrice,
      sl: 0,
      tp1: 0,
      tp2: 0,
      rr: 0,
      confidence: score,
      confidenceLabel: "LOW",
      reasons,
      zone: null,
    };
  }

  const slDistance = FIXED_SL_DOLLARS;
  const tpDistance1 = slDistance * 2;
  const tpDistance2 = slDistance * 3;

  let entry = currentPrice;
  let sl: number, tp1: number, tp2: number;

  if (signal === "BUY") {
    sl = entry - slDistance;
    tp1 = entry + tpDistance1;
    tp2 = entry + tpDistance2;
  } else {
    sl = entry + slDistance;
    tp1 = entry - tpDistance1;
    tp2 = entry - tpDistance2;
  }

  const rr = tpDistance1 / slDistance;

  const maxScore = 10;
  const confidencePct = Math.min(100, Math.round((score / maxScore) * 100));
  let confidenceLabel: TradeSignal["confidenceLabel"] = "LOW";
  if (confidencePct >= 80) confidenceLabel = "VERY HIGH";
  else if (confidencePct >= 60) confidenceLabel = "HIGH";
  else if (confidencePct >= 40) confidenceLabel = "MEDIUM";

  return { action: signal, entry, sl, tp1, tp2, rr, confidence: confidencePct, confidenceLabel, reasons, zone };
}
