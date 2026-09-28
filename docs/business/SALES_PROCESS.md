# AUX Design & ARGUS Sales Process & Pipeline Governance

**Locatie:** Arnhem, Gelderland  
**Beheerders:** Abraham Haddioui & Debbie  
**Versie:** 1.0 (September 2026)  

---

## 🔄 De 8 Fasen van de ARGUS Lead-Pipeline

In het master-werkboek `ARGUS_ARNHEM_LEADS.xlsx` (blad `PIPELINE`) wordt elke onderneming door een transparant 8-fasen proces geleid. Dit voorkomt dat kansen verloren gaan en waarborgt professionele opvolging.

```
[ 1. NEW ] 
    ↓
[ 2. TO_CONTACT ] (Geselecteerd op basis van route & prioriteit 🟥/🟧)
    ↓
[ 3. CONTACTED ] (Inloopbezoek door Debbie & Abraham, 1-pagina scan overhandigd)
    ↓
[ 4. MEETING ] (15-minuten toelichting of telefoongesprek met beslisser)
    ↓
    ├───────────→ [ 5. AUTHORIZED_AUDIT ] (Optioneel: diepte-onderzoek met schriftelijk mandaat)
    ↓                   ↓
[ 6. PROPOSAL ] (Vaste prijsopgave voor remediëring & hardening)
    ↓
[ 7. CUSTOMER ] (Oplevering binnen 48u, hercontrole via ARGUS, start beheerabonnement)
    ↓
[ 8. LOST ] (Respectvolle afronding, reden registreren, heractivatie na 6 maanden)
```

---

### Fase 1: NEW (Nieuw Geverifieerd)
- **Definitie:** De lead is automatisch geïdentificeerd via OpenStreetMap of lokale registers en heeft de complete, niet-invasieve ARGUS perimeterscan doorlopen.
- **Criteria:** Domein is gecontroleerd op bereikbaarheid, DNS (SPF/DMARC), TLS-certificaat en security headers. Er is een stabiele `company_id` toegekend.
- **Verantwoordelijke:** ARGUS Engine.

### Fase 2: TO_CONTACT (Gereed voor Bezoek)
- **Definitie:** De lead is gecategoriseerd met prioriteit 🟥 (urgent) of 🟧 (substantieel), ligt op de geplande wandelroute (bijv. Steenstraat of Bakkerstraat) en het 1-pagina rapport `PRINTABLE_REPORT.html` is geprint of geladen op de iPad.
- **Actie:** Debbie voegt de lead toe aan haar fysieke bezoeklijst voor die dag.

### Fase 3: CONTACTED (Bezocht / Eerste Contact)
- **Definitie:** Debbie en/of Abraham zijn binnengestapt, hebben de 30-seconden pitch gedaan en het rapport overhandigd aan de eigenaar of bedrijfsleider.
- **Registratie:** Datum, tijd en naam van de aangesproken persoon worden genoteerd in kolom J van het werkboek.

### Fase 4: MEETING (Afspraak Gepland)
- **Definitie:** De ondernemer toont interesse en heeft ingestemd met een kort vervolggesprek (10-15 minuten, live onder het genot van koffie of via de telefoon).
- **Voorbereiding:** Abraham inspecteert de specifieke DNS-records en bereidt de Before/After demonstratie voor.

### Fase 5: AUTHORIZED_AUDIT (Geautoriseerd Diepte-Onderzoek)
- **Definitie:** Alleen van toepassing indien de klant vraagt om een volledige penetratietest of broncode-audit van zijn interne systemen/webapplicatie.
- **STRIKT VEREIST:** Het ondertekende document `AUTHORIZED_AUDIT_HANDOFF.md` moet aanwezig zijn voordat enige invasieve scan plaatsvindt.

### Fase 6: PROPOSAL (Voorstel Verzonden)
- **Definitie:** Een helder voorstel met een vaste prijs (fixed price) en duidelijke deliverables conform de `SERVICES.md` catalogus is per e-mail verstuurd.
- **Garantie:** "Geen oplossing = geen factuur. Binnen 48 uur na akkoord opgeleverd met cryptografisch hertestbewijs."

### Fase 7: CUSTOMER (Klant Actief)
- **Definitie:** De configuratie (DMARC, SPF, HSTS, cookiebanner of SEO) is succesvol geïmplementeerd. De hercontrole met ARGUS is geslaagd en de klant ontvangt het oplevercertificaat.
- **Upsell:** Automatische overgang naar het maandelijkse monitoringabonnement (€49 - €149/mnd).

### Fase 8: LOST (Niet Geconverteerd)
- **Definitie:** Ondernemer geeft aan geen interesse te hebben of heeft een langlopend exclusief contract met een andere partij.
- **Registratie:** Reden noteren in het werkboek. Vriendelijk bedanken en archiveren voor een hercheck over 6 maanden.

---

## 🔒 Ethiek en Kwaliteitsborging
1. **Nooit opdringerig:** Als een ondernemer 'nee' zegt, respecteren we dat direct met een glimlach.
2. **Kennis delen loont:** Ook als een klant zijn eigen webbouwer inschakelt om ons rapport uit te voeren, heeft AUX Design een positieve reputatie opgebouwd als behulpzame lokale expert.
