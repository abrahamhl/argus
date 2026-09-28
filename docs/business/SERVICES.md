# AUX Design Commercial Service Catalog & ARGUS Lead Solutions

**Bedrijf:** AUX Design (Arnhem, Nederland)  
**Lead Intelligence Systeem:** ARGUS Automated Perimeter Scanner  
**Doelgroep:** MKB / KMO in Arnhem en Gelderland (Retail, Horeca, Zakelijke Dienstverlening, Zorg, Juridisch)  
**Datum:** September 2026  

---

## 🪜 De ARGUS Waardeladder (Service Ladder)

Onze commerciële strategie is gebaseerd op een laagdrempelige instap met aantoonbare, direct begrijpelijke waarde, opgebouwd in duidelijke stappen:

```
[ Niveau 6: Periodiek Beheer & Monitoring ] €49 - €180 / maand
                      ↑
[ Niveau 5: Volledige Geautoriseerde Audit ] €1.200 - €2.500 (Alleen met schriftelijke toestemming)
                      ↑
[ Niveau 4: Privacy & Cookie Compliance ] €450 - €750
                      ↑
[ Niveau 3: Web Security Hardening ] €350 - €650
                      ↑
[ Niveau 2: E-mail Beveiliging & Anti-Spoofing ] €195 - €495
                      ↑
[ Niveau 1: Gratis Publieke Perimeter QuickScan ] €0 (Walk-in demo / 1-pagina rapport)
```

---

## 1. Gratis Publieke Perimeter QuickScan (Introductie)
- **Doel:** Binnen 30 seconden het ijs breken bij een lokaal bezoek door Abraham en Debbie.
- **Prijs:** **€ 0,00** (Kosteloos en vrijblijvend).
- **Inhoud:**
  - 1-pagina geprint rapport met de actuele perimeterscore van het bedrijf.
  - Objectieve weergave van publiek zichtbare DNS-, e-mail- en webinstellingen.
  - Geen angstzaaierij; focus op concrete bescherming en lokale vindbaarheid.
- **Klantwaarde:** De ondernemer ziet direct dat er lokale aandacht is besteed aan zijn specifieke situatie zonder verkooppraatjes.

---

## 2. E-mail Authenticatie & Anti-Spoofing (SPF, DKIM, DMARC)
- **Service ID:** `AUX-SEC-EMAIL-TRUST`
- **Prijsindicatie:** **€ 195 (basis) – € 495 (uitgebreid met rapportage-inbox)**
- **Doorlooptijd:** 2 tot 4 werkuren (binnen 48 uur opgeleverd).
- **Probleemstelling:**
  - Geen of zwak DMARC-record (`p=none`), waardoor iedereen uit naam van het domein e-mails kan verzenden (factuurfraude / CEO-fraude).
- **Wat wij leveren:**
  1. Volledige inventarisatie van legitieme verzendkanalen (Google Workspace, Microsoft 365, Mailchimp, webshop, facturatiesoftware).
  2. Aanmaken van een strikt SPF-record (`-all`).
  3. Implementatie van een officieel DMARC-record met overgang naar `p=quarantine` of `p=reject`.
  4. Inrichting van geautomatiseerde rapportage-opvang voor fraudepogingen.
  5. Cryptografische ARGUS Before/After verificatie.
- **Klantvoordeel:** Garandeert dat banken en cliënten nooit worden misleid door nepfacturen namens het bedrijf, en voorkomt dat legitieme offertes in de spambox belanden.

---

## 3. Website Beveiligingsverharding (HTTP Headers & SSL/TLS)
- **Service ID:** `AUX-SEC-WEB-HARDENING`
- **Prijsindicatie:** **€ 350 – € 650**
- **Doorlooptijd:** 3 tot 5 werkuren.
- **Probleemstelling:**
  - Ontbreken van essentiële beschermende headers: HSTS (Strict-Transport-Security), Content-Security-Policy (CSP), X-Frame-Options (Clickjacking) en Server Banner Disclosure.
- **Wat wij leveren:**
  1. Configuratie van HSTS met preload-geschiktheid op webserver of CDN (Cloudflare, Nginx, Apache).
  2. Inrichten van clickjacking-protectie (`X-Frame-Options: SAMEORIGIN` of CSP `frame-ancestors`).
  3. Verwijderen van gevoelige serverversiebanners (`Server: Apache/2.4...`, `X-Powered-By: PHP...`).
  4. Veilige MIME-type afdwinging (`X-Content-Type-Options: nosniff`).
  5. Opleveringsrapport met herkeuring via ARGUS.
