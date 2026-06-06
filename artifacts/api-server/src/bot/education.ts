export interface Chapter {
  id: string;
  title: string;
  emoji: string;
  content: string;
}

export const chapters: Chapter[] = [
  {
    id: "edu_1",
    emoji: "📖",
    title: "Bab 1: Dasar Trading Forex & Gold",
    content: `📖 <b>BAB 1 — DASAR TRADING FOREX &amp; GOLD</b>

<b>🔷 Apa itu XAUUSD?</b>
XAUUSD adalah pasangan harga Emas (XAU) terhadap Dolar AS (USD). Artinya, kamu memperdagangkan berapa nilai 1 troy ounce emas dalam USD. Ini adalah instrumen paling populer di pasar komoditas global.

<b>🔷 Cara Kerja Market</b>
Pasar forex buka 24 jam, 5 hari seminggu (Senin–Jumat). Harga bergerak karena penawaran dan permintaan. Faktor yang mempengaruhi harga Gold:
• Data ekonomi AS (NFP, CPI, GDP)
• Keputusan suku bunga The Fed
• Geopolitik dan krisis global
• Sentimen risk-on vs risk-off

<b>🔷 Istilah Penting</b>
• <b>Pip</b>: Unit terkecil pergerakan harga. 1 pip XAUUSD = $0.01
• <b>Lot</b>: Ukuran transaksi. 1 lot = 100.000 unit / $100 per pip
• <b>Mini lot</b>: 0.1 lot = $10 per pip
• <b>Mikro lot</b>: 0.01 lot = $1 per pip
• <b>Spread</b>: Selisih bid dan ask, ini adalah biaya trading

<b>🔷 Waktu Terbaik Trading Gold</b>
• <b>Sesi London (14:00–23:00 WIB)</b>: Volatilitas tinggi
• <b>Sesi NY (20:00–05:00 WIB)</b>: Volume terbesar, banyak berita
• <b>Overlap London-NY (20:00–23:00 WIB)</b>: Momen paling aktif

💡 <i>Tips: Hindari trading saat market sepi (sesi Asia) karena spread melebar dan sinyal palsu lebih banyak.</i>`,
  },
  {
    id: "edu_2",
    emoji: "📊",
    title: "Bab 2: Candlestick & Price Action",
    content: `📊 <b>BAB 2 — CANDLESTICK &amp; PRICE ACTION</b>

<b>🔷 Anatomi Candlestick</b>
Setiap candle menunjukkan 4 data dalam 1 periode:
• <b>Open</b>: Harga pembukaan
• <b>High</b>: Harga tertinggi
• <b>Low</b>: Harga terendah
• <b>Close</b>: Harga penutupan
• <b>Body</b>: Selisih open-close (hijau = bullish, merah = bearish)
• <b>Wick/Shadow</b>: Garis di atas/bawah body

<b>🔷 Pola Bullish (Sinyal Naik)</b>
• <b>Hammer</b>: Body kecil di atas, wick panjang ke bawah. Rejection dari bawah.
• <b>Bullish Engulfing</b>: Candle hijau besar menelan candle merah sebelumnya.
• <b>Morning Star</b>: 3 candle — turun, kecil (ragu), lalu naik kuat.
• <b>Pinbar Bullish</b>: Wick bawah panjang, body kecil di atas.

<b>🔷 Pola Bearish (Sinyal Turun)</b>
• <b>Shooting Star</b>: Body kecil di bawah, wick panjang ke atas. Rejection dari atas.
• <b>Bearish Engulfing</b>: Candle merah besar menelan candle hijau.
• <b>Evening Star</b>: 3 candle — naik, kecil, lalu turun kuat.
• <b>Pinbar Bearish</b>: Wick atas panjang, body kecil di bawah.

<b>🔷 Cara Membaca Price Action</b>
Jangan lihat candle satu per satu. Lihat konteks:
1. Di mana harga berada? (zona supply atau demand?)
2. Apa yang dilakukan harga di situ? (rejection atau breakout?)
3. Konfirmasi dengan candle berikutnya

💡 <i>Tips: Candle terbesar seringkali adalah "candle institusional" — digerakkan oleh big player. Ikuti arahnya.</i>`,
  },
  {
    id: "edu_3",
    emoji: "🎯",
    title: "Bab 3: Support & Resistance",
    content: `🎯 <b>BAB 3 — SUPPORT &amp; RESISTANCE</b>

<b>🔷 Definisi</b>
• <b>Support</b>: Level harga di mana permintaan cukup kuat untuk menghentikan penurunan. Harga "dipantulkan" ke atas dari sini.
• <b>Resistance</b>: Level di mana tekanan jual kuat menghentikan kenaikan. Harga "ditolak" dari atas.

<b>🔷 Cara Menggambar S&amp;R yang Benar</b>
1. Gunakan timeframe tinggi (H4, Daily) untuk menemukan level utama
2. Cari harga di mana candle berulang kali berbalik arah
3. Gambar sebagai <b>zona</b>, bukan garis tipis (±$2-5 toleransi)
4. Semakin sering diuji, semakin kuat levelnya

<b>🔷 Jenis-jenis S&amp;R</b>
• <b>Historical S&amp;R</b>: Level dari swing high/low masa lalu
• <b>Psychological Level</b>: Angka bulat seperti 2300, 2350, 2400
• <b>Dynamic S&amp;R</b>: Moving average (MA50, MA200) sebagai S&amp;R bergerak
• <b>Trendline</b>: Garis miring yang menghubungkan swing points

<b>🔷 Break &amp; Retest</b>
Ketika harga menembus resistance:
1. Resistance lama berubah menjadi support baru
2. Harga seringkali <b>retesting</b> zona tersebut
3. Entry terbaik ada di retest, bukan di breakout awal
4. Konfirmasi: tunggu candle close di atas/bawah level

<b>🔷 Kesalahan Umum</b>
❌ Menggambar terlalu banyak level → pilih yang paling jelas
❌ Gambar garis, bukan zona → selalu pakai zona
❌ Terlalu kaku → price tidak selalu "hormat" level dengan tepat

💡 <i>Tips: Kombinasikan S&amp;R dengan Supply &amp; Demand untuk konfluens yang lebih kuat.</i>`,
  },
  {
    id: "edu_4",
    emoji: "💡",
    title: "Bab 4: Smart Money Concepts (SMC)",
    content: `💡 <b>BAB 4 — SMART MONEY CONCEPTS (SMC)</b>

<b>🔷 Apa itu Smart Money?</b>
Smart Money = uang besar yang digerakkan oleh institusi: bank sentral, hedge fund, market maker. Mereka menggerakkan 80% volume pasar. Retail trader (kita) hanya 20%.

<b>🔷 Cara Berpikir Smart Money</b>
Institusi tidak bisa langsung beli/jual besar di satu harga karena akan menggerakkan market sendiri. Mereka butuh:
1. <b>Akumulasi</b>: Kumpulkan posisi secara diam-diam
2. <b>Manipulasi</b>: Pancing retail ke arah yang salah (stop hunt)
3. <b>Distribusi</b>: Jual posisi ke retail yang FOMO

<b>🔷 Konsep Likuiditas</b>
• Setiap kumpulan stop loss = kumpulan likuiditas bagi institusi
• <b>Buy-side liquidity</b>: Stop loss dari short trader, ada di ATAS swing high
• <b>Sell-side liquidity</b>: Stop loss dari long trader, ada di BAWAH swing low
• Institusi "sweep" likuiditas sebelum bergerak ke arah sebenarnya

<b>🔷 Tanda-tanda Smart Money</b>
• Stop hunt tiba-tiba lalu reversal tajam
• Candle dengan wick panjang (liquidity sweep)
• Harga diam lama (akumulasi) lalu bergerak cepat
• Breakout palsu yang langsung berbalik

<b>🔷 Cara Mengikuti Smart Money</b>
1. Identifikasi di mana likuiditas berada
2. Tunggu price sweep likuiditas tersebut
3. Konfirmasi dengan CHoCH atau BOS
4. Entry setelah konfirmasi, bukan saat sweep

💡 <i>Tips: Jangan takut ketika stop kamu kena — mungkin itu justru tanda smart money sedang bergerak ke arah yang menguntungkan kalau kamu sabar.</i>`,
  },
  {
    id: "edu_5",
    emoji: "🔄",
    title: "Bab 5: BOS & CHoCH",
    content: `🔄 <b>BAB 5 — BREAK OF STRUCTURE (BOS) &amp; CHANGE OF CHARACTER (CHoCH)</b>

<b>🔷 Break of Structure (BOS)</b>
BOS terjadi ketika harga menebus swing high atau swing low sebelumnya, melanjutkan tren yang sudah ada.

<b>Bullish BOS</b>: Harga break di atas Higher High sebelumnya → tren naik berlanjut
<b>Bearish BOS</b>: Harga break di bawah Lower Low sebelumnya → tren turun berlanjut

BOS mengkonfirmasi bahwa <b>momentum tren masih kuat</b>. Gunakan untuk entry searah tren di pullback berikutnya.

<b>🔷 Change of Character (CHoCH)</b>
CHoCH adalah <b>sinyal awal pembalikan tren</b>. Terjadi ketika:
• Dalam tren naik: harga break di bawah swing low terakhir (HL)
• Dalam tren turun: harga break di atas swing high terakhir (LH)

CHoCH = institusi mulai mengubah arah. Ini adalah konfirmasi PERTAMA, belum tentu langsung reversal besar.

<b>🔷 BOS vs CHoCH — Perbedaan Kunci</b>
| | BOS | CHoCH |
|---|---|---|
| Artinya | Tren berlanjut | Tren mungkin berbalik |
| Level yang ditembus | Swing high/low ekstrem | Swing terakhir |
| Kekuatan sinyal | Konfirmasi kuat | Sinyal awal, perlu konfluens |

<b>🔷 Cara Menggunakan dalam Trading</b>
1. Identifikasi tren di H4
2. Di M15, tunggu BOS → masuk searah tren dari demand/supply
3. Jika ada CHoCH di H4 → hati-hati, kurangi posisi atau tunggu
4. CHoCH + supply/demand + candle konfirmasi = setup reversal premium

💡 <i>Tips: CHoCH adalah "peringatan dini". Jangan langsung counter-trend. Tunggu BOS di arah baru untuk konfirmasi lebih kuat.</i>`,
  },
  {
    id: "edu_6",
    emoji: "🏛️",
    title: "Bab 6: Supply & Demand Zone",
    content: `🏛️ <b>BAB 6 — SUPPLY &amp; DEMAND ZONE</b>

<b>🔷 Perbedaan Supply/Demand vs Support/Resistance</b>
• S&amp;R = level di mana harga pernah berbalik (historis)
• Supply/Demand = zona di mana institusi menempatkan order besar

Supply/Demand lebih presisi karena berbasis pada <b>alasan</b> harga bergerak, bukan sekadar pola historis.

<b>🔷 Supply Zone (Zona Jual)</b>
Zona di mana institusi punya order jual besar. Terbentuk ketika:
• Harga bergerak turun tajam dari sebuah area (impulse)
• Area keberangkatan = supply zone
• Ketika harga kembali ke area ini → kemungkinan besar turun lagi

Tanda supply zone yang baik:
✅ Candle bearish kuat keluar dari zona
✅ Belum pernah diuji kembali (fresh zone)
✅ Ada pada tren bearish atau di bawah resistance utama

<b>🔷 Demand Zone (Zona Beli)</b>
Zona di mana institusi punya order beli besar. Terbentuk ketika:
• Harga bergerak naik tajam dari sebuah area (impulse)
• Area keberangkatan = demand zone
• Ketika harga kembali ke area ini → kemungkinan besar naik lagi

Tanda demand zone yang baik:
✅ Candle bullish kuat keluar dari zona
✅ Fresh (belum disentuh lagi)
✅ Ada pada tren bullish atau di atas support utama

<b>🔷 Entry dari Zone</b>
1. Identifikasi zone di H4/H1
2. Tunggu harga masuk ke dalam zone di M15
3. Cari candle konfirmasi (pinbar, engulfing)
4. Set SL di luar zone, TP di level berikutnya
5. <b>Jangan masuk sebelum ada konfirmasi!</b>

💡 <i>Tips: Zone yang pernah diuji dan masih bertahan = lebih kuat. Fresh zone = berpotensi reaksi lebih tajam tapi belum terbukti.</i>`,
  },
  {
    id: "edu_7",
    emoji: "💰",
    title: "Bab 7: Risk Management",
    content: `💰 <b>BAB 7 — RISK MANAGEMENT</b>

<b>🔷 Mengapa Risk Management #1?</b>
Trader dengan winrate 40% bisa tetap profit jika RR-nya 1:3.
Trader dengan winrate 80% bisa bangkrut jika RR-nya 1:0.5.
<b>Risk management menentukan umur akun kamu.</b>

<b>🔷 Aturan AZZA TRADER</b>
• SL = <b>$4 per trade</b> (fixed)
• TP1 = <b>$8</b> (RR 1:2 minimum)
• TP2 = <b>$12</b> (RR 1:3)
• Maksimal risk per hari: 3 trade × $4 = $12

<b>🔷 Position Sizing</b>
Contoh: Modal $1000, risk per trade 1% = $10
Jika SL = 40 pip: Lot = $10 ÷ 40 = 0.025 lot

Rumus:
<code>Lot = (Modal × Risk%) ÷ (SL dalam pip × nilai pip)</code>

<b>🔷 Risk:Reward (RR)</b>
• RR 1:1 → butuh winrate 51% untuk profit
• RR 1:2 → butuh winrate 34% untuk profit
• RR 1:3 → butuh winrate 25% untuk profit

Kesimpulan: Makin tinggi RR, makin rendah winrate yang dibutuhkan!

<b>🔷 Drawdown Management</b>
• Drawdown 10%: Kurangi lot 25%
• Drawdown 20%: Stop trading, evaluasi strategi
• Drawdown 30%: Istirahat minimal 1 minggu
• <b>Jangan pernah revenge trading!</b>

<b>🔷 Aturan Harian</b>
✅ Maksimal 3 trade per hari
✅ Stop jika sudah 2 loss berturut-turut
✅ Jangan tambah posisi yang sudah loss (averaging)
✅ Catat semua trade di jurnal

💡 <i>Tips: Seorang trader profesional lebih fokus pada "berapa yang hilang jika salah" daripada "berapa yang didapat jika benar".</i>`,
  },
  {
    id: "edu_8",
    emoji: "🧠",
    title: "Bab 8: Psikologi Trading",
    content: `🧠 <b>BAB 8 — PSIKOLOGI TRADING</b>

<b>🔷 Musuh Terbesar Trader</b>
Bukan market yang susah. Bukan strategi yang kurang. Musuh terbesar adalah <b>diri sendiri</b>. Lebih tepatnya: emosi.

<b>🔷 Fear (Ketakutan)</b>
Gejala:
• Ragu masuk padahal setup sudah valid
• Close trade terlalu cepat (takut profit hilang)
• Tidak mau trading setelah serangkaian loss

Solusi: <b>Percayai sistem</b>. Jika sudah backtest dan hasilnya positif, eksekusi tanpa ragu. Trading bukan tentang 1 trade, tapi ribuan trade ke depan.

<b>🔷 Greed (Keserakahan)</b>
Gejala:
• Tambah lot padahal belum waktunya
• Tidak mau close TP, nunggu lebih tinggi, akhirnya loss
• Overtrading (masuk di setiap setup meski tidak jelas)

Solusi: <b>Tetapkan target harian</b>. Jika sudah tercapai, stop trading. Greed membunuh akun lebih cepat dari strategi apapun.

<b>🔷 FOMO (Fear of Missing Out)</b>
Gejala:
• Masuk trade setelah harga sudah bergerak jauh
• Ikut-ikutan sinyal orang lain tanpa analisa sendiri
• Buka trade saat tidak ada setup yang valid

Solusi: <b>"Selalu ada trade berikutnya."</b> Market akan selalu ada besok. Jangan kejar harga yang sudah pergi.

<b>🔷 Revenge Trading</b>
Setelah loss, langsung buka trade besar untuk "mengembalikan" kerugian → biasanya loss lagi lebih besar.

Solusi: <b>Berhenti setelah 2 loss berturut-turut.</b> Ambil istirahat minimal 2 jam.

<b>🔷 Trading Journal</b>
Catat setiap trade:
• Tanggal, pair, arah
• Alasan entry
• Hasil (profit/loss)
• Emosi saat itu
• Pelajaran yang diambil

Review setiap minggu. Pola kesalahan akan terlihat jelas.

💡 <i>"Cara tercepat menjadi trader profesional adalah belajar dari kesalahan dengan cepat. Cara tercepat bangkrut adalah mengulangi kesalahan yang sama."</i>`,
  },
  {
    id: "edu_9",
    emoji: "🏆",
    title: "Bab 9: Strategi Profesional",
    content: `🏆 <b>BAB 9 — STRATEGI PROFESIONAL</b>

<b>🔷 Multi-Timeframe Analysis (MTF)</b>
Gunakan 3 timeframe secara berurutan:

1. <b>H4 (Macro)</b>: Tentukan tren utama, identifikasi supply/demand besar
2. <b>H1 (Meso)</b>: Konfirmasi struktur, cari BOS/CHoCH
3. <b>M15 (Mikro)</b>: Cari entry presisi, lihat candle konfirmasi

<b>Aturan MTF</b>: Hanya entry di M15 yang searah dengan H4. Jangan pernah counter-tren H4.

<b>🔷 Setup Premium AZZA TRADER</b>
Semua kondisi harus terpenuhi:
✅ H4: Tren jelas (bullish/bearish)
✅ H4: Ada BOS searah tren
✅ H1: Harga di zona supply/demand yang valid
✅ M15: CHoCH + candle konfirmasi (pinbar/engulfing)
✅ Confidence: HIGH atau VERY HIGH

<b>🔷 Scaling &amp; Position Management</b>
• <b>Partial close di TP1</b>: Ambil 50-70% posisi
• <b>Move SL to breakeven</b> setelah TP1 tercapai
• <b>Biarkan sisa posisi berjalan</b> menuju TP2

<b>🔷 Trailing Stop</b>
Setelah TP1, geser SL ke:
• Entry price (breakeven), atau
• Di bawah/atas swing terakhir yang terbentuk

<b>🔷 Ciri Trader Profesional</b>
• Tidak perlu trading setiap hari
• Sabar menunggu setup A+ (semua kriteria terpenuhi)
• Tidak terpengaruh hasil 1-2 trade
• Konsisten dengan sistem yang sudah terbukti
• Fokus pada proses, bukan hasil jangka pendek

<b>🔷 Target Realistis</b>
• Pemula: 3-5% per bulan dengan konsisten
• Menengah: 8-15% per bulan
• Pro: 15-30% per bulan

Ingat: Compounding adalah senjata terkuat. Modal $1000 dengan 10%/bulan = $3138 dalam 12 bulan.

🏆 <i>"Trader terbaik bukan yang paling sering benar, tapi yang paling disiplin dan konsisten. Selamat berjuang — perjalanan 1000 mile dimulai dari 1 langkah."</i>

— AZZA TRADER Smart Analyst Bot`,
  },
];

export function getChapterById(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function buildEducationMenu(): string {
  return `📚 <b>AZZA TRADER — AKADEMI TRADING</b>

Pilih bab yang ingin kamu pelajari:

${chapters.map((c, i) => `${c.emoji} <b>Bab ${i + 1}</b>: ${c.title.replace(/Bab \d+: /, "")}`).join("\n")}

👆 Klik tombol di bawah untuk membuka materi`;
}
