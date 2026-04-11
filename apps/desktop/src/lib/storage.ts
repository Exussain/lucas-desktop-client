import type { LayerFilter } from "../types";

const FILTER_PRESET_KEY = "lucas.layerPreset.v1";

export const defaultFilters: LayerFilter = {
  clusters: true,
  incidents: true,
  roads: true,
  utilities: true,
  medical: false
};

export function loadFilterPreset(): LayerFilter {
  try {
    const raw = localStorage.getItem(FILTER_PRESET_KEY);
    if (!raw) return defaultFilters;
    const parsed = JSON.parse(raw) as Partial<LayerFilter>;
    return { ...defaultFilters, ...parsed };
  } catch {
    return defaultFilters;
  }
}

export function saveFilterPreset(next: LayerFilter): void {
  localStorage.setItem(FILTER_PRESET_KEY, JSON.stringify(next));
}
