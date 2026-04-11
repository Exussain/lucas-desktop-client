import type {
  ClusterPayload,
  LayerCategory,
  LayerFilter,
  PermissionPayload,
  TelegramConversation
} from "../types";

const API_BASE = "http://127.0.0.1:8787";

export async function connectSession(userToken: string): Promise<PermissionPayload> {
  const res = await fetch(`${API_BASE}/session/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userToken })
  });
  if (!res.ok) throw new Error("Failed to establish authorized session");
  return res.json();
}

export async function getTelegramConversations(
  sessionId: string
): Promise<TelegramConversation[]> {
  const res = await fetch(`${API_BASE}/telegram/conversations?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error("Failed to load Telegram conversations");
  return res.json();
}

export async function getLiveClusters(filters: LayerFilter): Promise<ClusterPayload> {
  const enabled = Object.entries(filters)
    .filter(([, active]) => active)
    .map(([key]) => key as LayerCategory);
  const query = encodeURIComponent(enabled.join(","));
  const res = await fetch(`${API_BASE}/clusters/live?layers=${query}`);
  if (!res.ok) throw new Error("Failed to load live clusters");
  return res.json();
}

export async function getSocialImages(keyword: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/social/images?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) return [];
  return res.json();
}
