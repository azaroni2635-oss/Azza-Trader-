import axios from "axios";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F";

export async function fetchCandles(interval: string, range: string): Promise<Candle[]> {
  const { data } = await axios.get(YAHOO_URL, {
    params: { interval, range, includePrePost: false },
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000,
  });

  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No data from Yahoo Finance");

  const timestamps: number[] = result.timestamp;
  const q = result.indicators.quote[0];
  const candles: Candle[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i], v = q.volume[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({ time: timestamps[i], open: o, high: h, low: l, close: c, volume: v ?? 0 });
  }

  return candles;
}

export function getCurrentPrice(candles: Candle[]): number {
  return candles[candles.length - 1]?.close ?? 0;
}
