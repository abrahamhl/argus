# CalMap System Architecture & Progressive Disclosure Model

**Derivative of:** `eye-of-argus` & `calmpath-maps-pro`  
**System Type:** Privacy-Preserving Situational & Human Context Map  
**Primary Region:** Arnhem, Gelderland, Nederland  
**Version:** 2.0 (Post-God's-Eye Redesign)  

---

## 1. Architectural Philosophy: From "God's Eye" to Human Context

The original `gods-eye-view` paradigm suffered from serious UX failure:
- Overwhelming visual clutter (satellite tracking orbits, missile trajectories, military HUD aesthetics).
- Heavy GPU requirements (Cesium 3D crashes on standard mobile phones).
- Confusing cognitive overload for civilian, civic, and commercial users.

**CalMap solves this with radical simplicity and Progressive Disclosure:**
- **Default View is Calm & Clean:** Starts as a clear, beautiful, high-contrast local map of Arnhem.
- **On-Demand Intelligence Layers:** Information is revealed only when requested by the user through 6 structured levels.
- **Strict Privacy Invariants:** No individual tracking, no private camera streams, all human context is banded into coarse aggregates.

```
+---------------------------------------------------------------------------------+
|                               CALMAP USER INTERFACE                             |
|  (Clean 2.5D Leaflet Canvas · Mobile First · 60fps · Zero Vendor Bloat)         |
+---------------------------------------------------------------------------------+
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
+─────────────────+          +─────────────────+          +─────────────────+
|   LEVEL 1 & 2   |          |   LEVEL 3 & 4   |          |   LEVEL 5 & 6   |
|  BASIC & TRAFFIC|          | ACTIVITY & EVENT|          | CAMERAS & ARGUS |
|  OSM + NDW XML  |          | Calm & Venues   |          | Public Webcams  |
+----------------─+          +─────────────────+          +─────────────────+
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
+---------------------------------------------------------------------------------+
|                    PRIVACY GATE & ANONYMIZATION ENGINE                          |
|  (k-Anonymity k>=5 · Spatial Cell >=250m · Time Window >=15m · Banded Outputs)  |
+---------------------------------------------------------------------------------+
                                      │
                                      ▼
+---------------------------------------------------------------------------------+
|                          DATA ADAPTER REGISTRY                                  |
|  (NDW Datex II · GTFS-RT · Open-Meteo · OpenStreetMap ODbL · ARGUS Lead DB)     |
+---------------------------------------------------------------------------------+
```

---

## 2. Progressive Disclosure Layer Matrix

| Layer ID | Name | Default State | Visual Representation | Data Source | Confidence & SLA |
|---|---|---|---|---|---|
| **L1** | **BASIC** | **ON** | Muted OpenStreetMap vector tiles, walking paths, parks | OpenStreetMap Contributors (ODbL) | 99.9% uptime |
| **L2** | **TRAFFIC** | **OFF** | Color-coded road vectors (Green: Fluid, Orange: Heavy, Red: Stagnant) | NDW (Nationaal Dataportaal Wegverkeer) Datex II XML | Live 1-minute updates |
| **L3** | **ACTIVITY** | **OFF** | Semi-transparent heat zones (Calm vs Active bands) | Aggregated Fusion Engine (`eye-of-argus/calm`) | Derived estimate (85%) |
| **L4** | **EVENTS** | **OFF** | Venue markers with attendee scale & schedule | GelreDome, Musis, Luxor Live public calendars | Published schedules |
| **L5** | **CAMERAS** | **OFF** | Camera icons with preview modal & stream link | Rijkswaterstaat & Gemeente Arnhem open webcams | Verified public feeds only |
| **L6** | **ARGUS LEADS** | **OFF** | Colored pins (🟥, 🟧, 🟨, 🟩) for local audited SMEs | ARGUS Local Intelligence Database | 95% Verified public signals |

---

## 3. Camera Security & Ethical Model

CalMap strictly adheres to Dutch and EU privacy standards regarding video feeds:
1. **No Private Feeds:** Never integrates private CCTV, security cameras, or non-public RTSP streams.
2. **Officially Published Public Webcams Only:** Sources are limited to traffic cameras explicitly published by Rijkswaterstaat for road monitoring and official city tourist cameras.
3. **Safe Interaction Flow:**
   - Tap Camera Pin $\rightarrow$ Displays modal with static low-res preview, camera operator name, official public URL, and timestamp.
   - User must explicitly click "Open External Stream" to launch the feed in a separate sandbox.
   - No facial recognition, plate scanning, or optical character recognition is performed.

---

## 4. Performance & Offline Resilience
- **Zero Runtime Bloat:** Uses lightweight Leaflet / Canvas instead of multi-megabyte 3D globes.
- **Offline Cache:** Cached GeoJSON boundaries and synthetic fallback fixtures ensure the application functions smoothly in network dead zones (e.g. inside thick brick historic buildings in Arnhem).
- **Sub-Second Render:** Total bundle size $< 200$ KB gzipped.
