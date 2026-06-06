import { logger } from "../lib/logger";
import { askOpenRouter } from "./openRouterService";

export const userStates = new Map<number, "idle" | "waiting_question">();

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["bos", "break of structure", "break struktur"],
    answer: `<b>Break of Structure (BOS)</b> adalah ketika harga menembus swing high atau swing low sebelumnya, mengkonfirmasi kelanjutan tren.

• <b>Bullish BOS</b>: Harga break di atas Higher High → tren naik berlanjut
• <b>Bearish BOS</b>: Harga break di bawah Lower Low → tren turun berlanjut

BOS digunakan untuk <b>konfirmasi arah tren</b>, lalu cari entry di pullback berikutnya ke zona demand/supply.`,
  },
  {
    keywords: ["choch", "change of character", "perubahan karakter"],
    answer: `<b>Change of Character (CHoCH)</b> adalah sinyal awal pembalikan tren.

• Dalam tren naik: harga break di bawah Higher Low terakhir → tren mungkin berbalik turun
• Dalam tren turun: harga break di atas Lower High terakhir → tren mungkin berbalik naik

CHoCH berbeda dari BOS — CHoCH adalah <b>peringatan dini</b>, bukan konfirmasi penuh. Tunggu BOS di arah baru untuk entry lebih aman.`,
  },
  {
    keywords: ["supply", "zona supply", "supply zone"],
    answer: `<b>Supply Zone</b> adalah area di mana institusi (bank/hedge fund) memiliki order jual besar.

Cara identifikasi:
• Cari area di mana harga bergerak turun tajam (impulse bearish)
• Area keberangkatan tersebut = supply zone
• Ketika harga kembali ke zona ini → kemungkinan turun lagi

Entry ideal: Tunggu candle konfirmasi (pinbar bearish/engulfing) di dalam zona.`,
  },
  {
    keywords: ["demand", "zona demand", "demand zone"],
    answer: `<b>Demand Zone</b> adalah area di mana institusi memiliki order beli besar.

Cara identifikasi:
• Cari area di mana harga bergerak naik tajam (impulse bullish)
• Area keberangkatan tersebut = demand zone
• Ketika harga kembali ke zona ini → kemungkinan naik lagi

Entry ideal: Tunggu candle konfirmasi (pinbar bullish/engulfing) di dalam zona.`,
  },
  {
    keywords: ["sl", "stop loss", "stoploss"],
    answer: `<b>Stop Loss (SL)</b> adalah batas kerugian maksimal yang kamu terima per trade.

Di AZZA TRADER, SL ditetapkan <b>$4 per trade</b> (fixed).

Fungsi SL:
• Melindungi akun dari kerugian besar
• Memberikan ukuran lot yang jelas
• Menjaga disiplin trading

<b>Jangan pernah memindahkan SL menjauhi entry</b> saat trade sedang loss — ini kebiasaan buruk yang menghancurkan akun.`,
  },
  {
    keywords: ["tp", "take profit", "target profit"],
    answer: `<b>Take Profit (TP)</b> adalah target keuntungan yang ingin dicapai.

AZZA TRADER menggunakan 2 level TP:
• <b>TP1 = $8</b> (RR 1:2) — ambil 50-70% posisi di sini
• <b>TP2 = $12</b> (RR 1:3) — biarkan sisa posisi berjalan

Strategi profesional: Close sebagian di TP1, geser SL ke breakeven, biarkan sisanya menuju TP2.`,
  },
  {
    keywords: ["rr", "risk reward", "risk:reward", "risk/reward"],
    answer: `<b>Risk:Reward (RR)</b> adalah perbandingan antara risiko dan potensi keuntungan.

Contoh RR 1:2 = Risiko $4, Potensi untung $8.

Mengapa RR penting?
• RR 1:1 → butuh winrate 51% untuk profit
• RR 1:2 → butuh winrate 34% untuk profit ✅
• RR 1:3 → butuh winrate 25% untuk profit ✅

Selalu gunakan minimal RR 1:2. Dengan RR bagus, kamu bisa profit meski lebih sering loss.`,
  },
  {
    keywords: ["lot", "ukuran lot", "position size", "sizing"],
    answer: `<b>Position Sizing</b> adalah menghitung ukuran lot yang tepat berdasarkan risiko.

Rumus:
<code>Lot = (Modal × Risk%) ÷ (SL pip × nilai pip)</code>

Contoh: Modal $500, risk 1%, SL 40 pip, nilai pip $1 (mini lot)
Lot = ($500 × 0.01) ÷ (40 × $1) = $5 ÷ $40 = 0.125 lot

Aturan: <b>Jangan pernah risk lebih dari 2% per trade</b> dari total modal.`,
  },
  {
    keywords: ["fomo", "ketinggalan", "terlambat masuk"],
    answer: `<b>FOMO (Fear of Missing Out)</b> adalah ketakutan ketinggalan momen trading.

Gejala FOMO:
• Masuk trade setelah harga sudah jauh bergerak
• Ikut sinyal orang lain tanpa analisa sendiri
• Tergesa-gesa tanpa menunggu setup yang valid

Cara mengatasi:
✅ "Selalu ada trade berikutnya" — market buka 5 hari seminggu
✅ Hanya masuk saat setup sesuai kriteria
✅ Jika ketinggalan 1 setup, tunggu setup berikutnya`,
  },
  {
    keywords: ["gold", "emas", "xauusd", "harga gold", "harga emas"],
    answer: `<b>XAUUSD — Emas vs Dolar AS</b>

Faktor yang mempengaruhi harga Gold:
• 📊 <b>Data ekonomi AS</b>: NFP, CPI, GDP — data bagus → Dollar kuat → Gold turun
• 🏦 <b>Suku bunga The Fed</b>: Naik suku bunga → Gold biasanya turun
• 🌍 <b>Geopolitik</b>: Perang, krisis → Gold naik (safe haven)
• 💵 <b>Kekuatan Dolar</b>: DXY naik → Gold cenderung turun

Waktu terbaik trading Gold:
• Sesi London + New York (14:00 - 23:00 WIB)`,
  },
  {
    keywords: ["scalping", "scalp"],
    answer: `<b>Scalping XAUUSD</b> — Trading cepat dalam hitungan menit.

Karakteristik:
• Timeframe: M1, M5, M15
• Target: $2-5 per trade
• SL: $2-3 per trade
• Bisa 10-20 trade per hari

Kelebihan: Potensi profit harian tinggi
Kekurangan: Butuh fokus penuh, spread lebih berpengaruh

Di AZZA TRADER, kami fokus pada <b>swing trading M15-H1</b> dengan SL $4 karena lebih santai dan RR lebih baik.`,
  },
  {
    keywords: ["swing", "swing trade", "swing trading"],
    answer: `<b>Swing Trading XAUUSD</b> — Menangkap pergerakan harga beberapa jam hingga beberapa hari.

Karakteristik:
• Timeframe: H1, H4
• Target: $20-50 per trade
• SL: $10-20 per trade
• 3-10 trade per minggu

Kelebihan: Tidak perlu monitor terus, RR lebih besar, cocok untuk trader yang bekerja
Kekurangan: Butuh modal lebih besar, overnight risk (swap)`,
  },
  {
    keywords: ["be", "breakeven", "break even"],
    answer: `<b>Breakeven (BE)</b> adalah memindahkan Stop Loss ke titik entry agar posisi tidak rugi.

Di AZZA TRADER, BE otomatis disarankan saat harga sudah bergerak <b>+$3 / 30 poin</b> dari entry.

Cara kerja:
1. Entry BUY di $2000
2. Harga naik ke $2003 (+30 poin)
3. → Geser SL dari $1996 ke $2000 (entry)
4. Partial close 50% posisi untuk lock profit $3
5. Sisa posisi berjalan risk-free menuju TP

✅ Artinya: bahkan jika market berbalik, kamu tetap profit dari partial close!`,
  },
  {
    keywords: ["nfp", "non farm payroll", "non-farm"],
    answer: `<b>NFP (Non-Farm Payroll)</b> adalah data ketenagakerjaan AS yang rilis setiap Jumat pertama tiap bulan.

Dampak ke Gold:
• NFP > ekspektasi → Dollar menguat → Gold biasanya TURUN
• NFP < ekspektasi → Dollar melemah → Gold biasanya NAIK

⚠️ <b>WASPADA:</b> NFP bisa menggerakkan Gold 20-50 poin dalam hitungan menit!

Strategi saat NFP:
• Hindari buka posisi baru 30 menit sebelum dan sesudah rilis
• Tunggu volatilitas mereda dulu baru analisa ulang
• Gunakan /news untuk info kalender ekonomi`,
  },
  {
    keywords: ["smc", "smart money", "smart money concept"],
    answer: `<b>Smart Money Concepts (SMC)</b> adalah pendekatan trading yang mengikuti jejak institusi besar (bank, hedge fund).

Komponen utama SMC:
• 📊 <b>BOS</b> — Break of Structure (konfirmasi tren)
• 🔄 <b>CHoCH</b> — Change of Character (pembalikan tren)
• 🔴 <b>Supply Zone</b> — Area jual institusi
• 🟢 <b>Demand Zone</b> — Area beli institusi
• 📦 <b>Order Block</b> — Candle asal pergerakan kuat
• 🌊 <b>Liquidity</b> — Target yang diincar smart money

Filosofi SMC: Institusi besar menggerakkan harga untuk "berburu" stop loss retail, lalu bergerak ke arah sebenarnya. Dengan SMC, kamu bisa ikut arah mereka!`,
  },
];

