import { Candle } from "./priceService";

export interface SwingPoint {
  index: number;
  price: number;
  type: "HH" | "HL" | "LH" | "LL";
}

export interface Zone {
  top: number;
  bottom: number;
  type: "supply" | "demand";
  strength: number;
  index: number;
}

export interface SMCResult {
  currentPrice: number;
  trend: "bullish" | "bearish" | "ranging";
  bos: { detected: boolean; direction: "bullish" | "bearish"; level: number } | null;
  choch: { detected: boolean; direction: "bullish" | "bearish"; level: number } | null;
  supplyZones: Zone[];
  demandZones: Zone[];
  swings: SwingPoint[];
  atr: number;
  lastHH: number;
  lastLL: number;
}

function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trs.push(tr);
  }
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function findSwingHighs(candles: Candle[], lookback = 3): number[] {
  const highs: number[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].high >= candles[i].high) { isHigh = false; break; }
    }
    if (isHigh) highs.push(i);
  }
  return highs;
}

function findSwingLows(candles: Candle[], lookback = 3): number[] {
  const lows: number[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].low <= candles[i].low) { isLow = false; break; }
    }
    if (isLow) lows.push(i);
  }
  return lows;
}

function classifySwings(candles: Candle[], highIdxs: number[], lowIdxs: number[]): SwingPoint[] {
  const swings: SwingPoint[] = [];
  let lastHH = -Infinity, lastHL = -Infinity, lastLH = Infinity, lastLL = Infinity;

  const allPoints = [
    ...highIdxs.map(i => ({ index: i, price: candles[i].high, isHigh: true })),
    ...lowIdxs.map(i => ({ index: i, price: candles[i].low, isHigh: false })),
  ].sort((a, b) => a.index - b.index);

  for (const pt of allPoints) {
    if (pt.isHigh) {
      if (pt.price > lastHH) {
        swings.push({ index: pt.index, price: pt.price, type: "HH" });
        lastHH = pt.price;
      } else if (pt.price < lastHH && pt.price > lastHL) {
        swings.push({ index: pt.index, price: pt.price, type: "LH" });
        lastLH = pt.price;
      }
    } else {
      if (pt.price < lastLL) {
        swings.push({ index: pt.index, price: pt.price, type: "LL" });
        lastLL = pt.price;
      } else if (pt.price > lastLL && pt.price < lastLH) {
        swings.push({ index: pt.index, price: pt.price, type: "HL" });
        lastHL = pt.price;
      }
    }
  }
  return swings.slice(-20);
}

function detectBOS(candles: Candle[], swings: SwingPoint[]): SMCResult["bos"] {
  const recentSwings = swings.slice(-6);
  const currentClose = candles[candles.length - 1].close;

  const lastHH = recentSwings.filter(s => s.type === "HH").pop();
  const lastLL = recentSwings.filter(s => s.type === "LL").pop();

  if (lastHH && currentClose > lastHH.price) {
    return { detected: true, direction: "bullish", level: lastHH.price };
  }
  if (lastLL && currentClose < lastLL.price) {
    return { detected: true, direction: "bearish", level: lastLL.price };
  }
  return null;
}

function detectCHoCH(candles: Candle[], swings: SwingPoint[]): SMCResult["choch"] {
  const recentSwings = swings.slice(-8);
  const currentClose = candles[candles.length - 1].close;

  const lastLH = recentSwings.filter(s => s.type === "LH").pop();
  const lastHL = recentSwings.filter(s => s.type === "HL").pop();

  if (lastLH && currentClose > lastLH.price) {
    return { detected: true, direction: "bullish", level: lastLH.price };
  }
  if (lastHL && currentClose < lastHL.price) {
    return { detected: true, direction: "bearish", level: lastHL.price };
  }
  return null;
}

function findZones(candles: Candle[], highIdxs: number[], lowIdxs: number[], atr: number): Zone[] {
  const zones: Zone[] = [];
  const currentPrice = candles[candles.length - 1].close;
  const range = atr * 15;

  for (const idx of highIdxs.slice(-10)) {
    const c = candles[idx];
    const top = c.high;
    const bottom = c.high - (c.high - c.low) * 0.4;
    if (top > currentPrice && top - currentPrice < range) {
      const strength = Math.min(5, Math.floor((top - bottom) / atr) + 1);
      zones.push({ top, bottom, type: "supply", strength, index: idx });
    }
  }

  for (const idx of lowIdxs.slice(-10)) {
    const c = candles[idx];
    const bottom = c.low;
    const top = c.low + (c.high - c.low) * 0.4;
    if (bottom < currentPrice && currentPrice - bottom < range) {
      const strength = Math.min(5, Math.floor((top - bottom) / atr) + 1);
      zones.push({ top, bottom, type: "demand", strength, index: idx });
    }
  }

  return zones.sort((a, b) => b.strength - a.strength).slice(0, 4);
}

function determineTrend(swings: SwingPoint[]): SMCResult["trend"] {
  const recent = swings.slice(-6);
  const hhs = recent.filter(s => s.type === "HH").length;
  const hls = recent.filter(s => s.type === "HL").length;
  const lls = recent.filter(s => s.type === "LL").length;
  const lhs = recent.filter(s => s.type === "LH").length;

  if (hhs >= 2 && hls >= 1) return "bullish";
  if (lls >= 2 && lhs >= 1) return "bearish";
  return "ranging";
}

export function analyzeSMC(candles: Candle[]): SMCResult {
  const currentPrice = candles[candles.length - 1].close;
  const atr = calcATR(candles, 14);
  const lookback = Math.max(2, Math.floor(candles.length / 20));

  const highIdxs = findSwingHighs(candles, lookback);
  const lowIdxs = findSwingLows(candles, lookback);
  const swings = classifySwings(candles, highIdxs, lowIdxs);

  const trend = determineTrend(swings);
  const bos = detectBOS(candles, swings);
  const choch = detectCHoCH(candles, swings);
  const supplyZones = findZones(candles, highIdxs, lowIdxs, atr).filter(z => z.type === "supply");
  const demandZones = findZones(candles, highIdxs, lowIdxs, atr).filter(z => z.type === "demand");

  const lastHH = swings.filter(s => s.type === "HH").pop()?.price ?? currentPrice;
  const lastLL = swings.filter(s => s.type === "LL").pop()?.price ?? currentPrice;

  return { currentPrice, trend, bos, choch, supplyZones, demandZones, swings, atr, lastHH, lastLL };
}
