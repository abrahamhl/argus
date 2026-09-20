# ARGUS Commercial ROI Backlog & AUX Design Playbook

> **Operational Motto:** OBSERVE → PROVE → DECIDE → FIX → VERIFY  
> **Commercial Vehicle:** AUX Design (`auxdesign.nl`)  
> **Primary Target Market:** Dutch Small and Medium Enterprises (MKB / MKB-Plus)  
> **Version:** 1.0.0 (September 2026)

---

## 1. Executive Commercial Thesis

Traditional cybersecurity sales to Dutch SMEs consistently fail because of two anti-patterns:
1. **Fear-Mongering (FUD):** Shouting about theoretical 20M EUR GDPR/AVG fines, catastrophic ransomware doom, or inflated CVSS 9.8 scores for missing HTTP headers creates distrust and decision paralysis.
2. **Inactionable PDF Audits:** Delivering 80-page scanner outputs with generic checklists leaves SME owners with no clear path to fix the issues, no price transparency, and no verification that the work was done correctly.

### The ARGUS + AUX Design Model: "Proof-as-a-Service"

ARGUS bridges **deterministic technical evidence** and **understandable commercial remediation**:
- **Non-invasive & 100% Legal:** Scans only publicly observable internet standards (DNS, TLS, HTTP) under a strict `PUBLIC_POSTURE` scope with zero network exploitation or secret-hunting.
- **Fixed-Scope AUX Design Deliverables:** Every finding maps directly to a pre-scoped engineering service with transparent hourly estimates and flat-fee EUR pricing.
- **Cryptographic Retest Verification:** The client receives a Before/After Proof report proving that the issue was resolved (or improved) with verifiable SHA-256 hashes.

---

## 2. Regulatory & Market Drivers in the Netherlands

| Driver | Scope & Target Audience | Business Impact for Dutch SMEs | ARGUS Alignment |
|---|---|---|---|
| **NIS2 Directive (Wbni / Cyberbeveiligingswet)** | Essential & Important entities, plus direct suppliers (IT, marketing, logistics). | Large buyers and government agencies require their supply chain to demonstrate basic cyber hygiene. | Verifies TLS 1.3, strict email authentication, and DNS hygiene without intrusive penetration tests. |
| **internet.nl Standards (NCSC / Forum Standaardisatie)** | Standard benchmark for Dutch government, healthcare, and enterprise tenders. | Scoring 100% on internet.nl is increasingly mandatory in public tenders (Aanbestedingen). | Rules directly verify modern HSTS, CSP, SPF, DMARC, DNSSEC, and CAA. |
| **AVG / GDPR (Art. 32 Beveiliging van de verwerking)** | All entities processing customer or employee personal data. | Duty of care to encrypt data in transit and prevent eavesdropping / credential harvesting. | Enforces HTTPS redirection, HSTS preloading, and TLS modern cipher suites. |
| **CEO & Invoice Fraud Prevention** | Financial controllers, SMEs sending invoices via email. | Unenforced DMARC (`p=none`) allows attackers to send spoofed invoices in the company's name. | Identifies weak SPF (`~all`) and `p=none`, providing immediate conversion to `p=reject`. |

---

## 3. AUX Design Service Catalog & Pricing Matrix

All pricing is pre-calculated, transparent, and non-negotiable in initial quotes, allowing rapid commercial conversion:

