import fs from "fs";
import path from "path";
import { getBot } from "./botInstance";
import { chapters, buildEducationMenu, getChapterById } from "./education";
import { userStates, answerQuestion } from "./qaHandler";
import { runScan } from "./scanner";
import { fetchCandles } from "./priceService";
import { analyzeSMC } from "./smcAnalysis";
import { buildWinrateMessage } from "./signalTracker";
import { getGoldNews } from "./newsService";
import {
  addAlert,
  removeAlert,
  clearAlerts,
  getAlerts,
  buildAlertPage,
} from "./alertService";
import { logger } from "../lib/logger";
import type TelegramBot from "node-telegram-bot-api";

const BANNER_PATH = path.join(process.cwd(), "assets", "banner.png");
const CAPTION_LIMIT = 1020;

const alertStates = new Map<number, "waiting_alert_price">();

function mainMenuKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "📊 Analisa Live", callback_data: "cmd_analisa" },
        { text: "❓ Tanya AZZA", callback_data: "cmd_tanya" },
      ],
      [
        { text: "📰 Berita Gold", callback_data: "cmd_news" },
        { text: "📈 Level S&R", callback_data: "cmd_snr" },
      ],
      [
        { text: "📚 Belajar Trading", callback_data: "cmd_belajar" },
        { text: "📉 Winrate Stats", callback_data: "cmd_winrate" },
      ],
      [
        { text: "🔔 Price Alert", callback_data: "cmd_alert" },
        { text: "🤖 Status Bot", callback_data: "cmd_status" },
      ],
    ],
  };
}

function educationKeyboard(): TelegramBot.InlineKeyboardMarkup {
  const buttons = chapters.map((c, i) => ({
    text: `${c.emoji} Bab ${i + 1}`,
    callback_data: c.id,
  }));
  const rows: TelegramBot.InlineKeyboardButton[][] = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  rows.push([{ text: "🏠 Menu Utama", callback_data: "cmd_home" }]);
  return { inline_keyboard: rows };
}

function chapterNavKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "📚 Daftar Bab", callback_data: "cmd_belajar" },
        { text: "🏠 Menu Utama", callback_data: "cmd_home" },
      ],
    ],
  };
}

function backKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: "🏠 Menu Utama", callback_data: "cmd_home" }]],
  };
}

function alertKeyboard(chatId: number): TelegramBot.InlineKeyboardMarkup {
  const userAlerts = getAlerts(chatId);
  const rows: TelegramBot.InlineKeyboardButton[][] = [
    [{ text: "➕ Tambah Alert", callback_data: "cmd_alert_add" }],
  ];
  if (userAlerts.length > 0) {
    rows.push([{ text: "🗑️ Hapus Semua Alert", callback_data: "cmd_alert_clear" }]);
  }
  rows.push([{ text: "🏠 Menu Utama", callback_data: "cmd_home" }]);
  return { inline_keyboard: rows };
}

function qaReplyKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "❓ Tanya Lagi", callback_data: "cmd_tanya" },
        { text: "📚 Belajar", callback_data: "cmd_belajar" },
      ],
      [{ text: "🏠 Menu Utama", callback_data: "cmd_home" }],
    ],
  };
}

function welcomeCaption(): string {
  return (
    `🌟 <b>Selamat datang di AZZA TRADER</b>\n` +
    `<i>Smart Analyst Bot — XAUUSD Gold Spot</i>\n\n` +
    `🔷 <b>Fitur Unggulan:</b>\n` +
    `• 📊 Analisa Real-Time tiap 15 menit\n` +
    `• 🎯 Sinyal BUY/SELL + BOS/CHoCH/S&D\n` +
    `• 🛡️ Auto BE Set &amp; Partial Close @ +30 poin\n` +
    `• 📉 Statistik Winrate otomatis\n` +
    `• 🔔 Price Alert harga custom\n` +
    `• 📰 Berita Gold + analisa AI\n` +
    `• 🧠 Tanya jawab AI (Bahasa Indonesia)\n\n` +
    `👇 <b>Pilih menu:</b>`
  );
}

