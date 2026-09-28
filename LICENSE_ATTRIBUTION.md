# CalMap & ARGUS License Attribution & Provenance Register

**Document Version:** 1.0  
**Compliance Standard:** Open Source Software Integrity & Anti-License Laundering  
**Lead Maintainer:** Abraham Haddioui · AUX Design Arnhem  

---

## 1. Upstream & Donor Provenance

This codebase and architecture cleanly differentiate original contributions, donor concepts, and third-party dependencies.

### A. Core Derivative Base: `eye-of-argus` / `gods-eye-view`
- **Canonical Upstream:** `bilawalsidhu/gods-eye-view`
- **License:** **MIT License** (Copyright © 2026 Bilawal Sidhu)
- **Modifications:** The complex 3D Cesium globe and militaristic HUD was stripped. Replaced with lightweight, human-centered Leaflet/Canvas 2.5D architecture.
- **Attribution Notice:**
  ```text
  Portions of the situational awareness concepts are derived from gods-eye-view,
  licensed under the MIT License. Copyright (c) 2026 Bilawal Sidhu.
  ```

### B. Conceptual Donor: `calmpath-maps-pro`
- **Origin:** `abrahamhl/calmpath-maps-pro` (Internal Project)
- **Donation Scope:** Environmental scoring algorithms, calm path routing weights, and UI design patterns.
- **License:** MIT / AUX Design Proprietary Dual License.

### C. Lead Intelligence Core: `ARGUS`
- **Origin:** `abrahamhl/argus` (Internal Core Workspace)
- **License:** **ISC License** (for OSS core packages) / **Proprietary Commercial** (for customer lead lists & sales playbooks).
- **Invariants:** Signal $\rightarrow$ Evidence $\rightarrow$ Finding $\rightarrow$ Opportunity pipeline.

---

## 2. Third-Party Data & Component Licensing

| Component / Library | Publisher / Maintainer | Declared License | Obligation Satisfied |
|---|---|---|---|
| **Leaflet / Canvas** | Vladimir Agafonkin | BSD 2-Clause | Copyright notice preserved |
| **OpenStreetMap Data** | OpenStreetMap Foundation | ODbL 1.0 | Attribution link embedded on all map views |
| **Open-Meteo Weather** | Open-Meteo GmbH | CC BY 4.0 | Attribution text present in weather overlay |
| **NDW Traffic Feeds** | Nationaal Dataportaal Wegverkeer | CC0 1.0 (Public Domain) | Free for commercial and non-commercial reuse |
| **ExcelJS** | Guyon Roche | MIT License | Embedded in dependency graph |
| **Zod Schema Engine** | Colin McDonnell | MIT License | Standard permissive reuse |

---

## 3. Strict Anti-License Laundering Policy

1. **No License Laundering:** Upstream non-commercial datasets (such as CC BY-NC submarine cable feeds or academic research datasets) are **EXCLUDED** from the commercial deployment profile (`COMMERCIAL_SAFE`).
2. **Proprietary Isolation:**
   - Public OSS tools (scanners, schemas, map engines) are openly distributable.
   - Private commercial data (customer lead notes, Abraham & Debbie's field notes, client reports) are strictly protected in `.gitignore` and local private storage.
