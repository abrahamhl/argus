# ARGUS Operatie Maandag: Veldinstructie Abraham & Debbie

**Datum van Uitvoering:** Maandag 28 september 2026  
**Starttijd:** 08:30 uur  
**Locatie:** Arnhem Centrum & Sonsbeekkwartier  
**Teams:** Abraham Haddioui (Tech Lead & Demonstratie) & Debbie (Commercieel & Gesprekspartner)  
**Doelstelling:** 25-35 fysieke inloopbezoeken, 6-10 geïnteresseerde gesprekken, 2-4 afspraken/opdrachten voor snelle remediëring.  

---

## 🎒 Wat Moet Er Mee in de Tas?

1. **iPad / Laptop:**  
   - Geopend op het bestand `ARGUS_ARNHEM_LEADS.xlsx` (tabblad `SALES` en `PIPELINE`).
   - Lokale kopie van de ARGUS Web Radar en Field CLI (`pnpm run field`).
2. **Geprinte QuickScan Rapporten (Mapje van Debbie):**  
   - Uitgeprinte exemplaren van `PRINTABLE_REPORT.html` uit de map `reports/` voor de top 15-20 rode (🟥) en oranje (🟧) leads.
   - Visitekaartjes van AUX Design (contact: abraham@auxdesign.nl).
3. **Kleding & Uitstraling:**  
   - Smart casual. Professioneel, benaderbaar en lokaal. Geen stijve pakken, geen hacker-hoodies.

---

## ⏰ Tijdschema & Wandelroutes in Arnhem

```
08:30 - 09:15 │ Kick-off & briefing bij een koffietent (bijv. Bakkerstraat)
09:30 - 12:30 │ Route 1: Winkels & Horeca (Steenstraat, Bakkerstraat, Korenmarkt)
12:30 - 13:30 │ Lunch & Status bijwerken in PIPELINE (bijv. Bar Florian of Stadsvilla)
13:30 - 16:30 │ Route 2: Zakelijk, Advocatuur & Zorg (Willemsplein, Velperweg, Hommelseweg)
16:30 - 17:30 │ Evaluatie & directe e-mail/WhatsApp follow-ups versturen
```

### Route 1: Ochtend (09:30 - 12:30) · Retail & Horeca
- **Steenstraat & Bakkerstraat:**
  - *The Fade Studio* (Nieuwstad 10) · 🟥 100/100 · Geen DMARC (€495)
  - *Bakkerij Koenen / Bakker Hilvers* · 🟥 75/100 · DMARC p=none + geen HSTS (€495)
  - *CycleDreams / Scalabikes* · 🟥 85/100 · DMARC + geen belknop op mobiel (€390)
- **Korenmarkt & Jansplein:**
  - *Bar Florian* (Jansplein 59) · 🟥 85/100 · DMARC ontbreekt + trackers actief (€495)
  - *Batavia Restaurant* (Willemsplein 31) · 🟥 85/100 · DMARC + HSTS (€495)
  - *Flor Fina* (Korenmarkt 42) · 🟧 75/100 · HSTS + trackers zonder banner (€450)

### Route 2: Middag (13:30 - 16:30) · Zakelijk, Klinieken & Vastgoed
- **Willemsplein & Velperweg:**
  - *Makelaar Van Ek Garantiemakelaars* (Willemsplein 29) · 🟥 85/100 · DMARC p=none (€750)
  - *Boga Administratiekantoor* · 🟥 85/100 · DMARC ontbreekt (€495)
  - *Hotel Centraal* (Koningstraat 6) · 🟥 95/100 · DMARC ontbreekt (€495)
- **Sonsbeek & Hommelseweg:**
  - *Stadsvilla Sonsbeek* (Tellegenlaan 3) · 🟥 85/100 · DMARC ontbreekt (€495)
  - *The Hair Hub* (Ir. J.P. van Muijlwijkstraat 350) · 🟥 90/100 · DMARC p=none (€495)
  - *Huisartsenpraktijk Mir* (Arnhem Noord) · 🟥 80/100 · Zorg DMARC & privacy (€650)

---

## 🎯 De Gesprekstechniek: "Laat Debbie Openen"

1. **Debbie stapt als eerste naar voren:**  
   Vrouwelijke, vriendelijke aanwezigheid verlaagt de verdediging van winkeliers en receptionistes onmiddellijk.  
   *"Goedemiddag! Wij zijn van AUX Design hier uit Arnhem Centrum. We doen vandaag een ronde langs ondernemers in de [straatnaam] om gratis onze nieuwste digitale perimetercheck te overhandigen."*
2. **Geef het geprinte rapport fysiek in handen van de ondernemer:**  
   Mensen kunnen het niet laten om naar hun eigen bedrijfsnaam en website op papier te kijken.
3. **Wijs met de pen op het rode aandachtsicoon (🟥):**  
   *"Kijk, hier ziet u het: uw website draait prima, maar uw e-mailadres heeft nog geen DMARC-slot. Iedereen kan op dit moment een nepfactuur sturen die eruitziet alsof hij van uw bedrijf komt."*
4. **Abraham bevestigt rustig en technisch:**  
   Als de ondernemer vraagt: *"Hoe hebben jullie dit gevonden?"* antwoordt Abraham:  
   *"Dit staat gewoon in het openbare internetadresboek (DNS). We hebben niets gehackt. We hebben alleen gekeken wat de hele wereld kan zien. Wij kunnen dit binnen 48 uur voor u dichttimmeren voor een vaste prijs van €495."*
5. **De Sluitvraag:**  
   *"Heeft u komende woensdag 10 minuten voor een korte telefonische toelichting, of mogen we dit rapport hier achterlaten voor uw webbeheerder?"*

---

## 💰 Snelle Prijs-Spiekbrief voor Onderweg

- **Alleen E-mailslot (DMARC + SPF):** **€ 495** (eenmalig, 48u garantie)
- **Horeca & Winkel Quick Fix (DMARC + Mobiele Belknop + Headers):** **€ 390** (eenmalig)
- **Zorg & Juridisch All-In (DMARC + HSTS + AVG Privacy):** **€ 750** (eenmalig)
- **Maandelijks Onderhoud & Monitoring (ARGUS SLA):** **€ 49 - € 149 / maand**

---

## 📞 Noodnummers & Ondersteuning
- **Tech Lead & Live Verificatie:** Abraham Haddioui (`abraham@auxdesign.nl`)
- **Master Excel Dossier:** `ARGUS_ARNHEM_LEADS.xlsx` in de hoofdmap van ARGUS.
- **Snelle CLI op de laptop:** `pnpm run field --company <naam>`