```
+----------------------------------------------------------------------------------------------------+
| SERVICE PACKAGE              | PRIMARY RULES TRIGGERED              | EST. EFFORT | PRICING (EX. BTW) |
+----------------------------------------------------------------------------------------------------+
| AUX-SEC-WEB-HARDENING        | rule-http-missing-hsts               | 2 - 4 hrs   | € 350,-           |
|                              | rule-http-missing-csp                |             |                   |
|                              | rule-http-missing-x-content-type     |             |                   |
|                              | rule-http-missing-referrer-policy    |             |                   |
|                              | rule-http-missing-frame-protection   |             |                   |
+----------------------------------------------------------------------------------------------------+
| AUX-SEC-EMAIL-TRUST          | rule-dns-missing-spf                 | 3 - 6 hrs   | € 495,-           |
|                              | rule-dns-weak-spf                    |             |                   |
|                              | rule-dns-missing-dmarc               |             |                   |
|                              | rule-dns-dmarc-p-none                |             |                   |
+----------------------------------------------------------------------------------------------------+
| AUX-SEC-DNS-GOVERNANCE       | rule-dns-missing-caa                 | 1 - 2 hrs   | € 195,-           |
+----------------------------------------------------------------------------------------------------+
| AUX-SEC-SECURITY-TXT         | rule-missing-security-txt            | 1 hr        | € 150,-           |
+----------------------------------------------------------------------------------------------------+
| AUX-SEC-TLS-MODERNIZATION    | rule-tls-expiring                    | 2 - 3 hrs   | € 295,-           |
|                              | rule-tls-legacy-protocol             |             |                   |
+----------------------------------------------------------------------------------------------------+
| AUX-SEC-TOTAL-GUARD          | Complete baseline bundle             | 8 - 12 hrs  | € 1.195,- (Save   |
| (Comprehensive Fix & Retest) |                                      |             |   € 290,-)        |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. Remediation Engineering Playbook

### 4.1 AUX-SEC-WEB-HARDENING (€ 350,-)
* **Target Platforms:** Nginx, Apache, Caddy, Cloudflare, WordPress, Next.js.
* **Engineering Steps:**
  1. Add HTTP Strict Transport Security with preload:
     ```nginx
     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
     ```
  2. Implement Content Security Policy with baseline strictness:
     ```nginx
     add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors 'none';" always;
     ```
  3. Deploy anti-sniff and modern referrer isolation:
     ```nginx
     add_header X-Content-Type-Options "nosniff" always;
     add_header Referrer-Policy "strict-origin-when-cross-origin" always;
     add_header X-Frame-Options "DENY" always;
     ```
  4. Strip informational server disclosure headers (`Server`, `X-Powered-By`).
  5. Run `argus retest` and export Before/After proof.

### 4.2 AUX-SEC-EMAIL-TRUST (€ 495,-)
* **Target Platforms:** Microsoft 365, Google Workspace, TransIP, Antagonist, Hostnet, Vimexx.
* **Engineering Steps:**
  1. Audit current sending IPs and SaaS services (Mailchimp, Exact Online, ActiveCampaign, Zendesk).
  2. Tighten SPF from `~all` (softfail) to `-all` (hardfail):
     ```dns
     example.nl. IN TXT "v=spf1 include:spf.protection.outlook.com include:_spf.mailchimp.com -all"
     ```
  3. Deploy DMARC with reporting mailbox and gradual rollout:
     - Phase 1 (Monitoring): `v=DMARC1; p=none; rua=mailto:dmarc@auxdesign.nl; ruf=mailto:dmarc@auxdesign.nl; fo=1`
     - Phase 2 (Enforcement): `v=DMARC1; p=reject; rua=mailto:dmarc@auxdesign.nl; pct=100; sp=reject; adkim=s; aspf=s`
  4. Verify DKIM key rotation and selector DNS propagation.
  5. Run `argus retest` and provide DNS Before/After verification proof.

### 4.3 AUX-SEC-DNS-GOVERNANCE (€ 195,-)
* **Engineering Steps:**
  1. Determine active Certificate Authorities (e.g. Let’s Encrypt, Cloudflare, DigiCert).
  2. Add CAA DNS records:
     ```dns
     example.nl. IN CAA 0 issue "letsencrypt.org"
     example.nl. IN CAA 0 issue "pki.goog"
     example.nl. IN CAA 0 iodef "mailto:security@example.nl"
     ```
  3. Run `argus retest` to verify CAA presence.

---

## 5. Sales Conversion Workflow (Abraham / AUX Design)

```
[1. PASSIVE AUDIT] 
  Operator runs `argus assess <domain>` (100% passive, 0 network exploitation)
       │
       ▼
[2. DUTCH CLIENT REPORT] 
  ARGUS auto-generates `.argus_data/runs/<id>/report-client.html`
  - Highlighting what is already well-configured (positive reinforcement)
  - Clear identification of 2-3 high-impact commercial opportunities
  - Exact quote in EUR based on AUX Service Catalog
       │
       ▼
[3. INTRODUCTORY OUTREACH (NO FEAR)]
  Send personalized email to Managing Director / IT Lead:
  "Beste [Naam], we hebben een niet-invasieve analyse van [Bedrijfsnaam] uitgevoerd 
   aan de hand van internet.nl standaarden. We zagen dat uw website al uitstekend 
   gebruik maakt van [positieve waarneming], maar dat uw e-maildomein nog open staat 
   voor spoofing. In de bijlage vindt u ons overzicht met een concrete oplossing."
       │
       ▼
[4. PROJECT SIGN-OFF & EXECUTION]
  Client accepts pre-scoped service (€350 - €1.195).
  AUX Design implements DNS/HTTP changes within 48 hours.
       │
       ▼
[5. RETEST & CRYPTOGRAPHIC PROOF]
  Operator runs `argus retest <baseline_bundle> <url>`
  - ARGUS verifies all findings are RESOLVED.
  - Generates signed Before/After proof.
  - Client receives clean bill of health for their insurer / tenders.
```

---

## 6. Target Conversion Metrics & Projections

* **Cold Conversion Rate:** 8%–12% (3x higher than generic security outreach due to positive feedback + price transparency).
* **Average Project Value:** € 640,- (typically web hardening + email trust combined).
* **Delivery Time per Project:** 4 to 6 engineering hours.
* **Gross Margin:** ~75%–82%.
* **Upsell Potential:** Annual recurring retest subscription (€ 49,- / month or € 495,- / year) providing automated monthly posture audits.