type EditTarget = { chatId: number; messageId: number; isPhoto: boolean };

async function editText(
  target: EditTarget,
  text: string,
  keyboard: TelegramBot.InlineKeyboardMarkup,
  extraOpts: Record<string, unknown> = {}
): Promise<void> {
  const bot = getBot();

  if (target.isPhoto && text.length > CAPTION_LIMIT) {
    try { await bot.deleteMessage(target.chatId, target.messageId); } catch {}
    await bot.sendMessage(target.chatId, text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
      ...extraOpts,
    });
    return;
  }

  if (target.isPhoto) {
    await bot.editMessageCaption(text, {
      chat_id: target.chatId,
      message_id: target.messageId,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } else {
    await bot.editMessageText(text, {
      chat_id: target.chatId,
      message_id: target.messageId,
      parse_mode: "HTML",
      reply_markup: keyboard,
      ...extraOpts,
    });
  }
}

async function goHome(target: EditTarget): Promise<void> {
  const bot = getBot();
  const caption = welcomeCaption();
  const keyboard = mainMenuKeyboard();

  if (target.isPhoto) {
    await bot.editMessageCaption(caption, {
      chat_id: target.chatId,
      message_id: target.messageId,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } else {
    try { await bot.deleteMessage(target.chatId, target.messageId); } catch {}
    await sendBannerPhoto(target.chatId, caption, keyboard);
  }
}

async function sendBannerPhoto(
  chatId: number | string,
  caption: string,
  keyboard: TelegramBot.InlineKeyboardMarkup
): Promise<TelegramBot.Message> {
  const bot = getBot();
  try {
    return await bot.sendPhoto(chatId, BANNER_PATH, {
      caption,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } catch {
    return await bot.sendMessage(chatId, caption, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }
}

function getTarget(query: TelegramBot.CallbackQuery): EditTarget | null {
  const msg = query.message;
  if (!msg) return null;
  return {
    chatId: msg.chat.id,
    messageId: msg.message_id,
    isPhoto: !!(msg as any).photo,
  };
}

export function setupCommandHandler(): void {
  const bot = getBot();

  bot.onText(/\/start/, async (msg) => {
    await sendBannerPhoto(msg.chat.id, welcomeCaption(), mainMenuKeyboard());
  });

  bot.onText(/\/menu/, async (msg) => {
    await sendBannerPhoto(msg.chat.id, welcomeCaption(), mainMenuKeyboard());
  });

  bot.onText(/\/analisa/, async (msg) => {
    const chatId = msg.chat.id;
    const wait = await bot.sendMessage(chatId, "⏳ Sedang menganalisa XAUUSD...");
    try {
      await runScan(chatId);
      await bot.deleteMessage(chatId, wait.message_id);
    } catch (err: any) {
      await bot.editMessageText(`❌ Gagal: ${err?.message ?? "error"}`, {
        chat_id: chatId, message_id: wait.message_id,
      });
    }
  });

  bot.onText(/\/tanya/, async (msg) => {
    const chatId = msg.chat.id;
    userStates.set(msg.from?.id ?? chatId, "waiting_question");
    await bot.sendMessage(
      chatId,
      `❓ <b>Tanya AZZA Trader</b>\n\nKetik pertanyaanmu sekarang:\n\n<i>Contoh: "Apa itu BOS?", "Cara entry dari demand zone?", "Kapan cut loss?"</i>`,
      { parse_mode: "HTML", reply_markup: backKeyboard() }
    );
  });

  bot.onText(/\/belajar/, async (msg) => {
    await bot.sendMessage(msg.chat.id, buildEducationMenu(), {
      parse_mode: "HTML",
      reply_markup: educationKeyboard(),
    });
  });

  bot.onText(/\/snr/, async (msg) => {
    const chatId = msg.chat.id;
    const wait = await bot.sendMessage(chatId, "⏳ Mengambil data S&R...");
    try {
      const text = await buildSNRText();
      await bot.editMessageText(text, {
        chat_id: chatId, message_id: wait.message_id,
        parse_mode: "HTML", reply_markup: backKeyboard(),
      });
    } catch (err: any) {
      await bot.editMessageText(`❌ Gagal: ${err?.message ?? "error"}`, {
        chat_id: chatId, message_id: wait.message_id,
      });
    }
  });

  bot.onText(/\/news/, async (msg) => {
    const chatId = msg.chat.id;
    const wait = await bot.sendMessage(chatId, "⏳ Mengambil berita Gold...");
    try {
      const news = await getGoldNews();
      await bot.editMessageText(news, {
        chat_id: chatId, message_id: wait.message_id,
        parse_mode: "HTML", reply_markup: backKeyboard(),
        disable_web_page_preview: true,
      });
    } catch (err: any) {
      await bot.editMessageText(`❌ Gagal: ${err?.message ?? "error"}`, {
        chat_id: chatId, message_id: wait.message_id,
      });
    }
  });

  bot.onText(/\/winrate/, async (msg) => {
    await bot.sendMessage(msg.chat.id, buildWinrateMessage(), {
      parse_mode: "HTML",
      reply_markup: backKeyboard(),
    });
  });

  bot.onText(/\/alert/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const candles = await fetchCandles("15m", "1d");
      const smc = analyzeSMC(candles);
      await bot.sendMessage(chatId, buildAlertPage(chatId, smc.currentPrice), {
        parse_mode: "HTML",
        reply_markup: alertKeyboard(chatId),
      });
    } catch {
      await bot.sendMessage(chatId, buildAlertPage(chatId, 0), {
        parse_mode: "HTML",
        reply_markup: alertKeyboard(chatId),
      });
    }
  });

  bot.onText(/\/status/, async (msg) => {
    await bot.sendMessage(msg.chat.id, buildStatusText(), {
      parse_mode: "HTML",
      reply_markup: backKeyboard(),
    });
  });

  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    const userId = msg.from?.id ?? msg.chat.id;
    const chatId = msg.chat.id;

    if (alertStates.get(userId) === "waiting_alert_price") {
      alertStates.delete(userId);
      const raw = msg.text.replace(/[,$]/g, "").trim();
      const price = parseFloat(raw);
      if (isNaN(price) || price < 100 || price > 99999) {
        await bot.sendMessage(chatId,
          `❌ Harga tidak valid. Masukkan angka harga Gold yang benar.\nContoh: <code>4400</code>`,
          { parse_mode: "HTML", reply_markup: backKeyboard() }
        );
        return;
      }
      try {
        const candles = await fetchCandles("15m", "1d");
        const smc = analyzeSMC(candles);
        const currentPrice = smc.currentPrice;
        const alert = addAlert(chatId, price, currentPrice);
        const arrow = alert.direction === "above" ? "⬆️" : "⬇️";
        const label = alert.direction === "above"
          ? `naik ke $${price.toFixed(2)}`
          : `turun ke $${price.toFixed(2)}`;

        await bot.sendMessage(chatId,
          `✅ <b>Alert berhasil dibuat!</b>\n\n` +
          `${arrow} Gold <b>${label}</b>\n` +
          `💰 Harga saat ini: $${currentPrice.toFixed(2)}\n\n` +
          `🔔 Kamu akan dapat notifikasi saat harga menyentuh level ini.\n` +
          `⏱️ Bot cek harga setiap 15 menit.\n\n` +
          `Lihat semua alert: /alert`,
          { parse_mode: "HTML", reply_markup: backKeyboard() }
        );
      } catch {
        const alert = addAlert(chatId, price, price - 1);
        const arrow = alert.direction === "above" ? "⬆️" : "⬇️";
        await bot.sendMessage(chatId,
          `✅ Alert $${price.toFixed(2)} ${arrow} dibuat!\n\nLihat semua: /alert`,
          { parse_mode: "HTML", reply_markup: backKeyboard() }
        );
      }
      return;
    }

    if (userStates.get(userId) !== "waiting_question") return;

    userStates.set(userId, "idle");
    bot.sendChatAction(chatId, "typing").catch(() => {});
    try {
      const answer = await answerQuestion(msg.text);
      await bot.sendMessage(chatId,
        `❓ <b>Pertanyaan:</b>\n<i>${msg.text}</i>\n\n` +
        `🤖 <b>Jawaban AZZA Trader:</b>\n${answer}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💬 Punya pertanyaan lain? /tanya`,
        { parse_mode: "HTML", reply_markup: qaReplyKeyboard() }
      );
    } catch (err) {
      logger.error({ err }, "Gagal menjawab pertanyaan");
      await bot.sendMessage(chatId, "❌ Maaf, terjadi error. Coba lagi.", {
        reply_markup: backKeyboard(),
      });
    }
  });

  bot.on("callback_query", async (query) => {
    const data = query.data ?? "";
    await bot.answerCallbackQuery(query.id).catch(() => {});

    const target = getTarget(query);
    if (!target) return;
    const { chatId } = target;

    if (data === "cmd_home") {
      await goHome(target);
      return;
    }

    if (data === "cmd_analisa") {
      await editText(target, "⏳ Sedang menganalisa XAUUSD...", { inline_keyboard: [] });
      try {
        await runScan(chatId);
        await goHome(target);
      } catch (err: any) {
        await editText(target, `❌ Gagal analisa: ${err?.message ?? "error"}`, backKeyboard());
      }
      return;
    }

    if (data === "cmd_tanya") {
      userStates.set(query.from.id, "waiting_question");
      await editText(target,
        `❓ <b>Tanya AZZA Trader</b>\n\nKetik pertanyaanmu sekarang 👇\n\n` +
        `<i>Contoh: "Apa itu supply demand?", "Cara pakai BOS?", "Kapan entry yang aman?"</i>`,
        backKeyboard()
      );
      return;
    }

    if (data === "cmd_belajar") {
      await editText(target, buildEducationMenu(), educationKeyboard());
      return;
    }

    if (data === "cmd_snr") {
      await editText(target, "⏳ Mengambil data S&R...", { inline_keyboard: [] });
      try {
        const text = await buildSNRText();
        await editText(target, text, backKeyboard());
      } catch (err: any) {
        await editText(target, `❌ Gagal: ${err?.message ?? "error"}`, backKeyboard());
      }
      return;
    }

    if (data === "cmd_news") {
      await editText(target, "⏳ Mengambil berita Gold terkini...", { inline_keyboard: [] });
      try {
        const news = await getGoldNews();
        await editText(target, news, backKeyboard(), { disable_web_page_preview: true });
      } catch (err: any) {
        await editText(target, `❌ Gagal: ${err?.message ?? "error"}`, backKeyboard());
      }
      return;
    }

    if (data === "cmd_winrate") {
      await editText(target, buildWinrateMessage(), backKeyboard());
      return;
    }

    if (data === "cmd_status") {
      await editText(target, buildStatusText(), backKeyboard());
      return;
    }

    if (data === "cmd_alert") {
      await editText(target, "⏳ Memuat alert...", { inline_keyboard: [] });
      try {
        const candles = await fetchCandles("15m", "1d");
        const smc = analyzeSMC(candles);
        await editText(target, buildAlertPage(chatId, smc.currentPrice), alertKeyboard(chatId));
      } catch {
        await editText(target, buildAlertPage(chatId, 0), alertKeyboard(chatId));
      }
      return;
    }

    if (data === "cmd_alert_add") {
      alertStates.set(query.from.id, "waiting_alert_price");
      await editText(target,
        `🔔 <b>Tambah Price Alert</b>\n\n` +
        `Ketik harga Gold yang ingin kamu pantau:\n\n` +
        `<i>Contoh: ketik <code>4400</code> untuk notifikasi saat Gold menyentuh $4400</i>\n\n` +
        `Bot akan otomatis deteksi arah (naik/turun) berdasarkan harga saat ini.`,
        backKeyboard()
      );
      return;
    }

    if (data === "cmd_alert_clear") {
      clearAlerts(chatId);
      try {
        const candles = await fetchCandles("15m", "1d");
        const smc = analyzeSMC(candles);
        await editText(target,
          `🗑️ Semua alert dihapus.\n\n` + buildAlertPage(chatId, smc.currentPrice),
          alertKeyboard(chatId)
        );
      } catch {
        await editText(target, `🗑️ Semua alert dihapus.`, alertKeyboard(chatId));
      }
      return;
    }

    const chapter = getChapterById(data);
    if (chapter) {
      await editText(target, chapter.content, chapterNavKeyboard());
    }
  });

  logger.info("Command handler terdaftar");
}

async function buildSNRText(): Promise<string> {
  const candles = await fetchCandles("15m", "5d");
  const smc = analyzeSMC(candles);
  const p = smc.currentPrice;

  let text = `📈 <b>XAUUSD — LEVEL SUPPORT &amp; RESISTANCE</b>\n`;
  text += `💰 Harga Saat Ini: <b>$${p.toFixed(2)}</b>\n\n`;
  text += `🔴 <b>ZONA SUPPLY (Resistance):</b>\n`;
  if (smc.supplyZones.length === 0) {
    text += `• Tidak ada zona supply terdekat\n`;
  } else {
    for (const z of smc.supplyZones.slice(0, 3)) {
      const dist = (z.bottom - p).toFixed(2);
      text += `• ${z.bottom.toFixed(2)}–${z.top.toFixed(2)} (+$${dist}) ${"⭐".repeat(Math.min(z.strength, 5))}\n`;
    }
  }
  text += `\n🟢 <b>ZONA DEMAND (Support):</b>\n`;
  if (smc.demandZones.length === 0) {
    text += `• Tidak ada zona demand terdekat\n`;
  } else {
    for (const z of smc.demandZones.slice(0, 3)) {
      const dist = (p - z.top).toFixed(2);
      text += `• ${z.bottom.toFixed(2)}–${z.top.toFixed(2)} (-$${dist}) ${"⭐".repeat(Math.min(z.strength, 5))}\n`;
    }
  }
  text += `\n📌 <b>Struktur Market:</b>\n`;
  text += `• Tren: ${smc.trend === "bullish" ? "📈 Bullish" : smc.trend === "bearish" ? "📉 Bearish" : "↔️ Ranging"}\n`;
  if (smc.bos) text += `• BOS: ${smc.bos.direction} @ ${smc.bos.level.toFixed(2)}\n`;
  if (smc.choch) text += `• CHoCH: ${smc.choch.direction} @ ${smc.choch.level.toFixed(2)}\n`;
  text += `• HH: ${smc.lastHH.toFixed(2)} | LL: ${smc.lastLL.toFixed(2)}\n`;
  return text;
}

function buildStatusText(): string {
  const hasOpenRouter = !!process.env["OPENROUTER_API_KEY"];
  return (
    `🤖 <b>STATUS AZZA TRADER BOT</b>\n\n` +
    `✅ Bot aktif &amp; berjalan\n` +
    `📊 Pair: XAUUSD (Gold Spot)\n` +
    `⏱️ Scan otomatis: setiap 15 menit\n` +
    `🛡️ Auto BE: +$3 / 30 poin dari entry\n` +
    `🧠 AI: ${hasOpenRouter ? "OpenRouter Llama 3.3 ✅" : "Rule-based fallback"}\n` +
    `💰 SL tetap: $4 | RR min 1:2\n` +
    `🕒 ${new Date().toUTCString().replace("GMT", "UTC")}`
  );
}
