import type {
  ClusterPayload,
  LayerCategory,
  LayerFilter,
  PermissionPayload,
  TelegramConversation
} from "../types";

const API_BASE_CANDIDATES = (
  import.meta.env.VITE_API_BASES as string | undefined
)
  ?.split(",")
  .map((v) => v.trim())
  .filter(Boolean) ?? [
  "http://127.0.0.1:8787",
  "http://localhost:8787",
  "http://host.docker.internal:8787"
];

const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 2000);

function withTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function fetchWithFallback(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const failures: string[] = [];

  for (const base of API_BASE_CANDIDATES) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        ...init,
        signal: withTimeoutSignal(REQUEST_TIMEOUT_MS)
      });
      if (res.ok) return res;
      const body = (await res.text()).slice(0, 220);
      throw new Error(`${res.status} ${res.statusText} ${body}`.trim());
    } catch (err) {
      failures.push(`${url} => ${(err as Error).message}`);
    }
  }

  throw new Error(`API unreachable. ${failures.join(" | ")}`);
}

export async function connectSession(userToken: string): Promise<PermissionPayload> {
  const res = await fetchWithFallback("/session/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userToken })
  });
  return res.json();
}

export async function getTelegramConversations(
  sessionId: string
): Promise<TelegramConversation[]> {
  const res = await fetchWithFallback(
    `/telegram/conversations?sessionId=${encodeURIComponent(sessionId)}`
  );
  return res.json();
}

export async function getLiveClusters(filters: LayerFilter): Promise<ClusterPayload> {
  const enabled = Object.entries(filters)
    .filter(([, active]) => active)
    .map(([key]) => key as LayerCategory);
  const query = encodeURIComponent(enabled.join(","));
  const res = await fetchWithFallback(`/clusters/live?layers=${query}`);
  return res.json();
}

export async function getSocialImages(keyword: string): Promise<string[]> {
  const res = await fetchWithFallback(
    `/social/images?keyword=${encodeURIComponent(keyword)}`
  );
  return res.json();
}
