import crypto from "node:crypto";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

function parseSources(value: string | undefined): string[] {
  if (!value) {
    return [
      "https://mahsaalert.app/api/clusters",
      "https://mahsaalert.app/api/layers"
    ];
  }
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 8787),
  adminPanelUrl: process.env.ADMIN_PANEL_URL ?? "",
  adminPanelToken: process.env.ADMIN_PANEL_TOKEN ?? "",
  mahsaSources: parseSources(process.env.MAHSA_SOURCES),
  telegramApiId: Number(process.env.TELEGRAM_API_ID ?? 0),
  telegramApiHash: process.env.TELEGRAM_API_HASH ?? "",
  telegramStringSession: process.env.TELEGRAM_STRING_SESSION ?? "",
  cachePath: path.resolve(process.cwd(), ".cache/bridge-cache.enc"),
  cacheKey: (() => {
    const base64 = process.env.CACHE_ENCRYPTION_KEY_BASE64;
    if (!base64) {
      return crypto.randomBytes(32);
    }
    return Buffer.from(base64, "base64");
  })()
};
