import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { AdminAuthorizationService } from "./services/adminAuth.js";
import { EncryptedCache } from "./services/cache.js";
import { MahsaBridgeService } from "./services/mahsaBridge.js";
import { SocialImageService } from "./services/social.js";
import { TelegramBridgeService } from "./services/telegram.js";
import type { ClusterPayload, PermissionPayload } from "./types.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "512kb" }));

const sessionStore = new Map<string, PermissionPayload>();
const cache = new EncryptedCache(config.cachePath, config.cacheKey);
const adminAuth = new AdminAuthorizationService(config.adminPanelUrl, config.adminPanelToken);
const mahsaBridge = new MahsaBridgeService(config.mahsaSources);
const telegramBridge = new TelegramBridgeService(
  config.telegramApiId,
  config.telegramApiHash,
  config.telegramStringSession
);
const socialImageService = new SocialImageService();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    host: config.host,
    port: config.port,
    timestamp: new Date().toISOString()
  });
});

app.post("/session/connect", async (req, res) => {
  const userToken = String(req.body?.userToken ?? "").trim();
  if (!userToken) return res.status(400).json({ error: "Missing userToken" });

  const session = await adminAuth.createSession(userToken);
  sessionStore.set(session.sessionId, session);
  res.json(session);
});

app.get("/telegram/conversations", async (req, res) => {
  const sessionId = String(req.query.sessionId ?? "");
  const permissions = sessionStore.get(sessionId);
  if (!permissions) return res.status(403).json({ error: "Unauthorized session" });

  const data = await telegramBridge.getAuthorizedConversations(permissions);
  res.json(data);
});

app.get("/clusters/live", async (req, res) => {
  const layersRaw = String(req.query.layers ?? "");
  const activeLayers = new Set(layersRaw.split(",").map((x) => x.trim()).filter(Boolean));

  let payload = await cache.read<ClusterPayload>();
  if (!payload) {
    payload = await mahsaBridge.fetchClusters();
    await cache.write(payload);
  }

  const fresh = await mahsaBridge.fetchClusters();
  await cache.write(fresh);

  const filteredFeatures = fresh.features.filter((feature) => {
    if (activeLayers.size === 0) return true;
    return activeLayers.has(feature.category);
  });

  res.json({
    ...fresh,
    features: filteredFeatures
  });
});

app.get("/social/images", async (req, res) => {
  const keyword = String(req.query.keyword ?? "").trim();
  if (!keyword) return res.json([]);
  const images = await socialImageService.findImages(keyword);
  res.json(images);
});

app.listen(config.port, config.host, () => {
  console.log(`Lucas local bridge listening on http://${config.host}:${config.port}`);
});
