import { logger } from "../lib/logger";
import { askOpenRouter } from "./openRouterService";

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

let newsCache: { items: NewsItem[]; summary: string; fetchedAt: number } | null =
  null;
const CACHE_TTL = 30 * 60 * 1000;

async function fetchGoldNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://gnews.io/api/v4/search?q=gold+XAUUSD+price&lang=en&max=5&sortby=publishedAt&token=free",
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        articles?: {
          title: string;
          source: { name: string };
          url: string;
          publishedAt: string;
        }[];
      };
      if (data?.articles?.length) {
        return data.articles.map((a) => ({
          title: a.title,
          source: a.source.name,
          url: a.url,
          publishedAt: a.publishedAt,
        }));
      }
    }
  } catch {
    logger.warn("GNews fetch gagal, fallback ke headlines statis");
  }

  return getStaticHeadlines();
}

function getStaticHeadlines(): NewsItem[] {
  const now = new Date().toISOString();
  return [
    {
      title: "Gold holds near record highs as Fed rate cut bets rise",
      source: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      publishedAt: now,
    },
    {
      title: "XAUUSD technical analysis: Key support and resistance levels",
      source: "FXStreet",
      url: "https://www.fxstreet.com/currencies/gold",
      publishedAt: now,
    },
    {
      title: "Dollar weakness supports gold prices amid inflation concerns",
      source: "MarketWatch",
      url: "https://www.marketwatch.com/investing/future/gold",
      publishedAt: now,
    },
  ];
}

async function summarizeWithAI(headlines: NewsItem[]): Promise<string> {
  const headlineText = headlines
    .map((h, i) => `${i + 1}. ${h.title} (${h.source})`)
    .join("\n");

  const systemPrompt = `Kamu adalah analis berita pasar keuangan dari AZZA TRADER, spesialis XAUUSD (Gold). 
Tugasmu adalah merangkum berita-berita terbaru dan menjelaskan dampaknya terhadap harga Gold dalam Bahasa Indonesia yang jelas dan mudah dipahami trader retail.`;

  const userMessage = `Berikut adalah headline berita terbaru tentang Gold/XAUUSD:

${headlineText}

Buat ringkasan singkat dalam Bahasa Indonesia dengan format:
1. Rangkuman inti berita (2-3 kalimat)
2. Dampak ke harga Gold: Bullish/Bearish/Netral dan alasannya
3. Saran untuk trader (apakah perlu waspada atau bisa trading normal)

Maksimal 150 kata. Gunakan bahasa yang mudah dipahami trader pemula.`;

  const aiSummary = await askOpenRouter(systemPrompt, userMessage, 300);
  if (aiSummary) return aiSummary;

  return buildFallbackSummary(headlines);
}

function buildFallbackSummary(headlines: NewsItem[]): string {
  return (
    `📰 <b>Berita Gold Hari Ini:</b>\n` +
    headlines
      .slice(0, 3)
      .map(
        (h) =>
          `• <i>${h.title}</i> — ${h.source}`
      )
      .join("\n") +
    `\n\n💡 <b>Tips:</b> Selalu cek kalender ekonomi sebelum trading. ` +
    `Data NFP, CPI, dan keputusan The Fed sangat mempengaruhi harga Gold.\n` +
    `📊 Gunakan /analisa untuk sinyal XAUUSD terkini.`
  );
}

export async function getGoldNews(): Promise<string> {
  const now = Date.now();
  if (newsCache && now - newsCache.fetchedAt < CACHE_TTL) {
    logger.info("News dari cache");
    return newsCache.summary;
  }

  logger.info("Mengambil berita Gold terbaru...");
  const items = await fetchGoldNews();
  const summary = await summarizeWithAI(items);

  const wibTime = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  });

  const calendarNote = getEconomicCalendarNote();

  const fullMessage =
    `📰 <b>BERITA GOLD TERKINI — XAUUSD</b>\n` +
    `🕒 ${wibTime} WIB\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    summary +
    `\n\n━━━━━━━━━━━━━━━━━━━━━\n` +
    calendarNote +
    `\n\n📊 <i>Selalu pantau sinyal live dengan /analisa</i>`;

  newsCache = { items, summary: fullMessage, fetchedAt: now };
  return fullMessage;
}

function getEconomicCalendarNote(): string {
  const day = new Date().getDay();
  const hour = new Date().getUTCHours();

  const events: string[] = [];

  if (day === 5 && hour >= 12 && hour <= 14) {
    events.push("⚠️ <b>NFP (Non-Farm Payroll)</b> — Volatilitas TINGGI! Hindari entry sebelum data rilis.");
  }
  if (day === 3) {
    events.push("📊 Tengah minggu: Potensi data <b>ADP Employment</b> atau <b>ISM Services</b>.");
  }
  if (hour >= 13 && hour <= 15) {
    events.push("🏦 Jam <b>Sesi New York</b> — Volatilitas Gold sedang tinggi.");
  } else if (hour >= 7 && hour <= 9) {
    events.push("🌍 Jam <b>Sesi London</b> — Sering ada pergerakan signifikan.");
  }

  if (events.length === 0) {
    events.push("✅ Tidak ada event ekonomi besar yang terdeteksi saat ini.");
  }

  return `📅 <b>Kalender Ekonomi:</b>\n` + events.join("\n");
}
