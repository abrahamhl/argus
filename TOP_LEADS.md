# ARGUS Arnhem Top Leads · Maandag Veldlijst

**Geanalyseerd door:** ARGUS Autonomous Lead Intelligence  
**Auditor:** AUX Design Arnhem (Abraham Haddioui & Debbie)  
**Selectiecriterium:** Hoge zekerheid (95-100%), fysieke deuren in Arnhem Centrum/Noord/Zuid, direct aantoonbare en repareerbare problemen, duidelijke zakelijke waarde.  
**Totaal aantal gekwalificeerde leads:** 84 actieve bedrijven (waarvan 40 🟥 Urgent en 47 🟧 Substantieel).  

---

## 🗺️ Route 1: Binnenstad & Korenmarkt / Jansplein (Horeca & Retail)

### 1. Bar Florian
- **Adres:** Jansplein 59, Arnhem Centrum
- **Domein:** `bar-florian.nl` | Status: 200 OK | Score: **85/100 🟥**
- **Waarneembaar probleem:**
  1. Geen DMARC-beleid in DNS (e-mails vanuit `@bar-florian.nl` zijn vatbaar voor nabootsing).
  2. Geen HSTS / CSP headers.
  3. Google Tag Manager en Analytics actief zonder zichtbare cookiebanner (pre-consent tracking).
- **Zakelijk risico:** Zakelijke partijen of leveranciers kunnen misleid worden door e-mailspoofing; mogelijke vragen over privacy van reserveringen.
- **Ons voorstel:** *Horeca Veiligheid & E-mailslot (€495 eenmalig + €49/mnd)*
- **Debbie Praatkaart:** *"Op het Jansplein zit u altijd vol met terrasgasten. We zagen online dat uw e-mailadres nog niet op slot zit tegen namaakfacturen en de website nog geen moderne HSTS-beveiliging heeft. We kunnen dit binnen 48 uur netjes voor u instellen."*

### 2. Batavia Restaurant
- **Adres:** Willemsplein 31, Arnhem
- **Domein:** `batavia-restaurant.nl` | Status: 200 OK | Score: **85/100 🟥**
- **Waarneembaar probleem:** Ontbrekend DMARC-record, geen HSTS, geen framing-bescherming (Clickjacking).
- **Ons voorstel:** E-mail Authenticatie & Websiteverharding (€495 eenmalig).
- **Debbie Praatkaart:** *"Goedemiddag! Veel gasten reserveren via uw site bij het Willemsplein. We hebben een gratis 1-pagina check gedaan van de internetveiligheid en zagen een paar kleine instellingen die uw webbouwer eenvoudig aan kan zetten."*

### 3. First Eet & Chazzz! Food
- **Adres:** Markt 27 & Markt 31, Arnhem
- **Domeinen:** `first-eet.nl` / `chazzzfood-arnhem.nl` | Score: **85/100 🟥**
- **Waarneembaar probleem:** Ontbrekend DMARC-record, geen HSTS, ontbrekende meta-omschrijving in Google.
- **Ons voorstel:** Lokale SEO & E-mail Beveiliging (€390 eenmalig).

---

## 🗺️ Route 2: Steenstraat / Spijkerkwartier / Sonsbeek (Winkels & Gastvrijheid)

### 4. Stadsvilla Sonsbeek
- **Adres:** Tellegenlaan 3, Arnhem (Park Sonsbeek)
- **Domein:** `stadsvillasonsbeek.nl` | Status: 200 OK | Score: **85/100 🟥**
- **Waarneembaar probleem:**
  1. Geen DMARC-beleid tegen e-mail spoofing (groot risico voor een high-end trouw- en evenementenlocatie met hoge factuurbedragen).
  2. Marketingtrackers actief zonder voorafgaande toestemmingsbanner.
  3. Geen directe klikbare privacyverklaring in de footer.
- **Zakelijk risico:** Bruidsparen en zakelijke evenementenorganisatoren betalen grote voorschotten per factuur. Een spoofing-aanval met gewijzigde IBAN-gegevens is desastreus voor de reputatie.
- **Ons voorstel:** *Evenementen & Horeca Vertrouwenspakket (€495 eenmalig + €79/mnd)*
- **Debbie Praatkaart:** *"Stadsvilla Sonsbeek is een icoon in Arnhem. Omdat u grote evenementen en huwelijken factureert, is het cruciaal dat niemand uw e-mailadres kan nabootsen voor valse facturen. In uw openbare DNS ontbreekt momenteel het officiële DMARC-slot. Wij lossen dit binnen 48 uur op."*

