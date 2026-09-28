# CalMap UX Decisions & Progressive Disclosure Design System

**Project:** CalMap Situational Awareness Engine  
**Target User:** Abraham & Debbie in the field, Dutch municipal stakeholders, local SME owners  
**Lead Designer:** AUX Design Arnhem  
**Version:** 2.0 (Redesign from Eye-of-God Complexity)  

---

## 1. Executive Summary: Why the Eye-of-God UX Failed

The inherited `gods-eye-view` interface suffered from acute UX pathology:
1. **The "Video Game / Hollywood" Trap:** High-contrast dark neon HUDs with rotating satellite trajectories, radar sweep animations, and pseudo-military terminology.
2. **Extreme Cognitive Overload:** 14 different uncontrolled layers turned on simultaneously, obscuring roads and landmarks.
3. **Severe Hardware Exclusions:** Required WebGL2 / 3D Cesium capabilities that overheated smartphones and crashed mid-range tablets in the field.
4. **Poor Field Usability:** Debbie and Abraham walking down Steenstraat on a sunny morning could not read dark gray text on black backgrounds.

---

## 2. The Core Design Principles of CalMap

### Principle 1: Calm by Default (Daylight Optimized)
The default state of CalMap is a clean, crisp, high-legibility street map of Arnhem. Roads, park boundaries (Sonsbeek), and water bodies (the Nederrijn) are immediately recognizable.

### Principle 2: Progressive Disclosure (The 6 Tiers)
Users are never forced to navigate complex intelligence feeds at once. Information is disclosed in structured, logical layers:

```
[ Tier 1: BASIC ]       OpenStreetMap streets, pedestrian paths, green spaces
        ↓
[ Tier 2: TRAFFIC ]     Live arterial flow (NDW XML): Green / Orange / Red road corridors
        ↓
[ Tier 3: ACTIVITY ]    Human context & calm areas: Banded density heat zones
        ↓
[ Tier 4: EVENTS ]      Cultural & sports hubs (GelreDome, Musis, Luxor Live)
        ↓
[ Tier 5: CAMERAS ]     Officially published public traffic webcams (with preview modal)
        ↓
[ Tier 6: TECHNICAL ]   ARGUS audited commercial leads (🟥, 🟧, 🟨, 🟩 pins)
```

---

## 3. Interaction Patterns

### A. The Camera Pin Flow
To guarantee transparency and user agency:
1. **Pin Click:** Displays a lightweight bottom drawer or modal with:
   - Official Camera Name (e.g. `RWS A12 KP Velperbroek`)
   - Operator & Authority (`Rijkswaterstaat`)
   - Static low-res thumbnail snapshot
   - Timestamp and Public Availability status
2. **Explicit User Action:** Video feeds are NEVER auto-played. The user must tap: `[ 📹 Bekijk Publieke Live-Stream ]` to open the stream.

### B. The ARGUS Business Lead Overlay Flow
Designed for Abraham & Debbie on the street:
1. User activates Tier 6: **ARGUS LEADS**.
2. Map pins appear on actual Arnhem addresses:
   - 🟥 Red pins: Urgent high-value opportunity (missing DMARC, active pre-consent trackers)
   - 🟧 Orange pins: Substantial opportunity (missing headers, SEO gaps)
   - 🟩 Green pins: Well-hardened / healthy websites
3. Tapping a pin opens the **10-Second Field Card**:
   - Business name, address, category
   - Primary problem in 1 sentence
   - Debbie's Dutch pitch to say out loud
   - Recommended AUX service and fixed price (€195 - €495)
   - Direct button: `[ 📄 Open 1-Pagina Printversie ]`

### C. Mobile & Tablet Ergonomics
- **48px Minimum Touch Targets:** All buttons, layer toggles, and pins adhere to WCAG AAA touch target sizes.
- **Thumb-Zone Navigation:** Layer controls and drawer panels are positioned in the lower third of the screen for one-handed thumb interaction while walking.
- **Offline & Low-Bandwidth Mode:** Clear offline banner appears when connection drops; cached street maps and fixtures continue to render seamlessly.
