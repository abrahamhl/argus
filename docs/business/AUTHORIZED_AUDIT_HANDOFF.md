# ARGUS Geautoriseerde Diepte-Audit: Handoff Protocol & Mandaat

**Systeem:** ARGUS Autonomous Audit Plane  
**Bedrijf:** AUX Design (Arnhem, Nederland)  
**Versie:** 1.0 (September 2026)  

---

## 🛑 Het Strikte Veiligheids- & Legaliteitsslot (The Boundary Gate)

ARGUS opereert standaard in **PUBLIC LEAD MODE**. In deze modus worden uitsluitend niet-invasieve, openbaar waarneembare gegevens verzameld via standaard HTTP GET/HEAD-verzoeken en passieve DNS-opvragingen.

Invasieve technische handelingen (zoals authenticatietests, poortscans, kwetsbaarhedenscans van backend-systemen, formulierinjecties of fuzzing) zijn **TECHNISCH GEBLOKKEERD** door de ARGUS Policy Gate totdat er een geverifieerd, ondertekend digitaal mandaat aanwezig is.

```
+-----------------------------------------------------------+
|                  1. PUBLIC LEAD MODE                      |
| (Passieve DNS, publieke headers, certificaten, robots.txt)|
+-----------------------------------------------------------+
                              │
                              ▼
+-----------------------------------------------------------+
|                 2. ZAKELIJK GESPREK                       |
|   (Debbie & Abraham presenteren QuickScan aan directie)   |
+-----------------------------------------------------------+
                              │
                              ▼
+-----------------------------------------------------------+
|          3. SCHRIFTELIJKE OPDRACHTOVEREENKOMST            |
|    (Ondertekend mandaat met vastomlijnde scope & tijd)    |
+-----------------------------------------------------------+
                              │
                              ▼
+-----------------------------------------------------------+
|           4. AUTHORIZED AUDIT MODE GEACTIVEERD            |
| (Cryptografisch token in .argus/authorization.json geladen)|
+-----------------------------------------------------------+
```

---

## 📜 Metadata Structuur van het Mandaat (`authorization.json`)

Wanneer een klant opdracht geeft voor een diepte-audit, wordt onderstaand bestand gegenereerd en digitaal ondertekend:

```json
{
  "$schema": "https://argus.auxdesign.nl/schemas/authorization-v1.json",
  "authorizationId": "auth-arnhem-2026-09-001",
  "client": {
    "legalName": "Bedrijfsnaam B.V.",
    "kvkNumber": "12345678",
    "authorizedSigner": "Voornaam Achternaam",
    "signerRole": "Directeur / Eigenaar",
    "contactEmail": "directie@domein.nl",
    "contactPhone": "+31 26 000 0000"
  },
  "scope": {
    "targetDomains": [
      "domein.nl",
      "portal.domein.nl"
    ],
    "targetIps": [
      "185.0.0.1"
    ],
    "excludedEndpoints": [
      "/afrekenen",
      "/api/payment-webhook",
      "/admin/database-reset"
    ]
  },
  "timeframe": {
    "startTime": "2026-09-28T09:00:00+02:00",
    "endTime": "2026-09-30T18:00:00+02:00",
    "allowedHours": "09:00-18:00"
  },
  "permittedActions": [
    "RECONNAISSANCE_PASSIVE",
    "HTTP_SECURITY_HEADERS_ANALYSIS",
    "TLS_CIPHER_SUITE_AUDIT",
    "CMS_PLUGIN_VERSION_AUDIT",
    "API_SCHEMA_FUZZING_NON_DESTRUCTIVE",
    "AUTHENTICATED_ROLE_TESTING_STAGING"
  ],
  "prohibitedActions": [
    "DENIAL_OF_SERVICE_TESTING",
    "DATA_DELETION_OR_MODIFICATION",
    "CREDENTIAL_STUFFING_AGAINST_THIRD_PARTIES",
    "EXPLOITATION_OF_DISCOVERED_KEYS",
    "SOCIAL_ENGINEERING_OF_EMPLOYEES"
  ],
  "governance": {
    "auditor": "AUX Design (Arnhem)",
    "leadAuditor": "Abraham Haddioui",
    "proofOfAuthorization": {
      "agreementType": "DIGITALLY_SIGNED_PDF",
      "agreementHashSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "signedAt": "2026-09-28T08:30:00+02:00"
    }
  }
}
```

---

## 🔒 Beleidscontrole in ARGUS Core (`policy-gate.ts`)

De ARGUS engine bevat een automatische runtime-check:

```typescript
export function assertAuthorization(targetDomain: string, action: string, authFile?: Authorization): void {
  if (isPassiveAction(action)) {
    return; // Passieve openbare inspectie is altijd toegestaan
  }

  if (!authFile) {
    throw new SecurityException(
      `ARGUS POLICY GATE: Actie '${action}' tegen '${targetDomain}' is GEBLOKKEERD. Geen schriftelijk mandaat aanwezig.`
    );
  }

  const now = new Date();
  if (now < new Date(authFile.timeframe.startTime) || now > new Date(authFile.timeframe.endTime)) {
    throw new SecurityException(`ARGUS POLICY GATE: Mandaat is verlopen of nog niet actief.`);
  }

  if (!authFile.scope.targetDomains.includes(targetDomain)) {
    throw new SecurityException(`ARGUS POLICY GATE: Doeldomein valt buiten overeengekomen scope.`);
  }

  if (authFile.prohibitedActions.includes(action)) {
    throw new SecurityException(`ARGUS POLICY GATE: Actie staat expliciet op de lijst van verboden handelingen.`);
  }
}
```

---

## 📋 Vaste Mandaatclausule voor Klantovereenkomsten (Nederlands)

Onderstaande tekst wordt standaard opgenomen in elke offerte voor een diepte-audit:

> **Artikel: Mandaat Technische Beveiligingsaudit**  
> *"Opdrachtgever verleent AUX Design hierbij uitdrukkelijk en schriftelijk toestemming om binnen het overeengekomen tijdvak en op de gespecificeerde domeinen een technische beveiligingsaudit uit te voeren.  
> AUX Design verplicht zich om uitsluitend niet-destructieve onderzoeksmethoden te hanteren. Indien tijdens het onderzoek kwetsbaarheden worden geconstateerd die onmiddellijk gevaar opleveren voor persoonsgegevens of bedrijfsvoering, staakt AUX Design de specifieke test en treedt onmiddellijk in overleg met de contactpersoon van Opdrachtgever.  
> Bevoegdheden en onderzoeksresultaten worden strikt vertrouwelijk behandeld en nooit met derden gedeeld zonder voorafgaande schriftelijke toestemming."*