function buildRuleBasedAnswer(question: string): string {
  const q = question.toLowerCase();

  for (const faq of FAQ) {
    if (faq.keywords.some((kw) => q.includes(kw))) {
      return faq.answer;
    }
  }

  return (
    `🤔 Pertanyaan bagus! Untuk menjawab "<i>${question}</i>", beberapa hal penting yang perlu dipertimbangkan:\n\n` +
    `• Cek kondisi tren di H4 — bullish, bearish, atau ranging?\n` +
    `• Apakah ada BOS atau CHoCH yang baru terbentuk?\n` +
    `• Di mana zona Supply/Demand terdekat?\n` +
    `• Berapa risiko yang bisa kamu terima?\n\n` +
    `💡 Ketik /analisa untuk lihat kondisi XAUUSD saat ini\n` +
    `📚 Ketik /belajar untuk materi SMC lengkap\n` +
    `📰 Ketik /news untuk berita Gold terkini`
  );
}

const SYSTEM_PROMPT = `Kamu adalah AZZA TRADER, asisten trading profesional spesialis XAUUSD (Gold) menggunakan Smart Money Concepts (SMC).

Keahlianmu:
- BOS (Break of Structure) dan CHoCH (Change of Character)
- Supply & Demand Zone, Order Block
- Risk Management: SL $4 fixed, BE otomatis di +30 poin, TP1 $8 (RR 1:2), TP2 $12 (RR 1:3)
- Analisa tren dan psikologi trading

Aturan menjawab:
- SELALU gunakan Bahasa Indonesia yang jelas dan mudah dipahami
- Jawaban praktis dan langsung ke inti, maksimal 200 kata
- Gunakan format yang rapi dengan bullet point jika perlu
- Jika pertanyaan di luar trading/forex/gold, arahkan kembali ke topik trading
- Jangan gunakan markdown (**bold**), tapi boleh pakai <b>bold</b> HTML untuk Telegram`;

export async function answerQuestion(question: string): Promise<string> {
  const q = question.toLowerCase();
  for (const faq of FAQ) {
    if (faq.keywords.some((kw) => q.includes(kw))) {
      logger.info("Q&A dari FAQ lokal");
      return faq.answer;
    }
  }

  logger.info("Q&A diteruskan ke OpenRouter AI");
  const aiAnswer = await askOpenRouter(SYSTEM_PROMPT, question, 400);
  if (aiAnswer) {
    return aiAnswer;
  }

  logger.info("OpenRouter tidak tersedia, menggunakan rule-based");
  return buildRuleBasedAnswer(question);
}
