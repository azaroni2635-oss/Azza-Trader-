import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { sendToChat } from "./telegramService";

const DATA_FILE = path.join(process.cwd(), "data", "alerts.json");

export interface PriceAlert {
  id: string;
  chatId: number;
  price: number;
  direction: "above" | "below";
  createdAt: number;
}

let alerts: PriceAlert[] = [];
let loaded = false;

function ensureDir(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(): void {
  if (loaded) return;
  ensureDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      alerts = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch {
    alerts = [];
  }
  loaded = true;
}

function save(): void {
  ensureDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(alerts, null, 2));
  } catch (err) {
    logger.error({ err }, "Gagal menyimpan alerts");
  }
}

export function addAlert(
  chatId: number,
  price: number,
  currentPrice: number
): PriceAlert {
  load();
  const direction: "above" | "below" = price > currentPrice ? "above" : "below";
  const alert: PriceAlert = {
    id: `${Date.now()}_${chatId}`,
    chatId,
    price,
    direction,
    createdAt: Date.now(),
  };
  alerts.push(alert);
  save();
  logger.info({ chatId, price, direction }, "Alert ditambahkan");
  return alert;
}

export function removeAlert(id: string): void {
  load();
  alerts = alerts.filter((a) => a.id !== id);
  save();
}

export function clearAlerts(chatId: number): void {
  load();
  alerts = alerts.filter((a) => a.chatId !== chatId);
  save();
}

export function getAlerts(chatId: number): PriceAlert[] {
  load();
  return alerts.filter((a) => a.chatId === chatId);
}

export function getAllAlerts(): PriceAlert[] {
  load();
  return alerts;
}

export async function checkAndNotifyAlerts(currentPrice: number): Promise<void> {
  load();
  const triggered = alerts.filter((a) => {
    if (a.direction === "above") return currentPrice >= a.price;
    return currentPrice <= a.price;
  });

  if (triggered.length === 0) return;

  for (const alert of triggered) {
    const arrow = alert.direction === "above" ? "⬆️ naik ke" : "⬇️ turun ke";
    const wib = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    });

    const msg =
      `🔔 <b>ALERT HARGA TERCAPAI!</b>\n\n` +
      `💰 <b>XAUUSD = $${currentPrice.toFixed(2)}</b>\n` +
      `📌 Level alert: <b>$${alert.price.toFixed(2)}</b> (${arrow} level ini)\n` +
      `🕒 ${wib} WIB\n\n` +
      `📊 Gunakan /analisa untuk sinyal terkini.\n` +
      `🔔 Set alert baru dengan /alert`;

    try {
      await sendToChat(alert.chatId, msg);
      logger.info({ chatId: alert.chatId, price: alert.price }, "Alert terkirim");
    } catch (err) {
      logger.error({ err }, "Gagal kirim alert");
    }
  }

  const triggeredIds = new Set(triggered.map((a) => a.id));
  alerts = alerts.filter((a) => !triggeredIds.has(a.id));
  save();
}

export function buildAlertPage(chatId: number, currentPrice: number): string {
  load();
  const userAlerts = getAlerts(chatId);

  let msg =
    `🔔 <b>PRICE ALERT — XAUUSD</b>\n` +
    `💰 Harga Saat Ini: <b>$${currentPrice.toFixed(2)}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (userAlerts.length === 0) {
    msg += `📭 <i>Belum ada alert aktif.</i>\n\n`;
  } else {
    msg += `📋 <b>Alert Aktif (${userAlerts.length}):</b>\n`;
    for (const a of userAlerts) {
      const arrow = a.direction === "above" ? "⬆️" : "⬇️";
      const label = a.direction === "above" ? "jika naik ke" : "jika turun ke";
      msg += `• ${arrow} <b>$${a.price.toFixed(2)}</b> — ${label} level ini\n`;
    }
    msg += "\n";
  }

  msg +=
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `ℹ️ <i>Alert akan dikirim saat harga menyentuh level yang kamu set. ` +
    `Bot cek harga setiap 15 menit.</i>`;

  return msg;
}
