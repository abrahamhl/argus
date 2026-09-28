# CalMap & ARGUS Data Sources & Open Data Governance

**Project:** CalMap Situational Awareness & ARGUS Lead Intelligence  
**Geographic Coverage:** Arnhem & Gelderland, The Netherlands  
**Status:** 100% Lawful, Public, and Permitted Open Data Sources  
**Version:** 1.0 (September 2026)  

---

## 1. Inventory of Data Sources

| Source Name | Providing Authority | Data Type | Transport / Format | License | Update Cadence | Fallback Strategy |
|---|---|---|---|---|---|---|
| **Nationaal Dataportaal Wegverkeer (NDW)** | Ministerie van Infrastructuur en Waterstaat | Live traffic speed, flow intensity, road closures | Datex II XML / REST | CC0 1.0 (Public Domain Dedication) | 1 min | Cached XML fixture (`ndw-speed-intensity.arnhem.xml`) |
| **OpenStreetMap (OSM)** | OpenStreetMap Foundation | Roads, buildings, parks, shops, amenities | Overpass API / Vector Tiles | ODbL 1.0 (Open Database License) | Daily / Static | Local GeoJSON boundaries |
| **Open-Meteo Weather** | Open-Meteo GmbH | Temperature, wind, precipitation, solar | REST JSON | CC BY 4.0 | 15 min | Stored hourly weather model |
| **GTFS Public Transit** | DOVA (Decentrale Openbaar Vervoer Autoriteiten) | Bus, trolleybus, train schedules & delay signals | GTFS-RT Protobuf / CSV | CC0 1.0 | 30 sec | Scheduled timetable cache |
| **Rijkswaterstaat Webcams** | Rijkswaterstaat (RWS) | Public highway traffic camera snapshots (A12, A50, A325) | HTTPS JPEG / HLS | Open Data Rijksoverheid | 1 min | Static placeholder thumbnail |
| **Arnhem Public Events** | Gemeente Arnhem & Venues (GelreDome, Musis, Luxor Live) | Event schedules, attendee scale estimates | Public iCal / RSS | Public Domain / Fair Use | Daily | Curated venue schedule fixture |
| **ARGUS Lead Database** | AUX Design Perimeter Scanner | Public DNS, headers, TLS, SEO & compliance signals | JSON / SQLite / XLSX | Proprietary Internal Sales DB | Per scan cycle | Verified historical scan |

---

## 2. Ingestion Protocols & Technical Handling

### A. NDW Traffic Flow (Datex II XML)
- **Endpoint:** `https://opendata.ndw.nu/`
- **Adapter:** `eye-of-argus/src/argus/sources/ndw.js`
- **Normalization:** Converts speed values (km/h) and intensity (vehicles/hour) across measurement sites on the John Frostbrug, Nelson Mandelabrug, and Plein 1944 into 3 normalized flow states:
  - `FLUID`: Flow ratio $\ge 0.85$ (Green)
  - `MODERATE`: Flow ratio $0.50 - 0.84$ (Orange)
  - `CONGESTED`: Flow ratio $< 0.50$ (Red)

### B. Public Traffic Cameras
- **Selection Criteria:** Only cameras designated for public traffic dissemination by official transport authorities.
- **Handling:** Images are rendered directly from public URLs in sandboxed frames. No images are archived or analyzed with biometric recognition algorithms.

### C. OpenStreetMap Dutch POIs
- **Query:** Filtered for independent local establishments in Arnhem (postal code 6800-6846).
- **Attribution:** Prominently displays: *"© OpenStreetMap contributors"* in all map footers.

---

## 3. Strict Prohibitions & Excluded Datasets

The following data categories are **EXPLICITLY REJECTED**:
- ❌ Private or commercial CCTV / doorbell cameras (Ring, Nest, private RTSP streams).
- ❌ Automatic Number Plate Recognition (ANPR) law enforcement feeds.
- ❌ Mobile device location telemetry, advertising IDs (IDFA/GAID), or Wi-Fi probe sniffers.
- ❌ Individual person tracking, facial recognition, or social media scrapers.
- ❌ Datasets with restrictive non-commercial licenses (e.g. CC BY-NC) in production commercial deployments.
