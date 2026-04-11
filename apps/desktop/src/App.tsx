import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { GeoJSONSource, Map } from "maplibre-gl";
import { TacticalIcon } from "./icons/tactical";
import {
  connectSession,
  getLiveClusters,
  getSocialImages,
  getTelegramConversations
} from "./lib/api";
import { defaultFilters, loadFilterPreset, saveFilterPreset } from "./lib/storage";
import type {
  ClusterFeature,
  LayerCategory,
  LayerFilter,
  PermissionPayload,
  TabId,
  TelegramConversation
} from "./types";

type SelectedFeature = ClusterFeature & { images: string[] };

const TAB_LABELS: Record<TabId, string> = {
  comms: "ارتباطات",
  map: "نقشه عملیات ایران",
  system: "سامانه"
};

const IRAN_CENTER: [number, number] = [53.688, 32.4279];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("comms");
  const [connecting, setConnecting] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [permissions, setPermissions] = useState<PermissionPayload | null>(null);
  const [conversations, setConversations] = useState<TelegramConversation[]>([]);
  const [filters, setFilters] = useState<LayerFilter>(loadFilterPreset);
  const [features, setFeatures] = useState<ClusterFeature[]>([]);
  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState<string | null>(null);

  const canLoadData = Boolean(permissions?.sessionId);

  useEffect(() => {
    saveFilterPreset(filters);
  }, [filters]);

  useEffect(() => {
    if (!canLoadData) return;

    let stop = false;
    const poll = async () => {
      try {
        const payload = await getLiveClusters(filters);
        if (!stop) setFeatures(payload.features);
      } catch (e) {
        if (!stop) setError((e as Error).message);
      }
    };

    poll();
    const id = window.setInterval(poll, 15000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [canLoadData, filters]);

  async function handleConnect() {
    if (!tokenInput.trim()) return;
    setConnecting(true);
    setError(null);
    setStatus("Authorizing");

    try {
      const permissionPayload = await connectSession(tokenInput.trim());
      const telegramData = await getTelegramConversations(permissionPayload.sessionId);
      setPermissions(permissionPayload);
      setConversations(telegramData);
      setStatus("Connected");
      setActiveTab("map");
    } catch (e) {
      setError((e as Error).message);
      setStatus("Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  async function onFeatureSelect(feature: ClusterFeature) {
    const images = await getSocialImages(feature.title);
    setSelected({ ...feature, images });
  }

  return (
    <div className="app-root" dir="rtl">
      <div className="viewport-shell">
        <aside className="nav-rail">
          <div className="brand-block">
            <h1>LUCAS</h1>
            <p>TACTICAL DESKTOP NODE</p>
          </div>
          {(["comms", "map", "system"] as TabId[]).map((tab) => (
            <button
              key={tab}
              className={`rail-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
          <div className="status-card">
            <span>Session</span>
            <strong>{status}</strong>
          </div>
        </aside>

        <main className="workspace">
          {!permissions ? (
            <ConnectionGate
              connecting={connecting}
              tokenInput={tokenInput}
              setTokenInput={setTokenInput}
              onConnect={handleConnect}
              error={error}
            />
          ) : activeTab === "comms" ? (
            <CommsTab conversations={conversations} permissions={permissions} />
          ) : activeTab === "map" ? (
            <MapTab
              filters={filters}
              setFilters={setFilters}
              features={features}
              onFeatureSelect={onFeatureSelect}
              selected={selected}
            />
          ) : (
            <SystemTab />
          )}
        </main>

        <aside className="context-panel">
          <h3>Context Feed</h3>
          {selected ? (
            <div className="feature-detail">
              <h4>{selected.title}</h4>
              <p>{selected.details ?? "No extended briefing"}</p>
              <small>
                {selected.coordinates[1].toFixed(3)}, {selected.coordinates[0].toFixed(3)}
              </small>
              <div className="social-grid">
                {selected.images.length === 0 && <p>No linked media yet.</p>}
                {selected.images.map((url) => (
                  <img key={url} src={url} alt={selected.title} />
                ))}
              </div>
            </div>
          ) : (
            <p>Click map features to inspect detail intelligence.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function ConnectionGate({
  connecting,
  tokenInput,
  setTokenInput,
  onConnect,
  error
}: {
  connecting: boolean;
  tokenInput: string;
  setTokenInput: (value: string) => void;
  onConnect: () => void;
  error: string | null;
}) {
  return (
    <section className="connection-gate">
      <div className="starlink-field" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="starlink-node" style={{ ["--i" as string]: i }} />
        ))}
      </div>
      <div className="gate-form">
        <h2>Secure Uplink</h2>
        <p>Authorized desktop session via external admin permissions</p>
        <input
          type="password"
          value={tokenInput}
          placeholder="Session access token"
          onChange={(e) => setTokenInput(e.target.value)}
        />
        <button type="button" onClick={onConnect} disabled={connecting}>
          {connecting ? "Connecting..." : "Connect"}
        </button>
        {error && <small className="error-text">{error}</small>}
      </div>
    </section>
  );
}

function CommsTab({
  conversations,
  permissions
}: {
  conversations: TelegramConversation[];
  permissions: PermissionPayload;
}) {
  return (
    <section className="tab-panel">
      <header className="panel-head">
        <h2>Telegram Live</h2>
        <p>
          Authorized chats: {permissions.allowedChatIds.length + permissions.allowedChannelIds.length + permissions.allowedGroupIds.length}
        </p>
      </header>
      <div className="convo-list">
        {conversations.length === 0 && (
          <p className="hint">No authorized conversation payload returned for this session.</p>
        )}
        {conversations.map((c) => (
          <article key={c.id} className="convo-card">
            <div>
              <strong>{c.title}</strong>
              <small>{c.kind}</small>
            </div>
            <p>{c.lastMessage ?? "No message preview"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MapTab({
  filters,
  setFilters,
  features,
  selected,
  onFeatureSelect
}: {
  filters: LayerFilter;
  setFilters: (next: LayerFilter) => void;
  features: ClusterFeature[];
  selected: SelectedFeature | null;
  onFeatureSelect: (feature: ClusterFeature) => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const toggleFilter = (key: LayerCategory) => {
    const preservedScroll = listRef.current?.scrollTop ?? 0;
    setFilters({ ...filters, [key]: !filters[key] });
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = preservedScroll;
    });
  };

  const categories = useMemo(() => Object.keys(defaultFilters) as LayerCategory[], []);

  return (
    <section className="tab-panel map-layout">
      <header className="panel-head">
        <h2>Iran Ops Map</h2>
        <p>Medical layers are fetched but hidden by default.</p>
      </header>
      <div className="map-grid">
        <div className="filter-list" ref={listRef}>
          {categories.map((category) => (
            <label key={category} className="filter-item">
              <input
                type="checkbox"
                checked={filters[category]}
                onChange={() => toggleFilter(category)}
              />
              <span className="icon-wrap">
                <TacticalIcon category={category} />
              </span>
              <span>{category}</span>
            </label>
          ))}
        </div>
        <IranMap features={features} selected={selected} onFeatureSelect={onFeatureSelect} />
      </div>
    </section>
  );
}

function IranMap({
  features,
  selected,
  onFeatureSelect
}: {
  features: ClusterFeature[];
  selected: SelectedFeature | null;
  onFeatureSelect: (feature: ClusterFeature) => void;
}) {
  const mapRef = useRef<Map | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: nodeRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: IRAN_CENTER,
      zoom: 4.4
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

    map.on("load", () => {
      map.addSource("clusters", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      map.addLayer({
        id: "cluster-points",
        type: "circle",
        source: "clusters",
        paint: {
          "circle-color": [
            "match",
            ["get", "category"],
            "medical",
            "#3f5c8e",
            "incidents",
            "#ff3b39",
            "#c8f5ff"
          ],
          "circle-radius": 6,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#f0fdff"
        }
      });

      map.on("click", "cluster-points", (evt) => {
        const feature = evt.features?.[0];
        if (!feature?.properties) return;
        const payload: ClusterFeature = {
          id: String(feature.properties.id),
          title: String(feature.properties.title),
          category: feature.properties.category as LayerCategory,
          coordinates: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
          details: String(feature.properties.details ?? "")
        };
        // Do not change camera/viewport on click; only open context details.
        onFeatureSelect(payload);
      });

      map.on("mouseenter", "cluster-points", () => {
        map.getCanvas().style.cursor = "crosshair";
      });

      map.on("mouseleave", "cluster-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        new maplibregl.Marker({ color: "#6dc7ff" })
          .setLngLat([position.coords.longitude, position.coords.latitude])
          .addTo(map);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onFeatureSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("clusters") as GeoJSONSource | undefined;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: features.map((item) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: item.coordinates },
        properties: {
          id: item.id,
          title: item.title,
          category: item.category,
          details: item.details ?? ""
        }
      }))
    });
  }, [features]);

  return (
    <div className="map-wrap">
      <div ref={nodeRef} className="map-canvas" />
      {selected && <div className="map-overlay-tag">{selected.title}</div>}
    </div>
  );
}

function SystemTab() {
  const [freq, setFreq] = useState([120.11, 302.04, 460.72, 512.09]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFreq((prev) => prev.map(() => Number((100 + Math.random() * 500).toFixed(2))));
    }, 1300);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="system-scene">
      <div className="bio-grid">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="bio-node" style={{ ["--x" as string]: `${Math.random() * 100}%`, ["--y" as string]: `${Math.random() * 100}%` }} />
        ))}
      </div>
      <div className="freq-feed">
        {freq.map((f) => (
          <p key={f}>{f} MHz</p>
        ))}
      </div>
    </section>
  );
}

export default App;
