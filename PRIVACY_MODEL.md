# CalMap & ARGUS Privacy Model & Ethical Safeguards

**System:** CalMap Situational Awareness & ARGUS Lead Intelligence  
**Compliance Standard:** General Data Protection Regulation (GDPR / AVG) & Privacy by Design (ISO/IEC 27701)  
**Lead Privacy Engineer:** Abraham Haddioui · AUX Design Arnhem  
**Version:** 2.0 (September 2026)  

---

## 1. Absolute Technical Prohibitions

The following capabilities are **HARD-CODED AS PROHIBITED** and blocked by policy gates in both CalMap and ARGUS:

- ❌ **No Individual Tracking:** The system cannot track, store, or display the movement or location of any individual person.
- ❌ **No Device Fingerprinting or Sniffing:** No collection of MAC addresses, IMSI, IMEI, Bluetooth beacons, or advertising identifiers.
- ❌ **No Private Camera Ingestion:** Strictly no access to private, residential, or commercial CCTV feeds.
- ❌ **No Facial Recognition or Biometrics:** Video feeds are never processed through facial recognition, gait analysis, or automated re-identification models.
- ❌ **No Secret Execution or Credential Validation:** Discovered API tokens in public frontend code are masked and never tested against upstream APIs.
- ❌ **No Through-Wall or Interior Sensing:** The system strictly models public outdoor spaces.

---

## 2. The Formal Release Gate (`src/argus/privacy/gate.js`)

Before any situational or human context data is exported or visualized on CalMap, it must pass through the **Formal Release Gate**. Any payload violating the release criteria is discarded as `SUPPRESSED`.

```
                    Raw Observation / Telemetry
                                │
                                ▼
        ┌────────────────────────────────────────────────┐
        │               PRIVACY FILTER GATE              │
        │                                                │
        │  1. Spatial Resolution >= 250m?                │
        │  2. Temporal Window >= 15 minutes?             │
        │  3. Cohort Count >= k (k=5)?                   │
        │  4. Contains Device or Personal Identifiers?   │
        └────────────────────────────────────────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
            [ FAILS ]                     [ PASSES ]
                 │                             │
                 ▼                             ▼
          SUPPRESSED                      RELEASED
       (Discard Payload)            (Convert to Coarse Band:
                                     LOW / MODERATE / HIGH /
                                     VERY HIGH - Never Counts!)
```

### Invariants Enforced by Mathematical Bounds:
1. **$k$-Anonymity ($k \ge 5$):** If fewer than 5 people/entities contribute to a spatial cell, the cell value is suppressed to prevent singling out.
2. **Coarse Spatial Cells ($\ge 250$ meters):** High-precision GPS coordinates are aggregated into coarse geographical polygons.
3. **Banded Categorization Only:** The user interface displays only qualitative activity bands (`LOW`, `MODERATE`, `HIGH`, `VERY HIGH`), never numerical headcounts.
4. **Differential Privacy Budgeting:** An in-memory privacy budget bounds query frequency per cell to mitigate reconstruction attacks.

---

## 3. ARGUS Public Lead Intelligence Boundary

When performing public website scans for local businesses:
1. **Only Publicly Observable Assets:** Normal HTTP GET/HEAD requests to publicly linked pages and public DNS lookups.
2. **Conservative Secret Handling:** Any potential API key (e.g. Google Maps key) is masked immediately (e.g. `AIza••••••Q2F`). It is categorized as `POTENTIAL PUBLIC CREDENTIAL EXPOSURE` and never marked as "COMPROMISED" without explicit authorization.
3. **Defensive Privacy Reporting:** Automated scans never declare a website "illegal" or in "violation of GDPR". Reports state: *"Potential compliance gap - Requires legal/human verification"*.
4. **Client Data Confidentiality:** Scanned lead data, private sales notes, and contact phone numbers are stored locally and never published to public git repositories.
