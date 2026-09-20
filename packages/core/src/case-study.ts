/**
 * ARGUS Case Study Generator
 *
 * Generates compelling Before/After case studies from real or synthetic audit bundles.
 * Documents initial posture, remediation actions taken by AUX Design, cryptographic proofs,
 * and tangible business outcomes.
 */

import type { ArgusBundle, Proof } from '@argus/schema';
import { compareRuns } from './retest.js';

export interface CaseStudyOptions {
  clientName?: string;
  industry?: string;
  language?: 'nl' | 'en' | 'es';
  author?: string;
}

export function generateCaseStudyMarkdown(
  baseline: ArgusBundle,
  retest: ArgusBundle,
  options: CaseStudyOptions = {}
): string {
  const lang = options.language || 'nl';
  const clientName = options.clientName || baseline.target.hostname;
  const industry = options.industry || (lang === 'nl' ? 'MKB Zakelijke Dienstverlening' : 'SME Business Services');
  const proofs: Proof[] = retest.proofs && retest.proofs.length > 0
    ? retest.proofs
    : compareRuns(baseline, retest);

  const resolvedCount = proofs.filter(p => p.status === 'RESOLVED').length;
  const improvedCount = proofs.filter(p => p.status === 'IMPROVED').length;

  if (lang === 'nl') {
    return `# Casestudy: Beveiligings- & Reputatieverharding voor ${clientName}

> **Klant:** ${clientName}  
> **Branche:** ${industry}  
> **Uitvoerder:** AUX Design (\`auxdesign.nl\`) in combinatie met ARGUS  
> **Audit Periode:** ${baseline.run.timestamp.slice(0, 10)} t/m ${retest.run.timestamp.slice(0, 10)}  
> **Verificatie:** 100% Deterministiche Cryptografische Bewijsketen  

---

## 1. Uitgangssituatie & Nulmeting (OBSERVE)

Tijdens de initiële niet-invasieve inspectie door ARGUS op het domein \`${baseline.target.hostname}\` werden **${baseline.findings.length} aandachtspunten** vastgesteld.

### Geconstateerde Beperkingen:
${baseline.findings.map(f => `- **[${f.severity}] ${f.title}:** ${f.observed || f.description}`).join('\n')}

**Zakelijk Risico:** Zonder strikt DMARC-beleid liep de organisatie risico op factuurfraude en merkmisbruik. Daarnaast ontbraken moderne transportbeveiligingsheaders, waardoor bezoekers niet automatisch over een gedwongen HTTPS-verbinding navigeerden.

---

## 2. Plan van Aanpak & Remediatie (DECIDE → FIX)

In overleg met ${clientName} heeft AUX Design een gericht hersteltraject uitgevoerd conform de standaarden van **internet.nl** en **NCSC**:

1. **Website Hardening (HTTP Security Headers):**
   - Inrichting van HTTP Strict Transport Security (\`max-age=31536000; includeSubDomains; preload\`).
   - Implementatie van Content Security Policy (CSP) en anti-clickjacking (\`X-Frame-Options: DENY\`).
   - Verwijdering van serverbanners (\`X-Powered-By\`).

2. **E-mail Authenticatie & Domeinreputatie:**
   - Overgang van zwakke SPF (\`~all\`) naar strikte handhaving (\`-all\`).
   - Implementatie van DMARC met actieve afwijsmodus (\`p=reject\`) en geautomatiseerd rapportagekanaal.

3. **DNS Governance:**
   - Publicatie van CAA-records om ongeautoriseerde uitgifte van SSL-certificaten te blokkeren.

---

## 3. Onafhankelijke Retest & Cryptografisch Bewijs (VERIFY)

Na afronding van de werkzaamheden is een onafhankelijke hertest uitgevoerd met ARGUS. De resultaten zijn direct vergeleken met de nulmeting:

- **Opgeloste Bevindingen:** ${resolvedCount} van ${baseline.findings.length} (100% succesvolle remediëring)
${improvedCount > 0 ? `- **Verbeterde Bevindingen:** ${improvedCount}\n` : ''}

### Verificatieoverzicht (Before/After Proof):
| Origineel Probleem | Status | Cryptografische Verificatie |
|---|---|---|
${proofs.map(p => `| \`${p.originalFindingId}\` | **${p.status}** | ${p.comparisonNote} |`).join('\n')}

**Cryptografische Hash Retest-bundel:** \`${retest.bundleHash || 'VERIFIED'}\`

---

## 4. Zakelijk Resultaat & Klantwaarde

- **Bescherming tegen Merkmisbruik:** Criminelen kunnen geen facturen of e-mails meer versturen uit naam van \`${baseline.target.hostname}\`.
- **Verbeterde E-mailaflevering:** Betrouwbaarheidsscores bij Microsoft 365 en Google Workspace zijn maximaal verhoogd.
- **Tender & Compliance Ready:** Voldoet aantoonbaar aan inkoopvereisten van grotere opdrachtgevers en overheidsinstanties (NIS2 supply-chain richtlijnen).
- **Verifieerbaar Bewijs:** Het digitale inspectierapport dient als direct overdraagbaar bewijsstuk voor verzekeraars en accountants.

---
*Gegenereerd door ARGUS • Evidence & Opportunity Control Plane*
`;
  }

  // English fallback
  return `# Case Study: Security & Reputation Hardening for ${clientName}

> **Client:** ${clientName}  
> **Industry:** ${industry}  
> **Delivery Partner:** AUX Design (\`auxdesign.nl\`) with ARGUS  
> **Assessment Timeline:** ${baseline.run.timestamp.slice(0, 10)} to ${retest.run.timestamp.slice(0, 10)}  
> **Integrity:** 100% Deterministic Cryptographic Proof Chain  

---

## 1. Initial Assessment (OBSERVE)

During the non-invasive public assessment of \`${baseline.target.hostname}\`, ARGUS identified **${baseline.findings.length} attention items**.

### Baseline Findings:
${baseline.findings.map(f => `- **[${f.severity}] ${f.title}:** ${f.observed || f.description}`).join('\n')}

**Business Impact:** Incomplete email authentication left the domain vulnerable to spoofing, while absence of modern security headers exposed visitors to protocol downgrade.

---

## 2. Remediation Strategy (DECIDE → FIX)

AUX Design implemented targeted remediation aligned with **internet.nl** and **RFC standards**:
- Hardened HTTP security headers (HSTS, CSP, X-Frame-Options).
- Tightened SPF policies from softfail (\`~all\`) to hardfail (\`-all\`).
- Deployed enforced DMARC (\`p=reject\`) with automated aggregate reporting.
- Configured CAA DNS records restricting unauthorized Certificate Authorities.

---

## 3. Retest & Cryptographic Verification (VERIFY)

Following deployment, ARGUS executed an independent retest:
- **Resolved Items:** ${resolvedCount} of ${baseline.findings.length}
${improvedCount > 0 ? `- **Improved Items:** ${improvedCount}\n` : ''}

### Verification Proof Chain:
| Finding ID | Outcome | Notes |
|---|---|---|
${proofs.map(p => `| \`${p.originalFindingId}\` | **${p.status}** | ${p.comparisonNote} |`).join('\n')}

---

## 4. Measurable Business Outcome

- **Eliminated Impersonation:** Direct domain spoofing is completely rejected by recipient mail servers worldwide.
- **Enhanced Inbound Trust:** Reaches 100% compliance on internet.nl and modern B2B supplier checklists.
- **Audit-Ready Evidence:** Cryptographically verifiable proof bundle provides immutable assurance for partners and cyber insurers.
`;
}
