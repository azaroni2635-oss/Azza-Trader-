import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";

const TOKEN = process.env["TELEGRAM_BOT_TOKEN"] ?? "";

let _bot: TelegramBot | null = null;

export function getBot(): TelegramBot {
  if (!_bot) {
    if (!TOKEN) {
      logger.error("TELEGRAM_BOT_TOKEN tidak di-set");
      throw new Error("TELEGRAM_BOT_TOKEN wajib diisi");
    }
    _bot = new TelegramBot(TOKEN, {
      polling: {
        interval: 1000,
        autoStart: false,
        params: { timeout: 10 },
      },
    });

    _bot.on("polling_error", (err) => {
      logger.warn({ msg: err.message }, "Telegram polling error");
    });

    _bot.on("error", (err) => {
      logger.warn({ msg: err.message }, "Telegram bot error");
    });
  }
  return _bot;
}

export function startPolling(): void {
  const bot = getBot();
  bot.startPolling();
  logger.info("Telegram bot polling dimulai");
}