### 5. The Fade Studio & The Hair Hub
- **Adres:** Nieuwstad 10 / Ir. J.P. van Muijlwijkstraat 350, Arnhem
- **Domeinen:** `thefadestudio.nl` (Score: **100/100 🟥**) / `thehairhub.nl` (Score: **90/100 🟥**)
- **Waarneembaar probleem:** Ontbrekend of zwak DMARC, geen HSTS, geen directe mobiele belknop.
- **Ons voorstel:** Winkel & Salon Quick Fix (€350 eenmalig).

### 6. Arnhems Proeflokaal
- **Adres:** Spijkerstraat 3, Arnhem
- **Domein:** `arnhemsproeflokaal.nl` | Score: **85/100 🟥**
- **Waarneembaar probleem:** Ontbrekend DMARC-record, geen HSTS, ontbrekende meta-description.
- **Ons voorstel:** Lokale Vindbaarheid & E-mailslot (€390 eenmalig).

---

## 🗺️ Route 3: Zakelijke Dienstverlening, Makelaars & Klinieken

### 7. Makelaar Van Ek Garantiemakelaars BV
- **Adres:** Willemsplein 29, Arnhem
- **Domein:** `vanekgarantiemakelaars.nl` | Score: **85/100 🟥**
- **Waarneembaar probleem:** DMARC staat op passief monitoringbeleid (`p=none`), trackers actief, ontbrekende HSTS.
- **Zakelijk risico:** Woningkopers en verkopers die betalingen en waarborgsommen regelen.
- **Ons voorstel:** *Vastgoed Anti-Spoofing & AVG Hardening (€750 eenmalig)*

### 8. Huisartsenpraktijk Mir & Mondzorgcentrum Arnhem
- **Adres:** Arnhem Noord / Hommelseweg
- **Domein:** `huisartsenpraktijk-mir.praktijkinfo.nl` / `mzcarnhem.nl` | Score: **80/100 🟥**
- **Waarneembaar probleem:** Ontbrekend DMARC-record, ontbrekende privacyverklaring koppeling, serverheader openbaar.
- **Zakelijk risico:** Medische gegevens en patiëntvertrouwelijkheid vereisen strikte zorgvuldigheid.
- **Ons voorstel:** *Zorg & Praktijk Veiligheidspakket (€650 eenmalig + €119/mnd)*

---

## 📊 Overzichtstabel Top Leads voor Debbie's Map

| Bedrijf | Straat | Categorie | Hoofdprobleem | Aanbevolen Dienst | Prijs | Status |
|---|---|---|---|---|---|---|
| **The Fade Studio** | Nieuwstad 10 | Retail & Kapper | Geen DMARC slot | E-mail Authenticatie | €495 | TO_CONTACT |
| **Hotel Centraal** | Koningstraat 6 | Horeca / Zakelijk | Geen DMARC | E-mailslot + Headers | €495 | TO_CONTACT |
| **Stadsvilla Sonsbeek** | Tellegenlaan 3 | High-end Horeca | Factuurfraude risico (DMARC) | Vertrouwenspakket | €495 | TO_CONTACT |
| **Bar Florian** | Jansplein 59 | Horeca / Terras | DMARC + Trackers | Horeca Quick Fix | €495 | TO_CONTACT |
| **Batavia** | Willemsplein 31 | Restaurant | DMARC + Geen HSTS | Web Security Hardening | €495 | TO_CONTACT |
| **Makelaar Van Ek** | Willemsplein 29 | Makelaardij | Passief DMARC (p=none) | Vastgoed Anti-Spoofing | €750 | TO_CONTACT |
| **First Eet** | Markt 27 | Horeca / Lunch | DMARC + SEO meta | Lokale Vindbaarheid | €390 | TO_CONTACT |
| **Huisartsenpraktijk Mir**| Arnhem Noord | Gezondheidszorg | DMARC + Zorg AVG | Zorg Veiligheidspakket | €650 | TO_CONTACT |

*Alle bijbehorende 1-pagina QuickScans liggen klaar in `reports/<company-id>/PRINTABLE_REPORT.html` om direct te printen of op de tablet te tonen.*
