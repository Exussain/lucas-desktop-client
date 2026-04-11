import axios from "axios";
import pLimit from "p-limit";
import type { ClusterFeature, ClusterPayload, LayerCategory } from "../types.js";

function normalizeCategory(value: string): LayerCategory {
  if (value.includes("med") || value.includes("hospital")) return "medical";
  if (value.includes("road")) return "roads";
  if (value.includes("utility")) return "utilities";
  if (value.includes("incident")) return "incidents";
  return "clusters";
}

function toFeature(item: any, idx: number): ClusterFeature | null {
  const lng = Number(item?.lng ?? item?.lon ?? item?.longitude ?? item?.coordinates?.[0]);
  const lat = Number(item?.lat ?? item?.latitude ?? item?.coordinates?.[1]);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;

  const category = normalizeCategory(String(item?.category ?? item?.type ?? "cluster").toLowerCase());
  return {
    id: String(item?.id ?? `mahsa-${idx}`),
    title: String(item?.title ?? item?.name ?? "Untitled Cluster"),
    category,
    coordinates: [lng, lat],
    details: String(item?.details ?? item?.description ?? "")
  };
}

export class MahsaBridgeService {
  constructor(private readonly sources: string[]) {}

  async fetchClusters(): Promise<ClusterPayload> {
    // Stable initial scrape behavior: sequential-safe source ingestion, no aggressive parallel tile/pbf fetches.
    const limit = pLimit(1);
    const responses = await Promise.all(
      this.sources.map((url) =>
        limit(async () => {
          try {
            const res = await axios.get(url, { timeout: 12000 });
            return Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.features ?? [];
          } catch {
            return [];
          }
        })
      )
    );

    const features: ClusterFeature[] = [];
    for (const data of responses.flat()) {
      const feature = toFeature(data, features.length + 1);
      if (feature) features.push(feature);
    }

    return {
      updatedAt: new Date().toISOString(),
      features
    };
  }
}