- **Klantvoordeel:** Voorkomt afluisteren op openbare wifi, weert clickjacking-misleiding en voldoet aan moderne browserveiligheidseisen.

---

## 4. Privacy & Cookie Compliance Inrichting (AVG / GDPR)
- **Service ID:** `AUX-PRIV-COOKIE-COMPLIANCE`
- **Prijsindicatie:** **€ 450 – € 750**
- **Doorlooptijd:** 4 tot 6 werkuren.
- **Probleemstelling:**
  - Marketing- en analysetrackers (Google Analytics, Meta Pixel, Hotjar) worden ingeladen vóórdat de bezoeker toestemming heeft gegeven in een cookiebanner, of de privacyverklaring ontbreekt/is verouderd.
- **Wat wij leveren:**
  1. Installatie en configuratie van een professionele, conforme cookie management banner (bijv. Complianz of Cookiebot).
  2. Koppeling van scripts zodat tracking pas start ná expliciete toestemming (opt-in conform AVG).
  3. Aanmaken/updaten van een duidelijke cookieverklaring en footerlink naar de privacyverklaring.
  4. Verificatie dat vooraf geen niet-noodzakelijke cookies worden geplaatst.
- **Klantvoordeel:** Gemoedsrust voor de ondernemer; voorkomt reputatieschade en klachten van privacybewuste consumenten of instanties.

---

## 5. Lokale Vindbaarheid & Conversie Optimalisatie (SEO & Mobile)
- **Service ID:** `AUX-SEO-CONVERSION`
- **Prijsindicatie:** **€ 350 – € 550**
- **Doorlooptijd:** 3 tot 5 werkuren.
- **Probleemstelling:**
  - Geen meta-omschrijving in Google (Google toont willekeurige paginaflarden), ontbrekende structured data (openingstijden, adres) en geen klikbare telefoon-/e-mailknoppen op mobiel.
- **Wat wij leveren:**
  1. Toevoegen van professionele, conversiegerichte meta-titels en meta-descriptions voor de belangrijkste pagina's.
  2. Implementatie van Schema.org JSON-LD structured data (LocalBusiness markup met adres, telefoon, openingstijden en geo-coördinaten).
  3. Toevoegen van directe mobiele contactknoppen (`tel:` en `mailto:`) in de header en mobiele menubalk.
  4. Controle op gebroken interne links.
- **Klantvoordeel:** Direct meer aanvragen en telefoontjes van mobiele bezoekers in Arnhem die via Google zoeken.

---

## 6. Volledige Geautoriseerde Technische Web-Audit (Diepte-onderzoek)
- **Service ID:** `AUX-AUDIT-DEEP-AUTHORIZED`
- **Prijsindicatie:** **€ 1.200 – € 2.500**
- **Voorwaarde:** **STRIKT ALLEEN NA ONDERTEKENING VAN DE GEAUTORISEERDE OPDRACHTOVEREENKOMST.**
- **Doorlooptijd:** 3 tot 5 werkdagen.
- **Wat wij leveren:**
  1. Geautoriseerde diepte-audit van webapplicaties, formulieren, authenticatie en API-endpoints.
  2. Uitgebreide broncode- en afhankelijkhedeninspectie (npm, plugins, CMS updates).
  3. Directe hands-on remediëring van kritieke bevindingen in overleg met de webmaster.
  4. Uitvoerig directierapport met risicoclassificatie conform OWASP Top 10.

---

## 7. Doorlopend Veiligheids- & Vindbaarheidsabonnement (SLA)
- **Service ID:** `AUX-RETAINER-MONITOR`
- **Prijsindicatie:** **€ 49 – € 180 per maand** (maandelijks opzegbaar)
- **Inhoud:**
  - Maandelijkse ARGUS herhaalde perimeterscan (detectie van verlopen SSL, DNS-wijzigingen of plotselinge headerfouten).
  - 24/7 uptime monitoring met SMS/e-mail waarschuwing bij uitval.
  - 1 tot 2 uur per maand inbegrepen support voor snelle updates of kleine wijzigingen.
  - Kwartaaloverzicht voor de directie.
- **Klantvoordeel:** Geen zorgen meer over webtechniek; AUX Design fungeert als externe IT- en webbeveiligingsafdeling voor een fractie van de kosten van intern personeel.
